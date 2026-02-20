import { prisma } from '../../lib/prisma';

export interface ChatPoll {
  id: string;
  messageId?: string;
  chatRoomId: string;
  creatorId: string;
  question: string;
  pollType: 'single' | 'multiple' | 'quiz';
  isAnonymous: boolean;
  allowsAddOptions: boolean;
  closesAt?: Date;
  isClosed: boolean;
  totalVotes: number;
  correctOptionId?: string;
  options: ChatPollOption[];
  createdAt: Date;
  updatedAt: Date;
  userVotes?: string[]; // Current user's voted option IDs
}

export interface ChatPollOption {
  id: string;
  pollId: string;
  optionText: string;
  voteCount: number;
  addedBy?: string;
  displayOrder: number;
  createdAt: Date;
  isCorrect?: boolean; // For quiz polls
  voters?: Array<{ userId: string; displayName: string }>; // If not anonymous
}

export interface CreatePollInput {
  chatRoomId: string;
  creatorId: string;
  question: string;
  options: string[];
  pollType?: 'single' | 'multiple' | 'quiz';
  isAnonymous?: boolean;
  allowsAddOptions?: boolean;
  closesAt?: Date;
  correctOptionIndex?: number; // For quiz polls
}

export class ChatPollsService {
  // Create a poll
  async createPoll(input: CreatePollInput): Promise<ChatPoll> {
    return await prisma.$transaction(async (tx) => {
      // Create the poll
      const pollResult = await tx.$queryRaw<any[]>`
        INSERT INTO bondarys.chat_polls 
        (chat_room_id, creator_id, question, poll_type, is_anonymous, allows_add_options, closes_at)
        VALUES (${input.chatRoomId}::uuid, ${input.creatorId}::uuid, ${input.question}, 
                ${input.pollType || 'single'}, ${input.isAnonymous ?? false}, 
                ${input.allowsAddOptions ?? false}, ${input.closesAt})
        RETURNING *
      `;

      const poll = pollResult[0];
      const options: ChatPollOption[] = [];

      // Create options
      for (let i = 0; i < input.options.length; i++) {
        const optionResult = await tx.$queryRaw<any[]>`
          INSERT INTO bondarys.chat_poll_options (poll_id, option_text, display_order, added_by)
          VALUES (${poll.id}::uuid, ${input.options[i]}, ${i}, ${input.creatorId}::uuid)
          RETURNING *
        `;
        options.push(this.mapPollOption(optionResult[0]));

        // Set correct option for quiz
        if (input.pollType === 'quiz' && input.correctOptionIndex === i) {
          await tx.$executeRaw`
            UPDATE bondarys.chat_polls SET correct_option_id = ${optionResult[0].id}::uuid WHERE id = ${poll.id}::uuid
          `;
        }
      }

      return {
        ...this.mapPoll(poll),
        options,
      };
    });
  }

  // Link poll to a message
  async linkToMessage(pollId: string, messageId: string): Promise<void> {
    await prisma.$executeRaw`
      UPDATE bondarys.chat_polls SET message_id = ${messageId}::uuid WHERE id = ${pollId}::uuid
    `;
  }

  // Get poll by ID
  async getPoll(pollId: string, userId?: string): Promise<ChatPoll | null> {
    const pollResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_polls WHERE id = ${pollId}::uuid
    `;

    if (pollResult.length === 0) return null;

    const poll = pollResult[0];
    const options = await this.getPollOptions(pollId, poll.is_anonymous);
    const userVotes = userId ? await this.getUserVotes(pollId, userId) : [];

    return {
      ...this.mapPoll(poll),
      options,
      userVotes,
    };
  }

  // Get poll by message ID
  async getPollByMessage(messageId: string, userId?: string): Promise<ChatPoll | null> {
    const pollResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_polls WHERE message_id = ${messageId}::uuid
    `;

    if (pollResult.length === 0) return null;

    return this.getPoll(pollResult[0].id, userId);
  }

  // Get poll options
  private async getPollOptions(pollId: string, isAnonymous: boolean): Promise<ChatPollOption[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_poll_options WHERE poll_id = ${pollId}::uuid ORDER BY display_order
    `;

    const options = result.map(row => this.mapPollOption(row));

    // Get voters if not anonymous
    if (!isAnonymous) {
      for (const option of options) {
        const votersResult = await prisma.$queryRaw<any[]>`
          SELECT v.user_id, u.display_name
          FROM bondarys.chat_poll_votes v
          JOIN bondarys.users u ON v.user_id = u.id
          WHERE v.option_id = ${option.id}::uuid
          LIMIT 10
        `;
        option.voters = votersResult.map(v => ({
          userId: v.user_id,
          displayName: v.display_name,
        }));
      }
    }

    return options;
  }

  // Get user's votes
  private async getUserVotes(pollId: string, userId: string): Promise<string[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT option_id FROM bondarys.chat_poll_votes WHERE poll_id = ${pollId}::uuid AND user_id = ${userId}::uuid
    `;
    return result.map(r => r.option_id);
  }

