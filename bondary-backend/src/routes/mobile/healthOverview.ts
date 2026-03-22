import express from 'express';
import HealthOverviewController from '../../controllers/mobile/HealthOverviewController';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// @ts-ignore
router.use(authenticateToken);

// ── Categories ────────────────────────────────────────────────────────────────
// GET  /health-overview/categories?section=assets|liabilities|flow|kpis
// POST /health-overview/categories
// PUT  /health-overview/categories/:id
// DELETE /health-overview/categories/:id
router.get('/categories', HealthOverviewController.getCategories);
router.post('/categories', HealthOverviewController.createCategory);
router.put('/categories/:id', HealthOverviewController.updateCategory);
router.delete('/categories/:id', HealthOverviewController.deleteCategory);

// ── Sub-categories ────────────────────────────────────────────────────────────
// POST   /health-overview/categories/:categoryId/subcategories
// PUT    /health-overview/subcategories/:id
// DELETE /health-overview/subcategories/:id
router.post('/categories/:categoryId/subcategories', HealthOverviewController.createSubCategory);
router.put('/subcategories/:id', HealthOverviewController.updateSubCategory);
router.delete('/subcategories/:id', HealthOverviewController.deleteSubCategory);

// ── Records ───────────────────────────────────────────────────────────────────
// GET    /health-overview/subcategories/:subCatId/records
// POST   /health-overview/subcategories/:subCatId/records
// DELETE /health-overview/records/:id
router.get('/subcategories/:subCatId/records', HealthOverviewController.getRecords);
router.post('/subcategories/:subCatId/records', HealthOverviewController.createRecord);
router.put('/records/:id', HealthOverviewController.updateRecord);
router.delete('/records/:id', HealthOverviewController.deleteRecord);

// ── Summary ───────────────────────────────────────────────────────────────────
router.get('/summary', HealthOverviewController.getSummary);

export default router;
