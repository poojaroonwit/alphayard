import { Server, Socket } from 'socket.io';
import chatService from '../../services/chatService';

export const handleJoinChat = (io: Server, socket: Socket & { userId?: string }) => async (chatId: string) => {
    try {
        if (!socket.userId) {
            socket.emit('chat-join-error', {
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        // Since we are using EntityService, we can just fetch the chat room entity
        const chat = await chatService.findChatRoomById(chatId);
        if (chat) {
            const isParticipant = await chatService.isParticipant(chatId, socket.userId);
            if (isParticipant) {
                socket.join(`chat:${chatId}`);
                socket.emit('chat-joined', { chatId });

                // Notify other participants that user joined
                socket.to(`chat:${chatId}`).emit('user-joined', {
                    chatId,
                    userId: socket.userId,
                    timestamp: new Date().toISOString(),
                });
            } else {
                socket.emit('chat-join-error', {
                    error: 'Access denied',
                    message: 'You are not a participant in this chat room',
                });
            }
        } else {
            socket.emit('chat-join-error', {
                error: 'Chat room not found',
                message: 'The requested chat room does not exist',
            });
        }
    } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('chat-join-error', {
            error: 'Internal server error',
            message: 'Failed to join chat room',
        });
    }
};

export const handleLeaveChat = (io: Server, socket: Socket & { userId?: string }) => async (chatId: string) => {
    try {
        socket.leave(`chat:${chatId}`);
        socket.emit('chat-left', { chatId });

        // Notify other participants that user left
        if (socket.userId) {
            socket.to(`chat:${chatId}`).emit('user-left', {
                chatId,
                userId: socket.userId,
                timestamp: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error('Leave chat error:', error);
    }
};

export const handleChatRoomUpdated = (io: Server, socket: Socket & { userId?: string }) => (data: { chatId: string }) => {
    const { chatId } = data;
    if (chatId && socket.userId) {
        socket.to(`chat:${chatId}`).emit('chat-room-changed', {
            chatId,
            updatedBy: socket.userId,
            timestamp: new Date().toISOString(),
        });
    }
};

export const handleParticipantAdded = (io: Server, socket: Socket & { userId?: string }) => (data: { chatId: string; addedUserId: string }) => {
    const { chatId, addedUserId } = data;
    if (chatId && addedUserId && socket.userId) {
        io.to(`chat:${chatId}`).emit('participant-joined', {
            chatId,
            addedUserId,
            addedBy: socket.userId,
            timestamp: new Date().toISOString(),
        });
    }
};

export const handleParticipantRemoved = (io: Server, socket: Socket & { userId?: string }) => (data: { chatId: string; removedUserId: string }) => {
    const { chatId, removedUserId } = data;
    if (chatId && removedUserId && socket.userId) {
        io.to(`chat:${chatId}`).emit('participant-left', {
            chatId,
            removedUserId,
            removedBy: socket.userId,
            timestamp: new Date().toISOString(),
        });
    }
};
