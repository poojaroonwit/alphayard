import entityService from './EntityService';
import { Entity } from '@bondarys/shared';
import { pool } from '../config/database';

/**
 * Social Media Service - Refactored to use Unified Entity Service
 */
export class SocialMediaService {
  
  // POSTS
  async createPost(data: any): Promise<Entity> {
    const { circleId, circle_id, authorId, author_id, content, ...attributes } = data;
    
    const post = await entityService.createEntity({
      typeName: 'post',
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
    const queryFilters: any = { ...filters };
    if (circleId && circleId !== 'all') {
      queryFilters.circleId = circleId;
    }

    const result = await entityService.queryEntities('post', {
      limit: filters.limit || 50,
      page: (filters.offset / (filters.limit || 50)) + 1 || 1,
      filters: queryFilters,
      search: filters.search
    } as any);

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

  // ANALYTICS & REPORTS (stubs for now)
  async getReports(postId?: string) { return []; }
  async createReport(data: any) { return null; }
  async updateReportStatus(id: string, status: string, adminId: string) { return null; }
  async getActivities(postId: string) { return []; }
  async createActivity(data: any) { return null; }
  async likeComment(commentId: string, userId: string) { return null; }
  async unlikeComment(commentId: string, userId: string) { return null; }
  async getPostAnalytics(postId: string) { return { views: 0, likes: 0 }; }
  async getcircleAnalytics(circleId: string) { return { posts: 0, members: 0 }; }
}

export const socialMediaService = new SocialMediaService();
export default socialMediaService;
