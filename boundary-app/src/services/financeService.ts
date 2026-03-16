import apiClient from './api/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FinancialAccount {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    color?: string;
}

export interface FinancialTransaction {
    id: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    date: string;
    note?: string;
    category?: { name: string; icon?: string; color?: string };
    account: { name: string };
}

export interface FinancialCategory {
    id: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
}

export interface FinancialGoal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date?: string;
    progress: number;
}

// Net-worth tracker types
export interface FinanceRecord {
    id: string;
    subCategoryId: string;
    userId: string;
    name: string;
    amount: number;
    recordDate: string; // ISO date string from server
    note?: string;
    createdAt: string;
}

export interface FinanceSubCategory {
    id: string;
    categoryId: string;
    name: string;
    sortOrder: number;
    records: FinanceRecord[];
}

export interface FinanceCategory {
    id: string;
    userId: string;
    name: string;
    section: 'assets' | 'debts' | 'cashflow';
    type: 'asset' | 'debt' | 'income' | 'expense';
    color: string;
    icon: string;
    sortOrder: number;
    subCategories: FinanceSubCategory[];
}

export interface NetWorthSummary {
    totalAssets: number;
    totalDebts: number;
    netWorth: number;
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const financeService = {
    // ── Net-worth categories ──────────────────────────────────────────────────

    getCategories: async (section?: string): Promise<FinanceCategory[]> => {
        try {
            const response = await apiClient.get('/finance/categories', {
                params: section ? { section } : undefined,
            });
            return response.data;
        } catch {
            return [];
        }
    },

    createCategory: async (data: {
        name: string;
        section: string;
        type: string;
        color: string;
        icon: string;
    }): Promise<FinanceCategory> => {
        const response = await apiClient.post('/finance/categories', data);
        return response.data;
    },

    updateCategory: async (id: string, data: {
        name?: string;
        color?: string;
        icon?: string;
        isArchived?: boolean;
    }): Promise<FinanceCategory> => {
        const response = await apiClient.put(`/finance/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: string): Promise<void> => {
        await apiClient.delete(`/finance/categories/${id}`);
    },

    // ── Sub-categories ────────────────────────────────────────────────────────

    createSubCategory: async (categoryId: string, name: string): Promise<FinanceSubCategory> => {
        const response = await apiClient.post(`/finance/categories/${categoryId}/subcategories`, { name });
        return response.data;
    },

    updateSubCategory: async (id: string, name: string): Promise<FinanceSubCategory> => {
        const response = await apiClient.put(`/finance/subcategories/${id}`, { name });
        return response.data;
    },

    deleteSubCategory: async (id: string): Promise<void> => {
        await apiClient.delete(`/finance/subcategories/${id}`);
    },

    // ── Records ───────────────────────────────────────────────────────────────

    getRecords: async (subCatId: string): Promise<FinanceRecord[]> => {
        try {
            const response = await apiClient.get(`/finance/subcategories/${subCatId}/records`);
            return response.data;
        } catch {
            return [];
        }
    },

    createRecord: async (subCatId: string, data: {
        name: string;
        amount: number;
        date: string;
        note?: string;
    }): Promise<FinanceRecord> => {
        const response = await apiClient.post(`/finance/subcategories/${subCatId}/records`, data);
        return response.data;
    },

    deleteRecord: async (id: string): Promise<void> => {
        await apiClient.delete(`/finance/records/${id}`);
    },

    // ── Summary ───────────────────────────────────────────────────────────────

    getNetWorth: async (): Promise<NetWorthSummary> => {
        try {
            const response = await apiClient.get('/finance/net-worth');
            return response.data;
        } catch {
            return { totalAssets: 0, totalDebts: 0, netWorth: 0, totalIncome: 0, totalExpense: 0, netCashFlow: 0 };
        }
    },

    // ── Legacy methods (kept for compatibility) ───────────────────────────────

    getAccounts: async (): Promise<FinancialAccount[]> => {
        try {
            const response = await apiClient.get('/finance/accounts');
            return response.data;
        } catch {
            return [];
        }
    },

    createAccount: async (data: Partial<FinancialAccount>) => {
        const response = await apiClient.post('/finance/accounts', data);
        return response.data;
    },

    getTransactions: async (filters?: any): Promise<FinancialTransaction[]> => {
        try {
            const response = await apiClient.get('/finance/transactions', { params: filters });
            return response.data;
        } catch {
            return [];
        }
    },

    createTransaction: async (data: any) => {
        const response = await apiClient.post('/finance/transactions', data);
        return response.data;
    },

    getGoals: async (): Promise<FinancialGoal[]> => {
        try {
            const response = await apiClient.get('/finance/goals');
            return response.data.map((g: any) => ({
                ...g,
                progress: Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)),
            }));
        } catch {
            return [];
        }
    },

    createGoal: async (data: any) => {
        const response = await apiClient.post('/finance/goals', data);
        return response.data;
    },
};
