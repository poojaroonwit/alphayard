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
        const response = await apiClient.get('/finance/accounts');
        return response.data;
    },

    createAccount: async (data: Partial<FinancialAccount>) => {
        const response = await apiClient.post('/finance/accounts', data);
        return response.data;
    },

    getTransactions: async (filters?: any): Promise<FinancialTransaction[]> => {
        const response = await apiClient.get('/finance/transactions', { params: filters });
        return response.data;
    },

    createTransaction: async (data: any) => {
        const response = await apiClient.post('/finance/transactions', data);
        return response.data;
    },

    getCategories: async () => {
        const response = await apiClient.get('/finance/categories');
        return response.data;
    },

    getGoals: async (): Promise<FinancialGoal[]> => {
        const response = await apiClient.get('/finance/goals');
        // Calculate progress for frontend
        return response.data.map((g: any) => ({
            ...g,
            progress: Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
        }));
    },

    createGoal: async (data: any) => {
        const response = await apiClient.post('/finance/goals', data);
        return response.data;
    },
};
