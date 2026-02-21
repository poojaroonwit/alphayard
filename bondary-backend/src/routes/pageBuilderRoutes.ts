import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  type: 'page' | 'article' | 'document';
  status: 'draft' | 'published' | 'archived';
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    publishedAt?: string;
    featuredImage?: string;
    category?: string;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface CreatePageData {
  title: string;
  slug: string;
  content: string;
  type: 'page' | 'article' | 'document';
  status: 'draft' | 'published' | 'archived';
  metadata?: {
    description?: string;
    keywords?: string[];
    author?: string;
    featuredImage?: string;
    category?: string;
    tags?: string[];
  };
}

interface UpdatePageData extends Partial<CreatePageData> {
  publishedAt?: string;
}

// ============================================================================
// Response Helper
// ============================================================================

const sendResponse = <T>(res: Response, statusCode: number, success: boolean, data?: T, message?: string, error?: string) => {
  const response = { 
    success,
    timestamp: new Date().toISOString()
  };
  if (data !== undefined) (response as any).data = data;
  if (message) (response as any).message = message;
  if (error) (response as any).error = error;
  return res.status(statusCode).json(response);
};

const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendResponse(res, 400, false, undefined, undefined, errors.array()[0].msg);
  }
  next();
};

// ============================================================================
// Routes
// ============================================================================

const router = Router();

/**
 * GET /api/page-builder/pages
 * Get all pages with optional filtering
 */
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    
    // Mock implementation - in real app, query from database
    const mockPages: Page[] = [
      {
        id: '1',
        title: 'Welcome to Boundary',
        slug: 'welcome',
        content: '<h1>Welcome to Boundary</h1><p>Your family connection platform.</p>',
        type: 'page',
        status: 'published',
        metadata: {
          description: 'Welcome page for new users',
          keywords: ['welcome', 'introduction'],
          author: 'Admin',
          featuredImage: '/assets/welcome-banner.jpg',
          category: 'general',
          tags: ['welcome', 'onboarding']
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: '<h1>Privacy Policy</h1><p>Our commitment to your privacy...</p>',
        type: 'document',
        status: 'published',
        metadata: {
          description: 'Privacy policy and data protection',
          keywords: ['privacy', 'policy', 'data'],
          author: 'Legal Team',
          category: 'legal',
          tags: ['legal', 'privacy']
        },
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'User Guide',
        slug: 'user-guide',
        content: '<h1>User Guide</h1><p>How to use Boundary effectively...</p>',
        type: 'article',
        status: 'published',
        metadata: {
          description: 'Comprehensive user guide',
          keywords: ['guide', 'tutorial', 'help'],
          author: 'Support Team',
          featuredImage: '/assets/guide-banner.jpg',
          category: 'support',
          tags: ['guide', 'tutorial', 'help', 'support']
        },
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Apply filters
    let filteredPages = mockPages;
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredPages = filteredPages.filter(page => 
        page.title.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower) ||
        page.metadata?.description?.toLowerCase().includes(searchLower) ||
        page.metadata?.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }
    
    if (status) {
      filteredPages = filteredPages.filter(page => page.status === status);
    }

    // Sort by updated date
    filteredPages.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedPages = filteredPages.slice(startIndex, endIndex);

    sendResponse(res, 200, true, { 
      pages: paginatedPages,
      total: filteredPages.length,
      page: Number(page),
      limit: Number(limit),
      hasMore: endIndex < filteredPages.length
    }, 'Pages retrieved successfully');
  } catch (error) {
    console.error('Get pages error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to get pages');
  }
});

/**
 * GET /api/page-builder/pages/:id
 * Get single page by ID
 */
router.get('/pages/:id', [
  param('id').isUUID().withMessage('Invalid page ID')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Mock implementation - in real app, get from database
    const mockPage: Page = {
      id,
      title: 'Sample Page',
      slug: 'sample-page',
      content: '<h1>Sample Page</h1><p>This is a sample page content.</p>',
      type: 'page',
      status: 'draft',
      metadata: {
        description: 'Sample page for testing',
        keywords: ['sample', 'test'],
        author: 'Admin',
        category: 'general',
        tags: ['sample']
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    };

    sendResponse(res, 200, true, { page: mockPage }, 'Page retrieved successfully');
  } catch (error) {
    console.error('Get page error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to get page');
  }
});

