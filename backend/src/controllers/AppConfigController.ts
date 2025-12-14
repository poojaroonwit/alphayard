import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * App Configuration Controller
 * Manages dynamic app configuration similar to Adobe Experience Manager (AEM)
 * Handles themes, screens, assets, feature flags, etc.
 */
export class AppConfigController {
  
  /**
   * Get complete app configuration bundle
   * Returns all configuration needed for app initialization
   */
  async getAppConfig(req: Request, res: Response) {
    try {
      const { platform, version } = req.query;

      // Fetch all configuration data in parallel
      const [
        configResult,
        screensResult,
        themesResult,
        featuresResult,
        assetsResult
      ] = await Promise.all([
        supabase.from('app_configuration').select('*').eq('is_active', true),
        supabase.from('app_screens').select('*').eq('is_active', true),
        supabase.from('app_themes').select('*').eq('is_active', true),
        supabase.from('app_feature_flags').select('*'),
        supabase.from('app_assets').select('*').eq('is_active', true)
      ]);

      // Transform configuration into key-value object
      const configuration: Record<string, any> = {};
      if (configResult.data) {
        configResult.data.forEach(config => {
          configuration[config.config_key] = config.config_value;
        });
      }

      // Transform screens into key-value object
      const screens: Record<string, any> = {};
      if (screensResult.data) {
        screensResult.data.forEach(screen => {
          screens[screen.screen_key] = {
            name: screen.screen_name,
            type: screen.screen_type,
            config: screen.configuration,
            version: screen.version
          };
        });
      }

      // Get default theme
      const defaultTheme = themesResult.data?.find(t => t.is_default) || themesResult.data?.[0];

      // Filter feature flags based on platform and version
      let features = featuresResult.data || [];
      if (platform) {
        features = features.filter(f => 
          !f.target_platforms || 
          f.target_platforms.length === 0 || 
          f.target_platforms.includes(platform as string)
        );
      }

      // Filter assets based on platform
      let assets = assetsResult.data || [];
      if (platform) {
        assets = assets.filter(a => 
          a.platform === 'all' || a.platform === platform
        );
      }

      // Transform assets into grouped object
      const assetsByType: Record<string, any[]> = {};
      assets.forEach(asset => {
        if (!assetsByType[asset.asset_type]) {
          assetsByType[asset.asset_type] = [];
        }
        assetsByType[asset.asset_type].push({
          key: asset.asset_key,
          name: asset.asset_name,
          url: asset.asset_url,
          metadata: asset.metadata,
          dimensions: asset.dimensions
        });
      });

      // Build response
      const response = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        configuration,
        screens,
        theme: defaultTheme ? {
          key: defaultTheme.theme_key,
          name: defaultTheme.theme_name,
          config: defaultTheme.theme_config
        } : null,
        features: features.reduce((acc, f) => {
          acc[f.feature_key] = {
            enabled: f.is_enabled,
            rollout: f.rollout_percentage,
            metadata: f.metadata
          };
          return acc;
        }, {} as Record<string, any>),
        assets: assetsByType
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching app config:', error);
      res.status(500).json({ error: 'Failed to fetch app configuration' });
    }
  }

