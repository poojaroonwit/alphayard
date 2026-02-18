import entityService from './EntityService';
import { Entity } from '@/shared';
import { prisma } from '../lib/prisma';
import { getAppKitApplicationId } from '../utils/appHelper';
import { Prisma } from '@prisma/client';

/**
 * Social Media Service - Refactored to use Unified Entity Service
 */
export class SocialMediaService {
  
  // POSTS
  async createPost(data: any): Promise<Entity> {
    const { circleId, circle_id, authorId, author_id, content, ...attributes } = data;
    
    // Get Bondary application ID (cached via Redis)
    const applicationId = await getAppKitApplicationId();
    
    const post = await entityService.createEntity({
      typeName: 'social-posts',
      applicationId,
      ownerId: authorId || author_id,
      attributes: {
        circleId: circleId || circle_id,
        content,
        ...attributes
      }
    });

    return post;
  }

  async getPosts(circleId?: string, filters: any = {}): Promise<Entity[]> {
    // Start with a clean filters object, excluding circleId from the spread
    const { circleId: filterCircleId, ...restFilters } = filters;
    const queryFilters: any = { ...restFilters };
    
    // Only filter by circleId if explicitly provided and not 'all'
    // This allows showing all posts when circleId is undefined or 'all'
    if (circleId && circleId !== 'all') {
      queryFilters.circleId = circleId;
    }
    // If circleId is undefined or 'all', don't add it to queryFilters, so all posts are returned

    // Get Bondary application ID (cached via Redis)
    const applicationId = await getAppKitApplicationId();

    // Fix page calculation - handle undefined offset
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const page = Math.floor(offset / limit) + 1;

    console.log('[SocialMediaService] Querying posts - applicationId:', applicationId, 'circleId:', circleId, 'filters:', queryFilters);
    
    const result = await entityService.queryEntities('social-posts', {
      applicationId,
      limit,
      page,
      filters: queryFilters,
      search: filters.search
    } as any);

    console.log('[SocialMediaService] Query result - total:', result.total, 'entities:', result.entities.length);
    
    return result.entities;
  }

  async getPostById(id: string): Promise<Entity | null> {
    return entityService.getEntity(id);
  }

  async updatePost(id: string, data: any): Promise<Entity | null> {
    return entityService.updateEntity(id, { attributes: data });
  }

  async deletePost(id: string): Promise<boolean> {
    return entityService.deleteEntity(id);
  }

  // FAMILIES (= Circles)
  async getFamilies(): Promise<Entity[]> {
    const result = await entityService.queryEntities('circle');
    return result.entities;
  }

  // COMMENTS
  async createComment(data: any): Promise<Entity> {
    const { authorId, author_id, postId, post_id, ...attributes } = data;
    return entityService.createEntity({
      typeName: 'comment',
      ownerId: authorId || author_id,
      attributes: {
        postId: postId || post_id,
        ...attributes
      }
    });
  }

  async getComments(postId: string): Promise<Entity[]> {
    const result = await entityService.queryEntities('comment', {
      filters: { postId: postId }
    });
    return result.entities;
  }

  async deleteComment(id: string): Promise<boolean> {
    return entityService.deleteEntity(id);
  }

  // LIKES (using relations)
  async likePost(postId: string, userId: string): Promise<boolean> {
    return entityService.createRelation(userId, postId, 'liked');
  }

  async unlikePost(postId: string, userId: string): Promise<boolean> {
    return entityService.deleteRelation(userId, postId, 'liked');
  }

