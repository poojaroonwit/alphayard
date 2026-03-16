import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
    // ── Assets ────────────────────────────────────────────────────────────────
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
    // ── Debts ─────────────────────────────────────────────────────────────────
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
    // ── Cash Flow: Income ─────────────────────────────────────────────────────
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
    // ── Cash Flow: Expense ────────────────────────────────────────────────────
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

async function seedFinanceForUser(userId: string) {
    const existing = await prisma.financeCategory.count({ where: { userId } });
    if (existing > 0) {
        console.log(`  ↳ User ${userId}: already has ${existing} categories, skipping`);
        return;
    }

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

    console.log(`  ↳ User ${userId}: seeded ${DEFAULT_CATEGORIES.length} categories`);
}

async function main() {
    console.log('🌱 Seeding default finance categories...\n');

    const users = await prisma.user.findMany({
        select: { id: true, email: true },
        where: { isActive: true },
    });

    console.log(`Found ${users.length} active user(s)\n`);

    for (const user of users) {
        console.log(`User: ${user.email}`);
        await seedFinanceForUser(user.id);
    }

    console.log('\n✅ Finance seed complete');
}

main()
    .catch(e => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
