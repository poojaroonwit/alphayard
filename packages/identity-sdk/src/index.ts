// @appkit/identity-sdk — Client SDK for AppKit Identity Platform

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

// Utilities
export { generatePKCEChallenge, generateRandomString } from './pkce';
