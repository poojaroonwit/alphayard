const express = require('express');
const router = express.Router();

// Mock database for demo purposes
const mockData = {
  branding: {
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#60a5fa',
    fontFamily: 'Inter, sans-serif',
    tagline: 'Welcome to Admin Panel',
    description: 'Admin configuration panel',
    logoUrl: '/logo.png',
    appName: 'Boundary Admin'
  },
  ssoProviders: [
    {
      id: 'google',
      name: 'Google',
      clientId: 'google-client-id',
      enabled: true
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      clientId: 'ms-client-id',
      enabled: false
    }
  ],
  applications: [
    {
      id: '1',
      name: 'Boundary Mobile',
      slug: 'boundary-mobile',
      description: 'Mobile application for boundary management',
      isActive: true,
      logoUrl: '/mobile-logo.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        users: 150,
        appSettings: 5
      }
    },
    {
      id: '2',
      name: 'Boundary Admin',
      slug: 'boundary-admin',
      description: 'Admin panel for boundary management',
      isActive: true,
      logoUrl: '/admin-logo.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        users: 25,
        appSettings: 10
      }
    }
  ]
};

// Helper function for consistent responses
const sendResponse = (res, statusCode, success, data, message, error) => {
  const response = { 
    success,
    timestamp: new Date().toISOString()
  };
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

// GET /branding - Get branding configuration
router.get('/branding', async (req, res) => {
  try {
    sendResponse(res, 200, true, mockData.branding, 'Branding retrieved successfully');
  } catch (error) {
    console.error('Failed to fetch branding:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to fetch branding');
  }
});

// PUT /branding - Update branding configuration
router.put('/branding', async (req, res) => {
  try {
    const { branding } = req.body;
    if (branding) {
      // In production, this would update the database
      Object.assign(mockData.branding, branding);
      sendResponse(res, 200, true, mockData.branding, 'Branding updated successfully');
    } else {
      sendResponse(res, 400, false, undefined, undefined, 'Branding data is required');
    }
  } catch (error) {
    console.error('Failed to update branding:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to update branding');
  }
});

// GET /sso-providers - Get SSO providers
router.get('/sso-providers', async (req, res) => {
  try {
    sendResponse(res, 200, true, { providers: mockData.ssoProviders }, 'SSO providers retrieved successfully');
  } catch (error) {
    console.error('Failed to fetch SSO providers:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to fetch SSO providers');
  }
});

// POST /sso-providers - Create SSO provider
router.post('/sso-providers', async (req, res) => {
  try {
    const providerData = req.body;
    if (providerData && providerData.name) {
      const newProvider = {
        id: Date.now().toString(),
        name: providerData.name,
        clientId: providerData.clientId || 'generated-client-id',
        enabled: true
      };
      mockData.ssoProviders.push(newProvider);
      sendResponse(res, 201, true, { client: newProvider }, 'SSO provider created successfully');
    } else {
      sendResponse(res, 400, false, undefined, undefined, 'Provider name is required');
    }
  } catch (error) {
    console.error('Failed to create SSO provider:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to create SSO provider');
  }
});

// GET /applications - Get all applications
router.get('/applications', async (req, res) => {
  try {
    sendResponse(res, 200, true, { applications: mockData.applications }, 'Applications retrieved successfully');
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to fetch applications');
  }
});

// POST /applications - Create new application
router.post('/applications', async (req, res) => {
  try {
    const { name, slug, description, logoUrl } = req.body;
    
    if (!name) {
      return sendResponse(res, 400, false, undefined, undefined, 'Application name is required');
    }
    
    const newApplication = {
      id: Date.now().toString(),
      name: name || 'New Application',
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || 'A new application',
      isActive: true,
      logoUrl: logoUrl || '/default-logo.png',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        users: 0,
        appSettings: 0
      }
    };
    
    mockData.applications.push(newApplication);
    sendResponse(res, 201, true, { application: newApplication }, 'Application created successfully');
  } catch (error) {
    console.error('Failed to create application:', error);
    sendResponse(res, 500, false, undefined, undefined, 'Failed to create application');
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    sendResponse(res, 200, true, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected (mock)',
      cache: 'operational (mock)'
    }, 'All systems operational');
  } catch (error) {
    console.error('Health check failed:', error);
    sendResponse(res, 503, false, undefined, undefined, 'Health check failed');
  }
});

module.exports = router;
