import express from 'express';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import NotesController from '../../controllers/mobile/NotesController';

const router = express.Router();

router.use(authenticateToken as any);
router.use(requireCircleMember as any);

router.get('/', NotesController.list);
router.post('/', NotesController.create);
router.put('/:id', NotesController.update);
router.delete('/:id', NotesController.remove);

export default router;



