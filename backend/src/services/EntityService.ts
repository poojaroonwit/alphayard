import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import {
    Entity,
    CreateEntityInput,
    UpdateEntityInput,
    EntityQueryOptions
} from '@bondarys/shared';

/**
 * Unified Entity Service (The One-Stop Solution)
 * Provides high-performance, flexible data storage using JSONB and Generated Columns.
 */
class EntityService {

    /**
     * Create a new entity
     */
    async createEntity(input: CreateEntityInput): Promise<Entity> {
        const id = (input as any).id || uuidv4();
        const { rows } = await pool.query(
            `INSERT INTO unified_entities (id, type, application_id, owner_id, status, data, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                id,
                input.typeName,
                input.applicationId || null,
                input.ownerId || null,
                (input as any).status || 'active',
                JSON.stringify(input.attributes || {}),
                JSON.stringify(input.metadata || {})
            ]
        );

        return this.mapRowToEntity(rows[0]);
    }

    /**
     * Get entity by ID
     */
    async getEntity(id: string): Promise<Entity | null> {
        const { rows } = await pool.query(
            `SELECT * FROM unified_entities WHERE id = $1`,
            [id]
        );

        if (!rows[0]) return null;
        return this.mapRowToEntity(rows[0]);
    }

    /**
     * Update entity
     */
    async updateEntity(id: string, input: UpdateEntityInput): Promise<Entity | null> {
        const updates: string[] = ['updated_at = NOW()'];
        const values: any[] = [];
        let paramIndex = 1;

        if (input.status) {
            updates.push(`status = $${paramIndex++}`);
            values.push(input.status);
        }

        if (input.attributes) {
            // Merge JSONB data
            updates.push(`data = data || $${paramIndex++}`);
            values.push(JSON.stringify(input.attributes));
        }

        if (input.metadata) {
            // Merge JSONB metadata
            updates.push(`metadata = metadata || $${paramIndex++}`);
            values.push(JSON.stringify(input.metadata));
        }

        if (values.length === 0) return this.getEntity(id);

        values.push(id);
        const { rows } = await pool.query(
            `UPDATE unified_entities SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return rows[0] ? this.mapRowToEntity(rows[0]) : null;
    }

    /**
     * Delete entity (soft or hard)
     */
    async deleteEntity(id: string, hard: boolean = false): Promise<boolean> {
        if (hard) {
            const { rowCount } = await pool.query(
                `DELETE FROM unified_entities WHERE id = $1`,
                [id]
            );
            return (rowCount ?? 0) > 0;
        } else {
            const { rowCount } = await pool.query(
                `UPDATE unified_entities SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
                [id]
            );
            return (rowCount ?? 0) > 0;
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

        let sql = `FROM unified_entities WHERE type = $1 AND status != 'deleted'`;
        const params: any[] = [typeName];
        let paramIndex = 2;

        if (options.applicationId) {
            sql += ` AND application_id = $${paramIndex++}`;
            params.push(options.applicationId);
        }

        if (options.ownerId) {
            sql += ` AND owner_id = $${paramIndex++}`;
            params.push(options.ownerId);
        }

        // Search in JSONB data
        if ((options as any).search) {
            sql += ` AND data::text ILIKE $${paramIndex++}`;
            params.push(`%${(options as any).search}%`);
        }

        // Custom Filters for JSONB
        if (options.filters) {
            for (const [key, value] of Object.entries(options.filters)) {
                if (value === undefined || value === null) continue;
                sql += ` AND data->>'${key}' = $${paramIndex++}`;
                params.push(value.toString());
            }
        }

        // Get total
        const { rows: countRows } = await pool.query(`SELECT COUNT(*) as total ${sql}`, params);
        const total = parseInt(countRows[0].total, 10);

        // Get entities
        const orderBy = options.orderBy || 'created_at';
        const orderDir = options.orderDir || 'DESC';
        
        const { rows } = await pool.query(
            `SELECT * ${sql} ORDER BY ${orderBy} ${orderDir} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, limit, offset]
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
            await pool.query(
                `INSERT INTO entity_relations (source_id, target_id, relation_type, metadata)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (source_id, target_id, relation_type) 
                 DO UPDATE SET metadata = entity_relations.metadata || $4`,
                [sourceId, targetId, type, JSON.stringify(metadata)]
            );
            return true;
        } catch (error) {
            console.error('Create relation failed:', error);
            return false;
        }
    }

    async deleteRelation(sourceId: string, targetId: string, type: string): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM entity_relations WHERE source_id = $1 AND target_id = $2 AND relation_type = $3`,
            [sourceId, targetId, type]
        );
        return (rowCount ?? 0) > 0;
    }

    async queryRelatedEntities(sourceId: string, relationType: string, targetTypeName?: string): Promise<Entity[]> {
        let sql = `
            SELECT e.*
            FROM entity_relations er
            JOIN unified_entities e ON er.target_id = e.id
            WHERE er.source_id = $1 AND er.relation_type = $2
        `;
        const params: any[] = [sourceId, relationType];

        if (targetTypeName) {
            sql += ` AND e.type = $3`;
            params.push(targetTypeName);
        }

        sql += ` ORDER BY er.created_at DESC`;

        const { rows } = await pool.query(sql, params);
        return rows.map(this.mapRowToEntity);
    }

    async queryEntitiesByRelation(targetId: string, relationType: string): Promise<(Entity & { relation_metadata: any, joined_at: Date })[]> {
        const { rows } = await pool.query(
            `SELECT e.*, er.metadata as rel_meta, er.created_at as joined_at
             FROM entity_relations er
             JOIN unified_entities e ON er.source_id = e.id
             WHERE er.target_id = $1 AND er.relation_type = $2
             ORDER BY er.created_at ASC`,
            [targetId, relationType]
        );

        return rows.map(row => ({
            ...this.mapRowToEntity(row),
            relation_metadata: row.rel_meta,
            joined_at: row.joined_at
        }));
    }

    async hasRelation(sourceId: string, targetId: string, relationType: string): Promise<boolean> {
        const { rows } = await pool.query(
            'SELECT 1 FROM entity_relations WHERE source_id = $1 AND target_id = $2 AND relation_type = $3',
            [sourceId, targetId, relationType]
        );
        return rows.length > 0;
    }

    /**
     * Search entities by text
     */
    async searchEntities(typeName: string, query: string, options: { applicationId?: string, limit?: number } = {}): Promise<Entity[]> {
        const limit = Math.min(options.limit || 20, 100);
        let sql = `SELECT * FROM unified_entities WHERE type = $1 AND status != 'deleted' AND data::text ILIKE $2`;
        const params: any[] = [typeName, `%${query}%`];
        let paramIndex = 3;

        if (options.applicationId) {
            sql += ` AND application_id = $${paramIndex++}`;
            params.push(options.applicationId);
        }

        sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);

        const { rows } = await pool.query(sql, params);
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

    // Legacy compatibility for entity types (can be removed later)
    async listEntityTypes(applicationId?: string): Promise<any[]> {
        const { rows } = await pool.query(`
            SELECT 
                id, 
                name, 
                display_name as "displayName", 
                description, 
                icon, 
                category, 
                api_endpoint as "apiEndpoint", 
                columns, 
                schema, 
                is_system as "isSystem",
                search_placeholder as "searchPlaceholder",
                can_create as "canCreate",
                can_update as "canUpdate",
                can_delete as "canDelete"
            FROM entity_types 
            ORDER BY category, title ASC
        `);
        return rows;
    }
    async getEntityType(typeName: string) { return { id: typeName, name: typeName, schema: {} }; }
    async getEntityTypeById(id: string) { return { id, name: id, schema: {} }; }

    async createEntityType(data: any) {
        return { id: data.name, ...data };
    }

    async updateEntityType(id: string, data: any) {
        return { id, ...data };
    }

    async deleteEntityType(id: string) {
        return true;
    }
}

export const entityService = new EntityService();
export default entityService;
