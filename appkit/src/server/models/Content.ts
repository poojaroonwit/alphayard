export interface Content {
  id: string;
  circleId: string;
  contentTypeId: string;
  categoryId?: string;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  featuredImageUrl?: string;
  status: 'draft' | 'published' | 'archived';
  priority: number;
  isPinned: boolean;
  isFeatured: boolean;
  publishedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  contentType?: ContentType;
  category?: Category;
  author?: User;
  meta?: ContentMeta[];
  tags?: ContentTag[];
  interactions?: ContentInteraction[];
  comments?: ContentComment[];
  files?: ContentFile[];
  analytics?: ContentAnalytics;
}

export interface ContentMeta {
  id: string;
  contentId: string;
  metaKey: string;
  metaValue?: string;
  createdAt: Date;
}

export interface ContentTag {
  id: string;
  contentId: string;
  tag: string;
  createdAt: Date;
}

export interface ContentInteraction {
  id: string;
  contentId: string;
  userId: string;
  interactionType: 'like' | 'view' | 'share' | 'comment';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ContentComment {
  id: string;
  contentId: string;
  userId: string;
  parentId?: string;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  author?: User;
  replies?: ContentComment[];
}

export interface ContentAnalytics {
  id: string;
  contentId: string;
  date: Date;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  createdAt: Date;
}

export interface ContentFile {
  id: string;
  contentId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface CreateContentRequest {
  circleId: string;
  contentTypeId: string;
  categoryId?: string;
  title: string;
  content?: string;
  excerpt?: string;
  featuredImageUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  priority?: number;
  isPinned?: boolean;
  isFeatured?: boolean;
  publishedAt?: Date;
  meta?: Record<string, string>;
  tags?: string[];
}

export interface UpdateContentRequest {
  contentTypeId?: string;
  categoryId?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImageUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  priority?: number;
  isPinned?: boolean;
  isFeatured?: boolean;
  publishedAt?: Date;
  meta?: Record<string, string>;
  tags?: string[];
}

export interface ContentQuery {
  circleId: string;
  contentTypeId?: string;
  categoryId?: string;
  status?: 'draft' | 'published' | 'archived';
  isPinned?: boolean;
  isFeatured?: boolean;
  search?: string;
  tags?: string[];
  authorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'publishedAt' | 'title' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Import types from other models
import { ContentType } from './ContentType';
import { Category } from './Category';
import { IUser as User } from './UserModel';
