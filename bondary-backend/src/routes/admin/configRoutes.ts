import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import { loginConfigService } from '../../services/loginConfigService';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// =============================================
// Branding Configuration
// =============================================

/**
 * GET /api/v1/admin/config/branding
 * Get branding configuration for the admin panel
 */
router.get('/branding', async (req: Request, res: Response) => {
  try {
    let branding: any = {};

    // 1. Try global app_settings first (using the first active application)
    const activeApplication = await prisma.application.findFirst({
      where: { isActive: true },
      select: { id: true }
    });

    let appSetting = null;
    if (activeApplication) {
      appSetting = await prisma.appSetting.findUnique({
        where: {
          applicationId_key: {
            applicationId: activeApplication.id,
            key: 'branding'
          }
        },
        select: {
          value: true
        }
      });
    }

    if (appSetting && appSetting.value) {
      const val = appSetting.value;
      branding = typeof val === 'string' ? JSON.parse(val as string) : val;
    }

    // 2. Fallback to active Application if no branding found
    if (!branding || Object.keys(branding).length === 0) {
      const application = await prisma.application.findFirst({
        where: {
          isActive: true
        },
        select: {
          branding: true
        }
      });

      if (application && application.branding) {
        let appBranding = application.branding;
        if (typeof appBranding === 'string') {
          try { appBranding = JSON.parse(appBranding) } catch (e) { }
        }
        branding = appBranding;
      }
    }

    return res.json({ branding });
  } catch (error) {
    console.warn('[admin/config/branding] Failed to fetch branding:', error);
    return res.json({ branding: {} });
  }
});

/**
 * PUT /api/v1/admin/config/branding
 * Update branding configuration
 */
router.put('/branding', requirePermission('branding', 'update'), async (req: Request, res: Response) => {
  try {
    const { branding } = req.body;

    if (!branding || typeof branding !== 'object') {
      return res.status(400).json({ error: 'Invalid branding data' });
    }

    // Update global app_settings (using the first active application)
    const activeApplication = await prisma.application.findFirst({
      where: { isActive: true },
      select: { id: true }
    });

    if (!activeApplication) {
      return res.status(400).json({ error: 'No active application found' });
    }

    await prisma.appSetting.upsert({
      where: {
        applicationId_key: {
          applicationId: activeApplication.id,
          key: 'branding'
        }
      },
      update: {
        value: branding as any
      },
      create: {
        applicationId: activeApplication.id,
        key: 'branding',
        value: branding as any
      }
    });

    return res.json({ 
      message: 'Branding updated successfully',
      branding 
    });
  } catch (error) {
    console.error('[admin/config/branding] Failed to update branding:', error);
    return res.status(500).json({ error: 'Failed to update branding' });
  }
});

// =============================================
// SSO Providers Configuration
// =============================================

/**
 * GET /api/v1/admin/sso-providers
 * Get SSO/OAuth providers configuration
 */
router.get('/sso-providers', requirePermission('sso', 'view'), async (req: Request, res: Response) => {
  try {
    // Get OAuth clients from the database
    const clients = await prisma.$queryRaw<Array<{
      id: string;
      client_id: string;
      name: string;
      client_type: string;
      redirect_uris: string[];
      grant_types: string[];
      allowed_scopes: string[];
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>>`
      SELECT 
        id,
        client_id,
        name,
        client_type,
        redirect_uris,
        grant_types,
        allowed_scopes,
        is_active,
        created_at,
        updated_at
      FROM oauth_clients
      ORDER BY created_at DESC
    `;

    return res.json({ providers: clients });
  } catch (error) {
    console.error('[admin/sso-providers] Failed to fetch SSO providers:', error);
    return res.status(500).json({ error: 'Failed to fetch SSO providers' });
  }
});

/**
 * POST /api/v1/admin/sso-providers
 * Create new SSO provider
 */
router.post('/sso-providers', requirePermission('sso', 'create'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      redirect_uris,
      client_type = 'confidential',
      grant_types = ['authorization_code'],
      allowed_scopes = ['openid', 'profile'],
      require_pkce = true,
      require_consent = true,
      first_party = false,
      logo_url,
      homepage_url,
      description
    } = req.body;

    if (!name || !redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      return res.status(400).json({ error: 'Name and at least one redirect URI are required' });
    }

    // Generate client ID and secret
    const client_id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const client_secret = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

    // Insert new OAuth client
    const result = await prisma.$queryRaw`
      INSERT INTO oauth_clients (
        client_id,
        client_secret,
        name,
        client_type,
        redirect_uris,
        grant_types,
        allowed_scopes,
        require_pkce,
        require_consent,
        first_party,
        logo_url,
        homepage_url,
        description,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${client_id},
        ${client_secret},
        ${name},
        ${client_type},
        ${JSON.stringify(redirect_uris)},
        ${JSON.stringify(grant_types)},
        ${JSON.stringify(allowed_scopes)},
        ${require_pkce},
        ${require_consent},
        ${first_party},
        ${logo_url || null},
        ${homepage_url || null},
        ${description || null},
        true,
        NOW(),
        NOW()
      )
      RETURNING id, client_id, name, client_type, is_active, created_at
    `;

    const client = (result as any[])[0];

    return res.status(201).json({
      client: {
        ...client,
        client_secret, // Only return secret on creation
        redirect_uris,
        grant_types,
        allowed_scopes
      }
    });
  } catch (error) {
    console.error('[admin/sso-providers] Failed to create SSO provider:', error);
    return res.status(500).json({ error: 'Failed to create SSO provider' });
  }
});

