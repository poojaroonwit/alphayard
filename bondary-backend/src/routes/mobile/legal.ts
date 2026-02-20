import { Router, Response } from 'express';
import { authenticateToken, optionalAuth } from '../../middleware/auth';
import legalContentService from '../../services/legalContentService';

const router = Router();

// =====================================================
// PUBLIC ROUTES (No auth required)
// =====================================================

/**
 * @route   GET /api/v1/legal/documents
 * @desc    Get all published legal documents
 */
router.get('/documents', async (req: any, res: Response) => {
  try {
    const language = (req.query.language as string) || 'en';
    const documents = await legalContentService.getPublishedDocuments(language);

    res.json({
      success: true,
      documents
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching documents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/legal/documents/:slug
 * @desc    Get legal document by slug
 */
router.get('/documents/:slug', async (req: any, res: Response) => {
  try {
    const { slug } = req.params;
    const document = await legalContentService.getDocumentBySlug(slug);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({
      success: true,
      document
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/legal/terms
 * @desc    Get Terms & Conditions
 */
router.get('/terms', async (req: any, res: Response) => {
  try {
    const language = (req.query.language as string) || 'en';
    const document = await legalContentService.getDocumentByType('terms', language);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Terms not found' });
    }

    res.json({
      success: true,
      document
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching terms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/legal/privacy
 * @desc    Get Privacy Policy
 */
router.get('/privacy', async (req: any, res: Response) => {
  try {
    const language = (req.query.language as string) || 'en';
    const document = await legalContentService.getDocumentByType('privacy', language);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Privacy policy not found' });
    }

    res.json({
      success: true,
      document
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching privacy policy:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/legal/community-guidelines
 * @desc    Get Community Guidelines
 */
router.get('/community-guidelines', async (req: any, res: Response) => {
  try {
    const language = (req.query.language as string) || 'en';
    const document = await legalContentService.getDocumentByType('community_guidelines', language);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Community guidelines not found' });
    }

    res.json({
      success: true,
      document
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching community guidelines:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// AUTHENTICATED ROUTES
// =====================================================

/**
 * @route   GET /api/v1/legal/acceptances
 * @desc    Get user's legal acceptances
 */
router.get('/acceptances', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const acceptances = await legalContentService.getUserAcceptances(userId);

    res.json({
      success: true,
      acceptances
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching acceptances:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/v1/legal/accept
 * @desc    Accept a legal document
 */
router.post('/accept', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { documentId, version, acceptedFrom } = req.body;

    if (!documentId || !version) {
      return res.status(400).json({ 
        success: false, 
        error: 'documentId and version are required' 
      });
    }

    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const acceptance = await legalContentService.acceptDocument(
      userId,
      documentId,
      version,
      acceptedFrom || 'app',
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      acceptance
    });
  } catch (error: any) {
    console.error('[Legal] Error accepting document:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/legal/pending
 * @desc    Get pending document acceptances for user
 */
router.get('/pending', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const pendingDocs = await legalContentService.getPendingAcceptances(userId);

    res.json({
      success: true,
      documents: pendingDocs,
      hasPending: pendingDocs.length > 0
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching pending acceptances:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/legal/check/:type
 * @desc    Check if user has accepted a document type
 */
router.get('/check/:type', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;

    const hasAccepted = await legalContentService.checkUserAcceptance(userId, type);

    res.json({
      success: true,
      hasAccepted
    });
  } catch (error: any) {
    console.error('[Legal] Error checking acceptance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// DEVELOPER DOCUMENTATION ROUTES
// =====================================================

/**
 * @route   GET /api/v1/legal/developer-docs
 * @desc    Get all published developer documentation
 */
router.get('/developer-docs', async (req: any, res: Response) => {
  try {
    const { category } = req.query;
    
    let docs;
    if (category) {
      docs = await legalContentService.getDeveloperDocsByCategory(category as string);
    } else {
      docs = await legalContentService.getPublishedDeveloperDocs();
    }

    // Group by category
    const grouped = docs.reduce((acc: any, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    }, {});

    res.json({
      success: true,
      documents: docs,
      byCategory: grouped
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching developer docs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/v1/legal/developer-docs/:slug
 * @desc    Get developer documentation by slug
 */
router.get('/developer-docs/:slug', async (req: any, res: Response) => {
  try {
    const { slug } = req.params;
    const document = await legalContentService.getDeveloperDocBySlug(slug);

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({
      success: true,
      document
    });
  } catch (error: any) {
    console.error('[Legal] Error fetching developer doc:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/v1/legal/developer-docs/:id/feedback
 * @desc    Submit feedback for developer documentation
 */
router.post('/developer-docs/:id/feedback', optionalAuth as any, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { isHelpful, feedback } = req.body;
    const userId = req.user?.id;

    if (isHelpful === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'isHelpful is required' 
      });
    }

    await legalContentService.submitDocFeedback(id, isHelpful, feedback, userId);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error: any) {
    console.error('[Legal] Error submitting feedback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
