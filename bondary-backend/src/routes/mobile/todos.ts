import express from 'express';
import { authenticateToken, optionalCircleMember } from '../../middleware/auth';
import TodosController from '../../controllers/mobile/TodosController';

const router = express.Router();

router.use(authenticateToken as any);
router.use(optionalCircleMember as any);

router.get('/', TodosController.list);
router.post('/', TodosController.create);
router.put('/:id', TodosController.update);
router.delete('/:id', TodosController.remove);
router.post('/reorder', TodosController.reorder);

export default router;



