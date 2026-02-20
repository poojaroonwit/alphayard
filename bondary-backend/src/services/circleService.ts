import entityService from './EntityService';
import { Entity } from '@/shared';
import { prisma } from '../lib/prisma';

/**
 * Circle Service - Refactored to use Unified Entity Service
 */
export class CircleService {

  async createCircle(data: any): Promise<Entity> {
    const { name, description, ownerId, owner_id, type = 'circle', ...other } = data;
    const resolvedOwnerId = ownerId || owner_id;
    
    // 1. Create the Circle entity
    const circle = await entityService.createEntity({
      typeName: 'circle',
      ownerId: resolvedOwnerId,
      attributes: {
        name,
        description,
        type,
        inviteCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        ...other
      }
    });

    // 2. Automatically make the owner a member
    if (resolvedOwnerId) {
        await entityService.createRelation(resolvedOwnerId, circle.id, 'member_of', { role: 'owner' });
    }

    return circle;
  }

  async getCircleById(id: string): Promise<Entity | null> {
    return entityService.getEntity(id);
  }

  async updateCircle(id: string, data: any): Promise<Entity | null> {
    return entityService.updateEntity(id, { attributes: data });
  }

  async deleteCircle(id: string): Promise<boolean> {
    return entityService.deleteEntity(id);
  }

  /**
   * Membership Management
   */
  async addMember(circleId: string, userId: string, role: string = 'member'): Promise<boolean> {
    return entityService.createRelation(userId, circleId, 'member_of', { role });
  }

  async removeMember(circleId: string, userId: string): Promise<boolean> {
    return entityService.deleteRelation(userId, circleId, 'member_of');
  }

  async getMembers(circleId: string): Promise<any[]> {
    return entityService.queryEntitiesByRelation(circleId, 'member_of');
  }

  async getCirclesForUser(userId: string): Promise<Entity[]> {
    return entityService.queryRelatedEntities(userId, 'member_of', 'circle');
  }

  /**
   * Circle Analytics - Real implementation
   */
  async getCircleAnalytics(id: string): Promise<{
    membersCount: number;
    postsCount: number;
    commentsCount: number;
    activeMembers: number;
    postsThisWeek: number;
    postsThisMonth: number;
    topContributors: Array<{ userId: string; name: string; postCount: number }>;
    activityTrend: Array<{ date: string; posts: number; comments: number }>;
  }> {
    try {
      // Get members count using Prisma
      const membersCount = await prisma.circleMember.count({
        where: { circleId: id }
      });

      // For complex queries, use $queryRaw
      const postsResult = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM unified_entities 
        WHERE type = 'social-posts' 
        AND data->>'circleId' = ${id}
        AND status != 'deleted'
      `;

      const commentsResult = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM unified_entities c
        JOIN unified_entities p ON c.data->>'postId' = p.id::text
        WHERE c.type = 'comment' 
        AND p.data->>'circleId' = ${id}
        AND c.status != 'deleted'
      `;

      const activeResult = await prisma.$queryRaw<any[]>`
        SELECT COUNT(DISTINCT owner_id) as count FROM unified_entities 
        WHERE type = 'social-posts' 
        AND data->>'circleId' = ${id}
        AND created_at > NOW() - INTERVAL '30 days'
        AND status != 'deleted'
      `;

      const weekResult = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM unified_entities 
        WHERE type = 'social-posts' 
        AND data->>'circleId' = ${id}
        AND created_at > NOW() - INTERVAL '7 days'
        AND status != 'deleted'
      `;

      const monthResult = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM unified_entities 
        WHERE type = 'social-posts' 
        AND data->>'circleId' = ${id}
        AND created_at > NOW() - INTERVAL '30 days'
        AND status != 'deleted'
      `;

      const topResult = await prisma.$queryRaw<any[]>`
        SELECT e.owner_id as user_id, 
               u.first_name, u.last_name,
               COUNT(*) as post_count
        FROM unified_entities e
        LEFT JOIN core.users u ON e.owner_id = u.id
        WHERE e.type = 'social-posts' 
        AND e.data->>'circleId' = ${id}
        AND e.status != 'deleted'
        GROUP BY e.owner_id, u.first_name, u.last_name
        ORDER BY post_count DESC
        LIMIT 5
      `;

      const trendResult = await prisma.$queryRaw<any[]>`
        WITH dates AS (
          SELECT generate_series(
            DATE(NOW() - INTERVAL '6 days'),
            DATE(NOW()),
            '1 day'::interval
          )::date as date
        ),
        post_counts AS (
          SELECT DATE(created_at) as date, COUNT(*) as posts
          FROM unified_entities
          WHERE type = 'social-posts' 
          AND data->>'circleId' = ${id}
          AND created_at > NOW() - INTERVAL '7 days'
          AND status != 'deleted'
          GROUP BY DATE(created_at)
        ),
        comment_counts AS (
          SELECT DATE(c.created_at) as date, COUNT(*) as comments
          FROM unified_entities c
          JOIN unified_entities p ON c.data->>'postId' = p.id::text
          WHERE c.type = 'comment'
          AND p.data->>'circleId' = ${id}
          AND c.created_at > NOW() - INTERVAL '7 days'
          AND c.status != 'deleted'
          GROUP BY DATE(c.created_at)
        )
        SELECT d.date::text, 
               COALESCE(p.posts, 0) as posts, 
               COALESCE(c.comments, 0) as comments
        FROM dates d
        LEFT JOIN post_counts p ON d.date = p.date
        LEFT JOIN comment_counts c ON d.date = c.date
        ORDER BY d.date
      `;

      return {
        membersCount,
        postsCount: parseInt(postsResult[0]?.count || '0'),
        commentsCount: parseInt(commentsResult[0]?.count || '0'),
        activeMembers: parseInt(activeResult[0]?.count || '0'),
        postsThisWeek: parseInt(weekResult[0]?.count || '0'),
        postsThisMonth: parseInt(monthResult[0]?.count || '0'),
        topContributors: topResult.map((row: any) => ({
          userId: row.user_id,
          name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown',
          postCount: parseInt(row.post_count),
        })),
        activityTrend: trendResult.map((row: any) => ({
          date: row.date,
          posts: parseInt(row.posts),
          comments: parseInt(row.comments),
        })),
      };
    } catch (error) {
      console.error('Error getting circle analytics:', error);
      return {
        membersCount: 0,
        postsCount: 0,
        commentsCount: 0,
        activeMembers: 0,
        postsThisWeek: 0,
        postsThisMonth: 0,
        topContributors: [],
        activityTrend: [],
      };
    }
  }

