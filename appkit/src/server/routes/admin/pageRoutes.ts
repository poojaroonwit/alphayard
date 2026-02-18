
import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import pageController from '../../controllers/admin/PageController';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Page Management
router.get('/', requirePermission('pages', 'view'), (req, res) => pageController.getPages(req, res));
router.post('/', requirePermission('pages', 'create'), (req, res) => pageController.createPage(req, res));
router.get('/:id', requirePermission('pages', 'view'), (req, res) => pageController.getPage(req, res));
router.put('/:id', requirePermission('pages', 'edit'), (req, res) => pageController.updatePage(req, res));
router.delete('/:id', requirePermission('pages', 'delete'), (req, res) => pageController.deletePage(req, res));

// Page Actions
router.post('/:id/publish', requirePermission('pages', 'publish'), (req, res) => pageController.publishPage(req, res));
router.put('/:id/components', requirePermission('pages', 'edit'), (req, res) => pageController.saveComponents(req, res));

export default router;
