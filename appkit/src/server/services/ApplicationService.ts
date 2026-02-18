import { prisma } from '../lib/prisma';
import { Application, clearApplicationCache } from '../middleware/appScoping';
import { clearUserAccessCache } from '../middleware/tenantValidation';
import { clearAdminAccessCache } from '../middleware/adminAuth';

// ============================================================================
// Types
// ============================================================================

export interface CreateApplicationInput {
    name: string;
    slug: string;
    description?: string;
    branding?: Record<string, any>;
    settings?: Record<string, any>;
}

export interface UpdateApplicationInput {
    name?: string;
    description?: string;
    branding?: Record<string, any>;
    settings?: Record<string, any>;
    isActive?: boolean;
}

export interface ApplicationWithStats extends Application {
    userCount: number;
    adminCount: number;
}

export interface UserApplicationAssignment {
    userId: string;
    applicationId: string;
    role: 'member' | 'moderator' | 'admin';
    status: 'active' | 'suspended' | 'pending';
}

export interface AdminApplicationAssignment {
    adminUserId: string;
    applicationId: string;
    role: 'viewer' | 'editor' | 'admin' | 'super_admin';
    permissions?: string[];
    isPrimary?: boolean;
    grantedBy?: string;
}

// ============================================================================
// Application CRUD Operations
// ============================================================================

/**
 * Create a new application
 */
export async function createApplication(input: CreateApplicationInput): Promise<Application | null> {
    try {
        const app = await prisma.application.create({
            data: {
                name: input.name,
                slug: input.slug,
                description: input.description || null,
                branding: input.branding || {},
                settings: input.settings || {},
                isActive: true
            }
        });

        // Ensure branding is parsed if it's a string (can happen with JSONB)
        let branding = app.branding as Record<string, any>
        if (typeof branding === 'string') {
            try {
                branding = JSON.parse(branding)
            } catch (e) {
                console.error('[ApplicationService] Failed to parse branding string:', e)
                branding = {}
            }
        }
        
        // Ensure settings is parsed if it's a string
        let settings = app.settings as Record<string, any>
        if (typeof settings === 'string') {
            try {
                settings = JSON.parse(settings)
            } catch (e) {
                console.error('[ApplicationService] Failed to parse settings string:', e)
                settings = {}
            }
        }
        
        return {
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description,
            branding: branding || {},
            settings: settings || {},
            isActive: app.isActive,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
        };
    } catch (error: any) {
        if (error.code === 'P2002') { // Unique violation
            throw new Error('Application with this slug already exists');
        }
        console.error('[ApplicationService] Error creating application:', error);
        throw error;
    }
}

/**
 * Get application by ID
 */
export async function getApplicationById(id: string): Promise<Application | null> {
    try {
        const app = await prisma.application.findUnique({
            where: { id }
        });
        
        if (!app) return null;
        
        // Ensure branding is parsed if it's a string (can happen with JSONB)
        let branding = app.branding as Record<string, any>
        if (typeof branding === 'string') {
            try {
                branding = JSON.parse(branding)
            } catch (e) {
                console.error('[ApplicationService] Failed to parse branding string:', e)
                branding = {}
            }
        }
        
        // Ensure settings is parsed if it's a string
        let settings = app.settings as Record<string, any>
        if (typeof settings === 'string') {
            try {
                settings = JSON.parse(settings)
            } catch (e) {
                console.error('[ApplicationService] Failed to parse settings string:', e)
                settings = {}
            }
        }
        
        return {
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description,
            branding: branding || {},
            settings: settings || {},
            isActive: app.isActive,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
        };
    } catch (error) {
        console.error('[ApplicationService] Error getting application by ID:', error);
        return null;
    }
}

/**
 * Get application by slug
 */
export async function getApplicationBySlug(slug: string): Promise<Application | null> {
    try {
        const app = await prisma.application.findUnique({
            where: { slug }
        });
        
        if (!app) return null;
        
        // Ensure branding is parsed if it's a string (can happen with JSONB)
        let branding = app.branding as Record<string, any>
        if (typeof branding === 'string') {
            try {
                branding = JSON.parse(branding)
            } catch (e) {
                console.error('[ApplicationService] Failed to parse branding string:', e)
                branding = {}
            }
        }
        
        // Ensure settings is parsed if it's a string
        let settings = app.settings as Record<string, any>
        if (typeof settings === 'string') {
            try {
                settings = JSON.parse(settings)
            } catch (e) {
                console.error('[ApplicationService] Failed to parse settings string:', e)
                settings = {}
            }
        }
        
        return {
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description,
            branding: branding || {},
            settings: settings || {},
            isActive: app.isActive,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
        };
    } catch (error) {
        console.error('[ApplicationService] Error getting application by slug:', error);
        return null;
    }
}

