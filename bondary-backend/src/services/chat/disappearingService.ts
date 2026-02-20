import { prisma } from '../../lib/prisma';

export interface DisappearSettings {
  id: string;
  chatRoomId: string;
  enabled: boolean;
  durationSeconds: number;
  setBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisappearingMessage {
  messageId: string;
  disappearAt: Date;
  disappearAfterRead: boolean;
  readAt?: Date;
}

export class DisappearingService {
  // Set disappearing message settings for a chat room
  async setDisappearSettings(
    chatRoomId: string,
    userId: string,
    enabled: boolean,
    durationSeconds: number = 86400
  ): Promise<DisappearSettings> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_room_disappear_settings 
      (chat_room_id, enabled, duration_seconds, set_by)
      VALUES (${chatRoomId}::uuid, ${enabled}, ${durationSeconds}, ${userId}::uuid)
      ON CONFLICT (chat_room_id) 
      DO UPDATE SET enabled = ${enabled}, duration_seconds = ${durationSeconds}, set_by = ${userId}::uuid, updated_at = NOW()
      RETURNING *
    `;
    return this.mapDisappearSettings(result[0]);
  }

  // Get disappear settings for a chat room
  async getDisappearSettings(chatRoomId: string): Promise<DisappearSettings | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_room_disappear_settings WHERE chat_room_id = ${chatRoomId}::uuid
    `;
    return result[0] ? this.mapDisappearSettings(result[0]) : null;
  }

  // Set disappear time for a specific message
  async setMessageDisappear(
    messageId: string,
    disappearAt: Date,
    disappearAfterRead: boolean = false
  ): Promise<void> {
    await prisma.$executeRaw`
      UPDATE bondarys.chat_messages 
      SET disappear_at = ${disappearAt}, disappear_after_read = ${disappearAfterRead}
      WHERE id = ${messageId}::uuid
    `;
  }

  // Apply room settings to a new message
  async applyRoomSettings(messageId: string, chatRoomId: string): Promise<void> {
    const settings = await this.getDisappearSettings(chatRoomId);
    
    if (settings?.enabled) {
      const disappearAt = new Date(Date.now() + settings.durationSeconds * 1000);
      await this.setMessageDisappear(messageId, disappearAt, false);
    }
  }

  // Mark message as read and set disappear time if needed
  async markMessageRead(messageId: string): Promise<void> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT disappear_after_read, read_at FROM bondarys.chat_messages WHERE id = ${messageId}::uuid
    `;

    if (result.length === 0) return;

    const msg = result[0];
    
    // If already read, skip
    if (msg.read_at) return;

    // Mark as read
    await prisma.$executeRaw`
      UPDATE bondarys.chat_messages SET read_at = NOW() WHERE id = ${messageId}::uuid
    `;

    // If disappear after read, set disappear time (e.g., 5 seconds after read)
    if (msg.disappear_after_read) {
      const disappearAt = new Date(Date.now() + 5000);
      await prisma.$executeRaw`
        UPDATE bondarys.chat_messages SET disappear_at = ${disappearAt} WHERE id = ${messageId}::uuid
      `;
    }
  }

  // Get messages about to disappear
  async getExpiringMessages(withinSeconds: number = 60): Promise<DisappearingMessage[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT id as message_id, disappear_at, disappear_after_read, read_at
      FROM bondarys.chat_messages
      WHERE disappear_at IS NOT NULL 
        AND disappear_at <= NOW() + INTERVAL '${withinSeconds} seconds'
        AND disappear_at > NOW()
      ORDER BY disappear_at ASC
    `;
    return result.map(row => ({
      messageId: row.message_id,
      disappearAt: row.disappear_at,
      disappearAfterRead: row.disappear_after_read,
      readAt: row.read_at,
    }));
  }

  // Delete expired messages (to be called by cron job)
  async deleteExpiredMessages(): Promise<number> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_messages 
      WHERE disappear_at IS NOT NULL AND disappear_at < NOW()
    `;
    return result;
  }

  // Get available duration presets
  getDurationPresets(): Array<{ label: string; seconds: number }> {
    return [
      { label: 'Off', seconds: 0 },
      { label: '5 seconds', seconds: 5 },
      { label: '1 minute', seconds: 60 },
      { label: '5 minutes', seconds: 300 },
      { label: '1 hour', seconds: 3600 },
      { label: '24 hours', seconds: 86400 },
      { label: '7 days', seconds: 604800 },
      { label: '30 days', seconds: 2592000 },
    ];
  }

  private mapDisappearSettings(row: any): DisappearSettings {
    return {
      id: row.id,
      chatRoomId: row.chat_room_id,
      enabled: row.enabled,
      durationSeconds: row.duration_seconds,
      setBy: row.set_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const disappearingService = new DisappearingService();
