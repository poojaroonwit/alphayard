import express from 'express';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import ShoppingController from '../../controllers/mobile/ShoppingController';

const router = express.Router();

router.use(authenticateToken as any);
router.use(requireCircleMember as any);

router.get('/', ShoppingController.list);
router.post('/', ShoppingController.create);
router.put('/:id', ShoppingController.update);
router.delete('/:id', ShoppingController.remove);

export default router;
