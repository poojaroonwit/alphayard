const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Test the mobile branding endpoint
app.get('/api/v1/mobile/branding', (req, res) => {
  console.log('✅ GET /api/v1/mobile/branding endpoint called');
  res.json({
    success: true,
    branding: {
      mobileAppName: 'Boundary',
      logoUrl: 'https://example.com/logo.png',
      iconUrl: 'https://example.com/icon.png',
      analytics: {
        sentryDsn: null,
        mixpanelToken: null,
        googleAnalyticsId: null,
        enableDebugLogs: true,
      },
      legal: {
        privacyPolicyUrl: 'https://boundary.com/privacy',
        termsOfServiceUrl: 'https://boundary.com/terms',
        cookiePolicyUrl: 'https://boundary.com/cookies',
        dataDeletionUrl: 'https://boundary.com/delete-data',
        dataRequestEmail: 'privacy@boundary.com',
      },
      app: {
        version: '1.0.0',
        buildNumber: '1',
        environment: 'development',
        platform: 'mobile',
        supportedFeatures: [
          'circles',
          'chat',
          'location',
          'safety',
          'calendar',
          'gallery',
          'notes',
          'shopping',
          'expenses'
        ]
      },
      screens: [
        {
          id: 'home',
          name: 'Home',
          background: '#FFFFFF',
          resizeMode: 'cover',
          description: 'Main home screen'
        },
        {
          id: 'about',
          name: 'About',
          background: '#F8F9FA',
          resizeMode: 'cover',
          description: 'About Boundary app'
        }
      ],
      categories: [
        {
          id: 'main',
          name: 'Main',
          description: 'Main app features',
          icon: 'home',
          components: []
        }
      ]
    }
  });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`🚀 About/Branding test server running on port ${PORT}`);
  console.log(`\n📋 Testing endpoints:`);
  console.log('  GET /api/v1/mobile/branding - Mobile branding configuration');
  console.log(`\n🔗 Test at: http://localhost:${PORT}`);
});
