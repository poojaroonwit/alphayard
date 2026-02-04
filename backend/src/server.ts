import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

console.log(`[Server] Initialization trigger: ${new Date().toISOString()}`);

// Load environment variables
// 1) Backend-local .env (highest priority)
dotenv.config();
// 2) Project Root .env (fallback for shared secrets)
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as Sentry from '@sentry/node';
// import { nodeProfilingIntegration } from '@sentry/profiling-node';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import cluster from 'cluster';
import os from 'os';

// Import routes
import authRoutes from './routes/mobile/auth';
import userRoutes from './routes/mobile/users';
import circleRoutes from './routes/mobile/circles';
import chatRoutes from './routes/mobile/chat';
import chatAttachmentRoutes from './routes/mobile/chatAttachments';
import locationRoutes from './routes/mobile/location';
import safetyRoutes from './routes/mobile/safety';
import safetyIncidentsRoutes from './routes/mobile/safetyIncidents';
import storageRoutes from './routes/mobile/storage';
import calendarRoutes from './routes/mobile/calendar';
import notesRoutes from './routes/mobile/notes';
import todosRoutes from './routes/mobile/todos';
import socialRoutes from './routes/mobile/social';
import financialRoutes from './routes/mobile/financial';
import translationsRoutes from './routes/mobile/translations';
import emotionsRoutes from './routes/mobile/emotions';
import circleTypeRoutes from './routes/mobile/circleTypeRoutes';
import galleryRoutes from './routes/mobile/gallery';

// ...

import miscRoutes from './routes/mobile/misc';

import auditRoutes from './routes/admin/audit';
import adminRoutes from './routes/admin/admin';

// Import CMS routes
import cmsRoutes from './routes/admin/cmsRoutes';
import marketingRoutes from './routes/admin/marketingRoutes';
// import modalMarketingRoutes from './routes/modalMarketingRoutes';
import localizationRoutes from './routes/admin/localizationRoutes';
import dynamicContentRoutes from './routes/admin/dynamicContentRoutes';
import versionControlRoutes from './routes/admin/versionControlRoutes';
import mobileRoutes from './routes/mobile/mobileRoutes';
import settingsRoutes from './routes/mobile/settings';
import adminAuthRoutes from './routes/admin/adminAuth';
import adminUsersRoutes from './routes/admin/adminUsers';
import configRoutes from './routes/admin/config';
import appConfigRoutes from './routes/admin/appConfigRoutes';
import pageBuilderRoutes from './routes/admin/pageBuilderRoutes';
import componentRoutes from './routes/admin/componentRoutes';
import componentStudioRoutes from './routes/admin/componentStudio';
import templateRoutes from './routes/admin/templateRoutes';
import versionRoutes from './routes/admin/versionRoutes';
import publishingRoutes from './routes/admin/publishingRoutes';
import applicationRoutes from './routes/admin/applicationRoutes';
import assetRoutes from './routes/mobile/assetRoutes';
import preferencesRoutes from './routes/admin/preferences';
import entityRoutes from './routes/admin/entityRoutes';
import collectionsRoutes from './routes/mobile/collectionsRoutes';
import publicApplicationRoutes from './routes/mobile/publicApplicationRoutes';
// import comprehensiveAdminRoutes from './routes/comprehensiveAdminRoutes';

// Import MCP server
// Import MCP server
import { createMcpRouter } from './mcp';

// Import V1 Router
import v1Router from './routes/v1';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { requestIdMiddleware } from './middleware/requestId';
// import { validateRequest } from './middleware/validation';
import { appScopingMiddleware } from './middleware/appScoping';

// Import services
import { initializeSocket } from './socket/socketService';

// Initialize Sentry for error tracking and performance monitoring
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

