import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config/env';
import { setupChatHandlers } from './chat';
import { v4 as uuidv4 } from 'uuid';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  circleId?: string;
}

// In-memory store for online users (in production, use Redis)
const onlineUsers = new Set<string>();

// Store reference to io instance for external use
let ioInstance: Server | null = null;

// Helper function to send notification to a user via socket
export const sendSocketNotification = async (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    actionUrl?: string;
  }
) => {
  try {
    if (!ioInstance) {
      console.warn('Socket.IO not initialized, cannot send notification');
      return null;
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();

    // Save to database
    // Using $queryRaw because the code uses 'message' and 'status' columns which don't match Prisma schema (body/isRead)
    await prisma.$queryRaw`
      INSERT INTO core.notifications (id, user_id, type, title, message, data, status, action_url, created_at)
      VALUES (${id}::uuid, ${userId}::uuid, ${notification.type}, ${notification.title}, ${notification.message}, 
        ${notification.data ? JSON.stringify(notification.data) : null}::jsonb, 'unread', ${notification.actionUrl}, NOW())
    `;

    const notificationPayload = {
      id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      actionUrl: notification.actionUrl,
      timestamp,
    };

    // Emit to user's notification room
    ioInstance.to(`notifications:${userId}`).emit('notification:new', notificationPayload);
    ioInstance.to(`user:${userId}`).emit('notification:new', notificationPayload);

    console.log(`Notification sent to user ${userId}:`, notification.title);
    return notificationPayload;
  } catch (error) {
    console.error('Error sending socket notification:', error);
    return null;
  }
};

// Helper function to send notification to all circle members
export const sendCircleNotification = async (
  circleId: string,
  senderId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    actionUrl?: string;
  }
) => {
  try {
    if (!ioInstance) {
      console.warn('Socket.IO not initialized, cannot send notification');
      return;
    }

    // Get all circle members except sender
    const circleMembers = await prisma.circleMember.findMany({
      where: {
        circleId: circleId,
        userId: { not: senderId }
      },
      select: {
        userId: true
      }
    });

    const timestamp = new Date().toISOString();

    for (const member of circleMembers) {
      const id = uuidv4();
      
      // Save to database
      // Using $queryRaw because the code uses 'message', 'status', and 'sender_id' columns which don't match Prisma schema
      await prisma.$queryRaw`
        INSERT INTO core.notifications (id, user_id, type, title, message, data, status, action_url, sender_id, created_at)
        VALUES (${id}::uuid, ${member.userId}::uuid, ${notification.type}, ${notification.title}, ${notification.message},
          ${notification.data ? JSON.stringify(notification.data) : null}::jsonb, 'unread', ${notification.actionUrl}, ${senderId}::uuid, NOW())
      `;

      const notificationPayload = {
        id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        actionUrl: notification.actionUrl,
        timestamp,
      };

      // Emit to user's notification room
      ioInstance.to(`notifications:${member.userId}`).emit('notification:new', notificationPayload);
      ioInstance.to(`user:${member.userId}`).emit('notification:new', notificationPayload);
    }

    console.log(`Circle notification sent to ${circleMembers.length} members`);
  } catch (error) {
    console.error('Error sending circle notification:', error);
  }
};

// Check if user is online
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

// Get online users
export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers);
};

