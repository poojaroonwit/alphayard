import type {
  AppKitConfig,
  AppKitEvent,
  AppKitEventHandler,
  AppKitUser,
  CreateCircleRequest,
  UpdateCircleRequest,
  CircleType,
  RegisterRequest,
  AuthResponse,
  LoginOptions,
  LogoutOptions,
  AuthUrlOptions,
  TokenSet,
  Circle,
  LoginRequest,
  CheckUserRequest,
  CheckUserResponse,
  OtpRequest,
  VerifyOtpRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  CircleStatusUpdate,
  CircleLocationUpdate,
} from './types';
import { createStorage, TokenStorage } from './storage';
import { HttpClient } from './http';
import { AuthModule } from './auth';
import { IdentityModule } from './identity';
import { MFAModule } from './mfa';
import { CMSModule } from './cms';
import { LocalizationModule } from './localization';
import { GroupsModule } from './groups';
import { SafetyModule } from './safety';
import { BrandingModule } from './branding';
import { WebhooksModule } from './webhooks';
import { CommunicationModule } from './communication';
import { SurveysModule } from './surveys';
import { LegalModule } from './legal';
import { BillingModule } from './billing';
import { CircleStatusModule } from './circleStatus';
import { StorageModule } from './storageModule';
import { safelyJoinPath } from './utils';

export class AppKit {
  /** Auth sub-module */
  public readonly auth: AuthModule;
  private listeners = new Map<string, Set<AppKitEventHandler>>();
  private tokenStorage: TokenStorage;
  private http: HttpClient;
  private serviceToken: { value: string; expiresAt: number } | null = null;

  /** Identity sub-module */
  public readonly identity: IdentityModule;
  /** MFA sub-module */
  public readonly mfa: MFAModule;
  /** CMS sub-module */
  public readonly cms: CMSModule;
  /** Localization sub-module */
  public readonly localization: LocalizationModule;
  /** Groups / Circles sub-module */
  public readonly groups: GroupsModule;
  /** Safety sub-module */
  public readonly safety: SafetyModule;
  /** Branding sub-module */
  public readonly branding: BrandingModule;
  /** Webhooks sub-module */
  public readonly webhooks: WebhooksModule;
  /** Communication sub-module */
  public readonly communication: CommunicationModule;
  /** Surveys sub-module */
  public readonly surveys: SurveysModule;
  /** Legal & Compliance sub-module */
  public readonly legal: LegalModule;
  /** Billing & Subscriptions sub-module */
  public readonly billing: BillingModule;
  /** Circle Status sub-module */
  public readonly circleStatus: CircleStatusModule;
  /** Storage sub-module */
  public readonly storage: StorageModule;

  constructor(private appConfig: AppKitConfig) {
    const storageAdapter = createStorage(appConfig.storage || 'localStorage');
    this.tokenStorage = new TokenStorage(storageAdapter);

    const getToken = appConfig.clientSecret
      ? () => this.serviceToken?.value ?? null
      : () => {
          const t = this.tokenStorage.getTokens();
          // Don't send tokens that have already expired client-side
          if (!t || Date.now() >= t.expiresAt) return null;
          return t.accessToken;
        };

    const refreshToken = appConfig.clientSecret
      ? async () => {
          try {
            return await this.fetchServiceToken();
          } catch {
            return null;
          }
        }
      : async () => {
          const stored = this.tokenStorage.getTokens();

          // No refresh token — user was never authenticated; don't emit logout
          if (!stored?.refreshToken) return null;

          // Refresh token is already expired client-side — clear immediately,
          // no network call needed
          if (stored.refreshTokenExpiresAt && Date.now() >= stored.refreshTokenExpiresAt) {
            this.tokenStorage.clear();
            this.emit('logout');
            return null;
          }

          try {
            const tokens = await this.refreshToken();
            return tokens.accessToken;
          } catch {
            // Refresh failed — clear stale tokens and signal logout
            this.tokenStorage.clear();
            this.emit('logout');
            return null;
          }
        };

    this.http = new HttpClient(
      appConfig.baseURL || appConfig.domain,
      getToken,
      refreshToken,
      appConfig.fetch,
    );

    const emit = (event: string, payload?: unknown) => this.emit(event as AppKitEvent, payload);

    this.auth = new AuthModule(appConfig, this.tokenStorage, this.http, emit);
    this.identity = new IdentityModule(this.http);
    this.mfa = new MFAModule(this.http);
    this.cms = new CMSModule(this.http);
    this.localization = new LocalizationModule(this.http);
    this.groups = new GroupsModule(this.http);
    this.safety = new SafetyModule(this.http);
    this.branding = new BrandingModule(this.http);
    this.webhooks = new WebhooksModule(this.http);
    this.communication = new CommunicationModule(this.http);
    this.surveys = new SurveysModule(this.http);
    this.legal = new LegalModule(this.http);
    this.billing = new BillingModule(this.http);
    this.circleStatus = new CircleStatusModule(this.http);
    this.storage = new StorageModule(this.http);
  }

