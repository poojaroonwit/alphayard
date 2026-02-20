import express, { Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import fileManagementService from '../../services/fileManagementService';
import storageService from '../../services/storageService';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken as any);

// =====================================
// FOLDER ROUTES
// =====================================

// Get folders for current user (personal files)
router.get('/folders', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { parentId } = req.query;
        const folders = await fileManagementService.getFolders(userId, undefined, parentId as string);
        res.json({ success: true, folders });
    } catch (error: any) {
        console.error('[FileManagement] Error getting folders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get folders for a circle
router.get('/circles/:circleId/folders', async (req: any, res: Response) => {
    try {
        const { circleId } = req.params;
        const { parentId } = req.query;
        const folders = await fileManagementService.getCircleFolders(circleId, parentId as string);
        res.json({ success: true, folders });
    } catch (error: any) {
        console.error('[FileManagement] Error getting circle folders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create folder (personal or circle)
router.post('/folders', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { name, description, parentId, circleId, color, icon } = req.body;
        
        const folder = await fileManagementService.createFolder({
            name,
            description,
            parentId,
            ownerId: userId,
            circleId,
            color,
            icon
        });

        await fileManagementService.logActivity({
            folderId: folder.id,
            userId,
            action: 'create_folder',
            details: { name }
        });

        res.json({ success: true, folder });
    } catch (error: any) {
        console.error('[FileManagement] Error creating folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get folder by ID
router.get('/folders/:folderId', async (req: any, res: Response) => {
    try {
        const { folderId } = req.params;
        const folder = await fileManagementService.getFolder(folderId);
        
        if (!folder) {
            return res.status(404).json({ success: false, error: 'Folder not found' });
        }

        res.json({ success: true, folder });
    } catch (error: any) {
        console.error('[FileManagement] Error getting folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get folder path (breadcrumb)
router.get('/folders/:folderId/path', async (req: any, res: Response) => {
    try {
        const { folderId } = req.params;
        const path = await fileManagementService.getFolderPath(folderId);
        res.json({ success: true, path });
    } catch (error: any) {
        console.error('[FileManagement] Error getting folder path:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update folder
router.put('/folders/:folderId', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { folderId } = req.params;
        const { name, description, parentId, color, icon, isFavorite, isPinned, sortOrder } = req.body;
        
        const folder = await fileManagementService.updateFolder(folderId, {
            name,
            description,
            parentId,
            color,
            icon,
            isFavorite,
            isPinned,
            sortOrder
        });

        if (!folder) {
            return res.status(404).json({ success: false, error: 'Folder not found' });
        }

        await fileManagementService.logActivity({
            folderId,
            userId,
            action: 'update_folder',
            details: { name }
        });

        res.json({ success: true, folder });
    } catch (error: any) {
        console.error('[FileManagement] Error updating folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete folder
router.delete('/folders/:folderId', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { folderId } = req.params;
        
        const folder = await fileManagementService.getFolder(folderId);
        const deleted = await fileManagementService.deleteFolder(folderId);
        
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Folder not found' });
        }

        await fileManagementService.logActivity({
            userId,
            action: 'delete_folder',
            details: { folderId, name: folder?.name }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[FileManagement] Error deleting folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Move folder to different parent
router.post('/folders/:folderId/move', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { folderId } = req.params;
        const { targetParentId } = req.body;
        
        // Validate that folder exists
        const folder = await fileManagementService.getFolder(folderId);
        if (!folder) {
            return res.status(404).json({ success: false, error: 'Folder not found' });
        }

        // Prevent moving folder into itself or its children
        if (targetParentId) {
            const targetPath = await fileManagementService.getFolderPath(targetParentId);
            if (targetPath.some(f => f.id === folderId)) {
                return res.status(400).json({ success: false, error: 'Cannot move folder into itself or its children' });
            }
        }

        const updatedFolder = await fileManagementService.updateFolder(folderId, {
            parentId: targetParentId || null
        });

        await fileManagementService.logActivity({
            folderId,
            userId,
            action: 'move_folder',
            details: { targetParentId, name: folder.name }
        });

        res.json({ success: true, folder: updatedFolder });
    } catch (error: any) {
        console.error('[FileManagement] Error moving folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// FILE ROUTES (PERSONAL)
// =====================================

// Get files for current user
router.get('/files', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { folderId, search, fileType, isFavorite, sortBy, sortOrder, limit, offset } = req.query;
        
        const result = await fileManagementService.getFiles(userId, {
            folderId: folderId as string,
            search: search as string,
            fileType: fileType as string,
            isFavorite: isFavorite === 'true',
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc',
            limit: limit ? parseInt(limit as string, 10) : undefined,
            offset: offset ? parseInt(offset as string, 10) : undefined
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error('[FileManagement] Error getting files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get file by ID
router.get('/files/:fileId', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        const file = await fileManagementService.getFile(fileId);
        
        if (!file) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        // Track view
        await fileManagementService.incrementViewCount(fileId, userId);

        res.json({ success: true, file });
    } catch (error: any) {
        console.error('[FileManagement] Error getting file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload file
router.post('/files/upload', storageService.getMulterConfig({ maxSize: 100 * 1024 * 1024 }).single('file'), async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const file = req.file;
        const { folderId, circleId, description } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file provided' });
        }

        // Upload to storage
        const result = await storageService.uploadFile(file, userId, circleId, {
            metadata: { folderId, description }
        });

        // Update file with folder and description if provided
        if (folderId || description) {
            await fileManagementService.updateFile(result.id, {
                folderId,
                description
            });
        }

        await fileManagementService.logActivity({
            fileId: result.id,
            userId,
            action: 'upload',
            details: { originalName: file.originalname, size: file.size }
        });

        const uploadedFile = await fileManagementService.getFile(result.id);
        res.json({ success: true, file: uploadedFile });
    } catch (error: any) {
        console.error('[FileManagement] Error uploading file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update file
router.put('/files/:fileId', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        const { originalName, description, folderId, isFavorite, isPinned } = req.body;
        
        const file = await fileManagementService.updateFile(fileId, {
            originalName,
            description,
            folderId,
            isFavorite,
            isPinned
        });

        if (!file) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        await fileManagementService.logActivity({
            fileId,
            userId,
            action: 'update',
            details: { originalName }
        });

        res.json({ success: true, file });
    } catch (error: any) {
        console.error('[FileManagement] Error updating file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Move file to folder
router.post('/files/:fileId/move', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        const { targetFolderId } = req.body;
        
        const file = await fileManagementService.moveFile(fileId, targetFolderId);
        
        if (!file) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        await fileManagementService.logActivity({
            fileId,
            userId,
            action: 'move',
            details: { targetFolderId }
        });

        res.json({ success: true, file });
    } catch (error: any) {
        console.error('[FileManagement] Error moving file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Move multiple files
router.post('/files/move-batch', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileIds, targetFolderId } = req.body;
        
        const count = await fileManagementService.moveFiles(fileIds, targetFolderId);

        await fileManagementService.logActivity({
            userId,
            action: 'move_batch',
            details: { fileIds, targetFolderId, count }
        });

        res.json({ success: true, movedCount: count });
    } catch (error: any) {
        console.error('[FileManagement] Error moving files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Copy file
router.post('/files/:fileId/copy', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        const { targetFolderId } = req.body;
        
        const file = await fileManagementService.copyFile(fileId, targetFolderId, userId);
        
        if (!file) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        await fileManagementService.logActivity({
            fileId: file.id,
            userId,
            action: 'copy',
            details: { sourceFileId: fileId, targetFolderId }
        });

        res.json({ success: true, file });
    } catch (error: any) {
        console.error('[FileManagement] Error copying file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete file (soft delete)
router.delete('/files/:fileId', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        
        const file = await fileManagementService.getFile(fileId);
        const deleted = await fileManagementService.deleteFile(fileId, userId);
        
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        await fileManagementService.logActivity({
            fileId,
            userId,
            action: 'delete',
            details: { originalName: file?.originalName }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[FileManagement] Error deleting file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Permanently delete file
router.delete('/files/:fileId/permanent', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        
        const deleted = await fileManagementService.permanentlyDeleteFile(fileId, userId);
        
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[FileManagement] Error permanently deleting file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Track download
router.post('/files/:fileId/download', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        
        await fileManagementService.incrementDownloadCount(fileId, userId);
        
        await fileManagementService.logActivity({
            fileId,
            userId,
            action: 'download'
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[FileManagement] Error tracking download:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// CIRCLE FILE ROUTES
// =====================================

// Get files for a circle
router.get('/circles/:circleId/files', async (req: any, res: Response) => {
    try {
        const { circleId } = req.params;
        const { folderId, search, fileType, sortBy, sortOrder, limit, offset } = req.query;
        
        const result = await fileManagementService.getCircleFiles(circleId, {
            folderId: folderId as string,
            search: search as string,
            fileType: fileType as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as 'asc' | 'desc',
            limit: limit ? parseInt(limit as string, 10) : undefined,
            offset: offset ? parseInt(offset as string, 10) : undefined
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error('[FileManagement] Error getting circle files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload file to circle
router.post('/circles/:circleId/files/upload', storageService.getMulterConfig({ maxSize: 100 * 1024 * 1024 }).single('file'), async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { circleId } = req.params;
        const file = req.file;
        const { folderId, description } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file provided' });
        }

        // TODO: Validate user is member of circle
        // const membership = await circleService.getMembership(userId, circleId);
        // if (!membership) {
        //     return res.status(403).json({ success: false, error: 'Not a member of this circle' });
        // }

        // Upload to storage with circle association
        const result = await storageService.uploadFile(file, userId, circleId, {
            metadata: { folderId, description }
        });

        // Update file with folder and description if provided
        if (folderId || description) {
            await fileManagementService.updateFile(result.id, {
                folderId,
                description
            });
        }

        await fileManagementService.logActivity({
            fileId: result.id,
            userId,
            action: 'upload_to_circle',
            details: { circleId, originalName: file.originalname, size: file.size }
        });

        const uploadedFile = await fileManagementService.getFile(result.id);
        res.json({ success: true, file: uploadedFile });
    } catch (error: any) {
        console.error('[FileManagement] Error uploading to circle:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create folder in circle
router.post('/circles/:circleId/folders', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { circleId } = req.params;
        const { name, description, parentId, color, icon } = req.body;
        
        // TODO: Validate user is member of circle

        const folder = await fileManagementService.createFolder({
            name,
            description,
            parentId,
            ownerId: userId,
            circleId,
            color,
            icon
        });

        await fileManagementService.logActivity({
            folderId: folder.id,
            userId,
            action: 'create_circle_folder',
            details: { circleId, name }
        });

        res.json({ success: true, folder });
    } catch (error: any) {
        console.error('[FileManagement] Error creating circle folder:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// TAG ROUTES
// =====================================

// Get tags
router.get('/tags', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { circleId } = req.query;
        const tags = await fileManagementService.getTags(userId, circleId as string);
        res.json({ success: true, tags });
    } catch (error: any) {
        console.error('[FileManagement] Error getting tags:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create tag
router.post('/tags', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { name, color, circleId } = req.body;
        const tag = await fileManagementService.createTag(name, color || '#3B82F6', userId, circleId);
        res.json({ success: true, tag });
    } catch (error: any) {
        console.error('[FileManagement] Error creating tag:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Assign tag to file
router.post('/files/:fileId/tags/:tagId', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId, tagId } = req.params;
        await fileManagementService.assignTag(fileId, tagId, userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[FileManagement] Error assigning tag:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove tag from file
router.delete('/files/:fileId/tags/:tagId', async (req: any, res: Response) => {
    try {
        const { fileId, tagId } = req.params;
        await fileManagementService.removeTag(fileId, tagId);
        res.json({ success: true });
    } catch (error: any) {
        console.error('[FileManagement] Error removing tag:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// SHARING ROUTES
// =====================================

// Share file with user or circle
router.post('/files/:fileId/share', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        const { sharedWithUserId, sharedWithCircleId, permission, expiresAt, downloadLimit } = req.body;
        
        const share = await fileManagementService.shareFile(fileId, userId, {
            sharedWithUserId,
            sharedWithCircleId,
            permission,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            downloadLimit
        });

        await fileManagementService.logActivity({
            fileId,
            userId,
            action: 'share',
            details: { sharedWithUserId, sharedWithCircleId, permission }
        });

        res.json({ success: true, share });
    } catch (error: any) {
        console.error('[FileManagement] Error sharing file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create share link
router.post('/files/:fileId/share-link', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        const { permission, expiresAt, downloadLimit, password } = req.body;
        
        const share = await fileManagementService.createShareLink(fileId, userId, {
            permission,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            downloadLimit,
            password
        });

        await fileManagementService.logActivity({
            fileId,
            userId,
            action: 'create_share_link'
        });

        res.json({ success: true, share });
    } catch (error: any) {
        console.error('[FileManagement] Error creating share link:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get file shares
router.get('/files/:fileId/shares', async (req: any, res: Response) => {
    try {
        const { fileId } = req.params;
        const shares = await fileManagementService.getFileShares(fileId);
        res.json({ success: true, shares });
    } catch (error: any) {
        console.error('[FileManagement] Error getting shares:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get files shared with me
router.get('/shared-with-me', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const files = await fileManagementService.getSharedWithMe(userId);
        res.json({ success: true, files });
    } catch (error: any) {
        console.error('[FileManagement] Error getting shared files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Remove share
router.delete('/shares/:shareId', async (req: any, res: Response) => {
    try {
        const { shareId } = req.params;
        const removed = await fileManagementService.removeShare(shareId);
        
        if (!removed) {
            return res.status(404).json({ success: false, error: 'Share not found' });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[FileManagement] Error removing share:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// RECENT & FAVORITES
// =====================================

// Get recent files
router.get('/recent', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { limit } = req.query;
        const files = await fileManagementService.getRecentFiles(userId, limit ? parseInt(limit as string, 10) : 20);
        res.json({ success: true, files });
    } catch (error: any) {
        console.error('[FileManagement] Error getting recent files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get favorite files
router.get('/favorites/files', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const files = await fileManagementService.getFavoriteFiles(userId);
        res.json({ success: true, files });
    } catch (error: any) {
        console.error('[FileManagement] Error getting favorite files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get favorite folders
router.get('/favorites/folders', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const folders = await fileManagementService.getFavoriteFolders(userId);
        res.json({ success: true, folders });
    } catch (error: any) {
        console.error('[FileManagement] Error getting favorite folders:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// STORAGE QUOTA
// =====================================

// Get storage quota for current user
router.get('/quota', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const quota = await fileManagementService.getStorageQuota(userId);
        res.json({ success: true, quota });
    } catch (error: any) {
        console.error('[FileManagement] Error getting storage quota:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get storage quota for circle
router.get('/circles/:circleId/quota', async (req: any, res: Response) => {
    try {
        const { circleId } = req.params;
        const quota = await fileManagementService.getCircleStorageQuota(circleId);
        res.json({ success: true, quota });
    } catch (error: any) {
        console.error('[FileManagement] Error getting circle storage quota:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// ACTIVITY LOG
// =====================================

// Get file activity
router.get('/files/:fileId/activity', async (req: any, res: Response) => {
    try {
        const { fileId } = req.params;
        const { limit } = req.query;
        const activity = await fileManagementService.getFileActivity(fileId, limit ? parseInt(limit as string, 10) : 50);
        res.json({ success: true, activity });
    } catch (error: any) {
        console.error('[FileManagement] Error getting file activity:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// TRASH / RECYCLE BIN
// =====================================

// Get deleted files (trash)
router.get('/trash', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { limit, offset } = req.query;
        const result = await fileManagementService.getDeletedFiles(userId, {
            limit: limit ? parseInt(limit as string, 10) : 50,
            offset: offset ? parseInt(offset as string, 10) : 0
        });
        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error('[FileManagement] Error getting trash:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Restore file from trash
router.post('/trash/:fileId/restore', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileId } = req.params;
        
        const file = await fileManagementService.restoreFile(fileId, userId);
        
        if (!file) {
            return res.status(404).json({ success: false, error: 'File not found in trash' });
        }

        await fileManagementService.logActivity({
            fileId,
            userId,
            action: 'restore',
            details: { originalName: file.originalName }
        });

        res.json({ success: true, file });
    } catch (error: any) {
        console.error('[FileManagement] Error restoring file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Empty trash (permanently delete all)
router.delete('/trash', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const count = await fileManagementService.emptyTrash(userId);

        await fileManagementService.logActivity({
            userId,
            action: 'empty_trash',
            details: { deletedCount: count }
        });

        res.json({ success: true, deletedCount: count });
    } catch (error: any) {
        console.error('[FileManagement] Error emptying trash:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// GLOBAL SEARCH
// =====================================

// Search all files and folders
router.get('/search', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { query, fileType, dateFrom, dateTo, minSize, maxSize, limit, offset } = req.query;
        
        if (!query || (query as string).trim().length < 2) {
            return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
        }

        const result = await fileManagementService.searchFiles(userId, {
            query: query as string,
            fileType: fileType as string,
            dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
            dateTo: dateTo ? new Date(dateTo as string) : undefined,
            minSize: minSize ? parseInt(minSize as string, 10) : undefined,
            maxSize: maxSize ? parseInt(maxSize as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : 50,
            offset: offset ? parseInt(offset as string, 10) : 0
        });

        res.json({ success: true, ...result });
    } catch (error: any) {
        console.error('[FileManagement] Error searching files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// BATCH OPERATIONS
// =====================================

// Batch delete files
router.post('/files/batch/delete', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileIds, permanent } = req.body;
        
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ success: false, error: 'fileIds must be a non-empty array' });
        }

        const count = await fileManagementService.batchDeleteFiles(fileIds, userId, permanent === true);

        await fileManagementService.logActivity({
            userId,
            action: permanent ? 'batch_permanent_delete' : 'batch_delete',
            details: { fileIds, count }
        });

        res.json({ success: true, deletedCount: count });
    } catch (error: any) {
        console.error('[FileManagement] Error batch deleting files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Batch toggle favorite
router.post('/files/batch/favorite', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileIds, isFavorite } = req.body;
        
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ success: false, error: 'fileIds must be a non-empty array' });
        }

        const count = await fileManagementService.batchToggleFavorite(fileIds, userId, isFavorite);

        res.json({ success: true, updatedCount: count });
    } catch (error: any) {
        console.error('[FileManagement] Error batch updating favorites:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Batch assign tag
router.post('/files/batch/tag', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileIds, tagId, action } = req.body;
        
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ success: false, error: 'fileIds must be a non-empty array' });
        }

        if (!tagId) {
            return res.status(400).json({ success: false, error: 'tagId is required' });
        }

        const count = await fileManagementService.batchTagFiles(fileIds, tagId, userId, action === 'remove');

        res.json({ success: true, updatedCount: count });
    } catch (error: any) {
        console.error('[FileManagement] Error batch tagging files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Batch restore from trash
router.post('/trash/batch/restore', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { fileIds } = req.body;
        
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({ success: false, error: 'fileIds must be a non-empty array' });
        }

        const count = await fileManagementService.batchRestoreFiles(fileIds, userId);

        await fileManagementService.logActivity({
            userId,
            action: 'batch_restore',
            details: { fileIds, count }
        });

        res.json({ success: true, restoredCount: count });
    } catch (error: any) {
        console.error('[FileManagement] Error batch restoring files:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// STORAGE ANALYTICS
// =====================================

// Get storage analytics (usage breakdown)
router.get('/analytics', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const analytics = await fileManagementService.getStorageAnalytics(userId);
        res.json({ success: true, analytics });
    } catch (error: any) {
        console.error('[FileManagement] Error getting storage analytics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get circle storage analytics
router.get('/circles/:circleId/analytics', async (req: any, res: Response) => {
    try {
        const { circleId } = req.params;
        const analytics = await fileManagementService.getCircleStorageAnalytics(circleId);
        res.json({ success: true, analytics });
    } catch (error: any) {
        console.error('[FileManagement] Error getting circle storage analytics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// PUBLIC SHARE LINK ACCESS (NO AUTH)
// =====================================

// Access file via share link (public route - defined before auth middleware in server)
// Note: This route should be registered separately without auth middleware
// router.get('/shared/:shareLink', async (req: any, res: Response) => { ... }

export default router;

// Export public routes separately (no authentication required)
export const publicFileRoutes = express.Router();

// Access file via share link
publicFileRoutes.get('/shared/:shareLink', async (req: any, res: Response) => {
    try {
        const { shareLink } = req.params;
        const { password } = req.query;
        
        const result = await fileManagementService.getFileByShareLink(shareLink, password as string);
        
        if (!result.success) {
            return res.status(result.status || 404).json({ success: false, error: result.error });
        }

        res.json({ success: true, file: result.file, share: result.share });
    } catch (error: any) {
        console.error('[FileManagement] Error accessing shared file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Download file via share link
publicFileRoutes.get('/shared/:shareLink/download', async (req: any, res: Response) => {
    try {
        const { shareLink } = req.params;
        const { password } = req.query;
        
        const result = await fileManagementService.downloadByShareLink(shareLink, password as string);
        
        if (!result.success || !result.file) {
            return res.status(result.status || 404).json({ success: false, error: result.error || 'File not found' });
        }

        // Set download headers
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.file.originalName)}"`);
        res.setHeader('Content-Type', result.file.mimeType || 'application/octet-stream');
        
        // Redirect to file URL or stream file
        res.redirect(result.file.url);
    } catch (error: any) {
        console.error('[FileManagement] Error downloading shared file:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
