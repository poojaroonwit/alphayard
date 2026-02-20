import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

// @route   GET /api/health
// @desc    Health check endpoint
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        responseTime: `${responseTime}ms`
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// @route   GET /api/health/detailed
// @desc    Detailed health check
// @access  Private
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    // Use circles instead of families
    // Note: unified_entities table doesn't have a Prisma model, using $queryRaw
    const statsRows = await prisma.$queryRaw<Array<{
      usersCount: bigint;
      familiesCount: bigint;
      locationsCount: bigint;
    }>>`
      SELECT 
        (SELECT count(*) FROM core.users) as "usersCount",
        (SELECT count(*) FROM unified_entities WHERE type = 'circle') as "familiesCount",
        (SELECT count(*) FROM unified_entities WHERE type = 'location_history') as "locationsCount"
    `;
    const responseTime = Date.now() - start;
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        responseTime: `${responseTime}ms`
      },
      database: {
        stats: statsRows[0],
        connection: 'ok',
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        version: process.env.npm_package_version || '1.0.0',
      },
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;
