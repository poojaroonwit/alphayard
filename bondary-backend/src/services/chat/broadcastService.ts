import { prisma } from '../../lib/prisma';

export interface BroadcastList {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  isActive: boolean;
  recipientCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BroadcastRecipient {
  id: string;
  broadcastListId: string;
  userId: string;
  displayName?: string;
  addedAt: Date;
}

export interface BroadcastMessage {
  id: string;
  broadcastListId: string;
  senderId: string;
  content: string;
  messageType: string;
  attachments: any[];
  sentAt: Date;
  deliveryCount: number;
  readCount: number;
}

export class BroadcastService {
  // Create a broadcast list
  async createList(
    ownerId: string,
    name: string,
    description?: string
  ): Promise<BroadcastList> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_broadcast_lists (owner_id, name, description)
      VALUES (${ownerId}::uuid, ${name}, ${description})
      RETURNING *
    `;
    return this.mapBroadcastList(result[0]);
  }

  // Update broadcast list
  async updateList(
    listId: string,
    ownerId: string,
    updates: { name?: string; description?: string; isActive?: boolean }
  ): Promise<BroadcastList | null> {
    const setParts: string[] = [];
    const params: any[] = [listId, ownerId];
    let paramIndex = 3;

    if (updates.name !== undefined) {
      setParts.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      setParts.push(`description = $${paramIndex++}`);
      params.push(updates.description);
    }
    if (updates.isActive !== undefined) {
      setParts.push(`is_active = $${paramIndex++}`);
      params.push(updates.isActive);
    }

    if (setParts.length === 0) return null;

    setParts.push(`updated_at = NOW()`);

    const result = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE bondarys.chat_broadcast_lists 
       SET ${setParts.join(', ')}
       WHERE id = $1::uuid AND owner_id = $2::uuid
       RETURNING *`,
      ...params
    );

