import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

/**
 * Entity types and interfaces
 */
export interface Entity {
    id: string;
    type: string;
    applicationId?: string;
    ownerId?: string;
    status: string;
    attributes: any;
    metadata: any;
    data?: any; // Legacy compatibility
    createdAt: Date;
    updatedAt: Date;
    created_at?: Date; // Legacy compatibility
    updated_at?: Date; // Legacy compatibility
}

export interface CreateEntityInput {
    typeName: string;
    applicationId?: string;
    ownerId?: string;
    attributes?: any;
    metadata?: any;
}

export interface UpdateEntityInput {
    attributes?: any;
    metadata?: any;
    status?: string;
}

export interface EntityQueryOptions {
    applicationId?: string;
    ownerId?: string;
    status?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    filters?: Record<string, any>;
}

/**
 * Unified Entity Service (The One-Stop Solution)
 * Provides high-performance, flexible data storage using JSONB and Generated Columns.
 * 
 * Note: This service uses $queryRaw for complex JSONB operations that are not
 * directly supported by Prisma's query builder.
 */
class EntityService {

    /**
     * Create a new entity
     */
    async createEntity(input: CreateEntityInput): Promise<Entity> {
        const id = (input as any).id || uuidv4();

        if (input.ownerId) {
            const ownerCheck = await prisma.user.findUnique({
                where: { id: input.ownerId }
            });
            if (!ownerCheck) {
                throw new Error(`Invalid owner_id: ${input.ownerId} does not exist in users table`);
            }
        }

        const entity = await prisma.unifiedEntity.create({
            data: {
                id,
                type: input.typeName,
                applicationId: input.applicationId,
                ownerId: input.ownerId,
                status: (input as any).status || 'active',
                attributes: input.attributes || {},
                metadata: input.metadata || {}
            }
        });

        return this.mapRowToEntity(entity);
    }

    /**
     * Get entity by ID
     */
    async getEntity(id: string): Promise<Entity | null> {
        const entity = await prisma.unifiedEntity.findUnique({
            where: { id }
        });

        if (!entity) return null;
        return this.mapRowToEntity(entity);
    }

    /**
     * Update entity
     */
    async updateEntity(id: string, input: UpdateEntityInput): Promise<Entity | null> {
        const updateData: any = {
            updatedAt: new Date()
        };

        if (input.status !== undefined) {
            updateData.status = input.status;
        }
        if (input.attributes !== undefined) {
            updateData.attributes = input.attributes;
        }
        if (input.metadata !== undefined) {
            updateData.metadata = input.metadata;
        }

        if (Object.keys(updateData).length === 1) {
            return this.getEntity(id);
        }

        const entity = await prisma.unifiedEntity.update({
            where: { id },
            data: updateData
        });

        return this.mapRowToEntity(entity);
    }

    /**
     * Delete entity (soft or hard)
     */
    async deleteEntity(id: string, hard: boolean = false): Promise<boolean> {
        if (hard) {
            const result = await prisma.unifiedEntity.delete({
                where: { id }
            });
            return !!result;
        } else {
            const result = await prisma.unifiedEntity.update({
                where: { id },
                data: {
                    status: 'deleted',
                    updatedAt: new Date()
                }
            });
            return !!result;
        }
    }

    /**
     * Query entities with filtering
     */
    async queryEntities(typeName: string, options: EntityQueryOptions = {}): Promise<{
        entities: Entity[];
        total: number;
        page: number;
        limit: number;
    }> {
        const page = options.page || 1;
        const limit = Math.min(options.limit || 20, 100);
        const offset = (page - 1) * limit;

        // Build Prisma where conditions
        const whereConditions: any = {
            type: typeName,
            status: { not: 'deleted' }
        };

        if (options.applicationId) {
            whereConditions.applicationId = options.applicationId;
        }

        if (options.ownerId) {
            whereConditions.ownerId = options.ownerId;
        }

        if ((options as any).search) {
            whereConditions.data = {
                path: [],
                string_contains: (options as any).search
            };
        }

        if (options.filters) {
            for (const [key, value] of Object.entries(options.filters)) {
                if (value === undefined || value === null) continue;
                whereConditions.data = {
                    ...whereConditions.data,
                    path: [key],
                    equals: value
                };
            }
        }

        // Get total count and entities in parallel
        const [total, entities] = await Promise.all([
            prisma.unifiedEntity.count({ where: whereConditions }),
            prisma.unifiedEntity.findMany({
                where: whereConditions,
                orderBy: { 
                    [options.orderBy || 'createdAt']: options.orderDir || 'desc'
                },
                skip: offset,
                take: limit
            })
        ]);

        return {
            entities: entities.map(this.mapRowToEntity),
            total,
            page,
            limit
        };
    }

