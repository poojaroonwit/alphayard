import { prisma } from '../../lib/prisma';

export interface ChatUserSettings {
  id: string;
  userId: string;
  chatRoomId: string;
  isMuted: boolean;
  mutedUntil?: Date;
  isArchived: boolean;
  isPinned: boolean;
  pinOrder: number;
  notificationSound?: string;
  customNotification: boolean;
  showPreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatSettingsService {
  // Get or create user settings for a chat
  async getSettings(userId: string, chatRoomId: string): Promise<ChatUserSettings> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_user_settings (user_id, chat_room_id)
      VALUES (${userId}::uuid, ${chatRoomId}::uuid)
      ON CONFLICT (user_id, chat_room_id) DO UPDATE SET updated_at = NOW()
      RETURNING *
    `;
    return this.mapSettings(result[0]);
  }

  // Mute a chat
  async muteChat(
    userId: string,
    chatRoomId: string,
    mutedUntil?: Date
  ): Promise<ChatUserSettings> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_user_settings (user_id, chat_room_id, is_muted, muted_until)
      VALUES (${userId}::uuid, ${chatRoomId}::uuid, TRUE, ${mutedUntil})
      ON CONFLICT (user_id, chat_room_id) 
      DO UPDATE SET is_muted = TRUE, muted_until = ${mutedUntil}, updated_at = NOW()
      RETURNING *
    `;
    return this.mapSettings(result[0]);
  }

  // Unmute a chat
  async unmuteChat(userId: string, chatRoomId: string): Promise<ChatUserSettings> {
    const result = await prisma.$queryRaw<any[]>`
      UPDATE bondarys.chat_user_settings 
      SET is_muted = FALSE, muted_until = NULL, updated_at = NOW()
      WHERE user_id = ${userId}::uuid AND chat_room_id = ${chatRoomId}::uuid
      RETURNING *
    `;

    if (result.length === 0) {
      return this.getSettings(userId, chatRoomId);
    }

    return this.mapSettings(result[0]);
  }

  // Check if chat is muted
  async isMuted(userId: string, chatRoomId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT is_muted, muted_until FROM bondarys.chat_user_settings 
      WHERE user_id = ${userId}::uuid AND chat_room_id = ${chatRoomId}::uuid
    `;

    if (result.length === 0) return false;

    const { is_muted, muted_until } = result[0];
    
    // Check if mute has expired
    if (is_muted && muted_until && new Date(muted_until) < new Date()) {
      await this.unmuteChat(userId, chatRoomId);
      return false;
    }

    return is_muted;
  }

  // Archive a chat
  async archiveChat(userId: string, chatRoomId: string): Promise<ChatUserSettings> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_user_settings (user_id, chat_room_id, is_archived)
      VALUES (${userId}::uuid, ${chatRoomId}::uuid, TRUE)
      ON CONFLICT (user_id, chat_room_id) 
      DO UPDATE SET is_archived = TRUE, updated_at = NOW()
      RETURNING *
    `;
    return this.mapSettings(result[0]);
  }

  // Unarchive a chat
  async unarchiveChat(userId: string, chatRoomId: string): Promise<ChatUserSettings> {
    const result = await prisma.$queryRaw<any[]>`
      UPDATE bondarys.chat_user_settings 
      SET is_archived = FALSE, updated_at = NOW()
      WHERE user_id = ${userId}::uuid AND chat_room_id = ${chatRoomId}::uuid
      RETURNING *
    `;

    if (result.length === 0) {
      return this.getSettings(userId, chatRoomId);
    }

    return this.mapSettings(result[0]);
  }

  // Get archived chats
  async getArchivedChats(userId: string): Promise<string[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT chat_room_id FROM bondarys.chat_user_settings 
      WHERE user_id = ${userId}::uuid AND is_archived = TRUE
    `;
    return result.map(r => r.chat_room_id);
  }

  // Pin a chat
  async pinChat(userId: string, chatRoomId: string): Promise<ChatUserSettings> {
    // Get max pin order
    const maxOrder = await prisma.$queryRaw<any[]>`
      SELECT COALESCE(MAX(pin_order), 0) as max_order 
      FROM bondarys.chat_user_settings 
      WHERE user_id = ${userId}::uuid AND is_pinned = TRUE
    `;

    const newOrder = (maxOrder[0]?.max_order || 0) + 1;

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_user_settings (user_id, chat_room_id, is_pinned, pin_order)
      VALUES (${userId}::uuid, ${chatRoomId}::uuid, TRUE, ${newOrder})
      ON CONFLICT (user_id, chat_room_id) 
      DO UPDATE SET is_pinned = TRUE, pin_order = ${newOrder}, updated_at = NOW()
      RETURNING *
    `;
    return this.mapSettings(result[0]);
  }

