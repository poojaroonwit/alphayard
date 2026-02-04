import express from 'express';
import { SystemConfigController } from '../../controllers/admin/SystemConfigController';
import { authenticateToken, requireAdmin } from '../../middleware/auth'; // Assuming these exist

const router = express.Router();
const controller = new SystemConfigController();

// OTP Routes
router.get('/', (req, res) => controller.getAllConfigs(req, res));
router.get('/countries', (req, res) => controller.getCountries(req, res));
router.get('/:key', (req, res) => controller.getConfig(req, res));
router.put('/:key', requireAdmin as any, (req, res) => controller.updateConfig(req, res));
router.delete('/:key', requireAdmin as any, (req, res) => controller.deleteConfig(req, res));

// Manager Signup Routes
router.get('/manager-signup', authenticateToken as any, requireAdmin as any, (req, res) => controller.getManagerSignupConfig(req, res));
router.post('/manager-signup', authenticateToken as any, requireAdmin as any, (req, res) => controller.updateManagerSignupConfig(req, res));

export default router;
