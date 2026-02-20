import { Router, Response, Request } from 'express';
import { authenticateToken } from '../../middleware/auth';
import fileManagementService from '../../services/fileManagementService';

const router = Router();

// All routes require authentication
router.use(authenticateToken as any);

// =====================================
// PERSONAL GALLERY (User's Files)
// =====================================

/**
 * @route   GET /api/v1/gallery/personal/photos
 * @desc    Get personal gallery photos/videos (from user's personal files)
 */
router.get('/personal/photos', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { type, search, albumId, isFavorite, sortBy, sortOrder, limit, offset } = req.query;

        // Map gallery type to file type
        let fileType: string | undefined;
        if (type === 'photos') fileType = 'image';
        else if (type === 'videos') fileType = 'video';
        // 'all' or undefined means both images and videos

        const result = await fileManagementService.getGalleryFiles(userId, undefined, {
            folderId: albumId as string,
            fileTypes: fileType ? [fileType] : ['image', 'video'],
            search: search as string,
            isFavorite: isFavorite === 'true',
            sortBy: sortBy as string || 'created_at',
            sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
            limit: limit ? parseInt(limit as string, 10) : 50,
            offset: offset ? parseInt(offset as string, 10) : 0
        });

        res.json({
            success: true,
            photos: result.files.map(file => transformFileToPhoto(file)),
            total: result.total
        });
    } catch (error: any) {
        console.error('[Gallery] Error fetching personal photos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/v1/gallery/personal/albums
 * @desc    Get personal gallery albums (folders containing images/videos)
 */
router.get('/personal/albums', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { parentId } = req.query;

        const albums = await fileManagementService.getGalleryAlbums(userId, undefined, parentId as string);

        res.json({
            success: true,
            albums: albums.map(transformFolderToAlbum)
        });
    } catch (error: any) {
        console.error('[Gallery] Error fetching personal albums:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/v1/gallery/personal/albums
 * @desc    Create personal gallery album (folder)
 */
router.post('/personal/albums', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { name, description, parentId, color, coverPhotoId } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Album name is required' });
        }

        const folder = await fileManagementService.createFolder({
            name,
            description,
            parentId,
            ownerId: userId,
            color: color || '#3B82F6',
            icon: 'folder-image'
        });

        // If cover photo specified, update it
        if (coverPhotoId) {
            await fileManagementService.setAlbumCover(folder.id, coverPhotoId);
        }

        res.status(201).json({
            success: true,
            album: transformFolderToAlbum(folder)
        });
    } catch (error: any) {
        console.error('[Gallery] Error creating personal album:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// CIRCLE GALLERY (Circle's Files)
// =====================================

/**
 * @route   GET /api/v1/gallery/circles/:circleId/photos
 * @desc    Get circle gallery photos/videos
 */
router.get('/circles/:circleId/photos', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { circleId } = req.params;
        const { type, search, albumId, isFavorite, sortBy, sortOrder, limit, offset } = req.query;

        // TODO: Verify user is member of circle

        let fileType: string | undefined;
        if (type === 'photos') fileType = 'image';
        else if (type === 'videos') fileType = 'video';

        const result = await fileManagementService.getGalleryFiles(undefined, circleId, {
            folderId: albumId as string,
            fileTypes: fileType ? [fileType] : ['image', 'video'],
            search: search as string,
            isFavorite: isFavorite === 'true',
            sortBy: sortBy as string || 'created_at',
            sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
            limit: limit ? parseInt(limit as string, 10) : 50,
            offset: offset ? parseInt(offset as string, 10) : 0
        });

        res.json({
            success: true,
            photos: result.files.map(f => transformFileToPhoto(f, true)),
            total: result.total
        });
    } catch (error: any) {
        console.error('[Gallery] Error fetching circle photos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/v1/gallery/circles/:circleId/albums
 * @desc    Get circle gallery albums
 */
router.get('/circles/:circleId/albums', async (req: any, res: Response) => {
    try {
        const { circleId } = req.params;
        const { parentId } = req.query;

        const albums = await fileManagementService.getGalleryAlbums(undefined, circleId, parentId as string);

        res.json({
            success: true,
            albums: albums.map(transformFolderToAlbum)
        });
    } catch (error: any) {
        console.error('[Gallery] Error fetching circle albums:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/v1/gallery/circles/:circleId/albums
 * @desc    Create circle gallery album
 */
router.post('/circles/:circleId/albums', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { circleId } = req.params;
        const { name, description, parentId, color, coverPhotoId } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Album name is required' });
        }

        const folder = await fileManagementService.createFolder({
            name,
            description,
            parentId,
            ownerId: userId,
            circleId,
            color: color || '#3B82F6',
            icon: 'folder-image'
        });

        if (coverPhotoId) {
            await fileManagementService.setAlbumCover(folder.id, coverPhotoId);
        }

        res.status(201).json({
            success: true,
            album: transformFolderToAlbum(folder)
        });
    } catch (error: any) {
        console.error('[Gallery] Error creating circle album:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// SHARED OPERATIONS (Both Personal & Circle)
// =====================================

/**
 * @route   PATCH /api/v1/gallery/photos/:id/favorite
 * @desc    Toggle favorite status for a photo
 */
router.patch('/photos/:id/favorite', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const file = await fileManagementService.getFile(id);
        if (!file) {
            return res.status(404).json({ success: false, error: 'Photo not found' });
        }

        const updatedFile = await fileManagementService.updateFile(id, {
            isFavorite: !file.isFavorite
        });

        await fileManagementService.logActivity({
            fileId: id,
            userId,
            action: updatedFile?.isFavorite ? 'add_favorite' : 'remove_favorite'
        });

        res.json({ 
            success: true, 
            isFavorite: updatedFile?.isFavorite 
        });
    } catch (error: any) {
        console.error('[Gallery] Error toggling favorite:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/v1/gallery/photos/:id/move
 * @desc    Move photo to album (folder)
 */
router.post('/photos/:id/move', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { albumId } = req.body;

        const file = await fileManagementService.moveFile(id, albumId || null);
        
        if (!file) {
            return res.status(404).json({ success: false, error: 'Photo not found' });
        }

        await fileManagementService.logActivity({
            fileId: id,
            userId,
            action: 'move_to_album',
            details: { albumId }
        });

        res.json({ 
            success: true, 
            photo: transformFileToPhoto(file) 
        });
    } catch (error: any) {
        console.error('[Gallery] Error moving photo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   DELETE /api/v1/gallery/photos/:id
 * @desc    Delete photo (soft delete)
 */
router.delete('/photos/:id', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const deleted = await fileManagementService.deleteFile(id, userId);
        
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Photo not found' });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[Gallery] Error deleting photo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   PUT /api/v1/gallery/albums/:id
 * @desc    Update album (folder)
 */
router.put('/albums/:id', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, color, coverPhotoId } = req.body;

        const folder = await fileManagementService.updateFolder(id, {
            name,
            description,
            color
        });

        if (!folder) {
            return res.status(404).json({ success: false, error: 'Album not found' });
        }

        if (coverPhotoId) {
            await fileManagementService.setAlbumCover(id, coverPhotoId);
        }

        await fileManagementService.logActivity({
            folderId: id,
            userId,
            action: 'update_album',
            details: { name }
        });

        res.json({ 
            success: true, 
            album: transformFolderToAlbum(folder) 
        });
    } catch (error: any) {
        console.error('[Gallery] Error updating album:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   DELETE /api/v1/gallery/albums/:id
 * @desc    Delete album (folder)
 */
router.delete('/albums/:id', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const deleted = await fileManagementService.deleteFolder(id);
        
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Album not found' });
        }

        await fileManagementService.logActivity({
            userId,
            action: 'delete_album',
            details: { folderId: id }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[Gallery] Error deleting album:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   PUT /api/v1/gallery/albums/:id/cover
 * @desc    Set album cover photo
 */
router.put('/albums/:id/cover', async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { photoId } = req.body;

        if (!photoId) {
            return res.status(400).json({ success: false, error: 'photoId is required' });
        }

        await fileManagementService.setAlbumCover(id, photoId);

        res.json({ success: true });
    } catch (error: any) {
        console.error('[Gallery] Error setting album cover:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/v1/gallery/stats
 * @desc    Get gallery statistics
 */
router.get('/stats', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { circleId } = req.query;

        const stats = await fileManagementService.getGalleryStats(
            circleId ? undefined : userId,
            circleId as string
        );

        res.json({ success: true, stats });
    } catch (error: any) {
        console.error('[Gallery] Error getting gallery stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =====================================
// LEGACY ROUTES (Backward Compatibility)
// =====================================

/**
 * @route   GET /api/v1/gallery/photos
 * @desc    Legacy route - Get gallery photos (defaults to personal if no circleId)
 */
router.get('/photos', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { circleId, type, search, albumId } = req.query;

        let fileType: string | undefined;
        if (type === 'image') fileType = 'image';
        else if (type === 'video') fileType = 'video';

        const result = await fileManagementService.getGalleryFiles(
            circleId ? undefined : userId,
            circleId as string,
            {
                folderId: albumId as string,
                fileTypes: fileType ? [fileType] : ['image', 'video'],
                search: search as string,
                limit: 100
            }
        );

        // Return in legacy format
        res.json(result.files.map(f => ({
            ...transformFileToPhoto(f, !!circleId),
            uri: f.url,
            thumbnail: f.thumbnailUrl || f.url
        })));
    } catch (error: any) {
        console.error('[Gallery] Error fetching photos (legacy):', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route   GET /api/v1/gallery/albums
 * @desc    Legacy route - Get gallery albums
 */
router.get('/albums', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { circleId } = req.query;

        const albums = await fileManagementService.getGalleryAlbums(
            circleId ? undefined : userId,
            circleId as string
        );

        // Return in legacy format
        res.json(albums.map(folder => ({
            id: folder.id,
            name: folder.name,
            description: folder.description,
            coverPhoto: (folder as any).coverPhotoUrl,
            photoCount: folder.itemCount,
            createdAt: folder.createdAt,
            updatedAt: folder.updatedAt,
            createdBy: folder.ownerId,
            circleId: folder.circleId,
            isShared: !!folder.circleId
        })));
    } catch (error: any) {
        console.error('[Gallery] Error fetching albums (legacy):', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================================
// HELPER FUNCTIONS
// =====================================

function transformFileToPhoto(file: any, isShared: boolean = false) {
    return {
        id: file.id,
        uri: file.url,
        url: file.url,
        thumbnail: file.thumbnailUrl || file.url,
        thumbnailUrl: file.thumbnailUrl || file.url,
        filename: file.fileName,
        originalName: file.originalName,
        title: file.description || file.originalName,
        size: file.size,
        width: file.metadata?.width,
        height: file.metadata?.height,
        mimeType: file.mimeType,
        fileType: file.fileType,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        uploadedBy: file.uploadedBy,
        uploaderName: file.uploaderName,
        circleId: file.circleId,
        albumId: file.folderId,
        folderId: file.folderId,
        isShared,
        isFavorite: file.isFavorite,
        isPinned: file.isPinned,
        location: file.metadata?.location,
        metadata: file.metadata,
        tags: file.tags
    };
}

function transformFolderToAlbum(folder: any) {
    return {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        coverPhoto: folder.coverPhotoUrl,
        coverPhotoUrl: folder.coverPhotoUrl,
        color: folder.color,
        icon: folder.icon,
        photoCount: folder.itemCount,
        totalSize: folder.totalSize,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        ownerId: folder.ownerId,
        createdBy: folder.ownerId,
        circleId: folder.circleId,
        parentId: folder.parentId,
        isShared: !!folder.circleId,
        isFavorite: folder.isFavorite,
        isPinned: folder.isPinned
    };
}

export default router;
