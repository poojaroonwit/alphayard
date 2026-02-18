import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface IApplication {
    id: string;
    name: string;
    slug: string;
    description?: string;
    branding: any;
    settings: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class ApplicationModel {
    private data: IApplication;

    constructor(data: IApplication) {
        this.data = data;
    }

    get id() { return this.data.id; }
    get name() { return this.data.name; }
    get slug() { return this.data.slug; }
    get branding() { return this.data.branding; }
    get settings() { return this.data.settings; }

    static async findAll(): Promise<IApplication[]> {
        const apps = await prisma.application.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return apps.map(row => this.mapRow(row));
    }

    static async findById(id: string): Promise<IApplication | null> {
        const app = await prisma.application.findUnique({
            where: { id }
        });
        if (!app) return null;
        return this.mapRow(app);
    }

    static async findBySlug(slug: string): Promise<IApplication | null> {
        const app = await prisma.application.findUnique({
            where: { slug }
        });
        if (!app) return null;
        return this.mapRow(app);
    }

    static async create(data: Partial<IApplication>): Promise<IApplication> {
        const id = data.id || uuidv4();
        const app = await prisma.application.create({
            data: {
                id,
                name: data.name!,
                slug: data.slug!,
                description: data.description || '',
                branding: data.branding || {},
                settings: data.settings || {}
            }
        });
        return this.mapRow(app);
    }

    static async update(id: string, data: Partial<IApplication>): Promise<IApplication | null> {
        const updateData: any = {};

        if (data.name) updateData.name = data.name;
        if (data.slug) updateData.slug = data.slug;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.branding) updateData.branding = data.branding;
        if (data.settings) updateData.settings = data.settings;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        if (Object.keys(updateData).length === 0) return this.findById(id);

        const app = await prisma.application.update({
            where: { id },
            data: {
                ...updateData,
                updatedAt: new Date()
            }
        });

        return this.mapRow(app);
    }

    // Versioning Support - These would need a separate ApplicationVersion model in Prisma
    // For now, keeping basic implementation that would work with raw queries if needed
    static async getVersions(applicationId: string): Promise<any[]> {
        // Note: ApplicationVersion model would need to be added to Prisma schema
        // This is a placeholder that returns empty array
        console.warn('[ApplicationModel.getVersions] ApplicationVersion model not yet in Prisma schema');
        return [];
    }

    static async getVersion(applicationId: string, versionId: string): Promise<any | null> {
        console.warn('[ApplicationModel.getVersion] ApplicationVersion model not yet in Prisma schema');
        return null;
    }

    static async getLatestDraft(applicationId: string): Promise<any | null> {
        console.warn('[ApplicationModel.getLatestDraft] ApplicationVersion model not yet in Prisma schema');
        return null;
    }

    static async createVersion(applicationId: string, data: { branding: any, settings: any, status: 'draft' | 'published' }): Promise<any> {
        console.warn('[ApplicationModel.createVersion] ApplicationVersion model not yet in Prisma schema');
        return null;
    }

    static async updateVersion(versionId: string, data: Partial<{ branding: any, settings: any, status: string }>): Promise<any> {
        console.warn('[ApplicationModel.updateVersion] ApplicationVersion model not yet in Prisma schema');
        return null;
    }

    static async publishVersion(applicationId: string, versionId: string): Promise<void> {
        console.warn('[ApplicationModel.publishVersion] ApplicationVersion model not yet in Prisma schema');
    }

    private static mapRow(row: any): IApplication {
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            branding: row.branding,
            settings: row.settings,
            isActive: row.isActive,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        };
    }
}
