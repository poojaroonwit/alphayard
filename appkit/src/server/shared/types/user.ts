export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  userType?: string;
  bio?: string;
  preferences: UserPreferences;
  subscription?: UserSubscription;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
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
    messages: boolean;
    calls: boolean;
    events: boolean;
    marketing: boolean;
  };
  email: {
    enabled: boolean;
    messages: boolean;
    events: boolean;
    marketing: boolean;
    digest: boolean;
  };
  sms: {
    enabled: boolean;
    important: boolean;
  };
  inApp: {
    enabled: boolean;
    messages: boolean;
    events: boolean;
  };
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private';
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

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

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
  storage: number; // in GB
  messages: number;
  calls: number;
  videoCalls: number;
  events: number;
  photos: number;
  videos: number;
  documents: number;
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
