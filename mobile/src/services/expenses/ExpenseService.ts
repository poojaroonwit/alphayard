import { apiClient } from '../api/apiClient';
import { unwrapEntity } from '../collectionService';
import { analyticsService } from '../analytics/AnalyticsService';

export interface Expense {
  id: string;
  circleId: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: 'food' | 'transportation' | 'entertainment' | 'healthcare' | 'education' | 'shopping' | 'utilities' | 'housing' | 'insurance' | 'other';
  subcategory?: string;
  date: Date;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_payment' | 'other';
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDueDate?: Date;
  status: 'pending' | 'paid' | 'cancelled';
  tags: string[];
  attachments?: string[];
  sharedWith: string[]; // Circle member IDs
  splitType: 'equal' | 'percentage' | 'fixed' | 'none';
  splitDetails?: Array<{
    userId: string;
    amount: number;
    percentage?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  circleId: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  categories: Array<{
    category: string;
    limit: number;
    spent: number;
  }>;
  isActive: boolean;
  notifications: boolean;
  alertThreshold: number; // percentage
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseReport {
  period: string;
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  memberBreakdown: Array<{
    userId: string;
    userName: string;
    amount: number;
    percentage: number;
  }>;
  topExpenses: Expense[];
  trends: Array<{
    date: string;
    amount: number;
  }>;
}

export interface ExpenseStats {
  totalExpenses: number;
  monthlyAverage: number;
  topCategory: string;
  topCategoryAmount: number;
  recentExpenses: number;
  upcomingRecurring: number;
  budgetUtilization: number;
}

class ExpenseService {
  async getExpenses(circleId: string, filters?: {
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    userId?: string;
    status?: string;
  }): Promise<Expense[]> {
    try {
      const params = new URLSearchParams();
      params.append('circleId', circleId);
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
      if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.status) params.append('status', filters.status);

      const response = await apiClient.get(`/expenses?${params.toString()}`);
      return (response.data || []).map(unwrapEntity);
    } catch (error) {
      console.error('Failed to get expenses:', error);
      throw error;
    }
  }

  async getExpense(expenseId: string): Promise<Expense> {
    try {
      const response = await apiClient.get(`/expenses/${expenseId}`);
      return unwrapEntity(response.data);
    } catch (error) {
      console.error('Failed to get expense:', error);
      throw error;
    }
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    try {
      const response = await apiClient.post('/expenses', expense);
      
      analyticsService.trackEvent('expense_created', {
        amount: expense.amount,
        category: expense.category,
        isRecurring: expense.isRecurring,
        userId: expense.userId
      });
      
      return unwrapEntity(response.data);
    } catch (error) {
      console.error('Failed to create expense:', error);
      throw error;
    }
  }

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    try {
      const response = await apiClient.put(`/expenses/${expenseId}`, updates);
      
      analyticsService.trackEvent('expense_updated', {
        expenseId,
        amount: updates.amount,
        category: updates.category
      });
      
      return unwrapEntity(response.data);
    } catch (error) {
      console.error('Failed to update expense:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      await apiClient.delete(`/expenses/${expenseId}`);
      
      analyticsService.trackEvent('expense_deleted', {
        expenseId
      });
    } catch (error) {
      console.error('Failed to delete expense:', error);
      throw error;
    }
  }

  async getBudgets(circleId: string): Promise<Budget[]> {
    try {
      const response = await apiClient.get(`/expenses/budgets?circleId=${circleId}`);
      return (response.data || []).map(unwrapEntity);
    } catch (error) {
      console.error('Failed to get budgets:', error);
      throw error;
    }
  }

  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<Budget> {
    try {
      const response = await apiClient.post('/expenses/budgets', budget);
      
      analyticsService.trackEvent('budget_created', {
        amount: budget.amount,
        period: budget.period,
        categoriesCount: budget.categories.length
      });
      
      return unwrapEntity(response.data);
    } catch (error) {
      console.error('Failed to create budget:', error);
      throw error;
    }
  }

  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<Budget> {
    try {
      const response = await apiClient.put(`/expenses/budgets/${budgetId}`, updates);
      
      analyticsService.trackEvent('budget_updated', {
        budgetId,
        amount: updates.amount
      });
      
      return unwrapEntity(response.data);
    } catch (error) {
      console.error('Failed to update budget:', error);
      throw error;
    }
  }

  async deleteBudget(budgetId: string): Promise<void> {
    try {
      await apiClient.delete(`/expenses/budgets/${budgetId}`);
      
      analyticsService.trackEvent('budget_deleted', {
        budgetId
      });
    } catch (error) {
      console.error('Failed to delete budget:', error);
      throw error;
    }
  }

  async getExpenseStats(circleId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<ExpenseStats> {
    try {
      const response = await apiClient.get(`/expenses/stats?circleId=${circleId}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get expense stats:', error);
      throw error;
    }
  }

  async getExpenseReport(circleId: string, startDate: Date, endDate: Date): Promise<ExpenseReport> {
    try {
      const response = await apiClient.get(`/expenses/report?circleId=${circleId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get expense report:', error);
      throw error;
    }
  }

  async searchExpenses(query: string, circleId: string): Promise<Expense[]> {
    try {
      const response = await apiClient.get(`/expenses/search?q=${encodeURIComponent(query)}&circleId=${circleId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search expenses:', error);
      throw error;
    }
  }

  async getRecurringExpenses(circleId: string): Promise<Expense[]> {
    try {
      const response = await apiClient.get(`/expenses/recurring?circleId=${circleId}`);
      return (response.data || []).map(unwrapEntity);
    } catch (error) {
      console.error('Failed to get recurring expenses:', error);
      throw error;
    }
  }

  async getUpcomingExpenses(circleId: string, days: number = 30): Promise<Expense[]> {
    try {
      const response = await apiClient.get(`/expenses/upcoming?circleId=${circleId}&days=${days}`);
      return (response.data || []).map(unwrapEntity);
    } catch (error) {
      console.error('Failed to get upcoming expenses:', error);
      throw error;
    }
  }

  async splitExpense(expenseId: string, splitDetails: Array<{
    userId: string;
    amount: number;
    percentage?: number;
  }>): Promise<Expense> {
    try {
      const response = await apiClient.post(`/expenses/${expenseId}/split`, { splitDetails });
      
      analyticsService.trackEvent('expense_split', {
        expenseId,
        splitCount: splitDetails.length
      });
      
      return unwrapEntity(response.data);
    } catch (error) {
      console.error('Failed to split expense:', error);
      throw error;
    }
  }

  async shareExpense(expenseId: string, recipients: string[]): Promise<void> {
    try {
      await apiClient.post(`/expenses/${expenseId}/share`, { recipients });
      
      analyticsService.trackEvent('expense_shared', {
        expenseId,
        recipientsCount: recipients.length
      });
    } catch (error) {
      console.error('Failed to share expense:', error);
      throw error;
    }
  }

  async exportExpenses(circleId: string, format: 'pdf' | 'csv' | 'excel' = 'pdf', dateRange?: { start: Date; end: Date }): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('circleId', circleId);
      params.append('format', format);
      if (dateRange) {
        params.append('startDate', dateRange.start.toISOString());
        params.append('endDate', dateRange.end.toISOString());
      }

      const response = await apiClient.get(`/expenses/export?${params.toString()}`);
      
      analyticsService.trackEvent('expenses_exported', {
        format,
        circleId
      });
      
      return response.data.downloadUrl;
    } catch (error) {
      console.error('Failed to export expenses:', error);
      throw error;
    }
  }

  async getExpenseCategories(): Promise<Array<{
    category: string;
    subcategories: string[];
    icon: string;
    color: string;
  }>> {
    try {
      const response = await apiClient.get('/expenses/categories');
      return response.data;
    } catch (error) {
      console.error('Failed to get expense categories:', error);
      throw error;
    }
  }

  async getPaymentMethods(): Promise<Array<{
    method: string;
    icon: string;
    isActive: boolean;
  }>> {
    try {
      const response = await apiClient.get('/expenses/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      throw error;
    }
  }

  async setExpenseReminder(reminder: {
    circleId: string;
    userId: string;
    title: string;
    amount: number;
    dueDate: Date;
    frequency: 'once' | 'weekly' | 'monthly';
    isActive: boolean;
  }): Promise<void> {
    try {
      await apiClient.post('/expenses/reminders', reminder);
      
      analyticsService.trackEvent('expense_reminder_set', {
        amount: reminder.amount,
        frequency: reminder.frequency,
        userId: reminder.userId
      });
    } catch (error) {
      console.error('Failed to set expense reminder:', error);
      throw error;
    }
  }

  async getExpenseReminders(circleId: string): Promise<Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: Date;
    frequency: string;
    isActive: boolean;
  }>> {
    try {
      const response = await apiClient.get(`/expenses/reminders?circleId=${circleId}`);
      return (response.data || []).map(unwrapEntity);
    } catch (error) {
      console.error('Failed to get expense reminders:', error);
      throw error;
    }
  }

  async getExpenseInsights(circleId: string): Promise<Array<{
    type: 'spending_trend' | 'category_alert' | 'budget_warning' | 'savings_opportunity';
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
    data?: any;
  }>> {
    try {
      const response = await apiClient.get(`/expenses/insights?circleId=${circleId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get expense insights:', error);
      throw error;
    }
  }
}

export const expenseService = new ExpenseService(); 
