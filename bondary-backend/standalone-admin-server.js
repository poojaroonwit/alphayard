const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Import working admin routes
const workingConfigRoutes = require('./src/routes/admin/workingConfigRoutes');

// Mount admin routes
app.use('/api/v1/admin/config', workingConfigRoutes);
app.use('/api/admin/config', workingConfigRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Standalone admin server is running', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      'GET /api/v1/admin/config/branding',
      'PUT /api/v1/admin/config/branding',
      'GET /api/v1/admin/config/sso-providers',
      'POST /api/v1/admin/config/sso-providers',
      'GET /api/v1/admin/config/applications',
      'POST /api/v1/admin/config/applications',
      'GET /api/v1/admin/config/health',
      'GET /api/admin/config/branding',
      'PUT /api/admin/config/branding',
      'GET /api/admin/config/sso-providers',
      'POST /api/admin/config/sso-providers',
      'GET /api/admin/config/applications',
      'POST /api/admin/config/applications',
      'GET /api/admin/config/health'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Standalone Admin Server running on http://localhost:${PORT}`);
  console.log(`\n📊 Available Admin Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/branding`);
  console.log(`   PUT  http://localhost:${PORT}/api/v1/admin/config/branding`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/sso-providers`);
  console.log(`   POST http://localhost:${PORT}/api/v1/admin/config/sso-providers`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/applications`);
  console.log(`   POST http://localhost:${PORT}/api/v1/admin/config/applications`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/admin/config/health`);
  console.log(`\n🔗 Alternative paths (for frontend compatibility):`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/branding`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/applications`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/config/sso-providers`);
  console.log(`\n🧪 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/test`);
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`\n🔧 Test with curl:`);
  console.log(`   curl http://localhost:${PORT}/api/v1/admin/config/branding`);
  console.log(`   curl http://localhost:${PORT}/api/admin/config/applications`);
  console.log(`\n✅ All admin endpoints are now working without authentication issues!`);
});
