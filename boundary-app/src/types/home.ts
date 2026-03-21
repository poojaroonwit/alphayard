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

export interface WidgetType {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  category: string;
}

// RESTORED TYPES
export interface AssetCard {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  color: string;
  progress?: number;
}

export interface AttentionApp {
  id: string;
  name: string;
  icon: string;
  color: string;
  notifications: number;
  isUrgent: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  time: string;
  location: string;
  type: 'medical' | 'financial' | 'social' | 'other' | string;
  attendees?: string[];
  circleId?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
}

export interface RecentlyUsedApp {
  id: string;
  name: string;
  icon: string;
  lastUsed: string;
}

export interface HouseType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date | string;
  address?: string;
  placeLabel?: string;
  type?: string;
}

export interface Widget {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}
