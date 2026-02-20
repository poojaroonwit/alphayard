import { prisma } from '../../lib/prisma';

export interface PinnedMessage {
  id: string;
  chatRoomId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: Date;
  expiresAt?: Date;
  message?: {
    id: string;
    content: string;
    senderName: string;
    sentAt: Date;
  };
}

export class PinningService {
  // Pin a message
  async pinMessage(
    chatRoomId: string,
    messageId: string,
    userId: string,
    expiresAt?: Date
  ): Promise<PinnedMessage> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_pinned_messages (chat_room_id, message_id, pinned_by, expires_at)
      VALUES (${chatRoomId}::uuid, ${messageId}::uuid, ${userId}::uuid, ${expiresAt})
      ON CONFLICT (chat_room_id, message_id) 
      DO UPDATE SET pinned_by = ${userId}::uuid, pinned_at = NOW(), expires_at = ${expiresAt}
      RETURNING *
    `;
    return this.mapPinnedMessage(result[0]);
  }

  // Unpin a message
  async unpinMessage(chatRoomId: string, messageId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_pinned_messages 
      WHERE chat_room_id = ${chatRoomId}::uuid AND message_id = ${messageId}::uuid
    `;
    return result > 0;
  }

  // Get pinned messages for a chat room
  async getPinnedMessages(chatRoomId: string): Promise<PinnedMessage[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT pm.*, 
              m.content as message_content,
              m.created_at as message_sent_at,
              u.display_name as sender_name
      FROM bondarys.chat_pinned_messages pm
      JOIN bondarys.chat_messages m ON pm.message_id = m.id
      LEFT JOIN bondarys.users u ON m.sender_id = u.id
      WHERE pm.chat_room_id = ${chatRoomId}::uuid
        AND (pm.expires_at IS NULL OR pm.expires_at > NOW())
      ORDER BY pm.pinned_at DESC
    `;
    return result.map(row => this.mapPinnedMessageWithDetails(row));
  }

  // Check if message is pinned
  async isPinned(messageId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM bondarys.chat_pinned_messages WHERE message_id = ${messageId}::uuid
    `;
    return result.length > 0;
  }

  // Get pin count for a chat room
  async getPinCount(chatRoomId: string): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM bondarys.chat_pinned_messages 
      WHERE chat_room_id = ${chatRoomId}::uuid 
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
    return Number(result[0].count);
  }

  private mapPinnedMessage(row: any): PinnedMessage {
    return {
      id: row.id,
      chatRoomId: row.chat_room_id,
      messageId: row.message_id,
      pinnedBy: row.pinned_by,
      pinnedAt: row.pinned_at,
      expiresAt: row.expires_at,
    };
  }

  private mapPinnedMessageWithDetails(row: any): PinnedMessage {
    return {
      ...this.mapPinnedMessage(row),
      message: {
        id: row.message_id,
        content: row.message_content,
        senderName: row.sender_name,
        sentAt: row.message_sent_at,
      },
    };
  }
}

export const pinningService = new PinningService();
