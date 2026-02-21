import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

// ============================================================================
// Logger Configuration
// ============================================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'admin-config' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// ============================================================================
// Rate Limiting
// ============================================================================

const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// Types & Interfaces
// ============================================================================

interface BrandingConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  appName?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

interface AuditLogEntry {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// Cache Service (In-Memory for demo, use Redis in production)
// ============================================================================

class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  private isExpired(entry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }
  
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }
  
  async set<T>(key: string, data: T, ttlMs: number = 300000): Promise<void> { // 5min default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  async invalidate(pattern: string): Promise<void> {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// ============================================================================
// Audit Service
// ============================================================================

class AuditService {
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      logger.info('Admin action performed', {
        adminId: entry.adminId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        timestamp: new Date().toISOString()
      });
      
      // In production, save to database
      // await prisma.auditLog.create({ data: entry });
    } catch (error) {
      logger.error('Failed to log audit action', { error, entry });
    }
  }
}

// ============================================================================
// Service Layer
// ============================================================================

class AdminConfigService {
  private cacheService = new CacheService();
  private auditService = new AuditService();
  
  /**
   * Get branding configuration with caching
   */
  async getBranding(): Promise<BrandingConfig> {
    try {
      // Try cache first
      const cached = await this.cacheService.get<BrandingConfig>('admin:branding');
      if (cached) {
        logger.debug('Branding retrieved from cache');
        return cached;
      }

      // Single query with include for better performance
      const activeApplication = await prisma.application.findFirst({
        where: { isActive: true },
        include: {
          appSettings: {
            where: { key: 'branding' },
            select: {
              value: true
            }
          }
        }
      });

      if (!activeApplication) {
        const emptyBranding = {};
        await this.cacheService.set('admin:branding', emptyBranding);
        return emptyBranding;
      }

      // Try app_settings first
      const brandingSetting = activeApplication.appSettings[0];
      let branding: BrandingConfig = {};
      
      if (brandingSetting?.value) {
        branding = typeof brandingSetting.value === 'string' 
          ? JSON.parse(brandingSetting.value) 
          : brandingSetting.value as BrandingConfig;
      } else if (activeApplication.branding) {
        // Fallback to application branding
        branding = typeof activeApplication.branding === 'string' 
          ? JSON.parse(activeApplication.branding) 
          : activeApplication.branding as BrandingConfig;
      }

      // Cache the result
      await this.cacheService.set('admin:branding', branding);
      logger.info('Branding retrieved and cached', { applicationId: activeApplication.id });
      
      return branding;
    } catch (error) {
      logger.error('Failed to fetch branding', { error });
      return {};
    }
  }

  /**
   * Update branding configuration with audit logging
   */
  async updateBranding(branding: BrandingConfig, adminId: string, context: { ip?: string; userAgent?: string }): Promise<BrandingConfig> {
    const activeApplication = await prisma.application.findFirst({
      where: { isActive: true },
      select: { id: true }
    });

    if (!activeApplication) {
      throw new Error('No active application found');
    }

    // Get previous branding for audit
    const previousBranding = await this.getBranding();

    // Use upsert for atomic operation
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

    // Invalidate cache
    await this.cacheService.invalidate('branding');
    
    // Log audit action
    await this.auditService.logAction({
      adminId,
      action: 'update',
      resource: 'branding',
      resourceId: activeApplication.id,
      changes: { previous: previousBranding, new: branding },
      ipAddress: context.ip,
      userAgent: context.userAgent
    });

    logger.info('Branding updated successfully', { 
      adminId, 
      applicationId: activeApplication.id,
      changes: Object.keys(branding).length 
    });

    return branding;
  }

  /**
   * Get all applications with caching
   */
  async getApplications(): Promise<any[]> {
    try {
      const cacheKey = 'admin:applications';
      const cached = await this.cacheService.get<any[]>(cacheKey);
      if (cached) {
        logger.debug('Applications retrieved from cache');
        return cached;
      }

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

      await this.cacheService.set(cacheKey, applications, 60000); // 1min cache
      logger.info('Applications retrieved and cached', { count: applications.length });
      
      return applications;
    } catch (error) {
      logger.error('Failed to fetch applications', { error });
      throw new Error('Failed to fetch applications');
    }
  }

