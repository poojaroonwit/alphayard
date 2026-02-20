import { prisma } from '../../lib/prisma';

export interface ThreadMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  messageType: string;
  threadId?: string;
  threadReplyCount: number;
  threadLastReplyAt?: Date;
  threadParticipants: string[];
  createdAt: Date;
}

export interface ThreadSummary {
  threadId: string;
  replyCount: number;
  lastReplyAt?: Date;
  participants: Array<{
    userId: string;
    displayName: string;
    avatarUrl?: string;
  }>;
  previewReplies: ThreadMessage[];
}

export class ThreadingService {
  // Reply to a message in a thread
  async replyToThread(
    threadId: string,
    chatRoomId: string,
    senderId: string,
    content: string,
    messageType: string = 'text'
  ): Promise<ThreadMessage> {
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_messages (chat_room_id, sender_id, content, message_type, thread_id)
      VALUES (${chatRoomId}::uuid, ${senderId}::uuid, ${content}, ${messageType}, ${threadId}::uuid)
      RETURNING *
    `;
    return this.mapThreadMessage(result[0]);
  }

  // Get thread replies
  async getThreadReplies(
    threadId: string,
    options: { limit?: number; offset?: number; before?: Date } = {}
  ): Promise<ThreadMessage[]> {
    const { limit = 50, offset = 0, before } = options;

    if (before) {
      const result = await prisma.$queryRaw<any[]>`
        SELECT m.*, u.display_name as sender_name, u.avatar_url
        FROM bondarys.chat_messages m
        LEFT JOIN bondarys.users u ON m.sender_id = u.id
        WHERE m.thread_id = ${threadId}::uuid AND m.created_at < ${before}
        ORDER BY m.created_at ASC LIMIT ${limit} OFFSET ${offset}
      `;
      return result.map(row => this.mapThreadMessage(row));
    } else {
      const result = await prisma.$queryRaw<any[]>`
        SELECT m.*, u.display_name as sender_name, u.avatar_url
        FROM bondarys.chat_messages m
        LEFT JOIN bondarys.users u ON m.sender_id = u.id
        WHERE m.thread_id = ${threadId}::uuid
        ORDER BY m.created_at ASC LIMIT ${limit} OFFSET ${offset}
      `;
      return result.map(row => this.mapThreadMessage(row));
    }
  }

  // Get thread summary (for preview)
  async getThreadSummary(threadId: string): Promise<ThreadSummary | null> {
    // Get thread info
    const threadResult = await prisma.$queryRaw<any[]>`
      SELECT id, thread_reply_count, thread_last_reply_at, thread_participants
      FROM bondarys.chat_messages WHERE id = ${threadId}::uuid
    `;

    if (threadResult.length === 0) return null;

    const thread = threadResult[0];

    // Get participant details
    const participantIds = thread.thread_participants || [];
    let participants: any[] = [];
    
    if (participantIds.length > 0) {
      const participantsResult = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id as user_id, display_name, avatar_url 
         FROM bondarys.users WHERE id = ANY($1::uuid[]) LIMIT 5`,
        participantIds.slice(0, 5)
      );
      participants = participantsResult;
    }

    // Get preview replies (last 3)
    const repliesResult = await prisma.$queryRaw<any[]>`
      SELECT m.*, u.display_name as sender_name
      FROM bondarys.chat_messages m
      LEFT JOIN bondarys.users u ON m.sender_id = u.id
      WHERE m.thread_id = ${threadId}::uuid
      ORDER BY m.created_at DESC LIMIT 3
    `;

    return {
      threadId,
      replyCount: thread.thread_reply_count || 0,
      lastReplyAt: thread.thread_last_reply_at,
      participants,
      previewReplies: repliesResult.map(row => this.mapThreadMessage(row)).reverse(),
    };
  }

  // Get all threads in a chat room
  async getChatThreads(chatRoomId: string, limit: number = 20): Promise<ThreadSummary[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT id FROM bondarys.chat_messages 
      WHERE chat_room_id = ${chatRoomId}::uuid 
        AND thread_reply_count > 0
      ORDER BY thread_last_reply_at DESC
      LIMIT ${limit}
    `;

    const summaries: ThreadSummary[] = [];
    for (const row of result) {
      const summary = await this.getThreadSummary(row.id);
      if (summary) summaries.push(summary);
    }

    return summaries;
  }

  // Get unread thread replies for a user
  async getUnreadThreadReplies(userId: string, limit: number = 50): Promise<ThreadMessage[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT m.*, u.display_name as sender_name
      FROM bondarys.chat_messages m
      LEFT JOIN bondarys.users u ON m.sender_id = u.id
      WHERE m.thread_id IN (
        SELECT id FROM bondarys.chat_messages 
        WHERE sender_id = ${userId}::uuid OR ${userId}::uuid = ANY(thread_participants)
      )
      AND m.sender_id != ${userId}::uuid
      AND m.created_at > COALESCE(
        (SELECT last_read_at FROM bondarys.chat_participants 
         WHERE user_id = ${userId}::uuid AND chat_room_id = m.chat_room_id),
        '1970-01-01'::timestamp
      )
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `;

    return result.map(row => this.mapThreadMessage(row));
  }

  private mapThreadMessage(row: any): ThreadMessage {
    return {
      id: row.id,
      chatRoomId: row.chat_room_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      content: row.content,
      messageType: row.message_type,
      threadId: row.thread_id,
      threadReplyCount: row.thread_reply_count || 0,
      threadLastReplyAt: row.thread_last_reply_at,
      threadParticipants: row.thread_participants || [],
      createdAt: row.created_at,
    };
  }
}

export const threadingService = new ThreadingService();
