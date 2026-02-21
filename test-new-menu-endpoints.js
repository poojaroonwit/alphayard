const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Test all the newly added menu endpoints
const newEndpoints = [
  // Market endpoints
  { path: '/market/second-hand', method: 'GET', service: 'market', description: 'Second-hand marketplace' },
  { path: '/market/services', method: 'GET', service: 'market', description: 'Services marketplace' },
  { path: '/market/events', method: 'GET', service: 'market', description: 'Local events' },
  
  // App info endpoints
  { path: '/app/info', method: 'GET', service: 'app', description: 'Application information' },
  { path: '/app/version', method: 'GET', service: 'app', description: 'App version details' },
  { path: '/app/features', method: 'GET', service: 'app', description: 'Available features' },
  
  // Help endpoints
  { path: '/help/faq', method: 'GET', service: 'help', description: 'Frequently asked questions' },
  { path: '/help/support', method: 'GET', service: 'help', description: 'Support information' },
  
  // Feedback endpoints
  { path: '/feedback/submit', method: 'POST', service: 'feedback', description: 'Submit general feedback' },
  { path: '/feedback/bug', method: 'POST', service: 'feedback', description: 'Submit bug report' }
];

// Generic handler for GET routes
newEndpoints.forEach(route => {
  if (route.method === 'GET') {
    app.get(route.path, (req, res) => {
      console.log(`✅ GET ${route.path} (${route.service}) - ${route.description}`);
      res.json({
        success: true,
        message: `${route.service} - ${route.path} endpoint is working`,
        service: route.service,
        description: route.description,
        timestamp: new Date().toISOString()
      });
    });
  } else if (route.method === 'POST') {
    app.post(route.path, (req, res) => {
      console.log(`✅ POST ${route.path} (${route.service}) - ${route.description}`);
      res.json({
        success: true,
        message: `${route.service} - ${route.path} endpoint is working`,
        service: route.service,
        description: route.description,
        timestamp: new Date().toISOString()
      });
    });
  }
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`🚀 New menu endpoints test server running on port ${PORT}`);
  console.log(`\n📋 Testing ${newEndpoints.length} newly added endpoints:`);
  
  const groupedByService = newEndpoints.reduce((acc, route) => {
    if (!acc[route.service]) acc[route.service] = [];
    acc[route.service].push(route);
    return acc;
  }, {});

  Object.entries(groupedByService).forEach(([service, routes]) => {
    console.log(`\n🔧 ${service.toUpperCase()} Service:`);
    routes.forEach(route => {
      console.log(`  ${route.method} ${route.path} - ${route.description}`);
    });
  });
  
  console.log(`\n🔗 Test at: http://localhost:${PORT}`);
});
