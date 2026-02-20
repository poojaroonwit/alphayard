import { prisma } from '../../lib/prisma';

export interface BookmarkedMessage {
  id: string;
  userId: string;
  messageId: string;
  note?: string;
  collectionName: string;
  createdAt: Date;
  message?: {
    id: string;
    content: string;
    messageType: string;
    senderName: string;
    chatRoomName: string;
    sentAt: Date;
  };
}

export class ChatBookmarksService {
  // Bookmark a message
  async bookmarkMessage(
    userId: string,
    messageId: string,
    note?: string,
    collectionName: string = 'Saved'
  ): Promise<BookmarkedMessage> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_bookmarked_messages (user_id, message_id, note, collection_name)
      VALUES (${userId}::uuid, ${messageId}::uuid, ${note}, ${collectionName})
      ON CONFLICT (user_id, message_id) 
      DO UPDATE SET note = COALESCE(${note}, chat_bookmarked_messages.note),
                    collection_name = ${collectionName}
      RETURNING *
    `;
    return this.mapBookmarkedMessage(result[0]);
  }

  // Remove a bookmark
  async removeBookmark(userId: string, messageId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_bookmarked_messages 
      WHERE user_id = ${userId}::uuid AND message_id = ${messageId}::uuid
    `;
    return result > 0;
  }

  // Check if message is bookmarked
  async isBookmarked(userId: string, messageId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM bondarys.chat_bookmarked_messages 
      WHERE user_id = ${userId}::uuid AND message_id = ${messageId}::uuid
    `;
    return result.length > 0;
  }

  // Get user's bookmarked messages
  async getBookmarks(
    userId: string,
    options: { collectionName?: string; limit?: number; offset?: number } = {}
  ): Promise<BookmarkedMessage[]> {
    const { collectionName, limit = 50, offset = 0 } = options;

    let result: any[];
    if (collectionName) {
      result = await prisma.$queryRaw<any[]>`
        SELECT bm.*, 
               m.content, m.message_type, m.created_at as message_sent_at,
               u.display_name as sender_name,
               e.data->>'name' as chat_room_name
        FROM bondarys.chat_bookmarked_messages bm
        JOIN bondarys.chat_messages m ON bm.message_id = m.id
        LEFT JOIN bondarys.users u ON m.sender_id = u.id
        LEFT JOIN bondarys.unified_entities e ON m.room_id = e.id
        WHERE bm.user_id = ${userId}::uuid AND bm.collection_name = ${collectionName}
        ORDER BY bm.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      result = await prisma.$queryRaw<any[]>`
        SELECT bm.*, 
               m.content, m.message_type, m.created_at as message_sent_at,
               u.display_name as sender_name,
               e.data->>'name' as chat_room_name
        FROM bondarys.chat_bookmarked_messages bm
        JOIN bondarys.chat_messages m ON bm.message_id = m.id
        LEFT JOIN bondarys.users u ON m.sender_id = u.id
        LEFT JOIN bondarys.unified_entities e ON m.room_id = e.id
        WHERE bm.user_id = ${userId}::uuid
        ORDER BY bm.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    }
    return result.map(row => this.mapBookmarkedMessageWithDetails(row));
  }

  // Get bookmark collections for a user
  async getCollections(userId: string): Promise<Array<{ name: string; count: number }>> {
    const result = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT collection_name as name, COUNT(*)::int as count
      FROM bondarys.chat_bookmarked_messages
      WHERE user_id = ${userId}::uuid
      GROUP BY collection_name
      ORDER BY collection_name
    `;
    return result.map(row => ({
      name: row.name,
      count: Number(row.count),
    }));
  }

  // Move bookmark to a different collection
  async moveToCollection(
    userId: string,
    messageId: string,
    collectionName: string
  ): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.chat_bookmarked_messages 
      SET collection_name = ${collectionName}
      WHERE user_id = ${userId}::uuid AND message_id = ${messageId}::uuid
    `;
    return result > 0;
  }

  // Update bookmark note
  async updateNote(userId: string, messageId: string, note: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.chat_bookmarked_messages 
      SET note = ${note}
      WHERE user_id = ${userId}::uuid AND message_id = ${messageId}::uuid
    `;
    return result > 0;
  }

  // Search bookmarks
  async searchBookmarks(
    userId: string,
    searchTerm: string,
    limit: number = 50
  ): Promise<BookmarkedMessage[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT bm.*, 
             m.content, m.message_type, m.created_at as message_sent_at,
             u.display_name as sender_name
      FROM bondarys.chat_bookmarked_messages bm
      JOIN bondarys.chat_messages m ON bm.message_id = m.id
      LEFT JOIN bondarys.users u ON m.sender_id = u.id
      WHERE bm.user_id = ${userId}::uuid 
        AND (m.content ILIKE ${`%${searchTerm}%`} OR bm.note ILIKE ${`%${searchTerm}%`})
      ORDER BY bm.created_at DESC
      LIMIT ${limit}
    `;
    return result.map(row => this.mapBookmarkedMessageWithDetails(row));
  }

  // Get bookmark count
  async getBookmarkCount(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM bondarys.chat_bookmarked_messages WHERE user_id = ${userId}::uuid
    `;
    return Number(result[0].count);
  }

  private mapBookmarkedMessage(row: any): BookmarkedMessage {
    return {
      id: row.id,
      userId: row.user_id,
      messageId: row.message_id,
      note: row.note,
      collectionName: row.collection_name,
      createdAt: row.created_at,
    };
  }

  private mapBookmarkedMessageWithDetails(row: any): BookmarkedMessage {
    return {
      ...this.mapBookmarkedMessage(row),
      message: {
        id: row.message_id,
        content: row.content,
        messageType: row.message_type,
        senderName: row.sender_name,
        chatRoomName: row.chat_room_name,
        sentAt: row.message_sent_at,
      },
    };
  }
}

export const chatBookmarksService = new ChatBookmarksService();
