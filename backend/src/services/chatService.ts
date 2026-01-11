import { pool } from '../config/database';
import { storageService } from './storageService';

export class ChatService {
  /**
   * Upload file attachment for chat
   */
  static async uploadAttachment(file: any, messageId: string, userId: string) {
    try {
      // Use the native storage service instead of Supabase
      const uploadedFile = await storageService.uploadFile(file, userId);

      // Save attachment record to database using native pg pool
      const { rows } = await pool.query(
        `INSERT INTO message_attachments (message_id, file_name, file_url, file_type, file_size, mime_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          messageId,
          uploadedFile.originalName,
          uploadedFile.url,
          this.getFileType(uploadedFile.mimeType),
          uploadedFile.size,
          uploadedFile.mimeType,
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
  private static getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    return 'file';
  }

  /**
   * Delete attachment
   */
  static async deleteAttachment(attachmentId: string, userId: string) {
    try {
      // Get attachment details using native pg pool
      const { rows } = await pool.query(
        'SELECT * FROM message_attachments WHERE id = $1',
        [attachmentId]
      );
      const attachment = rows[0];

      if (!attachment) {
        throw new Error('Attachment not found');
      }

      // Delete from storage using storageService if we have a file ID
      const storageFileId = attachment.metadata?.storage_file_id;
      if (storageFileId) {
        await storageService.deleteFile(storageFileId, userId);
      }

      // Delete from database
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
  static async getAttachment(attachmentId: string) {
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
   * Create default hourse chat room
   */
  static async createDefaultFamilyChat(familyId: string, createdBy: string) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO chat_rooms (family_id, name, type, description, created_by, settings, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          familyId,
          'hourse Chat',
          'hourse',
          'Default hourse chat room',
          createdBy,
          JSON.stringify({
            allowFileSharing: true,
            allowLocationSharing: true,
            allowVoiceMessages: true,
            allowEmojis: true,
            allowStickers: true,
            allowGifs: true
          }),
          true
        ]
      );

      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  static async getChatStats(familyId: string) {
    try {
      const { rows } = await pool.query(
        `SELECT 
           cr.id, cr.name, cr.type, cr.created_at,
           (SELECT count(*) FROM messages m WHERE m.chat_room_id = cr.id) as message_count,
           (SELECT max(created_at) FROM messages m WHERE m.chat_room_id = cr.id) as last_message_at
         FROM chat_rooms cr
         WHERE cr.family_id = $1 AND cr.is_active = true`,
        [familyId]
      );

      return rows.map(chat => ({
        id: chat.id,
        name: chat.name,
        type: chat.type,
        createdAt: chat.created_at,
        messageCount: parseInt(chat.message_count, 10) || 0,
        lastMessageAt: chat.last_message_at
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search messages in chat
   */
  static async searchMessages(chatId: string, query: string, userId: string) {
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
         FROM messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.chat_room_id = $1 
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
   * Mark messages as read
   */
  static async markMessagesAsRead(chatId: string, userId: string, lastReadMessageId?: string) {
    try {
      await pool.query(
        `UPDATE chat_participants 
         SET last_read_at = $1 
         WHERE chat_room_id = $2 AND user_id = $3`,
        [new Date().toISOString(), chatId, userId]
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get unread message count for user
   */
  static async getUnreadCount(userId: string) {
    try {
      const { rows } = await pool.query(
        `SELECT 
           cp.chat_room_id,
           cp.last_read_at,
           cr.name as chat_room_name,
           (SELECT count(*) FROM messages m 
            WHERE m.chat_room_id = cp.chat_room_id 
              AND m.sender_id != $1
              AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
           ) as unread_count
         FROM chat_participants cp
         JOIN chat_rooms cr ON cp.chat_room_id = cr.id
         WHERE cp.user_id = $1 AND cp.is_archived = false`,
        [userId]
      );

      let totalUnread = 0;
      const chatUnreadCounts: any = {};

      rows.forEach((row: any) => {
        const count = parseInt(row.unread_count, 10) || 0;
        totalUnread += count;
        chatUnreadCounts[row.chat_room_id] = count;
      });

      return {
        totalUnread,
        chatUnreadCounts
      };
    } catch (error) {
      throw error;
    }
  }
}
