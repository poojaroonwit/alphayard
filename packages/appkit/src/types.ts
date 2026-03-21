// ─── Configuration ───────────────────────────────────────────────

export interface AppKitConfig {
  /** OAuth Client ID from the AppKit Admin Dashboard */
  clientId: string;
  /** Your AppKit domain (e.g. https://auth.your-app.com) */
  domain: string;
  /** Default redirect URI after login */
  redirectUri?: string;
  /** OAuth scopes to request (default: 'openid profile email') */
  scopes?: string[];
  /** Token storage strategy (default: 'localStorage') */
  storage?: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
  /** Automatically refresh tokens before expiry (default: true) */
  autoRefresh?: boolean;
  /** Custom fetch implementation for SSR/testing */
  fetch?: typeof globalThis.fetch;
  /** Optional base URL for API calls */
  baseURL?: string;
  /** Optional API key for internal server calls */
  apiKey?: string;
  /** Client secret for machine-to-machine (client_credentials) auth */
  clientSecret?: string;
  /**
   * Custom URL for token refresh (overrides the default /oauth/token endpoint).
   * Use this when using direct-credential auth (not full OAuth flow) — e.g. point
   * to /api/v1/auth/refresh which validates the refresh token via JWT directly.
   */
  tokenRefreshUrl?: string;
}

export interface AppFlowStep {
  id: string;
  type: 'screen' | 'action' | 'condition';
  target: string;
  params?: Record<string, any>;
}

export interface AppFlowConfig {
  id: string;
  name: string;
  steps: AppFlowStep[];
  isDefault?: boolean;
}

export interface OnboardingScreen {
  id: string;
  title: string;
  description: string;
  image?: string;
  video?: string;
}

export interface AppOnboardingConfig {
  screens: OnboardingScreen[];
  enabled: boolean;
}

export interface SupportConfig {
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  helpCenterUrl?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  providers: string[];
  debugMode?: boolean;
  samplingRate?: number;
}

export interface LegalDocument {
  id: string;
  type: string;
  slug: string;
  title: string;
  content: string;
  contentFormat: string;
  summary?: string;
  version: string;
  versionDate?: string;
  effectiveDate?: string;
  lastUpdated: string;
  language?: string;
  country?: string;
  status: 'draft' | 'published' | 'archived';
  isRequiredAcceptance: boolean;
  requiresReacceptance?: boolean;
  displayOrder?: number;
  showInApp?: boolean;
  showInFooter?: boolean;
  sections?: LegalSection[];
}

export interface LegalSection {
  id: string;
  documentId: string;
  title: string;
  content: string;
  sortOrder: number;
  isCollapsible: boolean;
}

