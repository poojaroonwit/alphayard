export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  coverImage?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  userType?: 'circle' | 'children' | 'seniors'; // Added to match backend/admin
  bio?: string;
  location?: UserLocation;
  preferences: UserPreferences;
  subscription?: UserSubscription;
  Circle?: UserCircle;
  emergencyContacts: EmergencyContact[];
  geofences: Geofence[];
  statistics: UserStatistics;
  isOnline: boolean;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  accuracy?: number;
  timestamp: string;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
  features: FeaturePreferences;
}

export interface NotificationPreferences {
  push: {
    enabled: boolean;
    Circle: boolean;
    messages: boolean;
    calls: boolean;
    events: boolean;
    safety: boolean;
    emergency: boolean;
    marketing: boolean;
  };
  email: {
    enabled: boolean;
    Circle: boolean;
    messages: boolean;
    events: boolean;
    safety: boolean;
    emergency: boolean;
    marketing: boolean;
    digest: boolean;
  };
  sms: {
    enabled: boolean;
    emergency: boolean;
    safety: boolean;
    important: boolean;
  };
  inApp: {
    enabled: boolean;
    Circle: boolean;
    messages: boolean;
    events: boolean;
    safety: boolean;
    emergency: boolean;
  };
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'Circle' | 'friends' | 'private';
  locationSharing: {
    enabled: boolean;
    withCircle: boolean;
    withFriends: boolean;
    withPublic: boolean;
  };
  activitySharing: {
    enabled: boolean;
    withCircle: boolean;
    withFriends: boolean;
    withPublic: boolean;
  };
  dataSharing: {
    analytics: boolean;
    marketing: boolean;
    thirdParty: boolean;
  };
  searchVisibility: {
    allowSearch: boolean;
    showInResults: boolean;
  };
}

export interface AccessibilityPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  colorBlindness: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  hearingImpaired: boolean;
}

export interface FeaturePreferences {
  calendar: {
    enabled: boolean;
    syncWithDevice: boolean;
    reminders: boolean;
  };
  gallery: {
    enabled: boolean;
    autoBackup: boolean;
    compression: boolean;
  };
  notes: {
    enabled: boolean;
    syncWithCloud: boolean;
    encryption: boolean;
  };
  goals: {
    enabled: boolean;
    reminders: boolean;
    sharing: boolean;
  };
  games: {
    enabled: boolean;
    multiplayer: boolean;
    leaderboards: boolean;
  };
  music: {
    enabled: boolean;
    offlineMode: boolean;
    recommendations: boolean;
  };
  videos: {
    enabled: boolean;
    autoPlay: boolean;
    quality: 'low' | 'medium' | 'high';
  };
  billing: {
    enabled: boolean;
    notifications: boolean;
    autoRenewal: boolean;
  };
  shopping: {
    enabled: boolean;
    lists: boolean;
    recommendations: boolean;
  };
  health: {
    enabled: boolean;
    tracking: boolean;
    sharing: boolean;
  };
  education: {
    enabled: boolean;
    progress: boolean;
    certificates: boolean;
  };
}

export interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod?: PaymentMethod;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  features: string[];
  limits: SubscriptionLimits;
}

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'Circle' | 'enterprise';

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired' | 'pending';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface SubscriptionLimits {
  circleMembers: number;
  storage: number; // in GB
  messages: number;
  calls: number;
  videoCalls: number;
  events: number;
  photos: number;
  videos: number;
  documents: number;
}

export interface UserCircle {
  id: string;
  name: string;
  role: CircleRole;
  joinedAt: string;
  isActive: boolean;
  permissions: CirclePermissions;
}

export type CircleRole = 'admin' | 'moderator' | 'member' | 'guest';

export interface CirclePermissions {
  inviteMembers: boolean;
  removeMembers: boolean;
  updateSettings: boolean;
  createEvents: boolean;
  editEvents: boolean;
  deleteEvents: boolean;
  sendMessages: boolean;
  initiateCalls: boolean;
  viewBilling: boolean;
  manageBilling: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  isActive: boolean;
  notificationPreferences: {
    emergency: boolean;
    safety: boolean;
    daily: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Geofence {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  isActive: boolean;
  notifications: {
    enter: boolean;
    exit: boolean;
    dwell: boolean;
  };
  circleMembers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserStatistics {
  totalFamilies: number;
  totalFriends: number;
  totalMessages: number;
  totalCalls: number;
  totalVideoCalls: number;
  totalEvents: number;
  totalPhotos: number;
  totalVideos: number;
  totalDocuments: number;
  safetyChecksSent: number;
  safetyChecksReceived: number;
  emergencyAlertsSent: number;
  emergencyAlertsReceived: number;
  lastActivity: string;
  appUsage: {
    totalTime: number; // in minutes
    sessions: number;
    averageSessionTime: number;
  };
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth?: string;
  gender?: string;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Profile update types
export interface UpdateProfileRequest {
  firstName?: string;
  avatar?: string;
  coverImage?: string;
}

export interface UpdatePreferencesRequest {
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  currency?: string;
  notifications?: Partial<NotificationPreferences>;
  privacy?: Partial<PrivacyPreferences>;
  accessibility?: Partial<AccessibilityPreferences>;
  features?: Partial<FeaturePreferences>;
}

// Password management
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// Account management
export interface DeleteAccountRequest {
  password: string;
  reason?: string;
  feedback?: string;
}

// Social authentication
export interface SocialAuthRequest {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
  userData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string;
  };
}

// User search and filtering
export interface UserFilters {
  search?: string;
  circleId?: string;
  isOnline?: boolean;
  lastActiveAfter?: string;
  lastActiveBefore?: string;
}

export interface UserSortOptions {
  field: 'firstName' | 'lastName' | 'lastActiveAt' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
