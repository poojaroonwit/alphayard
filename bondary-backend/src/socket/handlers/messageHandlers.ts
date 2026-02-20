import { Server, Socket } from 'socket.io';
import chatService from '../../services/chatService';
import { messageRateLimiter } from '../../middleware/chatRateLimiter';

export const handleSendMessage = (io: Server, socket: Socket & { userId?: string }) => async (data: {
    chatId: string;
    content: string;
    type?: string;
    metadata?: Record<string, any>;
    replyTo?: string;
    messageId?: string; // For retry logic
}) => {
    try {
        // Rate limiting
        const rateLimitResult = messageRateLimiter.check(socket.id, 'send-message');
        if (!rateLimitResult.allowed) {
            socket.emit('message-error', {
                error: 'Rate limit exceeded',
                message: 'Too many messages. Please slow down.',
                resetTime: rateLimitResult.resetTime,
                retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
            });
            return;
        }

        if (!socket.userId) {
            socket.emit('message-error', {
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const { chatId, content, type = 'text', metadata = {}, replyTo } = data;

        if (!chatId || (!content && type === 'text')) {
            socket.emit('message-error', {
                error: 'Invalid message data',
                message: 'Chat ID and content are required',
            });
            return;
        }

        const chat = await chatService.findChatRoomById(chatId);
        if (!chat) {
            socket.emit('message-error', {
                error: 'Chat room not found',
                message: 'The requested chat room does not exist',
            });
            return;
        }

        const isParticipant = await chatService.isParticipant(chatId, socket.userId);
        if (!isParticipant) {
            socket.emit('message-error', {
                error: 'Access denied',
                message: 'You are not a participant in this chat room',
            });
            return;
        }

        // Create the message with retry logic
        let message = null;
        let retries = 0;
        const maxRetries = 3;

        while (!message && retries < maxRetries) {
            try {
                message = await chatService.createMessage({
                    room_id: chatId,
                    sender_id: socket.userId,
                    content,
                    type,
                    metadata: {
                        ...metadata,
                        retryAttempt: retries,
                        originalMessageId: data.messageId,
                    },
                    reply_to_id: replyTo,
                });

                if (message) {
                    break;
                }
            } catch (error) {
                retries += 1;
                if (retries >= maxRetries) {
                    console.error('Failed to create message after retries:', error);
                    socket.emit('message-error', {
                        error: 'Internal server error',
                        message: 'Failed to create message after multiple attempts',
                        retryable: true,
                        messageId: data.messageId,
                    });
                    return;
                }
                // Wait before retry (exponential backoff)
                await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
            }
        }

        if (!message) {
            socket.emit('message-error', {
                error: 'Internal server error',
                message: 'Failed to create message',
                retryable: true,
                messageId: data.messageId,
            });
            return;
        }

        // Get reactions for the message
        const reactions = await chatService.getMessageReactions(message.id);

        // Emit to all users in the chat
        io.to(`chat:${chatId}`).emit('new-message', {
            message: {
                id: message.id,
                chatRoomId: message.roomId,
                senderId: message.senderId,
                content: message.content,
                type: message.messageType,
                metadata: message.metadata,
                replyTo: message.replyToId,
                editedAt: message.editedAt,
                deletedAt: message.deletedAt,
                isPinned: false,
                reactions,
                createdAt: message.createdAt,
                updatedAt: message.createdAt,
            },
        });
    } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message-error', {
            error: 'Internal server error',
            message: 'Failed to send message',
        });
    }
};

