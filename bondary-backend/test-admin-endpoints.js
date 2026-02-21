const express = require('express');
const cors = require('cors');
const simpleConfigRoutes = require('./src/routes/admin/simpleConfigRoutes').default;

const app = express();

app.use(cors());
app.use(express.json());

// Mount the simple admin routes
app.use('/api/v1/admin/config', simpleConfigRoutes);
app.use('/api/admin/config', simpleConfigRoutes);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test server is running', 
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/v1/admin/config/branding',
      'GET /api/v1/admin/config/sso-providers', 
      'GET /api/v1/admin/config/applications',
      'POST /api/v1/admin/config/applications',
      'GET /api/admin/config/branding',
      'GET /api/admin/config/sso-providers',
      'GET /api/admin/config/applications',
      'POST /api/admin/config/applications'
    ]
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/branding`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/sso-providers`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/applications`);
  console.log(`   POST http://localhost:${PORT}/api/v1/admin/config/applications`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/branding`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/sso-providers`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/applications`);
  console.log(`   POST http://localhost:${PORT}/api/admin/config/applications`);
  console.log(`\n🔧 Test with curl:`);
  console.log(`   curl http://localhost:${PORT}/api/v1/admin/config/branding`);
  console.log(`   curl http://localhost:${PORT}/api/admin/config/applications`);
});
