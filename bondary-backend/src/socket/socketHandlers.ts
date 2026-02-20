import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';
import { UserModel } from '../models/UserModel';
import { circleService } from '../services/circleService';
// import { ChatModel } from '../models/ChatModel';
// ... other models

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = (socket.handshake.auth.token as string) || 
                  (socket.handshake.headers.authorization?.replace('Bearer ', ''));
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user.id;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

export const setupSocketHandlers = (io: Server) => {
  io.use(authenticateSocket);

  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected via socket`);

    const userId = socket.userId!;

    // Join user to their circle rooms
    try {
      const userFamilies = await circleService.getCirclesForUser(userId);
      userFamilies.forEach((circle: any) => {
        socket.join(`circle:${circle.id}`);
        console.log(`User ${userId} joined circle room: ${circle.id}`);
      });
    } catch (error) {
      console.error('Error joining circle rooms:', error);
    }

    // CHAT EVENTS
    socket.on('join_chat', async (data: { chatId: string }) => {
      const { chatId } = data;
      // In a real app, check permissions
      socket.join(`chat:${chatId}`);
      socket.emit('joined_chat', { chatId });
    });

    socket.on('send_message', async (data: { chatId: string, content: string }) => {
      const { chatId, content } = data;
      // Emit to all participants in the chat room
      io.to(`chat:${chatId}`).emit('new_message', {
        chatId,
        content,
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    // LOCATION EVENTS
    socket.on('update_location', (data: { lat: number, lng: number }) => {
      // Broadcast to circle members
      // (Simplified logic for now)
      socket.broadcast.emit('location_updated', {
        userId,
        location: data,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
};
