import express from 'express';
import financeController from '../../controllers/mobile/FinanceController';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// @ts-ignore
router.use(authenticateToken);

// ── Categories ────────────────────────────────────────────────────────────────
// GET  /finance/categories?section=assets|debts|cashflow
// POST /finance/categories
// PUT  /finance/categories/:id
// DELETE /finance/categories/:id
router.get('/categories', financeController.getCategories);
router.post('/categories', financeController.createCategory);
router.put('/categories/:id', financeController.updateCategory);
router.delete('/categories/:id', financeController.deleteCategory);

// ── Sub-categories ────────────────────────────────────────────────────────────
// POST   /finance/categories/:categoryId/subcategories
// PUT    /finance/subcategories/:id
// DELETE /finance/subcategories/:id
router.post('/categories/:categoryId/subcategories', financeController.createSubCategory);
router.put('/subcategories/:id', financeController.updateSubCategory);
router.delete('/subcategories/:id', financeController.deleteSubCategory);

// ── Records ───────────────────────────────────────────────────────────────────
// GET    /finance/subcategories/:subCatId/records
// POST   /finance/subcategories/:subCatId/records
// DELETE /finance/records/:id
router.get('/subcategories/:subCatId/records', financeController.getRecords);
router.post('/subcategories/:subCatId/records', financeController.createRecord);
router.put('/records/:id', financeController.updateRecord);
router.delete('/records/:id', financeController.deleteRecord);

// ── Summary ───────────────────────────────────────────────────────────────────
router.get('/net-worth', financeController.getNetWorth);

export default router;
