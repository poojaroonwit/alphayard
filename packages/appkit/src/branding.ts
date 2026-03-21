import type {
  MobileBranding,
  AppFlowConfig,
  SurveyConfig,
  LegalDocument,
  SupportConfig,
  AppUpdateInfo,
  AppOnboardingConfig,
  AppConfiguration,
  AppScreenConfig,
  AppAssetEntry,
  FeatureFlagMap,
} from './types';
import { HttpClient } from './http';

// Cache entry: value + expiry timestamp
interface CacheEntry<T> { value: T; expiresAt: number }

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes (matches appConfigService behaviour)

export class BrandingModule {
  private configCache: CacheEntry<AppConfiguration> | null = null;

  constructor(private http: HttpClient) {}

  // ─── CMS / App Config (best-practice pattern) ────────────────────

  /**
   * Fetch the full app configuration — branding blob, per-screen configs,
   * feature flags, and theme — in one request.
   *
   * Results are cached for 30 minutes (stale-while-revalidate pattern).
   * Pass `forceRefresh: true` to bypass the cache.
   *
   * Boundary App usage:
   *   const config = await appkit.branding.getAppConfig()
   *   config.features['social_feed'].enabled
   *   config.screens['home'].config.background
   */
  async getAppConfig(forceRefresh = false): Promise<AppConfiguration> {
    if (!forceRefresh && this.configCache && Date.now() < this.configCache.expiresAt) {
      return this.configCache.value;
    }
    const config = await this.http.get<AppConfiguration>('/api/v1/app-config/config');
    this.configCache = { value: config, expiresAt: Date.now() + CACHE_TTL_MS };
    return config;
  }

  /**
   * Fetch per-screen visual config (background, layout, widgets).
   * Stored as AppSetting with key `screen_{screenKey}` in the backend.
   *
   * Usage:
   *   const screen = await appkit.branding.getScreenConfig('home')
   *   // screen.config.background → { type: 'image', value: 'https://...' }
   */
  async getScreenConfig(screenKey: string): Promise<AppScreenConfig> {
    // Try cache first
    if (this.configCache && Date.now() < this.configCache.expiresAt) {
      const cached = this.configCache.value.screens[screenKey];
      if (cached) return cached;
    }
    const res = await this.http.get<{ screen: AppScreenConfig }>(`/api/v1/app-config/screens/${screenKey}`);
    return res.screen;
  }

  /**
   * Fetch a static asset entry (logo, background image, splash, etc.) by key.
   * Returns null if the asset has not been configured yet (404).
   *
   * Usage:
   *   const asset = await appkit.branding.getAsset('cms_background')
   *   if (asset) <ImageBackground source={{ uri: asset.url }} />
   */
  async getAsset(assetKey: string): Promise<AppAssetEntry | null> {
    try {
      const res = await this.http.get<{ asset: AppAssetEntry }>(`/api/v1/app-config/assets/${assetKey}`);
      return res.asset ?? null;
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('404')) return null;
      throw err;
    }
  }

  /**
   * Fetch all feature flags for the current app.
   * Stored as AppSetting with key `feature_flags` in the backend.
   *
   * Usage:
   *   const flags = await appkit.branding.getFeatureFlags()
   *   flags['social_feed'].enabled   // true/false
   *   flags['social_feed'].rollout   // 0–100
   */
  async getFeatureFlags(): Promise<FeatureFlagMap> {
    // Prefer cached full config
    if (this.configCache && Date.now() < this.configCache.expiresAt) {
      return this.configCache.value.features;
    }
    const res = await this.http.get<{ flags: Record<string, boolean> }>('/api/v1/app-config/features');
    // Normalise flat boolean map → FeatureFlagEntry map
    const flags: FeatureFlagMap = {};
    for (const [key, value] of Object.entries(res.flags ?? {})) {
      flags[key] = { enabled: Boolean(value), rollout: Boolean(value) ? 100 : 0 };
    }
    return flags;
  }

  /** Invalidate the local config cache (call after admin saves branding/flags) */
  invalidateCache(): void {
    this.configCache = null;
  }

  // ─── Legacy / mobile routes ───────────────────────────────────────

  /** Fetch mobile branding blob */
  async getMobileBranding(): Promise<MobileBranding> {
    const res = await this.http.get<{ branding: MobileBranding }>('/api/v1/mobile/branding');
    return res.branding || {};
  }

  /** Update mobile branding (Admin only) */
  async updateMobileBranding(branding: Partial<MobileBranding>): Promise<MobileBranding> {
    const res = await this.http.post<{ branding: MobileBranding }>('/api/v1/mobile/branding', { branding });
    this.invalidateCache();
    return res.branding;
  }

  /** Get app flows */
  async getAppFlows(): Promise<AppFlowConfig[]> {
    const res = await this.http.get<{ flows: AppFlowConfig[] }>('/api/v1/mobile/flows');
    return res.flows || [];
  }

  /** Get surveys */
  async getSurveys(): Promise<SurveyConfig[]> {
    const res = await this.http.get<{ surveys: SurveyConfig[] }>('/api/v1/mobile/surveys');
    return res.surveys || [];
  }

  /** Get legal documents */
  async getLegalDocuments(): Promise<LegalDocument[]> {
    const res = await this.http.get<{ documents: LegalDocument[] }>('/api/v1/mobile/legal');
    return res.documents || [];
  }

  /** Get support configuration */
  async getSupportConfig(): Promise<SupportConfig> {
    const res = await this.http.get<{ support: SupportConfig }>('/api/v1/mobile/support');
    return res.support || {};
  }

  /** Check for app updates */
  async checkUpdates(version: string, platform: string): Promise<AppUpdateInfo | null> {
    return this.http.get<AppUpdateInfo | null>(`/api/v1/mobile/updates/check?version=${version}&platform=${platform}`);
  }

  /** Get onboarding configuration */
  async getOnboarding(): Promise<AppOnboardingConfig> {
    const res = await this.http.get<{ onboarding: AppOnboardingConfig }>('/api/v1/mobile/onboarding');
    return res.onboarding || { screens: [], enabled: false };
  }

  /** Get enabled SSO/OAuth providers for this app */
  async getSSOProviders(): Promise<{ id: string; name: string; type: string; icon?: string }[]> {
    const res = await this.http.get<{ providers: any[] }>('/api/v1/mobile/auth/providers');
    return res.providers || [];
  }
}
