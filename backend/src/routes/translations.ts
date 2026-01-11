import { Router } from 'express';
import { TranslationController } from '../controllers/TranslationController';
// import { authenticateToken, requireAdmin } from '../middleware/auth'; // Uncomment when auth is ready

const router = Router();
const translationController = new TranslationController();

// Create new routes
router.get('/', translationController.getAllTranslations);
router.post('/', translationController.upsertTranslation);
router.delete('/:key', translationController.deleteTranslation);

export default router;
