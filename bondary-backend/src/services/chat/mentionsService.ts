import { prisma } from '../../lib/prisma';

export interface ChatMention {
  id: string;
  messageId: string;
  chatRoomId: string;
  mentionedUserId: string;
  mentionerId: string;
  mentionType: 'user' | 'everyone' | 'here' | 'role';
  readAt?: Date;
  createdAt: Date;
  message?: {
    content: string;
    senderName: string;
  };
  mentioner?: {
    displayName: string;
    avatarUrl?: string;
  };
}

export class ChatMentionsService {
  // Extract mentions from text
  extractMentions(text: string): Array<{ type: string; value: string }> {
    const mentions: Array<{ type: string; value: string }> = [];
    
    // @username mentions
    const userMentions = text.match(/@([a-zA-Z0-9_]+)/g);
    if (userMentions) {
      userMentions.forEach(m => {
        mentions.push({ type: 'user', value: m.slice(1) });
      });
    }

    // @everyone mention
    if (text.includes('@everyone')) {
      mentions.push({ type: 'everyone', value: 'everyone' });
    }

    // @here mention
    if (text.includes('@here')) {
      mentions.push({ type: 'here', value: 'here' });
    }

    return mentions;
  }

  // Process mentions in a message
  async processMentions(
    messageId: string,
    chatRoomId: string,
    mentionerId: string,
    text: string
  ): Promise<ChatMention[]> {
    const extractedMentions = this.extractMentions(text);
    const createdMentions: ChatMention[] = [];

    for (const mention of extractedMentions) {
      if (mention.type === 'everyone') {
        // Get all participants in the chat
        const participants = await prisma.$queryRaw<any[]>`
          SELECT user_id FROM bondarys.chat_participants WHERE chat_room_id = ${chatRoomId}::uuid AND user_id != ${mentionerId}::uuid
        `;

        for (const p of participants) {
          const m = await this.createMention(messageId, chatRoomId, p.user_id, mentionerId, 'everyone');
          if (m) createdMentions.push(m);
        }
      } else if (mention.type === 'here') {
        // Get online participants (simplified - check recent activity)
        const onlineParticipants = await prisma.$queryRaw<any[]>`
          SELECT cp.user_id FROM bondarys.chat_participants cp
          JOIN bondarys.user_socket_sessions uss ON cp.user_id = uss.user_id
          WHERE cp.chat_room_id = ${chatRoomId}::uuid AND cp.user_id != ${mentionerId}::uuid
            AND uss.last_seen_at > NOW() - INTERVAL '5 minutes'
        `;

        for (const p of onlineParticipants) {
          const m = await this.createMention(messageId, chatRoomId, p.user_id, mentionerId, 'here');
          if (m) createdMentions.push(m);
        }
      } else if (mention.type === 'user') {
        // Find user by username
        const user = await prisma.$queryRaw<any[]>`
          SELECT id FROM bondarys.users WHERE username = ${mention.value}
        `;

        if (user.length > 0 && user[0].id !== mentionerId) {
          const m = await this.createMention(messageId, chatRoomId, user[0].id, mentionerId, 'user');
          if (m) createdMentions.push(m);
        }
      }
    }

    return createdMentions;
  }

  // Create a mention
  private async createMention(
    messageId: string,
    chatRoomId: string,
    mentionedUserId: string,
    mentionerId: string,
    mentionType: 'user' | 'everyone' | 'here' | 'role'
  ): Promise<ChatMention | null> {
    try {
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO bondarys.chat_mentions 
        (message_id, chat_room_id, mentioned_user_id, mentioner_id, mention_type)
        VALUES (${messageId}::uuid, ${chatRoomId}::uuid, ${mentionedUserId}::uuid, ${mentionerId}::uuid, ${mentionType})
        ON CONFLICT DO NOTHING
        RETURNING *
      `;
      return result[0] ? this.mapMention(result[0]) : null;
    } catch (error) {
      console.error('Error creating mention:', error);
      return null;
    }
  }

  // Get unread mentions for a user
  async getUnreadMentions(userId: string, limit: number = 50): Promise<ChatMention[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT cm.*, 
             m.content as message_content,
             u.display_name as mentioner_name, u.avatar_url as mentioner_avatar
      FROM bondarys.chat_mentions cm
      JOIN bondarys.chat_messages m ON cm.message_id = m.id
      LEFT JOIN bondarys.users u ON cm.mentioner_id = u.id
      WHERE cm.mentioned_user_id = ${userId}::uuid AND cm.read_at IS NULL
      ORDER BY cm.created_at DESC
      LIMIT ${limit}
    `;
    return result.map(row => this.mapMentionWithDetails(row));
  }

  // Get all mentions for a user
  async getAllMentions(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ChatMention[]> {
    const { limit = 50, offset = 0 } = options;

    const result = await prisma.$queryRaw<any[]>`
      SELECT cm.*, 
             m.content as message_content,
             u.display_name as mentioner_name, u.avatar_url as mentioner_avatar
      FROM bondarys.chat_mentions cm
      JOIN bondarys.chat_messages m ON cm.message_id = m.id
      LEFT JOIN bondarys.users u ON cm.mentioner_id = u.id
      WHERE cm.mentioned_user_id = ${userId}::uuid
      ORDER BY cm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return result.map(row => this.mapMentionWithDetails(row));
  }

  // Mark mention as read
  async markAsRead(mentionId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.chat_mentions 
      SET read_at = NOW()
      WHERE id = ${mentionId}::uuid AND mentioned_user_id = ${userId}::uuid AND read_at IS NULL
    `;
    return (result ?? 0) > 0;
  }

  // Mark all mentions as read
  async markAllAsRead(userId: string, chatRoomId?: string): Promise<number> {
    if (chatRoomId) {
      const result = await prisma.$executeRaw`
        UPDATE bondarys.chat_mentions SET read_at = NOW() 
        WHERE mentioned_user_id = ${userId}::uuid AND chat_room_id = ${chatRoomId}::uuid AND read_at IS NULL
      `;
      return result ?? 0;
    } else {
      const result = await prisma.$executeRaw`
        UPDATE bondarys.chat_mentions SET read_at = NOW() 
        WHERE mentioned_user_id = ${userId}::uuid AND read_at IS NULL
      `;
      return result ?? 0;
    }
  }

  // Get unread mention count
  async getUnreadCount(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM bondarys.chat_mentions 
      WHERE mentioned_user_id = ${userId}::uuid AND read_at IS NULL
    `;
    return parseInt(result[0]?.count || '0');
  }

  // Get mentions in a specific message
  async getMessageMentions(messageId: string): Promise<ChatMention[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT cm.*, u.display_name as mentioned_name
      FROM bondarys.chat_mentions cm
      LEFT JOIN bondarys.users u ON cm.mentioned_user_id = u.id
      WHERE cm.message_id = ${messageId}::uuid
    `;
    return result.map(row => this.mapMention(row));
  }

  private mapMention(row: any): ChatMention {
    return {
      id: row.id,
      messageId: row.message_id,
      chatRoomId: row.chat_room_id,
      mentionedUserId: row.mentioned_user_id,
      mentionerId: row.mentioner_id,
      mentionType: row.mention_type,
      readAt: row.read_at,
      createdAt: row.created_at,
    };
  }

  private mapMentionWithDetails(row: any): ChatMention {
    return {
      ...this.mapMention(row),
      message: {
        content: row.message_content,
        senderName: row.mentioner_name,
      },
      mentioner: {
        displayName: row.mentioner_name,
        avatarUrl: row.mentioner_avatar,
      },
    };
  }
}

export const chatMentionsService = new ChatMentionsService();