/**
 * PUT /api/v1/admin/sso-providers/:id
 * Update SSO provider
 */
router.put('/sso-providers/:id', requirePermission('sso', 'update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      redirect_uris,
      grant_types,
      allowed_scopes,
      require_pkce,
      require_consent,
      first_party,
      logo_url,
      homepage_url,
      description,
      is_active
    } = req.body;

    // Check if provider exists
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM oauth_clients WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return res.status(404).json({ error: 'SSO provider not found' });
    }

    // Update provider
    const result = await prisma.$queryRaw`
      UPDATE oauth_clients SET
        name = COALESCE(${name}, name),
        redirect_uris = COALESCE(${JSON.stringify(redirect_uris)}, redirect_uris),
        grant_types = COALESCE(${JSON.stringify(grant_types)}, grant_types),
        allowed_scopes = COALESCE(${JSON.stringify(allowed_scopes)}, allowed_scopes),
        require_pkce = COALESCE(${require_pkce}, require_pkce),
        require_consent = COALESCE(${require_consent}, require_consent),
        first_party = COALESCE(${first_party}, first_party),
        logo_url = COALESCE(${logo_url}, logo_url),
        homepage_url = COALESCE(${homepage_url}, homepage_url),
        description = COALESCE(${description}, description),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, client_id, name, client_type, is_active, updated_at
    `;

    const client = (result as any[])[0];

    return res.json({
      client: {
        ...client,
        redirect_uris,
        grant_types,
        allowed_scopes
      }
    });
  } catch (error) {
    console.error('[admin/sso-providers] Failed to update SSO provider:', error);
    return res.status(500).json({ error: 'Failed to update SSO provider' });
  }
});

/**
 * DELETE /api/v1/admin/sso-providers/:id
 * Delete SSO provider
 */
router.delete('/sso-providers/:id', requirePermission('sso', 'delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if provider exists
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM oauth_clients WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return res.status(404).json({ error: 'SSO provider not found' });
    }

    // Delete provider (soft delete by setting is_active to false)
    await prisma.$queryRaw`
      UPDATE oauth_clients SET is_active = false, updated_at = NOW() WHERE id = ${id}
    `;

    return res.json({ message: 'SSO provider deleted successfully' });
  } catch (error) {
    console.error('[admin/sso-providers] Failed to delete SSO provider:', error);
    return res.status(500).json({ error: 'Failed to delete SSO provider' });
  }
});

// =============================================
// Applications Management
// =============================================

/**
 * GET /api/v1/admin/applications
 * Get all applications for admin management
 */
router.get('/applications', requirePermission('applications', 'view'), async (req: Request, res: Response) => {
  try {
    const applications = await prisma.application.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            appSettings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.json({ applications });
  } catch (error) {
    console.error('[admin/applications] Failed to fetch applications:', error);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * POST /api/v1/admin/applications
 * Create new application
 */
router.post('/applications', requirePermission('applications', 'create'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      description,
      logoUrl,
      branding,
      settings
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    // Check if slug already exists
    const existing = await prisma.application.findUnique({
      where: { slug }
    });

    if (existing) {
      return res.status(400).json({ error: 'Application with this slug already exists' });
    }

    const application = await prisma.application.create({
      data: {
        name,
        slug,
        description,
        logoUrl,
        branding: branding || {},
        settings: settings || {},
        isActive: true
      }
    });

    return res.status(201).json({ application });
  } catch (error) {
    console.error('[admin/applications] Failed to create application:', error);
    return res.status(500).json({ error: 'Failed to create application' });
  }
});

/**
 * PUT /api/v1/admin/applications/:id
 * Update application
 */
router.put('/applications/:id', requirePermission('applications', 'update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      logoUrl,
      branding,
      settings,
      isActive
    } = req.body;

    // Check if application exists
    const existing = await prisma.application.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if new slug conflicts with another application
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.application.findUnique({
        where: { slug }
      });

      if (slugConflict) {
        return res.status(400).json({ error: 'Application with this slug already exists' });
      }
    }

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(branding !== undefined && { branding }),
        ...(settings !== undefined && { settings }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return res.json({ application });
  } catch (error) {
    console.error('[admin/applications] Failed to update application:', error);
    return res.status(500).json({ error: 'Failed to update application' });
  }
});

/**
 * DELETE /api/v1/admin/applications/:id
 * Delete application (soft delete by setting isActive to false)
 */
router.delete('/applications/:id', requirePermission('applications', 'delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if application exists
    const existing = await prisma.application.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Soft delete by setting isActive to false
    await prisma.application.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('[admin/applications] Failed to delete application:', error);
    return res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
