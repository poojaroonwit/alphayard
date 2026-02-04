import { pool } from '../config/database';
import storageService from './storageService';
import entityService from './EntityService';

export class ChatService {
  /**
   * Upload file attachment for chat
   */
  async uploadAttachment(file: any, messageId: string, userId: string) {
    try {
      // Use the native storage service
      const uploadedFile = await storageService.uploadFile(file, userId);

      // Save attachment record to database using native pg pool
      const { rows } = await pool.query(
        `INSERT INTO message_attachments (message_id, file_name, file_url, file_type, file_size, mime_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          messageId,
          (uploadedFile as any).original_name,
          (uploadedFile as any).url,
          this.getFileType((uploadedFile as any).mime_type),
          (uploadedFile as any).size,
          (uploadedFile as any).mime_type,
          JSON.stringify({
            uploaded_by: userId,
            uploaded_at: new Date().toISOString(),
            storage_file_id: uploadedFile.id
          })
        ]
      );

      return rows[0];
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
      const { rows } = await pool.query(
        'SELECT * FROM message_attachments WHERE id = $1',
        [attachmentId]
      );
      const attachment = rows[0];

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      const storageFileId = attachment.metadata?.storage_file_id;
      if (storageFileId) {
        await storageService.deleteFile(storageFileId, userId);
      }

      await pool.query(
        'DELETE FROM message_attachments WHERE id = $1',
        [attachmentId]
      );

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
      const { rows } = await pool.query(
        'SELECT * FROM message_attachments WHERE id = $1',
        [attachmentId]
      );

      if (rows.length === 0) {
        throw new Error('Attachment not found');
      }

      return rows[0];
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
   */
  async getChatStats(circleId: string) {
    try {
      const result = await entityService.queryEntities('chat_room', {
        applicationId: circleId,
        status: 'active'
      } as any);

      const chats = result.entities;
      const stats = [];

      for (const chat of chats) {
        const { rows } = await pool.query(
          `SELECT count(*) as message_count, max(created_at) as last_message_at 
           FROM chat_messages WHERE room_id = $1`,
          [chat.id]
        );
        
        stats.push({
          id: chat.id,
          name: chat.attributes.name,
          type: chat.attributes.type,
          createdAt: chat.createdAt,
          messageCount: parseInt(rows[0].message_count, 10) || 0,
          lastMessageAt: rows[0].last_message_at
        });
      }

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
      // First check if user is participant using native pg pool
      const participantResult = await pool.query(
        'SELECT id FROM chat_participants WHERE chat_room_id = $1 AND user_id = $2',
        [chatId, userId]
      );

      if (participantResult.rows.length === 0) {
        throw new Error('Access denied: Not a participant in this chat');
      }

      // Search messages
      const { rows } = await pool.query(
        `SELECT m.*, 
                u.id as sender_id, u.first_name, u.last_name, u.avatar_url
         FROM chat_messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.room_id = $1 
           AND m.content ILIKE $2
           AND m.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT 50`,
        [chatId, `%${query}%`]
      );

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
    const { rows } = await pool.query(
      'SELECT 1 FROM chat_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatId, userId]
    );
    return rows.length > 0;
  }

  async isAdmin(chatId: string, userId: string): Promise<boolean> {
    const { rows } = await pool.query(
      "SELECT 1 FROM chat_participants WHERE chat_room_id = $1 AND user_id = $2 AND role = 'admin'",
      [chatId, userId]
    );
    return rows.length > 0;
  }

  async markMessagesRead(chatId: string, userId: string, lastReadMessageId?: string) {
    await pool.query(
      `UPDATE chat_participants 
       SET last_read_at = $1 
       WHERE chat_room_id = $2 AND user_id = $3`,
      [new Date().toISOString(), chatId, userId]
    );
    return true;
  }

  /**
   * Message Management
   */
  async createMessage(data: any) {
    const { rows } = await pool.query(
      `INSERT INTO chat_messages (room_id, sender_id, content, type, metadata, reply_to_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.room_id, data.sender_id, data.content, data.type || 'text', JSON.stringify(data.metadata || {}), data.reply_to_id]
    );
    return rows[0];
  }

  async findMessageById(id: string) {
    const { rows } = await pool.query('SELECT * FROM chat_messages WHERE id = $1', [id]);
    return rows[0];
  }

  async updateMessage(id: string, data: any) {
    const { rows } = await pool.query(
      'UPDATE chat_messages SET content = $1, edited_at = $2, metadata = metadata || $3 WHERE id = $4 RETURNING *',
      [data.content, data.edited_at, JSON.stringify(data.metadata || {}), id]
    );
    return rows[0];
  }

  async deleteMessage(id: string) {
    const { rowCount } = await pool.query(
      "UPDATE chat_messages SET deleted_at = NOW(), status = 'deleted' WHERE id = $1",
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async getMessageReactions(messageId: string) {
    const { rows } = await pool.query(
      'SELECT emoji, count(*) as count, array_agg(user_id) as user_ids FROM chat_message_reactions WHERE message_id = $1 GROUP BY emoji',
      [messageId]
    );
    return rows;
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    try {
      await pool.query(
        'INSERT INTO chat_message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [messageId, userId, emoji]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const { rowCount } = await pool.query(
      'DELETE FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );
    return (rowCount ?? 0) > 0;
  }
}

export default new ChatService();

