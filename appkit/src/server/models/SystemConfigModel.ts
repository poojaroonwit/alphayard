import { prisma } from '../lib/prisma';

export interface ISystemConfig {
    key: string;
    value: any;
    description?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export class SystemConfigModel {
    static async get(key: string): Promise<any> {
        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key },
                select: { value: true }
            });
            return config?.value ?? null;
        } catch (error: any) {
            // Gracefully handle missing table in dev environment
            if (error.code === 'P2021' || error.code === 'P2025') {
                console.warn(`[SystemConfig] Table missing or not found. Returning null for ${key}`);
                return null;
            }
            throw error;
        }
    }

    static async set(key: string, value: any, description?: string, _userId?: string): Promise<void> {
        await prisma.systemConfig.upsert({
            where: { key },
            update: {
                value,
                description: description || undefined,
                updatedAt: new Date()
            },
            create: {
                key,
                value,
                description
            }
        });
    }

    static async getAll(): Promise<Record<string, any>> {
        const configs = await prisma.systemConfig.findMany({
            select: { key: true, value: true }
        });
        
        const result: Record<string, any> = {};
        configs.forEach(config => {
            result[config.key] = config.value;
        });
        return result;
    }

    static async delete(key: string): Promise<boolean> {
        try {
            await prisma.systemConfig.delete({
                where: { key }
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}
