// ============================================================================
// PRISMA CLIENT
// ============================================================================
// 
// Singleton Prisma client for database access
// Usage: import { prisma } from '@/lib/prisma'
//
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prevent multiple instances of Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create the PostgreSQL adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = global.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export types for convenience
export type { 
  // Core models
  Application,
  User,
  UserApplication,
  Country,
  Language,
  Currency,
  UserSession,
  UserDevice,
  LoginHistory,
  UserSettings,
  File,
  FileFolder,
  GalleryItem,
  GalleryAlbum,
  Notification,
  UserPushToken,
  EmailTemplate,
  SubscriptionPlan,
  Subscription,
  SystemConfig,
  AppSetting,
  
  // Admin models
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminRolePermission,
  AdminUserApplication,
  AdminActivityLog,
  AuditLog,
  
  // AppKit models
  CircleType,
  Circle,
  CircleMember,
  EmergencyContact,
  SafetyIncident,
  SocialPost,
  SocialComment,
  SocialReaction,
  SocialStory,
  SocialStoryView,
  UserFollow,
  FriendRequest,
  ChatRoom,
  ChatParticipant,
  ChatMessage,
  ChatReadReceipt,
  ChatReaction,
  UserLocation,
  Geofence,
  LocationShare,
  Note,
  Todo,
} from '@prisma/client';

export default prisma;
