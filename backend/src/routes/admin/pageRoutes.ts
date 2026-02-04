
import { Router } from 'express';
// import { authenticate } from '../../middleware/auth'; // or adminAuth
import { authenticateAdmin } from '../../middleware/adminAuth';
import pageController from '../../controllers/admin/PageController';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Page Management
router.get('/', (req, res) => pageController.getPages(req, res));
router.post('/', (req, res) => pageController.createPage(req, res));
router.get('/:id', (req, res) => pageController.getPage(req, res));
router.put('/:id', (req, res) => pageController.updatePage(req, res));
router.delete('/:id', (req, res) => pageController.deletePage(req, res));

// Page Actions
router.post('/:id/publish', (req, res) => pageController.publishPage(req, res));
router.put('/:id/components', (req, res) => pageController.saveComponents(req, res));

export default router;
