import express from 'express';

console.log(`[UniApps Admin Server] Initialization trigger: ${new Date().toISOString()}`);

// Environment variables are loaded by the entry point (server.ts)

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


// Export app creator for Custom Server
export async function createApp() {
  const app = express();

  // Middleware
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

  // Database Connection
  try {
    const { prisma } = require('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
  } catch (err: any) {
    console.warn('⚠️ Database connection warning:', err.message);
  }

  return app;
}
