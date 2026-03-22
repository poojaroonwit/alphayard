/**
 * Theme Configuration Service 
 * Fetches component styles from the admin backend API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { appkit } from './api/appkit';

const THEME_CACHE_KEY = 'boundary.theme.config.v1';
const THEME_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Types matching admin panel configuration
export type ColorMode = 'solid' | 'gradient' | 'image' | 'video';

export interface GradientStop {
  id: string;
  color: string;
  position: number;
}

export interface ColorValue {
  mode: ColorMode;
  solid?: string;
  gradient?: {
    type: 'linear' | 'radial';
    angle?: number;
    stops: GradientStop[];
  };
  image?: string;
  video?: string;
}

export interface ComponentStyle {
  backgroundColor: ColorValue;
  textColor: ColorValue;
  borderRadius: number;
  borderColor: ColorValue;
  shadowLevel: 'none' | 'sm' | 'md' | 'lg';
}

export interface ComponentConfig {
  id: string;
  name: string;
  styles: ComponentStyle;
}

export interface CategoryConfig {
  id: string;
  name: string;
  icon: string;
  components: ComponentConfig[];
}

export interface ScreenConfig {
  id: string; // e.g., 'login', 'home', 'welcome'
  name: string;
  background: ColorValue; // Reuse ColorValue which supports image/gradient/solid
  resizeMode: 'cover' | 'contain' | 'stretch' | 'center';
  type: 'screen' | 'modal';
  icon?: string;
  description?: string;
  groupId?: string;
}

export interface ScreenGroup {
  id: string;
  name: string;
  description?: string;
}

export interface BrandingConfig {
  appName: string;
  logoUrl: string;
  faviconUrl?: string; // Add if missing
  
  // New Dynamic Configuration
  screens?: ScreenConfig[];
  screenGroups?: ScreenGroup[];

  // Deprecated Legacy Fields (kept for backward compatibility during migration if needed, but intended to be unused)
  welcomeBackgroundImage?: string;
  welcomeBackgroundResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  homeBackgroundImage?: string;
  homeBackgroundResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  circleBackgroundImage?: string;
  circleBackgroundResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  socialBackgroundImage?: string;
  socialBackgroundResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  chatBackgroundImage?: string;
  chatBackgroundResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  loginBackgroundImage?: string;
  loginBackgroundResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  pinBackgroundImage?: string;
  pinBackgroundResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  onboardingBackgroundImage?: string;
  onboardingBackgroundResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  
  primaryFont: string;
  secondaryFont: string;
    splash: {
      backgroundColor: ColorValue | string;
      spinnerColor: ColorValue | string;
      spinnerType: 'circle' | 'dots' | 'pulse' | 'none';
      showAppName: boolean;
      showLogo: boolean;
      logoAnimation?: 'none' | 'rotate' | 'bounce' | 'pulse' | 'zoom';
      resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
    };
}

export interface ThemeConfig {
  branding: BrandingConfig;
  categories: CategoryConfig[];
  updatedAt?: string;
}

// Shadow configurations for React Native
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Default fallback theme (matches mobile app current styles)
const DEFAULT_THEME: ThemeConfig = {
  branding: {
    appName: 'Boundary',
    logoUrl: '',
    welcomeBackgroundImage: '',
    welcomeBackgroundResizeMode: 'cover',
    homeBackgroundImage: '',
    homeBackgroundResizeMode: 'cover',
    circleBackgroundImage: '',
    circleBackgroundResizeMode: 'cover',
    socialBackgroundImage: '',
    socialBackgroundResizeMode: 'cover',
    chatBackgroundImage: '',
    chatBackgroundResizeMode: 'cover',
    loginBackgroundImage: '',
    loginBackgroundResizeMode: 'cover',
    pinBackgroundImage: '',
    pinBackgroundResizeMode: 'cover',
    onboardingBackgroundImage: '',
    onboardingBackgroundResizeMode: 'cover',
    primaryFont: 'Inter_500Medium',
    secondaryFont: 'Inter_400Regular',
    splash: {
        backgroundColor: '#FFFFFF',
        spinnerColor: '#000000',
        spinnerType: 'circle',
        showAppName: true,
        showLogo: true,
        logoAnimation: 'none',
        resizeMode: 'cover'
    }
  },
  categories: [
    {
      id: 'buttons',
      name: 'Buttons',
      icon: 'buttons',
      components: [
        {
          id: 'primary',
          name: 'Primary Button',
          styles: {
            backgroundColor: { mode: 'solid', solid: '#FFB6C1' },
            textColor: { mode: 'solid', solid: '#FFFFFF' },
            borderRadius: 12,
            borderColor: { mode: 'solid', solid: 'transparent' },
            shadowLevel: 'sm',
          },
        },
        {
          id: 'secondary',
          name: 'Secondary Button',
          styles: {
            backgroundColor: { mode: 'solid', solid: 'rgba(255, 182, 193, 0.1)' },
            textColor: { mode: 'solid', solid: '#374151' },
            borderRadius: 12,
            borderColor: { mode: 'solid', solid: 'rgba(255, 182, 193, 0.2)' },
            shadowLevel: 'sm',
          },
        },
      ],
    },
    {
      id: 'cards',
      name: 'Cards',
      icon: 'cards',
      components: [
        {
          id: 'default',
          name: 'Default Card',
          styles: {
            backgroundColor: { mode: 'solid', solid: 'rgba(255, 255, 255, 0.8)' },
            textColor: { mode: 'solid', solid: '#374151' },
            borderRadius: 16,
            borderColor: { mode: 'solid', solid: 'rgba(255, 182, 193, 0.2)' },
            shadowLevel: 'md',
          },
        },
        {
          id: 'glass',
          name: 'Glass Card',
          styles: {
            backgroundColor: { mode: 'solid', solid: 'rgba(255, 182, 193, 0.1)' },
            textColor: { mode: 'solid', solid: '#374151' },
            borderRadius: 16,
            borderColor: { mode: 'solid', solid: 'rgba(255, 182, 193, 0.2)' },
            shadowLevel: 'lg',
          },
        },
      ],
    },
  ],
};

interface CacheData {
  theme: ThemeConfig;
  timestamp: number;
}

class ThemeConfigService {
  private cachedTheme: ThemeConfig | null = null;
  private cacheTimestamp: number = 0;
  private listeners: Set<(theme: ThemeConfig) => void> = new Set();

  /**
   * Get the current theme configuration
   */
  async getTheme(forceRefresh: boolean = false): Promise<ThemeConfig> {
    // Return cached if valid and not forcing refresh
    if (!forceRefresh && this.cachedTheme && Date.now() - this.cacheTimestamp < THEME_CACHE_TTL) {
      return this.cachedTheme;
    }

    // Try to load from local storage first while fetching
    if (!this.cachedTheme) {
      const cached = await this.loadFromStorage();
      if (cached) {
        this.cachedTheme = cached.theme;
        this.cacheTimestamp = cached.timestamp;
      }
    }

    // Fetch from API
    try {
      const theme = await this.fetchFromAPI();
      if (theme) {
        this.cachedTheme = theme;
        this.cacheTimestamp = Date.now();
        await this.saveToStorage({ theme, timestamp: this.cacheTimestamp });
        this.notifyListeners(theme);
        return theme;
      }
    } catch (error) {
      console.log('[ThemeConfigService] API fetch failed, using cached/default');
    }

    return this.cachedTheme || DEFAULT_THEME;
  }

  /**
   * Helper to fix localhost URLs for Android
   */
  private fixUrl(url?: string): string | undefined {
    if (!url) return undefined;
    
    // If running on Android and URL contains localhost or 127.0.0.1, replace with localhost
    if (Platform.OS === 'android') {
      const hasLocal = url.includes('localhost') || url.includes('127.0.0.1');
      const isAlreadyFixed = url.includes('localhost');
  
      if (hasLocal && !isAlreadyFixed) {
         const fixed = url.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
         console.log(`[ThemeConfigService] Fixing URL: ${url} -> ${fixed}`);
         return fixed;
      }
    }
    return url;
  }

  /**
   * Fetch theme from backend API using AppKit SDK
   */
  private async fetchFromAPI(): Promise<ThemeConfig | null> {
    try {
      console.log('[ThemeConfigService] Fetching config via AppKit SDK...');
      
      // Use SDK branding module
      const data = await appkit.branding.getMobileBranding() as any;
      
      console.log('[ThemeConfigService] Mobile Branding Data Received:', JSON.stringify(data, null, 2));

      if (data) {
        // The SDK might return branding directly or as part of a larger object.
        const branding = data.branding || data.componentStyles?.branding || data;
        
        // Fix image URLs for Android Emulator if the SDK doesn't handle natively
        if (branding) {
           branding.logoUrl = this.fixUrl(branding.logoUrl);
           branding.faviconUrl = this.fixUrl(branding.faviconUrl);
           
           if (branding.screens && Array.isArray(branding.screens)) {
               branding.screens.forEach((screen: ScreenConfig) => {
                   if (screen.background && typeof screen.background === 'object' && screen.background.image) {
                       screen.background.image = this.fixUrl(screen.background.image);
                   }
               });
           }

            branding.welcomeBackgroundImage = this.fixUrl(branding.welcomeBackgroundImage);
            branding.homeBackgroundImage = this.fixUrl(branding.homeBackgroundImage);
            branding.circleBackgroundImage = this.fixUrl(branding.circleBackgroundImage);
            branding.socialBackgroundImage = this.fixUrl(branding.socialBackgroundImage);
            branding.chatBackgroundImage = this.fixUrl(branding.chatBackgroundImage);
            branding.loginBackgroundImage = this.fixUrl(branding.loginBackgroundImage);
            branding.pinBackgroundImage = this.fixUrl(branding.pinBackgroundImage);
            branding.onboardingBackgroundImage = this.fixUrl(branding.onboardingBackgroundImage);
        
            if (branding.splash?.backgroundColor && typeof branding.splash.backgroundColor !== 'string' && branding.splash.backgroundColor.mode === 'image') {
                branding.splash.backgroundColor.image = this.fixUrl(branding.splash.backgroundColor.image);
            }
        }

        return {
          branding: branding,
          categories: data.categories || DEFAULT_THEME.categories,
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('[ThemeConfigService] SDK fetch error:', error);
      return null;
    }
  }

  /**
   * Load theme from AsyncStorage
   */
  private async loadFromStorage(): Promise<CacheData | null> {
    try {
      const raw = await AsyncStorage.getItem(THEME_CACHE_KEY);
      if (raw) {
        return JSON.parse(raw) as CacheData;
      }
    } catch (error) {
      console.error('[ThemeConfigService] Storage load error:', error);
    }
    return null;
  }

  /**
   * Save theme to AsyncStorage
   */
  private async saveToStorage(data: CacheData): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[ThemeConfigService] Storage save error:', error);
    }
  }

  /**
   * Get a specific component style by category and component ID
   */
  getComponentStyle(categoryId: string, componentId: string): ComponentStyle | null {
    const theme = this.cachedTheme || DEFAULT_THEME;
    const category = theme.categories.find(c => c.id === categoryId);
    if (!category) return null;
    const component = category.components.find(c => c.id === componentId);
    return component?.styles || null;
  }

  /**
   * Get branding configuration
   */
  getBranding(): BrandingConfig {
    return this.cachedTheme?.branding || DEFAULT_THEME.branding;
  }

  /**
   * Convert ColorValue to CSS/React Native color string
   */
  colorToString(color: ColorValue): string {
    if (color.mode === 'solid') {
      return color.solid || '#FFFFFF';
    }
    // For gradient/image/video, return the first color or a default
    if (color.mode === 'gradient' && color.gradient?.stops?.length) {
      return color.gradient.stops[0].color;
    }
    return '#FFFFFF';
  }

  /**
   * Get gradient colors array for LinearGradient component
   */
  getGradientColors(color: ColorValue): string[] {
    if (color.mode === 'gradient' && color.gradient?.stops?.length) {
      const sorted = [...color.gradient.stops].sort((a, b) => a.position - b.position);
      return sorted.map(s => s.color);
    }
    return [this.colorToString(color), this.colorToString(color)];
  }

  /**
   * Get gradient locations for LinearGradient component
   */
  getGradientLocations(color: ColorValue): number[] {
    if (color.mode === 'gradient' && color.gradient?.stops?.length) {
      const sorted = [...color.gradient.stops].sort((a, b) => a.position - b.position);
      return sorted.map(s => s.position / 100);
    }
    return [0, 1];
  }

  /**
   * Get shadow style for React Native
   */
  getShadow(level: 'none' | 'sm' | 'md' | 'lg') {
    return SHADOWS[level] || SHADOWS.none;
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (theme: ThemeConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(theme: ThemeConfig): void {
    this.listeners.forEach(listener => listener(theme));
  }

  /**
   * Force refresh the theme from API
   */
  async refresh(): Promise<ThemeConfig> {
    return this.getTheme(true);
  }

  /**
   * Clear cache and reload
   */
  async clearCache(): Promise<void> {
    this.cachedTheme = null;
    this.cacheTimestamp = 0;
    await AsyncStorage.removeItem(THEME_CACHE_KEY);
  }
}

// Export singleton instance
export const themeConfigService = new ThemeConfigService();
export default themeConfigService;