  // REPORTS - Content moderation reports
  async getReports(postId?: string): Promise<any[]> {
    try {
      const query = postId
        ? Prisma.sql`
          SELECT r.*, 
                 u.first_name as reporter_first_name, u.last_name as reporter_last_name,
                 e.attributes->>'content' as post_content
          FROM bondarys.social_reports r
          LEFT JOIN core.users u ON r.reporter_id = u.id
          LEFT JOIN bondarys.entities e ON r.post_id = e.id::text
          WHERE r.post_id = ${postId}
          ORDER BY r.created_at DESC
        `
        : Prisma.sql`
          SELECT r.*, 
                 u.first_name as reporter_first_name, u.last_name as reporter_last_name,
                 e.attributes->>'content' as post_content
          FROM bondarys.social_reports r
          LEFT JOIN core.users u ON r.reporter_id = u.id
          LEFT JOIN bondarys.entities e ON r.post_id = e.id::text
          ORDER BY r.created_at DESC
        `;
      
      const result = await prisma.$queryRaw<any[]>(query);
      return result.map(row => ({
        id: row.id,
        postId: row.post_id,
        reporterId: row.reporter_id,
        reporterName: `${row.reporter_first_name || ''} ${row.reporter_last_name || ''}`.trim(),
        reason: row.reason,
        description: row.description,
        status: row.status,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        postContent: row.post_content,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Error getting reports:', error);
      return [];
    }
  }

  async createReport(data: { postId: string; reporterId: string; reason: string; description?: string }): Promise<any> {
    try {
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO bondarys.social_reports (post_id, reporter_id, reason, description, status, created_at)
        VALUES (${data.postId}, ${data.reporterId}, ${data.reason}, ${data.description || null}, 'pending', NOW())
        RETURNING *
      `;
      
      return result[0] || null;
    } catch (error) {
      console.error('Error creating report:', error);
      return null;
    }
  }

  async updateReportStatus(id: string, status: string, adminId: string): Promise<any> {
    try {
      const result = await prisma.$queryRaw<any[]>`
        UPDATE bondarys.social_reports 
        SET status = ${status}, reviewed_by = ${adminId}, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating report status:', error);
      return null;
    }
  }

  // ACTIVITIES - Post activity tracking (views, shares, etc.)
  async getActivities(postId: string): Promise<any[]> {
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT a.*, u.first_name, u.last_name, u.avatar_url as avatar
        FROM bondarys.social_activities a
        LEFT JOIN core.users u ON a.user_id = u.id
        WHERE a.post_id = ${postId}
        ORDER BY a.created_at DESC
        LIMIT 100
      `;
      
      return result.map(row => ({
        id: row.id,
        postId: row.post_id,
        userId: row.user_id,
        userName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        userAvatar: row.avatar,
        activityType: row.activity_type,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }

  async createActivity(data: { postId: string; userId: string; activityType: string; metadata?: any }): Promise<any> {
    try {
      const metadataJson = data.metadata ? JSON.stringify(data.metadata) : null;
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO bondarys.social_activities (post_id, user_id, activity_type, metadata, created_at)
        VALUES (${data.postId}, ${data.userId}, ${data.activityType}, ${metadataJson}::jsonb, NOW())
        RETURNING *
      `;
      
      return result[0] || null;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  // COMMENT LIKES
  async likeComment(commentId: string, userId: string): Promise<boolean> {
    try {
      await prisma.$executeRaw`
        INSERT INTO bondarys.social_comment_likes (comment_id, user_id, created_at)
        VALUES (${commentId}, ${userId}, NOW())
        ON CONFLICT (comment_id, user_id) DO NOTHING
      `;
      return true;
    } catch (error) {
      console.error('Error liking comment:', error);
      return false;
    }
  }

  async unlikeComment(commentId: string, userId: string): Promise<boolean> {
    try {
      await prisma.$executeRaw`
        DELETE FROM bondarys.social_comment_likes 
        WHERE comment_id = ${commentId} AND user_id = ${userId}
      `;
      return true;
    } catch (error) {
      console.error('Error unliking comment:', error);
      return false;
    }
  }

  // POST ANALYTICS
  async getPostAnalytics(postId: string): Promise<{ views: number; likes: number; comments: number; shares: number }> {
    try {
      // Get view count from activities
      const viewsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.social_activities 
        WHERE post_id = ${postId} AND activity_type = 'view'
      `;
      
      // Get likes count from entity relations
      const likesResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.entity_relations 
        WHERE target_id = ${postId} AND relation_type = 'liked'
      `;
      
      // Get comments count
      const commentsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.entities 
        WHERE type_name = 'comment' AND attributes->>'postId' = ${postId} AND deleted_at IS NULL
      `;
      
      // Get shares count
      const sharesResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.social_activities 
        WHERE post_id = ${postId} AND activity_type = 'share'
      `;
      
      return {
        views: Number(viewsResult[0]?.count || 0),
        likes: Number(likesResult[0]?.count || 0),
        comments: Number(commentsResult[0]?.count || 0),
        shares: Number(sharesResult[0]?.count || 0),
      };
    } catch (error) {
      console.error('Error getting post analytics:', error);
      return { views: 0, likes: 0, comments: 0, shares: 0 };
    }
  }

  // CIRCLE ANALYTICS
  async getCircleAnalytics(circleId: string): Promise<{ 
    posts: number; 
    members: number; 
    totalLikes: number;
    totalComments: number;
    activeUsers: number;
    postsThisWeek: number;
  }> {
    try {
      // Get posts count for circle
      const postsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.entities 
        WHERE type_name = 'social-posts' 
        AND attributes->>'circleId' = ${circleId} 
        AND deleted_at IS NULL
      `;
      
      // Get members count
      const membersResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.circle_members 
        WHERE circle_id = ${circleId}
      `;
      
      // Get total likes on circle posts
      const likesResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.entity_relations er
        JOIN bondarys.entities e ON er.target_id = e.id::text
        WHERE e.type_name = 'social-posts' 
        AND e.attributes->>'circleId' = ${circleId}
        AND er.relation_type = 'liked'
      `;
      
      // Get total comments on circle posts
      const commentsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.entities c
        JOIN bondarys.entities p ON c.attributes->>'postId' = p.id::text
        WHERE c.type_name = 'comment' 
        AND p.attributes->>'circleId' = ${circleId}
        AND c.deleted_at IS NULL
      `;
      
      // Get active users (posted in last 30 days)
      const activeResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT owner_id)::int as count FROM bondarys.entities 
        WHERE type_name = 'social-posts' 
        AND attributes->>'circleId' = ${circleId} 
        AND created_at > NOW() - INTERVAL '30 days'
        AND deleted_at IS NULL
      `;
      
      // Get posts this week
      const weekPostsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::int as count FROM bondarys.entities 
        WHERE type_name = 'social-posts' 
        AND attributes->>'circleId' = ${circleId} 
        AND created_at > NOW() - INTERVAL '7 days'
        AND deleted_at IS NULL
      `;
      
      return {
        posts: Number(postsResult[0]?.count || 0),
        members: Number(membersResult[0]?.count || 0),
        totalLikes: Number(likesResult[0]?.count || 0),
        totalComments: Number(commentsResult[0]?.count || 0),
        activeUsers: Number(activeResult[0]?.count || 0),
        postsThisWeek: Number(weekPostsResult[0]?.count || 0),
      };
    } catch (error) {
      console.error('Error getting circle analytics:', error);
      return { posts: 0, members: 0, totalLikes: 0, totalComments: 0, activeUsers: 0, postsThisWeek: 0 };
    }
  }

  // Record post view
  async recordPostView(postId: string, userId: string): Promise<void> {
    try {
      // Only record one view per user per day
      await prisma.$executeRaw`
        INSERT INTO bondarys.social_activities (post_id, user_id, activity_type, created_at)
        SELECT ${postId}, ${userId}, 'view', NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM bondarys.social_activities 
          WHERE post_id = ${postId} AND user_id = ${userId} AND activity_type = 'view'
          AND created_at > NOW() - INTERVAL '1 day'
        )
      `;
    } catch (error) {
      console.error('Error recording post view:', error);
    }
  }

  // Record post share
  async recordPostShare(postId: string, userId: string, platform?: string): Promise<void> {
    try {
      const metadataJson = platform ? JSON.stringify({ platform }) : null;
      await prisma.$executeRaw`
        INSERT INTO bondarys.social_activities (post_id, user_id, activity_type, metadata, created_at)
        VALUES (${postId}, ${userId}, 'share', ${metadataJson}::jsonb, NOW())
      `;
    } catch (error) {
      console.error('Error recording post share:', error);
    }
  }
}

export const socialMediaService = new SocialMediaService();
export default socialMediaService;
