import { Router } from 'express'
import { prisma } from '../../lib/prisma'
import path from 'path'
import fs from 'fs'
import collectionsRouter from './collectionsRoutes'

const router = Router()

// Mount collections routes for dynamic data
router.use('/collections', collectionsRouter)

// Naive scanner: read mobile navigator and extract screen names
router.get('/routes', async (req, res) => {
  try {
    const repoRoot = path.resolve(__dirname, '../../..')
    const navigatorPath = path.join(repoRoot, 'mobile', 'src', 'navigation', 'MainTabNavigator.tsx')
    if (!fs.existsSync(navigatorPath)) {
        return res.json({ routes: [] });
    }
    const content = fs.readFileSync(navigatorPath, 'utf8')

    const routeNames = new Set<string>()
    const screenRegex = /name\s*=\s*"([A-Za-z0-9_\-]+)"/g
    let match
    while ((match = screenRegex.exec(content)) !== null) {
      routeNames.add(match[1])
    }

    res.json({ routes: Array.from(routeNames).sort() })
  } catch (error: any) {
    res.status(500).json({ error: 'FAILED_TO_SCAN', message: error?.message || 'Unknown error' })
  }
})

// Branding for mobile
router.get('/branding', async (req, res) => {
  try {
    let branding: any = {};

    // 1. Try global app_settings first (Fastest)
    const settingsRows = await prisma.$queryRaw<any[]>`
      SELECT value FROM public.app_settings WHERE key = 'branding' LIMIT 1
    `;

    if (settingsRows.length > 0 && settingsRows[0].value) {
      const val = settingsRows[0].value;
      branding = typeof val === 'string' ? JSON.parse(val) : val;
    }

    // 2. If no screens found in global settings, Fallback to active Application (Source of Truth)
    // This handles cases where Admin saved to 'applications' table but sync to 'app_settings' failed or lagged
    if (!branding.screens || branding.screens.length === 0) {
      console.log('[mobileRoutes] Global branding missing screens. Falling back to active application...');
      const appRows = await prisma.$queryRaw<any[]>`
        SELECT branding FROM core.applications WHERE is_active = true LIMIT 1
      `;

      if (appRows.length > 0 && appRows[0].branding) {
        let appBranding = appRows[0].branding;
        if (typeof appBranding === 'string') {
          try { appBranding = JSON.parse(appBranding) } catch (e) { }
        }
        // Merge or overwrite
        branding = { ...branding, ...appBranding };
      }
    }

    // 3. Return what we found (sanitized for mobile)
    return res.json({
      branding: {
        mobileAppName: branding.mobileAppName,
        iconUrl: branding.iconUrl,
        logoUrl: branding.logoUrl,
        analytics: branding.analytics || {},
        legal: branding.legal || {},
        screens: branding.screens || [],
        categories: branding.categories || [],
        flows: branding.flows || {}
      }
    })

  } catch (error) {
    console.warn('[mobileRoutes] Database branding fetch failed:', error);
  }

  // Fallback to local file used by settings route
  try {
    const p = path.join(process.cwd(), 'uploads', 'settings', 'branding.json')
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8')
      const branding = JSON.parse(raw)
      return res.json({
        branding: {
          mobileAppName: branding.mobileAppName,
          iconUrl: branding.iconUrl,
          logoUrl: branding.logoUrl,
          analytics: branding.analytics || {},
          legal: branding.legal || {},
          screens: branding.screens || [],
          categories: branding.categories || [],
          flows: branding.flows || {}
        }
      })
    }
  } catch {}

  return res.json({ branding: {} })
})

// Helper to extract screens from mobile codebase
async function extractMobileScreens(): Promise<Set<string>> {
  const screens = new Set<string>();
  try {
    const repoRoot = path.resolve(__dirname, '../../..');
    const navigationDir = path.join(repoRoot, 'mobile', 'src', 'navigation');
    
    if (!fs.existsSync(navigationDir)) return screens;

    const files = fs.readdirSync(navigationDir).filter(f => f.endsWith('.tsx'));
    const screenRegex = /name\s*=\s*["']([A-Za-z0-9_\-]+)["']/g;

    for (const file of files) {
      const content = fs.readFileSync(path.join(navigationDir, file), 'utf8');
      let match;
      while ((match = screenRegex.exec(content)) !== null) {
        const screenName = match[1];
        if (!['App', 'Auth', 'Loading', 'MainTab'].includes(screenName)) {
          screens.add(screenName);
        }
      }
    }
  } catch (e) {
    console.error('[mobileRoutes] Extraction failed:', e);
  }
  return screens;
}

// Seed inventory for all active applications
router.post('/inventory/seed', async (req, res) => {
  try {
    const { appId } = req.body;
    const extractedScreens = await extractMobileScreens();
    
    // Add core screens that might not be detected by regex but are essential
    ['marketing', 'getstart', 'welcome', 'login', 'signup', 'home', 'personal', 'circle', 'social', 'apps', 'settings', 'profile', 'chat', 'twofactor-method', 'twofactor-verify', 'search-drawer', 'pin-setup', 'pin-unlock'].forEach(id => extractedScreens.add(id));

    let apps;
    if (appId) {
      apps = await prisma.$queryRaw<any[]>`
        SELECT id, name, branding FROM core.applications WHERE is_active = true AND id = ${appId}::uuid
      `;
    } else {
      apps = await prisma.$queryRaw<any[]>`
        SELECT id, name, branding FROM core.applications WHERE is_active = true
      `;
    }
    let updatedAppsCount = 0;
    let totalAddedCount = 0;

    for (const app of apps) {
      let branding = app.branding || {};
      if (typeof branding === 'string') branding = JSON.parse(branding);
      
      // Initialize or sanitize screens array
      let screens = branding.screens || [];
      
      // 1. Remove any existing duplicates in the database first
      const uniqueExisting = new Map();
      screens.forEach((s: any) => {
        if (s && s.id && !uniqueExisting.has(s.id.toLowerCase())) {
          uniqueExisting.set(s.id.toLowerCase(), s);
        }
      });
      
      let addedInThisApp = 0;
      const existingIdsLower = new Set(uniqueExisting.keys());

      // 2. Add only unique new screens (case-insensitive check)
      extractedScreens.forEach(screenId => {
        const idLower = screenId.toLowerCase();
        if (!existingIdsLower.has(idLower)) {
          const name = screenId
            .replace(/([A-Z])/g, ' $1')
            .replace(/[-_]/g, ' ')
            .trim()
            .replace(/^\w/, c => c.toUpperCase());

          uniqueExisting.set(idLower, {
            id: screenId,
            name: name,
            background: '',
            resizeMode: 'cover',
            type: 'screen',
            icon: 'document'
          });
          existingIdsLower.add(idLower);
          addedInThisApp++;
        }
      });

      if (addedInThisApp > 0 || uniqueExisting.size !== screens.length) {
        branding.screens = Array.from(uniqueExisting.values());
        await prisma.$executeRaw`
          UPDATE core.applications SET branding = ${JSON.stringify(branding)}::jsonb, updated_at = NOW() WHERE id = ${app.id}::uuid
        `;
        updatedAppsCount++;
        totalAddedCount += addedInThisApp;
      }
    }

    res.json({ 
      success: true, 
      message: `Seeded ${totalAddedCount} screens across ${updatedAppsCount} applications.`,
      applicationsUpdated: updatedAppsCount,
      screensAdded: totalAddedCount
    });
  } catch (error: any) {
    console.error('[mobileRoutes] Seed failed:', error);
    res.status(500).json({ error: 'SEED_FAILED', message: error?.message });
  }
})

export default router
