export interface FinancialAccount {
    id: string;
    user_id: string;
    circle_id?: string | null;
    name: string;
    type: 'cash' | 'bank' | 'credit_card' | 'investment' | 'loan' | 'other';
    balance: number;
    currency: string;
    color?: string;
    is_included_in_net_worth: boolean;
    created_at: string;
    updated_at: string;
}

export interface FinancialCategory {
    id: string;
    name: string;
    type: 'income' | 'expense';
    icon?: string;
    color?: string;
    parent_category_id?: string | null;
    is_system_default: boolean;
    created_at: string;
}

export interface FinancialTransaction {
    id: string;
    user_id: string;
    account_id: string;
    category_id?: string | null;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    date: string;
    note?: string;
    is_circle_shared: boolean;
    location_label?: string;
    created_at: string;
    updated_at: string;
}

export interface FinancialBudget {
    id: string;
    user_id: string;
    category_id: string;
    amount_limit: number;
    period: 'monthly' | 'weekly';
    start_date: string;
    created_at: string;
    updated_at: string;
}

export interface FinancialGoal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date?: string;
    color?: string;
    created_at: string;
    updated_at: string;
}

