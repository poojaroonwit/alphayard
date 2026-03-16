import { prisma } from '../lib/prisma';

// Default categories seeded for every new user
const DEFAULT_CATEGORIES = [
    {
        name: 'Liquid Assets', section: 'assets', type: 'asset',
        color: '#3B82F6', icon: 'wallet', sortOrder: 0,
        subCategories: ['Physical Cash', 'Bank Account', 'Emergency Fund'],
    },
    {
        name: 'Investment Assets', section: 'assets', type: 'asset',
        color: '#8B5CF6', icon: 'trending-up', sortOrder: 1,
        subCategories: ['Stocks', 'ETFs', 'Crypto'],
    },
    {
        name: 'Retirement Assets', section: 'assets', type: 'asset',
        color: '#10B981', icon: 'umbrella-beach', sortOrder: 2,
        subCategories: ['Pension Fund', 'Provident Fund'],
    },
    {
        name: 'Real Assets', section: 'assets', type: 'asset',
        color: '#F59E0B', icon: 'home-city', sortOrder: 3,
        subCategories: ['Property', 'Land', 'Vehicle'],
    },
    {
        name: 'Business Assets', section: 'assets', type: 'asset',
        color: '#EF4444', icon: 'office-building', sortOrder: 4,
        subCategories: ['Inventory', 'Equipment'],
    },
    {
        name: 'Long-term Debt', section: 'debts', type: 'debt',
        color: '#6366F1', icon: 'home', sortOrder: 0,
        subCategories: ['Mortgage', 'Car Loan'],
    },
    {
        name: 'Short-term Debt', section: 'debts', type: 'debt',
        color: '#EC4899', icon: 'credit-card', sortOrder: 1,
        subCategories: ['Credit Card', 'Personal Loan'],
    },
    {
        name: 'Other Obligations', section: 'debts', type: 'debt',
        color: '#94A3B8', icon: 'alert-circle', sortOrder: 2,
        subCategories: ['Tax Payable', 'Other'],
    },
    {
        name: 'Salary', section: 'cashflow', type: 'income',
        color: '#10B981', icon: 'briefcase', sortOrder: 0,
        subCategories: ['Base Salary', 'Bonus', 'Overtime'],
    },
    {
        name: 'Passive Income', section: 'cashflow', type: 'income',
        color: '#34D399', icon: 'chart-line', sortOrder: 1,
        subCategories: ['Dividends', 'Rental Income', 'Interest'],
    },
    {
        name: 'Living Expenses', section: 'cashflow', type: 'expense',
        color: '#F87171', icon: 'home-outline', sortOrder: 0,
        subCategories: ['Rent', 'Utilities', 'Food'],
    },
    {
        name: 'Leisure', section: 'cashflow', type: 'expense',
        color: '#FB7185', icon: 'movie-outline', sortOrder: 1,
        subCategories: ['Travel', 'Entertainment', 'Dining Out'],
    },
    {
        name: 'Investments', section: 'cashflow', type: 'expense',
        color: '#FCA5A5', icon: 'chart-areaspline', sortOrder: 2,
        subCategories: ['ETF Contribution', 'Savings Deposit'],
    },
];

export class FinanceDataService {
    // ── Default seeding ───────────────────────────────────────────────────────

    static async initializeDefaultsIfEmpty(userId: string) {
        const count = await prisma.financeCategory.count({ where: { userId } });
        if (count > 0) return; // already initialized

        for (const def of DEFAULT_CATEGORIES) {
            const { subCategories, ...catData } = def;
            const cat = await prisma.financeCategory.create({
                data: { userId, ...catData },
            });
            for (let i = 0; i < subCategories.length; i++) {
                await prisma.financeSubCategory.create({
                    data: { categoryId: cat.id, name: subCategories[i], sortOrder: i },
                });
            }
        }
    }

    // ── Categories ────────────────────────────────────────────────────────────

