import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { isIP } from 'node:net';

export enum AuditCategory {
    AUTH = 'auth',
    USER = 'user',
    ADMIN = 'admin',
    SYSTEM = 'system',
    SECURITY = 'security',
    DATA = 'data'
}

export enum AuditAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    VIEW = 'view',
    LOGIN = 'login',
    LOGOUT = 'logout',
    ACCESS = 'access',
    FAILED = 'failed',
    SECURITY_ALERT = 'security_alert',
    SYSTEM_HEALTH_CHECK = 'system_health_check'
}

export interface AuditLogEntry {
    id?: string;
    userId?: string;
    action: AuditAction;
    category: AuditCategory;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

/**
 * Audit Service
 * 
 * Handles logging of administrative and security events for compliance and debugging.
 */
class AuditService {
    private isUuid(value?: string | null): boolean {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
    }

    private toUuidOrNull(value?: string | null): string | null {
        if (!value) return null;
        const normalized = value.trim();
        return this.isUuid(normalized) ? normalized : null;
    }

    private toInetOrNull(value?: string | null): string | null {
        if (!value) return null;

        // x-forwarded-for may contain a chain: "client, proxy1, proxy2"
        const firstHop = value.split(',')[0]?.trim();
        if (!firstHop) return null;

        // Handle bracketed IPv6 with optional port, e.g. "[2001:db8::1]:443"
        const bracketed = firstHop.match(/^\[([^\]]+)\](?::\d+)?$/);
        if (bracketed?.[1] && isIP(bracketed[1])) return bracketed[1];

        // Handle IPv4 with optional port, e.g. "203.0.113.1:443"
        const ipv4WithPort = firstHop.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
        if (ipv4WithPort?.[1] && isIP(ipv4WithPort[1])) return ipv4WithPort[1];

        return isIP(firstHop) ? firstHop : null;
    }