    /**
     * Search entities by text
     */
    async searchEntities(typeName: string, query: string, options: { applicationId?: string, limit?: number } = {}): Promise<Entity[]> {
        const limit = Math.min(options.limit || 20, 100);
        
        const whereConditions: any = {
            type: typeName,
            status: { not: 'deleted' },
            data: {
                path: [],
                string_contains: query
            }
        };

        if (options.applicationId) {
            whereConditions.applicationId = options.applicationId;
        }

        const entities = await prisma.unifiedEntity.findMany({
            where: whereConditions,
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return entities.map(this.mapRowToEntity.bind(this));
    }

    /**
     * Helper to map DB row to Entity object
     */
    private mapRowToEntity(row: any): Entity {
        return {
            id: row.id,
            type: row.type,
            applicationId: row.applicationId,
            ownerId: row.ownerId,
            status: row.status,
            metadata: row.metadata || {},
            attributes: row.attributes || {},
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        } as any;
    }

    async listEntityTypes(applicationId?: string): Promise<any[]> {
        const SELECT_COLS = Prisma.sql`
            id,
            name,
            display_name as "displayName",
            title,
            description,
            icon,
            category,
            api_endpoint as "apiEndpoint",
            response_key as "responseKey",
            columns,
            schema,
            is_system as "isSystem",
            search_placeholder as "searchPlaceholder",
            can_create as "canCreate",
            can_update as "canUpdate",
            can_delete as "canDelete"
        `;

        if (applicationId) {
            return prisma.$queryRaw<any[]>`
                SELECT ${SELECT_COLS}
                FROM admin.entity_types
                WHERE name NOT IN ('users', 'admin-users', 'admin_users')
                AND (application_id = ${applicationId}::uuid OR (is_system = true AND application_id IS NULL))
                ORDER BY category, COALESCE(title, display_name, name) ASC
            `;
        }

        return prisma.$queryRaw<any[]>`
            SELECT ${SELECT_COLS}
            FROM admin.entity_types
            WHERE name NOT IN ('users', 'admin-users', 'admin_users')
            AND (application_id IS NOT NULL OR is_system = true)
            ORDER BY category, COALESCE(title, display_name, name) ASC
        `;
    }
    
    async getEntityType(typeName: string): Promise<any | null> {
        const rows = await prisma.$queryRaw<any[]>`
            SELECT 
                id, 
                name, 
                display_name as "displayName",
                title,
                description, 
                icon, 
                category, 
                api_endpoint as "apiEndpoint",
                response_key as "responseKey",
                columns, 
                schema, 
                is_system as "isSystem",
                search_placeholder as "searchPlaceholder",
                can_create as "canCreate",
                can_update as "canUpdate",
                can_delete as "canDelete"
            FROM admin.entity_types 
            WHERE name = ${typeName}
        `;
        
        return rows[0] || null;
    }
    
    async getEntityTypeById(id: string): Promise<any | null> {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        let rows: any[] = [];
        
        if (isUUID) {
            rows = await prisma.$queryRaw<any[]>`
                SELECT 
                    id, 
                    name, 
                    display_name as "displayName",
                    title,
                    description, 
                    icon, 
                    category, 
                    api_endpoint as "apiEndpoint",
                    response_key as "responseKey",
                    columns, 
                    schema, 
                    is_system as "isSystem",
                    search_placeholder as "searchPlaceholder",
                    can_create as "canCreate",
                    can_update as "canUpdate",
                    can_delete as "canDelete"
                FROM admin.entity_types 
                WHERE id = ${id}::uuid
            `;
        }
        
        if (rows.length === 0) {
            rows = await prisma.$queryRaw<any[]>`
                SELECT 
                    id, 
                    name, 
                    display_name as "displayName",
                    title,
                    description, 
                    icon, 
                    category, 
                    api_endpoint as "apiEndpoint",
                    response_key as "responseKey",
                    columns, 
                    schema, 
                    is_system as "isSystem",
                    search_placeholder as "searchPlaceholder",
                    can_create as "canCreate",
                    can_update as "canUpdate",
                    can_delete as "canDelete"
                FROM admin.entity_types 
                WHERE name = ${id}
            `;
        }

        return rows[0] || null;
    }

    async createEntityType(data: {
        name: string;
        displayName: string;
        description?: string;
        applicationId?: string;
        schema?: any;
        icon?: string;
        category?: string;
    }): Promise<any> {
        const rows = await prisma.$queryRaw<any[]>`
            INSERT INTO admin.entity_types (
                name, 
                display_name, 
                title,
                description, 
                icon, 
                category, 
                application_id,
                schema,
                api_endpoint,
                can_create,
                can_update,
                can_delete
            )
            VALUES (
                ${data.name}, 
                ${data.displayName}, 
                ${data.displayName}, 
                ${data.description || null}, 
                ${data.icon || 'collection'}, 
                ${data.category || 'Custom'}, 
                ${data.applicationId || null}::uuid,
                ${JSON.stringify(data.schema || [])}::jsonb,
                ${`/admin/entities/${data.name}`},
                true,
                true,
                true
            )
            RETURNING 
                id, 
                name, 
                display_name as "displayName",
                title,
                description, 
                icon, 
                category, 
                api_endpoint as "apiEndpoint",
                response_key as "responseKey",
                columns, 
                schema, 
                is_system as "isSystem",
                search_placeholder as "searchPlaceholder",
                can_create as "canCreate",
                can_update as "canUpdate",
                can_delete as "canDelete"
        `;
        
        return rows[0];
    }

    async updateEntityType(id: string, data: {
        displayName?: string;
        description?: string;
        schema?: any;
        icon?: string;
        category?: string;
    }): Promise<any | null> {
        const setParts: Prisma.Sql[] = [];

        if (data.displayName !== undefined) {
            setParts.push(Prisma.sql`display_name = ${data.displayName}, title = ${data.displayName}`);
        }
        if (data.description !== undefined) {
            setParts.push(Prisma.sql`description = ${data.description}`);
        }
        if (data.icon !== undefined) {
            setParts.push(Prisma.sql`icon = ${data.icon}`);
        }
        if (data.category !== undefined) {
            setParts.push(Prisma.sql`category = ${data.category}`);
        }
        if (data.schema !== undefined) {
            setParts.push(Prisma.sql`schema = ${JSON.stringify(data.schema)}::jsonb`);
        }

        if (setParts.length === 0) {
            return this.getEntityTypeById(id);
        }

        setParts.push(Prisma.sql`updated_at = NOW()`);

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const whereClause = isUUID
            ? Prisma.sql`id = ${id}::uuid`
            : Prisma.sql`name = ${id}`;

        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
            UPDATE admin.entity_types
            SET ${Prisma.join(setParts, ', ')}
            WHERE ${whereClause}
            RETURNING
                id,
                name,
                display_name as "displayName",
                title,
                description,
                icon,
                category,
                api_endpoint as "apiEndpoint",
                response_key as "responseKey",
                columns,
                schema,
                is_system as "isSystem",
                search_placeholder as "searchPlaceholder",
                can_create as "canCreate",
                can_update as "canUpdate",
                can_delete as "canDelete"
        `);

        return rows[0] || null;
    }

    async deleteEntityType(id: string): Promise<boolean> {
        const result = await prisma.$executeRaw`
            DELETE FROM admin.entity_types 
            WHERE (id = ${id}::uuid OR name = ${id}) AND is_system = false
        `;
        
        return result > 0;
    }
}

export const entityService = new EntityService();
export default entityService;
