import { prisma } from '../lib/prisma';
import storageService from './storageService';
import { v4 as uuidv4 } from 'uuid';

// =====================================
// TYPES
// =====================================

export interface FileFolder {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    ownerId: string;
    circleId?: string;
    color?: string;
    icon?: string;
    isFavorite: boolean;
    isPinned: boolean;
    sortOrder: number;
    itemCount: number;
    totalSize: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface FileItem {
    id: string;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
    thumbnailUrl?: string;
    folderId?: string;
    uploadedBy: string;
    circleId?: string;
    description?: string;
    isFavorite: boolean;
    isPinned: boolean;
    viewCount: number;
    downloadCount: number;
    fileType: string;
    status: string;
    tags?: FileTag[];
    createdAt: Date;
    updatedAt: Date;
}

export interface FileTag {
    id: string;
    name: string;
    color: string;
}

export interface FileShare {
    id: string;
    fileId?: string;
    folderId?: string;
    sharedBy: string;
    sharedWithUserId?: string;
    sharedWithCircleId?: string;
    shareLink?: string;
    permission: 'view' | 'download' | 'edit' | 'admin';
    expiresAt?: Date;
    downloadLimit?: number;
    downloadCount: number;
    isActive: boolean;
    createdAt: Date;
}

export interface StorageQuota {
    userId: string;
    quotaBytes: number;
    usedBytes: number;
    fileCount: number;
    percentUsed: number;
}

// =====================================
// FILE MANAGEMENT SERVICE
// =====================================

class FileManagementService {
    // =====================================
    // FOLDER OPERATIONS
    // =====================================

    async createFolder(data: {
        name: string;
        description?: string;
        parentId?: string;
        ownerId: string;
        circleId?: string;
        color?: string;
        icon?: string;
    }): Promise<FileFolder> {
        const result = await prisma.$queryRaw<any[]>`
            INSERT INTO core.file_folders (name, description, parent_id, user_id, circle_id, color, icon)
            VALUES (${data.name}, ${data.description}, ${data.parentId}, ${data.ownerId}, ${data.circleId}, ${data.color}, ${data.icon})
            RETURNING *
        `;
        return this.mapFolder(result[0]);
    }

    async getFolders(userId: string, circleId?: string, parentId?: string): Promise<FileFolder[]> {
        let query = `
            SELECT * FROM core.file_folders 
            WHERE user_id = $1
        `;
        const params: any[] = [userId];
        let paramIndex = 2;

        if (circleId) {
            query += ` AND circle_id = $${paramIndex++}`;
            params.push(circleId);
        } else {
            query += ` AND circle_id IS NULL`;
        }

        if (parentId) {
            query += ` AND parent_id = $${paramIndex++}`;
            params.push(parentId);
        } else {
            query += ` AND parent_id IS NULL`;
        }

        query += ` ORDER BY is_pinned DESC, sort_order, name`;

        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        return result.map((row: any) => this.mapFolder(row));
    }

    async getFolder(folderId: string): Promise<FileFolder | null> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM core.file_folders WHERE id = $1`,
            folderId
        );
        if (result.length === 0) return null;
        return this.mapFolder(result[0]);
    }

    async updateFolder(folderId: string, data: Partial<{
        name: string;
        description: string;
        parentId: string;
        color: string;
        icon: string;
        isFavorite: boolean;
        isPinned: boolean;
        sortOrder: number;
    }>): Promise<FileFolder | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(data.name); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.parentId !== undefined) { updates.push(`parent_id = $${paramIndex++}`); values.push(data.parentId); }
        if (data.color !== undefined) { updates.push(`color = $${paramIndex++}`); values.push(data.color); }
        if (data.icon !== undefined) { updates.push(`icon = $${paramIndex++}`); values.push(data.icon); }
        if (data.isFavorite !== undefined) { updates.push(`is_favorite = $${paramIndex++}`); values.push(data.isFavorite); }
        if (data.isPinned !== undefined) { updates.push(`is_pinned = $${paramIndex++}`); values.push(data.isPinned); }
        if (data.sortOrder !== undefined) { updates.push(`sort_order = $${paramIndex++}`); values.push(data.sortOrder); }

        if (updates.length === 0) return this.getFolder(folderId);

        updates.push(`updated_at = NOW()`);
        values.push(folderId);

        const result = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.file_folders SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            ...values
        );

        if (result.length === 0) return null;
        return this.mapFolder(result[0]);
    }

    async deleteFolder(folderId: string): Promise<boolean> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `DELETE FROM core.file_folders WHERE id = $1 RETURNING id`,
            folderId
        );
        return (result.length ?? 0) > 0;
    }

    async getFolderPath(folderId: string): Promise<FileFolder[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `WITH RECURSIVE folder_path AS (
                SELECT * FROM core.file_folders WHERE id = $1
                UNION ALL
                SELECT f.* FROM core.file_folders f
                INNER JOIN folder_path fp ON f.id = fp.parent_id
            )
            SELECT * FROM folder_path ORDER BY (
                SELECT COUNT(*) FROM folder_path fp2 
                WHERE fp2.id = folder_path.id OR fp2.parent_id = folder_path.id
            ) DESC`,
            folderId
        );
        return result.map((row: any) => this.mapFolder(row));
    }

    // =====================================
    // FILE OPERATIONS
    // =====================================

    async getFiles(userId: string, options: {
        circleId?: string;
        folderId?: string;
        search?: string;
        fileType?: string;
        isFavorite?: boolean;
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        limit?: number;
        offset?: number;
    } = {}): Promise<{ files: FileItem[]; total: number }> {
        let query = `
            SELECT f.*, 
                   COALESCE(
                       (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FROM file_tag_assignments ta
                        JOIN file_tags t ON t.id = ta.tag_id
                        WHERE ta.file_id = f.id), '[]'
                   ) as tags
            FROM core.files f
            WHERE f.user_id = $1 AND f.status = $2
        `;
        const params: any[] = [userId, options.status || 'active'];
        let paramIndex = 3;

        if (options.circleId) {
            query += ` AND f.circle_id = $${paramIndex++}`;
            params.push(options.circleId);
        } else {
            query += ` AND f.circle_id IS NULL`;
        }

        if (options.folderId) {
            query += ` AND f.folder_id = $${paramIndex++}`;
            params.push(options.folderId);
        } else if (options.folderId === null) {
            query += ` AND f.folder_id IS NULL`;
        }

        if (options.search) {
            query += ` AND (f.original_name ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
            params.push(`%${options.search}%`);
            paramIndex++;
        }

