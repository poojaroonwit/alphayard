import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:4000/api';

export interface Circle {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
}

export interface SocialPost {
  id: string;
  circleId: string;
  authorId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'event';
  mediaUrls?: string[];
  tags?: string[];
  location?: string;
  visibility: 'public' | 'circle' | 'friends';
  status: 'active' | 'hidden' | 'deleted' | 'under_review';
  likesCount: number;
  sharesCount: number;
  commentsCount: number;
  viewsCount: number;
  isHidden: boolean;
  isDeleted: boolean;
  isReported: boolean;
  reportCount: number;
  lastReportedAt?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  circle?: {
    id: string;
    name: string;
  };
}

export interface SocialComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likesCount: number;
  isHidden: boolean;
  isReported: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface SocialReport {
  id: string;
  postId: string;
  reporterId: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'violence' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  reporter?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface SocialActivity {
  id: string;
  postId: string;
  userId: string;
  action: 'like' | 'share' | 'comment' | 'view';
  details?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface PostFilters {
  circleId?: string;
  status?: string;
  type?: string;
  reported?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PostAnalytics {
  likes: number;
  shares: number;
  comments: number;
  views: number;
  engagementRate: number;
}

export interface CircleAnalytics {
  totalPosts: number;
  activePosts: number;
  reportedPosts: number;
  totalEngagement: number;
}

export const socialMediaService = {
  // =============================================
  // FAMILIES
  // =============================================

  async getFamilies(): Promise<Circle[]> {
    try {
      const response = await axios.get(`${API_BASE}/social/families`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching families:', error);
      throw error;
    }
  },

  // =============================================
  // SOCIAL POSTS
  // =============================================

  async getPosts(filters?: PostFilters): Promise<SocialPost[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.circleId) params.append('circleId', filters.circleId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.reported !== undefined) params.append('reported', filters.reported.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await axios.get(`${API_BASE}/social/posts?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  async getPostById(postId: string): Promise<SocialPost> {
    try {
      const response = await axios.get(`${API_BASE}/social/posts/${postId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  async createPost(postData: {
    circleId: string;
    content: string;
    type?: 'text' | 'image' | 'video' | 'event';
    mediaUrls?: string[];
    tags?: string[];
    location?: string;
    visibility?: 'public' | 'circle' | 'friends';
  }): Promise<SocialPost> {
    try {
      const response = await axios.post(`${API_BASE}/social/posts`, postData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async updatePost(postId: string, updates: {
    content?: string;
    status?: 'active' | 'hidden' | 'deleted' | 'under_review';
    isHidden?: boolean;
    isDeleted?: boolean;
  }): Promise<SocialPost> {
    try {
      const response = await axios.put(`${API_BASE}/social/posts/${postId}`, updates);
      return response.data.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  async deletePost(postId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/social/posts/${postId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // =============================================
  // SOCIAL COMMENTS
  // =============================================

  async getComments(postId: string): Promise<SocialComment[]> {
    try {
      const response = await axios.get(`${API_BASE}/social/posts/${postId}/comments`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  async createComment(postId: string, content: string): Promise<SocialComment> {
    try {
      const response = await axios.post(`${API_BASE}/social/posts/${postId}/comments`, {
        content
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/social/comments/${commentId}`);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  // =============================================
  // SOCIAL REPORTS
  // =============================================

  async getReports(postId?: string): Promise<SocialReport[]> {
    try {
      const params = postId ? `?postId=${postId}` : '';
      const response = await axios.get(`${API_BASE}/social/reports${params}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  async createReport(reportData: {
    postId: string;
    reason: 'spam' | 'inappropriate' | 'harassment' | 'violence' | 'other';
    description?: string;
  }): Promise<SocialReport> {
    try {
      const response = await axios.post(`${API_BASE}/social/reports`, reportData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  },

  async updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'): Promise<SocialReport> {
    try {
      const response = await axios.put(`${API_BASE}/social/reports/${reportId}/status`, {
        status
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  },

  // =============================================
  // SOCIAL ACTIVITIES
  // =============================================

  async getActivities(postId: string): Promise<SocialActivity[]> {
    try {
      const response = await axios.get(`${API_BASE}/social/posts/${postId}/activities`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  async createActivity(postId: string, action: 'like' | 'share' | 'comment' | 'view', details?: string): Promise<SocialActivity> {
    try {
      const response = await axios.post(`${API_BASE}/social/posts/${postId}/activities`, {
        action,
        details
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  // =============================================
  // LIKES
  // =============================================

  async likePost(postId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE}/social/posts/${postId}/like`);
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  async unlikePost(postId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/social/posts/${postId}/like`);
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  async likeComment(commentId: string): Promise<void> {
    try {
      await axios.post(`${API_BASE}/social/comments/${commentId}/like`);
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  },

  async unlikeComment(commentId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/social/comments/${commentId}/like`);
    } catch (error) {
      console.error('Error unliking comment:', error);
      throw error;
    }
  },

  // =============================================
  // ANALYTICS
  // =============================================

  async getPostAnalytics(postId: string): Promise<PostAnalytics> {
    try {
      const response = await axios.get(`${API_BASE}/social/posts/${postId}/analytics`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching post analytics:', error);
      throw error;
    }
  },

  async getCircleAnalytics(circleId: string): Promise<CircleAnalytics> {
    try {
      const response = await axios.get(`${API_BASE}/social/families/${circleId}/analytics`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching circle analytics:', error);
      throw error;
    }
  }
};

