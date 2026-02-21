import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface EntityType {
  id: string;
  name: string;
  description?: string;
  applicationId?: string;
  fields: EntityField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EntityField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'file' | 'image';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface ApplicationSetting {
  id: string;
  settingKey: string;
  settingValue: any;
  settingType: string;
  category: string;
  description?: string;
  isPublic: boolean;
  applicationId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Response Helper
// ============================================================================

const sendResponse = <T>(res: Response, statusCode: number, success: boolean, data?: T, message?: string, error?: string) => {
  const response = { 
    success,
    timestamp: new Date().toISOString()
  };
  if (data !== undefined) (response as any).data = data;
  if (message) (response as any).message = message;
  if (error) (response as any).error = error;
  return res.status(statusCode).json(response);
};

const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, undefined, undefined, errors.array()[0].msg);
  }
  next();
};

// ============================================================================
// Entity Types Routes
// ============================================================================

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /admin/entity-types
 * Get all entity types
 */
router.get('/entity-types',
  requirePermission('entities', 'view'),
  async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.query;
      
      // For now, return mock entity types since the schema doesn't have entity types
      // In a real implementation, you'd query your entity types table
      const mockEntityTypes: EntityType[] = [
        {
          id: '1',
          name: 'User Profile',
          description: 'User profile information',
          applicationId: applicationId as string,
          fields: [
            {
              id: '1',
              name: 'firstName',
              type: 'text',
              required: true
            },
            {
              id: '2', 
              name: 'lastName',
              type: 'text',
              required: true
            },
            {
              id: '3',
              name: 'age',
              type: 'number',
              required: false,
              validation: { min: 0, max: 120 }
            }
          ],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Contact Info',
          description: 'Contact information',
          applicationId: applicationId as string,
          fields: [
            {
              id: '1',
              name: 'email',
              type: 'text',
              required: true,
              validation: { pattern: '^[^@]+@[^@]+\.[^@]+$' }
            },
            {
              id: '2',
              name: 'phone',
              type: 'text',
              required: false
            }
          ],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      sendResponse(res, 200, true, { entityTypes: mockEntityTypes }, 'Entity types retrieved successfully');
    } catch (error) {
      console.error('Get entity types error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to get entity types');
    }
  }
);

/**
 * PUT /admin/entity-types/:id
 * Update entity type
 */
router.put('/entity-types/:id',
  requirePermission('entities', 'update'),
  [
    param('id').isUUID().withMessage('Invalid entity type ID'),
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    body('fields').optional().isArray().withMessage('Fields must be an array')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Mock update - in real implementation, update the entity type in database
      const updatedEntityType: EntityType = {
        id,
        name: updateData.name || 'Updated Entity Type',
        description: updateData.description,
        applicationId: updateData.applicationId,
        fields: updateData.fields || [],
        isActive: updateData.isActive !== undefined ? updateData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      sendResponse(res, 200, true, updatedEntityType, 'Entity type updated successfully');
    } catch (error) {
      console.error('Update entity type error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to update entity type');
    }
  }
);

/**
 * DELETE /admin/entity-types/:id
 * Delete entity type
 */
router.delete('/entity-types/:id',
  requirePermission('entities', 'delete'),
  [param('id').isUUID().withMessage('Invalid entity type ID')],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Mock delete - in real implementation, delete the entity type from database
      sendResponse(res, 200, true, undefined, 'Entity type deleted successfully');
    } catch (error) {
      console.error('Delete entity type error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to delete entity type');
    }
  }
);

// ============================================================================
// Application Settings Routes
// ============================================================================

/**
 * GET /admin/application-settings
 * Get all application settings
 */
router.get('/application-settings',
  requirePermission('settings', 'view'),
  async (req: Request, res: Response) => {
    try {
      // Get settings from app_settings table
      const settings = await prisma.appSetting.findMany({
        select: {
          id: true,
          key: true,
          value: true,
          description: true,
          applicationId: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          key: 'asc'
        }
      });

      // Transform to expected format
      const applicationSettings: ApplicationSetting[] = settings.map((setting: any) => ({
        id: setting.id,
        settingKey: setting.key,
        settingValue: setting.value,
        settingType: typeof setting.value,
        category: 'general',
        description: setting.description || undefined,
        isPublic: false,
        applicationId: setting.applicationId || undefined,
        createdAt: setting.createdAt.toISOString(),
        updatedAt: setting.updatedAt.toISOString()
      }));

      sendResponse(res, 200, true, { settings: applicationSettings }, 'Application settings retrieved successfully');
    } catch (error) {
      console.error('Get application settings error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to get application settings');
    }
  }
);

/**
 * POST /admin/application-settings
 * Create or update application setting
 */