/**
 * Get all applications with optional stats
 */
export async function getAllApplications(includeStats = false): Promise<Application[] | ApplicationWithStats[]> {
    try {
        if (includeStats) {
            const apps = await prisma.application.findMany({
                include: {
                    _count: {
                        select: {
                            userApplications: {
                                where: { status: 'active' }
                            },
                            adminUserApplications: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return apps.map(app => ({
                id: app.id,
                name: app.name,
                slug: app.slug,
                description: app.description,
                branding: app.branding as Record<string, any>,
                settings: app.settings as Record<string, any>,
                isActive: app.isActive,
                createdAt: app.createdAt,
                updatedAt: app.updatedAt,
                userCount: app._count.userApplications,
                adminCount: app._count.adminUserApplications
            }));
        }

        const apps = await prisma.application.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return apps.map(app => ({
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description,
            branding: app.branding as Record<string, any>,
            settings: app.settings as Record<string, any>,
            isActive: app.isActive,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
        }));
    } catch (error) {
        console.error('[ApplicationService] Error getting all applications:', error);
        return [];
    }
}

/**
 * Get active applications only
 */
export async function getActiveApplications(): Promise<Application[]> {
    try {
        const apps = await prisma.application.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        return apps.map(app => ({
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description,
            branding: app.branding as Record<string, any>,
            settings: app.settings as Record<string, any>,
            isActive: app.isActive,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
        }));
    } catch (error) {
        console.error('[ApplicationService] Error getting active applications:', error);
        return [];
    }
}

/**
 * Update an application
 */
export async function updateApplication(id: string, input: UpdateApplicationInput): Promise<Application | null> {
    try {
        const data: any = {};

        if (input.name !== undefined) data.name = input.name;
        if (input.description !== undefined) data.description = input.description;
        if (input.branding !== undefined) data.branding = input.branding;
        if (input.settings !== undefined) data.settings = input.settings;
        if (input.isActive !== undefined) data.isActive = input.isActive;

        if (Object.keys(data).length === 0) {
            return getApplicationById(id);
        }

        const app = await prisma.application.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        });

        // Clear cache
        clearApplicationCache(id);
        clearApplicationCache(app.slug);

        // Ensure branding is parsed if it's a string (can happen with JSONB)
        let branding = app.branding as Record<string, any>
        if (typeof branding === 'string') {
            try {
                branding = JSON.parse(branding)
            } catch (e) {
                console.error('[ApplicationService] Failed to parse branding string:', e)
                branding = {}
            }
        }
        
        // Ensure settings is parsed if it's a string
        let settings = app.settings as Record<string, any>
        if (typeof settings === 'string') {
            try {
                settings = JSON.parse(settings)
            } catch (e) {
                console.error('[ApplicationService] Failed to parse settings string:', e)
                settings = {}
            }
        }
        
        return {
            id: app.id,
            name: app.name,
            slug: app.slug,
            description: app.description,
            branding: branding || {},
            settings: settings || {},
            isActive: app.isActive,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt
        };
    } catch (error) {
        console.error('[ApplicationService] Error updating application:', error);
        throw error;
    }
}

/**
 * Delete (deactivate) an application
 */
export async function deleteApplication(id: string): Promise<boolean> {
    try {
        await prisma.application.update({
            where: { id },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });

        clearApplicationCache(id);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error deleting application:', error);
        return false;
    }
}

/**
 * Permanently delete an application (use with caution)
 */
export async function permanentlyDeleteApplication(id: string): Promise<boolean> {
    try {
        await prisma.application.delete({
            where: { id }
        });

        clearApplicationCache(id);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error permanently deleting application:', error);
        return false;
    }
}

// ============================================================================
// User-Application Assignment Operations
// ============================================================================

/**
 * Assign a user to an application
 */
export async function assignUserToApplication(
    assignment: UserApplicationAssignment
): Promise<boolean> {
    try {
        await prisma.userApplication.upsert({
            where: {
                userId_applicationId: {
                    userId: assignment.userId,
                    applicationId: assignment.applicationId
                }
            },
            update: {
                role: assignment.role,
                status: assignment.status,
                updatedAt: new Date()
            },
            create: {
                userId: assignment.userId,
                applicationId: assignment.applicationId,
                role: assignment.role,
                status: assignment.status,
                joinedAt: new Date()
            }
        });

        clearUserAccessCache(assignment.userId, assignment.applicationId);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error assigning user to application:', error);
        return false;
    }
}

/**
 * Remove a user from an application
 */
export async function removeUserFromApplication(
    userId: string,
    applicationId: string
): Promise<boolean> {
    try {
        await prisma.userApplication.delete({
            where: {
                userId_applicationId: {
                    userId,
                    applicationId
                }
            }
        });

        clearUserAccessCache(userId, applicationId);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error removing user from application:', error);
        return false;
    }
}

/**
 * Update a user's role in an application
 */
export async function updateUserApplicationRole(
    userId: string,
    applicationId: string,
    role: 'member' | 'moderator' | 'admin'
): Promise<boolean> {
    try {
        await prisma.userApplication.update({
            where: {
                userId_applicationId: {
                    userId,
                    applicationId
                }
            },
            data: {
                role,
                updatedAt: new Date()
            }
        });

        clearUserAccessCache(userId, applicationId);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error updating user application role:', error);
        return false;
    }
}

/**
 * Suspend a user's access to an application
 */
export async function suspendUserApplicationAccess(
    userId: string,
    applicationId: string
): Promise<boolean> {
    try {
        await prisma.userApplication.update({
            where: {
                userId_applicationId: {
                    userId,
                    applicationId
                }
            },
            data: {
                status: 'suspended',
                updatedAt: new Date()
            }
        });

        clearUserAccessCache(userId, applicationId);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error suspending user access:', error);
        return false;
    }
}

/**
 * Get all users for an application
 */
export async function getApplicationUsers(
    applicationId: string,
    options: { limit?: number; offset?: number; status?: string } = {}
): Promise<{ users: any[]; total: number }> {
    try {
        const { limit = 50, offset = 0, status } = options;

        const where: any = { applicationId };
        if (status) where.status = status;

        const [total, userApps] = await Promise.all([
            prisma.userApplication.count({ where }),
            prisma.userApplication.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true
                        }
                    }
                },
                orderBy: { joinedAt: 'desc' },
                take: limit,
                skip: offset
            })
        ]);

        const users = userApps.map(ua => ({
            id: ua.user.id,
            email: ua.user.email,
            firstName: ua.user.firstName,
            lastName: ua.user.lastName,
            avatarUrl: ua.user.avatarUrl,
            role: ua.role,
            status: ua.status,
            joinedAt: ua.joinedAt,
            lastActiveAt: ua.lastActiveAt
        }));

        return { users, total };
    } catch (error) {
        console.error('[ApplicationService] Error getting application users:', error);
        return { users: [], total: 0 };
    }
}

