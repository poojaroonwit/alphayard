import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseService';
import { FinancialAccount, FinancialTransaction, FinancialCategory, FinancialBudget, FinancialGoal } from '../models/Financial';

class FinanceService {
    /**
     * Get all accounts for a user
     */
    async getAccounts(userId: string): Promise<FinancialAccount[]> {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('financial_accounts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Create a new account
     */
    async createAccount(accountData: Partial<FinancialAccount>): Promise<FinancialAccount> {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('financial_accounts')
            .insert([accountData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update an account
     */
    async updateAccount(accountId: string, updates: Partial<FinancialAccount>): Promise<FinancialAccount> {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('financial_accounts')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', accountId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete an account
     */
    async deleteAccount(accountId: string): Promise<boolean> {
        const client = getSupabaseClient();
        const { error } = await client
            .from('financial_accounts')
            .delete()
            .eq('id', accountId);

        if (error) throw error;
        return true;
    }

    /**
     * Get transactions
     */
    async getTransactions(userId: string, filters: any = {}): Promise<FinancialTransaction[]> {
        const client = getSupabaseClient();
        let query = client
            .from('financial_transactions')
            .select(`
          *,
          category:financial_categories(id, name, icon, color, type),
          account:financial_accounts(id, name, type, color)
        `)
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        // Add more filters as needed (date range, type, etc.)

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    /**
     * Create transaction and update account balance
     */
    async createTransaction(txData: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
        const client = getSupabaseClient();
        // We should ideally use a transaction block here if Supabase supported it easily via client,
        // but standard Supabase client doesn't support multi-statement transactions in one go easily without RPC.
        // For now we will do it sequentially.

        const { data: transaction, error } = await client
            .from('financial_transactions')
            .insert([txData])
            .select()
            .single();

        if (error) throw error;

        // Update account balance
        if (transaction && txData.account_id) {
            await this.updateAccountBalance(txData.account_id, txData.amount || 0, txData.type as any);
        }

        return transaction;
    }

    async updateAccountBalance(accountId: string, amount: number, type: 'income' | 'expense' | 'transfer') {
        const client = getSupabaseClient();
        // Calculate delta
        let delta = 0;
        if (type === 'income') delta = Number(amount);
        if (type === 'expense') delta = -Number(amount);
        // Transfer logic would be more complex (source vs dest), kept simple for MVP or assumed single ledger entry

        // Get current balance
        const { data: account } = await client
            .from('financial_accounts')
            .select('balance')
            .eq('id', accountId)
            .single();

        if (account) {
            const newBalance = Number(account.balance) + delta;
            await this.updateAccount(accountId, { balance: newBalance } as any);
        }
    }

    /**
     * Get Categories
     */
    async getCategories(): Promise<FinancialCategory[]> {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('financial_categories')
            .select('*')
            .order('type', { ascending: true }); // Group by type naturally

        if (error) throw error;
        return data || [];
    }

    // Budgets and Goals methods can be added similarly...
    /**
   * Get Goals
   */
    async getGoals(userId: string): Promise<FinancialGoal[]> {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('financial_goals')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    }

    async createGoal(goalData: Partial<FinancialGoal>): Promise<FinancialGoal> {
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('financial_goals')
            .insert([goalData])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export default new FinanceService();
