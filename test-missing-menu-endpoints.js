const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Based on API_ENDPOINTS configuration, let's test all expected endpoints
const expectedEndpoints = [
  // Authentication endpoints
  { path: '/auth/login', method: 'POST', service: 'auth' },
  { path: '/auth/register', method: 'POST', service: 'auth' },
  { path: '/auth/logout', method: 'POST', service: 'auth' },
  { path: '/auth/refresh', method: 'POST', service: 'auth' },
  { path: '/auth/forgot-password', method: 'POST', service: 'auth' },
  { path: '/auth/reset-password', method: 'POST', service: 'auth' },
  { path: '/auth/verify-email', method: 'POST', service: 'auth' },

  // User Management endpoints
  { path: '/user/profile', method: 'GET', service: 'user' },
  { path: '/user/profile', method: 'PUT', service: 'user' },
  { path: '/user/delete', method: 'DELETE', service: 'user' },
  { path: '/user/change-password', method: 'POST', service: 'user' },

  // Circle Management endpoints
  { path: '/circle/create', method: 'POST', service: 'circle' },
  { path: '/circle/join', method: 'POST', service: 'circle' },
  { path: '/circle/leave', method: 'POST', service: 'circle' },
  { path: '/circle/members', method: 'GET', service: 'circle' },
  { path: '/circle/invite', method: 'POST', service: 'circle' },
  { path: '/circle/remove-member', method: 'POST', service: 'circle' },

  // Localization endpoints
  { path: '/localization/languages', method: 'GET', service: 'localization' },
  { path: '/localization/translations', method: 'GET', service: 'localization' },
  { path: '/localization/set-language', method: 'POST', service: 'localization' },

  // Chat endpoints
  { path: '/chat/messages', method: 'GET', service: 'chat' },
  { path: '/chat/send', method: 'POST', service: 'chat' },
  { path: '/chat/upload', method: 'POST', service: 'chat' },

  // Location endpoints
  { path: '/location/update', method: 'POST', service: 'location' },
  { path: '/location/share', method: 'POST', service: 'location' },
  { path: '/location/history', method: 'GET', service: 'location' },

  // Emergency endpoints
  { path: '/emergency/alert', method: 'POST', service: 'emergency' },
  { path: '/emergency/contacts', method: 'GET', service: 'emergency' },
  { path: '/emergency/location', method: 'GET', service: 'emergency' },

  // Calendar endpoints
  { path: '/calendar/events', method: 'GET', service: 'calendar' },
  { path: '/calendar/create', method: 'POST', service: 'calendar' },
  { path: '/calendar/update', method: 'PUT', service: 'calendar' },
  { path: '/calendar/delete', method: 'DELETE', service: 'calendar' },

  // Expenses endpoints
  { path: '/expenses/list', method: 'GET', service: 'expenses' },
  { path: '/expenses/create', method: 'POST', service: 'expenses' },
  { path: '/expenses/update', method: 'PUT', service: 'expenses' },
  { path: '/expenses/delete', method: 'DELETE', service: 'expenses' },
  { path: '/expenses/categories', method: 'GET', service: 'expenses' },

  // Photos endpoints
  { path: '/photos/upload', method: 'POST', service: 'photos' },
  { path: '/photos/list', method: 'GET', service: 'photos' },
  { path: '/photos/delete', method: 'DELETE', service: 'photos' },
  { path: '/photos/share', method: 'POST', service: 'photos' },

  // Additional endpoints that might be missing
  { path: '/market/second-hand', method: 'GET', service: 'market' },
  { path: '/market/services', method: 'GET', service: 'market' },
  { path: '/market/events', method: 'GET', service: 'market' },
  { path: '/mobile/branding', method: 'GET', service: 'branding' },
  { path: '/app/info', method: 'GET', service: 'app' },
  { path: '/app/version', method: 'GET', service: 'app' },
  { path: '/app/features', method: 'GET', service: 'app' },
  { path: '/help/faq', method: 'GET', service: 'help' },
  { path: '/help/support', method: 'GET', service: 'help' },
  { path: '/feedback/submit', method: 'POST', service: 'feedback' },
  { path: '/feedback/bug', method: 'POST', service: 'feedback' },
  { path: '/notifications/settings', method: 'GET', service: 'notifications' },
  { path: '/notifications/preferences', method: 'PUT', service: 'notifications' },
  { path: '/theme/colors', method: 'GET', service: 'theme' },
  { path: '/theme/customize', method: 'PUT', service: 'theme' },
  { path: '/widgets/configure', method: 'GET', service: 'widgets' },
  { path: '/widgets/custom', method: 'POST', service: 'widgets' },
  { path: '/search/global', method: 'GET', service: 'search' },
  { path: '/search/suggestions', method: 'GET', service: 'search' },
  { path: '/social/followers', method: 'GET', service: 'social' },
  { path: '/social/following', method: 'GET', service: 'social' },
  { path: '/social/posts', method: 'GET', service: 'social' },
  { path: '/social/stories', method: 'GET', service: 'social' },
  { path: '/files/upload', method: 'POST', service: 'files' },
  { path: '/files/browse', method: 'GET', service: 'files' },
  { path: '/files/share', method: 'POST', service: 'files' },
  { path: '/backup/create', method: 'POST', service: 'backup' },
  { path: '/backup/restore', method: 'POST', service: 'backup' },
  { path: '/sync/status', method: 'GET', service: 'sync' },
  { path: '/sync/start', method: 'POST', service: 'sync' }
];

// Generic handler for all routes
expectedEndpoints.forEach(route => {
  const handler = (req, res) => {
    console.log(`✅ ${route.method} ${route.path} (${route.service})`);
    res.json({
      success: true,
      message: `${route.service} - ${route.path} endpoint is working`,
      service: route.service,
      path: route.path,
      method: route.method,
      timestamp: new Date().toISOString()
    });
  };

  app[route.method.toLowerCase()](route.path, handler);
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`🚀 Missing menu endpoints test server running on port ${PORT}`);
  console.log(`\n📋 Testing ${expectedEndpoints.length} expected endpoints:`);
  
  const groupedByService = expectedEndpoints.reduce((acc, route) => {
    if (!acc[route.service]) acc[route.service] = [];
    acc[route.service].push(route);
    return acc;
  }, {});

  Object.entries(groupedByService).forEach(([service, routes]) => {
    console.log(`\n🔧 ${service.toUpperCase()} Service:`);
    routes.forEach(route => {
      console.log(`  ${route.method} ${route.path}`);
    });
  });
  
  console.log(`\n🔗 Test at: http://localhost:${PORT}`);
});