        if (options.fileType) {
            query += ` AND f.file_type = $${paramIndex++}`;
            params.push(options.fileType);
        }

        if (options.isFavorite !== undefined) {
            query += ` AND f.is_favorite = $${paramIndex++}`;
            params.push(options.isFavorite);
        }

        // Get total count
        const countResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COUNT(*) FROM (${query}) as count_query`,
            ...params
        );
        const total = parseInt(countResult[0].count, 10);

        // Add sorting
        const sortBy = options.sortBy || 'created_at';
        const sortOrder = options.sortOrder || 'desc';
        const validSortFields = ['original_name', 'size', 'created_at', 'updated_at', 'file_type'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        query += ` ORDER BY f.is_pinned DESC, f.${sortField} ${sortOrder.toUpperCase()}`;

        // Add pagination
        if (options.limit) {
            query += ` LIMIT $${paramIndex++}`;
            params.push(options.limit);
        }
        if (options.offset) {
            query += ` OFFSET $${paramIndex++}`;
            params.push(options.offset);
        }

        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        return {
            files: result.map((row: any) => this.mapFile(row)),
            total
        };
    }

    async getFile(fileId: string): Promise<FileItem | null> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT f.*, 
                   COALESCE(
                       (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FROM file_tag_assignments ta
                        JOIN file_tags t ON t.id = ta.tag_id
                        WHERE ta.file_id = f.id), '[]'
                   ) as tags
            FROM core.files f
            WHERE f.id = $1`,
            fileId
        );
        if (result.length === 0) return null;
        return this.mapFile(result[0]);
    }

    async updateFile(fileId: string, data: Partial<{
        originalName: string;
        description: string;
        folderId: string | null;
        isFavorite: boolean;
        isPinned: boolean;
        status: string;
    }>): Promise<FileItem | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.originalName !== undefined) { updates.push(`original_name = $${paramIndex++}`); values.push(data.originalName); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(data.description); }
        if (data.folderId !== undefined) { updates.push(`folder_id = $${paramIndex++}`); values.push(data.folderId); }
        if (data.isFavorite !== undefined) { updates.push(`is_favorite = $${paramIndex++}`); values.push(data.isFavorite); }
        if (data.isPinned !== undefined) { updates.push(`is_pinned = $${paramIndex++}`); values.push(data.isPinned); }
        if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(data.status); }

        if (updates.length === 0) return this.getFile(fileId);

        updates.push(`updated_at = NOW()`);
        values.push(fileId);

        const result = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            ...values
        );

        if (result.length === 0) return null;
        return this.getFile(fileId);
    }

    async moveFile(fileId: string, targetFolderId: string | null): Promise<FileItem | null> {
        return this.updateFile(fileId, { folderId: targetFolderId });
    }

    async moveFiles(fileIds: string[], targetFolderId: string | null): Promise<number> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET folder_id = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id`,
            targetFolderId,
            fileIds
        );
        return result.length ?? 0;
    }

    async copyFile(fileId: string, targetFolderId: string | null, userId: string): Promise<FileItem | null> {
        const file = await this.getFile(fileId);
        if (!file) return null;

        // Create a copy in the database
        const result = await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO core.files (original_name, file_name, mime_type, size, url, thumbnail_url, 
                               folder_id, user_id, circle_id, description, file_type, metadata)
             SELECT original_name || ' (copy)', file_name, mime_type, size, url, thumbnail_url,
                    $1, $2, circle_id, description, file_type, metadata
             FROM core.files WHERE id = $3
             RETURNING *`,
            targetFolderId,
            userId,
            fileId
        );

        if (result.length === 0) return null;
        return this.getFile(result[0].id);
    }

    async deleteFile(fileId: string, userId: string): Promise<boolean> {
        // Soft delete - mark as deleted
        const result = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET status = 'deleted', updated_at = NOW() 
             WHERE id = $1 AND user_id = $2 RETURNING id`,
            fileId,
            userId
        );
        return (result.length ?? 0) > 0;
    }

    async permanentlyDeleteFile(fileId: string, userId: string): Promise<boolean> {
        // Delete from storage and database
        const deleted = await storageService.deleteFile(fileId, userId);
        if (!deleted) {
            // If entity deletion fails, try direct database delete
            const result = await prisma.$queryRawUnsafe<any[]>(
                `DELETE FROM core.files WHERE id = $1 AND user_id = $2 RETURNING id`,
                fileId,
                userId
            );
            return (result.length ?? 0) > 0;
        }
        return deleted;
    }

    async incrementViewCount(fileId: string, userId: string): Promise<void> {
        await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET view_count = view_count + 1, last_accessed_at = NOW() WHERE id = $1`,
            fileId
        );

        // Update recent access
        await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO file_recent_access (file_id, user_id, access_type)
             VALUES ($1, $2, 'view')
             ON CONFLICT (file_id, user_id) DO UPDATE SET accessed_at = NOW(), access_type = 'view'`,
            fileId,
            userId
        );
    }

    async incrementDownloadCount(fileId: string, userId: string): Promise<void> {
        await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET download_count = download_count + 1, last_accessed_at = NOW() WHERE id = $1`,
            fileId
        );

        await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO file_recent_access (file_id, user_id, access_type)
             VALUES ($1, $2, 'download')
             ON CONFLICT (file_id, user_id) DO UPDATE SET accessed_at = NOW(), access_type = 'download'`,
            fileId,
            userId
        );
    }

    // =====================================
    // CIRCLE FILES
    // =====================================

    async getCircleFiles(circleId: string, options: {
        folderId?: string;
        search?: string;
        fileType?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        limit?: number;
        offset?: number;
    } = {}): Promise<{ files: FileItem[]; total: number }> {
        let query = `
            SELECT f.*, CONCAT(u.first_name, ' ', u.last_name) as uploader_name,
                   COALESCE(
                       (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FROM file_tag_assignments ta
                        JOIN file_tags t ON t.id = ta.tag_id
                        WHERE ta.file_id = f.id), '[]'
                   ) as tags
            FROM core.files f
            LEFT JOIN core.users u ON u.id = f.user_id
            WHERE f.circle_id = $1 AND f.status = 'active'
        `;
        const params: any[] = [circleId];
        let paramIndex = 2;

        if (options.folderId) {
            query += ` AND f.folder_id = $${paramIndex++}`;
            params.push(options.folderId);
        } else if (options.folderId === null) {
            query += ` AND f.folder_id IS NULL`;
        }

        if (options.search) {
            query += ` AND (f.original_name ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
            params.push(`%${options.search}%`);
            paramIndex++;
        }

        if (options.fileType) {
            query += ` AND f.file_type = $${paramIndex++}`;
            params.push(options.fileType);
        }

        const countResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COUNT(*) FROM (${query}) as count_query`,
            ...params
        );
        const total = parseInt(countResult[0].count, 10);

        const sortBy = options.sortBy || 'created_at';
        const sortOrder = options.sortOrder || 'desc';
        const validSortFields = ['original_name', 'size', 'created_at', 'updated_at', 'file_type'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        query += ` ORDER BY f.is_pinned DESC, f.${sortField} ${sortOrder.toUpperCase()}`;

        if (options.limit) {
            query += ` LIMIT $${paramIndex++}`;
            params.push(options.limit);
        }
        if (options.offset) {
            query += ` OFFSET $${paramIndex++}`;
            params.push(options.offset);
        }

        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        return {
            files: result.map((row: any) => ({ ...this.mapFile(row), uploaderName: row.uploader_name })),
            total
        };
    }

    async getCircleFolders(circleId: string, parentId?: string): Promise<FileFolder[]> {
        let query = `
            SELECT * FROM core.file_folders 
            WHERE circle_id = $1
        `;
        const params: any[] = [circleId];

        if (parentId) {
            query += ` AND parent_id = $2`;
            params.push(parentId);
        } else {
            query += ` AND parent_id IS NULL`;
        }

        query += ` ORDER BY is_pinned DESC, sort_order, name`;

        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        return result.map((row: any) => this.mapFolder(row));
    }

    // =====================================
    // TAGS
    // =====================================

    async getTags(userId: string, circleId?: string): Promise<FileTag[]> {
        let query = `SELECT * FROM file_tags WHERE user_id = $1`;
        const params: any[] = [userId];

        if (circleId) {
            query += ` OR circle_id = $2`;
            params.push(circleId);
        }

        query += ` ORDER BY name`;
        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        return result.map((row: any) => ({
            id: row.id,
            name: row.name,
            color: row.color
        }));
    }

    async createTag(name: string, color: string, userId: string, circleId?: string): Promise<FileTag> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO file_tags (name, color, user_id, circle_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            name,
            color,
            userId,
            circleId
        );
        return {
            id: result[0].id,
            name: result[0].name,
            color: result[0].color
        };
    }

    async assignTag(fileId: string, tagId: string, userId: string): Promise<void> {
        await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO file_tag_assignments (file_id, tag_id, assigned_by)
             VALUES ($1, $2, $3)
             ON CONFLICT (file_id, tag_id) DO NOTHING`,
            fileId,
            tagId,
            userId
        );
    }

    async removeTag(fileId: string, tagId: string): Promise<void> {
        await prisma.$queryRawUnsafe<any[]>(
            `DELETE FROM file_tag_assignments WHERE file_id = $1 AND tag_id = $2`,
            fileId,
            tagId
        );
    }

    // =====================================
    // SHARING
    // =====================================

    async shareFile(fileId: string, sharedBy: string, data: {
        sharedWithUserId?: string;
        sharedWithCircleId?: string;
        permission?: 'view' | 'download' | 'edit' | 'admin';
        expiresAt?: Date;
        downloadLimit?: number;
    }): Promise<FileShare> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO file_shares (file_id, shared_by, shared_with_user_id, shared_with_circle_id, permission, expires_at, download_limit)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            fileId,
            sharedBy,
            data.sharedWithUserId,
            data.sharedWithCircleId,
            data.permission || 'view',
            data.expiresAt,
            data.downloadLimit
        );
        return this.mapShare(result[0]);
    }

    async createShareLink(fileId: string, sharedBy: string, data: {
        permission?: 'view' | 'download';
        expiresAt?: Date;
        downloadLimit?: number;
        password?: string;
    }): Promise<FileShare> {
        const shareLink = uuidv4();
        const result = await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO file_shares (file_id, shared_by, share_link, permission, expires_at, download_limit, link_password_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            fileId,
            sharedBy,
            shareLink,
            data.permission || 'view',
            data.expiresAt,
            data.downloadLimit,
            data.password ? data.password : null
        );
        return this.mapShare(result[0]);
    }

    async getFileShares(fileId: string): Promise<FileShare[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM file_shares WHERE file_id = $1 AND is_active = TRUE ORDER BY created_at DESC`,
            fileId
        );
        return result.map((row: any) => this.mapShare(row));
    }

    async getSharedWithMe(userId: string): Promise<FileItem[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT f.* FROM core.files f
             INNER JOIN file_shares s ON s.file_id = f.id
             WHERE s.shared_with_user_id = $1 AND s.is_active = TRUE
             AND (s.expires_at IS NULL OR s.expires_at > NOW())
             ORDER BY s.created_at DESC`,
            userId
        );
        return result.map((row: any) => this.mapFile(row));
    }

    async removeShare(shareId: string): Promise<boolean> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE file_shares SET is_active = FALSE WHERE id = $1 RETURNING id`,
            shareId
        );
        return (result.length ?? 0) > 0;
    }

    // =====================================
    // RECENT & FAVORITES
    // =====================================

    async getRecentFiles(userId: string, limit: number = 20): Promise<FileItem[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT f.* FROM core.files f
             INNER JOIN file_recent_access r ON r.file_id = f.id
             WHERE r.user_id = $1 AND f.status = 'active'
             ORDER BY r.accessed_at DESC
             LIMIT $2`,
            userId,
            limit
        );
        return result.map((row: any) => this.mapFile(row));
    }

    async getFavoriteFiles(userId: string): Promise<FileItem[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM core.files 
             WHERE user_id = $1 AND is_favorite = TRUE AND status = 'active'
             ORDER BY updated_at DESC`,
            userId
        );
        return result.map((row: any) => this.mapFile(row));
    }

    async getFavoriteFolders(userId: string): Promise<FileFolder[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM core.file_folders 
             WHERE user_id = $1 AND is_favorite = TRUE
             ORDER BY name`,
            userId
        );
        return result.map((row: any) => this.mapFolder(row));
    }

    // =====================================
    // STORAGE QUOTA
    // =====================================

    async getStorageQuota(userId: string): Promise<StorageQuota> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM storage_quota WHERE user_id = $1`,
            userId
        );

        if (result.length === 0) {
            // Initialize quota
            await prisma.$queryRawUnsafe<any[]>(
                `INSERT INTO storage_quota (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
                userId
            );
            return {
                userId,
                quotaBytes: 5368709120, // 5 GB
                usedBytes: 0,
                fileCount: 0,
                percentUsed: 0
            };
        }

        const quota = result[0];
        return {
            userId: quota.user_id,
            quotaBytes: quota.quota_bytes,
            usedBytes: quota.used_bytes,
            fileCount: quota.file_count,
            percentUsed: Math.round((quota.used_bytes / quota.quota_bytes) * 100)
        };
    }

    async getCircleStorageQuota(circleId: string): Promise<StorageQuota> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM storage_quota WHERE circle_id = $1`,
            circleId
        );

        if (result.length === 0) {
            // Calculate from files
            const usageResult = await prisma.$queryRawUnsafe<any[]>(
                `SELECT COALESCE(SUM(size), 0) as used_bytes, COUNT(*) as file_count
                 FROM core.files WHERE circle_id = $1 AND status = 'active'`,
                circleId
            );
            
            return {
                userId: circleId,
                quotaBytes: 10737418240, // 10 GB for circles
                usedBytes: parseInt(usageResult[0].used_bytes, 10),
                fileCount: parseInt(usageResult[0].file_count, 10),
                percentUsed: 0
            };
        }

        const quota = result[0];
        return {
            userId: quota.circle_id,
            quotaBytes: quota.quota_bytes,
            usedBytes: quota.used_bytes,
            fileCount: quota.file_count,
            percentUsed: Math.round((quota.used_bytes / quota.quota_bytes) * 100)
        };
    }

    // =====================================
    // ACTIVITY LOG
    // =====================================

    async logActivity(data: {
        fileId?: string;
        folderId?: string;
        userId: string;
        action: string;
        details?: any;
    }): Promise<void> {
        await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO file_activity_log (file_id, folder_id, user_id, action, details)
             VALUES ($1, $2, $3, $4, $5)`,
            data.fileId,
            data.folderId,
            data.userId,
            data.action,
            JSON.stringify(data.details || {})
        );
    }

    async getFileActivity(fileId: string, limit: number = 50): Promise<any[]> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as user_name
             FROM file_activity_log a
             LEFT JOIN core.users u ON u.id = a.user_id
             WHERE a.file_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2`,
            fileId,
            limit
        );
        return result;
    }

    // =====================================
    // HELPER METHODS
    // =====================================

    private mapFolder(row: any): FileFolder {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            parentId: row.parent_id,
            ownerId: row.user_id,
            circleId: row.circle_id,
            color: row.color,
            icon: row.icon,
            isFavorite: row.is_favorite,
            isPinned: row.is_pinned,
            sortOrder: row.sort_order,
            itemCount: row.item_count,
            totalSize: row.total_size,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    private mapFile(row: any): FileItem {
        return {
            id: row.id,
            originalName: row.original_name,
            fileName: row.file_name,
            mimeType: row.mime_type,
            size: row.size,
            url: row.url,
            thumbnailUrl: row.thumbnail_url,
            folderId: row.folder_id,
            uploadedBy: row.user_id,
            circleId: row.circle_id,
            description: row.description,
            isFavorite: row.is_favorite || false,
            isPinned: row.is_pinned || false,
            viewCount: row.view_count || 0,
            downloadCount: row.download_count || 0,
            fileType: row.file_type || 'other',
            status: row.status || 'active',
            tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    private mapShare(row: any): FileShare {
        return {
            id: row.id,
            fileId: row.file_id,
            folderId: row.folder_id,
            sharedBy: row.shared_by,
            sharedWithUserId: row.shared_with_user_id,
            sharedWithCircleId: row.shared_with_circle_id,
            shareLink: row.share_link,
            permission: row.permission,
            expiresAt: row.expires_at,
            downloadLimit: row.download_limit,
            downloadCount: row.download_count,
            isActive: row.is_active,
            createdAt: row.created_at
        };
    }

    // =====================================
    // TRASH / RECYCLE BIN
    // =====================================

    async getDeletedFiles(userId: string, options: {
        limit?: number;
        offset?: number;
    } = {}): Promise<{ files: FileItem[]; total: number }> {
        const query = `
            SELECT f.* FROM core.files f
            WHERE f.user_id = $1 AND f.status = 'deleted'
            ORDER BY f.updated_at DESC
        `;
        const params: any[] = [userId];

        const countResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COUNT(*) FROM core.files WHERE user_id = $1 AND status = 'deleted'`,
            userId
        );
        const total = parseInt(countResult[0].count, 10);

        let paginatedQuery = query;
        if (options.limit) {
            paginatedQuery += ` LIMIT $2`;
            params.push(options.limit);
        }
        if (options.offset) {
            paginatedQuery += ` OFFSET $${params.length + 1}`;
            params.push(options.offset);
        }

        const result = await prisma.$queryRawUnsafe<any[]>(paginatedQuery, ...params);
        return {
            files: result.map((row: any) => this.mapFile(row)),
            total
        };
    }

    async restoreFile(fileId: string, userId: string): Promise<FileItem | null> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET status = 'active', updated_at = NOW() 
             WHERE id = $1 AND user_id = $2 AND status = 'deleted'
             RETURNING *`,
            fileId,
            userId
        );
        if (result.length === 0) return null;
        return this.getFile(fileId);
    }

    async emptyTrash(userId: string): Promise<number> {
        // Get files to delete from storage
        const filesToDelete = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id, file_name FROM core.files WHERE user_id = $1 AND status = 'deleted'`,
            userId
        );

        // Delete from storage (in batches)
        for (const file of filesToDelete) {
            try {
                await storageService.deleteFile(file.id, userId);
            } catch (error) {
                console.error(`Failed to delete file ${file.id} from storage:`, error);
            }
        }

        // Delete from database
        const result = await prisma.$queryRawUnsafe<any[]>(
            `DELETE FROM core.files WHERE user_id = $1 AND status = 'deleted'`,
            userId
        );
        return result.length ?? 0;
    }

    async batchRestoreFiles(fileIds: string[], userId: string): Promise<number> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET status = 'active', updated_at = NOW() 
             WHERE id = ANY($1) AND user_id = $2 AND status = 'deleted'
             RETURNING id`,
            fileIds,
            userId
        );
        return result.length ?? 0;
    }

    // =====================================
    // GLOBAL SEARCH
    // =====================================

    async searchFiles(userId: string, options: {
        query: string;
        fileType?: string;
        dateFrom?: Date;
        dateTo?: Date;
        minSize?: number;
        maxSize?: number;
        limit?: number;
        offset?: number;
    }): Promise<{ files: FileItem[]; folders: FileFolder[]; total: number }> {
        const searchPattern = `%${options.query}%`;
        
        // Search files
        let fileQuery = `
            SELECT f.*, 
                   COALESCE(
                       (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FROM file_tag_assignments ta
                        JOIN file_tags t ON t.id = ta.tag_id
                        WHERE ta.file_id = f.id), '[]'
                   ) as tags
            FROM core.files f
            WHERE f.user_id = $1 AND f.status = 'active'
            AND (f.original_name ILIKE $2 OR f.description ILIKE $2)
        `;
        const fileParams: any[] = [userId, searchPattern];
        let paramIndex = 3;

        if (options.fileType) {
            fileQuery += ` AND f.file_type = $${paramIndex++}`;
            fileParams.push(options.fileType);
        }
        if (options.dateFrom) {
            fileQuery += ` AND f.created_at >= $${paramIndex++}`;
            fileParams.push(options.dateFrom);
        }
        if (options.dateTo) {
            fileQuery += ` AND f.created_at <= $${paramIndex++}`;
            fileParams.push(options.dateTo);
        }
        if (options.minSize) {
            fileQuery += ` AND f.size >= $${paramIndex++}`;
            fileParams.push(options.minSize);
        }
        if (options.maxSize) {
            fileQuery += ` AND f.size <= $${paramIndex++}`;
            fileParams.push(options.maxSize);
        }

        fileQuery += ` ORDER BY f.created_at DESC`;

        // Search folders
        const folderQuery = `
            SELECT * FROM core.file_folders
            WHERE user_id = $1 AND (name ILIKE $2 OR description ILIKE $2)
            ORDER BY name
        `;

        const [fileResult, folderResult] = await Promise.all([
            prisma.$queryRawUnsafe<any[]>(fileQuery, ...fileParams),
            prisma.$queryRawUnsafe<any[]>(folderQuery, userId, searchPattern)
        ]);

        const files = fileResult.map((row: any) => this.mapFile(row));
        const folders = folderResult.map((row: any) => this.mapFolder(row));

        // Apply pagination to combined results
        const total = files.length + folders.length;
        const offset = options.offset || 0;
        const limit = options.limit || 50;

        return {
            files: files.slice(offset, offset + limit),
            folders: folders.slice(Math.max(0, offset - files.length), Math.max(0, offset + limit - files.length)),
            total
        };
    }

    // =====================================
    // BATCH OPERATIONS
    // =====================================

    async batchDeleteFiles(fileIds: string[], userId: string, permanent: boolean = false): Promise<number> {
        if (permanent) {
            // Permanently delete files
            for (const fileId of fileIds) {
                await this.permanentlyDeleteFile(fileId, userId);
            }
            return fileIds.length;
        } else {
            // Soft delete
            const result = await prisma.$queryRawUnsafe<any[]>(
                `UPDATE core.files SET status = 'deleted', updated_at = NOW() 
                 WHERE id = ANY($1) AND user_id = $2 AND status = 'active'
                 RETURNING id`,
                fileIds,
                userId
            );
            return result.length ?? 0;
        }
    }

    async batchToggleFavorite(fileIds: string[], userId: string, isFavorite: boolean): Promise<number> {
        const result = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET is_favorite = $1, updated_at = NOW() 
             WHERE id = ANY($2) AND user_id = $3
             RETURNING id`,
            isFavorite,
            fileIds,
            userId
        );
        return result.length ?? 0;
    }

    async batchTagFiles(fileIds: string[], tagId: string, userId: string, remove: boolean = false): Promise<number> {
        if (remove) {
            const result = await prisma.$queryRawUnsafe<any[]>(
                `DELETE FROM file_tag_assignments WHERE file_id = ANY($1) AND tag_id = $2`,
                fileIds,
                tagId
            );
            return result.length ?? 0;
        } else {
            let count = 0;
            for (const fileId of fileIds) {
                try {
                    await prisma.$queryRawUnsafe<any[]>(
                        `INSERT INTO file_tag_assignments (file_id, tag_id, assigned_by)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (file_id, tag_id) DO NOTHING`,
                        fileId,
                        tagId,
                        userId
                    );
                    count++;
                } catch (error) {
                    console.error(`Failed to tag file ${fileId}:`, error);
                }
            }
            return count;
        }
    }

    // =====================================
    // STORAGE ANALYTICS
    // =====================================

    async getStorageAnalytics(userId: string): Promise<{
        totalSize: number;
        totalFiles: number;
        byFileType: { fileType: string; size: number; count: number }[];
        byMonth: { month: string; size: number; count: number }[];
        largestFiles: FileItem[];
        recentUploads: number;
    }> {
        // Get totals
        const totalsResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COALESCE(SUM(size), 0) as total_size, COUNT(*) as total_files
             FROM core.files WHERE user_id = $1 AND status = 'active'`,
            userId
        );

        // Get breakdown by file type
        const byTypeResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT file_type, COALESCE(SUM(size), 0) as size, COUNT(*) as count
             FROM core.files WHERE user_id = $1 AND status = 'active'
             GROUP BY file_type ORDER BY size DESC`,
            userId
        );

        // Get breakdown by month (last 12 months)
        const byMonthResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
                    COALESCE(SUM(size), 0) as size, COUNT(*) as count
             FROM core.files WHERE user_id = $1 AND status = 'active'
             AND created_at >= NOW() - INTERVAL '12 months'
             GROUP BY TO_CHAR(created_at, 'YYYY-MM')
             ORDER BY month DESC`,
            userId
        );

        // Get largest files
        const largestResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM core.files WHERE user_id = $1 AND status = 'active'
             ORDER BY size DESC LIMIT 10`,
            userId
        );

        // Get recent uploads (last 7 days)
        const recentResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COUNT(*) FROM core.files 
             WHERE user_id = $1 AND status = 'active'
             AND created_at >= NOW() - INTERVAL '7 days'`,
            userId
        );

        return {
            totalSize: parseInt(totalsResult[0].total_size, 10),
            totalFiles: parseInt(totalsResult[0].total_files, 10),
            byFileType: byTypeResult.map((row: any) => ({
                fileType: row.file_type || 'other',
                size: parseInt(row.size, 10),
                count: parseInt(row.count, 10)
            })),
            byMonth: byMonthResult.map((row: any) => ({
                month: row.month,
                size: parseInt(row.size, 10),
                count: parseInt(row.count, 10)
            })),
            largestFiles: largestResult.map((row: any) => this.mapFile(row)),
            recentUploads: parseInt(recentResult[0].count, 10)
        };
    }

    async getCircleStorageAnalytics(circleId: string): Promise<{
        totalSize: number;
        totalFiles: number;
        byFileType: { fileType: string; size: number; count: number }[];
        byMember: { userId: string; userName: string; size: number; count: number }[];
        largestFiles: FileItem[];
    }> {
        // Get totals
        const totalsResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COALESCE(SUM(size), 0) as total_size, COUNT(*) as total_files
             FROM core.files WHERE circle_id = $1 AND status = 'active'`,
            circleId
        );

        // Get breakdown by file type
        const byTypeResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT file_type, COALESCE(SUM(size), 0) as size, COUNT(*) as count
             FROM core.files WHERE circle_id = $1 AND status = 'active'
             GROUP BY file_type ORDER BY size DESC`,
            circleId
        );

        // Get breakdown by member
        const byMemberResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT f.user_id as user_id, CONCAT(u.first_name, ' ', u.last_name) as user_name,
                    COALESCE(SUM(f.size), 0) as size, COUNT(*) as count
             FROM core.files f
             LEFT JOIN core.users u ON u.id = f.user_id
             WHERE f.circle_id = $1 AND f.status = 'active'
             GROUP BY f.user_id, u.first_name, u.last_name
             ORDER BY size DESC`,
            circleId
        );

        // Get largest files
        const largestResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT f.*, CONCAT(u.first_name, ' ', u.last_name) as uploader_name FROM core.files f
             LEFT JOIN core.users u ON u.id = f.user_id
             WHERE f.circle_id = $1 AND f.status = 'active'
             ORDER BY f.size DESC LIMIT 10`,
            circleId
        );

        return {
            totalSize: parseInt(totalsResult[0].total_size, 10),
            totalFiles: parseInt(totalsResult[0].total_files, 10),
            byFileType: byTypeResult.map((row: any) => ({
                fileType: row.file_type || 'other',
                size: parseInt(row.size, 10),
                count: parseInt(row.count, 10)
            })),
            byMember: byMemberResult.map((row: any) => ({
                userId: row.user_id,
                userName: row.user_name || 'Unknown',
                size: parseInt(row.size, 10),
                count: parseInt(row.count, 10)
            })),
            largestFiles: largestResult.map((row: any) => ({
                ...this.mapFile(row),
                uploaderName: row.uploader_name
            }))
        };
    }

    // =====================================
    // PUBLIC SHARE LINK ACCESS
    // =====================================

    async getFileByShareLink(shareLink: string, password?: string): Promise<{
        success: boolean;
        file?: FileItem;
        share?: FileShare;
        error?: string;
        status?: number;
    }> {
        // Find share by link
        const shareResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM file_shares WHERE share_link = $1 AND is_active = TRUE`,
            shareLink
        );

        if (shareResult.length === 0) {
            return { success: false, error: 'Share link not found', status: 404 };
        }

        const share = shareResult[0];

        // Check expiration
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return { success: false, error: 'Share link has expired', status: 410 };
        }

        // Check download limit
        if (share.download_limit && share.download_count >= share.download_limit) {
            return { success: false, error: 'Download limit reached', status: 403 };
        }

        // Check password
        if (share.link_password_hash) {
            if (!password || password !== share.link_password_hash) {
                return { success: false, error: 'Invalid password', status: 401 };
            }
        }

        // Get file
        const file = await this.getFile(share.file_id);
        if (!file) {
            return { success: false, error: 'File not found', status: 404 };
        }

        // Increment view count
        await this.incrementViewCount(file.id, 'anonymous');

        return {
            success: true,
            file,
            share: this.mapShare(share)
        };
    }

    async downloadByShareLink(shareLink: string, password?: string): Promise<{
        success: boolean;
        file?: FileItem;
        error?: string;
        status?: number;
    }> {
        // First validate access
        const accessResult = await this.getFileByShareLink(shareLink, password);
        if (!accessResult.success) {
            return accessResult;
        }

        // Check permission allows download
        if (accessResult.share?.permission === 'view') {
            return { success: false, error: 'Download not allowed for this share', status: 403 };
        }

        // Increment download count
        await prisma.$queryRawUnsafe<any[]>(
            `UPDATE file_shares SET download_count = download_count + 1 WHERE share_link = $1`,
            shareLink
        );

        // Increment file download count
        await this.incrementDownloadCount(accessResult.file!.id, 'anonymous');

        return {
            success: true,
            file: accessResult.file
        };
    }

    // =====================================
    // GALLERY INTEGRATION
    // =====================================

    async getGalleryFiles(userId?: string, circleId?: string, options: {
        folderId?: string;
        fileTypes?: string[];
        search?: string;
        isFavorite?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        limit?: number;
        offset?: number;
    } = {}): Promise<{ files: FileItem[]; total: number }> {
        const fileTypes = options.fileTypes || ['image', 'video'];
        
        let query = `
            SELECT f.*, CONCAT(u.first_name, ' ', u.last_name) as uploader_name,
                   COALESCE(
                       (SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'color', t.color))
                        FROM file_tag_assignments ta
                        JOIN file_tags t ON t.id = ta.tag_id
                        WHERE ta.file_id = f.id), '[]'
                   ) as tags
            FROM core.files f
            LEFT JOIN core.users u ON u.id = f.uploaded_by
            WHERE f.status = 'active'
            AND f.file_type = ANY($1)
        `;
        const params: any[] = [fileTypes];
        let paramIndex = 2;

        // Filter by user or circle
        if (circleId) {
            query += ` AND f.circle_id = $${paramIndex++}`;
            params.push(circleId);
        } else if (userId) {
            query += ` AND f.user_id = $${paramIndex++} AND f.circle_id IS NULL`;
            params.push(userId);
        }

        // Filter by folder/album
        if (options.folderId) {
            query += ` AND f.folder_id = $${paramIndex++}`;
            params.push(options.folderId);
        }

        // Filter by search
        if (options.search) {
            query += ` AND (f.original_name ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
            params.push(`%${options.search}%`);
            paramIndex++;
        }

        // Filter by favorite
        if (options.isFavorite !== undefined) {
            query += ` AND f.is_favorite = $${paramIndex++}`;
            params.push(options.isFavorite);
        }

        // Count total
        const countResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COUNT(*) FROM (${query}) as count_query`,
            ...params
        );
        const total = parseInt(countResult[0].count, 10);

        // Add sorting
        const sortBy = options.sortBy || 'created_at';
        const sortOrder = options.sortOrder || 'desc';
        const validSortFields = ['original_name', 'size', 'created_at', 'updated_at'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        query += ` ORDER BY f.is_pinned DESC, f.${sortField} ${sortOrder.toUpperCase()}`;

        // Add pagination
        if (options.limit) {
            query += ` LIMIT $${paramIndex++}`;
            params.push(options.limit);
        }
        if (options.offset) {
            query += ` OFFSET $${paramIndex++}`;
            params.push(options.offset);
        }

        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        return {
            files: result.map((row: any) => ({
                ...this.mapFile(row),
                uploaderName: row.uploader_name,
                metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {}
            })),
            total
        };
    }

    async getGalleryAlbums(userId?: string, circleId?: string, parentId?: string): Promise<FileFolder[]> {
        let query = `
            SELECT ff.*,
                   (SELECT f.url FROM core.files f 
                    WHERE f.folder_id = ff.id 
                    AND f.file_type IN ('image', 'video') 
                    AND f.status = 'active'
                    ORDER BY f.is_pinned DESC, f.created_at DESC LIMIT 1
                   ) as cover_photo_url,
                   (SELECT COUNT(*) FROM core.files f 
                    WHERE f.folder_id = ff.id 
                    AND f.file_type IN ('image', 'video') 
                    AND f.status = 'active'
                   ) as media_count
            FROM core.file_folders ff
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        // Filter by user or circle
        if (circleId) {
            query += ` AND ff.circle_id = $${paramIndex++}`;
            params.push(circleId);
        } else if (userId) {
            query += ` AND ff.user_id = $${paramIndex++} AND ff.circle_id IS NULL`;
            params.push(userId);
        }

        // Filter by parent
        if (parentId) {
            query += ` AND ff.parent_id = $${paramIndex++}`;
            params.push(parentId);
        } else {
            query += ` AND ff.parent_id IS NULL`;
        }

        query += ` ORDER BY ff.is_pinned DESC, ff.sort_order, ff.name`;

        const result = await prisma.$queryRawUnsafe<any[]>(query, ...params);
        return result.map((row: any) => ({
            ...this.mapFolder(row),
            coverPhotoUrl: row.cover_photo_url,
            mediaCount: parseInt(row.media_count, 10) || 0
        }));
    }

    async setAlbumCover(folderId: string, photoId: string): Promise<void> {
        // Store cover photo ID in folder metadata or a separate field
        // For now, we'll use a custom approach with folder metadata
        await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.file_folders 
             SET updated_at = NOW() 
             WHERE id = $1`,
            folderId
        );

        // Store the cover photo reference
        // This could be stored in metadata or a dedicated column
        // For simplicity, we're pinning the photo so it appears first
        await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET is_pinned = FALSE WHERE folder_id = $1`,
            folderId
        );
        await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.files SET is_pinned = TRUE WHERE id = $1`,
            photoId
        );
    }

    async getGalleryStats(userId?: string, circleId?: string): Promise<{
        totalPhotos: number;
        totalVideos: number;
        totalSize: number;
        albumCount: number;
        favoriteCount: number;
        recentCount: number;
    }> {
        let whereClause = `WHERE f.status = 'active'`;
        const params: any[] = [];
        
        if (circleId) {
            whereClause += ` AND f.circle_id = $1`;
            params.push(circleId);
        } else if (userId) {
            whereClause += ` AND f.user_id = $1 AND f.circle_id IS NULL`;
            params.push(userId);
        }

        // Get photo/video counts and size
        const mediaResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                COUNT(*) FILTER (WHERE file_type = 'image') as photo_count,
                COUNT(*) FILTER (WHERE file_type = 'video') as video_count,
                COALESCE(SUM(size), 0) as total_size,
                COUNT(*) FILTER (WHERE is_favorite = TRUE) as favorite_count,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_count
            FROM core.files f
            ${whereClause}
            AND f.file_type IN ('image', 'video')
        `, ...params);

        // Get album count
        let albumWhereClause = `WHERE 1=1`;
        if (circleId) {
            albumWhereClause += ` AND circle_id = $1`;
        } else if (userId) {
            albumWhereClause += ` AND user_id = $1 AND circle_id IS NULL`;
        }

        const albumResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT COUNT(*) as album_count
            FROM core.file_folders
            ${albumWhereClause}
        `, ...params);

        const stats = mediaResult[0];
        return {
            totalPhotos: parseInt(stats.photo_count, 10) || 0,
            totalVideos: parseInt(stats.video_count, 10) || 0,
            totalSize: parseInt(stats.total_size, 10) || 0,
            albumCount: parseInt(albumResult[0].album_count, 10) || 0,
            favoriteCount: parseInt(stats.favorite_count, 10) || 0,
            recentCount: parseInt(stats.recent_count, 10) || 0
        };
    }
}

export const fileManagementService = new FileManagementService();
export default fileManagementService;