  /**
   * Universal call method for app-specific features not yet in the SDK.
   * This uses the SDK's internal transport with automatic 401 refresh.
   */
  async call<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: any,
  ): Promise<T> {
    const finalPath = (this.appConfig.baseURL && !path.startsWith('http'))
      ? safelyJoinPath(this.appConfig.baseURL, path)
      : path;

    switch (method.toUpperCase()) {
      case 'GET':
        return this.http.get<T>(finalPath);
      case 'POST':
        return this.http.post<T>(finalPath, data);
      case 'PUT':
        return this.http.put<T>(finalPath, data);
      case 'PATCH':
        return this.http.patch<T>(finalPath, data);
      case 'DELETE':
        return this.http.delete<T>(finalPath);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // ─── Auth shortcuts ────────────────────────────────────────────

  /** Redirect the browser to the AppKit login page */
  async login(options?: LoginOptions): Promise<void> {
    await this.auth.login(options);
  }

  /** Log out — clear local tokens and optionally revoke server-side */
  async logout(options?: LogoutOptions): Promise<void> {
    return this.auth.logout(options);
  }

  /** Build an OAuth authorization URL (useful for custom UI) */
  async buildAuthUrl(options?: AuthUrlOptions): Promise<string> {
    return this.auth.buildAuthUrl(options);
  }

  /** Handle callback from OAuth provider */
  async handleCallback(callbackUrl?: string) {
    return this.auth.handleCallback(callbackUrl);
  }

  /** Sign up / Register a new user */
  async signup(data: RegisterRequest): Promise<AuthResponse> {
    return this.auth.register(data);
  }

  /** Refresh the access token */
  async refreshToken(): Promise<TokenSet> {
    return this.auth.refreshToken();
  }

  /** Get the current access token (auto-refreshes if expired) */
  async getAccessToken(): Promise<string | null> {
    return this.auth.getAccessToken();
  }

  /** Get the raw token set */
  getTokens(): TokenSet | null {
    return this.auth.getTokens();
  }

  /** Check if the user is authenticated */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  /** Direct login with credentials (email/password) */
  async loginWithCredentials(data: LoginRequest): Promise<AuthResponse> {
    return this.auth.loginWithCredentials(data);
  }

  /** Check if a user exists by email or phone */
  async checkUserExists(data: CheckUserRequest): Promise<CheckUserResponse> {
    return this.auth.checkUserExists(data);
  }

  /** Request an OTP code */
  async requestOtp(data: OtpRequest): Promise<{ success: boolean; message?: string }> {
    return this.auth.requestOtp(data);
  }

  /** Login with an OTP code */
  async loginWithOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    return this.auth.loginWithOtp(data);
  }

  /** Verify email with a code */
  async verifyEmail(data: VerifyEmailRequest): Promise<AuthResponse> {
    return this.auth.verifyEmail(data);
  }

  /** Request password reset email */
  async forgotPassword(data: ForgotPasswordRequest): Promise<{ success: boolean; message?: string }> {
    return this.auth.forgotPassword(data);
  }

  /** Reset password using a token */
  async resetPassword(data: ResetPasswordRequest): Promise<{ success: boolean; message?: string }> {
    return this.auth.resetPassword(data);
  }

  /** Complete user onboarding */
  async completeOnboarding(data: any): Promise<AuthResponse> {
    return this.auth.completeOnboarding(data);
  }

  /** Login with a social provider (OAuth2) */
  async loginWithSocial(provider: string, options?: LoginOptions): Promise<void> {
    await this.auth.login({ ...options, extraParams: { ...options?.extraParams, provider } });
  }

  /** Verify social login data and return tokens (Mobile choice) */
  async verifySocialLogin(provider: string, data: any): Promise<AuthResponse> {
    return this.auth.verifySocialLogin(provider, data);
  }

  /** Get available social login providers */
  async getSSOProviders() {
    return this.branding.getSSOProviders();
  }

  // ─── Identity shortcuts ────────────────────────────────────────

  /** Get the current user's profile */
  async getUser(): Promise<AppKitUser> {
    return this.identity.getUser();
  }

  /** Update the current user's profile */
  async updateProfile(data: Partial<Pick<AppKitUser, 'firstName' | 'lastName' | 'phone' | 'avatar'>>): Promise<AppKitUser> {
    return this.identity.updateProfile(data);
  }

  /** Get custom attributes for the current user */
  async getAttributes(): Promise<Record<string, unknown>> {
    return this.identity.getAttributes();
  }

  /** Update custom attributes for the current user */
  async updateAttributes(attributes: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.identity.updateAttributes(attributes);
  }

  /** Check if the current user has a PIN set */
  async getPinStatus(): Promise<{ hasPin: boolean }> {
    return this.identity.getPinStatus();
  }

  /** Set or update the current user's PIN */
  async setPin(pin: string): Promise<{ success: boolean; message: string }> {
    return this.identity.setPin(pin);
  }

  /** Verify the current user's PIN */
  async verifyPin(pin: string): Promise<{ success: boolean; verified: boolean; message: string }> {
    return this.identity.verifyPin(pin);
  }

  // ─── Groups shortcuts ──────────────────────────────────────────

  /** Get circles the current user belongs to */
  async getUserCircles(): Promise<Circle[]> {
    return this.groups.getUserCircles();
  }

  /** Join a circle using an invite code and optional PIN */
  async joinCircle(inviteCode: string, pinCode?: string): Promise<{ success: boolean; circle: Circle }> {
    return this.groups.joinCircle(inviteCode, pinCode);
  }

  /** Get circle security codes */
  async getCircleSecurityCodes(circleId: string) {
    return this.groups.getSecurityCodes(circleId);
  }

  /** Generate new security codes (PIN and invite code) for a circle */
  async generateCircleSecurityCodes(circleId: string): Promise<{ pinCode: string; circleCode: string }> {
    return this.groups.generateSecurityCodes(circleId);
  }

  /** Create a new circle */
  async createCircle(data: CreateCircleRequest): Promise<Circle> {
    return this.groups.createCircle(data);
  }

  /** Update a circle's details */
  async updateCircle(circleId: string, data: UpdateCircleRequest): Promise<Circle> {
    return this.groups.updateCircle(circleId, data);
  }

  /** Delete a circle */
  async deleteCircle(circleId: string): Promise<void> {
    return this.groups.deleteCircle(circleId);
  }

  /** Leave a circle */
  async leaveCircle(circleId: string): Promise<void> {
    return this.groups.leaveCircle(circleId);
  }

  /** Get available circle types/categories */
  async getCircleTypes(): Promise<{ success: boolean; data: CircleType[] }> {
    return this.groups.getCircleTypes();
  }

  // ─── Circle Status shortcuts ───────────────────────────────────

  /** Get circle members status */
  async getCircleMembersStatus(circleId: string) {
    return this.circleStatus.getCircleMembers(circleId);
  }

  /** Update current member's status/health/location */
  async updateMemberCircleStatus(update: CircleStatusUpdate) {
    return this.circleStatus.updateMemberStatus(update);
  }

  /** Update current member's location precisely */
  async updateMemberLocation(update: CircleLocationUpdate) {
    return this.circleStatus.updateMemberLocation(update);
  }

  // ─── Event system ──────────────────────────────────────────────

  /** Subscribe to SDK events */
  on(event: AppKitEvent, handler: AppKitEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /** Remove a specific event handler */
  off(event: AppKitEvent, handler: AppKitEventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * Fetch a service token using client credentials grant.
   * Caches the token and auto-refreshes when within 60s of expiry.
   */
  async getServiceToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.serviceToken && this.serviceToken.expiresAt > now + 60) {
      return this.serviceToken.value;
    }
    return this.fetchServiceToken();
  }

  private async fetchServiceToken(): Promise<string> {
    if (!this.appConfig.clientSecret) {
      throw new Error('[AppKit] clientSecret is required for client credentials grant');
    }
    const fetchFn = this.appConfig.fetch ?? globalThis.fetch;
    const res = await fetchFn(`${this.appConfig.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.appConfig.clientId,
        client_secret: this.appConfig.clientSecret,
      }).toString(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`[AppKit] client_credentials failed: ${(err as any).error_description ?? res.statusText}`);
    }
    const data = await res.json() as { access_token: string; expires_in: number };
    const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);
    this.serviceToken = { value: data.access_token, expiresAt };
    return data.access_token;
  }

  /** Clean up timers and listeners */
  destroy(): void {
    this.auth.destroy();
    this.listeners.clear();
  }

  // ─── Private ───────────────────────────────────────────────────

  private emit(event: AppKitEvent, payload?: unknown): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[AppKit] Event handler error for "${event}":`, err);
        }
      }
    }
  }
}
