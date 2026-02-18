import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { authenticateToken } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissionCheck';

const router = Router();

// Apply admin auth to all routes
router.use(authenticateAdmin as any);

// Get all versions for a content page
router.get('/pages/:pageId/versions', requirePermission('pages', 'view'), async (req, res) => {
  try {
    const { pageId } = req.params;
    const { page = 1, page_size = 20 } = req.query;
    
    const offset = (Number(page) - 1) * Number(page_size);
    const limit = Number(page_size);
    
    const versions = await prisma.$queryRawUnsafe<any[]>(
      `SELECT v.*, 
              json_build_object('id', u.id, 'email', u.email, 'full_name', u.first_name || ' ' || u.last_name) as users
       FROM content_versions v
       LEFT JOIN core.users u ON v.created_by = u.id
       WHERE v.page_id = $1
       ORDER BY v.version_number DESC
       LIMIT $2 OFFSET $3`,
      [pageId, limit, offset]
    );

    res.json({ versions: versions || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific version
router.get('/pages/:pageId/versions/:versionId', authenticateToken as any, async (req, res) => {
  try {
    const { pageId, versionId } = req.params;
    
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT v.*, 
              json_build_object('id', u.id, 'email', u.email, 'full_name', u.first_name || ' ' || u.last_name) as users
       FROM content_versions v
       LEFT JOIN core.users u ON v.created_by = u.id
       WHERE v.page_id = $1 AND v.id = $2`,
      [pageId, versionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({ version: rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new version
router.post('/pages/:pageId/versions', requirePermission('pages', 'edit'), async (req, res) => {
  try {
    const { pageId } = req.params;
    const { 
      title, 
      content, 
      change_description, 
      is_auto_save = false 
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Get the next version number
    const lastVersionRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT version_number FROM content_versions WHERE page_id = $1 ORDER BY version_number DESC LIMIT 1',
      pageId
    );

    const nextVersionNumber = (lastVersionRows[0]?.version_number || 0) + 1;

    // Create the new version
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO content_versions (
        page_id, version_number, title, content, change_description, is_auto_save, created_by, size_bytes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      pageId,
      nextVersionNumber,
      title,
      JSON.stringify(content),
      change_description || null,
      is_auto_save,
      (req as any).user?.id,
      JSON.stringify(content).length
    );

    const version = rows[0];

    // Fetch user info for response
    const userRows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT id, email, first_name || ' ' || last_name as full_name FROM core.users WHERE id = $1",
      version.created_by
    );
    version.users = userRows[0] || null;

    res.status(201).json({ version });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Restore a version (creates a new version with restored content)
router.post('/pages/:pageId/versions/:versionId/restore', authenticateToken as any, async (req, res) => {
  try {
    const { pageId, versionId } = req.params;
    const { restore_description } = req.body;
    
    await prisma.$executeRawUnsafe('BEGIN');

    // Get the version to restore
    const versionRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT * FROM content_versions WHERE page_id = $1 AND id = $2',
      pageId, versionId
    );

    if (versionRows.length === 0) {
      await prisma.$executeRawUnsafe('ROLLBACK');
      return res.status(404).json({ error: 'Version not found' });
    }

    const versionToRestore = versionRows[0];

    // Get the next version number
    const lastVersionRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT version_number FROM content_versions WHERE page_id = $1 ORDER BY version_number DESC LIMIT 1',
      pageId
    );

    const nextVersionNumber = (lastVersionRows[0]?.version_number || 0) + 1;

    // Create a new version with the restored content
    const restoredVersionRows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO content_versions (
        page_id, version_number, title, content, change_description, is_auto_save, created_by, size_bytes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      pageId,
      nextVersionNumber,
      `Restored from Version ${versionToRestore.version_number}`,
      versionToRestore.content,
      restore_description || `Restored from version ${versionToRestore.version_number}: ${versionToRestore.title}`,
      false,
      (req as any).user?.id,
      versionToRestore.size_bytes
    );

    const restoredVersion = restoredVersionRows[0];

    // Fetch user info for response
    const userRows = await prisma.$queryRawUnsafe<any[]>(
      "SELECT id, email, first_name || ' ' || last_name as full_name FROM core.users WHERE id = $1",
      restoredVersion.created_by
    );
    restoredVersion.users = userRows[0] || null;

    // Update the main content page with the restored content
    // Assuming content.components exists as in original code
    const contentObj = typeof versionToRestore.content === 'string' 
        ? JSON.parse(versionToRestore.content) 
        : versionToRestore.content;
        
    await prisma.$executeRawUnsafe(
      `UPDATE content_pages SET 
        components = $1, 
        updated_at = NOW(), 
        updated_by = $2 
       WHERE id = $3`,
      JSON.stringify(contentObj.components || []), (req as any).user?.id, pageId
    );

    await prisma.$executeRawUnsafe('COMMIT');

    res.json({ 
      version: restoredVersion,
      message: 'Version restored successfully'
    });
  } catch (error: any) {
    await prisma.$executeRawUnsafe('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Delete a version
router.delete('/pages/:pageId/versions/:versionId', requirePermission('pages', 'delete'), async (req, res) => {
  try {
    const { pageId, versionId } = req.params;
    
    // Check if this is the only version
    const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      'SELECT COUNT(*) FROM content_versions WHERE page_id = $1',
      [pageId]
    );

    if (parseInt(String(countRows[0].count)) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only version' });
    }

    const rowCount = await prisma.$executeRawUnsafe(
      'DELETE FROM content_versions WHERE page_id = $1 AND id = $2',
      [pageId, versionId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({ message: 'Version deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Compare two versions
router.get('/pages/:pageId/versions/:versionId1/compare/:versionId2', requirePermission('pages', 'view'), async (req, res) => {
  try {
    const { pageId, versionId1, versionId2 } = req.params;
    
    const versions = await prisma.$queryRawUnsafe<any[]>(
      'SELECT * FROM content_versions WHERE page_id = $1 AND id = ANY($2::uuid[])',
      pageId, [versionId1, versionId2]
    );

    if (versions.length !== 2) {
      return res.status(404).json({ error: 'One or both versions not found' });
    }

    // Sort to match requested order or just find them
    const v1 = versions.find(v => v.id === versionId1);
    const v2 = versions.find(v => v.id === versionId2);

    if (!v1 || !v2) return res.status(404).json({ error: 'Version mismatch' });

    const c1 = typeof v1.content === 'string' ? JSON.parse(v1.content) : v1.content;
    const c2 = typeof v2.content === 'string' ? JSON.parse(v2.content) : v2.content;
    
    // Simple diff calculation
    const diff = {
      version1: {
        id: v1.id,
        version_number: v1.version_number,
        title: v1.title,
        created_at: v1.created_at,
        component_count: c1.components?.length || 0,
        size_bytes: v1.size_bytes
      },
      version2: {
        id: v2.id,
        version_number: v2.version_number,
        title: v2.title,
        created_at: v2.created_at,
        component_count: c2.components?.length || 0,
        size_bytes: v2.size_bytes
      },
      changes: {
        component_count_diff: (c2.components?.length || 0) - (c1.components?.length || 0),
        size_diff: v2.size_bytes - v1.size_bytes,
        time_diff: new Date(v2.created_at).getTime() - new Date(v1.created_at).getTime()
      }
    };

    res.json({ diff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-save functionality
router.post('/pages/:pageId/auto-save', requirePermission('pages', 'edit'), async (req, res) => {
  try {
    const { pageId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check if there's a recent auto-save (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const recentAutoSaveRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM content_versions 
       WHERE page_id = $1 AND is_auto_save = true AND created_at >= $2 
       ORDER BY created_at DESC LIMIT 1`,
      pageId, fiveMinutesAgo
    );

    // If there's a recent auto-save, update it instead of creating a new one
    if (recentAutoSaveRows.length > 0) {
      const updatedVersionRows = await prisma.$queryRawUnsafe<any[]>(
        `UPDATE content_versions SET 
          content = $1, 
          size_bytes = $2, 
          updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        JSON.stringify(content), JSON.stringify(content).length, recentAutoSaveRows[0].id
      );

      return res.json({ version: updatedVersionRows[0], message: 'Auto-save updated' });
    }

    // Create new auto-save version
    const lastVersionRows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT version_number FROM content_versions WHERE page_id = $1 ORDER BY version_number DESC LIMIT 1',
      pageId
    );

    const nextVersionNumber = (lastVersionRows[0]?.version_number || 0) + 1;

    const autoSaveRows = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO content_versions (
        page_id, version_number, title, content, change_description, is_auto_save, created_by, size_bytes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      pageId,
      nextVersionNumber,
      'Auto Save',
      JSON.stringify(content),
      'Auto-saved changes',
      true,
      (req as any).user?.id,
      JSON.stringify(content).length
    );

    res.json({ version: autoSaveRows[0], message: 'Auto-save created' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
