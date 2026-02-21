const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Test all sidebar menu routes that might be missing
const expectedRoutes = [
  // App Overview
  { path: '/dashboard', method: 'GET', hub: 'overview' },

  // App Content
  { path: '/appearance', method: 'GET', hub: 'content' },
  { path: '/collections', method: 'GET', hub: 'content' },
  { path: '/navigation', method: 'GET', hub: 'content' },
  { path: '/pages', method: 'GET', hub: 'content' },
  { path: '/flows', method: 'GET', hub: 'content' },
  { path: '/engagement', method: 'GET', hub: 'content' },
  { path: '/styles', method: 'GET', hub: 'content' },
  { path: '/marketing', method: 'GET', hub: 'content' },
  { path: '/billing', method: 'GET', hub: 'content' },

  // Identity
  { path: '/identity', method: 'GET', hub: 'identity' },
  { path: '/identity/organizations', method: 'GET', hub: 'identity' },
  { path: '/identity/groups', method: 'GET', hub: 'identity' },
  { path: '/identity/auth', method: 'GET', hub: 'identity' },
  { path: '/identity/mfa', method: 'GET', hub: 'identity' },
  { path: '/identity/communication', method: 'GET', hub: 'identity' },

  // Settings
  { path: '/settings', method: 'GET', hub: 'settings' },
  { path: '/settings/team', method: 'GET', hub: 'settings' },
  { path: '/localization', method: 'GET', hub: 'settings' },
  { path: '/legal', method: 'GET', hub: 'settings' },
  { path: '/settings/secrets', method: 'GET', hub: 'settings' },
  { path: '/settings/webhooks', method: 'GET', hub: 'settings' },
  { path: '/settings/services', method: 'GET', hub: 'settings' },
  { path: '/settings/developers', method: 'GET', hub: 'settings' },

  // Database
  { path: '/database', method: 'GET', hub: 'database' }
];

// Generic handler for all routes
expectedRoutes.forEach(route => {
  app[route.method.toLowerCase()](route.path, (req, res) => {
    console.log(`✅ ${route.method} ${route.path} (${route.hub})`);
    res.json({
      success: true,
      message: `${route.hub} - ${route.path} endpoint is working`,
      hub: route.hub,
      path: route.path,
      timestamp: new Date().toISOString()
    });
  });
});

// Also test API endpoints that might be missing
const apiRoutes = [
  { path: '/api/admin/dashboard', method: 'GET' },
  { path: '/api/admin/applications', method: 'GET' },
  { path: '/api/admin/users', method: 'GET' },
  { path: '/api/admin/entities', method: 'GET' },
  { path: '/api/admin/preferences', method: 'GET' },
  { path: '/api/admin/config', method: 'GET' },
  { path: '/api/app-config', method: 'GET' },
  { path: '/api/config', method: 'GET' },
  { path: '/api/page-builder', method: 'GET' },
  { path: '/api/component-studio', method: 'GET' },
  { path: '/cms', method: 'GET' },
  { path: '/cms/marketing', method: 'GET' },
  { path: '/cms/localization', method: 'GET' },
  { path: '/cms/content', method: 'GET' },
  { path: '/cms/versions', method: 'GET' }
];

apiRoutes.forEach(route => {
  app[route.method.toLowerCase()](route.path, (req, res) => {
    console.log(`✅ ${route.method} ${route.path} (API)`);
    res.json({
      success: true,
      message: `API endpoint ${route.path} is working`,
      path: route.path,
      timestamp: new Date().toISOString()
    });
  });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`🚀 Comprehensive endpoint test server running on port ${PORT}`);
  console.log(`\n📋 Testing ${expectedRoutes.length + apiRoutes.length} endpoints:`);
  console.log('\n🎯 Sidebar Menu Routes:');
  expectedRoutes.forEach(route => {
    console.log(`  ${route.method} ${route.path} (${route.hub})`);
  });
  console.log('\n🔧 API Routes:');
  apiRoutes.forEach(route => {
    console.log(`  ${route.method} ${route.path}`);
  });
  console.log(`\n🔗 Test at: http://localhost:${PORT}`);
});
