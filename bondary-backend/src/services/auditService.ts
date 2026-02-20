import { prisma } from '../lib/prisma';
import type { AuditLog as PrismaAuditLog } from '../lib/prisma';

export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  USER_MANAGEMENT = 'user_management',
  CIRCLE_MANAGEMENT = 'circle_management',
  SAFETY = 'safety',
  BILLING = 'billing',
  SYSTEM = 'system',
  SECURITY = 'security',
  DATA = 'data',
  API = 'api',
}

export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  LOGIN_FAILED = 'login_failed',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  EMERGENCY_ALERT_CREATED = 'emergency_alert_created',
  SAFETY_CHECK_REQUESTED = 'safety_check_requested',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SYSTEM_STARTUP = 'system_startup',
  SECURITY_ALERT = 'security_alert',
  API_CALL = 'api_call',
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  category: AuditCategory;
  level: AuditLevel;
  description: string;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  resourceId: string | null;
  resourceType: string | null;
  timestamp: Date;
}

class AuditService {
  public auditActions = AuditAction;

  /**
   * Convert Prisma AuditLog to service AuditLog interface
   */
  private mapPrismaToService(prismaLog: PrismaAuditLog): AuditLog {
    const newValues = (prismaLog.newValues as any) || {};
    return {
      id: prismaLog.id,
      userId: prismaLog.actorId || null,
      action: prismaLog.action,
      category: newValues.category || AuditCategory.SYSTEM,
      level: newValues.level || AuditLevel.INFO,
      description: newValues.description || prismaLog.action,
      details: newValues.details || {},
      ipAddress: prismaLog.ipAddress || null,
      userAgent: newValues.userAgent || null,
      resourceId: prismaLog.recordId || null,
      resourceType: prismaLog.tableName || null,
      timestamp: prismaLog.createdAt,
    };
  }

  async logAPIEvent(userId: string | null, action: string, path: string, details = {}) {
    return this.logAuditEvent({
      userId,
      action,
      category: AuditCategory.API,
      description: `API Call: ${action} on ${path}`,
      details,
    });
  }

  async logAuditEvent(options: Partial<AuditLog> & { action: string; category: AuditCategory; description: string }) {
    try {
      const level = options.level || AuditLevel.INFO;
      const actorType = options.userId ? 'user' : 'system';
      
      // Store additional metadata in newValues JSON field
      const newValues = {
        category: options.category,
        level: level,
        description: options.description,
        details: options.details || {},
        userAgent: options.userAgent || null,
      };

      // Store in database using Prisma
      const auditLog = await prisma.auditLog.create({
        data: {
          actorType: actorType,
          actorId: options.userId || null,
          action: options.action,
          tableName: options.resourceType || null,
          recordId: options.resourceId || null,
          newValues: newValues,
          ipAddress: options.ipAddress || null,
        },
      });

      console.log(`[AUDIT] ${options.category} - ${options.action}: ${options.description}`);

      // Return in service format
      return this.mapPrismaToService(auditLog);
    } catch (error) {
      console.error('Log audit event error:', error);
      throw error;
    }
  }

  // Simplified convenience methods
  async logAuthenticationEvent(userId: string | null, action: AuditAction, details = {}) {
    return this.logAuditEvent({
      userId,
      action,
      category: AuditCategory.AUTHENTICATION,
      description: `Authentication event: ${action}`,
      details,
    });
  }

  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    category?: AuditCategory;
    level?: AuditLevel;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const where: any = {};

      if (filters.userId) {
        where.actorType = 'user';
        where.actorId = filters.userId;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      const offset = filters.offset || 0;
      const limit = filters.limit || 100;

      // Fetch logs from database
      const [prismaLogs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip: offset,
          take: limit,
        }),
        prisma.auditLog.count({ where }),
      ]);

      // Convert to service format and apply category/level filters if needed
      let logs = prismaLogs.map(log => this.mapPrismaToService(log));

      if (filters.category) {
        logs = logs.filter(l => l.category === filters.category);
      }

      if (filters.level) {
        logs = logs.filter(l => l.level === filters.level);
      }

      return {
        logs,
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Get audit logs error:', error);
      throw error;
    }
  }

  async getAuditStatistics(filters: { startDate?: string; endDate?: string }) {
    try {
      const where: any = {};

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // Fetch all logs in the date range
      const prismaLogs = await prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Convert to service format
      const logs = prismaLogs.map(log => this.mapPrismaToService(log));

      const stats: any = {
        totalLogs: logs.length,
        byCategory: {},
        byLevel: {},
        byAction: {},
      };

      logs.forEach(log => {
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Get audit statistics error:', error);
      throw error;
    }
  }

  async exportAuditLogs(filters: { startDate?: string; endDate?: string }, format: string = 'csv') {
    try {
      const { logs } = await this.getAuditLogs({ ...filters, limit: 10000 });
      
      if (format === 'json') {
        return {
          data: JSON.stringify(logs, null, 2),
          format: 'json',
          filename: `audit_logs_${Date.now()}.json`,
        };
      }

      // Simple CSV export
      const headers = ['ID', 'Timestamp', 'User ID', 'Category', 'Action', 'Level', 'Description'];
      const rows = logs.map(l => [
        l.id,
        l.timestamp.toISOString(),
        l.userId || '',
        l.category,
        l.action,
        l.level,
        l.description.replace(/"/g, '""'),
      ].map(field => `"${field}"`).join(','));

      const csvData = [headers.join(','), ...rows].join('\n');
      
      return {
        data: csvData,
        format: 'csv',
        filename: `audit_logs_${Date.now()}.csv`,
      };
    } catch (error) {
      console.error('Export audit logs error:', error);
      throw error;
    }
  }

  /**
   * Get logs - kept for backward compatibility
   * Note: This now fetches from database instead of returning in-memory logs
   */
  async getLogs(limit: number = 100) {
    const { logs } = await this.getAuditLogs({ limit });
    return logs;
  }
}

export const auditService = new AuditService();
export default auditService;