export const initializeSocket = (io: Server) => {
  // Store io instance for external use
  ioInstance = io;

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
        config.JWT_SECRET
      ) as any;

      console.log('[SOCKET AUTH] Token decoded for user ID:', decoded.id);

      // Verify user exists and get circle info using Prisma
      let user = null;
      let userError = null;

      try {
        user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, isActive: true }
        });
      } catch (err: any) {
        userError = err;
      }

      console.log('[SOCKET AUTH] User lookup result:', { user, error: userError?.message });

      if (userError) {
        console.error('[SOCKET AUTH] User lookup error:', userError);
        // If user not found in public.users, allow connection anyway (they may have just registered)
        // Their socket will have limited functionality but won't fail completely
        socket.userId = decoded.id;
        socket.circleId = null;
        console.log('[SOCKET AUTH] Allowing connection despite user lookup error');
        return next();
      }

      if (!user || !user.isActive) {
        console.log('[SOCKET AUTH] User not found or inactive:', { found: !!user, isActive: user?.isActive });
        return next(new Error('Invalid token or inactive user'));
      }

      // Get user's circle using Prisma
      let circleMember = null;
      try {
        circleMember = await prisma.circleMember.findFirst({
          where: { userId: user.id },
          select: { circleId: true }
        });
      } catch (err) {
        console.error('[SOCKET AUTH] circle lookup error:', err);
      }

      socket.userId = user.id;
      socket.circleId = circleMember?.circleId || null;

      console.log('[SOCKET AUTH] User authenticated:', { userId: socket.userId, circleId: socket.circleId });
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

    // Join circle room if user has a circle
    if (socket.circleId) {
      socket.join(`circle:${socket.circleId}`);
      console.log(`User ${socket.userId} joined circle room: ${socket.circleId}`);

      // Notify circle members that user is online
      socket.to(`circle:${socket.circleId}`).emit('user:online', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    }

    // Setup chat handlers
    setupChatHandlers(io, socket as Socket & { userId?: string });

    // Handle location updates
    socket.on('location:update', async (data) => {
      try {
        if (!socket.circleId || !socket.userId) {
          socket.emit('error', { message: 'Not a member of any circle' });
          return;
        }

        const { latitude, longitude, accuracy, address } = data;

        // Save location to database using Prisma
        // Using $queryRaw because the code uses 'location_history' table which doesn't match Prisma schema (user_locations)
        const timestamp = new Date().toISOString();

        try {
          await prisma.$queryRaw`
            INSERT INTO bondarys.location_history (user_id, circle_id, latitude, longitude, accuracy, address, created_at)
            VALUES (${socket.userId}::uuid, ${socket.circleId}::uuid, ${latitude}::decimal, ${longitude}::decimal, 
              ${accuracy || null}::decimal, ${address || null}, ${timestamp}::timestamptz)
          `;
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

        // Broadcast to circle members
        socket.to(`circle:${socket.circleId}`).emit('location:update', locationUpdate);

      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle safety alerts
    socket.on('safety:alert', async (data) => {
      try {
        if (!socket.circleId || !socket.userId) {
          socket.emit('error', { message: 'Not a member of any circle' });
          return;
        }

        const { type, message, location, severity } = data;

        // Save alert to database using Prisma
        // Using $queryRaw because the code uses 'safety_alerts' table which doesn't match Prisma schema (safety_incidents)
        const timestamp = new Date().toISOString();

        let alertData: any = null;
        try {
          const result = await prisma.$queryRaw<any[]>`
            INSERT INTO bondarys.safety_alerts (user_id, circle_id, type, severity, message, location, is_resolved, created_at, updated_at)
            VALUES (${socket.userId}::uuid, ${socket.circleId}::uuid, ${type || 'custom'}, ${severity || 'urgent'}, 
              ${message || ''}, ${location || null}::jsonb, false, ${timestamp}::timestamptz, ${timestamp}::timestamptz)
            RETURNING *
          `;
          alertData = result[0] || null;
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
          circleId: socket.circleId,
          timestamp,
          status: 'active'
        };

        // Broadcast urgent alert to all circle members
        io.to(`circle:${socket.circleId}`).emit('safety:alert', alert);

      } catch (error) {
        console.error('Safety alert error:', error);
        socket.emit('error', { message: 'Failed to send alert' });
      }
    });

    // Handle location requests
    socket.on('location:request', async (data) => {
      try {
        if (!socket.circleId || !socket.userId) {
          socket.emit('error', { message: 'Not a member of any circle' });
          return;
        }

        const { targetUserId } = data;

        if (!targetUserId) {
          socket.emit('error', { message: 'Target user ID is required' });
          return;
        }

        // Verify both users are in the same circle using Prisma
        let requesterMember = null;
        let targetMember = null;

        try {
          requesterMember = await prisma.circleMember.findFirst({
            where: {
              userId: socket.userId,
              circleId: socket.circleId
            },
            select: { circleId: true }
          });

          targetMember = await prisma.circleMember.findFirst({
            where: {
              userId: targetUserId,
              circleId: socket.circleId
            },
            select: { circleId: true }
          });
        } catch (err) {
          console.error('[SOCKET] Error verifying circle members:', err);
        }

        if (!requesterMember || !targetMember) {
          socket.emit('error', { message: 'Not authorized to request location' });
          return;
        }

        // Get requester's name using Prisma
        let requesterUser = null;
        try {
          requesterUser = await prisma.user.findUnique({
            where: { id: socket.userId },
            select: { firstName: true, lastName: true }
          });
        } catch (err) {
          console.error('[SOCKET] Error getting requester name:', err);
        }

        const requesterName = requesterUser
          ? `${requesterUser.firstName} ${requesterUser.lastName}`.trim()
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
      if (socket.circleId) {
        socket.to(`circle:${socket.circleId}`).emit('chat:typing', {
          userId: socket.userId,
          isTyping: data.isTyping
        });
      }
    });

    // =============================================
    // NOTIFICATION HANDLERS
    // =============================================

    // Join user's personal notification room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      console.log(`User ${socket.userId} joined notification room`);
    }

    // Subscribe to notifications
    socket.on('notification:subscribe', () => {
      if (socket.userId) {
        socket.join(`notifications:${socket.userId}`);
        console.log(`User ${socket.userId} subscribed to notifications`);
      }
    });

    // Unsubscribe from notifications
    socket.on('notification:unsubscribe', () => {
      if (socket.userId) {
        socket.leave(`notifications:${socket.userId}`);
        console.log(`User ${socket.userId} unsubscribed from notifications`);
      }
    });

    // Mark notification as read
    socket.on('notification:mark-read', async (data) => {
      try {
        const { notificationId } = data;
        if (!notificationId || !socket.userId) return;

        // Using $queryRaw because the code uses 'status' column which doesn't match Prisma schema (isRead)
        await prisma.$queryRaw`
          UPDATE core.notifications SET status = 'read', updated_at = NOW() WHERE id = ${notificationId}::uuid AND user_id = ${socket.userId}::uuid
        `;

        // Emit to user's notification room
        io.to(`notifications:${socket.userId}`).emit('notification:read', { notificationId });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });

    // Get unread notification count
    socket.on('notification:get-count', async () => {
      try {
        if (!socket.userId) return;

        // Using $queryRaw because the code uses 'status' column which doesn't match Prisma schema (isRead)
        const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count FROM core.notifications WHERE user_id = ${socket.userId}::uuid AND status = 'unread'
        `;

        socket.emit('notification:count', { unreadCount: Number(result[0]?.count || 0) });
      } catch (error) {
        console.error('Error getting notification count:', error);
        socket.emit('notification:count', { unreadCount: 0 });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from socket`);

      // Notify circle members that user is offline
      if (socket.circleId) {
        socket.to(`circle:${socket.circleId}`).emit('user:offline', {
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

