import { prisma } from '../../lib/prisma';
import { Prisma } from '../../../prisma/generated/prisma/client';

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  collectionName: string;
  notes?: string;
  createdAt: Date;
  post?: any; // Post object when populated
}

export interface BookmarkCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImage?: string;
  isPrivate: boolean;
  itemsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class BookmarksService {
  
  async bookmarkPost(userId: string, postId: string, options: {
    collectionName?: string;
    notes?: string;
  } = {}): Promise<Bookmark> {
    const { collectionName = 'Saved', notes } = options;
    
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.social_bookmarks (user_id, post_id, collection_name, notes)
      VALUES (${userId}::uuid, ${postId}::uuid, ${collectionName}, ${notes})
      ON CONFLICT (user_id, post_id) 
      DO UPDATE SET collection_name = ${collectionName}, notes = ${notes}
      RETURNING *
    `;
    
    return this.mapBookmark(result[0]);
  }

  async removeBookmark(userId: string, postId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.social_bookmarks 
      WHERE user_id = ${userId}::uuid AND post_id = ${postId}::uuid
    `;
    
    return (result as number) > 0;
  }

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT id FROM bondarys.social_bookmarks 
      WHERE user_id = ${userId}::uuid AND post_id = ${postId}::uuid
    `;
    
    return result.length > 0;
  }

  async getBookmarks(userId: string, options: {
    collectionName?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Bookmark[]> {
    const { collectionName, limit = 50, offset = 0 } = options;
    
    const conditions: Prisma.Sql[] = [
      Prisma.sql`b.user_id = ${userId}::uuid`
    ];
    
    if (collectionName) {
      conditions.push(Prisma.sql`b.collection_name = ${collectionName}`);
    }
    
    const whereClause = Prisma.join(conditions, ' AND ');
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        b.*,
        e.id as post_id,
        e.attributes as post_attributes,
        e.created_at as post_created_at,
        u.id as author_id,
        u.username as author_username,
        u.display_name as author_display_name,
        u.avatar_url as author_avatar_url,
        u.is_verified as author_is_verified
      FROM bondarys.social_bookmarks b
      JOIN bondarys.entities e ON b.post_id = e.id
      LEFT JOIN core.users u ON e.owner_id = u.id
      WHERE ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result.map(this.mapBookmarkWithPost);
  }

  async getBookmarksByPosts(userId: string, postIds: string[]): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();
    
    const result = await prisma.$queryRaw<Array<{ post_id: string }>>`
      SELECT post_id FROM bondarys.social_bookmarks 
      WHERE user_id = ${userId}::uuid AND post_id = ANY(${postIds}::uuid[])
    `;
    
    return new Set(result.map(r => r.post_id));
  }

  async getBookmarksCount(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count 
      FROM bondarys.social_bookmarks 
      WHERE user_id = ${userId}::uuid
    `;
    
    return Number(result[0].count);
  }

  // Collections
  async createCollection(userId: string, data: {
    name: string;
    description?: string;
    coverImage?: string;
    isPrivate?: boolean;
  }): Promise<BookmarkCollection> {
    const { name, description, coverImage, isPrivate = true } = data;
    
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.social_bookmark_collections (user_id, name, description, cover_image, is_private)
      VALUES (${userId}::uuid, ${name}, ${description}, ${coverImage}, ${isPrivate})
      RETURNING *
    `;
    
    return this.mapCollection(result[0]);
  }

  async updateCollection(collectionId: string, userId: string, data: {
    name?: string;
    description?: string;
    coverImage?: string;
    isPrivate?: boolean;
  }): Promise<BookmarkCollection | null> {
    const updates: Prisma.Sql[] = [];
    
    if (data.name !== undefined) {
      updates.push(Prisma.sql`name = ${data.name}`);
    }
    if (data.description !== undefined) {
      updates.push(Prisma.sql`description = ${data.description}`);
    }
    if (data.coverImage !== undefined) {
      updates.push(Prisma.sql`cover_image = ${data.coverImage}`);
    }
    if (data.isPrivate !== undefined) {
      updates.push(Prisma.sql`is_private = ${data.isPrivate}`);
    }
    
    if (updates.length === 0) return null;
    
    updates.push(Prisma.sql`updated_at = NOW()`);
    const setClause = Prisma.join(updates, ', ');
    
    const result = await prisma.$queryRaw<any[]>`
      UPDATE bondarys.social_bookmark_collections 
      SET ${setClause}
      WHERE id = ${collectionId}::uuid AND user_id = ${userId}::uuid
      RETURNING *
    `;
    
    return result.length > 0 ? this.mapCollection(result[0]) : null;
  }

  async deleteCollection(collectionId: string, userId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.social_bookmark_collections 
      WHERE id = ${collectionId}::uuid AND user_id = ${userId}::uuid
    `;
    
    return (result as number) > 0;
  }

  async getCollections(userId: string): Promise<BookmarkCollection[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT c.*,
        (SELECT COUNT(*) FROM bondarys.social_bookmarks WHERE user_id = c.user_id AND collection_name = c.name) as items_count
      FROM bondarys.social_bookmark_collections c
      WHERE c.user_id = ${userId}::uuid
      ORDER BY c.created_at DESC
    `;
    
    return result.map(this.mapCollection);
  }

  async moveBookmarkToCollection(userId: string, postId: string, collectionName: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.social_bookmarks 
      SET collection_name = ${collectionName}
      WHERE user_id = ${userId}::uuid AND post_id = ${postId}::uuid
    `;
    
    return (result as number) > 0;
  }

  private mapBookmark(row: any): Bookmark {
    return {
      id: row.id,
      userId: row.user_id,
      postId: row.post_id,
      collectionName: row.collection_name,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }

  private mapBookmarkWithPost(row: any): Bookmark {
    const bookmark = {
      id: row.id,
      userId: row.user_id,
      postId: row.post_id,
      collectionName: row.collection_name,
      notes: row.notes,
      createdAt: row.created_at,
      post: {
        id: row.post_id,
        ...row.post_attributes,
        createdAt: row.post_created_at,
        author: row.author_id ? {
          id: row.author_id,
          username: row.author_username,
          displayName: row.author_display_name,
          avatarUrl: row.author_avatar_url,
          isVerified: row.author_is_verified,
        } : null,
      },
    };
    
    return bookmark;
  }

  private mapCollection(row: any): BookmarkCollection {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      coverImage: row.cover_image,
      isPrivate: row.is_private,
      itemsCount: row.items_count || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const bookmarksService = new BookmarksService();
export default bookmarksService;