export interface UserAcceptance {
  id: string;
  userId: string;
  documentId: string;
  documentType: string;
  documentVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DeveloperDoc {
  id: string;
  category: string;
  slug: string;
  title: string;
  content: string;
  contentFormat: string;
  excerpt?: string;
  parentId?: string;
  sortOrder: number;
  tags?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime?: number;
  status: 'draft' | 'published' | 'archived' | 'deprecated';
  isFeatured: boolean;
  version: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MobileBranding {
  mobileAppName?: string;
  mobileAppDescription?: string;
  mobileAppLogo?: string;
  mobileAppPrimaryColor?: string;
  mobileAppSecondaryColor?: string;
  mobileAppAccentColor?: string;
  mobileAppBackgroundColor?: string;
  mobileAppTextColor?: string;
  mobileAppFontFamily?: string;
  mobileAppFontSize?: number;
  mobileAppFontWeight?: string;
  mobileAppBorderRadius?: number;
  mobileAppShadowColor?: string;
  mobileAppShadowOffset?: { width: number; height: number };
  mobileAppShadowOpacity?: number;
  mobileAppShadowRadius?: number;
  mobileAppElevation?: number;
  mobileAppGradientColors?: string[];
  mobileAppGradientStart?: { x: number; y: number };
  mobileAppGradientEnd?: { x: number; y: number };
  mobileAppIsDarkMode?: boolean;
  logoUrl?: string; // Legacy
  iconUrl?: string; // Legacy
  analytics?: AnalyticsConfig;
  legal?: LegalDocument[];
  screens?: any[];
  categories?: any[];
  flows?: AppFlowConfig[];
  onboarding?: AppOnboardingConfig;
  support?: SupportConfig;
}

export interface SurveyConfig {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  isMandatory?: boolean;
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'rating' | 'boolean';
  options?: string[];
  isRequired?: boolean;
}

export interface AppUpdateInfo {
  version: string;
  buildNumber: number;
  isMandatory: boolean;
  releaseNotes?: string;
  downloadUrl?: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AppKitUser;
  accessToken?: string;
  refreshToken?: string;
}

// ─── Auth ────────────────────────────────────────────────────────

export interface AuthUrlOptions {
  redirect_uri?: string;
  scope?: string;
  state?: string;
  /** Use PKCE (default: true for public clients) */
  usePKCE?: boolean;
  /** Additional query parameters */
  extraParams?: Record<string, string>;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  /** Unix ms timestamp when the access token expires */
  expiresAt: number;
  /** Unix ms timestamp when the refresh token expires (optional, used for proactive expiry check) */
  refreshTokenExpiresAt?: number;
  scope?: string;
}

export interface LoginOptions {
  /** Override the default redirect URI */
  redirectUri?: string;
  /** Override the default scopes */
  scope?: string;
  /** Pre-fill login hint (email) */
  loginHint?: string;
  /** Force re-authentication */
  prompt?: 'none' | 'login' | 'consent';
  /** Additional query parameters */
  extraParams?: Record<string, string>;
  /** Optional email for direct login */
  email?: string;
  /** Optional phone for direct login */
  phone?: string;
  /** Optional password for direct login */
  password?: string;
}

export interface LogoutOptions {
  /** URL to redirect to after logout */
  post_logout_redirect_uri?: string;
  /** Whether to revoke the refresh token on the server (default: true) */
  revokeToken?: boolean;
}

export interface CallbackResult {
  /** The parsed token set */
  tokens: TokenSet;
  /** The state parameter returned from the authorization server */
  state?: string;
}

// ─── PKCE ────────────────────────────────────────────────────────

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

// ─── User / Identity ─────────────────────────────────────────────

export interface AppKitUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified?: boolean;
  phone?: string;
  attributes?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  isOnboardingComplete?: boolean;
  points?: number;
  appPoints?: number;
}

// ─── MFA ─────────────────────────────────────────────────────────
export interface UserMFA {
  id: string;
  mfaType: 'totp' | 'sms' | 'email';
  isEnabled: boolean;
  isVerified?: boolean;
}

export type MFAType = 'totp' | 'sms' | 'email';

export interface MFAEnrollResponse {
  /** QR code data URL for TOTP */
  qrCodeUrl?: string;
  /** TOTP secret for manual entry */
  secret?: string;
  /** Challenge ID for SMS/email verification */
  challengeId?: string;
  /** Extra backup codes if generated during setup */
  backupCodes?: string[];
  message?: string;
}

export interface MFASetupResponse extends MFAEnrollResponse {}

export interface MFAVerifyOptions {
  type: MFAType;
  code: string;
  challengeId?: string;
}

export interface MFAStatus {
  enabled: boolean;
  methods: MFAType[];
}

export interface UserSession {
  id: string;
  userId?: string;
  sessionToken?: string;
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  location?: string;
  isActive: boolean;
  isCurrent?: boolean;
  lastActivityAt: string;
  expiresAt?: string;
  createdAt?: string;
  isExpired?: boolean;
}

export interface UserDevice {
  id: string;
  userId?: string;
  deviceFingerprint?: string;
  deviceName?: string;
  deviceType: string;
  brand?: string;
  model?: string;
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  appVersion?: string;
  isTrusted: boolean;
  isCurrent?: boolean;
  isBlocked?: boolean;
  firstSeenAt?: string;
  lastSeenAt: string;
  lastIpAddress?: string;
  lastLocationCountry?: string;
  lastLocationCity?: string;
  loginCount?: number;
  createdAt?: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  method: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  isSuspicious?: boolean;
  riskScore?: number;
  createdAt: string;
}

export interface SecuritySettings {
  passwordLastChanged?: string;
  mfaEnabled: boolean;
  mfaMethods: string[];
  trustedDevicesCount: number;
  activeSessionsCount: number;
  lastLoginAt?: string;
  lastLoginLocation?: string;
  accountLocked?: boolean;
  accountLockedUntil?: string;
}

// ─── Safety ─────────────────────────────────────────────────────

export interface SafetyAlert {
  id: string;
  userId: string;
  circleId: string;
  alertType: 'panic' | 'inactivity' | 'geofence_exit' | 'geofence_enter' | 'low_battery' | 'device_offline' | string;
  title?: string;
  message?: string;
  status: 'active' | 'acknowledged' | 'resolved' | string;
  priority: 'low' | 'medium' | 'high' | 'critical' | string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  metadata?: any;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SafetyStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  panicAlerts: number;
  inactivityAlerts: number;
  geofenceAlerts: number;
  lastAlert?: SafetyAlert;
}

export interface CreatePanicAlertRequest {
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  message?: string;
}

export interface CreateInactivityAlertRequest {
  inactivityDuration: number;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
}

export interface EmergencyContact {
  id: string;
  userId?: string;
  name: string;
  phoneNumber: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmergencyContactRequest {
  name: string;
  phoneNumber: string;
  email?: string;
  relationship: string;
  isPrimary?: boolean;
}

// ─── Groups / Circles ────────────────────────────────────────────

export interface Circle {
  id: string;
  name: string;
  description?: string;
  role: string;
  inviteCode?: string;
  inviteCodeExpiry?: string;
  memberCount?: number;
  createdAt?: string;
  settings?: Record<string, any>;
  members?: any[];
}

export interface CircleType {
  id: string;
  name: string;
  code: string;
  icon?: string;
  sort_order?: number;
}

export interface CircleMember {
  userId: string;
  role: string;
  joinedAt: string;
  user?: AppKitUser;
}

export interface CreateCircleRequest {
  name: string;
  description?: string;
  type?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateCircleRequest {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

// ─── Circle Status ──────────────────────────────────────────────

export interface CircleStatusMember {
  memberId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | string;
  lastSeen: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
    timestamp: string;
  };
  batteryLevel?: number;
  isEmergency?: boolean;
  heartRate?: number;
  steps?: number;
  sleepHours?: number;
}

export interface CircleStatusUpdate {
  memberId: string;
  status?: 'online' | 'offline' | 'away' | string;
  location?: string;
  batteryLevel?: number;
  heartRate?: number;
  steps?: number;
  sleepHours?: number;
  isEmergency?: boolean;
}

export interface CircleLocationUpdate {
  memberId: string;
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp: string;
}

export interface CircleStatusFilters {
  circleId?: string;
  memberId?: string;
  status?: 'online' | 'offline' | 'away' | string;
  isEmergency?: boolean;
}

// ─── CMS ─────────────────────────────────────────────────────────

export interface CMSContent {
  id: string;
  title: string;
  slug: string;
  type?: string;
  status?: string;
  components?: unknown[];
  metadata?: Record<string, unknown>;
  publishedAt?: string;
}

// ─── Localization ────────────────────────────────────────────────

export type TranslationMap = Record<string, string>;

// ─── Events ──────────────────────────────────────────────────────

export type AppKitEvent =
  | 'login'
  | 'logout'
  | 'token_refreshed'
  | 'token_expired'
  | 'user_updated'
  | 'error';

export type AppKitEventHandler = (payload?: unknown) => void;

// ─── Errors ──────────────────────────────────────────────────────

export class AppKitError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'AppKitError';
  }
}

// ─── Extended Auth Types ─────────────────────────────────────────

export interface LoginRequest {
  email?: string;
  phone?: string;
  password?: string;
  [key: string]: unknown;
}

export interface OtpRequest {
  email?: string;
  phone?: string;
}

export interface VerifyOtpRequest {
  email?: string;
  phone?: string;
  otp: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  token: string;
}

export interface CheckUserRequest {
  email?: string;
  phone?: string;
}

export interface CheckUserResponse {
  exists: boolean;
}

// ─── App Configuration (screen configs, feature flags, theme) ────

/** A single feature flag entry returned from the SDK */
export interface FeatureFlagEntry {
  enabled: boolean;
  /** 0–100 rollout percentage */
  rollout: number;
  metadata?: Record<string, unknown>;
}

/** Map of all feature flags for the current app */
export type FeatureFlagMap = Record<string, FeatureFlagEntry>;

/** Theme config delivered as part of AppConfiguration */
export interface AppThemeConfig {
  key: string;
  name: string;
  config: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: Record<string, number>;
    borderRadius: Record<string, number>;
  };
}

