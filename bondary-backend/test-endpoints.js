const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Test all the missing endpoints that were causing 404 errors

// 1. /identity/auth endpoint
app.get('/identity/auth', (req, res) => {
  console.log('✅ /identity/auth endpoint called');
  res.json({
    authenticated: true,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      isVerified: true
    }
  });
});

// 2. /identity/mfa endpoint  
app.get('/identity/mfa', (req, res) => {
  console.log('✅ /identity/mfa endpoint called');
  res.json({ 
    mfaSettings: [],
    backupCodesRemaining: 0
  });
});

// 3. /identity/organizations endpoint
app.get('/identity/organizations', (req, res) => {
  console.log('✅ /identity/organizations endpoint called');
  res.json({ 
    organizations: [],
    total: 0
  });
});

// 4. /api/v1/admin/application-settings endpoint
app.get('/api/v1/admin/application-settings', (req, res) => {
  console.log('✅ /api/v1/admin/application-settings endpoint called');
  res.json({ 
    settings: {
      app: {
        name: 'Boundary App',
        version: '1.0.0',
        features: []
      }
    }
  });
});

// 5. /settings/team endpoint
app.get('/settings/team', (req, res) => {
  console.log('✅ /settings/team endpoint called');
  res.json({ 
    success: true,
    team: {
      members: [],
      roles: [],
      permissions: [],
      settings: {}
    }
  });
});

// 6. /sandbox endpoint
app.get('/sandbox', (req, res) => {
  console.log('✅ /sandbox endpoint called');
  res.json({ 
    success: true,
    message: 'Sandbox endpoint is working',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log('\n📋 Testing endpoints:');
  console.log('  GET /identity/auth');
  console.log('  GET /identity/mfa');  
  console.log('  GET /identity/organizations');
  console.log('  GET /api/v1/admin/application-settings');
  console.log('  GET /settings/team');
  console.log('  GET /sandbox');
  console.log(`\n🔗 Test at: http://localhost:${PORT}`);
});