// ============================================================================
// Admin-Application Assignment Operations
// ============================================================================

/**
 * Assign an admin to an application
 */
export async function assignAdminToApplication(
    assignment: AdminApplicationAssignment
): Promise<boolean> {
    try {
        await prisma.adminUserApplication.upsert({
            where: {
                adminUserId_applicationId: {
                    adminUserId: assignment.adminUserId,
                    applicationId: assignment.applicationId
                }
            },
            update: {
                role: assignment.role,
                permissions: assignment.permissions || [],
                isPrimary: assignment.isPrimary || false
            },
            create: {
                adminUserId: assignment.adminUserId,
                applicationId: assignment.applicationId,
                role: assignment.role,
                permissions: assignment.permissions || [],
                isPrimary: assignment.isPrimary || false
            }
        });

        clearAdminAccessCache(assignment.adminUserId);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error assigning admin to application:', error);
        return false;
    }
}

/**
 * Remove an admin from an application
 */
export async function removeAdminFromApplication(
    adminUserId: string,
    applicationId: string
): Promise<boolean> {
    try {
        await prisma.adminUserApplication.delete({
            where: {
                adminUserId_applicationId: {
                    adminUserId,
                    applicationId
                }
            }
        });

        clearAdminAccessCache(adminUserId);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error removing admin from application:', error);
        return false;
    }
}

/**
 * Set an admin's primary application
 */
