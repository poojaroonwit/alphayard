import express, { Request, Response } from 'express';
import auditService, { AuditCategory, AuditAction } from '../../services/auditService';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// GET /api/audit/logs
router.get('/logs', requirePermission('audit', 'view'), async (req: Request, res: Response) => {
  try {
    const { userId, action, category, level, startDate, endDate, limit, offset } = req.query;
    const result = await auditService.getAuditLogs({
      userId: userId ? String(userId) : null,
      action: action ? String(action) : null,
      category: category ? (category as AuditCategory) : null,
      level: level ? String(level) : null,
      startDate: startDate ? String(startDate) : null,
      endDate: endDate ? String(endDate) : null,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
    } as any);

    // Normalize timestamps to ISO strings for the client
    const logs = (result.logs || []).map((l: any) => ({ 
      ...l, 
      timestamp: new Date(l.timestamp).toISOString() 
    }));

    res.json({ ...result, logs });
  } catch (e) {
    console.error('GET /api/audit/logs error', e);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// GET /api/audit/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await auditService.getAuditStatistics({ 
      startDate: startDate ? String(startDate) : null, 
      endDate: endDate ? String(endDate) : null 
    } as any);
    res.json(result);
  } catch (e) {
    console.error('GET /api/audit/stats error', e);
    res.status(500).json({ error: 'Failed to fetch audit stats' });
  }
});

// GET /api/audit/export?format=csv|json
router.get('/export', requirePermission('audit', 'export'), async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;
    const result: any = await auditService.exportAuditLogs(
      { startDate: startDate ? String(startDate) : null, endDate: endDate ? String(endDate) : null } as any, 
      String(format).toLowerCase()
    );

    const filename = result.filename || `audit_logs_${Date.now()}.${result.format || format}`;
    
    if (result.format === 'json') {
      res.setHeader('Content-Type', 'application/json');
    } else {
      res.setHeader('Content-Type', 'text/csv');
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.data);
  } catch (e) {
    console.error('GET /api/audit/export error', e);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

export default router;
