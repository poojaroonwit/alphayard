import { useState, useEffect } from 'react';
import { appConfigService } from '../services/appConfigService';

/**
 * Hook to fetch and manage app configuration
 * Provides access to dynamic backgrounds, themes, and settings
 */

export interface ScreenConfig {
  background?: {
    type?: 'gradient' | 'image' | 'color';
    gradient?: string[];
    image_url?: string;
    color?: string;
    overlay_opacity?: number;
  };
  [key: string]: any;
}

export function useAppConfig() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await appConfigService.getAppConfig();
      setConfig(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading app config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadConfig();
  };

  return { config, loading, error, refresh };
}

/**
 * Hook to fetch screen configuration by key
 */
export function useScreenConfig(screenKey: string) {
  const [screenConfig, setScreenConfig] = useState<ScreenConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScreenConfig();
  }, [screenKey]);

  const loadScreenConfig = async () => {
    try {
      setLoading(true);
      const data = await appConfigService.getScreenConfig(screenKey);
      setScreenConfig(data.config);
      setError(null);
    } catch (err: any) {
      console.error(`Error loading screen config for ${screenKey}:`, err);
      setError(err.message);
      // Set default config on error
      setScreenConfig(getDefaultScreenConfig(screenKey));
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadScreenConfig();
  };

  return { screenConfig, loading, error, refresh };
}

/**
 * Hook specifically for login screen background
 * Returns default config immediately to prevent loading delays
 */
export function useLoginBackground() {
  const { screenConfig, loading, error } = useScreenConfig('login_screen');

  // Default background - use immediately to prevent loading delay
  const defaultBackground = {
    type: 'gradient' as const,
    gradient: ['#FA7272', '#FFBBB4'],
    overlay_opacity: 0.7
  };

  return {
    // Return loaded background if available, otherwise use default immediately
    background: screenConfig?.background || defaultBackground,
    loading: false, // Never show loading state - always show default immediately
    error
  };
}

/**
 * Hook specifically for home screen background
 */
export function useHomeBackground() {
  const { screenConfig, loading, error } = useScreenConfig('home_screen');

  return {
    background: screenConfig?.background,
    banner: screenConfig?.banner,
    loading,
    error
  };
}

/**
 * Hook to check if a feature is enabled
 */
export function useFeatureFlag(featureKey: string): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkFeature();
  }, [featureKey]);

  const checkFeature = async () => {
    try {
      const enabled = await appConfigService.isFeatureEnabled(featureKey);
      setIsEnabled(enabled);
    } catch (error) {
      console.error(`Error checking feature ${featureKey}:`, error);
      setIsEnabled(false);
    }
  };

  return isEnabled;
}

/**
 * Hook to get app theme
 */
export function useAppTheme() {
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      setLoading(true);
      const themeData = await appConfigService.getTheme();
      setTheme(themeData);
    } catch (error) {
      console.error('Error loading theme:', error);
      setTheme(getDefaultTheme());
    } finally {
      setLoading(false);
    }
  };

  return { theme, loading };
}

/**
 * Hook to get a specific asset by key
 */
export function useAppAsset(assetKey: string) {
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAsset();
  }, [assetKey]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const data = await appConfigService.getAsset(assetKey);
      setAsset(data);
      setError(null);
    } catch (err: any) {
      console.error(`Error loading asset ${assetKey}:`, err);
      setError(err.message);
      setAsset(null);
    } finally {
      setLoading(false);
    }
  };

  return { asset, loading, error };
}

/**
 * Hook to get assets by category
 */
export function useAssetsByCategory(category: string) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, [category]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const data = await appConfigService.getAssetsByCategory(category);
      setAssets(data);
      setError(null);
    } catch (err: any) {
      console.error(`Error loading assets for category ${category}:`, err);
      setError(err.message);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  return { assets, loading, error };
}

/**
 * Hook to get logo assets
 */
export function useLogos() {
  return useAssetsByCategory('branding');
}

/**
 * Hook to get onboarding images
 */
export function useOnboardingImages() {
  return useAssetsByCategory('onboarding');
}

/**
 * Hook to get empty state images
 */
export function useEmptyStateImages() {
  return useAssetsByCategory('empty_state');
}

/**
 * Hook to get a specific logo (primary, white, or small)
 */
export function useLogo(logoType: 'primary' | 'white' | 'small' = 'primary') {
  const assetKey = `logo_${logoType}`;
  return useAppAsset(assetKey);
}

// Default configurations
function getDefaultScreenConfig(screenKey: string): ScreenConfig {
  const defaults: Record<string, ScreenConfig> = {
    login_screen: {
      background: {
        type: 'gradient',
        gradient: ['#FA7272', '#FFBBB4'],
        overlay_opacity: 0.7
      }
    },
    home_screen: {
      background: {
        type: 'gradient',
        gradient: ['#FFFFFF', '#F5F5F5']
      }
    },
    splash_screen: {
      background: {
        type: 'gradient',
        gradient: ['#FA7272', '#FFBBB4']
      }
    }
  };

  return defaults[screenKey] || { background: { type: 'color', color: '#FFFFFF' } };
}

function getDefaultTheme() {
  return {
    key: 'default',
    name: 'Default Theme',
    config: {
      colors: {
        primary: '#FA7272',
        secondary: '#FFD700',
        background: '#FFFFFF',
        text: '#333333'
      }
    }
  };
}

