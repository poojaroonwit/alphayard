import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import databaseExplorerService from '../../services/databaseExplorerService';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin as any);
// Database routes require 'database' module permission
router.use(requirePermission('database', 'view'));

// =====================================
// DATABASE STATS
// =====================================

/**
 * GET /api/v1/admin/database/stats
 * Get database statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = await databaseExplorerService.getDatabaseStats();
        res.json({ success: true, stats });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error getting stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// TABLES
// =====================================

/**
 * GET /api/v1/admin/database/tables
 * Get list of all tables
 */
router.get('/tables', async (req: Request, res: Response) => {
    try {
        const tables = await databaseExplorerService.getTables();
        res.json({ success: true, tables });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error getting tables:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/admin/database/tables/:tableName
 * Get detailed information about a specific table
 */
router.get('/tables/:tableName', async (req: Request, res: Response) => {
    try {
        const { tableName } = req.params;
        const details = await databaseExplorerService.getTableDetails(tableName);
        res.json({ success: true, ...details });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error getting table details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/admin/database/tables/:tableName/columns
 * Get columns for a specific table
 */
router.get('/tables/:tableName/columns', async (req: Request, res: Response) => {
    try {
        const { tableName } = req.params;
        const columns = await databaseExplorerService.getTableColumns(tableName);
        res.json({ success: true, columns });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error getting columns:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/admin/database/tables/:tableName/data
 * Get data from a table with pagination
 */
router.get('/tables/:tableName/data', async (req: Request, res: Response) => {
    try {
        const { tableName } = req.params;
        const { 
            page, 
            pageSize, 
            orderBy, 
            orderDir, 
            search,
            searchColumns,
            filters 
        } = req.query;

        const result = await databaseExplorerService.getTableData(tableName, {
            page: page ? parseInt(page as string) : 1,
            pageSize: pageSize ? parseInt(pageSize as string) : 50,
            orderBy: orderBy as string,
            orderDir: orderDir as 'asc' | 'desc',
            search: search as string,
            searchColumns: searchColumns ? (searchColumns as string).split(',') : undefined,
            filters: filters ? JSON.parse(filters as string) : undefined
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error getting table data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/admin/database/tables/:tableName/rows/:id
 * Get a specific row by primary key
 */
router.get('/tables/:tableName/rows/:id', async (req: Request, res: Response) => {
    try {
        const { tableName, id } = req.params;
        const row = await databaseExplorerService.getRowById(tableName, id);
        
        if (!row) {
            return res.status(404).json({ success: false, error: 'Row not found' });
        }

        res.json({ success: true, row });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error getting row:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// SQL QUERY EXECUTION
// =====================================

/**
 * POST /api/v1/admin/database/query
 * Execute a SQL query (read-only by default)
 */
router.post('/query', requirePermission('database', 'query'), async (req: Request, res: Response) => {
    try {
        const { sql, readOnly = true } = req.body;

        if (!sql || typeof sql !== 'string') {
            return res.status(400).json({ success: false, error: 'SQL query is required' });
        }

        if (sql.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'SQL query cannot be empty' });
        }

        // Limit query length
        if (sql.length > 10000) {
            return res.status(400).json({ success: false, error: 'Query too long (max 10000 characters)' });
        }

        const result = await databaseExplorerService.executeQuery(sql, readOnly);
        
        res.json({ 
            success: true, 
            ...result,
            query: sql.substring(0, 500) // Return first 500 chars of query for reference
        });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Query error:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message,
            hint: 'Make sure your query is a valid SELECT statement.'
        });
    }
});

/**
 * POST /api/v1/admin/database/explain
 * Get query execution plan
 */
router.post('/explain', requirePermission('database', 'query'), async (req: Request, res: Response) => {
    try {
        const { sql } = req.body;

        if (!sql || typeof sql !== 'string') {
            return res.status(400).json({ success: false, error: 'SQL query is required' });
        }

        const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
        const result = await databaseExplorerService.executeQuery(explainSql, true);
        
        res.json({ 
            success: true, 
            plan: (result as any)[0]?.['QUERY PLAN'] || result,
            executionTimeMs: (result as any).executionTimeMs
        });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Explain error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// =====================================
// QUERY HISTORY
// =====================================

/**
 * GET /api/v1/admin/database/history
 * Get query history (if pg_stat_statements is enabled)
 */
router.get('/history', async (req: Request, res: Response) => {
    try {
        const history = await databaseExplorerService.getQueryHistory();
        res.json({ success: true, history });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error getting history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// SAVED QUERIES (in-memory for now)
// =====================================

// Simple in-memory storage for saved queries (in production, use database)
const savedQueries: Map<string, { name: string; sql: string; createdAt: Date }> = new Map();

/**
 * GET /api/v1/admin/database/saved-queries
 * Get saved queries
 */
router.get('/saved-queries', (req: Request, res: Response) => {
    const queries = Array.from(savedQueries.entries()).map(([id, query]) => ({
        id,
        ...query
    }));
    res.json({ success: true, queries });
});

/**
 * POST /api/v1/admin/database/saved-queries
 * Save a query
 */
router.post('/saved-queries', (req: Request, res: Response) => {
    const { name, sql } = req.body;
    
    if (!name || !sql) {
        return res.status(400).json({ success: false, error: 'Name and SQL are required' });
    }

    const id = `query_${Date.now()}`;
    savedQueries.set(id, { name, sql, createdAt: new Date() });
    
    res.json({ success: true, id, message: 'Query saved successfully' });
});

/**
 * DELETE /api/v1/admin/database/saved-queries/:id
 * Delete a saved query
 */
router.delete('/saved-queries/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!savedQueries.has(id)) {
        return res.status(404).json({ success: false, error: 'Query not found' });
    }

    savedQueries.delete(id);
    res.json({ success: true, message: 'Query deleted' });
});

// =====================================
// SCHEMA OPERATIONS
// =====================================

/**
 * GET /api/v1/admin/database/schemas
 * Get list of all schemas
 */
router.get('/schemas', async (req: Request, res: Response) => {
    try {
        const schemas = await databaseExplorerService.getSchemas();
        res.json({ success: true, schemas });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error getting schemas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/admin/database/schemas
 * Create a new schema
 */
router.post('/schemas', requirePermission('database', 'manage'), async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ success: false, error: 'Schema name is required' });
        }

        await databaseExplorerService.createSchema(name);
        res.json({ success: true, message: `Schema "${name}" created successfully` });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error creating schema:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// =====================================
// TABLE CRUD OPERATIONS
// =====================================

/**
 * POST /api/v1/admin/database/tables
 * Create a new table
 */
router.post('/tables', requirePermission('database', 'manage'), async (req: Request, res: Response) => {
    try {
        const { schema, tableName, columns } = req.body;
        
        if (!schema || !tableName || !columns || !Array.isArray(columns)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Schema, table name, and columns array are required' 
            });
        }

        await databaseExplorerService.createTable(schema, tableName, columns);
        res.json({ success: true, message: `Table "${schema}"."${tableName}" created successfully` });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error creating table:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/v1/admin/database/tables/:schema/:tableName
 * Drop a table
 */
router.delete('/tables/:schema/:tableName', requirePermission('database', 'manage'), async (req: Request, res: Response) => {
    try {
        const { schema, tableName } = req.params;
        
        await databaseExplorerService.dropTable(schema, tableName);
        res.json({ success: true, message: `Table "${schema}"."${tableName}" dropped successfully` });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error dropping table:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// =====================================
// ROW CRUD OPERATIONS
// =====================================

/**
 * POST /api/v1/admin/database/tables/:schema/:tableName/rows
 * Insert a new row
 */
router.post('/tables/:schema/:tableName/rows', requirePermission('database', 'manage'), async (req: Request, res: Response) => {
    try {
        const { schema, tableName } = req.params;
        const data = req.body;
        
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            return res.status(400).json({ success: false, error: 'Row data is required' });
        }

        const row = await databaseExplorerService.insertRow(schema, tableName, data);
        res.json({ success: true, row, message: 'Row inserted successfully' });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error inserting row:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/v1/admin/database/tables/:schema/:tableName/rows/:id
 * Update an existing row
 */
router.put('/tables/:schema/:tableName/rows/:id', requirePermission('database', 'manage'), async (req: Request, res: Response) => {
    try {
        const { schema, tableName, id } = req.params;
        const data = req.body;
        
        if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
            return res.status(400).json({ success: false, error: 'Row data is required' });
        }

        const row = await databaseExplorerService.updateRow(schema, tableName, id, data);
        res.json({ success: true, row, message: 'Row updated successfully' });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error updating row:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/v1/admin/database/tables/:schema/:tableName/rows/:id
 * Delete a row
 */
router.delete('/tables/:schema/:tableName/rows/:id', requirePermission('database', 'manage'), async (req: Request, res: Response) => {
    try {
        const { schema, tableName, id } = req.params;
        
        await databaseExplorerService.deleteRow(schema, tableName, id);
        res.json({ success: true, message: 'Row deleted successfully' });
    } catch (error: any) {
        console.error('[DatabaseExplorer] Error deleting row:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
