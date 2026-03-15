import apiClient from './api/apiClient';

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
    category?: {
        name: string;
        icon?: string;
        color?: string;
    };
    account: {
        name: string;
    };
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
    progress: number; // Frontend helper
}

export const financeService = {
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

    getCategories: async (): Promise<FinancialCategory[]> => {
        try {
            const response = await apiClient.get('/finance/categories');
            return response.data;
        } catch {
            return [];
        }
    },

    getGoals: async (): Promise<FinancialGoal[]> => {
        try {
            const response = await apiClient.get('/finance/goals');
            return response.data.map((g: any) => ({
                ...g,
                progress: Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
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