    return result[0] ? this.mapBroadcastList(result[0]) : null;
  }

  // Delete broadcast list
  async deleteList(listId: string, ownerId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_broadcast_lists WHERE id = ${listId}::uuid AND owner_id = ${ownerId}::uuid
    `;
    return result > 0;
  }

  // Get user's broadcast lists
  async getLists(ownerId: string): Promise<BroadcastList[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT bl.*, 
              (SELECT COUNT(*) FROM bondarys.chat_broadcast_recipients WHERE broadcast_list_id = bl.id) as recipient_count
      FROM bondarys.chat_broadcast_lists bl
      WHERE bl.owner_id = ${ownerId}::uuid
      ORDER BY bl.name
    `;
    return result.map(row => ({
      ...this.mapBroadcastList(row),
      recipientCount: parseInt(row.recipient_count),
    }));
  }

  // Get list by ID
  async getList(listId: string): Promise<BroadcastList | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT bl.*, 
              (SELECT COUNT(*) FROM bondarys.chat_broadcast_recipients WHERE broadcast_list_id = bl.id) as recipient_count
      FROM bondarys.chat_broadcast_lists bl
      WHERE bl.id = ${listId}::uuid
    `;
    return result[0] ? {
      ...this.mapBroadcastList(result[0]),
      recipientCount: parseInt(result[0].recipient_count),
    } : null;
  }

  // Add recipient to list
  async addRecipient(listId: string, userId: string): Promise<BroadcastRecipient | null> {
    try {
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO bondarys.chat_broadcast_recipients (broadcast_list_id, user_id)
        VALUES (${listId}::uuid, ${userId}::uuid)
        ON CONFLICT (broadcast_list_id, user_id) DO NOTHING
        RETURNING *
      `;
      return result[0] ? this.mapRecipient(result[0]) : null;
    } catch (error) {
      return null;
    }
  }

  // Add multiple recipients
  async addRecipients(listId: string, userIds: string[]): Promise<number> {
    let addedCount = 0;
    for (const userId of userIds) {
      const result = await this.addRecipient(listId, userId);
      if (result) addedCount++;
    }
    return addedCount;
  }

  // Remove recipient from list
  async removeRecipient(listId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_broadcast_recipients 
      WHERE broadcast_list_id = ${listId}::uuid AND user_id = ${userId}::uuid
    `;
    return result > 0;
  }

  // Get recipients
  async getRecipients(listId: string): Promise<BroadcastRecipient[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT br.*, u.display_name
      FROM bondarys.chat_broadcast_recipients br
      LEFT JOIN bondarys.users u ON br.user_id = u.id
      WHERE br.broadcast_list_id = ${listId}::uuid
      ORDER BY u.display_name
    `;
    return result.map(row => ({
      ...this.mapRecipient(row),
      displayName: row.display_name,
    }));
  }

  // Send broadcast message
  async sendBroadcast(
    listId: string,
    senderId: string,
    content: string,
    messageType: string = 'text',
    attachments: any[] = []
  ): Promise<BroadcastMessage> {
    return await prisma.$transaction(async (tx) => {
      // Create broadcast message
      const msgResult = await tx.$queryRaw<any[]>`
        INSERT INTO bondarys.chat_broadcast_messages 
        (broadcast_list_id, sender_id, content, message_type, attachments)
        VALUES (${listId}::uuid, ${senderId}::uuid, ${content}, ${messageType}, ${JSON.stringify(attachments)}::jsonb)
        RETURNING *
      `;

      const broadcastMessage = msgResult[0];

      // Get recipients
      const recipients = await tx.$queryRaw<any[]>`
        SELECT user_id FROM bondarys.chat_broadcast_recipients WHERE broadcast_list_id = ${listId}::uuid
      `;

      // Create delivery records and individual chat messages
      for (const recipient of recipients) {
        // Find or create direct chat with recipient
        // This is simplified - in production you'd use your existing chat creation logic
        
        // Create delivery record
        await tx.$executeRaw`
          INSERT INTO bondarys.chat_broadcast_deliveries 
          (broadcast_message_id, recipient_id, status)
          VALUES (${broadcastMessage.id}::uuid, ${recipient.user_id}::uuid, 'pending')
        `;
      }

      return this.mapBroadcastMessage(broadcastMessage);
    });
  }

  // Get broadcast messages for a list
  async getBroadcastMessages(
    listId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<BroadcastMessage[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_broadcast_messages 
      WHERE broadcast_list_id = ${listId}::uuid
      ORDER BY sent_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.map(row => this.mapBroadcastMessage(row));
  }

  // Update delivery status
  async updateDeliveryStatus(
    broadcastMessageId: string,
    recipientId: string,
    status: 'delivered' | 'read' | 'failed',
    chatMessageId?: string
  ): Promise<void> {
    if (status === 'delivered') {
      if (chatMessageId) {
        await prisma.$executeRaw`
          UPDATE bondarys.chat_broadcast_deliveries 
          SET status = ${status}, delivered_at = NOW(), chat_message_id = ${chatMessageId}::uuid
          WHERE broadcast_message_id = ${broadcastMessageId}::uuid AND recipient_id = ${recipientId}::uuid
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE bondarys.chat_broadcast_deliveries 
          SET status = ${status}, delivered_at = NOW()
          WHERE broadcast_message_id = ${broadcastMessageId}::uuid AND recipient_id = ${recipientId}::uuid
        `;
      }
    } else if (status === 'read') {
      if (chatMessageId) {
        await prisma.$executeRaw`
          UPDATE bondarys.chat_broadcast_deliveries 
          SET status = ${status}, read_at = NOW(), chat_message_id = ${chatMessageId}::uuid
          WHERE broadcast_message_id = ${broadcastMessageId}::uuid AND recipient_id = ${recipientId}::uuid
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE bondarys.chat_broadcast_deliveries 
          SET status = ${status}, read_at = NOW()
          WHERE broadcast_message_id = ${broadcastMessageId}::uuid AND recipient_id = ${recipientId}::uuid
        `;
      }
    } else {
      if (chatMessageId) {
        await prisma.$executeRaw`
          UPDATE bondarys.chat_broadcast_deliveries 
          SET status = ${status}, chat_message_id = ${chatMessageId}::uuid
          WHERE broadcast_message_id = ${broadcastMessageId}::uuid AND recipient_id = ${recipientId}::uuid
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE bondarys.chat_broadcast_deliveries 
          SET status = ${status}
          WHERE broadcast_message_id = ${broadcastMessageId}::uuid AND recipient_id = ${recipientId}::uuid
        `;
      }
    }
  }

  // Get delivery stats for a broadcast message
  async getDeliveryStats(broadcastMessageId: string): Promise<{
    total: number;
    pending: number;
    delivered: number;
    read: number;
    failed: number;
  }> {
    const result = await prisma.$queryRaw<Array<{
      total: bigint;
      pending: bigint;
      delivered: bigint;
      read: bigint;
      failed: bigint;
    }>>`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'delivered')::int as delivered,
        COUNT(*) FILTER (WHERE status = 'read')::int as read,
        COUNT(*) FILTER (WHERE status = 'failed')::int as failed
      FROM bondarys.chat_broadcast_deliveries
      WHERE broadcast_message_id = ${broadcastMessageId}::uuid
    `;

    const row = result[0];
    return {
      total: Number(row.total),
      pending: Number(row.pending),
      delivered: Number(row.delivered),
      read: Number(row.read),
      failed: Number(row.failed),
    };
  }

  private mapBroadcastList(row: any): BroadcastList {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapRecipient(row: any): BroadcastRecipient {
    return {
      id: row.id,
      broadcastListId: row.broadcast_list_id,
      userId: row.user_id,
      addedAt: row.added_at,
    };
  }

  private mapBroadcastMessage(row: any): BroadcastMessage {
    return {
      id: row.id,
      broadcastListId: row.broadcast_list_id,
      senderId: row.sender_id,
      content: row.content,
      messageType: row.message_type,
      attachments: row.attachments || [],
      sentAt: row.sent_at,
      deliveryCount: row.delivery_count || 0,
      readCount: row.read_count || 0,
    };
  }
}

export const broadcastService = new BroadcastService();
