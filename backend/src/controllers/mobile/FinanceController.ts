import { Request, Response, NextFunction } from 'express';
import financeService from '../../services/financeService';

class FinanceController {
    // Accounts
    async getAccounts(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await financeService.getAccounts(userId);
            res.json({ success: true, data: result.entities });
        } catch (error) {
            next(error);
        }
    }

    async createAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const accountData = { ...req.body, user_id: (req as any).user.id };
            const account = await financeService.createAccount(accountData);
            res.status(201).json({ success: true, data: account });
        } catch (error) {
            next(error);
        }
    }

    async updateAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const account = await financeService.updateAccount(req.params.id, req.body);
            res.json({ success: true, data: account });
        } catch (error) {
            next(error);
        }
    }

    async deleteAccount(req: Request, res: Response, next: NextFunction) {
        try {
            await financeService.deleteAccount(req.params.id);
            res.json({ success: true, message: 'Account deleted' });
        } catch (error) {
            next(error);
        }
    }

    // Transactions
    async getTransactions(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await financeService.getTransactions(userId, req.query);
            res.json({ success: true, data: result.entities });
        } catch (error) {
            next(error);
        }
    }

    async createTransaction(req: Request, res: Response, next: NextFunction) {
        try {
            const txData = { ...req.body, user_id: (req as any).user.id };
            const transaction = await financeService.createTransaction(txData);
            res.status(201).json({ success: true, data: transaction });
        } catch (error) {
            next(error);
        }
    }

    // Categories
    async getCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await financeService.getCategories();
            res.json({ success: true, data: result.entities });
        } catch (error) {
            next(error);
        }
    }

    // Goals
    async getGoals(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await financeService.getGoals(userId);
            res.json({ success: true, data: result.entities });
        } catch (error) {
            next(error);
        }
    }

    async createGoal(req: Request, res: Response, next: NextFunction) {
        try {
            const goalData = { ...req.body, user_id: (req as any).user.id };
            const goal = await financeService.createGoal(goalData);
            res.status(201).json({ success: true, data: goal });
        } catch (error) {
            next(error);
        }
    }

    // Budgets
    async getBudgets(req: Request, res: Response, next: NextFunction) {
        try {
            const circleId = req.query.circleId as string;
            const result = await financeService.getBudgets(circleId);
            res.json(result.entities.map(e => ({ ...e.attributes, id: e.id })));
        } catch (error) {
            next(error);
        }
    }

    async createBudget(req: Request, res: Response, next: NextFunction) {
        try {
            const budget = await financeService.createBudget(req.body);
            res.status(201).json({ ...budget.attributes, id: budget.id });
        } catch (error) {
            next(error);
        }
    }

    async updateBudget(req: Request, res: Response, next: NextFunction) {
        try {
            const budget = await financeService.updateBudget(req.params.id, req.body);
            if (!budget) {
                return res.status(404).json({ success: false, message: 'Budget not found' });
            }
            res.json({ ...budget.attributes, id: budget.id });
        } catch (error) {
            next(error);
        }
    }

    async deleteBudget(req: Request, res: Response, next: NextFunction) {
        try {
            await financeService.deleteBudget(req.params.id);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    }

    // Stats & Reports
    async getExpenseStats(req: Request, res: Response, next: NextFunction) {
        try {
            const circleId = req.query.circleId as string;
            const period = req.query.period as string;
            const stats = await financeService.getExpenseStats(circleId, period);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    async getExpenseReport(req: Request, res: Response, next: NextFunction) {
        try {
            const circleId = req.query.circleId as string;
            const report = await financeService.getExpenseReport(circleId, req.query as any);
            res.json(report);
        } catch (error) {
            next(error);
        }
    }

    async getExpenseInsights(req: Request, res: Response, next: NextFunction) {
        try {
            const circleId = req.query.circleId as string;
            const insights = await financeService.getExpenseInsights(circleId);
            res.json(insights);
        } catch (error) {
            next(error);
        }
    }

    // Search & Recurring
    async searchExpenses(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query.q as string;
            const circleId = req.query.circleId as string;
            const results = await financeService.searchExpenses(query, circleId);
            res.json(results.map(e => ({ ...e.attributes, id: e.id })));
        } catch (error) {
            next(error);
        }
    }

    async getRecurringExpenses(req: Request, res: Response, next: NextFunction) {
        try {
            const circleId = req.query.circleId as string;
            const results = await financeService.getRecurringExpenses(circleId);
            res.json(results.map(e => ({ ...e.attributes, id: e.id })));
        } catch (error) {
            next(error);
        }
    }

    async getUpcomingExpenses(req: Request, res: Response, next: NextFunction) {
        try {
            const circleId = req.query.circleId as string;
            const days = parseInt(req.query.days as string, 10) || 30;
            const results = await financeService.getUpcomingExpenses(circleId, days);
            res.json(results.map(e => ({ ...e.attributes, id: e.id })));
        } catch (error) {
            next(error);
        }
    }

    // Methods
    async getPaymentMethods(req: Request, res: Response, next: NextFunction) {
        try {
            const methods = await financeService.getPaymentMethods();
            res.json(methods);
        } catch (error) {
            next(error);
        }
    }

    // Reminders
    async getExpenseReminders(req: Request, res: Response, next: NextFunction) {
        try {
            const circleId = req.query.circleId as string;
            const reminders = await financeService.getExpenseReminders(circleId);
            res.json(reminders.map(e => ({ ...e.attributes, id: e.id })));
        } catch (error) {
            next(error);
        }
    }

    async setExpenseReminder(req: Request, res: Response, next: NextFunction) {
        try {
            const reminder = await financeService.setExpenseReminder(req.body);
            res.status(201).json({ ...reminder.attributes, id: reminder.id });
        } catch (error) {
            next(error);
        }
    }
}

export default new FinanceController();
