import { prisma } from '../lib/prisma';

// =====================================
// TYPES
// =====================================

export interface TableInfo {
    tableName: string;
    schema: string;
    rowCount: number;
    sizeBytes: number;
    sizeFormatted: string;
    columns: ColumnInfo[];
}

export interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue: string | null;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    foreignKeyRef?: string;
    maxLength?: number;
}

export interface QueryResult {
    rows: any[];
    rowCount: number;
    fields: { name: string; dataTypeID: number; dataType: string }[];
    executionTimeMs: number;
}

export interface TableDataOptions {
    page?: number;
    pageSize?: number;
    orderBy?: string;
    orderDir?: 'asc' | 'desc';
    filters?: { column: string; operator: string; value: any }[];
    search?: string;
    searchColumns?: string[];
}

// =====================================
// SAFE SQL PATTERNS
// =====================================

// List of dangerous SQL keywords/patterns for read-only mode
const DANGEROUS_PATTERNS = [
    /\bDROP\b/i,
    /\bTRUNCATE\b/i,
    /\bDELETE\b/i,
    /\bUPDATE\b/i,
    /\bINSERT\b/i,
    /\bALTER\b/i,
    /\bCREATE\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
    /\bEXECUTE\b/i,
    /\bCOPY\b/i,
    /\bVACUUM\b/i,
    /\bREINDEX\b/i,
    /\bCLUSTER\b/i,
    /\bLOCK\b/i,
    /\bSET\s+ROLE/i,
    /\bSET\s+SESSION/i,
    /pg_sleep/i,
    /pg_terminate_backend/i,
    /pg_cancel_backend/i,
];

// =====================================
// DATABASE EXPLORER SERVICE
// =====================================

class DatabaseExplorerService {
    // =====================================
    // TABLE LISTING & SCHEMA
    // =====================================

    /**
     * Get list of all tables in the database
     */
    async getTables(): Promise<TableInfo[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                t.table_name,
                t.table_schema,
                pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) as size_bytes,
                pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as size_formatted,
                (SELECT reltuples::bigint FROM pg_class WHERE oid = (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass) as row_estimate
            FROM information_schema.tables t
            WHERE t.table_schema IN ('core', 'admin', 'bondarys', 'public')
            AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_schema, t.table_name
        `);

        const tables: TableInfo[] = [];
        for (const row of result) {
            const schema = row.table_schema || 'public';
            const tableName = row.table_name;
            
            if (!tableName) continue;
            
            const columns = await this.getTableColumns(tableName, schema);
            tables.push({
                tableName,
                schema,
                rowCount: parseInt(row.row_estimate) || 0,
                sizeBytes: parseInt(row.size_bytes) || 0,
                sizeFormatted: row.size_formatted || '0 bytes',
                columns
            });
        }

        return tables;
    }

    /**
     * Get column information for a specific table
     */
    async getTableColumns(tableName: string, schema: string = 'public'): Promise<ColumnInfo[]> {
        // Get basic column info
        // NOTE: prisma.$queryRawUnsafe takes params as SEPARATE args, NOT as an array
        const columnsResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                c.character_maximum_length,
                c.udt_name
            FROM information_schema.columns c
            WHERE c.table_schema = $1
            AND c.table_name = $2
            ORDER BY c.ordinal_position
        `, schema, tableName);

