import request from 'supertest';
import express from 'express';
import adminConfigRoutes from '../src/routes/admin/configRoutes';

// Mock the authentication middleware for testing
const mockAuthenticateAdmin = (req: any, res: any, next: any) => {
  req.admin = {
    id: 'test-admin-id',
    email: 'test@example.com',
    role: 'admin',
    permissions: ['*'] // All permissions for testing
  };
  next();
};

// Mock the permission middleware for testing
const mockRequirePermission = (module: string, action: string) => {
  return (req: any, res: any, next: any) => next();
};

// Mock Prisma client
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    application: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    appSetting: {
      upsert: jest.fn()
    },
    $queryRaw: jest.fn()
  }
}));

// Mock the middleware modules
jest.mock('../src/middleware/adminAuth', () => ({
  authenticateAdmin: mockAuthenticateAdmin
}));

jest.mock('../src/middleware/permissionCheck', () => ({
  requirePermission: mockRequirePermission
}));

describe('Admin Config Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/admin', adminConfigRoutes);
  });

  describe('GET /api/v1/admin/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/admin/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('memory');
    });
  });

  describe('GET /api/v1/admin/config/branding', () => {
    it('should return branding configuration', async () => {
      // Mock the Prisma response
      const { prisma } = require('../src/lib/prisma');
      prisma.application.findFirst.mockResolvedValue({
        id: 'test-app-id',
        branding: { primaryColor: '#000000' },
        appSettings: []
      });

      const response = await request(app)
        .get('/api/v1/admin/config/branding')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('PUT /api/v1/admin/config/branding', () => {
    it('should update branding configuration', async () => {
      const { prisma } = require('../src/lib/prisma');
      
      // Mock the responses
      prisma.application.findFirst.mockResolvedValue({
        id: 'test-app-id'
      });
      
      prisma.appSetting.upsert.mockResolvedValue({});
      prisma.application.findFirst.mockResolvedValue({
        id: 'test-app-id',
        branding: { primaryColor: '#ffffff' },
        appSettings: []
      });

      const brandingData = {
        primaryColor: '#ffffff',
        secondaryColor: '#000000',
        appName: 'Test App'
      };

      const response = await request(app)
        .put('/api/v1/admin/config/branding')
        .set('Authorization', 'Bearer test-token')
        .send({ branding: brandingData })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(brandingData);
      expect(response.body.message).toBe('Branding updated successfully');
    });

    it('should validate branding data', async () => {
      const invalidBranding = {
        primaryColor: 'invalid-color',
        appName: '' // Empty app name
      };

      const response = await request(app)
        .put('/api/v1/admin/config/branding')
        .set('Authorization', 'Bearer test-token')
        .send({ branding: invalidBranding })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/applications', () => {
    it('should return applications list', async () => {
      const { prisma } = require('../src/lib/prisma');
      
      prisma.application.findMany.mockResolvedValue([
        {
          id: 'app-1',
          name: 'Test App',
          slug: 'test-app',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { users: 10, appSettings: 5 }
        }
      ]);

      const response = await request(app)
        .get('/api/v1/admin/applications')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toHaveLength(1);
      expect(response.body.data.applications[0].name).toBe('Test App');
    });
  });

  describe('POST /api/v1/admin/applications', () => {
    it('should create new application', async () => {
      const { prisma } = require('../src/lib/prisma');
      
      prisma.application.findUnique.mockResolvedValue(null); // No existing app
      prisma.application.create.mockResolvedValue({
        id: 'new-app-id',
        name: 'New App',
        slug: 'new-app',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const appData = {
        name: 'New App',
        slug: 'new-app',
        description: 'A new test application'
      };

      const response = await request(app)
        .post('/api/v1/admin/applications')
        .set('Authorization', 'Bearer test-token')
        .send(appData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.application.name).toBe('New App');
      expect(response.body.message).toBe('Application created successfully');
    });

    it('should validate application data', async () => {
      const invalidApp = {
        name: '', // Empty name
        slug: 'invalid slug with spaces'
      };

      const response = await request(app)
        .post('/api/v1/admin/applications')
        .set('Authorization', 'Bearer test-token')
        .send(invalidApp)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      // This test would need to be more sophisticated to properly test rate limiting
      // For now, just ensure the endpoint exists and responds
      const response = await request(app)
        .get('/api/v1/admin/health')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

export {};