export const handleUpdateMessage = (io: Server, socket: Socket & { userId?: string }) => async (data: {
    messageId: string;
    content: string;
}) => {
    try {
        if (!socket.userId) {
            socket.emit('message-update-error', {
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const { messageId, content } = data;

        if (!messageId || !content) {
            socket.emit('message-update-error', {
                error: 'Invalid update data',
                message: 'Message ID and content are required',
            });
            return;
        }

        const message = await chatService.findMessageById(messageId);
        if (!message) {
            socket.emit('message-update-error', {
                error: 'Message not found',
                message: 'The requested message does not exist',
            });
            return;
        }

        if (message.senderId !== socket.userId) {
            socket.emit('message-update-error', {
                error: 'Access denied',
                message: 'You can only edit your own messages',
            });
            return;
        }

        const updatedMessage = await chatService.updateMessage(messageId, {
            content,
            edited_at: new Date().toISOString(),
        });

        if (!updatedMessage) {
            socket.emit('message-update-error', {
                error: 'Internal server error',
                message: 'Failed to update message',
            });
            return;
        }

        // Get reactions
        const reactions = await chatService.getMessageReactions(updatedMessage.id);

        // Emit to all users in the chat
        io.to(`chat:${updatedMessage.roomId}`).emit('message-updated', {
            message: {
                id: updatedMessage.id,
                chatRoomId: updatedMessage.roomId,
                senderId: updatedMessage.senderId,
                content: updatedMessage.content,
                type: updatedMessage.messageType,
                metadata: updatedMessage.metadata,
                replyTo: updatedMessage.replyToId,
                editedAt: updatedMessage.editedAt,
                deletedAt: updatedMessage.deletedAt,
                isPinned: false,
                reactions,
                createdAt: updatedMessage.createdAt,
                updatedAt: updatedMessage.editedAt || updatedMessage.createdAt,
            },
        });
    } catch (error) {
        console.error('Update message error:', error);
        socket.emit('message-update-error', {
            error: 'Internal server error',
            message: 'Failed to update message',
        });
    }
};

export const handleDeleteMessage = (io: Server, socket: Socket & { userId?: string }) => async (data: { messageId: string }) => {
    try {
        if (!socket.userId) {
            socket.emit('message-delete-error', {
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const { messageId } = data;

        if (!messageId) {
            socket.emit('message-delete-error', {
                error: 'Invalid delete data',
                message: 'Message ID is required',
            });
            return;
        }

        const message = await chatService.findMessageById(messageId);
        if (!message) {
            socket.emit('message-delete-error', {
                error: 'Message not found',
                message: 'The requested message does not exist',
            });
            return;
        }

        const chat = await chatService.findChatRoomById(message.roomId);
        const isSender = message.senderId === socket.userId;
        const isAdmin = chat
            ? await chatService.isAdmin(message.roomId, socket.userId)
            : false;

        if (!isSender && !isAdmin) {
            socket.emit('message-delete-error', {
                error: 'Access denied',
                message: 'You can only delete your own messages or be an admin',
            });
            return;
        }

        const deleted = await chatService.deleteMessage(messageId);
        if (!deleted) {
            socket.emit('message-delete-error', {
                error: 'Internal server error',
                message: 'Failed to delete message',
            });
            return;
        }

        // Emit to all users in the chat
        io.to(`chat:${message.roomId}`).emit('message-deleted', {
            messageId: message.id,
            chatRoomId: message.roomId,
            deletedBy: socket.userId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('message-delete-error', {
            error: 'Internal server error',
            message: 'Failed to delete message',
        });
    }
};

export const handleMarkMessagesRead = (io: Server, socket: Socket & { userId?: string }) => async (data: {
    chatId: string;
    lastReadMessageId?: string;
}) => {
    try {
        if (!socket.userId) {
            socket.emit('mark-read-error', {
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const { chatId, lastReadMessageId } = data;

        if (!chatId) {
            socket.emit('mark-read-error', {
                error: 'Invalid data',
                message: 'Chat ID is required',
            });
            return;
        }

        const chat = await chatService.findChatRoomById(chatId);
        if (!chat) {
            socket.emit('mark-read-error', {
                error: 'Chat room not found',
                message: 'The requested chat room does not exist',
            });
            return;
        }

        const isParticipant = await chatService.isParticipant(chatId, socket.userId);
        if (!isParticipant) {
            socket.emit('mark-read-error', {
                error: 'Access denied',
                message: 'You are not a participant in this chat room',
            });
            return;
        }

        // Mark messages as read
        await chatService.markMessagesRead(chatId, socket.userId);

        socket.emit('messages-marked-read', {
            chatId,
            userId: socket.userId,
            lastReadMessageId,
            timestamp: new Date().toISOString(),
        });

        // Notify other participants that messages were read
        socket.to(`chat:${chatId}`).emit('user-read-messages', {
            chatId,
            userId: socket.userId,
            lastReadMessageId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Mark messages read error:', error);
        socket.emit('mark-read-error', {
            error: 'Internal server error',
            message: 'Failed to mark messages as read',
        });
    }
};