  // Vote on a poll
  async vote(pollId: string, userId: string, optionIds: string[]): Promise<ChatPoll> {
    return await prisma.$transaction(async (tx) => {
      // Check if poll is open
      const poll = await tx.$queryRaw<any[]>`
        SELECT * FROM bondarys.chat_polls WHERE id = ${pollId}::uuid
      `;

      if (poll.length === 0) {
        throw new Error('Poll not found');
      }

      if (poll[0].is_closed) {
        throw new Error('Poll is closed');
      }

      if (poll[0].closes_at && new Date(poll[0].closes_at) < new Date()) {
        throw new Error('Poll has expired');
      }

      // For single-choice, remove existing votes
      if (poll[0].poll_type === 'single') {
        await tx.$executeRaw`
          DELETE FROM bondarys.chat_poll_votes WHERE poll_id = ${pollId}::uuid AND user_id = ${userId}::uuid
        `;
      }

      // Add votes
      for (const optionId of optionIds) {
        await tx.$executeRaw`
          INSERT INTO bondarys.chat_poll_votes (poll_id, option_id, user_id)
          VALUES (${pollId}::uuid, ${optionId}::uuid, ${userId}::uuid)
          ON CONFLICT (poll_id, option_id, user_id) DO NOTHING
        `;
      }

      return (await this.getPoll(pollId, userId))!;
    });
  }

  // Retract vote
  async retractVote(pollId: string, userId: string, optionId?: string): Promise<ChatPoll> {
    if (optionId) {
      await prisma.$executeRaw`
        DELETE FROM bondarys.chat_poll_votes 
        WHERE poll_id = ${pollId}::uuid AND user_id = ${userId}::uuid AND option_id = ${optionId}::uuid
      `;
    } else {
      await prisma.$executeRaw`
        DELETE FROM bondarys.chat_poll_votes WHERE poll_id = ${pollId}::uuid AND user_id = ${userId}::uuid
      `;
    }

    return (await this.getPoll(pollId, userId))!;
  }

  // Add option (if allowed)
  async addOption(pollId: string, userId: string, optionText: string): Promise<ChatPollOption> {
    const poll = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_polls WHERE id = ${pollId}::uuid
    `;

    if (poll.length === 0) {
      throw new Error('Poll not found');
    }

    if (!poll[0].allows_add_options) {
      throw new Error('Adding options is not allowed');
    }

    if (poll[0].is_closed) {
      throw new Error('Poll is closed');
    }

    // Get current max order
    const maxOrder = await prisma.$queryRaw<any[]>`
      SELECT MAX(display_order) as max_order FROM bondarys.chat_poll_options WHERE poll_id = ${pollId}::uuid
    `;

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_poll_options (poll_id, option_text, display_order, added_by)
      VALUES (${pollId}::uuid, ${optionText}, ${(maxOrder[0]?.max_order || 0) + 1}, ${userId}::uuid)
      RETURNING *
    `;

    return this.mapPollOption(result[0]);
  }

  // Close poll
  async closePoll(pollId: string, userId: string): Promise<ChatPoll> {
    const result = await prisma.$queryRaw<any[]>`
      UPDATE bondarys.chat_polls 
      SET is_closed = TRUE, updated_at = NOW()
      WHERE id = ${pollId}::uuid AND creator_id = ${userId}::uuid
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error('Poll not found or you are not the creator');
    }

    return (await this.getPoll(pollId))!;
  }

  // Delete poll
  async deletePoll(pollId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_polls WHERE id = ${pollId}::uuid AND creator_id = ${userId}::uuid
    `;
    return (result ?? 0) > 0;
  }

  // Get polls in a chat room
  async getChatPolls(chatRoomId: string, limit: number = 20): Promise<ChatPoll[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT id FROM bondarys.chat_polls 
      WHERE chat_room_id = ${chatRoomId}::uuid 
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    const polls: ChatPoll[] = [];
    for (const row of result) {
      const poll = await this.getPoll(row.id);
      if (poll) polls.push(poll);
    }

    return polls;
  }

  private mapPoll(row: any): ChatPoll {
    return {
      id: row.id,
      messageId: row.message_id,
      chatRoomId: row.chat_room_id,
      creatorId: row.creator_id,
      question: row.question,
      pollType: row.poll_type,
      isAnonymous: row.is_anonymous,
      allowsAddOptions: row.allows_add_options,
      closesAt: row.closes_at,
      isClosed: row.is_closed,
      totalVotes: row.total_votes || 0,
      correctOptionId: row.correct_option_id,
      options: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPollOption(row: any): ChatPollOption {
    return {
      id: row.id,
      pollId: row.poll_id,
      optionText: row.option_text,
      voteCount: row.vote_count || 0,
      addedBy: row.added_by,
      displayOrder: row.display_order,
      createdAt: row.created_at,
    };
  }
}

export const chatPollsService = new ChatPollsService();