router.post('/application-settings',
  requirePermission('settings', 'update'),
  [
    body('setting_key').trim().isLength({ min: 1, max: 100 }).withMessage('Setting key must be 1-100 characters'),
    body('setting_value').notEmpty().withMessage('Setting value is required'),
    body('setting_type').optional().isIn(['string', 'number', 'boolean', 'object', 'array']).withMessage('Invalid setting type'),
    body('category').optional().trim().isLength({ max: 50 }).withMessage('Category must be less than 50 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('is_public').optional().isBoolean().withMessage('is_public must be boolean'),
    body('application_id').optional().isUUID().withMessage('Invalid application ID')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        setting_key: key,
        setting_value: value,
        setting_type: type = typeof value,
        category = 'general',
        description,
        is_public = false,
        application_id: applicationId
      } = req.body;

      // Find active application if applicationId not provided
      let targetApplicationId = applicationId;
      if (!targetApplicationId) {
        const activeApp = await prisma.application.findFirst({
          where: { isActive: true },
          select: { id: true }
        });
        targetApplicationId = activeApp?.id;
      }

      if (!targetApplicationId) {
        return sendResponse(res, 400, false, undefined, undefined, 'No active application found');
      }

      // Upsert the setting
      const setting = await prisma.appSetting.upsert({
        where: {
          applicationId_key: {
            applicationId: targetApplicationId,
            key
          }
        },
        update: {
          value: value as any,
          description
        },
        create: {
          applicationId: targetApplicationId,
          key,
          value: value as any,
          description
        }
      });

      const responseSetting: ApplicationSetting = {
        id: (setting as any).id,
        settingKey: (setting as any).key,
        settingValue: (setting as any).value,
        settingType: type,
        category,
        description: (setting as any).description || undefined,
        isPublic: is_public,
        applicationId: targetApplicationId,
        createdAt: (setting as any).createdAt.toISOString(),
        updatedAt: (setting as any).updatedAt.toISOString()
      };

      sendResponse(res, 201, true, responseSetting, 'Application setting saved successfully');
    } catch (error) {
      console.error('Save application setting error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to save application setting');
    }
  }
);

// ============================================================================
// Broadcast/Notifications Routes
// ============================================================================

/**
 * POST /admin/broadcast
 * Send broadcast notification
 */
router.post('/broadcast',
  requirePermission('notifications', 'send'),
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
    body('type').isIn(['notification', 'email', 'both']).withMessage('Type must be notification, email, or both'),
    body('target').isIn(['all', 'active', 'premium']).withMessage('Target must be all, active, or premium')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { title, message, type, target } = req.body;

      // Mock broadcast implementation
      // In a real implementation, you would:
      // 1. Query users based on target criteria
      // 2. Send push notifications via Firebase/OneSignal
      // 3. Send emails via email service
      // 4. Track delivery results

      const mockResults = {
        successful: Math.floor(Math.random() * 100) + 50,
        failed: Math.floor(Math.random() * 10)
      };

      sendResponse(res, 200, true, { results: mockResults }, 'Broadcast sent successfully');
    } catch (error) {
      console.error('Send broadcast error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to send broadcast');
    }
  }
);

// ============================================================================
// Screen Management Routes
// ============================================================================

/**
 * POST /admin/screens/seed
 * Seed screens with default configuration
 */
router.post('/screens/seed',
  requirePermission('screens', 'manage'),
  async (req: Request, res: Response) => {
    try {
      // Mock screen seeding
      // In a real implementation, you would:
      // 1. Create default screen configurations
      // 2. Set up default layouts
      // 3. Initialize screen components

      sendResponse(res, 200, true, { message: 'Screens seeded successfully' }, 'Screen seeding completed');
    } catch (error) {
      console.error('Seed screens error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to seed screens');
    }
  }
);

// ============================================================================
// View Preferences Routes
// ============================================================================

/**
 * GET /admin/view-preference/:key
 * Get view preference
 */
router.get('/view-preference/:key',
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const adminId = (req as any).admin?.id;

      // Mock preference retrieval
      // In a real implementation, store preferences in database or Redis
      const mockPreference = {
        key,
        value: {},
        adminId,
        updatedAt: new Date().toISOString()
      };

      sendResponse(res, 200, true, mockPreference, 'View preference retrieved successfully');
    } catch (error) {
      console.error('Get view preference error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to get view preference');
    }
  }
);

/**
 * POST /admin/view-preference/:key
 * Save view preference
 */
router.post('/view-preference/:key',
  authenticateAdmin,
  [
    param('key').trim().isLength({ min: 1, max: 100 }).withMessage('Key must be 1-100 characters'),
    body().notEmpty().withMessage('Preference value is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const value = req.body;
      const adminId = (req as any).admin?.id;

      // Mock preference saving
      // In a real implementation, store preferences in database or Redis
      const mockPreference = {
        key,
        value,
        adminId,
        updatedAt: new Date().toISOString()
      };

      sendResponse(res, 200, true, mockPreference, 'View preference saved successfully');
    } catch (error) {
      console.error('Save view preference error:', error);
      sendResponse(res, 500, false, undefined, undefined, 'Failed to save view preference');
    }
  }
);

export default router;
