const express = require('express');
const cors = require('cors');

// Simple test server to verify admin routes work
const app = express();

app.use(cors());
app.use(express.json());

// Mock admin middleware for testing
const mockAdminAuth = (req, res, next) => {
  req.admin = {
    id: 'test-admin-id',
    email: 'test@example.com',
    role: 'super_admin',
    permissions: ['*'],
    isSuperAdmin: true
  };
  next();
};

// Import the actual config routes
const configRoutes = require('./dist/routes/admin/configRoutes').default;

// Mount routes with mock auth
app.use('/api/v1/admin/config', mockAdminAuth, configRoutes);
app.use('/api/admin/config', mockAdminAuth, configRoutes);

// Test endpoints
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is running', timestamp: new Date().toISOString() });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Debug server running on http://localhost:${PORT}`);
  console.log(`📊 Test branding endpoint: http://localhost:${PORT}/api/v1/admin/config/branding`);
  console.log(`📊 Test applications endpoint: http://localhost:${PORT}/api/admin/config/applications`);
  console.log(`📊 Test SSO providers endpoint: http://localhost:${PORT}/api/v1/admin/config/sso-providers`);
});
