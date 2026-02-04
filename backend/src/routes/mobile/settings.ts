import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { authenticateToken } from '../../middleware/auth';
import { pool } from '../../config/database';
import storageService from '../../services/storageService';
import { exec } from 'child_process';

const router = Router();

type BrandingSettings = {
  adminAppName?: string;
  mobileAppName?: string;
  logoUrl?: string;
  iconUrl?: string;
  welcomeImage?: string;
  primaryFont?: string;
  secondaryFont?: string;
  updatedAt?: string;
  updatedBy?: string;
};

const SETTINGS_TABLE = 'app_settings';
const BRANDING_KEY = 'branding';
const INTEGRATIONS_KEY = 'integrations';

function getLocalSettingsPath(): string {
  const base = path.join(process.cwd(), 'uploads', 'settings');
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return path.join(base, 'branding.json');
}

async function readFromSupabaseBranding(): Promise<BrandingSettings | null> {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM ${SETTINGS_TABLE} WHERE key = $1 LIMIT 1`,
      [BRANDING_KEY]
    );
    if (rows.length === 0) return null;
    return (rows[0].value as BrandingSettings) || null;
  } catch (error) {
    console.error('[settings] Database read error (branding):', error);
    return null;
  }
}

async function writeToSupabaseBranding(value: BrandingSettings): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO ${SETTINGS_TABLE} (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [BRANDING_KEY, JSON.stringify(value)]
    );
    return true;
  } catch (error) {
    console.error('[settings] Database write error (branding):', error);
    return false;
  }
}

function readFromFile(): BrandingSettings | null {
  try {
    const p = getLocalSettingsPath();
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeToFile(value: BrandingSettings): boolean {
  try {
    const p = getLocalSettingsPath();
    fs.writeFileSync(p, JSON.stringify(value, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

router.get('/branding', async (req, res) => {
  // Try database first, fall back to file
  const fromDb = await readFromSupabaseBranding();
  if (fromDb) return res.json({ branding: fromDb });
  const fromFile = readFromFile();
  return res.json({ branding: fromFile || {} });
});

router.put('/branding', authenticateToken as any, async (req: any, res) => {
  const body = req.body as Partial<BrandingSettings>;
  const existing = (await readFromSupabaseBranding()) || readFromFile() || {};
  const updated: BrandingSettings = {
    ...existing,
    ...body,
    updatedAt: new Date().toISOString(),
    updatedBy: req.user?.id || 'system'
  };

  // Try to persist to database; fall back to file system
  const dbOk = await writeToSupabaseBranding(updated);
  const fsOk = dbOk ? true : writeToFile(updated);

  if (!dbOk && !fsOk) {
    return res.status(500).json({ error: 'FAILED_TO_SAVE' });
  }
  return res.json({ branding: updated });
});

// Integrations settings
type IntegrationsSettings = Record<string, any>;

async function readIntegrations(): Promise<IntegrationsSettings | null> {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM ${SETTINGS_TABLE} WHERE key = $1 LIMIT 1`,
      [INTEGRATIONS_KEY]
    );
    if (rows.length === 0) return null;
    return (rows[0].value as IntegrationsSettings) || null;
  } catch (error) {
    console.error('[settings] Database read error (integrations):', error);
    return null;
  }
}

async function writeIntegrations(value: IntegrationsSettings): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO ${SETTINGS_TABLE} (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [INTEGRATIONS_KEY, JSON.stringify(value)]
    );
    return true;
  } catch (error) {
    console.error('[settings] Database write error (integrations):', error);
    return false;
  }
}

function isAdmin(req: any): boolean {
  try {
    const role = (req as any).userRole || (req as any).user?.role || undefined
    return role === 'admin'
  } catch { return false }
}

router.get('/integrations', authenticateToken as any, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'FORBIDDEN' })
  const existing = await readIntegrations();
  return res.json({ integrations: existing || {} });
});

router.put('/integrations', authenticateToken as any, async (req: any, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'FORBIDDEN' })
  const body = (req.body || {}) as IntegrationsSettings;
  const merged = { ...(await readIntegrations()), ...body, updatedAt: new Date().toISOString(), updatedBy: req.user?.id || 'system' };
  const ok = await writeIntegrations(merged);
  if (!ok) return res.status(500).json({ error: 'FAILED_TO_SAVE' });
  return res.json({ integrations: merged });
});

// Upload branding logo
router.post(
  '/branding/logo',
  authenticateToken as any,
  storageService.getMulterConfig({
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    generateThumbnails: false,
    compressImages: true
  }).single('file'),
  async (req: any, res) => {
    try {
      const file = (req as any).file as Express.Multer.File
      if (!file) return res.status(400).json({ error: 'NO_FILE' })
      const uploaded = await storageService.uploadFile(file, req.user?.id || 'system')
      
      // Use proxy URL for persistence (fix S3 expiration)
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
      const userId = req.user?.id || 'system';
      const uploadPath = process.env.UPLOAD_PATH || 'uploads';
      const key = `${uploadPath}/${userId}/${(uploaded as any).file_name}`;
      const proxyUrl = `${baseUrl}/api/page-builder/assets/${key}`;

      return res.json({ url: proxyUrl })
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'UPLOAD_FAILED' })
    }
  }
)

