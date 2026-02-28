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
  MFAType,
  MFAEnrollResponse,
  MFAVerifyOptions,
  MFAStatus,
  Circle,
  CircleMember,
  CMSContent,
  TranslationMap,
  AppKitEvent,
  AppKitEventHandler,
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

// Types from new modules
export type { Webhook, WebhookDelivery } from './webhooks';
export type { EmailOptions, PushOptions, SMSOptions, MessageTemplate } from './communication';
export type { Survey, SurveyQuestion, SurveyResults } from './surveys';
export type { LegalDocument, ConsentStatus } from './legal';
export type { Plan, Subscription, Usage } from './billing';

// Utilities
export { generatePKCEChallenge, generateRandomString } from './pkce';