  /**
   * Get specific screen configuration
   */
  async getScreenConfig(req: Request, res: Response) {
    try {
      const { screenKey } = req.params;

      const { data, error } = await supabase
        .from('app_screens')
        .select('*')
        .eq('screen_key', screenKey)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Screen configuration not found' });
      }

      res.json({
        screen: {
          key: data.screen_key,
          name: data.screen_name,
          type: data.screen_type,
          config: data.configuration,
          version: data.version
        }
      });
    } catch (error) {
      console.error('Error fetching screen config:', error);
      res.status(500).json({ error: 'Failed to fetch screen configuration' });
    }
  }

  /**
   * Update screen configuration (Admin only)
   */
  async updateScreenConfig(req: any, res: Response) {
    try {
      const { screenKey } = req.params;
      const { configuration } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // First get current version
      const { data: currentData } = await supabase
        .from('app_screens')
        .select('version')
        .eq('screen_key', screenKey)
        .single();

      const { data, error } = await supabase
        .from('app_screens')
        .update({
          configuration,
          updated_by: userId,
          version: (currentData?.version || 0) + 1
        })
        .eq('screen_key', screenKey)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ screen: data });
    } catch (error) {
      console.error('Error updating screen config:', error);
      res.status(500).json({ error: 'Failed to update screen configuration' });
    }
  }

  /**
   * Get all themes
   */
  async getThemes(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('app_themes')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ themes: data });
    } catch (error) {
      console.error('Error fetching themes:', error);
      res.status(500).json({ error: 'Failed to fetch themes' });
    }
  }

  /**
   * Get specific asset by key
   */
  async getAsset(req: Request, res: Response) {
    try {
      const { assetKey } = req.params;

      const { data, error } = await supabase
        .from('app_assets')
        .select('*')
        .eq('asset_key', assetKey)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      res.json({ asset: data });
    } catch (error) {
      console.error('Error fetching asset:', error);
      res.status(500).json({ error: 'Failed to fetch asset' });
    }
  }

  /**
   * Get assets by type
   */
  async getAssetsByType(req: Request, res: Response) {
    try {
      const { assetType } = req.params;
      const { platform } = req.query;

      let query = supabase
        .from('app_assets')
        .select('*')
        .eq('asset_type', assetType)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (platform) {
        query = query.or(`platform.eq.all,platform.eq.${platform}`);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ assets: data });
    } catch (error) {
      console.error('Error fetching assets:', error);
      res.status(500).json({ error: 'Failed to fetch assets' });
    }
  }

  /**
   * Create or update asset (Admin only)
   */
  async upsertAsset(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const assetData = {
        ...req.body,
        updated_by: userId
      };

      const { data, error } = await supabase
        .from('app_assets')
        .upsert(assetData)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ asset: data });
    } catch (error) {
      console.error('Error upserting asset:', error);
      res.status(500).json({ error: 'Failed to save asset' });
    }
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags(req: Request, res: Response) {
    try {
      const { platform, version } = req.query;

      let query = supabase
        .from('app_feature_flags')
        .select('*');

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Filter by platform if specified
      let features = data || [];
      if (platform) {
        features = features.filter(f => 
          !f.target_platforms || 
          f.target_platforms.length === 0 || 
          f.target_platforms.includes(platform as string)
        );
      }

      // Transform to simple object
      const flags: Record<string, boolean> = {};
      features.forEach(f => {
        flags[f.feature_key] = f.is_enabled;
      });

      res.json({ features: flags, detailed: features });
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      res.status(500).json({ error: 'Failed to fetch feature flags' });
    }
  }

  /**
   * Update feature flag (Admin only)
   */
  async updateFeatureFlag(req: any, res: Response) {
    try {
      const { featureKey } = req.params;
      const { is_enabled, rollout_percentage } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updateData: any = { updated_by: userId };
      if (is_enabled !== undefined) updateData.is_enabled = is_enabled;
      if (rollout_percentage !== undefined) updateData.rollout_percentage = rollout_percentage;

      const { data, error } = await supabase
        .from('app_feature_flags')
        .update(updateData)
        .eq('feature_key', featureKey)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ feature: data });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      res.status(500).json({ error: 'Failed to update feature flag' });
    }
  }

  /**
   * Get app configuration value by key
   */
  async getConfigValue(req: Request, res: Response) {
    try {
      const { configKey } = req.params;

      const { data, error } = await supabase
        .from('app_configuration')
        .select('config_value')
        .eq('config_key', configKey)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      res.json({ value: data.config_value });
    } catch (error) {
      console.error('Error fetching config value:', error);
      res.status(500).json({ error: 'Failed to fetch configuration value' });
    }
  }

  /**
   * Update app configuration (Admin only)
   */
  async updateConfigValue(req: any, res: Response) {
    try {
      const { configKey } = req.params;
      const { value } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // First get current version
      const { data: currentData } = await supabase
        .from('app_configuration')
        .select('version')
        .eq('config_key', configKey)
        .single();

      const { data, error } = await supabase
        .from('app_configuration')
        .update({
          config_value: value,
          updated_by: userId,
          version: (currentData?.version || 0) + 1
        })
        .eq('config_key', configKey)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ config: data });
    } catch (error) {
      console.error('Error updating config value:', error);
      res.status(500).json({ error: 'Failed to update configuration value' });
    }
  }
}

export const appConfigController = new AppConfigController();

