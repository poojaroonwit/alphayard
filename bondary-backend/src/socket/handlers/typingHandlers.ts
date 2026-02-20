import { Server, Socket } from 'socket.io';
import { typingRateLimiter } from '../../middleware/chatRateLimiter';

export const handleTyping = (io: Server, socket: Socket & { userId?: string }) => (data: { chatId: string; isTyping: boolean }) => {
    // Rate limiting for typing events
    const rateLimitResult = typingRateLimiter.check(socket.id, 'typing');
    if (!rateLimitResult.allowed) {
        // Silently ignore excessive typing events
        return;
    }

    const { chatId } = data;
    if (chatId && socket.userId) {
        socket.to(`chat:${chatId}`).emit('user-typing', {
            userId: socket.userId,
            chatId,
            isTyping: data.isTyping,
            timestamp: new Date().toISOString(),
        });
    }
};

export const handleStopTyping = (io: Server, socket: Socket & { userId?: string }) => (data: { chatId: string }) => {
    const { chatId } = data;
    if (chatId && socket.userId) {
        socket.to(`chat:${chatId}`).emit('user-stopped-typing', {
            userId: socket.userId,
            chatId,
            timestamp: new Date().toISOString(),
        });
    }
};