// Cluster mode for production
const numCPUs = os.cpus().length;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && cluster.isPrimary) {
  console.log(`🚀 Starting Bondarys Backend in cluster mode with ${numCPUs} workers`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Worker process or development mode
  startServer();
}

function startServer() {
  const app = express();
  const server = createServer(app);

  // Initialize Redis for caching and Socket.IO adapter
  let redisClient: Redis | null = null;
  let redisSubscriber: Redis | null = null;

  if (process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL);
      redisSubscriber = new Redis(process.env.REDIS_URL);

      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
      });
    } catch (error) {
      console.warn('⚠️ Redis connection failed, continuing without Redis:', error);
    }
  }

  // Initialize Socket.IO with Redis adapter if available
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Use Redis adapter for Socket.IO if available
  if (redisClient && redisSubscriber) {
    io.adapter(createAdapter(redisClient, redisSubscriber));
    console.log('✅ Socket.IO Redis adapter initialized');
  }

  // Sentry request handler (must be first)
  if (process.env.SENTRY_DSN) {
    // app.use(Sentry.requestHandler());
    // app.use(Sentry.tracingHandler());
  }

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "wss:", "ws:", "https:", "http:"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Rate limiting with Redis store if available
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development or for auth endpoints to prevent blocking login/register flows
    skip: (req) => {
      const isDev = (process.env.NODE_ENV || 'development') !== 'production';
      const path = req.originalUrl || req.url || '';
      const skipPrefixes = [
        '/api/auth', '/api/v1/auth',
        '/api/emotions', '/api/v1/emotions',
        '/api/location', '/api/v1/location',
        '/api/safety', '/api/v1/safety',
        '/api/storage', '/api/v1/storage',
        '/api/calendar', '/api/v1/calendar',
        '/api/notes', '/api/v1/notes',
        '/api/todos', '/api/v1/todos',
        '/api/social', '/api/v1/social',
        '/api/families', '/api/v1/families',
        '/api/users', '/api/v1/users',
        '/api/chat', '/api/v1/chat',
        '/api/chat-attachments', '/api/v1/chat-attachments',
        '/api/mobile', '/api/v1/mobile',
        '/api/notifications', '/api/v1/notifications',
      ];
      return isDev || skipPrefixes.some(prefix => path.startsWith(prefix));
    },
    // store: redisClient ? customRedisStore : undefined
  });

  // Only apply rate limiting in production
  if (isProduction) {
    app.use(limiter);
  } else {
    console.log('🔓 Rate limiting disabled in development mode');
  }

  // CORS with dynamic origin support
  app.use(cors({
    origin: (origin, callback) => {
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production' || !origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:4000', // Added 4000
        'http://localhost:8081',
        'http://localhost:19006',
        'http://localhost:19000',
        'http://localhost:8082',
        'http://localhost:8083',
        'http://localhost:8084',
        'http://localhost:8085',
        'https://bondarys.com',
        'https://www.bondarys.com'
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-App-Version', 'X-App-Name', 'x-app-version']
  }));

  // Body parsing middleware with size limits
  app.use(express.json({
    limit: process.env.MAX_FILE_SIZE || '10mb',
    verify: (req, _res, buf) => {
      // Store raw body for webhook verification
      (req as any).rawBody = buf;
    }
  }));
  app.use(express.urlencoded({
    extended: true,
    limit: process.env.MAX_FILE_SIZE || '10mb'
  }));

  // Static uploads folder
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


  // Compression with options
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // Correlation IDs then request logging
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(appScopingMiddleware);

  // Enhanced health check endpoint
  app.get('/health', async (_req, res) => {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      pid: process.pid,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      services: {
        database: 'unknown',
        redis: 'unknown',
        socket: 'unknown'
      }
    };

    // Check database connection
    try {
      const { pool } = require('./config/database');
      await pool.query('SELECT 1');
      healthCheck.services.database = 'connected';
    } catch (error) {
      healthCheck.services.database = 'disconnected';
      healthCheck.status = 'DEGRADED';
    }

    // Check Redis connection
    if (redisClient) {
      try {
        await redisClient.ping();
        healthCheck.services.redis = 'connected';
      } catch (error) {
        healthCheck.services.redis = 'disconnected';
      }
    } else {
      healthCheck.services.redis = 'not_configured';
    }

    // Check Socket.IO
    healthCheck.services.socket = io.engine.clientsCount >= 0 ? 'active' : 'inactive';

    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  });

  // Metrics endpoint for monitoring
  app.get('/metrics', (req, res) => {
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      system: {
        loadAverage: os.loadavg(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpuCount: os.cpus().length
      },
      connections: {
        socketConnections: io.engine.clientsCount,
        activeRequests: (req as any).connectionCount || 0
      }
    };

    res.json(metrics);
  });

  // API routes with versioning
  // API routes with versioning
  app.use('/api/v1', v1Router);

  // Legacy aliases (mapped to v1 router for backward compatibility)
  app.use('/api', v1Router);

  // Explicit overrides or non-v1 routes if any
  app.use('/api/admin/circle-types', circleTypeRoutes);

  // Audit routes (non-versioned)
  app.use('/api/audit', auditRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // CMS API routes
  app.use('/cms', cmsRoutes);
  app.use('/cms/marketing', marketingRoutes);
  // app.use('/cms/modal-marketing', modalMarketingRoutes);
  app.use('/cms/localization', localizationRoutes);
  app.use('/cms/content', dynamicContentRoutes);
  app.use('/cms/versions', versionControlRoutes);
  app.use('/api/page-builder', pageBuilderRoutes);
  app.use('/api/page-builder', componentRoutes);
  app.use('/api/component-studio', componentStudioRoutes); // New Component Studio API
  app.use('/api/v1/component-studio', componentStudioRoutes); // V1 Compatibility
  app.use('/api/page-builder', templateRoutes);
  app.use('/api/page-builder', versionRoutes);
  app.use('/api/page-builder/publishing', publishingRoutes);
  app.use('/api/page-builder/assets', assetRoutes);
  app.use('/api/mobile', mobileRoutes);
  app.use('/api/mobile/collections', collectionsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/v1/settings', settingsRoutes);
  app.use('/api/config', configRoutes); // New System Config Routes
  app.use('/api/v1/admin/auth', adminUsersRoutes); // Fixed: Use modern adminUsersRoutes for all auth endpoints
  app.use('/api/admin/applications', applicationRoutes);
  app.use('/api/admin/preferences', preferencesRoutes);
  app.use('/api/admin/entities', entityRoutes);
  app.use('/api/public/applications', publicApplicationRoutes);

  // MCP Server API (for AI-assisted development)
  if (process.env.MCP_ENABLED !== 'false') {
    const mcpRouter = createMcpRouter();
    app.use('/api/mcp', mcpRouter as any);
    console.log('✅ MCP Server enabled at /api/mcp');
  }

  // App Configuration API (for dynamic app management - login backgrounds, themes, etc.)
  app.use('/api/app-config', appConfigRoutes);
  app.use('/api/v1/app-config', appConfigRoutes);

  // Backward-compatible prefixes for various API bases
  app.use('/api/cms/localization', localizationRoutes);
  app.use('/api/v1/cms/localization', localizationRoutes);
  app.use('/api/cms/marketing', marketingRoutes);
  app.use('/api/v1/cms/marketing', marketingRoutes);
  // app.use('/admin', comprehensiveAdminRoutes);

  // Legacy API routes are now handled by the alias above: app.use('/api', v1Router);


  // Sentry error handler (must be before other error handlers)
  if (process.env.SENTRY_DSN) {
    // app.use(Sentry.errorHandler());
  }

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found on this server.',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });

  // Initialize services and start server
  async function initializeServices() {
    try {
      // Initialize Database Connection (Pool is already created in database.ts)
    const { pool } = require('./config/database');
    console.log('[Server] Verifying database connection...');
    const dbPromise = pool.query('SELECT 1');
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Database verification timeout')), 5000));
    await Promise.race([dbPromise, timeoutPromise]);
    console.log('✅ Database connection verified');

      // Initialize Socket.IO
    console.log('[Server] Initializing Socket.IO...');
    initializeSocket(io);
    console.log('✅ Socket.IO initialized');

      // Start server
      // Forced to 4001 to avoid conflict with Mobile (4000) and Admin (3001)
      const PORT = 4001;
      const HOST = (process.env.HOST && process.env.HOST !== '0.0.0.0') ? process.env.HOST : '::';

      console.log(`[Server] Starting on port ${PORT}...`);

      server.listen(PORT, HOST, () => {
        console.log(`🚀 Bondarys Backend Server running on ${HOST}:${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
        console.log(`📊 Metrics: http://${HOST}:${PORT}/metrics`);
        console.log(`🔌 Socket.IO: ws://${HOST}:${PORT}`);

        if (isProduction) {
          console.log(`👥 Worker PID: ${process.pid}`);
        }
      });

      // Graceful shutdown handling
      const gracefulShutdown = (signal: string) => {
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

        server.close(() => {
          console.log('✅ HTTP server closed');

          if (redisClient) {
            redisClient.disconnect();
            console.log('✅ Redis connection closed');
          }

          console.log('✅ Graceful shutdown completed');
          process.exit(0);
        });

        // Force close after 30 seconds
        setTimeout(() => {
          console.error('❌ Forced shutdown after timeout');
          process.exit(1);
        }, 30000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
  // Start the services
  initializeServices(); // Restart trigger
}

// export default app; // App is defined inside startServer function