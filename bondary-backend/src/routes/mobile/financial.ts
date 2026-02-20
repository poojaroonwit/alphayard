import express from 'express';
import financeController from '../../controllers/mobile/FinanceController';
// Assuming there is an auth middleware, checking auth.ts or similar usage in other routes
import { authenticateToken } from '../../middleware/auth';

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

// Budgets
router.get('/budgets', financeController.getBudgets);
router.post('/budgets', financeController.createBudget);
router.put('/budgets/:id', financeController.updateBudget);
router.delete('/budgets/:id', financeController.deleteBudget);

// Stats & Reports
router.get('/stats', financeController.getExpenseStats);
router.get('/report', financeController.getExpenseReport);
router.get('/insights', financeController.getExpenseInsights);

// Search & Recurring
router.get('/search', financeController.searchExpenses);
router.get('/recurring', financeController.getRecurringExpenses);
router.get('/upcoming', financeController.getUpcomingExpenses);

// Categories & Methods
router.get('/categories', financeController.getCategories);
router.get('/payment-methods', financeController.getPaymentMethods);

// Reminders
router.get('/reminders', financeController.getExpenseReminders);
router.post('/reminders', financeController.setExpenseReminder);

// Goals
router.get('/goals', financeController.getGoals);
router.post('/goals', financeController.createGoal);

export default router;
