import { prisma } from '../lib/prisma';

export interface Application {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    domain?: string;
    branding?: any;
    isActive: boolean;
    settings: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateApplicationData {
    name: string;
    displayName: string;
    description?: string;
    domain?: string;
    isActive?: boolean;
    settings?: any;
}

export interface UpdateApplicationData {
    displayName?: string;
    description?: string;
    domain?: string;
    isActive?: boolean;
    settings?: any;
}

/**
 * Application Model
 * 
 * Handles database operations for applications.
 */
class ApplicationModel {
    async create(data: CreateApplicationData): Promise<Application> {
        const result = await prisma.$queryRaw<any[]>`
            INSERT INTO applications (
                id, name, display_name, description, domain, is_active, settings, created_at, updated_at
            )
            VALUES (
                gen_random_uuid()::uuid,
                ${data.name},
                ${data.displayName},
                ${data.description || null},
                ${data.domain || null},
                ${data.isActive !== undefined ? data.isActive : true},
                ${JSON.stringify(data.settings || {})}::jsonb,
                NOW(),
                NOW()
            )
            RETURNING *
        `;

        return this.mapRowToApplication(result[0]);
    }

    async findById(id: string): Promise<Application | null> {
        const result = await prisma.$queryRaw<any[]>`
            SELECT * FROM applications WHERE id = ${id}::uuid
        `;

        if (!result[0]) return null;
        return this.mapRowToApplication(result[0]);
    }

    async findByName(name: string): Promise<Application | null> {
        const result = await prisma.$queryRaw<any[]>`
            SELECT * FROM applications WHERE name = ${name}
        `;

        if (!result[0]) return null;
        return this.mapRowToApplication(result[0]);
    }

    async findAll(page: number = 1, limit: number = 20): Promise<{
        applications: Application[];
        total: number;
        page: number;
        limit: number;
    }> {
        const offset = (page - 1) * limit;

        // Get total count
        const countResult = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*) as total FROM applications
        `;
        const total = parseInt(countResult[0].total, 10);

        // Get applications
        const result = await prisma.$queryRaw<any[]>`
            SELECT * FROM applications 
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
        `;

        return {
            applications: result.map(this.mapRowToApplication),
            total,
            page,
            limit
        };
    }

    async update(id: string, data: UpdateApplicationData): Promise<Application | null> {
        const updates: string[] = [];
        const params: any[] = [];

        if (data.displayName !== undefined) {
            updates.push(`display_name = $${params.length + 1}`);
            params.push(data.displayName);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${params.length + 1}`);
            params.push(data.description);
        }
        if (data.domain !== undefined) {
            updates.push(`domain = $${params.length + 1}`);
            params.push(data.domain);
        }
        if (data.isActive !== undefined) {
            updates.push(`is_active = $${params.length + 1}`);
            params.push(data.isActive);
        }
        if (data.settings !== undefined) {
            updates.push(`settings = $${params.length + 1}::jsonb`);
            params.push(JSON.stringify(data.settings));
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        updates.push(`updated_at = NOW()`);

        const query = `
            UPDATE applications 
            SET ${updates.join(', ')}
            WHERE id = $${params.length + 1}::uuid
            RETURNING *
        `;
        params.push(id);

        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        if (!result[0]) return null;
        return this.mapRowToApplication(result[0]);
    }

    async delete(id: string): Promise<boolean> {
        const result = await prisma.$executeRaw`
            DELETE FROM applications WHERE id = ${id}::uuid
        `;
        return result > 0;
    }

    async getVersions(id: string): Promise<any[]> {
        // Mock implementation - return empty array for now
        return [];
    }

    async createVersion(id: string, data: any): Promise<any> {
        // Mock implementation - return null for now
        return null;
    }

    async updateVersion(versionId: string, data: any): Promise<any> {
        // Mock implementation - return null for now
        return null;
    }

    async publishVersion(id: string, versionId: string): Promise<void> {
        // Mock implementation - do nothing for now
        console.log(`Publishing version ${versionId} for application ${id}`);
    }

    private mapRowToApplication(row: any): Application {
        return {
            id: row.id,
            name: row.name,
            displayName: row.display_name,
            description: row.description,
            domain: row.domain,
            branding: row.branding || {},
            isActive: row.is_active,
            settings: row.settings || {},
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}

export default new ApplicationModel();
export { ApplicationModel };