        // Get schema OID
        const schemaOidResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT oid FROM pg_namespace WHERE nspname = $1
        `, schema);
        
        const schemaOid = schemaOidResult[0]?.oid;
        if (schemaOid === undefined || schemaOid === null) {
            // Schema not found - return columns without PK/FK info
            return columnsResult.map((col: any) => ({
                name: col.column_name,
                type: col.udt_name || col.data_type,
                nullable: col.is_nullable === 'YES',
                defaultValue: col.column_default,
                isPrimaryKey: false,
                isForeignKey: false,
                maxLength: col.character_maximum_length
            }));
        }

        // Get primary keys using schema OID and table name
        const pkResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT a.attname
            FROM pg_index i
            JOIN pg_class t ON t.oid = i.indrelid
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE t.relname = $1
            AND t.relnamespace = $2
            AND i.indisprimary
        `, tableName, Number(schemaOid));
        const primaryKeys = new Set(pkResult.map((r: any) => r.attname));

        // Get foreign keys
        const fkResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT
                kcu.column_name,
                ccu.table_schema AS foreign_schema,
                ccu.table_name AS foreign_table,
                ccu.column_name AS foreign_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu 
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = $1
            AND tc.table_name = $2
        `, schema, tableName);
        const foreignKeys = new Map(fkResult.map((r: any) => [
            r.column_name,
            `${r.foreign_schema}.${r.foreign_table}.${r.foreign_column}`
        ]));

        return columnsResult.map((col: any) => ({
            name: col.column_name,
            type: col.udt_name || col.data_type,
            nullable: col.is_nullable === 'YES',
            defaultValue: col.column_default,
            isPrimaryKey: primaryKeys.has(col.column_name),
            isForeignKey: foreignKeys.has(col.column_name),
            foreignKeyRef: foreignKeys.get(col.column_name),
            maxLength: col.character_maximum_length
        }));
    }

    /**
     * Build SELECT column list with interval columns cast to text
     * This prevents Prisma deserialization errors for interval types
     */
    private buildSelectColumns(columns: ColumnInfo[]): string {
        return columns.map(col => {
            const typeLower = col.type?.toLowerCase() || '';
            if (typeLower === 'interval' || typeLower.includes('interval')) {
                return `"${col.name}"::text AS "${col.name}"`;
            }
            return `"${col.name}"`;
        }).join(', ');
    }

    /**
     * Get detailed table info including indexes and constraints
     */
    async getTableDetails(tableName: string): Promise<{
        table: TableInfo;
        indexes: any[];
        constraints: any[];
    }> {
        const tables = await this.getTables();
        const table = tables.find(t => t.tableName === tableName);
        
        if (!table) {
            throw new Error(`Table '${tableName}' not found`);
        }

        // Get schema OID
        const schemaOidResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT oid FROM pg_namespace WHERE nspname = $1
        `, table.schema);
        
        const schemaOidValue = schemaOidResult[0]?.oid;
        if (schemaOidValue === undefined || schemaOidValue === null) {
            throw new Error(`Schema '${table.schema}' not found`);
        }
        const schemaOidNumber = Number(schemaOidValue);

        // Get indexes
        const indexesResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT
                i.relname as index_name,
                am.amname as index_type,
                idx.indisunique as is_unique,
                idx.indisprimary as is_primary,
                array_agg(a.attname ORDER BY k.n) as columns
            FROM pg_index idx
            JOIN pg_class i ON i.oid = idx.indexrelid
            JOIN pg_class t ON t.oid = idx.indrelid
            JOIN pg_am am ON i.relam = am.oid
            CROSS JOIN LATERAL unnest(idx.indkey) WITH ORDINALITY AS k(attnum, n)
            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
            WHERE t.relname = $1
            AND t.relnamespace = $2
            GROUP BY i.relname, am.amname, idx.indisunique, idx.indisprimary
            ORDER BY i.relname
        `, tableName, schemaOidNumber);

        // Get constraints
        const constraintsResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT
                con.conname as constraint_name,
                con.contype as constraint_type,
                CASE con.contype
                    WHEN 'p' THEN 'PRIMARY KEY'
                    WHEN 'f' THEN 'FOREIGN KEY'
                    WHEN 'u' THEN 'UNIQUE'
                    WHEN 'c' THEN 'CHECK'
                    WHEN 'x' THEN 'EXCLUSION'
                END as constraint_type_name,
                pg_get_constraintdef(con.oid) as definition
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = $1
            AND rel.relnamespace = $2
            ORDER BY con.conname
        `, tableName, schemaOidNumber);

        return {
            table,
            indexes: indexesResult,
            constraints: constraintsResult
        };
    }

    // =====================================
    // DATA QUERYING
    // =====================================

    /**
     * Get data from a table with pagination and filtering
     */
    async getTableData(tableName: string, options: TableDataOptions = {}): Promise<{
        rows: any[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }> {
        // Validate table name (prevent SQL injection)
        const validTables = await this.getTables();
        const tableInfo = validTables.find(t => t.tableName === tableName);
        if (!tableInfo) {
            throw new Error(`Invalid table name: ${tableName}`);
        }

        const page = options.page || 1;
        const pageSize = Math.min(options.pageSize || 50, 500); // Max 500 rows
        const offset = (page - 1) * pageSize;
        
        // Determine valid orderBy column
        const columnNames = tableInfo.columns.map(c => c.name);
        let orderBy = options.orderBy;
        
        if (!orderBy || !columnNames.includes(orderBy)) {
            const defaultOrderColumns = ['created_at', 'updated_at', 'id'];
            orderBy = defaultOrderColumns.find(col => columnNames.includes(col)) || columnNames[0];
        }
        
        const orderDir = options.orderDir === 'asc' ? 'ASC' : 'DESC';

        // Build WHERE clause
        let whereClause = '';
        const params: any[] = [];
        let paramIndex = 1;

        if (options.filters && options.filters.length > 0) {
            const conditions = options.filters.map(f => {
                const operator = this.sanitizeOperator(f.operator);
                if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
                    return `"${f.column}" ${operator}`;
                }
                params.push(f.value);
                return `"${f.column}" ${operator} $${paramIndex++}`;
            });
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }

        if (options.search && options.searchColumns && options.searchColumns.length > 0) {
            const searchConditions = options.searchColumns.map(col => {
                params.push(`%${options.search}%`);
                return `"${col}"::text ILIKE $${paramIndex++}`;
            });
            const searchClause = `(${searchConditions.join(' OR ')})`;
            whereClause = whereClause 
                ? `${whereClause} AND ${searchClause}`
                : `WHERE ${searchClause}`;
        }

        // Use schema-qualified table name (properly quoted)
        const schemaQualifiedTable = `"${tableInfo.schema}"."${tableInfo.tableName}"`;
        
        // Get total count - spread params as separate arguments
        const countQuery = `SELECT COUNT(*) FROM ${schemaQualifiedTable} ${whereClause}`;
        const countResult = await prisma.$queryRawUnsafe<any[]>(countQuery, ...params);
        const total = parseInt(countResult[0].count);

        // Get data - build column list with interval casting
        const selectColumns = this.buildSelectColumns(tableInfo.columns);
        const dataQuery = `
            SELECT ${selectColumns} FROM ${schemaQualifiedTable} 
            ${whereClause}
            ORDER BY "${orderBy}" ${orderDir}
            LIMIT ${pageSize} OFFSET ${offset}
        `;
        const dataResult = await prisma.$queryRawUnsafe<any[]>(dataQuery, ...params);

        return {
            rows: dataResult,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    }

    /**
     * Execute a read-only SQL query
     */
    async executeQuery(sql: string, readOnly: boolean = true): Promise<QueryResult> {
        if (readOnly) {
            for (const pattern of DANGEROUS_PATTERNS) {
                if (pattern.test(sql)) {
                    throw new Error('Query contains disallowed operations. Only SELECT queries are allowed in read-only mode.');
                }
            }

            const trimmedSql = sql.trim().toUpperCase();
            if (!trimmedSql.startsWith('SELECT') && 
                !trimmedSql.startsWith('WITH') && 
                !trimmedSql.startsWith('EXPLAIN')) {
                throw new Error('Only SELECT, WITH (CTE), or EXPLAIN queries are allowed in read-only mode.');
            }
        }

        const startTime = Date.now();
        
        try {
            await prisma.$queryRawUnsafe<any[]>('SET statement_timeout = 30000');
            
            const result: any = await prisma.$queryRawUnsafe<any[]>(sql);
            const executionTimeMs = Date.now() - startTime;

            const fields = result.fields?.map((f: any) => ({
                name: f.name,
                dataTypeID: f.dataTypeID,
                dataType: this.getDataTypeName(f.dataTypeID)
            })) || [];

            return {
                rows: result || [],
                rowCount: result.rowCount || 0,
                fields,
                executionTimeMs
            };
        } catch (error: any) {
            if (error?.message?.includes('interval') || 
                error?.message?.includes('Failed to deserialize column')) {
                throw new Error(
                    'Query contains interval or other unsupported column types. ' +
                    'Please cast interval columns to text in your query, e.g., ' +
                    'SELECT column_name::text AS column_name FROM table_name'
                );
            }
            throw error;
        } finally {
            await prisma.$queryRawUnsafe<any[]>('SET statement_timeout = 0');
        }
    }

    /**
     * Get row by primary key
     */
    async getRowById(tableName: string, id: string): Promise<any> {
        const validTables = await this.getTables();
        const table = validTables.find(t => t.tableName === tableName);
        if (!table) {
            throw new Error(`Invalid table name: ${tableName}`);
        }

        const pkColumn = table.columns.find(c => c.isPrimaryKey);
        if (!pkColumn) {
            throw new Error(`Table ${tableName} has no primary key`);
        }

        const schemaQualifiedTable = `"${table.schema}"."${table.tableName}"`;
        const selectColumns = this.buildSelectColumns(table.columns);
        // Pass id as a separate argument, NOT in an array
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT ${selectColumns} FROM ${schemaQualifiedTable} WHERE "${pkColumn.name}" = $1`,
            id
        );

        return result[0] || null;
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats(): Promise<{
        databaseSize: string;
        tableCount: number;
        totalRows: number;
        connectionCount: number;
        uptime: string;
    }> {
        const [sizeResult, tableCountResult, connectionsResult, uptimeResult] = await Promise.all([
            prisma.$queryRawUnsafe<any[]>(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`),
            prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema IN ('core', 'admin', 'bondarys', 'public') AND table_type = 'BASE TABLE'`),
            prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM pg_stat_activity WHERE datname = current_database()`),
            prisma.$queryRawUnsafe<any[]>(`SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time())::text as uptime`)
        ]);

        const tables = await this.getTables();
        const totalRows = tables.reduce((sum: number, t: any) => sum + t.rowCount, 0);

        return {
            databaseSize: sizeResult[0].size,
            tableCount: parseInt(tableCountResult[0].count),
            totalRows,
            connectionCount: parseInt(connectionsResult[0].count),
            uptime: uptimeResult[0].uptime?.toString() || 'Unknown'
        };
    }

    /**
     * Get recent queries (from pg_stat_statements if available)
     */
    async getQueryHistory(): Promise<any[]> {
        try {
            const result = await prisma.$queryRawUnsafe<any[]>(`
                SELECT 
                    query,
                    calls,
                    total_exec_time::text as total_exec_time,
                    mean_exec_time::text as mean_exec_time,
                    rows
                FROM pg_stat_statements
                WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
                ORDER BY total_exec_time DESC
                LIMIT 50
            `);
            return result;
        } catch {
            return [];
        }
    }

    // =====================================
    // HELPER METHODS
    // =====================================

    private sanitizeOperator(op: string): string {
        const validOperators: { [key: string]: string } = {
            '=': '=',
            '!=': '!=',
            '<>': '<>',
            '>': '>',
            '<': '<',
            '>=': '>=',
            '<=': '<=',
            'like': 'LIKE',
            'ilike': 'ILIKE',
            'in': 'IN',
            'is null': 'IS NULL',
            'is not null': 'IS NOT NULL',
            'contains': 'ILIKE'
        };
        return validOperators[op.toLowerCase()] || '=';
    }

    private getDataTypeName(oid: number): string {
        const typeMap: { [key: number]: string } = {
            16: 'boolean',
            17: 'bytea',
            20: 'bigint',
            21: 'smallint',
            23: 'integer',
            25: 'text',
            114: 'json',
            700: 'real',
            701: 'double precision',
            1042: 'char',
            1043: 'varchar',
            1082: 'date',
            1083: 'time',
            1114: 'timestamp',
            1184: 'timestamptz',
            2950: 'uuid',
            3802: 'jsonb'
        };
        return typeMap[oid] || 'unknown';
    }

    // =====================================
    // SCHEMA OPERATIONS
    // =====================================

    /**
     * Get list of all schemas
     */
    async getSchemas(): Promise<{ name: string; tableCount: number }[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                n.nspname as name,
                COUNT(c.relname)::int as table_count
            FROM pg_namespace n
            LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relkind = 'r'
            WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
            AND n.nspname NOT LIKE 'pg_%'
            GROUP BY n.nspname
            ORDER BY n.nspname
        `);
        return result.map(r => ({ name: r.name, tableCount: r.table_count || 0 }));
    }

    /**
     * Create a new schema
     */
    async createSchema(schemaName: string): Promise<void> {
        // Validate schema name (alphanumeric and underscores only)
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schemaName)) {
            throw new Error('Invalid schema name. Use only letters, numbers, and underscores.');
        }
        
        await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    }

    // =====================================
    // TABLE OPERATIONS
    // =====================================

    /**
     * Column definition for creating tables
     */
    async createTable(
        schema: string,
        tableName: string,
        columns: {
            name: string;
            type: string;
            nullable?: boolean;
            defaultValue?: string;
            isPrimaryKey?: boolean;
        }[]
    ): Promise<void> {
        // Validate names
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
            throw new Error('Invalid schema name');
        }
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
            throw new Error('Invalid table name');
        }
        if (columns.length === 0) {
            throw new Error('At least one column is required');
        }

        // Build column definitions
        const columnDefs = columns.map(col => {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col.name)) {
                throw new Error(`Invalid column name: ${col.name}`);
            }
            
            let def = `"${col.name}" ${col.type}`;
            if (col.isPrimaryKey) {
                def += ' PRIMARY KEY';
            }
            if (!col.nullable && !col.isPrimaryKey) {
                def += ' NOT NULL';
            }
            if (col.defaultValue !== undefined && col.defaultValue !== '') {
                def += ` DEFAULT ${col.defaultValue}`;
            }
            return def;
        });

        const sql = `CREATE TABLE "${schema}"."${tableName}" (${columnDefs.join(', ')})`;
        await prisma.$executeRawUnsafe(sql);
    }

    /**
     * Drop a table
     */
    async dropTable(schema: string, tableName: string): Promise<void> {
        // Validate that table exists
        const tables = await this.getTables();
        const exists = tables.some(t => t.schema === schema && t.tableName === tableName);
        if (!exists) {
            throw new Error(`Table "${schema}"."${tableName}" not found`);
        }

        await prisma.$executeRawUnsafe(`DROP TABLE "${schema}"."${tableName}"`);
    }

    // =====================================
    // ROW OPERATIONS
    // =====================================

    /**
     * Get primary key column for a table
     */
    async getPrimaryKeyColumn(schema: string, tableName: string): Promise<string | null> {
        const columns = await this.getTableColumns(tableName, schema);
        const pkColumn = columns.find(c => c.isPrimaryKey);
        return pkColumn?.name || null;
    }

    /**
     * Validate table exists and return table info
     */
    private async validateTableName(schema: string, tableName: string): Promise<TableInfo> {
        const tables = await this.getTables();
        const table = tables.find(t => t.schema === schema && t.tableName === tableName);
        if (!table) {
            throw new Error(`Table "${schema}"."${tableName}" not found`);
        }
        return table;
    }

    /**
     * Insert a new row into a table
     */
    async insertRow(
        schema: string,
        tableName: string,
        data: Record<string, any>
    ): Promise<any> {
        const table = await this.validateTableName(schema, tableName);
        
        // Filter out undefined/null for columns with auto-generated defaults
        const columns = Object.keys(data).filter(key => {
            const col = table.columns.find(c => c.name === key);
            return col && data[key] !== undefined;
        });
        
        if (columns.length === 0) {
            throw new Error('No valid columns provided');
        }

        // Build parameterized INSERT
        const columnNames = columns.map(c => `"${c}"`).join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const values = columns.map(c => data[c]);

        const sql = `INSERT INTO "${schema}"."${tableName}" (${columnNames}) VALUES (${placeholders}) RETURNING *`;
        const result = await prisma.$queryRawUnsafe<any[]>(sql, ...values);
        
        return result[0];
    }

    /**
     * Update an existing row
     */
    async updateRow(
        schema: string,
        tableName: string,
        pkValue: any,
        data: Record<string, any>
    ): Promise<any> {
        const table = await this.validateTableName(schema, tableName);
        
        const pkColumn = table.columns.find(c => c.isPrimaryKey);
        if (!pkColumn) {
            throw new Error('Table has no primary key');
        }

        // Build SET clause
        const updateColumns = Object.keys(data).filter(key => {
            const col = table.columns.find(c => c.name === key);
            return col && !col.isPrimaryKey; // Don't update primary key
        });

        if (updateColumns.length === 0) {
            throw new Error('No valid columns to update');
        }

        const setClause = updateColumns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
        const values = [...updateColumns.map(c => data[c]), pkValue];
        const pkPlaceholder = `$${updateColumns.length + 1}`;

        const sql = `UPDATE "${schema}"."${tableName}" SET ${setClause} WHERE "${pkColumn.name}" = ${pkPlaceholder} RETURNING *`;
        const result = await prisma.$queryRawUnsafe<any[]>(sql, ...values);
        
        if (result.length === 0) {
            throw new Error('Row not found');
        }
        
        return result[0];
    }

    /**
     * Delete a row
     */
    async deleteRow(
        schema: string,
        tableName: string,
        pkValue: any
    ): Promise<void> {
        const table = await this.validateTableName(schema, tableName);
        
        const pkColumn = table.columns.find(c => c.isPrimaryKey);
        if (!pkColumn) {
            throw new Error('Table has no primary key');
        }

        const sql = `DELETE FROM "${schema}"."${tableName}" WHERE "${pkColumn.name}" = $1`;
        await prisma.$executeRawUnsafe(sql, pkValue);
    }
}

export const databaseExplorerService = new DatabaseExplorerService();
export default databaseExplorerService;
