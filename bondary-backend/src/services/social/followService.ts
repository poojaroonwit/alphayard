import { prisma } from '../../lib/prisma';
import { Prisma } from '../../../prisma/generated/prisma/client';

export interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isCloseFriend?: boolean;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: Date;
  sender?: FollowUser;
  receiver?: FollowUser;
}

export class FollowService {
  
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }
    
    await prisma.$executeRaw`
      INSERT INTO bondarys.user_follows (follower_id, following_id, status)
      VALUES (${followerId}::uuid, ${followingId}::uuid, 'active')
      ON CONFLICT (follower_id, following_id) 
      DO UPDATE SET status = 'active', updated_at = NOW()
    `;
    
    return true;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await prisma.userFollow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });
    
    return result.count > 0;
  }

  async getFollowStatus(userId: string, targetId: string): Promise<{
    isFollowing: boolean;
    isFollowedBy: boolean;
    isCloseFriend: boolean;
    isMuted: boolean;
    isBlocked: boolean;
  }> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        (SELECT status FROM bondarys.user_follows WHERE follower_id = ${userId}::uuid AND following_id = ${targetId}::uuid) as following_status,
        (SELECT is_close_friend FROM bondarys.user_follows WHERE follower_id = ${userId}::uuid AND following_id = ${targetId}::uuid) as is_close_friend,
        (SELECT status FROM bondarys.user_follows WHERE follower_id = ${targetId}::uuid AND following_id = ${userId}::uuid) as followed_by_status
    `;
    
    const row = result[0];
    return {
      isFollowing: row?.following_status === 'active',
      isFollowedBy: row?.followed_by_status === 'active',
      isCloseFriend: row?.is_close_friend || false,
      isMuted: row?.following_status === 'muted',
      isBlocked: row?.following_status === 'blocked',
    };
  }

  async getFollowers(userId: string, options: {
    limit?: number;
    offset?: number;
    viewerId?: string;
  } = {}): Promise<FollowUser[]> {
    const { limit = 50, offset = 0, viewerId } = options;
    
    const viewerCondition = viewerId 
      ? Prisma.sql`EXISTS(SELECT 1 FROM bondarys.user_follows WHERE follower_id = ${viewerId}::uuid AND following_id = u.id AND status = 'active') as viewer_is_following`
      : Prisma.sql`false as viewer_is_following`;
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.is_verified,
        u.followers_count, u.following_count,
        uf.is_close_friend,
        ${viewerCondition}
      FROM bondarys.user_follows uf
      JOIN core.users u ON uf.follower_id = u.id
      WHERE uf.following_id = ${userId}::uuid AND uf.status = 'active'
      ORDER BY uf.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result.map(this.mapUser);
  }

  async getFollowing(userId: string, options: {
    limit?: number;
    offset?: number;
    viewerId?: string;
  } = {}): Promise<FollowUser[]> {
    const { limit = 50, offset = 0, viewerId } = options;
    
    const viewerCondition = viewerId 
      ? Prisma.sql`EXISTS(SELECT 1 FROM bondarys.user_follows WHERE follower_id = ${viewerId}::uuid AND following_id = u.id AND status = 'active') as viewer_is_following`
      : Prisma.sql`false as viewer_is_following`;
    
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.is_verified,
        u.followers_count, u.following_count,
        uf.is_close_friend,
        ${viewerCondition}
      FROM bondarys.user_follows uf
      JOIN core.users u ON uf.following_id = u.id
      WHERE uf.follower_id = ${userId}::uuid AND uf.status = 'active'
      ORDER BY uf.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return result.map(this.mapUser);
  }

  async getFollowersCount(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count 
      FROM bondarys.user_follows 
      WHERE following_id = ${userId}::uuid AND status = 'active'
    `;
    
    return Number(result[0].count);
  }

  async getFollowingCount(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count 
      FROM bondarys.user_follows 
      WHERE follower_id = ${userId}::uuid AND status = 'active'
    `;
    
    return Number(result[0].count);
  }

  async setCloseFriend(userId: string, targetId: string, isCloseFriend: boolean): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.user_follows 
      SET is_close_friend = ${isCloseFriend}, updated_at = NOW()
      WHERE follower_id = ${userId}::uuid AND following_id = ${targetId}::uuid
    `;
    
    return (result as number) > 0;
  }

  async muteUser(userId: string, targetId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.user_follows 
      SET status = 'muted', updated_at = NOW()
      WHERE follower_id = ${userId}::uuid AND following_id = ${targetId}::uuid
    `;
    
    return (result as number) > 0;
  }

  async unmuteUser(userId: string, targetId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      UPDATE bondarys.user_follows 
      SET status = 'active', updated_at = NOW()
      WHERE follower_id = ${userId}::uuid AND following_id = ${targetId}::uuid AND status = 'muted'
    `;
    
    return (result as number) > 0;
  }

  async blockUser(userId: string, targetId: string): Promise<boolean> {
    // Block in both directions
    await prisma.$executeRaw`
      INSERT INTO bondarys.user_follows (follower_id, following_id, status)
      VALUES (${userId}::uuid, ${targetId}::uuid, 'blocked')
      ON CONFLICT (follower_id, following_id) 
      DO UPDATE SET status = 'blocked', updated_at = NOW()
    `;
    
    // Remove their follow if exists
    await prisma.$executeRaw`
      DELETE FROM bondarys.user_follows 
      WHERE follower_id = ${targetId}::uuid AND following_id = ${userId}::uuid
    `;
    
    return true;
  }

  async unblockUser(userId: string, targetId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.user_follows 
      WHERE follower_id = ${userId}::uuid AND following_id = ${targetId}::uuid AND status = 'blocked'
    `;
    
    return (result as number) > 0;
  }

  async getCloseFriends(userId: string): Promise<FollowUser[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.is_verified,
        u.followers_count, u.following_count,
        true as is_close_friend
      FROM bondarys.user_follows uf
      JOIN core.users u ON uf.following_id = u.id
      WHERE uf.follower_id = ${userId}::uuid AND uf.is_close_friend = true AND uf.status = 'active'
      ORDER BY u.display_name
    `;
    
    return result.map(this.mapUser);
  }

  async getMutualFollowers(userId: string, targetId: string, limit = 10): Promise<FollowUser[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id, u.username, u.display_name, u.avatar_url, u.is_verified,
        u.followers_count, u.following_count
      FROM bondarys.user_follows uf1
      JOIN bondarys.user_follows uf2 ON uf1.follower_id = uf2.follower_id
      JOIN core.users u ON uf1.follower_id = u.id
      WHERE uf1.following_id = ${userId}::uuid AND uf2.following_id = ${targetId}::uuid
        AND uf1.status = 'active' AND uf2.status = 'active'
        AND uf1.follower_id != ${userId}::uuid AND uf1.follower_id != ${targetId}::uuid
      LIMIT ${limit}
    `;
    
    return result.map(this.mapUser);
  }

  // Friend Requests
  async sendFriendRequest(senderId: string, receiverId: string, message?: string): Promise<FriendRequest> {
    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }
    
    const result = await prisma.friendRequest.upsert({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId,
        },
      },
      create: {
        senderId,
        receiverId,
        message,
        status: 'pending',
      },
      update: {
        status: 'pending',
        message,
      },
    });
    
    return this.mapFriendRequest(result);
  }

  async acceptFriendRequest(requestId: string, userId: string): Promise<boolean> {
    return await prisma.$transaction(async (tx) => {
      // Update request status
      const request = await tx.friendRequest.updateMany({
        where: {
          id: requestId,
          receiverId: userId,
          status: 'pending',
        },
        data: {
          status: 'accepted',
          respondedAt: new Date(),
        },
      });
      
      if (request.count === 0) {
        return false;
      }
      
      const friendRequest = await tx.friendRequest.findUnique({
        where: { id: requestId },
      });
      
      if (!friendRequest) {
        return false;
      }
      
      const { senderId, receiverId } = friendRequest;
      
      // Create mutual follows
      await tx.$executeRaw`
        INSERT INTO bondarys.user_follows (follower_id, following_id, status)
        VALUES (${senderId}::uuid, ${receiverId}::uuid, 'active'), (${receiverId}::uuid, ${senderId}::uuid, 'active')
        ON CONFLICT (follower_id, following_id) 
        DO UPDATE SET status = 'active', updated_at = NOW()
      `;
      
      return true;
    });
  }

  async rejectFriendRequest(requestId: string, userId: string): Promise<boolean> {
    const result = await prisma.friendRequest.updateMany({
      where: {
        id: requestId,
        receiverId: userId,
        status: 'pending',
      },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
      },
    });
    
    return result.count > 0;
  }

  async cancelFriendRequest(requestId: string, userId: string): Promise<boolean> {
    const result = await prisma.friendRequest.updateMany({
      where: {
        id: requestId,
        senderId: userId,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
      },
    });
    
    return result.count > 0;
  }

  async getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        fr.*,
        sender.id as sender_id, sender.username as sender_username, 
        sender.display_name as sender_display_name, sender.avatar_url as sender_avatar_url,
        sender.is_verified as sender_is_verified, sender.followers_count as sender_followers_count,
        sender.following_count as sender_following_count
      FROM bondarys.friend_requests fr
      JOIN core.users sender ON fr.sender_id = sender.id
      WHERE fr.receiver_id = ${userId}::uuid AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;
    
    return result.map(row => this.mapFriendRequestWithUsers(row));
  }

  async getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        fr.*,
        receiver.id as receiver_id, receiver.username as receiver_username, 
        receiver.display_name as receiver_display_name, receiver.avatar_url as receiver_avatar_url,
        receiver.is_verified as receiver_is_verified, receiver.followers_count as receiver_followers_count,
        receiver.following_count as receiver_following_count
      FROM bondarys.friend_requests fr
      JOIN core.users receiver ON fr.receiver_id = receiver.id
      WHERE fr.sender_id = ${userId}::uuid AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `;
    
    return result.map(row => this.mapFriendRequestWithUsers(row, false));
  }

  async getSuggestedUsers(userId: string, limit = 20): Promise<FollowUser[]> {
    // Get users that friends follow but you don't
    const result = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT
        u.id, u.username, u.display_name, u.avatar_url, u.is_verified,
        u.followers_count, u.following_count,
        COUNT(DISTINCT mutual.follower_id) as mutual_friends_count
      FROM core.users u
      LEFT JOIN bondarys.user_follows mutual ON mutual.following_id = u.id
        AND mutual.follower_id IN (
          SELECT following_id FROM bondarys.user_follows WHERE follower_id = ${userId}::uuid AND status = 'active'
        )
      WHERE u.id != ${userId}::uuid
        AND NOT EXISTS (
          SELECT 1 FROM bondarys.user_follows WHERE follower_id = ${userId}::uuid AND following_id = u.id
        )
        AND u.is_verified = false
      GROUP BY u.id
      ORDER BY mutual_friends_count DESC, u.followers_count DESC
      LIMIT ${limit}
    `;
    
    return result.map(this.mapUser);
  }

  private mapUser(row: any): FollowUser {
    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      isVerified: row.is_verified,
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
      isFollowing: row.viewer_is_following || false,
      isCloseFriend: row.is_close_friend || false,
    };
  }

  private mapFriendRequest(row: any): FriendRequest {
    return {
      id: row.id,
      senderId: row.senderId || row.sender_id,
      receiverId: row.receiverId || row.receiver_id,
      status: row.status,
      message: row.message,
      createdAt: row.createdAt || row.created_at,
    };
  }

  private mapFriendRequestWithUsers(row: any, includeSender = true): FriendRequest {
    const request = this.mapFriendRequest(row);
    
    if (includeSender) {
      request.sender = {
        id: row.sender_id,
        username: row.sender_username,
        displayName: row.sender_display_name,
        avatarUrl: row.sender_avatar_url,
        isVerified: row.sender_is_verified,
        followersCount: row.sender_followers_count || 0,
        followingCount: row.sender_following_count || 0,
      };
    } else {
      request.receiver = {
        id: row.receiver_id,
        username: row.receiver_username,
        displayName: row.receiver_display_name,
        avatarUrl: row.receiver_avatar_url,
        isVerified: row.receiver_is_verified,
        followersCount: row.receiver_followers_count || 0,
        followingCount: row.receiver_following_count || 0,
      };
    }
    
    return request;
  }
}

export const followService = new FollowService();
export default followService;