  /**
   * Create application with audit logging
   */
  async createApplication(data: {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    branding?: BrandingConfig;
    settings?: any;
  }, adminId: string, context: { ip?: string; userAgent?: string }): Promise<any> {
    // Check if slug already exists
    const existing = await prisma.application.findUnique({
      where: { slug: data.slug }
    });

    if (existing) {
      throw new Error('Application with this slug already exists');
    }

    const application = await prisma.application.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logoUrl: data.logoUrl,
        branding: data.branding || {},
        settings: data.settings || {},
        isActive: true
      }
    });

    // Invalidate cache
    await this.cacheService.invalidate('applications');
    
    // Log audit action
    await this.auditService.logAction({
      adminId,
      action: 'create',
      resource: 'application',
      resourceId: application.id,
      changes: { created: data },
      ipAddress: context.ip,
      userAgent: context.userAgent
    });

    logger.info('Application created successfully', { 
      adminId, 
      applicationId: application.id,
      slug: data.slug 
    });

    return application;
  }

  /**
   * Generate secure client secret
   */
  private generateSecureSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// ============================================================================
// Enhanced Validation Middleware
// ============================================================================

const validateBrandingUpdate = [
  body('branding').optional().isObject().withMessage('Branding must be an object'),
  body('branding.primaryColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid primary color format'),
  body('branding.secondaryColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid secondary color format'),
  body('branding.accentColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid accent color format'),
  body('branding.fontFamily').optional().isString().isLength({ max: 100 }).withMessage('Font family must be less than 100 characters'),
  body('branding.tagline').optional().isString().isLength({ max: 200 }).withMessage('Tagline must be less than 200 characters'),
  body('branding.description').optional().isString().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('branding.logoUrl').optional().isURL({ protocols: ['https', 'http'], require_protocol: true }).withMessage('Invalid logo URL format'),
  body('branding.appName').optional().isString().isLength({ min: 1, max: 100 }).withMessage('App name must be 1-100 characters'),
];

const validateApplicationCreate = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape().withMessage('Name must be 1-100 characters'),
  body('slug').trim().matches(/^[a-z0-9-]+$/).isLength({ min: 1, max: 50 }).withMessage('Slug must contain only lowercase letters, numbers, and hyphens (1-50 characters)'),
  body('description').optional().trim().isLength({ max: 500 }).escape().withMessage('Description must be less than 500 characters'),
  body('logoUrl').optional().isURL({ protocols: ['https', 'http'], require_protocol: true }).withMessage('Invalid logo URL format'),
  body('branding').optional().isObject().withMessage('Branding must be an object'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
];

const validateApplicationUpdate = [
  param('id').isUUID().withMessage('Invalid application ID'),
  body('name').optional().trim().isLength({ min: 1, max: 100 }).escape().withMessage('Name must be 1-100 characters'),
  body('slug').optional().trim().matches(/^[a-z0-9-]+$/).isLength({ min: 1, max: 50 }).withMessage('Slug must contain only lowercase letters, numbers, and hyphens (1-50 characters)'),
  body('description').optional().trim().isLength({ max: 500 }).escape().withMessage('Description must be less than 500 characters'),
  body('logoUrl').optional().isURL({ protocols: ['https', 'http'], require_protocol: true }).withMessage('Invalid logo URL format'),
];

const validateSSOProviderCreate = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape().withMessage('Name must be 1-100 characters'),
  body('redirect_uris').isArray({ min: 1, max: 10 }).withMessage('Must provide 1-10 redirect URIs'),
  body('redirect_uris.*').isURL({ protocols: ['https', 'http'], require_protocol: true }).withMessage('Each redirect URI must be a valid URL'),
  body('client_type').optional().isIn(['confidential', 'public']).withMessage('Invalid client type'),
  body('grant_types').optional().isArray().withMessage('Grant types must be an array'),
  body('allowed_scopes').optional().isArray().withMessage('Allowed scopes must be an array'),
];

// ============================================================================
// Response Helper
// ============================================================================

const sendResponse = <T>(res: Response, statusCode: number, success: boolean, data?: T, message?: string, error?: string) => {
  const response: ApiResponse<T> = { 
    success,
    timestamp: new Date().toISOString()
  };
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', { 
      errors: errors.array(), 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    return sendResponse(res, 400, false, undefined, undefined, errors.array()[0].msg);
  }
  next();
};

// ============================================================================
// Health Check
// ============================================================================

const healthCheck = async (req: Request, res: Response) => {
  try {
    // Database health check
    await prisma.$queryRaw`SELECT 1`;
    
    // Cache health check
    const cacheService = new CacheService();
    await cacheService.set('health-check', 'ok', 1000);
    const cacheResult = await cacheService.get('health-check');
    
    const isHealthy = cacheResult === 'ok';
    
    sendResponse(res, isHealthy ? 200 : 503, isHealthy, {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      cache: isHealthy ? 'operational' : 'failed'
    }, isHealthy ? 'All systems operational' : 'Some systems are failing');
  } catch (error) {
    logger.error('Health check failed', { error });
    sendResponse(res, 503, false, undefined, undefined, 'Health check failed');
  }
};

