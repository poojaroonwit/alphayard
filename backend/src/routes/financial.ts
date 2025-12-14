import express from 'express';
import financeController from '../controllers/FinanceController';
// Assuming there is an auth middleware, checking auth.ts or similar usage in other routes
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// @ts-ignore
router.use(authenticateToken);

// Accounts
router.get('/accounts', financeController.getAccounts);
router.post('/accounts', financeController.createAccount);
router.put('/accounts/:id', financeController.updateAccount);
router.delete('/accounts/:id', financeController.deleteAccount);

// Transactions
router.get('/transactions', financeController.getTransactions);
router.post('/transactions', financeController.createTransaction);

// Categories
router.get('/categories', financeController.getCategories);

// Goals
router.get('/goals', financeController.getGoals);
router.post('/goals', financeController.createGoal);

export default router;
