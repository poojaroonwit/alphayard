import { prisma } from '../lib/prisma';
import storageService from './storageService';
import entityService from './EntityService';
import { getBoundaryApplicationId } from '../utils/appHelper';
import { Prisma } from '../../prisma/generated/prisma/client';

export class ChatService {
  /**
   * Upload file attachment for chat
   */
  async uploadAttachment(file: any, messageId: string, userId: string) {
    try {
      // Use the native storage service
      const uploadedFile = await storageService.uploadFile(file, userId);

      // Save attachment record to database using Prisma $queryRaw (message_attachments not in Prisma schema)
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO message_attachments (message_id, file_name, file_url, file_type, file_size, mime_type, metadata)
        VALUES (${messageId}::uuid, ${(uploadedFile as any).original_name}, ${(uploadedFile as any).url}, 
                ${this.getFileType((uploadedFile as any).mime_type)}, ${(uploadedFile as any).size}, 
                ${(uploadedFile as any).mime_type}, ${JSON.stringify({
                  uploaded_by: userId,
                  uploaded_at: new Date().toISOString(),
                  storage_file_id: uploadedFile.id
                })}::jsonb)
        RETURNING *
      `;

      return result[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get file type from MIME type
   */
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    return 'file';
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string, userId: string) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT * FROM message_attachments WHERE id = ${attachmentId}::uuid
      `;
      const attachment = result[0];

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      const storageFileId = attachment.metadata?.storage_file_id;
      if (storageFileId) {
        await storageService.deleteFile(storageFileId, userId);
      }

      await prisma.$executeRaw`
        DELETE FROM message_attachments WHERE id = ${attachmentId}::uuid
      `;

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(attachmentId: string) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT * FROM message_attachments WHERE id = ${attachmentId}::uuid
      `;

      if (result.length === 0) {
        throw new Error('Attachment not found');
      }

      return result[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create default circle chat room
   */
  async createDefaultcircleChat(circleId: string, createdBy: string) {
    try {
      return await entityService.createEntity({
        typeName: 'chat_room',
        ownerId: createdBy,
        applicationId: circleId,
        attributes: {
          name: 'circle Chat',
          description: 'Default circle chat room',
          type: 'circle',
          settings: {
            allowFileSharing: true,
            allowLocationSharing: true,
            allowVoiceMessages: true,
            allowEmojis: true,
            allowStickers: true,
            allowGifs: true
          }
        }
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get chat statistics
   * Optimized: Uses single JOIN query instead of N+1 pattern
   */
  async getChatStats(circleId: string) {
    try {
      // Get Bondary application ID (cached via Redis)
      const applicationId = await getBoundaryApplicationId();

      console.log('[ChatService] Querying chat rooms - applicationId:', applicationId, 'circleId:', circleId);
      
      // Query chat rooms filtered by applicationId and circleId
      const result = await entityService.queryEntities('chat_room', {
        applicationId,
        filters: {
          circleId: circleId
        },
        status: 'active'
      } as any);
      
      console.log('[ChatService] Query result - total:', result.total, 'entities:', result.entities.length);

      const chats = result.entities;
      
      if (chats.length === 0) {
        return [];
      }

      // Get all chat IDs
      const chatIds = chats.map(chat => chat.id);

      // OPTIMIZED: Single query to get message stats for ALL chats at once
      // Instead of N separate queries (N+1 pattern)
      const messageStats = await prisma.$queryRaw<Array<{
        room_id: string;
        message_count: bigint;
        last_message_at: Date | null;
      }>>`
        SELECT 
          room_id,
          COUNT(*) as message_count, 
          MAX(created_at) as last_message_at 
        FROM bondarys.chat_messages 
        WHERE room_id = ANY(${chatIds}::uuid[])
        GROUP BY room_id
      `;

      // Create a map for quick lookup
      const statsMap = new Map(
        messageStats.map(row => [row.room_id, row])
      );

      // Build final stats array
      const stats = chats.map(chat => {
        const msgStats = statsMap.get(chat.id);
        return {
          id: chat.id,
          name: chat.attributes?.name || 'Unnamed Chat',
          type: chat.attributes?.type || 'general',
          createdAt: chat.createdAt,
          messageCount: msgStats ? Number(msgStats.message_count) : 0,
          lastMessageAt: msgStats?.last_message_at || null
        };
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search messages in chat
   */
  async searchMessages(chatId: string, query: string, userId: string) {
    try {
      // First check if user is participant using Prisma
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          roomId: chatId,
          userId: userId
        }
      });

      if (!participant) {
        throw new Error('Access denied: Not a participant in this chat');
      }

      // Search messages using $queryRaw for complex JOIN query
      const rows = await prisma.$queryRaw<Array<{
        id: string;
        room_id: string;
        sender_id: string;
        content: string | null;
        message_type: string;
        metadata: Prisma.JsonValue;
        created_at: Date;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
      }>>`
        SELECT m.*, 
               u.id as sender_id, u.first_name, u.last_name, u.avatar_url
        FROM bondarys.chat_messages m
        LEFT JOIN core.users u ON m.sender_id = u.id
        WHERE m.room_id = ${chatId}::uuid
          AND m.content ILIKE ${`%${query}%`}
          AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC
        LIMIT 50
      `;

      return rows.map(m => ({
        ...m,
        sender: {
          id: m.sender_id,
          first_name: m.first_name,
          last_name: m.last_name,
          avatar_url: m.avatar_url
        }
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Room Management - Legacy methods
   */
  async findChatRoomById(id: string) {
    return entityService.getEntity(id);
  }

  async isParticipant(chatId: string, userId: string): Promise<boolean> {
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId: chatId,
        userId: userId
      }
    });
    return !!participant;
  }

  async isAdmin(chatId: string, userId: string): Promise<boolean> {
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId: chatId,
        userId: userId,
        role: 'admin'
      }
    });
    return !!participant;
  }

  async markMessagesRead(chatId: string, userId: string, lastReadMessageId?: string) {
    await prisma.chatParticipant.updateMany({
      where: {
        roomId: chatId,
        userId: userId
      },
      data: {
        lastReadAt: new Date()
      }
    });
    return true;
  }

  /**
   * Message Management
   */
  async createMessage(data: any) {
    const message = await prisma.chatMessage.create({
      data: {
        roomId: data.room_id,
        senderId: data.sender_id,
        content: data.content,
        messageType: data.type || 'text',
        metadata: data.metadata || {},
        replyToId: data.reply_to_id
      }
    });
    return message;
  }

  async findMessageById(id: string) {
    const message = await prisma.chatMessage.findUnique({
      where: { id }
    });
    return message;
  }

  async updateMessage(id: string, data: any) {
    // First get the current message to merge metadata
    const currentMessage = await prisma.chatMessage.findUnique({
      where: { id }
    });

    if (!currentMessage) {
      throw new Error('Message not found');
    }

    const message = await prisma.chatMessage.update({
      where: { id },
      data: {
        content: data.content,
        editedAt: data.edited_at,
        metadata: {
          ...(currentMessage.metadata as object || {}),
          ...(data.metadata || {})
        }
      }
    });
    return message;
  }

  async deleteMessage(id: string) {
    try {
      await prisma.chatMessage.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });
      return true;
    } catch (error: any) {
      // Handle case where message doesn't exist (P2025)
      if (error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  async getMessageReactions(messageId: string) {
    const reactions = await prisma.$queryRaw<Array<{
      emoji: string;
      count: bigint;
      user_ids: string[];
    }>>`
      SELECT emoji, count(*)::bigint as count, array_agg(user_id) as user_ids 
      FROM bondarys.chat_reactions 
      WHERE message_id = ${messageId}::uuid 
      GROUP BY emoji
    `;
    return reactions.map(r => ({
      emoji: r.emoji,
      count: Number(r.count),
      user_ids: r.user_ids
    }));
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    try {
      await prisma.chatReaction.create({
        data: {
          messageId,
          userId,
          emoji
        }
      });
      return true;
    } catch (error: any) {
      // Handle unique constraint violation (already reacted)
      if (error.code === 'P2002') {
        return false;
      }
      return false;
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const result = await prisma.chatReaction.deleteMany({
      where: {
        messageId,
        userId,
        emoji
      }
    });
    return result.count > 0;
  }
}

export default new ChatService();
