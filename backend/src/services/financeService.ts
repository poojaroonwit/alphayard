import entityService from './EntityService';
import { FinancialAccount, FinancialTransaction, FinancialGoal } from '../models/Financial';

class FinanceService {
    // Accounts
    async getAccounts(userId: string) {
        return entityService.queryEntities('finance_account', {
            ownerId: userId,
            status: 'active'
        } as any);
    }

    async createAccount(data: any) {
        const { user_id, ...attributes } = data;
        return entityService.createEntity({
            typeName: 'finance_account',
            ownerId: user_id,
            attributes
        });
    }

    async updateAccount(id: string, attributes: any) {
        return entityService.updateEntity(id, { attributes });
    }

    async deleteAccount(id: string) {
        return entityService.deleteEntity(id);
    }

    // Transactions
    async getTransactions(userId: string, filters: any = {}) {
        return entityService.queryEntities('finance_transaction', {
            ownerId: userId,
            filters
        } as any);
    }

    async createTransaction(data: any) {
        const { user_id, ...attributes } = data;
        return entityService.createEntity({
            typeName: 'finance_transaction',
            ownerId: user_id,
            attributes
        });
    }

    // Categories (Can be entities or static defaults)
    async getCategories() {
        return entityService.queryEntities('finance_category', {
            status: 'active'
        } as any);
    }

    // Goals
    async getGoals(userId: string) {
        return entityService.queryEntities('finance_goal', {
            ownerId: userId
        } as any);
    }

    async createGoal(data: any) {
        const { user_id, ...attributes } = data;
        return entityService.createEntity({
            typeName: 'finance_goal',
            ownerId: user_id,
            attributes
        });
    }

    // Budgets
    async getBudgets(circleId: string) {
        return entityService.queryEntities('finance_budget', {
            applicationId: circleId,
            status: 'active'
        } as any);
    }

    async createBudget(data: any) {
        return entityService.createEntity({
            typeName: 'finance_budget',
            ownerId: data.ownerId,
            applicationId: data.circleId,
            attributes: data
        });
    }

    async updateBudget(id: string, attributes: any) {
        return entityService.updateEntity(id, { attributes });
    }

    async deleteBudget(id: string) {
        return entityService.deleteEntity(id);
    }

    // Stats & Reports (Stubs for now)
    async getExpenseStats(circleId: string, period: string) {
        // Implementation: Aggregation over finance_transaction entities
        return {
            totalExpenses: 0,
            monthlyAverage: 0,
            topCategory: 'Other',
            topCategoryAmount: 0,
            recentExpenses: 0,
            upcomingRecurring: 0,
            budgetUtilization: 0
        };
    }

    async getExpenseReport(circleId: string, options: any) {
        return {
            period: options.startDate || 'Current',
            totalExpenses: 0,
            totalIncome: 0,
            netAmount: 0,
            categoryBreakdown: [],
            memberBreakdown: [],
            topExpenses: [],
            trends: []
        };
    }

    async getExpenseInsights(circleId: string) {
        return [];
    }

    // Search & Recurring
    async searchExpenses(query: string, circleId: string) {
        return entityService.searchEntities('finance_transaction', query, { applicationId: circleId });
    }

    async getRecurringExpenses(circleId: string) {
        return (await entityService.queryEntities('finance_transaction', {
            applicationId: circleId,
            status: 'active',
            filters: { isRecurring: 'true' }
        } as any)).entities;
    }

    async getUpcomingExpenses(circleId: string, days: number) {
        return (await entityService.queryEntities('finance_transaction', {
            applicationId: circleId,
            status: 'active',
            filters: { status: 'pending' }
        } as any)).entities;
    }

    async getPaymentMethods() {
        return [
            { method: 'cash', icon: 'cash', isActive: true },
            { method: 'card', icon: 'card', isActive: true },
            { method: 'bank_transfer', icon: 'bank', isActive: true },
            { method: 'mobile_payment', icon: 'cellphone', isActive: true }
        ];
    }

    async getExpenseReminders(circleId: string) {
        return (await entityService.queryEntities('finance_reminder', {
            applicationId: circleId,
            status: 'active'
        } as any)).entities;
    }

    async setExpenseReminder(data: any) {
        return entityService.createEntity({
            typeName: 'finance_reminder',
            ownerId: data.userId,
            applicationId: data.circleId,
            attributes: data
        });
    }
}

export default new FinanceService();
