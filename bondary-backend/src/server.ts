import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

console.log(`[UniApps Mobile Server] Initialization trigger: ${new Date().toISOString()}`);

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as Sentry from '@sentry/node';
import { createAdapter } from '@socket.io/redis-adapter';
import redisService from './services/redisService';
import cluster from 'cluster';
import os from 'os';

// Import Mobile Routes
import v1Router from './routes/v1';
import healthRoutes from './routes/health';
import webhooksRoutes from './routes/mobile/webhooks';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { appScopingMiddleware } from './middleware/appScoping';

// Import services
import { initializeSocket } from './socket/socketService';

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`🚀 Starting UniApps Mobile Backend in cluster mode with ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  startServer();
}

function startServer() {
  const app = express();
  const server = createServer(app);

  // We'll initialize these later in initializeServices after connecting
  let redisClient: any = null;
  let redisSubscriber: any = null;

  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  if (redisClient && redisSubscriber) {
    io.adapter(createAdapter(redisClient, redisSubscriber));
  }

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());
  app.use(requestIdMiddleware);
  app.use(requestLogger);
  app.use(appScopingMiddleware);

  // Routes
  app.use('/health', healthRoutes);
  app.use('/api/v1', v1Router);
  app.use('/api', v1Router);
  app.use('/webhooks', webhooksRoutes);

  app.use(errorHandler);

  async function initializeServices() {
    try {
      const { prisma } = require('./config/database');
      const client = await redisService.getClient();
      if (client) {
        // Create a duplicate for subscriber
        const subscriber = client.duplicate();
        io.adapter(createAdapter(client, subscriber));
      }
      initializeSocket(io);

      const PORT = Number(process.env.MOBILE_PORT || 4000);
      server.listen(PORT, '::', () => {
        console.log(`🚀 UniApps Mobile Backend Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
  initializeServices();
}
