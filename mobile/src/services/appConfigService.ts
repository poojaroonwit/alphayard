import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * App Configuration Service
 * Similar to Adobe Experience Manager (AEM) for mobile apps
 * Manages dynamic app configuration, themes, assets, and feature flags
 */

const CONFIG_CACHE_KEY = '@app_config';
const CONFIG_CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export interface AppConfiguration {
  version: string;
  timestamp: string;
  configuration: Record<string, any>;
  screens: Record<string, ScreenConfig>;
  theme: ThemeConfig | null;
  features: Record<string, FeatureConfig>;
  assets: Record<string, AssetInfo[]>;
}

export interface ScreenConfig {
  name: string;
  type: 'splash' | 'login' | 'onboarding' | 'home' | 'settings' | 'profile' | 'custom';
  config: any;
  version: number;
}

export interface ThemeConfig {
  key: string;
  name: string;
  config: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: Record<string, number>;
    borderRadius: Record<string, number>;
  };
}

export interface FeatureConfig {
  enabled: boolean;
  rollout: number;
  metadata?: any;
}

export interface AssetInfo {
  key: string;
  name: string;
  url: string;
  metadata?: any;
  dimensions?: { width: number; height: number };
}

class AppConfigService {
  private client: AxiosInstance;
  private baseURL: string;
  private cachedConfig: AppConfiguration | null = null;
  private cacheTimestamp: number = 0;

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    
    this.client = axios.create({
      baseURL: `${this.baseURL}/api/app-config`,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get complete app configuration
   * Uses cache to reduce network requests
   */
  async getAppConfig(forceRefresh: boolean = false): Promise<AppConfiguration> {
    try {
      // Check cache first
      if (!forceRefresh && this.cachedConfig && this.isCacheValid()) {
        return this.cachedConfig;
      }

      // Try to load from AsyncStorage
      if (!forceRefresh) {
        const cached = await this.loadFromCache();
        if (cached) {
          this.cachedConfig = cached;
          return cached;
        }
      }

      // Fetch from API
      const platform = this.getPlatform();
      const response = await this.client.get('/config', {
        params: { platform }
      });

      const config: AppConfiguration = response.data;
      
      // Save to cache
      await this.saveToCache(config);
      this.cachedConfig = config;
      this.cacheTimestamp = Date.now();

      return config;
    } catch (error: any) {
      console.error('Error fetching app config:', error);
      
      // Return cached config if available
      if (this.cachedConfig) {
        console.log('Using cached config due to error');
        return this.cachedConfig;
      }

      throw new Error(`Failed to fetch app configuration: ${error.message}`);
    }
  }

  /**
   * Get specific screen configuration
   */
  async getScreenConfig(screenKey: string): Promise<ScreenConfig> {
    try {
      const response = await this.client.get(`/screens/${screenKey}`);
      return response.data.screen;
    } catch (error: any) {
      console.error(`Error fetching screen config for ${screenKey}:`, error);
      
      // Fallback to cached config
      if (this.cachedConfig?.screens[screenKey]) {
        return this.cachedConfig.screens[screenKey];
      }

      throw new Error(`Failed to fetch screen configuration: ${error.message}`);
    }
  }

  /**
   * Get login screen configuration
   */
  async getLoginScreenConfig(): Promise<any> {
    const screen = await this.getScreenConfig('login_screen');
    return screen.config;
  }

  /**
   * Get splash screen configuration
   */
  async getSplashScreenConfig(): Promise<any> {
    const screen = await this.getScreenConfig('splash_screen');
    return screen.config;
  }

  /**
   * Get onboarding screen configuration
   */
  async getOnboardingScreenConfig(): Promise<any> {
    const screen = await this.getScreenConfig('onboarding_screen');
    return screen.config;
  }

  /**
   * Get current theme
   */
  async getTheme(): Promise<ThemeConfig | null> {
    const config = await this.getAppConfig();
    return config.theme;
  }

  /**
   * Get asset by key
   */
  async getAsset(assetKey: string): Promise<AssetInfo> {
    try {
      const response = await this.client.get(`/assets/${assetKey}`);
      return response.data.asset;
    } catch (error: any) {
      console.error(`Error fetching asset ${assetKey}:`, error);
      throw new Error(`Failed to fetch asset: ${error.message}`);
    }
  }

  /**
   * Get assets by type
   */
  async getAssetsByType(assetType: string): Promise<AssetInfo[]> {
    try {
      const platform = this.getPlatform();
      const response = await this.client.get(`/assets/type/${assetType}`, {
        params: { platform }
      });
      return response.data.assets;
    } catch (error: any) {
      console.error(`Error fetching assets of type ${assetType}:`, error);
      return [];
    }
  }

  /**
   * Get background assets
   */
  async getBackgrounds(): Promise<AssetInfo[]> {
    return this.getAssetsByType('background');
  }

  /**
   * Get assets by category
   */
  async getAssetsByCategory(category: string): Promise<AssetInfo[]> {
    try {
      const platform = this.getPlatform();
      const response = await this.client.get(`/assets/category/${category}`, {
        params: { platform }
      });
      return response.data.assets;
    } catch (error: any) {
      console.error(`Error fetching assets for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Get logo assets
   */
  async getLogos(): Promise<AssetInfo[]> {
    return this.getAssetsByCategory('branding');
  }

  /**
   * Get onboarding images
   */
  async getOnboardingImages(): Promise<AssetInfo[]> {
    return this.getAssetsByCategory('onboarding');
  }

  /**
   * Get empty state images
   */
  async getEmptyStateImages(): Promise<AssetInfo[]> {
    return this.getAssetsByCategory('empty_state');
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags(): Promise<Record<string, boolean>> {
    try {
      const platform = this.getPlatform();
      const response = await this.client.get('/features', {
        params: { platform }
      });
      return response.data.features;
    } catch (error: any) {
      console.error('Error fetching feature flags:', error);
      return {};
    }
  }

  /**
   * Check if a feature is enabled
   */
  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    try {
      const config = await this.getAppConfig();
      return config.features[featureKey]?.enabled || false;
    } catch (error) {
      console.error(`Error checking feature ${featureKey}:`, error);
      return false;
    }
  }

  /**
   * Get configuration value by key
   */
  async getConfigValue(configKey: string): Promise<any> {
    try {
      const config = await this.getAppConfig();
      return config.configuration[configKey];
    } catch (error: any) {
      console.error(`Error fetching config value ${configKey}:`, error);
      return null;
    }
  }

  /**
   * Get app branding configuration
   */
  async getBranding(): Promise<any> {
    return this.getConfigValue('app_branding');
  }

  /**
   * Clear cache and force refresh
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONFIG_CACHE_KEY);
      this.cachedConfig = null;
      this.cacheTimestamp = 0;
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get full asset URL
   */
  getAssetUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.baseURL}${url}`;
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async loadFromCache(): Promise<AppConfiguration | null> {
    try {
      const cached = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.cachedAt;
        if (age < CONFIG_CACHE_DURATION) {
          this.cacheTimestamp = data.cachedAt;
          return data.config;
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return null;
  }

  private async saveToCache(config: AppConfiguration): Promise<void> {
    try {
      const data = {
        config,
        cachedAt: Date.now()
      };
      await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  private isCacheValid(): boolean {
    const age = Date.now() - this.cacheTimestamp;
    return age < CONFIG_CACHE_DURATION;
  }

  private getPlatform(): string {
    // Detect platform
    // @ts-ignore
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      // @ts-ignore
      return Platform.OS === 'ios' ? 'ios' : 'android';
    }
    return 'web';
  }
}

// Export singleton instance
export const appConfigService = new AppConfigService();
export default appConfigService;

