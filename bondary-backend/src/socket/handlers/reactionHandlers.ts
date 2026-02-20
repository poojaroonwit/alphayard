import { Server, Socket } from 'socket.io';
import chatService from '../../services/chatService';
import { reactionRateLimiter } from '../../middleware/chatRateLimiter';

export const handleAddReaction = (io: Server, socket: Socket & { userId?: string }) => async (data: {
    messageId: string;
    emoji: string;
}) => {
    try {
        // Rate limiting
        const rateLimitResult = reactionRateLimiter.check(socket.id, 'add-reaction');
        if (!rateLimitResult.allowed) {
            socket.emit('reaction-error', {
                error: 'Rate limit exceeded',
                message: 'Too many reactions. Please slow down.',
                resetTime: rateLimitResult.resetTime,
            });
            return;
        }

        if (!socket.userId) {
            socket.emit('reaction-error', {
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const { messageId, emoji } = data;

        if (!messageId || !emoji) {
            socket.emit('reaction-error', {
                error: 'Invalid reaction data',
                message: 'Message ID and emoji are required',
            });
            return;
        }

        const message = await chatService.findMessageById(messageId);
        if (!message) {
            socket.emit('reaction-error', {
                error: 'Message not found',
                message: 'The requested message does not exist',
            });
            return;
        }

        const chat = await chatService.findChatRoomById(message.roomId);
        if (!chat) {
            socket.emit('reaction-error', {
                error: 'Chat room not found',
                message: 'The chat room for this message does not exist',
            });
            return;
        }

        const isParticipant = await chatService.isParticipant(
            message.roomId,
            socket.userId
        );
        if (!isParticipant) {
            socket.emit('reaction-error', {
                error: 'Access denied',
                message: 'You are not a participant in this chat room',
            });
            return;
        }

        const success = await chatService.addReaction(messageId, socket.userId, emoji);
        if (!success) {
            socket.emit('reaction-error', {
                error: 'Internal server error',
                message: 'Failed to add reaction',
            });
            return;
        }

        // Get updated reactions
        const reactions = await chatService.getMessageReactions(messageId);

        // Emit to all users in the chat
        io.to(`chat:${message.roomId}`).emit('reaction-added', {
            messageId: message.id,
            chatRoomId: message.roomId,
            userId: socket.userId,
            emoji,
            reactions,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Add reaction error:', error);
        socket.emit('reaction-error', {
            error: 'Internal server error',
            message: 'Failed to add reaction',
        });
    }
};

export const handleRemoveReaction = (io: Server, socket: Socket & { userId?: string }) => async (data: {
    messageId: string;
    emoji: string;
}) => {
    try {
        if (!socket.userId) {
            socket.emit('reaction-error', {
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const { messageId, emoji } = data;

        if (!messageId || !emoji) {
            socket.emit('reaction-error', {
                error: 'Invalid reaction data',
                message: 'Message ID and emoji are required',
            });
            return;
        }

        const message = await chatService.findMessageById(messageId);
        if (!message) {
            socket.emit('reaction-error', {
                error: 'Message not found',
                message: 'The requested message does not exist',
            });
            return;
        }

        const chat = await chatService.findChatRoomById(message.roomId);
        if (!chat) {
            socket.emit('reaction-error', {
                error: 'Chat room not found',
                message: 'The chat room for this message does not exist',
            });
            return;
        }

        const isParticipant = await chatService.isParticipant(
            message.roomId,
            socket.userId
        );
        if (!isParticipant) {
            socket.emit('reaction-error', {
                error: 'Access denied',
                message: 'You are not a participant in this chat room',
            });
            return;
        }

        const success = await chatService.removeReaction(messageId, socket.userId, emoji);
        if (!success) {
            socket.emit('reaction-error', {
                error: 'Internal server error',
                message: 'Failed to remove reaction',
            });
            return;
        }

        // Get updated reactions
        const reactions = await chatService.getMessageReactions(messageId);

        // Emit to all users in the chat
        io.to(`chat:${message.roomId}`).emit('reaction-removed', {
            messageId: message.id,
            chatRoomId: message.roomId,
            userId: socket.userId,
            emoji,
            reactions,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Remove reaction error:', error);
        socket.emit('reaction-error', {
            error: 'Internal server error',
            message: 'Failed to remove reaction',
        });
    }
};
