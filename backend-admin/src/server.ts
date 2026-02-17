import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

console.log(`[UniApps Admin Server] Initialization trigger: ${new Date().toISOString()}`);

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as Sentry from '@sentry/node';
import cluster from 'cluster';
import os from 'os';

// Import Admin Routes
import v1AdminRouter from './routes/v1/admin';
import healthRoutes from './routes/health';
import cmsRoutes from './routes/admin/cmsRoutes';
import marketingRoutes from './routes/admin/marketingRoutes';
import localizationRoutes from './routes/admin/localizationRoutes';
import dynamicContentRoutes from './routes/admin/dynamicContentRoutes';
import versionControlRoutes from './routes/admin/versionControlRoutes';
import pageBuilderRoutes from './routes/admin/pageBuilderRoutes';
import componentRoutes from './routes/admin/componentRoutes';
import componentStudioRoutes from './routes/admin/componentStudio';
import templateRoutes from './routes/admin/templateRoutes';
import versionRoutes from './routes/admin/versionRoutes';
import publishingRoutes from './routes/admin/publishingRoutes';
import configRoutes from './routes/admin/config';
import appConfigRoutes from './routes/admin/appConfigRoutes';
import applicationRoutes from './routes/admin/applicationRoutes';
import preferencesRoutes from './routes/admin/preferences';
import entityRoutes from './routes/admin/entityRoutes';
import { createMcpRouter } from './mcp';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { requestIdMiddleware } from './middleware/requestId';

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
  console.log(`🚀 Starting UniApps Admin Backend in cluster mode with ${numCPUs} workers`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();
} else {
  startServer();
}

function startServer() {
  const app = express();
  const server = createServer(app);

  const io = new Server(server, {
    cors: { origin: true, credentials: true }
  });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression());
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  // Admin / CMS Routes
  app.use('/health', healthRoutes);
  app.use('/api/v1', v1AdminRouter);
  app.use('/api', v1AdminRouter);
  
  app.use('/cms', cmsRoutes);
  app.use('/cms/marketing', marketingRoutes);
  app.use('/cms/localization', localizationRoutes);
  app.use('/cms/content', dynamicContentRoutes);
  app.use('/cms/versions', versionControlRoutes);
  app.use('/api/page-builder', pageBuilderRoutes);
  app.use('/api/page-builder', componentRoutes);
  app.use('/api/component-studio', componentStudioRoutes);
  app.use('/api/page-builder', templateRoutes);
  app.use('/api/page-builder', versionRoutes);
  app.use('/api/page-builder/publishing', publishingRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/app-config', appConfigRoutes);
  app.use('/api/admin/applications', applicationRoutes);
  app.use('/api/admin/preferences', preferencesRoutes);
  app.use('/api/admin/entities', entityRoutes);

  if (process.env.MCP_ENABLED !== 'false') {
    app.use('/api/mcp', createMcpRouter() as any);
  }

  app.use(errorHandler);

  async function initializeServices() {
    try {
      const { prisma } = require('./config/database');
      await prisma.$queryRaw`SELECT 1`;
      
      const PORT = Number(process.env.ADMIN_PORT || 3001);
      server.listen(PORT, '::', () => {
        console.log(`🚀 UniApps Admin Backend Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('❌ Failed to start admin server:', error);
      process.exit(1);
    }
  }
  initializeServices();
}