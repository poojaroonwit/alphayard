const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Based on mobile app API expectations, let's test all expected endpoints
const mobileAppExpectedEndpoints = [
  // Authentication endpoints
  { path: '/auth/register', method: 'POST', service: 'auth' },
  { path: '/auth/login', method: 'POST', service: 'auth' },
  { path: '/auth/me', method: 'GET', service: 'auth' },
  { path: '/auth/refresh', method: 'POST', service: 'auth' },
  { path: '/auth/logout', method: 'POST', service: 'auth' },
  { path: '/auth/forgot-password', method: 'POST', service: 'auth' },
  { path: '/auth/reset-password', method: 'POST', service: 'auth' },
  { path: '/auth/verify-email', method: 'POST', service: 'auth' },
  { path: '/auth/onboarding/complete', method: 'POST', service: 'auth' },

  // User profile endpoints
  { path: '/user/profile', method: 'GET', service: 'user' },
  { path: '/user/profile', method: 'PUT', service: 'user' },
  { path: '/user/delete', method: 'DELETE', service: 'user' },
  { path: '/user/change-password', method: 'POST', service: 'user' },

  // Circle endpoints
  { path: '/circles', method: 'GET', service: 'circles' },
  { path: '/circles', method: 'POST', service: 'circles' },
  { path: '/circles/:id', method: 'GET', service: 'circles' },
  { path: '/circles/:id', method: 'PUT', service: 'circles' },
  { path: '/circles/:id', method: 'DELETE', service: 'circles' },
  { path: '/circles/:id/members', method: 'GET', service: 'circles' },
  { path: '/circles/:id/members', method: 'POST', service: 'circles' },
  { path: '/circles/:id/members/:userId', method: 'DELETE', service: 'circles' },
  { path: '/circles/join', method: 'POST', service: 'circles' },
  { path: '/circles/invitations/pending', method: 'GET', service: 'circles' },

  // Chat endpoints
  { path: '/chat', method: 'POST', service: 'chat' },
  { path: '/chat/families/:circleId/rooms', method: 'GET', service: 'chat' },
  { path: '/chat/:id', method: 'GET', service: 'chat' },
  { path: '/chat/:id/messages', method: 'POST', service: 'chat' },
  { path: '/chat/rooms/:id/messages', method: 'GET', service: 'chat' },

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

  // Identity endpoints
  { path: '/identity/auth', method: 'GET', service: 'identity' },
  { path: '/identity/mfa', method: 'GET', service: 'identity' },
  { path: '/identity/organizations', method: 'GET', service: 'identity' },
  { path: '/identity/sessions', method: 'GET', service: 'identity' },
  { path: '/identity/devices', method: 'GET', service: 'identity' },
  { path: '/identity/login-history', method: 'GET', service: 'identity' },
  { path: '/identity/security', method: 'GET', service: 'identity' },

  // Settings endpoints
  { path: '/settings', method: 'GET', service: 'settings' },
  { path: '/settings', method: 'PUT', service: 'settings' },
  { path: '/settings/team', method: 'GET', service: 'settings' },
  { path: '/localization/languages', method: 'GET', service: 'localization' },
  { path: '/localization/translations', method: 'GET', service: 'localization' },
  { path: '/localization/set-language', method: 'POST', service: 'localization' },

  // Shopping endpoints
  { path: '/shopping', method: 'GET', service: 'shopping' },
  { path: '/shopping', method: 'POST', service: 'shopping' },
  { path: '/shopping/:id', method: 'PUT', service: 'shopping' },
  { path: '/shopping/:id', method: 'DELETE', service: 'shopping' },

  // File management endpoints
  { path: '/files', method: 'GET', service: 'files' },
  { path: '/files/upload', method: 'POST', service: 'files' },

  // Misc endpoints
  { path: '/sandbox', method: 'GET', service: 'misc' }
];

// Generic handler for all routes
mobileAppExpectedEndpoints.forEach(route => {
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

  // Only register static routes (no parameters) for simplicity
  if (!route.path.includes(':')) {
    app[route.method.toLowerCase()](route.path, handler);
  }
});

// Add some specific dynamic routes manually
app.get('/circles/:id', (req, res) => {
  console.log(`✅ GET /circles/:id (circles)`);
  res.json({ success: true, message: 'circles - /circles/:id endpoint is working' });
});

app.put('/circles/:id', (req, res) => {
  console.log(`✅ PUT /circles/:id (circles)`);
  res.json({ success: true, message: 'circles - /circles/:id endpoint is working' });
});

app.delete('/circles/:id', (req, res) => {
  console.log(`✅ DELETE /circles/:id (circles)`);
  res.json({ success: true, message: 'circles - /circles/:id endpoint is working' });
});

app.get('/chat/:id', (req, res) => {
  console.log(`✅ GET /chat/:id (chat)`);
  res.json({ success: true, message: 'chat - /chat/:id endpoint is working' });
});

app.post('/chat/:id/messages', (req, res) => {
  console.log(`✅ POST /chat/:id/messages (chat)`);
  res.json({ success: true, message: 'chat - /chat/:id/messages endpoint is working' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 Comprehensive mobile app API test server running on port ${PORT}`);
  console.log(`\n📋 Testing ${mobileAppExpectedEndpoints.length} mobile app endpoints:`);
  
  const groupedByService = mobileAppExpectedEndpoints.reduce((acc, route) => {
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
