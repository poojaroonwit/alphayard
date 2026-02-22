import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

// Admin Routes
import boundaryAdminRoutes from '../admin/boundary';
import configRoutes from '../admin/configRoutes'; // Use actual config routes
import authRoutes from '../admin/authRoutes';
import entityRoutes from '../admin/entityRoutes';
import uploadRoutes from '../admin/uploadRoutes';
import dashboardRoutes from '../admin/dashboardRoutes';
import identityRoutes from '../admin/identityRoutes';
import legalRoutes from '../admin/legalRoutes';

const router = Router();

// Admin Routes - Use proper config routes
router.use('/admin/config', configRoutes); // Use actual config routes
router.use('/admin', boundaryAdminRoutes);
router.use('/admin/auth', authRoutes);
router.use('/admin', entityRoutes); // Entity types, settings, broadcast, etc.
router.use('/admin', uploadRoutes); // File upload system
router.use('/admin', dashboardRoutes); // Dashboard statistics
router.use('/admin/identity', identityRoutes); // Identity management
router.use('/admin/legal', legalRoutes); // Legal documents

// =============================================
// SSO Providers (Direct mount for frontend compatibility)
// =============================================

/**
 * GET /api/v1/admin/sso-providers
 * Get SSO/OAuth providers configuration
 */
router.get('/admin/sso-providers', 
  authenticateAdmin,
  requirePermission('sso', 'view'),
  async (req: Request, res: Response) => {
    try {
      // Simplified implementation - return empty array for now
      res.json({
        success: true,
        data: { providers: [] },
        message: 'SSO providers retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch SSO providers', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch SSO providers',
        timestamp: new Date().toISOString()
      });
    }
  }
);

// =============================================
// Applications Management (Direct mount for frontend compatibility)
// =============================================

/**
 * GET /api/v1/admin/applications
 * Get all applications
 */
router.get('/admin/applications',
  authenticateAdmin,
  requirePermission('applications', 'view'),
  async (req: Request, res: Response) => {
    try {
      // Simplified implementation - return empty array for now
      res.json({
        success: true,
        data: { applications: [] },
        message: 'Applications retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to fetch applications', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/admin/applications
 * Create new application
 */
router.post('/admin/applications',
  authenticateAdmin,
  requirePermission('applications', 'create'),
  async (req: Request, res: Response) => {
    try {
      // Simplified implementation - return success for now
      res.status(201).json({
        success: true,
        data: { application: req.body },
        message: 'Application created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to create application', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create application',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;