/** Per-screen visual config (background, layout) stored in AppSetting */
export interface AppScreenConfig {
  /** Screen key, e.g. 'home', 'login', 'splash' */
  key: string;
  name: string;
  type: 'splash' | 'login' | 'onboarding' | 'home' | 'settings' | 'profile' | 'custom';
  /** Arbitrary JSON config including background, layout, widgets */
  config: Record<string, unknown>;
  version: number;
}

/** A static asset entry (logo, background image, etc.) */
export interface AppAssetEntry {
  key: string;
  name: string;
  url: string;
  metadata?: Record<string, unknown>;
  dimensions?: { width: number; height: number };
}

/**
 * Full app configuration — returned by BrandingModule.getAppConfig().
 * Mirrors the AppConfiguration interface in the Boundary App's appConfigService.ts
 * so the SDK can drop in as a replacement for raw fetch calls.
 */
export interface AppConfiguration {
  version: string;
  timestamp: string;
  /** Raw branding blob from application.branding (colors, fonts, screens, etc.) */
  configuration: Record<string, unknown>;
  /** Per-screen configs keyed by screen key (from AppSetting screen_* records) */
  screens: Record<string, AppScreenConfig>;
  /** Active theme derived from branding.tokens */
  theme: AppThemeConfig | null;
  /** Feature flags from AppSetting feature_flags record */
  features: FeatureFlagMap;
  /** Static asset URLs keyed by asset key */
  assets: Record<string, AppAssetEntry[]>;
}

