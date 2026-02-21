import { Router, Request, Response } from 'express';

const router = Router();

// Simple branding endpoint - no auth for testing
router.get('/branding', async (req: Request, res: Response) => {
  try {
    const branding = {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      accentColor: '#60a5fa',
      fontFamily: 'Inter, sans-serif',
      tagline: 'Welcome to Admin Panel',
      description: 'Admin configuration panel',
      logoUrl: '/logo.png',
      appName: 'Boundary Admin'
    };
    
    res.json({
      success: true,
      data: branding,
      message: 'Branding retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch branding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch branding',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple SSO providers endpoint - no auth for testing
router.get('/sso-providers', async (req: Request, res: Response) => {
  try {
    const providers = [
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
    ];
    
    res.json({
      success: true,
      data: { providers },
      message: 'SSO providers retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch SSO providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SSO providers',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple applications endpoint - no auth for testing
router.get('/applications', async (req: Request, res: Response) => {
  try {
    const applications = [
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
    ];
    
    res.json({
      success: true,
      data: { applications },
      message: 'Applications retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple POST applications endpoint
router.post('/applications', async (req: Request, res: Response) => {
  try {
    const { name, slug, description, logoUrl } = req.body;
    
    const newApplication = {
      id: Date.now().toString(),
      name: name || 'New Application',
      slug: slug || 'new-app',
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
    
    res.status(201).json({
      success: true,
      data: { application: newApplication },
      message: 'Application created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to create application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create application',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
