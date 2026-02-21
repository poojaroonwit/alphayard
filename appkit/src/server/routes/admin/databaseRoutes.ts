import express, { Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = express.Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// =====================================================
// DATABASE ROUTES
// =====================================================

/**
 * GET /database
 * Database Explorer
 */
router.get('/database', requirePermission('database', 'view'), (req: Request, res: Response) => {
  res.json({
    success: true,
    database: {
      tables: [],
      schemas: [],
      connections: []
    },
    message: 'Database explorer endpoint'
  });
});

export default router;
