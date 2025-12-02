import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import * as Sentry from '@sentry/node';
// import { nodeProfilingIntegration } from '@sentry/profiling-node';
import Redis from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import cluster from 'cluster';
import os from 'os';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import familyRoutes from './routes/families';
import chatRoutes from './routes/chat';
import chatAttachmentRoutes from './routes/chatAttachments';
import locationRoutes from './routes/location';
import safetyRoutes from './routes/safety';
import safetyIncidentsRoutes from './routes/safetyIncidents';
import storageRoutes from './routes/storage';
import calendarRoutes from './routes/calendar';
import notesRoutes from './routes/notes';
import todosRoutes from './routes/todos';
import socialRoutes from './routes/social';
// JS route modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const auditRoutes = require('./routes/audit');
const adminRoutes = require('./routes/admin');

// Import CMS routes
import cmsRoutes from './routes/cmsRoutes';
// import modalMarketingRoutes from './routes/modalMarketingRoutes';
import localizationRoutes from './routes/localizationRoutes';
import dynamicContentRoutes from './routes/dynamicContentRoutes';
import versionControlRoutes from './routes/versionControlRoutes';
import mobileRoutes from './routes/mobileRoutes';
import settingsRoutes from './routes/settings';
import adminAuthRoutes from './routes/adminAuth';
import appConfigRoutes from './routes/appConfigRoutes';
// import comprehensiveAdminRoutes from './routes/comprehensiveAdminRoutes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { requestIdMiddleware } from './middleware/requestId';
// import { validateRequest } from './middleware/validation';

// Import services
import { initializeSupabase, getSupabaseClient } from './services/supabaseService';
import { initializeSocket } from './socket/socketService';

// Load environment variables from repository root
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });
dotenv.config();

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
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "ws:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

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
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3001',
        'http://localhost:3000',
        'http://localhost:8081',
        'http://localhost:19006',
        'http://localhost:19000',
        'https://bondarys.com',
        'https://www.bondarys.com'
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
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
      const supabase = getSupabaseClient();
      await supabase.from('users').select('id').limit(1);
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
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/families', familyRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/chat-attachments', chatAttachmentRoutes);
  app.use('/api/v1/location', locationRoutes);
  app.use('/api/v1/safety', safetyRoutes);
  app.use('/api/v1/safety', safetyIncidentsRoutes);
  app.use('/api/v1/storage', storageRoutes);
  app.use('/api/v1/calendar', calendarRoutes);
  app.use('/api/v1/notes', notesRoutes);
  app.use('/api/v1/todos', todosRoutes);
  app.use('/api/v1/social', socialRoutes);
  // Audit routes (non-versioned)
  app.use('/api/audit', auditRoutes);
  app.use('/api/admin', adminRoutes);

  // CMS API routes
  app.use('/cms', cmsRoutes);
  // app.use('/cms/modal-marketing', modalMarketingRoutes);
  app.use('/cms/localization', localizationRoutes);
  app.use('/cms/content', dynamicContentRoutes);
  app.use('/cms/versions', versionControlRoutes);
  app.use('/api/mobile', mobileRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/admin/auth', adminAuthRoutes);
  
  // App Configuration API (for dynamic app management - login backgrounds, themes, etc.)
  app.use('/api/app-config', appConfigRoutes);
  app.use('/api/v1/app-config', appConfigRoutes);
  
  // Backward-compatible prefixes for various API bases
  app.use('/api/cms/localization', localizationRoutes);
  app.use('/api/v1/cms/localization', localizationRoutes);
  // app.use('/admin', comprehensiveAdminRoutes);

  // Legacy API routes (for backward compatibility)
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/families', familyRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/chat-attachments', chatAttachmentRoutes);
  app.use('/api/location', locationRoutes);
  app.use('/api/safety', safetyRoutes);
  app.use('/api/safety', safetyIncidentsRoutes);
  app.use('/api/storage', storageRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/notes', notesRoutes);
  app.use('/api/todos', todosRoutes);
  app.use('/api/social', socialRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/admin', adminRoutes);
  // app.use('/api/admin', comprehensiveAdminRoutes);

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
      // Initialize Supabase
      await initializeSupabase();
      console.log('✅ Supabase connected successfully');

      // Initialize Socket.IO
      initializeSocket(io);
      console.log('✅ Socket.IO initialized');

      // Start server
      const PORT = parseInt(process.env.PORT || '3000');
      const HOST = process.env.HOST || '0.0.0.0';
      
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
  initializeServices();
}

// export default app; // App is defined inside startServer function