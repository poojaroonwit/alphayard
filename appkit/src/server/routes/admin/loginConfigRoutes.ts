import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateAdmin, requirePermission, AdminRequest } from '../../middleware/adminAuth';
import { loginConfigService } from '../../services/loginConfigService';
import { logger } from '../../middleware/logger';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin as any);

/**
 * Get login configuration for a specific application
 * GET /api/admin/login-config/:appId
 */
router.get('/:appId', 
  requirePermission('settings:read') as any,
  [
    param('appId').isUUID().withMessage('Invalid application ID')
  ],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { appId } = req.params;
      const config = await loginConfigService.getLoginConfig(appId);

      res.json({
        success: true,
        data: config
      });
    } catch (error: any) {
      logger.error('[LoginConfigRoutes] Get config error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get login configuration'
      });
    }
  }
);

/**
 * Get login configuration by application slug
 * GET /api/admin/login-config/slug/:slug
 */
router.get('/slug/:slug',
  requirePermission('settings:read') as any,
  [
    param('slug').isString().withMessage('Invalid slug')
  ],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { slug } = req.params;
      const config = await loginConfigService.getLoginConfigBySlug(slug);

      res.json({
        success: true,
        data: config
      });
    } catch (error: any) {
      logger.error('[LoginConfigRoutes] Get config by slug error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get login configuration'
      });
    }
  }
);

/**
 * Update login configuration for an application
 * PUT /api/admin/login-config/:appId
 */
router.put('/:appId',
  requirePermission('settings:write') as any,
  [
    param('appId').isUUID().withMessage('Invalid application ID'),
    body().isObject().withMessage('Configuration must be an object')
  ],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { appId } = req.params;
      const config = req.body;

      // Validate configuration
      const validation = loginConfigService.validateLoginConfig(config);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid configuration',
          errors: validation.errors
        });
      }

      const updatedConfig = await loginConfigService.updateLoginConfig(appId, config);

      logger.info(`[LoginConfigRoutes] Config updated for app: ${appId} by admin: ${req.admin?.email}`);

      res.json({
        success: true,
        data: updatedConfig,
        message: 'Login configuration updated successfully'
      });
    } catch (error: any) {
      logger.error('[LoginConfigRoutes] Update config error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update login configuration'
      });
    }
  }
);

/**
 * Get all login configurations
 * GET /api/admin/login-config
 */
router.get('/',
  requirePermission('settings:read') as any,
  async (req: AdminRequest, res: Response) => {
    try {
      const configs = await loginConfigService.getAllLoginConfigs();

      res.json({
        success: true,
        data: configs
      });
    } catch (error: any) {
      logger.error('[LoginConfigRoutes] Get all configs error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get login configurations'
      });
    }
  }
);

/**
 * Clone login configuration from one app to another
 * POST /api/admin/login-config/clone/:fromAppId/:toAppId
 */
router.post('/clone/:fromAppId/:toAppId',
  requirePermission('settings:write') as any,
  [
    param('fromAppId').isUUID().withMessage('Invalid source application ID'),
    param('toAppId').isUUID().withMessage('Invalid target application ID')
  ],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { fromAppId, toAppId } = req.params;

      if (fromAppId === toAppId) {
        return res.status(400).json({
          success: false,
          message: 'Source and target applications cannot be the same'
        });
      }

      const clonedConfig = await loginConfigService.cloneLoginConfig(fromAppId, toAppId);

      logger.info(`[LoginConfigRoutes] Config cloned from ${fromAppId} to ${toAppId} by admin: ${req.admin?.email}`);

      res.json({
        success: true,
        data: clonedConfig,
        message: 'Login configuration cloned successfully'
      });
    } catch (error: any) {
      logger.error('[LoginConfigRoutes] Clone config error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to clone login configuration'
      });
    }
  }
);

/**
 * Reset login configuration to defaults
 * POST /api/admin/login-config/reset/:appId
 */
router.post('/reset/:appId',
  requirePermission('settings:write') as any,
  [
    param('appId').isUUID().withMessage('Invalid application ID')
  ],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { appId } = req.params;
      const resetConfig = await loginConfigService.resetLoginConfig(appId);

      logger.info(`[LoginConfigRoutes] Config reset for app: ${appId} by admin: ${req.admin?.email}`);

      res.json({
        success: true,
        data: resetConfig,
        message: 'Login configuration reset to defaults successfully'
      });
    } catch (error: any) {
      logger.error('[LoginConfigRoutes] Reset config error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reset login configuration'
      });
    }
  }
);

/**
 * Preview login configuration
 * POST /api/admin/login-config/preview
 */
router.post('/preview',
  requirePermission('settings:read') as any,
  [
    body().isObject().withMessage('Configuration must be an object')
  ],
  async (req: AdminRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const config = req.body;

      // Validate configuration
      const validation = loginConfigService.validateLoginConfig(config);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid configuration',
          errors: validation.errors
        });
      }

      // Return merged config with defaults for preview
      const mergedConfig = await loginConfigService.updateLoginConfig('preview', config);

      res.json({
        success: true,
        data: mergedConfig,
        message: 'Preview generated successfully'
      });
    } catch (error: any) {
      logger.error('[LoginConfigRoutes] Preview config error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate preview'
      });
    }
  }
);

export default router;
