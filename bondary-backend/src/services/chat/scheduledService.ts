import { prisma } from '../../lib/prisma';

export interface ScheduledMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachments: any[];
  metadata: any;
  scheduledFor: Date;
  timezone: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  sentMessageId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduledInput {
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType?: string;
  attachments?: any[];
  metadata?: any;
  scheduledFor: Date;
  timezone?: string;
}

export class ScheduledService {
  // Create a scheduled message
  async createScheduledMessage(input: CreateScheduledInput): Promise<ScheduledMessage> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_scheduled_messages 
      (chat_room_id, sender_id, content, message_type, attachments, metadata, scheduled_for, timezone)
      VALUES (${input.chatRoomId}::uuid, ${input.senderId}::uuid, ${input.content}, 
              ${input.messageType || 'text'}, ${JSON.stringify(input.attachments || [])}::jsonb, 
              ${JSON.stringify(input.metadata || {})}::jsonb, ${input.scheduledFor}, ${input.timezone || 'UTC'})
      RETURNING *
    `;
    return this.mapScheduledMessage(result[0]);
  }

  // Update a scheduled message
  async updateScheduledMessage(
    id: string,
    senderId: string,
    updates: Partial<CreateScheduledInput>
  ): Promise<ScheduledMessage | null> {
    const setParts: string[] = [];
    const params: any[] = [id, senderId];
    let paramIndex = 3;

    if (updates.content !== undefined) {
      setParts.push(`content = $${paramIndex++}`);
      params.push(updates.content);
    }
    if (updates.scheduledFor !== undefined) {
      setParts.push(`scheduled_for = $${paramIndex++}`);
      params.push(updates.scheduledFor);
    }
    if (updates.attachments !== undefined) {
      setParts.push(`attachments = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(updates.attachments));
    }
    if (updates.metadata !== undefined) {
      setParts.push(`metadata = $${paramIndex++}::jsonb`);
      params.push(JSON.stringify(updates.metadata));
    }

    if (setParts.length === 0) return null;

    setParts.push(`updated_at = NOW()`);

    const result = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE bondarys.chat_scheduled_messages 
       SET ${setParts.join(', ')}
       WHERE id = $1::uuid AND sender_id = $2::uuid AND status = 'pending'
       RETURNING *`,
      ...params
    );

    return result[0] ? this.mapScheduledMessage(result[0]) : null;
  }

  // Cancel a scheduled message
  async cancelScheduledMessage(id: string, senderId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.chat_scheduled_messages 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id}::uuid AND sender_id = ${senderId}::uuid AND status = 'pending'
    `;
    return result > 0;
  }

  // Get scheduled messages for a user
  async getScheduledMessages(
    senderId: string,
    chatRoomId?: string
  ): Promise<ScheduledMessage[]> {
    if (chatRoomId) {
      const result = await prisma.$queryRaw<any[]>`
        SELECT * FROM bondarys.chat_scheduled_messages 
        WHERE sender_id = ${senderId}::uuid AND status = 'pending' AND chat_room_id = ${chatRoomId}::uuid
        ORDER BY scheduled_for ASC
      `;
      return result.map(row => this.mapScheduledMessage(row));
    } else {
      const result = await prisma.$queryRaw<any[]>`
        SELECT * FROM bondarys.chat_scheduled_messages 
        WHERE sender_id = ${senderId}::uuid AND status = 'pending'
        ORDER BY scheduled_for ASC
      `;
      return result.map(row => this.mapScheduledMessage(row));
    }
  }

  // Get due scheduled messages (for processing)
  async getDueMessages(): Promise<ScheduledMessage[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_scheduled_messages 
      WHERE status = 'pending' AND scheduled_for <= NOW()
      ORDER BY scheduled_for ASC
      LIMIT 100
    `;
    return result.map(row => this.mapScheduledMessage(row));
  }

  // Process and send a scheduled message
  async processScheduledMessage(id: string): Promise<string | null> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the scheduled message
        const scheduled = await tx.$queryRaw<any[]>`
          SELECT * FROM bondarys.chat_scheduled_messages WHERE id = ${id}::uuid AND status = 'pending'
          FOR UPDATE
        `;

        if (scheduled.length === 0) {
          return null;
        }

        const msg = scheduled[0];

        // Create the actual message
        const newMsg = await tx.chatMessage.create({
          data: {
            roomId: msg.chat_room_id,
            senderId: msg.sender_id,
            content: msg.content,
            messageType: msg.message_type,
            metadata: typeof msg.metadata === 'string' ? JSON.parse(msg.metadata || '{}') : msg.metadata || {},
          },
        });

        const sentMessageId = newMsg.id;

        // Update the scheduled message status
        await tx.$executeRaw`
          UPDATE bondarys.chat_scheduled_messages 
          SET status = 'sent', sent_message_id = ${sentMessageId}::uuid, updated_at = NOW()
          WHERE id = ${id}::uuid
        `;

        return sentMessageId;
      });
    } catch (error: any) {
      // Mark as failed
      await prisma.$executeRaw`
        UPDATE bondarys.chat_scheduled_messages 
        SET status = 'failed', error_message = ${error.message}, updated_at = NOW()
        WHERE id = ${id}::uuid
      `;

      throw error;
    }
  }

  // Get scheduled message by ID
  async getScheduledMessage(id: string): Promise<ScheduledMessage | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_scheduled_messages WHERE id = ${id}::uuid
    `;
    return result[0] ? this.mapScheduledMessage(result[0]) : null;
  }

  private mapScheduledMessage(row: any): ScheduledMessage {
    return {
      id: row.id,
      chatRoomId: row.chat_room_id,
      senderId: row.sender_id,
      content: row.content,
      messageType: row.message_type,
      attachments: row.attachments || [],
      metadata: row.metadata || {},
      scheduledFor: row.scheduled_for,
      timezone: row.timezone,
      status: row.status,
      sentMessageId: row.sent_message_id,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const scheduledService = new ScheduledService();
