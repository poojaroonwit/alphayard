import express from 'express';
const router = express.Router();

// Mock auth middleware to avoid DB dependency
const mockAuthenticateToken = (req: any, res: any, next: any) => {
  req.user = {
    id: 'user_123',
    email: 'mock@example.com',
    firstName: 'Demo',
    lastName: 'User'
  };
  next();
};

router.use(mockAuthenticateToken);

// In-memory mock posts mock database
const mockPosts = [
  {
    id: '1',
    content: 'Just arrived at the vacation home! 🏠☀️',
    authorId: 'user_123', // Will be overwritten by req.user.id in the endpoint if we want to simulate logged in user ownership
    circleId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: {
      id: 'user_123',
      firstName: 'Demo',
      lastName: 'User',
      avatarUrl: null
    },
    stats: {
      likes: 5,
      comments: 2,
      shares: 0
    },
    isLiked: false,
    tags: ['vacation', 'circle']
  },
  {
    id: '2',
    content: 'Does anyone need anything from the grocery store? 🍎🥦',
    authorId: 'system_user',
    circleId: '1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    author: {
      id: 'system_user',
      firstName: 'Mom',
      lastName: '',
      avatarUrl: null
    },
    stats: {
      likes: 2,
      comments: 4,
      shares: 0
    },
    isLiked: true,
    tags: ['groceries']
  },
  {
    id: '3',
    content: 'circle picnic weekend! The weather was perfect. 🌳🧺',
    authorId: 'user_456',
    circleId: '1',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    author: {
      id: 'user_456',
      firstName: 'Dad',
      lastName: '',
      avatarUrl: null
    },
    stats: {
      likes: 12,
      comments: 3,
      shares: 1
    },
    isLiked: false,
    tags: ['weekend', 'picnic', 'circle'],
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=60'
    },
    media_urls: ['https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=60']
  }
];

/**
 * GET /api/social/posts
 * Get list of social posts
 */
router.get('/posts', async (req: any, res: any) => {
  try {
    // Return in-memory mock posts
    // Sort by createdAt desc
    const sortedPosts = [...mockPosts].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({
      success: true,
      posts: sortedPosts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/social/posts
 * Create a new social post
 */
router.post('/posts', async (req: any, res: any) => {
  try {
    const { content, media, location, tags } = req.body;

    // Create new mock post
    const newPost = {
      id: Date.now().toString(),
      content: content,
      authorId: req.user.id,
      circleId: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: req.user.id,
        firstName: req.user.firstName || 'User',
        lastName: req.user.lastName || '',
        avatarUrl: req.user.avatarUrl
      },
      stats: {
        likes: 0,
        comments: 0,
        shares: 0
      },
      isLiked: false,
      tags: tags || [],
      media: media,
      location: location
    };

    // In a real mock, we might want to unshift this to the list, but since the list is hardcoded inside the GET route, 
    // the frontend won't see this new post unless we update the mock data structure or just rely on the frontend optimistic update (if it did that).
    // However, the frontend is relying on REFTECH.
    // So I need to move mockPosts outside the GET handler to persist it in memory during the server lifetime.
    mockPosts.unshift(newPost);

    // Return success
    res.json({
      success: true,
      post: newPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/social/families
 * Get list of families
 */
router.get('/families', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'My circle',
          description: 'The best circle ever',
          member_count: 4
        }
      ]
    });
  } catch (error) {
    console.error('Get families error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/social/trending-tags
 * Get trending tags
 */
router.get('/trending-tags', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      tags: ['circle', 'vacation', 'groceries', 'weekend', 'planning']
    });
  } catch (error) {
    console.error('Get trending tags error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/social/nearby
 * Query params:
 * - lat, lng: number (required)
 * - radiusKm: number in km (default 1, supports 1,5,10,custom)
 * - workplace, hometown, school, university: optional string filters
 * - limit: number (default 50)
 */
router.get('/nearby', async (req: any, res: any) => {
  try {
    // Mock nearby users
    const mockNearbyUsers = [
      {
        id: 'user_456',
        first_name: 'Neighbor',
        last_name: 'One',
        distance_m: 500,
        avatar_url: null
      },
      {
        id: 'user_789',
        first_name: 'Local',
        last_name: 'Friend',
        distance_m: 1200,
        avatar_url: null
      }
    ];

    return res.json({ success: true, data: mockNearbyUsers });
  } catch (err) {
    console.error('Nearby users error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/social/profile-filters
 * Returns filter options from existing users (distinct workplace, hometown, school/university)
 */
router.get('/profile-filters', async (_req: any, res: any) => {
  try {
    // Return mock filters
    return res.json({
      success: true, data: {
        workplaces: ['Tech Corp', 'Design Studio', 'Freelance'],
        hometowns: ['New York', 'San Francisco', 'London'],
        schools: ['MIT', 'Stanford', 'Oxford']
      }
    });
  } catch (err) {
    console.error('Profile filters error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;