  /**
   * Invitation Management
   * Note: These use $queryRaw since circle_invitations may not be in the Prisma schema yet
   */
  async createInvitation(circleId: string, email: string, invitedBy: string, message: string = ''): Promise<any> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.circle_invitations (circle_id, email, invited_by, message, status, created_at, expires_at)
      VALUES (${circleId}::uuid, ${email}, ${invitedBy}::uuid, ${message}, 'pending', NOW(), ${expiresAt})
      RETURNING id, circle_id as "circleId", email, invited_by as "invitedBy", message, status, created_at as "createdAt", expires_at as "expiresAt"
    `;
    return rows[0];
  }

  async getPendingInvitationsForUser(email: string): Promise<any[]> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT fi.id, fi.circle_id as "circleId", fi.email, fi.invited_by as "invitedBy", 
              fi.message, fi.status, fi.created_at as "createdAt", fi.expires_at as "expiresAt",
              u.first_name as "firstName", u.last_name as "lastName",
              e.data->>'name' as "circleName", e.data->>'type' as "circleType"
       FROM bondarys.circle_invitations fi 
       LEFT JOIN core.users u ON fi.invited_by = u.id 
       LEFT JOIN public.unified_entities e ON fi.circle_id = e.id
       WHERE fi.email = ${email}
       AND fi.status = 'pending'
       ORDER BY fi.created_at DESC
    `;
    return rows;
  }

  async getInvitations(circleId: string): Promise<any[]> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT fi.id, fi.circle_id as "circleId", fi.email, fi.invited_by as "invitedBy", 
              fi.message, fi.status, fi.created_at as "createdAt", fi.expires_at as "expiresAt",
              u.first_name as "firstName", u.last_name as "lastName"
       FROM bondarys.circle_invitations fi 
       LEFT JOIN core.users u ON fi.invited_by = u.id 
       WHERE fi.circle_id = ${circleId}::uuid
       ORDER BY fi.created_at DESC
    `;
    return rows;
  }

  async getInvitationById(id: string): Promise<any | null> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT fi.id, fi.circle_id as "circleId", fi.email, fi.invited_by as "invitedBy", 
              fi.message, fi.status, fi.created_at as "createdAt", fi.expires_at as "expiresAt",
              c.name as "circleName" 
       FROM bondarys.circle_invitations fi 
       JOIN bondarys.circles c ON fi.circle_id = c.id 
       WHERE fi.id = ${id}::uuid
    `;
    return rows[0] || null;
  }

  async updateInvitationStatus(id: string, status: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.circle_invitations SET status = ${status}, updated_at = NOW() WHERE id = ${id}::uuid
    `;
    return result > 0;
  }
}

export const circleService = new CircleService();
export default circleService;