export async function setAdminPrimaryApplication(
    adminUserId: string,
    applicationId: string
): Promise<boolean> {
    try {
        await prisma.$transaction([
            // Remove primary flag from all other apps
            prisma.adminUserApplication.updateMany({
                where: { adminUserId },
                data: {
                    isPrimary: false
                }
            }),
            // Set primary flag for the specified app
            prisma.adminUserApplication.update({
                where: {
                    adminUserId_applicationId: {
                        adminUserId,
                        applicationId
                    }
                },
                data: {
                    isPrimary: true
                }
            })
        ]);

        clearAdminAccessCache(adminUserId);
        return true;
    } catch (error) {
        console.error('[ApplicationService] Error setting admin primary application:', error);
        return false;
    }
}

/**
 * Get all admins for an application
 */
export async function getApplicationAdmins(applicationId: string): Promise<any[]> {
    try {
        const adminApps = await prisma.adminUserApplication.findMany({
            where: { applicationId },
            include: {
                adminUser: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        isSuperAdmin: true
                    }
                }
            },
            orderBy: [
                { role: 'desc' },
                { adminUser: { email: 'asc' } }
            ]
        });

        return adminApps.map(aa => ({
            id: aa.adminUser.id,
            email: aa.adminUser.email,
            name: aa.adminUser.name,
            isSuperAdmin: aa.adminUser.isSuperAdmin,
            appRole: aa.role,
            appPermissions: aa.permissions,
            isPrimary: aa.isPrimary,
            grantedAt: aa.createdAt
        }));
    } catch (error) {
        console.error('[ApplicationService] Error getting application admins:', error);
        return [];
    }
}

/**
 * Get all applications for an admin
 */
export async function getAdminApplications(adminUserId: string): Promise<any[]> {
    try {
        const adminApps = await prisma.adminUserApplication.findMany({
            where: { adminUserId },
            include: {
                application: true
            },
            orderBy: [
                { isPrimary: 'desc' },
                { application: { name: 'asc' } }
            ]
        });

        return adminApps
            .filter(aa => aa.application.isActive)
            .map(aa => ({
                ...aa.application,
                adminRole: aa.role,
                adminPermissions: aa.permissions,
                isPrimary: aa.isPrimary,
                grantedAt: aa.createdAt
            }));
    } catch (error) {
        console.error('[ApplicationService] Error getting admin applications:', error);
        return [];
    }
}

// ============================================================================
// Statistics and Analytics
// ============================================================================

/**
 * Get application statistics
 */
export async function getApplicationStats(applicationId: string): Promise<any> {
    try {
        const [
            activeUsers,
            suspendedUsers,
            totalAdmins
        ] = await Promise.all([
            prisma.userApplication.count({
                where: { applicationId, status: 'active' }
            }),
            prisma.userApplication.count({
                where: { applicationId, status: 'suspended' }
            }),
            prisma.adminUserApplication.count({
                where: { applicationId }
            })
        ]);

        return {
            activeUsers,
            suspendedUsers,
            totalAdmins,
            totalEntities: 0, // Would need unified_entities table
            totalMessages: 0, // Would need chat_messages table
            totalFiles: 0    // Would need files table
        };
    } catch (error) {
        console.error('[ApplicationService] Error getting application stats:', error);
        return null;
    }
}

/**
 * Get recent activity for an application
 */
export async function getApplicationRecentActivity(
    applicationId: string,
    limit = 10
): Promise<any[]> {
    try {
        const userApps = await prisma.userApplication.findMany({
            where: { applicationId },
            include: {
                user: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { joinedAt: 'desc' },
            take: limit
        });

        return userApps.map(ua => ({
            type: 'user_joined',
            timestamp: ua.joinedAt,
            email: ua.user.email,
            firstName: ua.user.firstName,
            lastName: ua.user.lastName
        }));
    } catch (error) {
        console.error('[ApplicationService] Error getting application activity:', error);
        return [];
    }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    // CRUD
    createApplication,
    getApplicationById,
    getApplicationBySlug,
    getAllApplications,
    getActiveApplications,
    updateApplication,
    deleteApplication,
    permanentlyDeleteApplication,
    
    // User assignments
    assignUserToApplication,
    removeUserFromApplication,
    updateUserApplicationRole,
    suspendUserApplicationAccess,
    getApplicationUsers,
    
    // Admin assignments
    assignAdminToApplication,
    removeAdminFromApplication,
    setAdminPrimaryApplication,
    getApplicationAdmins,
    getAdminApplications,
    
    // Stats
    getApplicationStats,
    getApplicationRecentActivity
};
