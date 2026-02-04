import entityService from './EntityService';
import { Entity } from '@bondarys/shared';
import { pool } from '../config/database';

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
   * Analytics Stubs
   */
  async getCircleAnalytics(id: string) {
      return { membersCount: 0, postsCount: 0 };
  }

  /**
   * Invitation Management
   */
  async createInvitation(circleId: string, email: string, invitedBy: string, message: string = ''): Promise<any> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { rows } = await pool.query(
      `INSERT INTO circle_invitations (circle_id, email, invited_by, message, status, created_at, expires_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW(), $5)
       RETURNING id, circle_id as "circleId", email, invited_by as "invitedBy", message, status, created_at as "createdAt", expires_at as "expiresAt"`,
      [circleId, email, invitedBy, message, expiresAt]
    );
    return rows[0];
  }

  async getInvitations(circleId: string): Promise<any[]> {
    const { rows } = await pool.query(
      `SELECT fi.id, fi.circle_id as "circleId", fi.email, fi.invited_by as "invitedBy", 
              fi.message, fi.status, fi.created_at as "createdAt", fi.expires_at as "expiresAt",
              u.first_name as "firstName", u.last_name as "lastName"
       FROM circle_invitations fi 
       LEFT JOIN public.users u ON fi.invited_by = u.id 
       WHERE fi.circle_id = $1 
       ORDER BY fi.created_at DESC`,
      [circleId]
    );
    return rows;
  }

  async getInvitationById(id: string): Promise<any | null> {
    const { rows } = await pool.query(
        `SELECT fi.id, fi.circle_id as "circleId", fi.email, fi.invited_by as "invitedBy", 
                fi.message, fi.status, fi.created_at as "createdAt", fi.expires_at as "expiresAt",
                f.name as "circleName" 
         FROM circle_invitations fi 
         JOIN circles f ON fi.circle_id = f.id 
         WHERE fi.id = $1`,
        [id]
    );
    return rows[0] || null;
  }

  async updateInvitationStatus(id: string, status: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      'UPDATE circle_invitations SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
    return (rowCount ?? 0) > 0;
  }
}

export const circleService = new CircleService();
export default circleService;
