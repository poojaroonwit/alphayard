import { Router, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { loginConfigService } from '../../services/loginConfigService';
import { logger } from '../../middleware/logger';

const router = Router();

/**
 * Get login configuration for an application (public endpoint)
 * GET /api/public/login-config/:appId
 */
router.get('/:appId', [
  param('appId').isUUID().withMessage('Invalid application ID')
], async (req: any, res: Response) => {
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

    // Remove sensitive information for public endpoint
    const publicConfig = {
      ...config,
      // Remove analytics tracking info for privacy
      analytics: {
        ...config.analytics,
        trackingId: undefined
      },
      // Remove custom JS for security
      customJS: undefined
    };

    res.json({
      success: true,
      data: publicConfig
    });
  } catch (error: any) {
    logger.error('[PublicLoginConfigRoutes] Get config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get login configuration'
    });
  }
});

/**
 * Get login configuration by application slug (public endpoint)
 * GET /api/public/login-config/slug/:slug
 */
router.get('/slug/:slug', [
  param('slug').isString().withMessage('Invalid slug')
], async (req: any, res: Response) => {
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

    // Remove sensitive information for public endpoint
    const publicConfig = {
      ...config,
      // Remove analytics tracking info for privacy
      analytics: {
        ...config.analytics,
        trackingId: undefined
      },
      // Remove custom JS for security
      customJS: undefined
    };

    res.json({
      success: true,
      data: publicConfig
    });
  } catch (error: any) {
    logger.error('[PublicLoginConfigRoutes] Get config by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get login configuration'
    });
  }
});

export default router;
