import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import redisService from '../services/redisService';
import { auditService, AuditCategory } from '../services/auditService';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheckItem;
    redis: HealthCheckItem;
    memory: HealthCheckItem;
    disk: HealthCheckItem;
    api: HealthCheckItem;
  };
  errors?: string[];
}

interface HealthCheckItem {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  message: string;
  details?: any;
}

class HealthCheckService {
  private startTime: Date;
  private version: string;
  constructor() {
    this.startTime = new Date();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  /**
   * Main health check endpoint
   */
  async checkHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const results = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkMemory(),
        this.checkDisk(),
        this.checkAPI(),
      ]);

      const checks = {
        database: this.getResult(results[0]),
        redis: this.getResult(results[1]),
        memory: this.getResult(results[2]),
        disk: this.getResult(results[3]),
        api: this.getResult(results[4]),
      };

      // Determine overall status
      const statuses = Object.values(checks).map(check => check.status);
      const overallStatus = this.getOverallStatus(statuses);

      const healthCheckResult: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        version: this.version,
        environment: process.env.NODE_ENV || 'development',
        checks,
      };

      // Add errors if any
      const errors = Object.entries(checks)
        .filter(([_, check]) => check.status === 'unhealthy')
        .map(([name, check]) => `${name}: ${check.message}`);

      if (errors.length > 0) {
        healthCheckResult.errors = errors;
      }

      // Log health check results
      await this.logHealthCheck(healthCheckResult, req);

      // Set appropriate HTTP status code
      const statusCode = overallStatus === 'healthy' ? 200 : 
                         overallStatus === 'degraded' ? 200 : 503;

      res.status(statusCode).json(healthCheckResult);

    } catch (error) {
      console.error('Health check failed:', error);
      
      const errorResult: HealthCheckResult = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime.getTime(),
        version: this.version,
        environment: process.env.NODE_ENV || 'development',
        checks: {
          database: { status: 'unhealthy', responseTime: 0, message: 'Check failed' },
          redis: { status: 'unhealthy', responseTime: 0, message: 'Check failed' },
          memory: { status: 'unhealthy', responseTime: 0, message: 'Check failed' },
          disk: { status: 'unhealthy', responseTime: 0, message: 'Check failed' },
          api: { status: 'unhealthy', responseTime: 0, message: 'Check failed' },
        },
        errors: ['Health check system failure'],
      };

      res.status(503).json(errorResult);
    }
  }

  /**
   * Simple health check (for load balancers)
   */
  async simpleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Quick database check
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Readiness check (for Kubernetes)
   */
  async readinessCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check if all critical services are ready
      await Promise.all([
        this.checkDatabase(),
        this.checkRedis(),
      ]);

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Liveness check (for Kubernetes)
   */
  async livenessCheck(req: Request, res: Response): Promise<void> {
    // Simple check to see if the application is responsive
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
    });
  }

  private async checkDatabase(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    
    try {
      const client = await redisService.getClient();
      if (!client) throw new Error('Redis client unavailable');
      await client.ping();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 500 ? 'healthy' : 'degraded',
        responseTime,
        message: 'Redis connection successful',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  }

  private async checkMemory(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (memoryUsagePercent < 80) {
        status = 'healthy';
      } else if (memoryUsagePercent < 90) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        responseTime: Date.now() - startTime,
        message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
        details: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: memoryUsagePercent,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Memory check failed',
      };
    }
  }

  private async checkDisk(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    
    try {
      const fs = require('fs/promises');
      const stats = await fs.statfs(process.cwd());
      
      const totalSpace = stats.blocks * stats.bsize;
      const freeSpace = stats.bavail * stats.bsize;
      const usedSpace = totalSpace - freeSpace;
      const diskUsagePercent = (usedSpace / totalSpace) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (diskUsagePercent < 80) {
        status = 'healthy';
      } else if (diskUsagePercent < 90) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        responseTime: Date.now() - startTime,
        message: `Disk usage: ${diskUsagePercent.toFixed(2)}%`,
        details: {
          used: Math.round(usedSpace / 1024 / 1024 / 1024), // GB
          total: Math.round(totalSpace / 1024 / 1024 / 1024), // GB
          percentage: diskUsagePercent,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Disk check failed',
      };
    }
  }

  private async checkAPI(): Promise<HealthCheckItem> {
    const startTime = Date.now();
    
    try {
      // Check if the API server is responding
      // This is a self-check, so we just verify the process is running
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        message: 'API server is running',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'API check failed',
      };
    }
  }

  private getResult(result: PromiseSettledResult<HealthCheckItem>): HealthCheckItem {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        status: 'unhealthy',
        responseTime: 0,
        message: result.reason instanceof Error ? result.reason.message : 'Check failed',
      };
    }
  }

  private getOverallStatus(statuses: Array<'healthy' | 'unhealthy' | 'degraded'>): 'healthy' | 'unhealthy' | 'degraded' {
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    } else if (statuses.includes('degraded')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  private async logHealthCheck(result: HealthCheckResult, req: Request): Promise<void> {
    try {
      // Only log unhealthy or degraded checks
      if (result.status !== 'healthy') {
        await auditService.logAuditEvent({
          userId: null,
          action: 'SYSTEM_HEALTH_CHECK',
          category: AuditCategory.SYSTEM,
          description: `Health check status: ${result.status}`,
          details: {
            status: result.status,
            checks: result.checks,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
          },
          ipAddress: req.ip,
        });
      }
    } catch (error) {
      console.error('Failed to log health check:', error);
    }
  }
}

export const healthCheckService = new HealthCheckService();
export default healthCheckService;
