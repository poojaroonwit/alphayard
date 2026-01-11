import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { setupChatHandlers } from './chat';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  familyId?: string;
}

// In-memory store for online users (in production, use Redis)
const onlineUsers = new Set<string>();

export const initializeSocket = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'bondarys-dev-secret-key'
      ) as any;

      console.log('[SOCKET AUTH] Token decoded for user ID:', decoded.id);

      // Verify user exists and get hourse info using native pg pool
      let user = null;
      let userError = null;

      try {
        const userResult = await pool.query(
          'SELECT id, email, is_active FROM users WHERE id = $1',
          [decoded.id]
        );
        user = userResult.rows[0] || null;
      } catch (err: any) {
        userError = err;
      }

      console.log('[SOCKET AUTH] User lookup result:', { user, error: userError?.message });

      if (userError) {
        console.error('[SOCKET AUTH] User lookup error:', userError);
        // If user not found in public.users, allow connection anyway (they may have just registered)
        // Their socket will have limited functionality but won't fail completely
        socket.userId = decoded.id;
        socket.familyId = null;
        console.log('[SOCKET AUTH] Allowing connection despite user lookup error');
        return next();
      }

      if (!user || !user.is_active) {
        console.log('[SOCKET AUTH] User not found or inactive:', { found: !!user, is_active: user?.is_active });
        return next(new Error('Invalid token or inactive user'));
      }

      // Get user's hourse using native pg pool
      let familyMember = null;
      try {
        const familyResult = await pool.query(
          'SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1',
          [user.id]
        );
        familyMember = familyResult.rows[0] || null;
      } catch (err) {
        console.error('[SOCKET AUTH] Family lookup error:', err);
      }

      socket.userId = user.id;
      socket.familyId = familyMember?.family_id;

      console.log('[SOCKET AUTH] User authenticated:', { userId: socket.userId, familyId: socket.familyId });
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected to socket`);

    // Track user as online
    if (socket.userId) {
      onlineUsers.add(socket.userId);
    }

    // Join hourse room if user has a hourse
    if (socket.familyId) {
      socket.join(`hourse:${socket.familyId}`);
      console.log(`User ${socket.userId} joined hourse room: ${socket.familyId}`);

      // Notify hourse members that user is online
      socket.to(`hourse:${socket.familyId}`).emit('user:online', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    }

    // Setup chat handlers
    setupChatHandlers(io, socket as Socket & { userId?: string });

    // Handle location updates
    socket.on('location:update', async (data) => {
      try {
        if (!socket.familyId || !socket.userId) {
          socket.emit('error', { message: 'Not a member of any hourse' });
          return;
        }

        const { latitude, longitude, accuracy, address } = data;

        // Save location to database using native pg pool
        const timestamp = new Date().toISOString();

        try {
          await pool.query(
            `INSERT INTO location_history (user_id, family_id, latitude, longitude, accuracy, address, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [socket.userId, socket.familyId, latitude, longitude, accuracy || null, address || null, timestamp]
          );
        } catch (dbError) {
          console.error('Error saving location to database:', dbError);
          // Continue to broadcast even if DB save fails
        }

        const locationUpdate = {
          userId: socket.userId,
          latitude,
          longitude,
          accuracy,
          address,
          timestamp
        };

        // Broadcast to hourse members
        socket.to(`hourse:${socket.familyId}`).emit('location:update', locationUpdate);

      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle safety alerts
    socket.on('safety:alert', async (data) => {
      try {
        if (!socket.familyId || !socket.userId) {
          socket.emit('error', { message: 'Not a member of any hourse' });
          return;
        }

        const { type, message, location, severity } = data;

        // Save alert to database using native pg pool
        const timestamp = new Date().toISOString();

        let alertData: any = null;
        try {
          const result = await pool.query(
            `INSERT INTO safety_alerts (user_id, family_id, type, severity, message, location, is_resolved, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [socket.userId, socket.familyId, type || 'custom', severity || 'urgent', message || '', location || null, false, timestamp, timestamp]
          );
          alertData = result.rows[0];
        } catch (dbError) {
          console.error('Error saving safety alert to database:', dbError);
          // Continue to broadcast even if DB save fails
        }

        const alert = {
          id: alertData?.id || Date.now().toString(),
          type: type || 'custom',
          message: message || '',
          location: location || null,
          severity: severity || 'urgent',
          userId: socket.userId,
          familyId: socket.familyId,
          timestamp,
          status: 'active'
        };

        // Broadcast urgent alert to all hourse members
        io.to(`hourse:${socket.familyId}`).emit('safety:alert', alert);

      } catch (error) {
        console.error('Safety alert error:', error);
        socket.emit('error', { message: 'Failed to send alert' });
      }
    });

    // Handle location requests
    socket.on('location:request', async (data) => {
      try {
        if (!socket.familyId || !socket.userId) {
          socket.emit('error', { message: 'Not a member of any hourse' });
          return;
        }

        const { targetUserId } = data;

        if (!targetUserId) {
          socket.emit('error', { message: 'Target user ID is required' });
          return;
        }

        // Verify both users are in the same hourse using native pg pool
        let requesterMember = null;
        let targetMember = null;

        try {
          const requesterResult = await pool.query(
            'SELECT family_id FROM family_members WHERE user_id = $1 AND family_id = $2',
            [socket.userId, socket.familyId]
          );
          requesterMember = requesterResult.rows[0] || null;

          const targetResult = await pool.query(
            'SELECT family_id FROM family_members WHERE user_id = $1 AND family_id = $2',
            [targetUserId, socket.familyId]
          );
          targetMember = targetResult.rows[0] || null;
        } catch (err) {
          console.error('[SOCKET] Error verifying family members:', err);
        }

        if (!requesterMember || !targetMember) {
          socket.emit('error', { message: 'Not authorized to request location' });
          return;
        }

        // Get requester's name using native pg pool
        let requesterUser = null;
        try {
          const userResult = await pool.query(
            'SELECT first_name, last_name FROM users WHERE id = $1',
            [socket.userId]
          );
          requesterUser = userResult.rows[0] || null;
        } catch (err) {
          console.error('[SOCKET] Error getting requester name:', err);
        }

        const requesterName = requesterUser
          ? `${requesterUser.first_name} ${requesterUser.last_name}`.trim()
          : 'Someone';

        // Emit location request to target user
        io.to(`user:${targetUserId}`).emit('location_request', {
          fromUserId: socket.userId,
          fromUserName: requesterName,
          timestamp: new Date().toISOString()
        });

        console.log(`Location request sent from ${socket.userId} to ${targetUserId}`);
      } catch (error) {
        console.error('Error requesting location:', error);
        socket.emit('error', { message: 'Failed to request location' });
      }
    });

    // Handle typing indicators
    socket.on('chat:typing', (data) => {
      if (socket.familyId) {
        socket.to(`hourse:${socket.familyId}`).emit('chat:typing', {
          userId: socket.userId,
          isTyping: data.isTyping
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from socket`);

      // Notify hourse members that user is offline
      if (socket.familyId) {
        socket.to(`hourse:${socket.familyId}`).emit('user:offline', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  console.log('Socket.IO server initialized');
};
