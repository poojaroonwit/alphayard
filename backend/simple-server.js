const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple auth middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'bondarys-dev-secret-key';
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Invalid or expired token'
        });
      }

      // Set user info from token
      req.user = {
        id: decoded.id || decoded.userId,
        email: decoded.email
      };

      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Helper function to generate JWT token
const generateToken = (userId, email, type = 'user') => {
  return jwt.sign(
    { id: userId, email, type },
    process.env.JWT_SECRET || 'bondarys-dev-secret-key',
    { expiresIn: '7d' }
  );
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'bondarys-dev-secret-key';
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Invalid or expired token'
        });
      }

      // Check if it's an admin token
      if (decoded.type !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Admin access required'
        });
      }

      // Set admin info from token
      req.admin = {
        id: decoded.id,
        username: decoded.username,
        type: decoded.type
      };

      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType } = req.body;

    // Simple validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'All fields are required'
      });
    }

    // Generate token
    const userId = 'user-' + Date.now();
    const token = generateToken(userId, email);

    // Return user data
    const user = {
      id: userId,
      email,
      firstName,
      lastName,
      userType: userType || 'hourse',
      isOnboardingComplete: true,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      user,
      token,
      accessToken: token,
      refreshToken: 'refresh-' + Date.now()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Registration failed'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }

    // Simple demo login - accept any email/password
    const userId = 'user-' + Date.now();
    const token = generateToken(userId, email);

    const user = {
      id: userId,
      email,
      firstName: 'Demo',
      lastName: 'User',
      userType: 'hourse',
      isOnboardingComplete: true,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      user,
      token,
      accessToken: token,
      refreshToken: 'refresh-' + Date.now()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    // Demo mode - return user data from token
    const user = {
      id: req.user.id,
      email: req.user.email,
      firstName: 'Demo',
      lastName: 'User',
      avatar: '👤',
      createdAt: new Date().toISOString(),
      familyId: '1',
      familyName: 'Demo hourse',
      familyRole: 'admin',
      isOnboardingComplete: true
    };

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user data'
    });
  }
});

// Admin authentication endpoints
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Simple admin credentials
    if (username === 'admin' && password === 'admin123') {
      const token = generateToken('admin', 'admin@bondarys.com', 'admin');

      res.json({ 
        success: true,
        token,
        user: {
          id: 'admin',
          username: 'admin',
          type: 'admin'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin auth verify endpoint
app.get('/api/admin/auth/verify', authenticateAdmin, async (req, res) => {
  try {
    res.json({ 
      success: true,
      user: req.admin
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mock content storage
let contentPages = [];
let nextId = 1;

// Content creation endpoint
app.post('/cms/content/pages', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      type,
      status = 'draft',
      components = [],
      mobile_display = {}
    } = req.body;

    if (!title || !slug || !type) {
      return res.status(400).json({ error: 'Title, slug, and type are required' });
    }

    const now = new Date().toISOString();
    const page = {
      id: `mock-${nextId++}`,
      title,
      slug,
      type,
      status,
      components,
      mobile_display,
      created_by: req.admin?.id || 'admin',
      updated_by: req.admin?.id || 'admin',
      created_at: now,
      updated_at: now
    };

    contentPages.push(page);
    console.log('Created content page:', page);

    res.status(201).json({ page });
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get content pages
app.get('/cms/content/pages', authenticateAdmin, async (req, res) => {
  try {
    res.json({ pages: contentPages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin content endpoint (public access for admin dashboard)
app.get('/cms/content/admin/content', async (req, res) => {
  try {
    const { type, status, page = 1, page_size = 20, search } = req.query;
    
    // Mock data for demo purposes
    const mockPages = [
      {
        id: '1',
        title: 'Welcome to Bondarys',
        slug: 'welcome',
        type: 'page',
        status: 'published',
        content: 'Welcome to the Bondarys family management platform!',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '2',
        title: 'Getting Started Guide',
        slug: 'getting-started',
        type: 'guide',
        status: 'published',
        content: 'Learn how to get started with Bondarys in just a few steps.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        id: '3',
        title: 'Family Safety Tips',
        slug: 'safety-tips',
        type: 'article',
        status: 'draft',
        content: 'Important safety tips for your family.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin'
      }
    ];

    // Combine mock data with created pages
    const allPages = [...mockPages, ...contentPages];
    
    // Apply filters
    let filteredPages = allPages;
    
    if (type && type !== 'all') {
      filteredPages = filteredPages.filter(p => p.type === type);
    }
    
    if (status && status !== 'all') {
      filteredPages = filteredPages.filter(p => p.status === status);
    }
    
    if (search) {
      const searchLower = String(search).toLowerCase();
      filteredPages = filteredPages.filter(p => 
        p.title.toLowerCase().includes(searchLower) || 
        p.slug.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const fromIndex = (Number(page) - 1) * Number(page_size);
    const toIndex = fromIndex + Number(page_size);
    const paginatedPages = filteredPages.slice(fromIndex, toIndex);
    
    res.json({ 
      pages: paginatedPages,
      pagination: {
        page: Number(page),
        pageSize: Number(page_size),
        total: filteredPages.length,
        totalPages: Math.ceil(filteredPages.length / Number(page_size)),
        hasNext: toIndex < filteredPages.length,
        hasPrev: Number(page) > 1
      }
    });
  } catch (error) {
    console.error('Admin content error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Page Builder endpoints
app.get('/api/page-builder/pages', authenticateAdmin, (req, res) => {
  res.json({ pages: [] });
});

app.post('/api/page-builder/pages', authenticateAdmin, (req, res) => {
  const { title, slug } = req.body;
  res.status(201).json({ 
    page: {
      id: 'page-' + Date.now(),
      title,
      slug,
      status: 'draft',
      created_at: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`👑 Admin endpoints: http://localhost:${PORT}/api/admin/auth/*`);
  console.log(`📝 Content endpoints: http://localhost:${PORT}/cms/content/*`);
  console.log(`📄 Page Builder endpoints: http://localhost:${PORT}/api/page-builder/*`);
});