    async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
        try {
            const safeUserId = this.toUuidOrNull(entry.userId);
            const safeResourceId = this.toUuidOrNull(entry.resourceId);
            const safeIpAddress = this.toInetOrNull(entry.ipAddress);

            await prisma.auditLog.create({
                data: {
                    userId: safeUserId,
                    action: entry.action,
                    category: entry.category,
                    resource: entry.resource,
                    resourceId: safeResourceId,
                    details: entry.details || {},
                    ipAddress: safeIpAddress,
                    userAgent: entry.userAgent || null,
                }
            });
        } catch (error) {
            console.error('Failed to log audit entry:', error);
            // Don't throw - audit failures shouldn't break the main flow
        }
    }

    async logAdminAction(
        userId: string,
        action: AuditAction,
        resource: string,
        resourceId?: string,
        details?: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.log({
            userId,
            action,
            category: AuditCategory.ADMIN,
            resource,
            resourceId,
            details,
            ipAddress,
            userAgent
        });
    }

    async logAuthEvent(
        userId: string,
        action: AuditAction,
        resource: string,
        details?: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.log({
            userId,
            action,
            category: AuditCategory.AUTH,
            resource,
            details,
            ipAddress,
            userAgent
        });
    }

    async logSecurityEvent(
        action: AuditAction,
        resource: string,
        details?: any,
        userId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.log({
            userId,
            action,
            category: AuditCategory.SECURITY,
            resource,
            details,
            ipAddress,
            userAgent
        });
    }

    async logAuditEvent(params: {
        userId?: string;
        action: AuditAction;
        category?: AuditCategory;
        resource: string;
        description?: string;
        details?: any;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void> {
        await this.log({
            userId: params.userId,
            action: params.action,
            category: params.category || AuditCategory.SYSTEM,
            resource: params.resource,
            details: {
                ...params.details,
                description: params.description
            },
            ipAddress: params.ipAddress,
            userAgent: params.userAgent
        });
    }

    async queryLogs(filters: {
        userId?: string;
        category?: AuditCategory;
        action?: AuditAction;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<AuditLogEntry[]> {
        try {
            const where: any = {};
            
            if (filters.userId) where.userId = filters.userId;
            if (filters.category) where.category = filters.category;
            if (filters.action) where.action = filters.action;
            if (filters.resource) where.resource = filters.resource;
            
            if (filters.startDate || filters.endDate) {
                where.createdAt = {};
                if (filters.startDate) where.createdAt.gte = filters.startDate;
                if (filters.endDate) where.createdAt.lte = filters.endDate;
            }

            const logs = await prisma.auditLog.findMany({
                where,
                take: filters.limit || 100,
                skip: filters.offset || 0,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    application: true
                }
            });

            return logs.map(log => ({
                id: log.id,
                userId: log.userId || undefined,
                action: log.action as AuditAction,
                category: log.category as AuditCategory,
                resource: log.resource || '',
                resourceId: log.resourceId || undefined,
                details: log.details,
                ipAddress: log.ipAddress || undefined,
                userAgent: log.userAgent || undefined,
                timestamp: log.createdAt
            }));
        } catch (error) {
            console.error('Failed to query audit logs:', error);
            return [];
        }
    }

    async getAuditLogs(filters: {
        userId?: string;
        category?: AuditCategory;
        action?: AuditAction;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{ logs: AuditLogEntry[]; total: number }> {
        const logs = await this.queryLogs(filters);
        return { logs, total: logs.length };
    }

    async getAuditStatistics(filters: {
        userId?: string;
        category?: AuditCategory;
        action?: AuditAction;
        startDate?: Date;
        endDate?: Date;
    }): Promise<any> {
        try {
            const where: any = {};
            if (filters.userId) where.userId = filters.userId;
            if (filters.category) where.category = filters.category;
            if (filters.action) where.action = filters.action;
            
            if (filters.startDate || filters.endDate) {
                where.createdAt = {};
                if (filters.startDate) where.createdAt.gte = filters.startDate;
                if (filters.endDate) where.createdAt.lte = filters.endDate;
            }

            // Since we want group by date_trunc, we'll use queryRaw but WITHOUT schema prefix
            // This will respect the search_path or the default schema
            const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
                SELECT 
                    category,
                    action,
                    COUNT(*)::int as count,
                    DATE_TRUNC('day', created_at) as date
                FROM audit_logs 
                WHERE 1=1
                ${filters.userId ? Prisma.sql`AND user_id = ${filters.userId}::uuid` : Prisma.empty}
                ${filters.category ? Prisma.sql`AND category = ${filters.category}` : Prisma.empty}
                ${filters.action ? Prisma.sql`AND action = ${filters.action}` : Prisma.empty}
                ${filters.startDate ? Prisma.sql`AND created_at >= ${filters.startDate}` : Prisma.empty}
                ${filters.endDate ? Prisma.sql`AND created_at <= ${filters.endDate}` : Prisma.empty}
                GROUP BY category, action, DATE_TRUNC('day', created_at)
                ORDER BY date DESC, count DESC
            `);

            return rows;
        } catch (error) {
            console.error('Failed to get audit statistics:', error);
            return [];
        }
    }

    async exportAuditLogs(filters: {
        userId?: string;
        category?: AuditCategory;
        action?: AuditAction;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        format?: 'csv' | 'json';
    }): Promise<any> {
        try {
            const logs = await this.queryLogs(filters);
            const format = filters.format || 'json';

            if (format === 'csv') {
                // Convert to CSV format
                const headers = ['ID', 'User ID', 'Action', 'Category', 'Resource', 'Resource ID', 'IP Address', 'User Agent', 'Timestamp'];
                const csvRows = logs.map(log => [
                    log.id || '',
                    log.userId || '',
                    log.action,
                    log.category,
                    log.resource,
                    log.resourceId || '',
                    log.ipAddress || '',
                    log.userAgent || '',
                    log.timestamp?.toISOString() || ''
                ]);
                
                return [headers, ...csvRows].map(row => row.join(',')).join('\n');
            } else {
                // Return JSON format
                return {
                    exportDate: new Date().toISOString(),
                    filters,
                    totalLogs: logs.length,
                    logs
                };
            }
        } catch (error) {
            console.error('Failed to export audit logs:', error);
            throw new Error('Failed to export audit logs');
        }
    }
}

export const auditService = new AuditService();
export default auditService;
