import { prisma } from '../../lib/prisma';
import { Prisma } from '../../../prisma/generated/prisma/client';

export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'celebrate' | 'support' | 'insightful';

export interface Reaction {
  id: string;
  postId?: string;
  commentId?: string;
  userId: string;
  reaction: ReactionType;
  createdAt: Date;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface ReactionCounts {
  like: number;
  love: number;
  laugh: number;
  wow: number;
  sad: number;
  angry: number;
  celebrate: number;
  support: number;
  insightful: number;
  total: number;
}

export class ReactionsService {
  
  async reactToPost(postId: string, userId: string, reaction: ReactionType): Promise<Reaction> {
    const result = await prisma.socialReaction.upsert({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
      create: {
        userId,
        postId,
        reactionType: reaction,
      },
      update: {
        reactionType: reaction,
      },
    });
    
    return this.mapReaction(result);
  }

  async removePostReaction(postId: string, userId: string): Promise<boolean> {
    const result = await prisma.socialReaction.deleteMany({
      where: {
        postId,
        userId,
      },
    });
    
    return result.count > 0;
  }

  async getPostReaction(postId: string, userId: string): Promise<ReactionType | null> {
    const reaction = await prisma.socialReaction.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
    
    return reaction ? (reaction.reactionType as ReactionType) : null;
  }

  async getPostReactions(postId: string, options: {
    reaction?: ReactionType;
    limit?: number;
    offset?: number;
  } = {}): Promise<Reaction[]> {
    const { reaction, limit = 50, offset = 0 } = options;
    
    const conditions: Prisma.Sql[] = [
      Prisma.sql`r.post_id = ${postId}::uuid`
    ];
    
    if (reaction) {
      conditions.push(Prisma.sql`r.reaction_type = ${reaction}`);
    }
    
    const whereClause = Prisma.join(conditions, ' AND ');
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        r.*,
        u.id as user_id, u.username, u.display_name, u.avatar_url
      FROM bondarys.social_reactions r
      JOIN core.users u ON r.user_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result.map(this.mapReactionWithUser);
  }

  async getPostReactionCounts(postId: string): Promise<ReactionCounts> {
    const result = await prisma.$queryRaw<Array<{
      like: bigint;
      love: bigint;
      laugh: bigint;
      wow: bigint;
      sad: bigint;
      angry: bigint;
      celebrate: bigint;
      support: bigint;
      insightful: bigint;
      total: bigint;
    }>>`
      SELECT 
        COALESCE(SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END), 0)::bigint as like,
        COALESCE(SUM(CASE WHEN reaction_type = 'love' THEN 1 ELSE 0 END), 0)::bigint as love,
        COALESCE(SUM(CASE WHEN reaction_type = 'laugh' THEN 1 ELSE 0 END), 0)::bigint as laugh,
        COALESCE(SUM(CASE WHEN reaction_type = 'wow' THEN 1 ELSE 0 END), 0)::bigint as wow,
        COALESCE(SUM(CASE WHEN reaction_type = 'sad' THEN 1 ELSE 0 END), 0)::bigint as sad,
        COALESCE(SUM(CASE WHEN reaction_type = 'angry' THEN 1 ELSE 0 END), 0)::bigint as angry,
        COALESCE(SUM(CASE WHEN reaction_type = 'celebrate' THEN 1 ELSE 0 END), 0)::bigint as celebrate,
        COALESCE(SUM(CASE WHEN reaction_type = 'support' THEN 1 ELSE 0 END), 0)::bigint as support,
        COALESCE(SUM(CASE WHEN reaction_type = 'insightful' THEN 1 ELSE 0 END), 0)::bigint as insightful,
        COUNT(*)::bigint as total
      FROM bondarys.social_reactions
      WHERE post_id = ${postId}::uuid
    `;
    
    const row = result[0];
    return {
      like: Number(row.like),
      love: Number(row.love),
      laugh: Number(row.laugh),
      wow: Number(row.wow),
      sad: Number(row.sad),
      angry: Number(row.angry),
      celebrate: Number(row.celebrate),
      support: Number(row.support),
      insightful: Number(row.insightful),
      total: Number(row.total),
    };
  }

  // Comment reactions
  async reactToComment(commentId: string, userId: string, reaction: ReactionType): Promise<Reaction> {
    const result = await prisma.socialReaction.upsert({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
      create: {
        userId,
        commentId,
        reactionType: reaction,
      },
      update: {
        reactionType: reaction,
      },
    });
    
    // Update comment likes count
    await prisma.$executeRaw`
      UPDATE bondarys.social_comments 
      SET reaction_count = (
        SELECT COUNT(*) FROM bondarys.social_reactions WHERE comment_id = ${commentId}::uuid
      )
      WHERE id = ${commentId}::uuid
    `;
    
    return this.mapReaction(result);
  }

  async removeCommentReaction(commentId: string, userId: string): Promise<boolean> {
    const result = await prisma.socialReaction.deleteMany({
      where: {
        commentId,
        userId,
      },
    });
    
    if (result.count > 0) {
      await prisma.$executeRaw`
        UPDATE bondarys.social_comments 
        SET reaction_count = GREATEST(reaction_count - 1, 0)
        WHERE id = ${commentId}::uuid
      `;
    }
    
    return result.count > 0;
  }

  async getCommentReaction(commentId: string, userId: string): Promise<ReactionType | null> {
    const reaction = await prisma.socialReaction.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });
    
    return reaction ? (reaction.reactionType as ReactionType) : null;
  }

  async getCommentReactions(commentId: string, limit = 50): Promise<Reaction[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        r.*,
        u.id as user_id, u.username, u.display_name, u.avatar_url
      FROM bondarys.social_reactions r
      JOIN core.users u ON r.user_id = u.id
      WHERE r.comment_id = ${commentId}::uuid
      ORDER BY r.created_at DESC
      LIMIT ${limit}
    `;
    
    return result.map(this.mapReactionWithUser);
  }

  // Get all reactions for multiple posts (for feed optimization)
  async getReactionsForPosts(postIds: string[], userId: string): Promise<Map<string, ReactionType>> {
    if (postIds.length === 0) return new Map();
    
    const result = await prisma.$queryRaw<Array<{ post_id: string; reaction_type: string }>>`
      SELECT post_id, reaction_type 
      FROM bondarys.social_reactions 
      WHERE post_id = ANY(${postIds}::uuid[]) AND user_id = ${userId}::uuid
    `;
    
    const map = new Map<string, ReactionType>();
    result.forEach(row => {
      map.set(row.post_id, row.reaction_type as ReactionType);
    });
    
    return map;
  }

  private mapReaction(row: any): Reaction {
    return {
      id: row.id,
      postId: row.postId || row.post_id,
      commentId: row.commentId || row.comment_id,
      userId: row.userId || row.user_id,
      reaction: (row.reactionType || row.reaction_type || row.reaction) as ReactionType,
      createdAt: row.createdAt || row.created_at,
    };
  }

  private mapReactionWithUser(row: any): Reaction {
    return {
      id: row.id,
      postId: row.postId || row.post_id,
      commentId: row.commentId || row.comment_id,
      userId: row.userId || row.user_id,
      reaction: (row.reactionType || row.reaction_type || row.reaction) as ReactionType,
      createdAt: row.createdAt || row.created_at,
      user: {
        id: row.user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      },
    };
  }
}

export const reactionsService = new ReactionsService();
export default reactionsService;