    static async getCategories(userId: string, section?: string) {
        return prisma.financeCategory.findMany({
            where: {
                userId,
                isArchived: false,
                ...(section ? { section } : {}),
            },
            include: {
                subCategories: {
                    where: { isArchived: false },
                    include: {
                        records: {
                            where: { userId },
                            orderBy: { recordDate: 'desc' },
                        },
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
    }

    static async createCategory(userId: string, data: {
        name: string;
        section: string;
        type: string;
        color: string;
        icon: string;
    }) {
        return prisma.financeCategory.create({ data: { userId, ...data } });
    }

    static async updateCategory(id: string, userId: string, data: {
        name?: string;
        color?: string;
        icon?: string;
        isArchived?: boolean;
    }) {
        const result = await prisma.financeCategory.updateMany({
            where: { id, userId },
            data,
        });
        if (result.count === 0) throw new Error('Category not found');
        return prisma.financeCategory.findFirst({ where: { id } });
    }

    static async deleteCategory(id: string, userId: string) {
        const result = await prisma.financeCategory.deleteMany({ where: { id, userId } });
        if (result.count === 0) throw new Error('Category not found');
    }

    // ── Sub-categories ────────────────────────────────────────────────────────

    static async createSubCategory(categoryId: string, userId: string, name: string) {
        const cat = await prisma.financeCategory.findFirst({ where: { id: categoryId, userId } });
        if (!cat) throw new Error('Category not found');

        const count = await prisma.financeSubCategory.count({ where: { categoryId } });
        return prisma.financeSubCategory.create({ data: { categoryId, name, sortOrder: count } });
    }

    static async updateSubCategory(id: string, userId: string, name: string) {
        const subCat = await prisma.financeSubCategory.findFirst({
            where: { id, category: { userId } },
        });
        if (!subCat) throw new Error('Sub-category not found');
        return prisma.financeSubCategory.update({ where: { id }, data: { name } });
    }

    static async deleteSubCategory(id: string, userId: string) {
        const subCat = await prisma.financeSubCategory.findFirst({
            where: { id, category: { userId } },
        });
        if (!subCat) throw new Error('Sub-category not found');
        await prisma.financeSubCategory.delete({ where: { id } });
    }

    // ── Records ───────────────────────────────────────────────────────────────

    static async getRecords(subCategoryId: string, userId: string) {
        const subCat = await prisma.financeSubCategory.findFirst({
            where: { id: subCategoryId, category: { userId } },
        });
        if (!subCat) throw new Error('Sub-category not found');

        return prisma.financeRecord.findMany({
            where: { subCategoryId, userId },
            orderBy: { recordDate: 'desc' },
        });
    }

    static async createRecord(userId: string, data: {
        subCategoryId: string;
        name: string;
        amount: number;
        date: string;
        note?: string;
    }) {
        const subCat = await prisma.financeSubCategory.findFirst({
            where: { id: data.subCategoryId, category: { userId } },
        });
        if (!subCat) throw new Error('Sub-category not found');

        return prisma.financeRecord.create({
            data: {
                subCategoryId: data.subCategoryId,
                userId,
                name: data.name,
                amount: data.amount,
                recordDate: new Date(data.date),
                note: data.note,
            },
        });
    }

    static async deleteRecord(id: string, userId: string) {
        const result = await prisma.financeRecord.deleteMany({ where: { id, userId } });
        if (result.count === 0) throw new Error('Record not found');
    }

    // ── Net-worth summary ─────────────────────────────────────────────────────

    static async getNetWorth(userId: string) {
        const categories = await prisma.financeCategory.findMany({
            where: { userId, isArchived: false },
            include: {
                subCategories: {
                    include: { records: { where: { userId } } },
                },
            },
        });

        let totalAssets = 0;
        let totalDebts = 0;
        let totalIncome = 0;
        let totalExpense = 0;

        categories.forEach(cat => {
            const total = cat.subCategories.reduce(
                (sum, sc) => sum + sc.records.reduce((s, r) => s + Number(r.amount), 0),
                0,
            );
            if (cat.section === 'assets') totalAssets += total;
            else if (cat.section === 'debts') totalDebts += total;
            else if (cat.type === 'income') totalIncome += total;
            else if (cat.type === 'expense') totalExpense += total;
        });

        return {
            totalAssets,
            totalDebts,
            netWorth: totalAssets - totalDebts,
            totalIncome,
            totalExpense,
            netCashFlow: totalIncome - totalExpense,
        };
    }
}
