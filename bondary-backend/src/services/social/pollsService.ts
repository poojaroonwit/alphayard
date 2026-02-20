import { prisma } from '../../lib/prisma';
import { Prisma } from '../../../prisma/generated/prisma/client';

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  votesCount: number;
  percentage?: number;
  hasVoted?: boolean;
}

export interface Poll {
  id: string;
  postId: string;
  question: string;
  pollType: 'single' | 'multiple';
  allowAddOptions: boolean;
  isAnonymous: boolean;
  totalVotes: number;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  options: PollOption[];
  hasVoted?: boolean;
  myVotes?: string[];
  isExpired?: boolean;
}

export interface CreatePollInput {
  postId: string;
  question: string;
  options: string[];
  pollType?: 'single' | 'multiple';
  allowAddOptions?: boolean;
  isAnonymous?: boolean;
  endsAt?: Date;
}

export class PollsService {
  
  async createPoll(input: CreatePollInput): Promise<Poll> {
    return await prisma.$transaction(async (tx) => {
      const { postId, question, options, pollType = 'single', allowAddOptions = false, isAnonymous = false, endsAt } = input;
      
      // Create poll
      const pollResult = await tx.$queryRaw<any[]>`
        INSERT INTO bondarys.social_polls (post_id, question, poll_type, allow_add_options, is_anonymous, ends_at)
        VALUES (${postId}::uuid, ${question}, ${pollType}, ${allowAddOptions}, ${isAnonymous}, ${endsAt ? endsAt : null}::timestamptz)
        RETURNING *
      `;
      
      const poll = pollResult[0];
      
      // Create options
      const optionResults = [];
      for (let i = 0; i < options.length; i++) {
        const optionResult = await tx.$queryRaw<any[]>`
          INSERT INTO bondarys.social_poll_options (poll_id, option_text, sort_order)
          VALUES (${poll.id}::uuid, ${options[i]}, ${i})
          RETURNING *
        `;
        optionResults.push(optionResult[0]);
      }
      
      return this.mapPoll(poll, optionResults);
    });
  }

  async getPollByPostId(postId: string, userId?: string): Promise<Poll | null> {
    const pollResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.social_polls WHERE post_id = ${postId}::uuid
    `;
    
    if (pollResult.length === 0) return null;
    
    const poll = pollResult[0];
    
    // Get options
    const optionsResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.social_poll_options 
      WHERE poll_id = ${poll.id}::uuid 
      ORDER BY sort_order
    `;
    
    // Get user's votes if userId provided
    let myVotes: string[] = [];
    if (userId) {
      const votesResult = await prisma.$queryRaw<Array<{ option_id: string }>>`
        SELECT option_id FROM bondarys.social_poll_votes 
        WHERE poll_id = ${poll.id}::uuid AND user_id = ${userId}::uuid
      `;
      myVotes = votesResult.map(r => r.option_id);
    }
    
    return this.mapPollWithVotes(poll, optionsResult, myVotes);
  }

