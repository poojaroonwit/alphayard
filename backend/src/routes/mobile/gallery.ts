import { Router, Response, Request } from 'express';
import { authenticateToken } from '../../middleware/auth';
import entityService from '../../services/EntityService';

const router = Router();

/**
 * @route   GET /api/v1/gallery/photos
 * @desc    Get gallery photos for a circle
 */
router.get('/photos', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { circleId, type, search, albumId } = req.query;

    if (!circleId) {
      return res.status(400).json({ error: 'circleId is required' });
    }

    const filters: any = {
        applicationId: circleId,
        status: 'active'
    };

    if (type && type !== 'all') {
        filters['data->>mime_type'] = { LIKE: `${type}%` };
    }

    if (search) {
        filters['data->>title'] = { LIKE: `%${search}%` };
    }

    if (albumId) {
        filters['data->>albumId'] = albumId;
    }

    const result = await entityService.queryEntities('file', {
        ...filters,
        sortBy: 'created_at',
        sortOrder: 'DESC'
    } as any);

    res.json(result.entities.map(e => ({
        ...e.attributes,
        id: e.id,
        uri: e.attributes.url,
        thumbnail: e.attributes.url,
        createdAt: e.createdAt,
        isFavorite: e.attributes.is_favorite
    })));
  } catch (error) {
    console.error('Error fetching gallery photos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/v1/gallery/albums
 * @desc    Get gallery albums for a circle
 */
router.get('/albums', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { circleId } = req.query;

    if (!circleId) {
      return res.status(400).json({ error: 'circleId is required' });
    }

    const result = await entityService.queryEntities('gallery_album', {
        applicationId: circleId
    } as any);

    res.json(result.entities.map(e => ({
        ...e.attributes,
        id: e.id,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt
    })));
  } catch (error) {
    console.error('Error fetching gallery albums:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/v1/gallery/albums
 * @desc    Create a new gallery album
 */
router.post('/albums', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { name, description, circleId, isShared } = req.body;
    const userId = req.user.id;

    if (!name || !circleId) {
      return res.status(400).json({ error: 'name and circleId are required' });
    }

    const entity = await entityService.createEntity({
        typeName: 'gallery_album',
        ownerId: userId,
        applicationId: circleId,
        attributes: {
            name,
            description,
            is_shared: isShared ?? true
        }
    });

    res.status(201).json({ ...entity.attributes, id: entity.id });
  } catch (error) {
    console.error('Error creating gallery album:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   PATCH /api/v1/gallery/photos/:id/favorite
 * @desc    Toggle favorite status for a photo
 */
router.patch('/photos/:id/favorite', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entity = await entityService.getEntity(id);
    if (!entity) return res.status(404).json({ error: 'Photo not found' });

    const isFavorite = !entity.attributes.is_favorite;
    await entityService.updateEntity(id, { attributes: { is_favorite: isFavorite } });

    res.json({ success: true, isFavorite });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/v1/gallery/photos
 * @desc    Add photo metadata
 */
router.post('/photos', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { uri, filename, title, size, width, height, circleId, albumId, location, metadata } = req.body;
    const userId = req.user.id;

    if (!uri || !circleId) {
      return res.status(400).json({ error: 'uri and circleId are required' });
    }

    const entity = await entityService.createEntity({
        typeName: 'file',
        ownerId: userId,
        applicationId: circleId,
        attributes: {
            url: uri,
            file_name: filename,
            title,
            size,
            width,
            height,
            albumId,
            location,
            metadata
        }
    });

    res.status(201).json({ ...entity.attributes, id: entity.id });
  } catch (error) {
    console.error('Error creating gallery photo record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   DELETE /api/v1/gallery/photos/:id
 */
router.delete('/photos/:id', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await entityService.deleteEntity(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   DELETE /api/v1/gallery/albums/:id
 */
router.delete('/albums/:id', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await entityService.deleteEntity(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

