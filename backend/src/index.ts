import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

// Import middleware
import { generalLimiter as rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/mobile/auth';
import socialRoutes from './routes/mobile/social';
import popupRoutes from './routes/admin/popupRoutes';
import userLocationsRoutes from './routes/mobile/userLocations';
import miscRoutes from './routes/mobile/misc';
import adminAuthRoutes from './routes/admin/adminAuth';
import adminRoutes from './routes/admin/admin';
import healthRoutes from './routes/health';
import settingsRoutes from './routes/mobile/settings';

// Import services
import { initializeSocket } from './socket/socketService';
import { pool } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.set('io', io);

// Initialize services
initializeSocket(io);

// Verify Database Connection
pool.query('SELECT 1').then(() => {
  console.log('✅ Database connected (pool)');
}).catch(err => {
  console.error('❌ Database connection failed:', err);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

// API routes
import circleTypeRoutes from './routes/mobile/circleTypeRoutes';
import mobileRoutes from './routes/mobile/mobileRoutes';
import storageRoutes from './routes/mobile/storage';

app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/user/locations', userLocationsRoutes);
app.use('/api/v1/misc', miscRoutes);
app.use('/api/popups', popupRoutes);
app.use('/api/v1/circle-types', circleTypeRoutes);
app.use('/api/v1/storage', storageRoutes);

// Chat Routes
import chatRoutes from './routes/mobile/chat';
import chatAttachmentRoutes from './routes/mobile/chatAttachments';
app.use('/api/v1/chat', chatRoutes); // /api/v1/chat/families/:id/rooms
app.use('/api/v1', chatAttachmentRoutes); // /api/v1/messages/... and /api/v1/attachments/...

app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/mobile', mobileRoutes);

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.info(`🚀 Bondarys API Server running on port ${PORT}`);
  console.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    console.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { app, io }; 
