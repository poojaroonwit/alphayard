import express from 'express';
import { SystemConfigController } from '../../controllers/admin/SystemConfigController';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = express.Router();
const controller = new SystemConfigController();

// Public Branding Route (used before auth middleware)
router.get('/branding', (req, res) => controller.getBrandingConfig(req, res));

// Apply admin auth to remaining routes
router.use(authenticateAdmin as any);

// OTP Routes
router.get('/', requirePermission('settings', 'view'), (req, res) => controller.getAllConfigs(req, res));
router.get('/countries', requirePermission('settings', 'view'), (req, res) => controller.getCountries(req, res));
router.get('/:key', requirePermission('settings', 'view'), (req, res) => controller.getConfig(req, res));
router.put('/:key', requirePermission('settings', 'edit'), (req, res) => controller.updateConfig(req, res));
router.delete('/:key', requirePermission('settings', 'delete'), (req, res) => controller.deleteConfig(req, res));

// Manager Signup Routes
router.get('/manager-signup', requirePermission('settings', 'view'), (req, res) => controller.getManagerSignupConfig(req, res));
router.post('/manager-signup', requirePermission('settings', 'edit'), (req, res) => controller.updateManagerSignupConfig(req, res));

// Branding Routes (GET is public, PUT remains protected)
router.put('/branding', requirePermission('settings', 'edit'), (req, res) => controller.updateBrandingConfig(req, res));

// Application Settings Routes
router.get('/application-settings', requirePermission('settings', 'view'), (req, res) => controller.getApplicationSettings(req, res));
router.put('/application-settings', requirePermission('settings', 'edit'), (req, res) => controller.updateApplicationSettings(req, res));

export default router;