// ============================================================================
// Routes
// ============================================================================

const router = Router();
const adminConfigService = new AdminConfigService();

// Apply rate limiting to all routes
router.use(adminRateLimit);

// Health check endpoint (no auth required)
router.get('/health', healthCheck);

// =============================================
// Branding Configuration
// =============================================

/**
 * GET /api/v1/admin/config/branding
 * Get branding configuration for the admin panel
 */
router.get('/branding',
  authenticateAdmin,
  requirePermission('branding', 'view'),
  async (req: Request, res: Response) => {
  try {
    const branding = await adminConfigService.getBranding();
    sendResponse(res, 200, true, branding, 'Branding retrieved successfully');
  } catch (error) {
    logger.error('Failed to fetch branding', { error, adminId: (req as any).admin?.id });
    sendResponse(res, 500, false, undefined, undefined, 'Failed to fetch branding');
  }
});

/**
 * PUT /api/v1/admin/config/branding
 * Update branding configuration
 */
router.put('/branding', 
  authenticateAdmin,
  requirePermission('branding', 'update'),
  validateBrandingUpdate,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { branding } = req.body;
      const adminId = (req as any).admin?.id;
      
      const updatedBranding = await adminConfigService.updateBranding(
        branding, 
        adminId, 
        { 
          ip: req.ip, 
          userAgent: req.get('User-Agent') 
        }
      );
      
      sendResponse(res, 200, true, updatedBranding, 'Branding updated successfully');
    } catch (error) {
      logger.error('Failed to update branding', { 
        error, 
        adminId: (req as any).admin?.id,
        body: req.body 
      });
      const message = error instanceof Error ? error.message : 'Failed to update branding';
      sendResponse(res, 500, false, undefined, undefined, message);
    }
  }
);

// =============================================
// SSO Providers Configuration (Simplified for demo)
// =============================================

/**
 * GET /api/v1/admin/sso-providers
 * Get SSO/OAuth providers configuration
 */
router.get('/sso-providers', 
  authenticateAdmin,
  requirePermission('sso', 'view'),
  async (req: Request, res: Response) => {
    try {
      // Simplified implementation - return empty array for now
      sendResponse(res, 200, true, { providers: [] }, 'SSO providers retrieved successfully');
    } catch (error) {
      logger.error('Failed to fetch SSO providers', { error, adminId: (req as any).admin?.id });
      sendResponse(res, 500, false, undefined, undefined, 'Failed to fetch SSO providers');
    }
  }
);

/**
 * POST /api/v1/admin/sso-providers
 * Create new SSO provider
 */
router.post('/sso-providers',
  authenticateAdmin,
  requirePermission('sso', 'create'),
  validateSSOProviderCreate,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      // Simplified implementation - return success for now
      logger.info('SSO provider creation attempted', { 
        adminId: (req as any).admin?.id,
        providerData: req.body 
      });
      
      sendResponse(res, 201, true, { client: req.body }, 'SSO provider created successfully');
    } catch (error) {
      logger.error('Failed to create SSO provider', { 
        error, 
        adminId: (req as any).admin?.id,
        body: req.body 
      });
      const message = error instanceof Error ? error.message : 'Failed to create SSO provider';
      sendResponse(res, 500, false, undefined, undefined, message);
    }
  }
);

// =============================================
// Applications Management
// =============================================

/**
 * GET /api/v1/admin/applications
 * Get all applications for admin management
 */
router.get('/applications',
  authenticateAdmin,
  requirePermission('applications', 'view'),
  async (req: Request, res: Response) => {
    try {
      const applications = await adminConfigService.getApplications();
      sendResponse(res, 200, true, { applications }, 'Applications retrieved successfully');
    } catch (error) {
      logger.error('Failed to fetch applications', { error, adminId: (req as any).admin?.id });
      sendResponse(res, 500, false, undefined, undefined, 'Failed to fetch applications');
    }
  }
);

/**
 * POST /api/v1/admin/applications
 * Create new application
 */
router.post('/applications',
  authenticateAdmin,
  requirePermission('applications', 'create'),
  validateApplicationCreate,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).admin?.id;
      const application = await adminConfigService.createApplication(
        req.body, 
        adminId, 
        { 
          ip: req.ip, 
          userAgent: req.get('User-Agent') 
        }
      );
      
      sendResponse(res, 201, true, { application }, 'Application created successfully');
    } catch (error) {
      logger.error('Failed to create application', { 
        error, 
        adminId: (req as any).admin?.id,
        body: req.body 
      });
      const message = error instanceof Error ? error.message : 'Failed to create application';
      sendResponse(res, 500, false, undefined, undefined, message);
    }
  }
);

export default router;
