import { prisma } from '../lib/prisma';

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
    async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
        try {
            await prisma.$queryRaw<any[]>`
                INSERT INTO audit_logs (
                    id, user_id, action, category, resource, resource_id, 
                    details, ip_address, user_agent, created_at
                )
                VALUES (
                    gen_random_uuid()::uuid,
                    ${entry.userId || null}::uuid,
                    ${entry.action},
                    ${entry.category},
                    ${entry.resource},
                    ${entry.resourceId || null}::uuid,
                    ${JSON.stringify(entry.details || {})}::jsonb,
                    ${entry.ipAddress || null},
                    ${entry.userAgent || null},
                    NOW()
                )
            `;
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
        let whereClause = '1=1';
        const params: any[] = [];

        if (filters.userId) {
            whereClause += ` AND user_id = $${params.length + 1}::uuid`;
            params.push(filters.userId);
        }

        if (filters.category) {
            whereClause += ` AND category = $${params.length + 1}`;
            params.push(filters.category);
        }

        if (filters.action) {
            whereClause += ` AND action = $${params.length + 1}`;
            params.push(filters.action);
        }

        if (filters.resource) {
            whereClause += ` AND resource = $${params.length + 1}`;
            params.push(filters.resource);
        }

        if (filters.startDate) {
            whereClause += ` AND created_at >= $${params.length + 1}`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            whereClause += ` AND created_at <= $${params.length + 1}`;
            params.push(filters.endDate);
        }

        const limit = filters.limit || 100;
        const offset = filters.offset || 0;

        const query = `
            SELECT 
                id, user_id as "userId", action, category, resource, resource_id as "resourceId",
                details, ip_address as "ipAddress", user_agent as "userAgent", created_at as "timestamp"
            FROM audit_logs 
            WHERE ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
        `;

        try {
            const rows = await prisma.$queryRawUnsafe<any[]>(query, ...params);
            return rows.map(row => ({
                ...row,
                timestamp: new Date(row.timestamp)
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
            let whereClause = '1=1';
            const params: any[] = [];

            if (filters.userId) {
                whereClause += ` AND user_id = $${params.length + 1}::uuid`;
                params.push(filters.userId);
            }

            if (filters.category) {
                whereClause += ` AND category = $${params.length + 1}`;
                params.push(filters.category);
            }

            if (filters.action) {
                whereClause += ` AND action = $${params.length + 1}`;
                params.push(filters.action);
            }

            if (filters.startDate) {
                whereClause += ` AND created_at >= $${params.length + 1}`;
                params.push(filters.startDate);
            }

            if (filters.endDate) {
                whereClause += ` AND created_at <= $${params.length + 1}`;
                params.push(filters.endDate);
            }

            const query = `
                SELECT 
                    category,
                    action,
                    COUNT(*) as count,
                    DATE_TRUNC('day', created_at) as date
                FROM audit_logs 
                WHERE ${whereClause}
                GROUP BY category, action, DATE_TRUNC('day', created_at)
                ORDER BY date DESC, count DESC
            `;

            const rows = await prisma.$queryRawUnsafe<any[]>(query, ...params);
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