  async vote(pollId: string, userId: string, optionIds: string[]): Promise<Poll> {
    return await prisma.$transaction(async (tx) => {
      // Get poll details
      const pollResult = await tx.$queryRaw<any[]>`
        SELECT * FROM bondarys.social_polls WHERE id = ${pollId}::uuid
      `;
      
      if (pollResult.length === 0) {
        throw new Error('Poll not found');
      }
      
      const poll = pollResult[0];
      
      // Check if poll has expired
      if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
        throw new Error('Poll has expired');
      }
      
      // For single choice, remove existing votes first
      if (poll.poll_type === 'single') {
        await tx.$executeRaw`
          DELETE FROM bondarys.social_poll_votes 
          WHERE poll_id = ${pollId}::uuid AND user_id = ${userId}::uuid
        `;
      }
      
      // Add new votes
      for (const optionId of optionIds) {
        await tx.$executeRaw`
          INSERT INTO bondarys.social_poll_votes (poll_id, option_id, user_id)
          VALUES (${pollId}::uuid, ${optionId}::uuid, ${userId}::uuid)
          ON CONFLICT (poll_id, user_id, option_id) DO NOTHING
        `;
      }
      
      // Return updated poll
      return (await this.getPollByPostId(poll.post_id, userId))!;
    });
  }

  async removeVote(pollId: string, userId: string, optionId?: string): Promise<Poll> {
    if (optionId) {
      await prisma.$executeRaw`
        DELETE FROM bondarys.social_poll_votes 
        WHERE poll_id = ${pollId}::uuid AND user_id = ${userId}::uuid AND option_id = ${optionId}::uuid
      `;
    } else {
      await prisma.$executeRaw`
        DELETE FROM bondarys.social_poll_votes 
        WHERE poll_id = ${pollId}::uuid AND user_id = ${userId}::uuid
      `;
    }
    
    const pollResult = await prisma.$queryRaw<Array<{ post_id: string }>>`
      SELECT post_id FROM bondarys.social_polls WHERE id = ${pollId}::uuid
    `;
    
    return (await this.getPollByPostId(pollResult[0].post_id, userId))!;
  }

  async addOption(pollId: string, optionText: string, userId: string): Promise<PollOption> {
    // Verify poll allows adding options
    const pollResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.social_polls WHERE id = ${pollId}::uuid AND allow_add_options = true
    `;
    
    if (pollResult.length === 0) {
      throw new Error('Poll does not allow adding options');
    }
    
    // Get max sort order
    const maxOrder = await prisma.$queryRaw<Array<{ next_order: number }>>`
      SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order 
      FROM bondarys.social_poll_options WHERE poll_id = ${pollId}::uuid
    `;
    
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.social_poll_options (poll_id, option_text, sort_order)
      VALUES (${pollId}::uuid, ${optionText}, ${maxOrder[0].next_order})
      RETURNING *
    `;
    
    return this.mapOption(result[0]);
  }

  async getVoters(pollId: string, optionId: string, limit = 50, offset = 0): Promise<any[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.is_verified,
        pv.created_at as voted_at
      FROM bondarys.social_poll_votes pv
      JOIN core.users u ON pv.user_id = u.id
      WHERE pv.poll_id = ${pollId}::uuid AND pv.option_id = ${optionId}::uuid
      ORDER BY pv.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result;
  }

  async closePoll(postId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.social_polls 
      SET ends_at = NOW(), updated_at = NOW()
      WHERE post_id = ${postId}::uuid 
        AND EXISTS (
          SELECT 1 FROM bondarys.entities e 
          WHERE e.id = ${postId}::uuid AND e.owner_id = ${userId}::uuid
        )
    `;
    
    return (result as number) > 0;
  }

  async deletePoll(postId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.social_polls 
      WHERE post_id = ${postId}::uuid 
        AND EXISTS (
          SELECT 1 FROM bondarys.entities e 
          WHERE e.id = ${postId}::uuid AND e.owner_id = ${userId}::uuid
        )
    `;
    
    return (result as number) > 0;
  }

  private mapOption(row: any, totalVotes = 0, hasVoted = false): PollOption {
    return {
      id: row.id,
      pollId: row.poll_id,
      optionText: row.option_text,
      votesCount: row.votes_count || 0,
      percentage: totalVotes > 0 ? Math.round((row.votes_count || 0) / totalVotes * 100) : 0,
      hasVoted,
    };
  }

  private mapPoll(poll: any, options: any[]): Poll {
    return {
      id: poll.id,
      postId: poll.post_id,
      question: poll.question,
      pollType: poll.poll_type,
      allowAddOptions: poll.allow_add_options,
      isAnonymous: poll.is_anonymous,
      totalVotes: poll.total_votes || 0,
      endsAt: poll.ends_at,
      createdAt: poll.created_at,
      updatedAt: poll.updated_at,
      options: options.map(o => this.mapOption(o, poll.total_votes)),
      isExpired: poll.ends_at ? new Date(poll.ends_at) < new Date() : false,
    };
  }

  private mapPollWithVotes(poll: any, options: any[], myVotes: string[]): Poll {
    const totalVotes = poll.total_votes || 0;
    const hasVoted = myVotes.length > 0;
    
    return {
      id: poll.id,
      postId: poll.post_id,
      question: poll.question,
      pollType: poll.poll_type,
      allowAddOptions: poll.allow_add_options,
      isAnonymous: poll.is_anonymous,
      totalVotes,
      endsAt: poll.ends_at,
      createdAt: poll.created_at,
      updatedAt: poll.updated_at,
      options: options.map(o => this.mapOption(o, totalVotes, myVotes.includes(o.id))),
      hasVoted,
      myVotes,
      isExpired: poll.ends_at ? new Date(poll.ends_at) < new Date() : false,
    };
  }
}

export const pollsService = new PollsService();
export default pollsService;
