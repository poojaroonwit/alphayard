export interface SocialPost {
  id: string;
  circleId: string;
  authorId: string;
  content: string;
  type: 'text' | 'image' | 'video';
  mediaUrls?: string[];
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  tags?: string[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface CreateSocialPostRequest {
  content: string;
  circleId: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  tags?: string[];
  type?: 'text' | 'image' | 'video';
  visibility?: 'public' | 'circle' | 'private';
}

export interface UpdateSocialPostRequest extends Partial<CreateSocialPostRequest> {}

export interface SocialPostInteraction {
  postId: string;
  type: 'like' | 'comment' | 'share';
  content?: string;
}

export interface ShoppingItem {
  id: string;
  circleId: string;
  item: string;
  category: string;
  quantity: string;
  assignedTo?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  estimatedCost?: number;
  createdAt?: string;
}
