const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Simple branding endpoint
app.get('/api/v1/admin/config/branding', (req, res) => {
  res.json({
    success: true,
    data: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      accentColor: '#60a5fa',
      fontFamily: 'Inter, sans-serif',
      tagline: 'Welcome to Admin Panel',
      description: 'Admin configuration panel',
      logoUrl: '/logo.png',
      appName: 'Boundary Admin'
    },
    message: 'Branding retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Simple SSO providers endpoint
app.get('/api/v1/admin/config/sso-providers', (req, res) => {
  res.json({
    success: true,
    data: { 
      providers: [
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
      ]
    },
    message: 'SSO providers retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Simple applications endpoint
app.get('/api/v1/admin/config/applications', (req, res) => {
  res.json({
    success: true,
    data: { 
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
    },
    message: 'Applications retrieved successfully',
    timestamp: new Date().toISOString()
  });
});

// Also support /api/admin/config routes for compatibility
app.get('/api/admin/config/branding', (req, res) => res.redirect('/api/v1/admin/config/branding'));
app.get('/api/admin/config/sso-providers', (req, res) => res.redirect('/api/v1/admin/config/sso-providers'));
app.get('/api/admin/config/applications', (req, res) => res.redirect('/api/v1/admin/config/applications'));

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test server is running', 
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/v1/admin/config/branding',
      'GET /api/v1/admin/config/sso-providers', 
      'GET /api/v1/admin/config/applications',
      'GET /api/admin/config/branding',
      'GET /api/admin/config/sso-providers',
      'GET /api/admin/config/applications'
    ]
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log(`\n📊 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/branding`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/sso-providers`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/applications`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/branding`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/sso-providers`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/applications`);
  console.log(`\n🔧 Test with curl:`);
  console.log(`   curl http://localhost:${PORT}/api/v1/admin/config/branding`);
  console.log(`   curl http://localhost:${PORT}/api/admin/config/applications`);
});
