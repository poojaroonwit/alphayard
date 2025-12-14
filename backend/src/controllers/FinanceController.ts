import { Request, Response, NextFunction } from 'express';
import financeService from '../services/financeService';

class FinanceController {
    // Accounts
    async getAccounts(req: Request, res: Response, next: NextFunction) {
        try {
            const accounts = await financeService.getAccounts((req as any).user.id);
            res.json({ success: true, data: accounts });
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
            const transactions = await financeService.getTransactions((req as any).user.id, req.query);
            res.json({ success: true, data: transactions });
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
            const categories = await financeService.getCategories();
            res.json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    }

    // Goals
    async getGoals(req: Request, res: Response, next: NextFunction) {
        try {
            const goals = await financeService.getGoals((req as any).user.id);
            res.json({ success: true, data: goals });
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
}

export default new FinanceController();