// Trigger mobile branding asset generation (executes mobile script server-side)
router.post('/branding/generate-mobile-assets', authenticateToken as any, async (req: any, res) => {
  try {
    const repoRoot = path.resolve(__dirname, '../../..')
    const mobileDir = path.join(repoRoot, 'mobile')
    const cmd = process.platform === 'win32'
      ? `cd /d "${mobileDir}" && node ./scripts/branding-assets.js`
      : `cd "${mobileDir}" && node ./scripts/branding-assets.js`

    exec(cmd, { env: { ...process.env } }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: 'EXEC_FAILED', details: stderr?.toString() || error.message })
      }
      return res.json({ ok: true, output: stdout?.toString() })
    })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'UNKNOWN_ERROR' })
  }
})

// Upload branding icon
router.post(
  '/branding/icon',
  authenticateToken as any,
  storageService.getMulterConfig({
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    generateThumbnails: false,
    compressImages: true
  }).single('file'),
  async (req: any, res) => {
    try {
      const file = (req as any).file as Express.Multer.File
      if (!file) return res.status(400).json({ error: 'NO_FILE' })
      const uploaded = await storageService.uploadFile(file, req.user?.id || 'system')
      
      // Use proxy URL for persistence (fix S3 expiration)
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
      const userId = req.user?.id || 'system';
      const uploadPath = process.env.UPLOAD_PATH || 'uploads';
      const key = `${uploadPath}/${userId}/${(uploaded as any).file_name}`;
      const proxyUrl = `${baseUrl}/api/page-builder/assets/${key}`;
      
      return res.json({ url: proxyUrl })
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'UPLOAD_FAILED' })
    }
  }
)

// ============================================
// Component Styles - Stored in S3/MinIO + DB
// ============================================
const COMPONENT_STYLES_KEY = 'component_styles';
const COMPONENT_STYLES_S3_PATH = 'settings/component-styles.json';

// Type for component styles
type ComponentStyles = {
  branding?: BrandingSettings;
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    components: Array<{
      id: string;
      name: string;
      styles: {
        backgroundColor: string;
        textColor: string;
        borderRadius: number;
        borderColor: string;
        shadowLevel: 'none' | 'sm' | 'md' | 'lg';
      };
    }>;
  }>;
  updatedAt?: string;
  updatedBy?: string;
};

// Read component styles from Database
async function readComponentStylesFromDb(): Promise<ComponentStyles | null> {
  try {
    const { rows } = await pool.query(
      `SELECT value FROM ${SETTINGS_TABLE} WHERE key = $1 LIMIT 1`,
      [COMPONENT_STYLES_KEY]
    );
    if (rows.length === 0) return null;
    return (rows[0].value as ComponentStyles) || null;
  } catch (error) {
    console.error('[settings] Database read error (component styles):', error);
    return null;
  }
}

// Write component styles to Database
async function writeComponentStylesToDb(value: ComponentStyles): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO ${SETTINGS_TABLE} (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [COMPONENT_STYLES_KEY, JSON.stringify(value)]
    );
    return true;
  } catch (error) {
    console.error('[settings] Database write error (component styles):', error);
    return false;
  }
}

// Upload component styles JSON to S3/MinIO
async function uploadComponentStylesToS3(styles: ComponentStyles): Promise<string | null> {
  try {
    const jsonContent = JSON.stringify(styles, null, 2);
    const buffer = Buffer.from(jsonContent, 'utf8');
    
    // Upload to S3/MinIO using the raw buffer upload method
    const url = await storageService.uploadRawBuffer(
      buffer, 
      COMPONENT_STYLES_S3_PATH, 
      'application/json'
    );
    
    return url;
  } catch (e) {
    console.error('[settings] Failed to upload component styles to S3:', e);
    return null;
  }
}

// Download component styles from S3/MinIO
async function downloadComponentStylesFromS3(): Promise<ComponentStyles | null> {
  try {
    const content = await storageService.downloadFile(COMPONENT_STYLES_S3_PATH);
    if (!content) return null;
    return JSON.parse(content.toString('utf8')) as ComponentStyles;
  } catch (e) {
    console.log('[settings] Component styles not found in S3, will use DB or defaults');
    return null;
  }
}

// GET component styles
router.get('/component-styles', async (req, res) => {
  try {
    // 1. Fetch Component Styles (Try S3 first, then DB)
    let styles = await downloadComponentStylesFromS3();
    if (!styles) {
      styles = await readComponentStylesFromDb();
    }
    
    // Initialize if null
    if (!styles) {
        styles = { categories: [] };
    }

    // 2. Fetch standalone Branding Settings (Source of Truth for Backgrounds)
    const branding = await readFromSupabaseBranding();
    
    // 3. Merge Branding into Styles
    if (branding) {
        styles.branding = {
            ...styles.branding, // Keep existing fields if any
            ...branding, // Override with specific branding settings
        } as BrandingSettings;
    }

    return res.json({ componentStyles: styles });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'FAILED_TO_READ' });
  }
});

// PUT component styles
router.put('/component-styles', authenticateToken as any, async (req: any, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'FORBIDDEN' });
    
    const body = req.body?.componentStyles as ComponentStyles;
    if (!body || !body.categories) {
      return res.status(400).json({ error: 'INVALID_PAYLOAD' });
    }
    
    const updated: ComponentStyles = {
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?.id || 'system'
    };
    
    // Save to S3/MinIO first (primary storage)
    const s3Url = await uploadComponentStylesToS3(updated);
    
    // Also save to database (backup/metadata)
    const dbOk = await writeComponentStylesToDb(updated);
    
    if (!s3Url && !dbOk) {
      return res.status(500).json({ error: 'FAILED_TO_SAVE' });
    }
    
    return res.json({ 
      componentStyles: updated,
      savedTo: {
        s3: !!s3Url,
        database: dbOk
      }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'FAILED_TO_SAVE' });
  }
});

export default router;