  // Unpin a chat
  async unpinChat(userId: string, chatRoomId: string): Promise<ChatUserSettings> {
    const result = await prisma.$queryRaw<any[]>`
      UPDATE bondarys.chat_user_settings 
      SET is_pinned = FALSE, pin_order = 0, updated_at = NOW()
      WHERE user_id = ${userId}::uuid AND chat_room_id = ${chatRoomId}::uuid
      RETURNING *
    `;

    if (result.length === 0) {
      return this.getSettings(userId, chatRoomId);
    }

    return this.mapSettings(result[0]);
  }

  // Get pinned chats in order
  async getPinnedChats(userId: string): Promise<string[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT chat_room_id FROM bondarys.chat_user_settings 
      WHERE user_id = ${userId}::uuid AND is_pinned = TRUE
      ORDER BY pin_order
    `;
    return result.map(r => r.chat_room_id);
  }

  // Reorder pinned chats
  async reorderPinnedChats(
    userId: string,
    chatRoomIds: string[]
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < chatRoomIds.length; i++) {
        await tx.$executeRaw`
          UPDATE bondarys.chat_user_settings 
          SET pin_order = ${i + 1}, updated_at = NOW()
          WHERE user_id = ${userId}::uuid AND chat_room_id = ${chatRoomIds[i]}::uuid AND is_pinned = TRUE
        `;
      }
    });
  }

  // Update notification settings
  async updateNotificationSettings(
    userId: string,
    chatRoomId: string,
    settings: {
      notificationSound?: string;
      customNotification?: boolean;
      showPreview?: boolean;
    }
  ): Promise<ChatUserSettings> {
    // Build dynamic SQL for Prisma
    const updates: string[] = ['updated_at = NOW()'];
    const insertCols: string[] = [];
    const insertVals: string[] = [];
    
    if (settings.notificationSound !== undefined) {
      updates.push(`notification_sound = ${settings.notificationSound ? `'${settings.notificationSound.replace(/'/g, "''")}'` : 'NULL'}`);
      insertCols.push('notification_sound');
      insertVals.push(settings.notificationSound ? `'${settings.notificationSound.replace(/'/g, "''")}'` : 'NULL');
    }
    if (settings.customNotification !== undefined) {
      updates.push(`custom_notification = ${settings.customNotification}`);
      insertCols.push('custom_notification');
      insertVals.push(String(settings.customNotification));
    }
    if (settings.showPreview !== undefined) {
      updates.push(`show_preview = ${settings.showPreview}`);
      insertCols.push('show_preview');
      insertVals.push(String(settings.showPreview));
    }

    const insertColsStr = insertCols.length > 0 ? `, ${insertCols.join(', ')}` : '';
    const insertValsStr = insertVals.length > 0 ? `, ${insertVals.join(', ')}` : '';

    const result = await prisma.$queryRawUnsafe<any[]>(`
      INSERT INTO bondarys.chat_user_settings (user_id, chat_room_id${insertColsStr})
      VALUES ('${userId}'::uuid, '${chatRoomId}'::uuid${insertValsStr})
      ON CONFLICT (user_id, chat_room_id) 
      DO UPDATE SET ${updates.join(', ')}
      RETURNING *
    `);

    return this.mapSettings(result[0]);
  }

  // Get mute duration presets
  getMutePresets(): Array<{ label: string; duration: number | null }> {
    return [
      { label: '8 hours', duration: 8 * 60 * 60 * 1000 },
      { label: '1 week', duration: 7 * 24 * 60 * 60 * 1000 },
      { label: 'Always', duration: null },
    ];
  }

  private mapSettings(row: any): ChatUserSettings {
    return {
      id: row.id,
      userId: row.user_id,
      chatRoomId: row.chat_room_id,
      isMuted: row.is_muted,
      mutedUntil: row.muted_until,
      isArchived: row.is_archived,
      isPinned: row.is_pinned,
      pinOrder: row.pin_order,
      notificationSound: row.notification_sound,
      customNotification: row.custom_notification,
      showPreview: row.show_preview,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const chatSettingsService = new ChatSettingsService();
