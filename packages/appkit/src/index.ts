// @alphayard/appkit — Client SDK for AppKit Identity Platform

export { AppKit } from './client';
export { AppKitError } from './types';

// Types
export type {
  AppKitConfig,
  AuthUrlOptions,
  TokenResponse,
  TokenSet,
  LoginOptions,
  LogoutOptions,
  CallbackResult,
  PKCEChallenge,
  AppKitUser,
  MobileBranding,
  MFAType,
  MFAEnrollResponse,
  MFASetupResponse,
  MFAVerifyOptions,
  MFAStatus,
  Circle,
  CircleType,
  CircleMember,
  CMSContent,
  TranslationMap,
  AppKitEvent,
  AppKitEventHandler,
  LoginRequest,
  CheckUserRequest,
  CheckUserResponse,
  RegisterRequest,
  OtpRequest,
  VerifyOtpRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AppFlowConfig,
  AppFlowStep,
  AppOnboardingConfig,
  OnboardingScreen,
  SupportConfig,
  SurveyConfig,
  SurveyQuestion,
  AppUpdateInfo,
  LegalDocument,
  LegalSection,
  UserAcceptance,
  UserSession,
  UserDevice,
  UserMFA,
  LoginHistoryEntry,
  SecuritySettings,
  CircleStatusMember, 
  CircleStatusUpdate, 
  CircleLocationUpdate, 
  CircleStatusFilters,
  DeveloperDoc,
  SafetyAlert,
  SafetyStats,
  CreatePanicAlertRequest,
  CreateInactivityAlertRequest,
  EmergencyContact,
  CreateEmergencyContactRequest,
  AppConfiguration,
  AppScreenConfig,
  AppAssetEntry,
  AppThemeConfig,
  FeatureFlagEntry,
  FeatureFlagMap,
} from './types';

// Sub-modules (for advanced usage)
export { AuthModule } from './auth';
export { IdentityModule } from './identity';
export { MFAModule } from './mfa';
export { CMSModule } from './cms';
export { LocalizationModule } from './localization';
export { GroupsModule } from './groups';
export { WebhooksModule } from './webhooks';
export { CommunicationModule } from './communication';
export { SurveysModule } from './surveys';
export { LegalModule } from './legal';
export { BillingModule } from './billing';
export { CircleStatusModule } from './circleStatus';
export { StorageModule } from './storageModule';
export { BrandingModule } from './branding';

// Types from new modules
export type { Webhook, WebhookDelivery } from './webhooks';
export type { EmailOptions, PushOptions, SMSOptions, MessageTemplate, CommProvider, CommConfig } from './communication';
export { CHANNEL_GROUPS } from './communication';
export type { Survey, SurveyResults } from './surveys';

// Utilities
export { generatePKCEChallenge, generateRandomString } from './pkce';