/**
 * POST /api/page-builder/pages
 * Create new page
 */
router.post('/pages', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('slug').trim().isLength({ min: 1, max: 100 }).withMessage('Slug is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('type').isIn(['page', 'article', 'document']).withMessage('Invalid page type'),
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  body('metadata.description').optional().trim().isLength({ max: 500 }).withMessage('Description too long'),
  body('metadata.keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('metadata.author').optional().trim().isLength({ max: 100 }).withMessage('Author name too long'),
  body('metadata.category').optional().trim().isLength({ max: 50 }).withMessage('Category too long'),
  body('metadata.tags').optional().isArray().withMessage('Tags must be an array')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const pageData = req.body as CreatePageData;
    
    // Check if slug already exists
    // In real app, check database for existing slug
    
    // Mock implementation - in real app, create in database
    const mockPage: Page = {
      id: '4',
      title: pageData.title,
      slug: pageData.slug,
      content: pageData.content,
      type: pageData.type,
      status: pageData.status,
      metadata: pageData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: pageData.status === 'published' ? new Date().toISOString() : undefined
    };

    sendResponse(res, 201, true, { page: mockPage }, 'Page created successfully');
  } catch (error) {
    console.error('Create page error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to create page');
  }
});

/**
 * PUT /api/page-builder/pages/:id
 * Update existing page
 */
router.put('/pages/:id', [
  param('id').isUUID().withMessage('Invalid page ID'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('slug').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Slug must be 1-100 characters'),
  body('content').optional().trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('type').optional().isIn(['page', 'article', 'document']).withMessage('Invalid page type'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdatePageData;
    
    // Mock implementation - in real app, update in database
    const mockPage: Page = {
      id,
      title: updateData.title || 'Updated Page',
      slug: updateData.slug || 'updated-page',
      content: updateData.content || '<h1>Updated Page</h1><p>Updated content.</p>',
      type: updateData.type || 'page',
      status: updateData.status || 'draft',
      metadata: updateData.metadata || {},
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: updateData.publishedAt
    };

    sendResponse(res, 200, true, { page: mockPage }, 'Page updated successfully');
  } catch (error) {
    console.error('Update page error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to update page');
  }
});

/**
 * DELETE /api/page-builder/pages/:id
 * Delete page
 */
router.delete('/pages/:id', [
  param('id').isUUID().withMessage('Invalid page ID')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Mock implementation - in real app, delete from database
    sendResponse(res, 200, true, { page: { id } }, 'Page deleted successfully');
  } catch (error) {
    console.error('Delete page error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to delete page');
  }
});

/**
 * POST /api/page-builder/pages/:id/duplicate
 * Duplicate page with new slug
 */
router.post('/pages/:id/duplicate', [
  param('id').isUUID().withMessage('Invalid page ID'),
  body('newSlug').trim().isLength({ min: 1, max: 100 }).withMessage('New slug is required')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newSlug } = req.body;
    
    // Mock implementation - in real app, duplicate in database
    const mockPage: Page = {
      id: '5',
      title: 'Duplicated Page',
      slug: newSlug,
      content: '<h1>Duplicated Page</h1><p>This is a duplicated page.</p>',
      type: 'page',
      status: 'draft',
      metadata: {
        description: 'Duplicated page',
        keywords: ['duplicate'],
        author: 'Admin',
        category: 'general',
        tags: ['duplicate']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sendResponse(res, 201, true, { page: mockPage }, 'Page duplicated successfully');
  } catch (error) {
    console.error('Duplicate page error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to duplicate page');
  }
});

/**
 * POST /api/page-builder/pages/:id/publish
 * Publish page (change status to published)
 */
router.post('/pages/:id/publish', [
  param('id').isUUID().withMessage('Invalid page ID')
], handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Mock implementation - in real app, update status in database
    const mockPage: Page = {
      id,
      title: 'Published Page',
      slug: 'published-page',
      content: '<h1>Published Page</h1><p>This page is now published.</p>',
      type: 'page',
      status: 'published',
      metadata: {
        description: 'Published page',
        keywords: ['published'],
        author: 'Admin',
        category: 'general',
        tags: ['published']
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    };

    sendResponse(res, 200, true, { page: mockPage }, 'Page published successfully');
  } catch (error) {
    console.error('Publish page error:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to publish page');
  }
});

export default router;
