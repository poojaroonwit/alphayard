import { Response } from 'express';
import { ChatDatabaseService } from '../services/chatDatabaseService';

// Use the ChatDatabaseService for database operations
const { Chat, Message } = ChatDatabaseService;

export class ChatController {
  /**
   * Get all chat rooms for a hourse
   */
  static async getChatRooms(req: any, res: Response) {
    try {
      const { familyId } = req.params;
      const userId = req.user?.id;

      if (!familyId) {
        return res.status(400).json({
          error: 'hourse ID is required',
          message: 'Please provide a valid hourse ID'
        });
      }

      // Get all chat rooms for the hourse
      const chatRooms = await Chat.findByFamilyId(familyId);

      // Filter to only show rooms the user is a participant in
      const userChatRooms = [];
      for (const chat of chatRooms) {
        const isParticipant = await chat.isParticipant(userId);
        if (isParticipant) {
          const participants = await chat.getParticipants();
          userChatRooms.push({
            ...chat.toJSON(),
            participants: participants.map((p: any) => ({
              id: p.user_id,
              role: p.role,
              joinedAt: p.joined_at,
              lastReadAt: p.last_read_at,
              isMuted: p.is_muted,
              isArchived: p.is_archived,
              user: p.users
            }))
          });
        }
      }

      res.json({
        success: true,
        data: userChatRooms
      });
    } catch (error: any) {
      console.error('Get chat rooms error:', error);
      try {
        require('fs').appendFileSync('debug_chat_error.log', new Date().toISOString() + ' GetChatRooms Error: ' + (error.message || error) + '\nStack: ' + error.stack + '\n');
      } catch (e) { }
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve chat rooms'
      });
    }
  }

  /**
   * Create a new chat room
   */
  static async createChatRoom(req: any, res: Response) {
    try {
      const { familyId } = req.params;
      const { name, type = 'group', description, avatarUrl, settings = {} } = req.body;
      const userId = req.user?.id;

      if (!familyId) {
        return res.status(400).json({
          error: 'hourse ID is required',
          message: 'Please provide a valid hourse ID'
        });
      }

      if (!name) {
        return res.status(400).json({
          error: 'Chat name is required',
          message: 'Please provide a name for the chat room'
        });
      }

      // Create the chat room
      const chatRoom = await Chat.create({
        familyId,
        name,
        type,
        description,
        avatarUrl,
        createdBy: userId,
        settings
      });

      // Add the creator as an admin participant
      await Chat.addParticipant(chatRoom.id, userId, 'admin');

      // Get participants for response
      const participants = await chatRoom.getParticipants();

      res.status(201).json({
        success: true,
        data: {
          ...chatRoom.toJSON(),
          participants: participants.map((p: any) => ({
            id: p.user_id,
            role: p.role,
            joinedAt: p.joined_at,
            lastReadAt: p.last_read_at,
            isMuted: p.is_muted,
            isArchived: p.is_archived,
            user: p.users
          }))
        }
      });
    } catch (error: any) {
      console.error('Create chat room error:', error);
      try {
        require('fs').appendFileSync('debug_chat_error.log', new Date().toISOString() + ' CreateChatRoom Error: ' + (error.message || error) + '\nStack: ' + error.stack + '\n');
      } catch (e) { }
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create chat room'
      });
    }
  }

  /**
   * Get chat room details
   */
  static async getChatRoom(req: any, res: Response) {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;

      if (!chatId) {
        return res.status(400).json({
          error: 'Chat ID is required',
          message: 'Please provide a valid chat ID'
        });
      }

      const chatRoom = await Chat.findById(chatId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The requested chat room does not exist'
        });
      }

      // Check if user is a participant
      const isParticipant = await chatRoom.isParticipant(userId);
      if (!isParticipant) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You are not a participant in this chat room'
        });
      }

      // Get participants
      const participants = await chatRoom.getParticipants();

      res.json({
        success: true,
        data: {
          ...chatRoom.toJSON(),
          participants: participants.map((p: any) => ({
            id: p.user_id,
            role: p.role,
            joinedAt: p.joined_at,
            lastReadAt: p.last_read_at,
            isMuted: p.is_muted,
            isArchived: p.is_archived,
            user: p.users
          }))
        }
      });
    } catch (error) {
      console.error('Get chat room error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve chat room'
      });
    }
  }

  /**
   * Update chat room
   */
  static async updateChatRoom(req: any, res: Response) {
    try {
      const { chatId } = req.params;
      const { name, description, avatarUrl, settings } = req.body;
      const userId = req.user?.id;

      if (!chatId) {
        return res.status(400).json({
          error: 'Chat ID is required',
          message: 'Please provide a valid chat ID'
        });
      }

      const chatRoom = await Chat.findById(chatId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The requested chat room does not exist'
        });
      }

      // Check if user is admin
      const isAdmin = await chatRoom.isAdmin(userId);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only admins can update chat room settings'
        });
      }

      // Update the chat room
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
      if (settings !== undefined) updates.settings = { ...chatRoom.settings, ...settings };

      await chatRoom.update(updates);

      res.json({
        success: true,
        data: chatRoom.toJSON()
      });
    } catch (error) {
      console.error('Update chat room error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update chat room'
      });
    }
  }

  /**
   * Delete chat room
   */
  static async deleteChatRoom(req: any, res: Response) {
    try {
      const { chatId } = req.params;
      const userId = req.user?.id;

      if (!chatId) {
        return res.status(400).json({
          error: 'Chat ID is required',
          message: 'Please provide a valid chat ID'
        });
      }

      const chatRoom = await Chat.findById(chatId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The requested chat room does not exist'
        });
      }

      // Check if user is admin
      const isAdmin = await chatRoom.isAdmin(userId);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only admins can delete chat rooms'
        });
      }

      await chatRoom.delete();

      res.json({
        success: true,
        message: 'Chat room deleted successfully'
      });
    } catch (error) {
      console.error('Delete chat room error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete chat room'
      });
    }
  }

  /**
   * Add participant to chat room
   */
  static async addParticipant(req: any, res: Response) {
    try {
      const { chatId } = req.params;
      const { userId: newUserId, role = 'member' } = req.body;
      const currentUserId = req.user?.id;

      if (!chatId || !newUserId) {
        return res.status(400).json({
          error: 'Chat ID and User ID are required',
          message: 'Please provide valid chat ID and user ID'
        });
      }

      const chatRoom = await Chat.findById(chatId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The requested chat room does not exist'
        });
      }

      // Check if current user is admin
      const isAdmin = await chatRoom.isAdmin(currentUserId);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only admins can add participants'
        });
      }

      // Check if user is already a participant
      const isAlreadyParticipant = await chatRoom.isParticipant(newUserId);
      if (isAlreadyParticipant) {
        return res.status(400).json({
          error: 'User already in chat',
          message: 'This user is already a participant in the chat room'
        });
      }

      // Add the participant
      await Chat.addParticipant(chatId, newUserId, role);

      res.json({
        success: true,
        message: 'Participant added successfully'
      });
    } catch (error) {
      console.error('Add participant error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to add participant'
      });
    }
  }

  /**
   * Remove participant from chat room
   */
  static async removeParticipant(req: any, res: Response) {
    try {
      const { chatId, userId } = req.params;
      const currentUserId = req.user?.id;

      if (!chatId || !userId) {
        return res.status(400).json({
          error: 'Chat ID and User ID are required',
          message: 'Please provide valid chat ID and user ID'
        });
      }

      const chatRoom = await Chat.findById(chatId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The requested chat room does not exist'
        });
      }

      // Check if current user is admin or removing themselves
      const isAdmin = await chatRoom.isAdmin(currentUserId);
      const isRemovingSelf = currentUserId === userId;

      if (!isAdmin && !isRemovingSelf) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Only admins can remove other participants'
        });
      }

      // Remove the participant
      await Chat.removeParticipant(chatId, userId);

      res.json({
        success: true,
        message: 'Participant removed successfully'
      });
    } catch (error) {
      console.error('Remove participant error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to remove participant'
      });
    }
  }

  /**
   * Get messages for a chat room
   */
  static async getMessages(req: any, res: Response) {
    try {
      const { chatId } = req.params;
      const { limit = 50, offset = 0, before, after } = req.query;
      const userId = req.user?.id;

      if (!chatId) {
        return res.status(400).json({
          error: 'Chat ID is required',
          message: 'Please provide a valid chat ID'
        });
      }

      const chatRoom = await Chat.findById(chatId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The requested chat room does not exist'
        });
      }

      // Check if user is a participant
      const isParticipant = await chatRoom.isParticipant(userId);
      if (!isParticipant) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You are not a participant in this chat room'
        });
      }

      // Get messages
      const messages = await Message.findByChatRoomId(chatId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        before: before as string,
        after: after as string
      });

      res.json({
        success: true,
        data: messages.map((message: any) => ({
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          replyTo: message.replyTo,
          editedAt: message.editedAt,
          deletedAt: message.deletedAt,
          isPinned: message.isPinned,
          reactions: message.reactions,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          sender: message.sender,
          replyToMessage: message.replyToMessage,
          attachments: message.attachments || []
        }))
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve messages'
      });
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(req: any, res: Response) {
    try {
      const { chatId } = req.params;
      const { content, type = 'text', metadata = {}, replyTo } = req.body;
      const userId = req.user?.id;

      if (!chatId) {
        return res.status(400).json({
          error: 'Chat ID is required',
          message: 'Please provide a valid chat ID'
        });
      }

      if (!content && type === 'text') {
        return res.status(400).json({
          error: 'Message content is required',
          message: 'Please provide message content'
        });
      }

      const chatRoom = await Chat.findById(chatId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The requested chat room does not exist'
        });
      }

      // Check if user is a participant
      const isParticipant = await chatRoom.isParticipant(userId);
      if (!isParticipant) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You are not a participant in this chat room'
        });
      }

      // Create the message
      const message = await Message.create({
        chatRoomId: chatId,
        senderId: userId,
        content,
        type,
        metadata,
        replyTo
      });

      res.status(201).json({
        success: true,
        data: {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          replyTo: message.replyTo,
          editedAt: message.editedAt,
          deletedAt: message.deletedAt,
          isPinned: message.isPinned,
          reactions: message.reactions,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          sender: message.sender,
          replyToMessage: message.replyToMessage,
          attachments: message.attachments || []
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to send message'
      });
    }
  }

  /**
   * Update a message
   */
  static async updateMessage(req: any, res: Response) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user?.id;

      if (!messageId) {
        return res.status(400).json({
          error: 'Message ID is required',
          message: 'Please provide a valid message ID'
        });
      }

      if (!content) {
        return res.status(400).json({
          error: 'Message content is required',
          message: 'Please provide updated message content'
        });
      }

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
          message: 'The requested message does not exist'
        });
      }

      // Check if user is the sender
      if (message.senderId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only edit your own messages'
        });
      }

      // Update the message
      await message.update({ content });

      res.json({
        success: true,
        data: {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          replyTo: message.replyTo,
          editedAt: message.editedAt,
          deletedAt: message.deletedAt,
          isPinned: message.isPinned,
          reactions: message.reactions,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          sender: message.sender,
          replyToMessage: message.replyToMessage,
          attachments: message.attachments || []
        }
      });
    } catch (error) {
      console.error('Update message error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update message'
      });
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(req: any, res: Response) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      if (!messageId) {
        return res.status(400).json({
          error: 'Message ID is required',
          message: 'Please provide a valid message ID'
        });
      }

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
          message: 'The requested message does not exist'
        });
      }

      // Check if user is the sender or admin
      const chatRoom = await Chat.findById(message.chatRoomId);
      const isSender = message.senderId === userId;
      const isAdmin = chatRoom ? await chatRoom.isAdmin(userId) : false;

      if (!isSender && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only delete your own messages or be an admin'
        });
      }

      // Delete the message (soft delete)
      await message.delete();

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete message'
      });
    }
  }

  /**
   * Add reaction to message
   */
  static async addReaction(req: any, res: Response) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user?.id;

      if (!messageId || !emoji) {
        return res.status(400).json({
          error: 'Message ID and emoji are required',
          message: 'Please provide valid message ID and emoji'
        });
      }

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
          message: 'The requested message does not exist'
        });
      }

      // Check if user is a participant in the chat
      const chatRoom = await Chat.findById(message.chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The chat room for this message does not exist'
        });
      }

      const isParticipant = await chatRoom.isParticipant(userId);
      if (!isParticipant) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You are not a participant in this chat room'
        });
      }

      // Add the reaction
      await message.addReaction(userId, emoji);

      res.json({
        success: true,
        message: 'Reaction added successfully'
      });
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to add reaction'
      });
    }
  }

  /**
   * Remove reaction from message
   */
  static async removeReaction(req: any, res: Response) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user?.id;

      if (!messageId || !emoji) {
        return res.status(400).json({
          error: 'Message ID and emoji are required',
          message: 'Please provide valid message ID and emoji'
        });
      }

      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
          message: 'The requested message does not exist'
        });
      }

      // Check if user is a participant in the chat
      const chatRoom = await Chat.findById(message.chatRoomId);
      if (!chatRoom) {
        return res.status(404).json({
          error: 'Chat room not found',
          message: 'The chat room for this message does not exist'
        });
      }

      const isParticipant = await chatRoom.isParticipant(userId);
      if (!isParticipant) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You are not a participant in this chat room'
        });
      }

      // Remove the reaction
      await message.removeReaction(userId, emoji);

      res.json({
        success: true,
        message: 'Reaction removed successfully'
      });
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to remove reaction'
      });
    }
  }
}
