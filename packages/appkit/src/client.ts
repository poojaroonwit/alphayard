import type {
  AppKitConfig,
  AppKitEvent,
  AppKitEventHandler,
  AppKitUser,
  LoginOptions,
  LogoutOptions,
  AuthUrlOptions,
  CallbackResult,
  TokenSet,
  MFAType,
  MFAEnrollResponse,
  MFAVerifyOptions,
  MFAStatus,
  CMSContent,
  TranslationMap,
  Circle,
} from './types';
import { createStorage, TokenStorage } from './storage';
import { HttpClient } from './http';
import { AuthModule } from './auth';
import { IdentityModule } from './identity';
import { MFAModule } from './mfa';
import { CMSModule } from './cms';
import { LocalizationModule } from './localization';
import { GroupsModule } from './groups';
import { WebhooksModule } from './webhooks';
import { CommunicationModule } from './communication';
import { SurveysModule } from './surveys';
import { LegalModule } from './legal';
import { BillingModule } from './billing';

export class AppKit {
  private authModule: AuthModule;
  private identityModule: IdentityModule;
  private listeners = new Map<string, Set<AppKitEventHandler>>();
  private tokenStorage: TokenStorage;
  private http: HttpClient;

  /** MFA sub-module */
  public readonly mfa: MFAModule;
  /** CMS sub-module */
  public readonly cms: CMSModule;
  /** Localization sub-module */
  public readonly localization: LocalizationModule;
  /** Groups / Circles sub-module */
  public readonly groups: GroupsModule;
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

  constructor(private config: AppKitConfig) {
    const storageAdapter = createStorage(config.storage || 'localStorage');
    this.tokenStorage = new TokenStorage(storageAdapter);

    this.http = new HttpClient(
      config.domain,
      () => this.tokenStorage.getTokens()?.accessToken ?? null,
      config.fetch,
    );

    const emit = (event: string, payload?: unknown) => this.emit(event as AppKitEvent, payload);

    this.authModule = new AuthModule(config, this.tokenStorage, this.http, emit);
    this.identityModule = new IdentityModule(this.http);
    this.mfa = new MFAModule(this.http);
    this.cms = new CMSModule(this.http);
    this.localization = new LocalizationModule(this.http);
    this.groups = new GroupsModule(this.http);
    this.webhooks = new WebhooksModule(this.http);
    this.communication = new CommunicationModule(this.http);
    this.surveys = new SurveysModule(this.http);
    this.legal = new LegalModule(this.http);
    this.billing = new BillingModule(this.http);
  }

  // ─── Auth shortcuts ────────────────────────────────────────────

  /** Redirect the browser to the AppKit login page */
  async login(options?: LoginOptions): Promise<void> {
    return this.authModule.login(options);
  }

  /** Log out — clear local tokens and optionally revoke server-side */
  async logout(options?: LogoutOptions): Promise<void> {
    return this.authModule.logout(options);
  }

  /** Build an OAuth authorization URL (useful for custom UI) */
  async buildAuthUrl(options?: AuthUrlOptions): Promise<string> {
    return this.authModule.buildAuthUrl(options);
  }

  /** Handle the OAuth callback after redirect */
  async handleCallback(callbackUrl?: string): Promise<CallbackResult> {
    return this.authModule.handleCallback(callbackUrl);
  }

  /** Refresh the access token */
  async refreshToken(): Promise<TokenSet> {
    return this.authModule.refreshToken();
  }

  /** Get the current access token (auto-refreshes if expired) */
  async getAccessToken(): Promise<string | null> {
    return this.authModule.getAccessToken();
  }

  /** Check if the user is authenticated */
  isAuthenticated(): boolean {
    return this.authModule.isAuthenticated();
  }

  /** Get the raw token set */
  getTokens(): TokenSet | null {
    return this.authModule.getTokens();
  }

  // ─── Identity shortcuts ────────────────────────────────────────

  /** Get the current user's profile */
  async getUser(): Promise<AppKitUser> {
    return this.identityModule.getUser();
  }

  /** Update the current user's profile */
  async updateProfile(data: Partial<Pick<AppKitUser, 'firstName' | 'lastName' | 'phone' | 'avatar'>>): Promise<AppKitUser> {
    return this.identityModule.updateProfile(data);
  }

  /** Get custom attributes for the current user */
  async getAttributes(): Promise<Record<string, unknown>> {
    return this.identityModule.getAttributes();
  }

  /** Update custom attributes for the current user */
  async updateAttributes(attributes: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.identityModule.updateAttributes(attributes);
  }

  // ─── Groups shortcuts ──────────────────────────────────────────

  /** Get circles the current user belongs to */
  async getUserCircles(): Promise<Circle[]> {
    return this.groups.getUserCircles();
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

  /** Clean up timers and listeners */
  destroy(): void {
    this.authModule.destroy();
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
