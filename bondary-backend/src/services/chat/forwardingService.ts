import { prisma } from '../../lib/prisma';

export interface ForwardedMessage {
  id: string;
  messageId: string;
  originalMessageId?: string;
  originalChatRoomId?: string;
  originalSenderId?: string;
  originalSentAt?: Date;
  forwardCount: number;
  createdAt: Date;
}

export interface ForwardInput {
  originalMessageId: string;
  targetChatRoomIds: string[];
  senderId: string;
}

export class ForwardingService {
  // Forward a message to multiple chats
  async forwardMessage(input: ForwardInput): Promise<string[]> {
    return await prisma.$transaction(async (tx) => {
      // Get original message details
      const originalMsg = await tx.$queryRaw<any[]>`
        SELECT m.*, u.display_name as sender_name
        FROM bondarys.chat_messages m
        LEFT JOIN bondarys.users u ON m.sender_id = u.id
        WHERE m.id = ${input.originalMessageId}::uuid
      `;

      if (originalMsg.length === 0) {
        throw new Error('Original message not found');
      }

      const original = originalMsg[0];
      const newMessageIds: string[] = [];

      // Create forwarded message in each target chat
      for (const chatRoomId of input.targetChatRoomIds) {
        // Create the new message
        const newMsg = await tx.chatMessage.create({
          data: {
            roomId: chatRoomId,
            senderId: input.senderId,
            content: original.content,
            messageType: original.message_type,
            metadata: {
              ...(typeof original.metadata === 'string' ? JSON.parse(original.metadata || '{}') : original.metadata || {}),
              forwarded: true,
              originalSender: original.sender_name,
            },
          },
        });

        const newMessageId = newMsg.id;
        newMessageIds.push(newMessageId);

        // Record the forward
        await tx.$executeRaw`
          INSERT INTO bondarys.chat_forwarded_messages 
          (message_id, original_message_id, original_chat_room_id, original_sender_id, original_sent_at)
          VALUES (${newMessageId}::uuid, ${input.originalMessageId}::uuid, ${original.room_id || original.chat_room_id}::uuid, ${original.sender_id}::uuid, ${original.created_at})
        `;

        // Increment forward count on original
        await tx.$executeRaw`
          UPDATE bondarys.chat_forwarded_messages 
          SET forward_count = forward_count + 1 
          WHERE message_id = ${input.originalMessageId}::uuid
        `;
      }

      return newMessageIds;
    });
  }

  // Get forward info for a message
  async getForwardInfo(messageId: string): Promise<ForwardedMessage | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_forwarded_messages WHERE message_id = ${messageId}::uuid
    `;
    return result[0] ? this.mapForwardedMessage(result[0]) : null;
  }

  // Check if message is forwarded
  async isForwarded(messageId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM bondarys.chat_forwarded_messages WHERE message_id = ${messageId}::uuid
    `;
    return result.length > 0;
  }

  // Get forward count for original message
  async getForwardCount(originalMessageId: string): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM bondarys.chat_forwarded_messages 
      WHERE original_message_id = ${originalMessageId}::uuid
    `;
    return Number(result[0].count);
  }

  private mapForwardedMessage(row: any): ForwardedMessage {
    return {
      id: row.id,
      messageId: row.message_id,
      originalMessageId: row.original_message_id,
      originalChatRoomId: row.original_chat_room_id,
      originalSenderId: row.original_sender_id,
      originalSentAt: row.original_sent_at,
      forwardCount: row.forward_count,
      createdAt: row.created_at,
    };
  }
}

export const forwardingService = new ForwardingService();
