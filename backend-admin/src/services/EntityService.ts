import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import {
    Entity,
    CreateEntityInput,
    UpdateEntityInput,
    EntityQueryOptions
} from '@/shared';

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
        
        // Ensure ownerId is valid before inserting
        if (input.ownerId) {
            console.log('[EntityService] Verifying ownerId before insert:', { ownerId: input.ownerId, typeName: input.typeName });
            const ownerCheck = await prisma.$queryRaw<any[]>`
                SELECT id FROM core.users WHERE id = ${input.ownerId}::uuid
            `;
            console.log('[EntityService] Owner check result:', { ownerId: input.ownerId, found: ownerCheck.length > 0 });
            if (ownerCheck.length === 0) {
                console.error('[EntityService] CRITICAL: ownerId does not exist in core.users:', input.ownerId);
                throw new Error(`Invalid owner_id: ${input.ownerId} does not exist in core.users table`);
            }
        } else {
            console.log('[EntityService] No ownerId provided for entity creation');
        }

        const result = await prisma.$queryRaw<any[]>`
            INSERT INTO public.unified_entities (id, type, application_id, owner_id, status, data, metadata)
            VALUES (${id}::uuid, ${input.typeName}, ${input.applicationId || null}::uuid, 
                    ${input.ownerId || null}::uuid, ${(input as any).status || 'active'}, 
                    ${JSON.stringify(input.attributes || {})}::jsonb, 
                    ${JSON.stringify(input.metadata || {})}::jsonb)
            RETURNING *
        `;

        return this.mapRowToEntity(result[0]);
    }

    /**
     * Get entity by ID
     */
    async getEntity(id: string): Promise<Entity | null> {
        const result = await prisma.$queryRaw<any[]>`
            SELECT * FROM public.unified_entities WHERE id = ${id}::uuid
        `;

        if (!result[0]) return null;
        return this.mapRowToEntity(result[0]);
    }

    /**
     * Update entity
     */
    async updateEntity(id: string, input: UpdateEntityInput): Promise<Entity | null> {
        const updates: string[] = ['updated_at = NOW()'];
        const hasStatus = !!input.status;
        const hasAttributes = !!input.attributes;
        const hasMetadata = !!input.metadata;

        if (!hasStatus && !hasAttributes && !hasMetadata) {
            return this.getEntity(id);
        }

        // Build dynamic update using raw query
        let updateQuery = `UPDATE unified_entities SET updated_at = NOW()`;
        
        if (hasStatus) {
            updateQuery += `, status = '${input.status}'`;
        }
        if (hasAttributes) {
            updateQuery += `, data = data || '${JSON.stringify(input.attributes)}'::jsonb`;
        }
        if (hasMetadata) {
            updateQuery += `, metadata = metadata || '${JSON.stringify(input.metadata)}'::jsonb`;
        }
        
        updateQuery += ` WHERE id = '${id}'::uuid RETURNING *`;

        const result = await prisma.$queryRawUnsafe<any[]>(updateQuery);
        return result[0] ? this.mapRowToEntity(result[0]) : null;
    }

    /**
     * Delete entity (soft or hard)
     */
    async deleteEntity(id: string, hard: boolean = false): Promise<boolean> {
        if (hard) {
            const result = await prisma.$executeRaw`
                DELETE FROM unified_entities WHERE id = ${id}::uuid
            `;
            return result > 0;
        } else {
            const result = await prisma.$executeRaw`
                UPDATE unified_entities SET status = 'deleted', updated_at = NOW() 
                WHERE id = ${id}::uuid
            `;
            return result > 0;
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

        let whereClause = `type = '${typeName}' AND status != 'deleted'`;

        if (options.applicationId) {
            whereClause += ` AND application_id = '${options.applicationId}'::uuid`;
        }

        if (options.ownerId) {
            whereClause += ` AND owner_id = '${options.ownerId}'::uuid`;
        }

        if ((options as any).search) {
            whereClause += ` AND data::text ILIKE '%${(options as any).search}%'`;
        }

        if (options.filters) {
            for (const [key, value] of Object.entries(options.filters)) {
                if (value === undefined || value === null) continue;
                whereClause += ` AND data->>'${key}' = '${value}'`;
            }
        }

        // Get total count
        const countResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COUNT(*) as total FROM unified_entities WHERE ${whereClause}`
        );
        const total = parseInt(countResult[0].total, 10);

        // Get entities
        const orderBy = options.orderBy || 'created_at';
        const orderDir = options.orderDir || 'DESC';

        const rows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM unified_entities WHERE ${whereClause} 
             ORDER BY ${orderBy} ${orderDir} LIMIT ${limit} OFFSET ${offset}`
        );

        return {
            entities: rows.map(this.mapRowToEntity),
            total,
            page,
            limit
        };
    }

    /**
     * Relationship Management
     */
    async createRelation(sourceId: string, targetId: string, type: string, metadata: any = {}): Promise<boolean> {
        try {
            await prisma.$executeRaw`
                INSERT INTO entity_relations (source_id, target_id, relation_type, metadata)
                VALUES (${sourceId}::uuid, ${targetId}::uuid, ${type}, ${JSON.stringify(metadata)}::jsonb)
                ON CONFLICT (source_id, target_id, relation_type) 
                DO UPDATE SET metadata = entity_relations.metadata || ${JSON.stringify(metadata)}::jsonb
            `;
            return true;
        } catch (error) {
            console.error('Create relation failed:', error);
            return false;
        }
    }

    async deleteRelation(sourceId: string, targetId: string, type: string): Promise<boolean> {
        const result = await prisma.$executeRaw`
            DELETE FROM entity_relations 
            WHERE source_id = ${sourceId}::uuid AND target_id = ${targetId}::uuid AND relation_type = ${type}
        `;
        return result > 0;
    }

    async queryRelatedEntities(sourceId: string, relationType: string, targetTypeName?: string): Promise<Entity[]> {
        let query = `
            SELECT e.*
            FROM entity_relations er
            JOIN unified_entities e ON er.target_id = e.id
            WHERE er.source_id = '${sourceId}'::uuid AND er.relation_type = '${relationType}'
        `;

        if (targetTypeName) {
            query += ` AND e.type = '${targetTypeName}'`;
        }

        query += ` ORDER BY er.created_at DESC`;

        const rows = await prisma.$queryRawUnsafe<any[]>(query);
        return rows.map(this.mapRowToEntity);
    }

    async queryEntitiesByRelation(targetId: string, relationType: string): Promise<(Entity & { relation_metadata: any, joined_at: Date })[]> {
        const rows = await prisma.$queryRaw<any[]>`
            SELECT e.*, er.metadata as rel_meta, er.created_at as joined_at
            FROM entity_relations er
            JOIN unified_entities e ON er.source_id = e.id
            WHERE er.target_id = ${targetId}::uuid AND er.relation_type = ${relationType}
            ORDER BY er.created_at ASC
        `;

        return rows.map(row => ({
            ...this.mapRowToEntity(row),
            relation_metadata: row.rel_meta,
            joined_at: row.joined_at
        }));
    }

    async hasRelation(sourceId: string, targetId: string, relationType: string): Promise<boolean> {
        const rows = await prisma.$queryRaw<any[]>`
            SELECT 1 FROM entity_relations 
            WHERE source_id = ${sourceId}::uuid AND target_id = ${targetId}::uuid AND relation_type = ${relationType}
        `;
        return rows.length > 0;
    }

    /**
     * Search entities by text
     */
    async searchEntities(typeName: string, query: string, options: { applicationId?: string, limit?: number } = {}): Promise<Entity[]> {
        const limit = Math.min(options.limit || 20, 100);
        
        let sql = `SELECT * FROM unified_entities 
                   WHERE type = '${typeName}' AND status != 'deleted' AND data::text ILIKE '%${query}%'`;

        if (options.applicationId) {
            sql += ` AND application_id = '${options.applicationId}'::uuid`;
        }

        sql += ` ORDER BY created_at DESC LIMIT ${limit}`;

        const rows = await prisma.$queryRawUnsafe<any[]>(sql);
        return rows.map(this.mapRowToEntity.bind(this));
    }

    /**
     * Helper to map DB row to Entity object
     */
    private mapRowToEntity(row: any): Entity {
        return {
            id: row.id,
            type: row.type,
            applicationId: row.application_id,
            ownerId: row.owner_id,
            status: row.status,
            metadata: row.metadata || {},
            attributes: row.data || {},
            data: row.data || {}, // For legacy compatibility
            createdAt: new Date(row.created_at),
            created_at: new Date(row.created_at), // For legacy compatibility
            updatedAt: new Date(row.updated_at),
            updated_at: new Date(row.updated_at) // For legacy compatibility
        } as any;
    }

    // Legacy compatibility for entity types
    async listEntityTypes(applicationId?: string): Promise<any[]> {
        const excludedNames = ['users', 'admin-users', 'admin_users'];
        
        let query = `
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
            FROM entity_types 
            WHERE name NOT IN ('users', 'admin-users', 'admin_users')
        `;
        
        if (applicationId) {
            query += ` AND (application_id = '${applicationId}'::uuid OR (is_system = true AND application_id IS NULL))`;
        } else {
            query += ` AND (application_id IS NOT NULL OR is_system = true)`;
        }
        
        query += ` ORDER BY category, COALESCE(title, display_name, name) ASC`;
        
        const rows = await prisma.$queryRawUnsafe<any[]>(query);
        return rows;
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
            FROM entity_types 
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
                FROM entity_types 
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
                FROM entity_types 
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
            INSERT INTO entity_types (
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
        const updates: string[] = [];
        
        if (data.displayName !== undefined) {
            updates.push(`display_name = '${data.displayName}'`);
            updates.push(`title = '${data.displayName}'`);
        }
        if (data.description !== undefined) {
            updates.push(`description = '${data.description}'`);
        }
        if (data.icon !== undefined) {
            updates.push(`icon = '${data.icon}'`);
        }
        if (data.category !== undefined) {
            updates.push(`category = '${data.category}'`);
        }
        if (data.schema !== undefined) {
            updates.push(`schema = '${JSON.stringify(data.schema)}'::jsonb`);
        }
        
        if (updates.length === 0) {
            return this.getEntityTypeById(id);
        }
        
        const query = `
            UPDATE entity_types 
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = '${id}'::uuid OR name = '${id}'
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
        
        const rows = await prisma.$queryRawUnsafe<any[]>(query);
        return rows[0] || null;
    }

    async deleteEntityType(id: string): Promise<boolean> {
        const result = await prisma.$executeRaw`
            DELETE FROM entity_types 
            WHERE (id = ${id}::uuid OR name = ${id}) AND is_system = false
        `;
        
        return result > 0;
    }
}

export const entityService = new EntityService();
export default entityService;
