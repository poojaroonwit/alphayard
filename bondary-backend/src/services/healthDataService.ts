import { prisma } from '../lib/prisma';

// Default health categories seeded for every new user
const DEFAULT_HEALTH_CATEGORIES = [
    {
        name: 'Physical Health', section: 'assets', type: 'asset',
        color: '#10B981', icon: 'arm-flex', sortOrder: 0,
        subCategories: ['Strength', 'Cardio', 'Mobility', 'Body Composition'],
    },
    {
        name: 'Mental & Sleep', section: 'assets', type: 'asset',
        color: '#3B82F6', icon: 'brain', sortOrder: 1,
        subCategories: ['Sleep Quality', 'Stress Management', 'Focus'],
    },
    {
        name: 'Nutrition', section: 'assets', type: 'asset',
        color: '#F59E0B', icon: 'food-apple', sortOrder: 2,
        subCategories: ['Protein', 'Micronutrients', 'Hydration'],
    },
    {
        name: 'Preventive Health', section: 'assets', type: 'asset',
        color: '#8B5CF6', icon: 'shield-check', sortOrder: 3,
        subCategories: ['Screening', 'Vaccines', 'Biomarkers'],
    },
    {
        name: 'Metabolic Risk', section: 'liabilities', type: 'liability',
        color: '#EF4444', icon: 'heart-pulse', sortOrder: 0,
        subCategories: ['Blood Sugar', 'Blood Pressure', 'Lipids'],
    },
    {
        name: 'Lifestyle Risk', section: 'liabilities', type: 'liability',
        color: '#F97316', icon: 'alert-circle', sortOrder: 1,
        subCategories: ['Sedentary Behavior', 'Alcohol', 'Smoking'],
    },
    {
        name: 'Mental Load', section: 'liabilities', type: 'liability',
        color: '#EC4899', icon: 'head-storm', sortOrder: 2,
        subCategories: ['Chronic Stress', 'Burnout', 'Sleep Debt'],
    },
    {
        name: 'Health Input', section: 'flow', type: 'input',
        color: '#34D399', icon: 'plus-circle', sortOrder: 0,
        subCategories: ['Workouts', 'Healthy Meals', 'Meditation/Recovery'],
    },
    {
        name: 'Health Output', section: 'flow', type: 'output',
        color: '#6366F1', icon: 'lightning-bolt', sortOrder: 1,
        subCategories: ['Energy Levels', 'Recovery Rate', 'Immunity'],
    },
    {
        name: 'Vital Signs', section: 'kpis', type: 'kpi',
        color: '#14B8A6', icon: 'activity', sortOrder: 0,
        subCategories: ['Biological Age', 'Resting HR', 'BMI', 'Sleep Score'],
    },
];

export class HealthDataService {
    // ── Default seeding ───────────────────────────────────────────────────────

    static async initializeDefaultsIfEmpty(userId: string) {
        const count = await prisma.healthCategory.count({ where: { userId } });
        if (count > 0) return; // already initialized

        for (const def of DEFAULT_HEALTH_CATEGORIES) {
            const { subCategories, ...catData } = def;
            const cat = await prisma.healthCategory.create({
                data: { userId, ...catData },
            });
            for (let i = 0; i < subCategories.length; i++) {
                await prisma.healthSubCategory.create({
                    data: { categoryId: cat.id, name: subCategories[i], sortOrder: i },
                });
            }
        }
    }

    // ── Categories ────────────────────────────────────────────────────────────

    static async getCategories(userId: string, section?: string) {
        return prisma.healthCategory.findMany({
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
        return prisma.healthCategory.create({ data: { userId, ...data } });
    }

    static async updateCategory(id: string, userId: string, data: {
        name?: string;
        color?: string;
        icon?: string;
        isArchived?: boolean;
    }) {
        const result = await prisma.healthCategory.updateMany({
            where: { id, userId },
            data,
        });
        if (result.count === 0) throw new Error('Category not found');
        return prisma.healthCategory.findFirst({ where: { id } });
    }

    static async deleteCategory(id: string, userId: string) {
        const result = await prisma.healthCategory.deleteMany({ where: { id, userId } });
        if (result.count === 0) throw new Error('Category not found');
    }

    // ── Sub-categories ────────────────────────────────────────────────────────

    static async createSubCategory(categoryId: string, userId: string, name: string) {
        const cat = await prisma.healthCategory.findFirst({ where: { id: categoryId, userId } });
        if (!cat) throw new Error('Category not found');

        const count = await prisma.healthSubCategory.count({ where: { categoryId } });
        return prisma.healthSubCategory.create({ data: { categoryId, name, sortOrder: count } });
    }

    static async updateSubCategory(id: string, userId: string, name: string) {
        const subCat = await prisma.healthSubCategory.findFirst({
            where: { id, category: { userId } },
        });
        if (!subCat) throw new Error('Sub-category not found');
        return prisma.healthSubCategory.update({ where: { id }, data: { name } });
    }

    static async deleteSubCategory(id: string, userId: string) {
        const subCat = await prisma.healthSubCategory.findFirst({
            where: { id, category: { userId } },
        });
        if (!subCat) throw new Error('Sub-category not found');
        await prisma.healthSubCategory.delete({ where: { id } });
    }

    // ── Records ───────────────────────────────────────────────────────────────

    static async getRecords(subCategoryId: string, userId: string) {
        const subCat = await prisma.healthSubCategory.findFirst({
            where: { id: subCategoryId, category: { userId } },
        });
        if (!subCat) throw new Error('Sub-category not found');

        return prisma.healthRecord.findMany({
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
        const subCat = await prisma.healthSubCategory.findFirst({
            where: { id: data.subCategoryId, category: { userId } },
        });
        if (!subCat) throw new Error('Sub-category not found');

        return prisma.healthRecord.create({
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
        const result = await prisma.healthRecord.deleteMany({ where: { id, userId } });
        if (result.count === 0) throw new Error('Record not found');
    }

    // ── Health summary ────────────────────────────────────────────────────────

    static async getHealthSummary(userId: string) {
        const categories = await prisma.healthCategory.findMany({
            where: { userId, isArchived: false },
            include: {
                subCategories: {
                    include: { records: { where: { userId } } },
                },
            },
        });

        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalInput = 0;
        let totalOutput = 0;

        categories.forEach(cat => {
            const total = cat.subCategories.reduce(
                (sum, sc) => sum + sc.records.reduce((s, r) => s + Number(r.amount), 0),
                0,
            );
            if (cat.section === 'assets') totalAssets += total;
            else if (cat.section === 'liabilities') totalLiabilities += total;
            else if (cat.type === 'input') totalInput += total;
            else if (cat.type === 'output') totalOutput += total;
        });

        return {
            totalAssets,
            totalLiabilities,
            healthScore: Math.max(0, totalAssets - totalLiabilities),
            totalInput,
            totalOutput,
            netFlow: totalInput - totalOutput,
        };
    }
}
