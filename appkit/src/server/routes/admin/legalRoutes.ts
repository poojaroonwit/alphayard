import { Router, Response } from 'express';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { requirePermission } from '../../middleware/permissionCheck';
import legalContentService from '../../services/legalContentService';

const router = Router();

// All routes require admin authentication
router.use(authenticateAdmin as any);

// =====================================================
// LEGAL DOCUMENTS MANAGEMENT
// =====================================================

/**
 * @route   GET /api/admin/legal/documents
 * @desc    Get all legal documents (admin view)
 */
router.get('/documents', requirePermission('content', 'view'), async (req: any, res: Response) => {
  try {
    const documents = await legalContentService.getAllDocuments();
    res.json({ success: true, documents });
  } catch (error: any) {
    console.error('[Admin Legal] Error fetching documents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/legal/documents/:id
 * @desc    Get a specific legal document
 */
router.get('/documents/:id', requirePermission('content', 'view'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try by slug first, then by ID
    let document = await legalContentService.getDocumentBySlug(id);
    
    if (!document) {
      // Try fetching all and find by ID
      const allDocs = await legalContentService.getAllDocuments();
      document = allDocs.find(d => d.id === id) || null;
    }

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document });
  } catch (error: any) {
    console.error('[Admin Legal] Error fetching document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/legal/documents
 * @desc    Create a new legal document
 */
router.post('/documents', requirePermission('content', 'create'), async (req: any, res: Response) => {
  try {
    const adminId = req.admin?.id;
    const document = await legalContentService.createDocument(req.body, adminId);
    res.status(201).json({ success: true, document });
  } catch (error: any) {
    console.error('[Admin Legal] Error creating document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/admin/legal/documents/:id
 * @desc    Update a legal document
 */
router.put('/documents/:id', requirePermission('content', 'edit'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id;
    const document = await legalContentService.updateDocument(id, req.body, adminId);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document });
  } catch (error: any) {
    console.error('[Admin Legal] Error updating document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/admin/legal/documents/:id
 * @desc    Delete a legal document
 */
router.delete('/documents/:id', requirePermission('content', 'delete'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await legalContentService.deleteDocument(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('[Admin Legal] Error deleting document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/legal/documents/:id/publish
 * @desc    Publish a legal document
 */
router.post('/documents/:id/publish', requirePermission('content', 'edit'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const document = await legalContentService.publishDocument(id);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document, message: 'Document published successfully' });
  } catch (error: any) {
    console.error('[Admin Legal] Error publishing document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/legal/documents/:id/archive
 * @desc    Archive a legal document
 */
router.post('/documents/:id/archive', requirePermission('content', 'edit'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const document = await legalContentService.archiveDocument(id);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document, message: 'Document archived successfully' });
  } catch (error: any) {
    console.error('[Admin Legal] Error archiving document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// DEVELOPER DOCUMENTATION MANAGEMENT
// =====================================================

/**
 * @route   GET /api/admin/legal/developer-docs
 * @desc    Get all developer documentation (admin view)
 */
router.get('/developer-docs', requirePermission('content', 'view'), async (req: any, res: Response) => {
  try {
    const documents = await legalContentService.getAllDeveloperDocs();
    res.json({ success: true, documents });
  } catch (error: any) {
    console.error('[Admin Legal] Error fetching developer docs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/legal/developer-docs/:id
 * @desc    Get a specific developer document
 */
router.get('/developer-docs/:id', requirePermission('content', 'view'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try by slug first
    let document = await legalContentService.getDeveloperDocBySlug(id);
    
    if (!document) {
      const allDocs = await legalContentService.getAllDeveloperDocs();
      document = allDocs.find(d => d.id === id) || null;
    }

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document });
  } catch (error: any) {
    console.error('[Admin Legal] Error fetching developer doc:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/legal/developer-docs
 * @desc    Create a new developer document
 */
router.post('/developer-docs', requirePermission('content', 'create'), async (req: any, res: Response) => {
  try {
    const adminId = req.admin?.id;
    const document = await legalContentService.createDeveloperDoc(req.body, adminId);
    res.status(201).json({ success: true, document });
  } catch (error: any) {
    console.error('[Admin Legal] Error creating developer doc:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/admin/legal/developer-docs/:id
 * @desc    Update a developer document
 */
router.put('/developer-docs/:id', requirePermission('content', 'edit'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.admin?.id;
    const document = await legalContentService.updateDeveloperDoc(id, req.body, adminId);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, document });
  } catch (error: any) {
    console.error('[Admin Legal] Error updating developer doc:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/admin/legal/developer-docs/:id
 * @desc    Delete a developer document
 */
router.delete('/developer-docs/:id', requirePermission('content', 'delete'), async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await legalContentService.deleteDeveloperDoc(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('[Admin Legal] Error deleting developer doc:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
