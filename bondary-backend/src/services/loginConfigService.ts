import { ApplicationModel } from '../models/ApplicationModel';
import { LoginUIConfig, AppLoginConfig, DEFAULT_LOGIN_CONFIG } from '../types/loginConfig';
import { logger } from '../middleware/logger';

export class LoginConfigService {
  /**
   * Get login configuration for a specific application
   */
  async getLoginConfig(appId: string): Promise<LoginUIConfig> {
    try {
      const application = await ApplicationModel.findById(appId);

      if (!application) {
        logger.warn(`[LoginConfig] Application not found: ${appId}`);
        return this.mergeWithDefaults({}) as LoginUIConfig;
      }

      // Extract login config from application settings
      const settings = application.settings as any;
      const branding = application.branding as any;

      // Build login config from application data
      const appConfig: Partial<LoginUIConfig> = {
        branding: {
          appName: application.name,
          primaryColor: branding?.primaryColor,
          secondaryColor: branding?.secondaryColor,
          accentColor: branding?.accentColor,
          fontFamily: branding?.fontFamily,
          tagline: branding?.tagline,
          description: branding?.description
        },
        background: settings?.loginBackground || DEFAULT_LOGIN_CONFIG.background,
        layout: settings?.loginLayout || DEFAULT_LOGIN_CONFIG.layout,
        form: settings?.loginForm || DEFAULT_LOGIN_CONFIG.form,
        socialLogin: settings?.socialLogin,
        sso: settings?.sso,
        security: settings?.loginSecurity || DEFAULT_LOGIN_CONFIG.security,
        analytics: settings?.loginAnalytics || DEFAULT_LOGIN_CONFIG.analytics,
        customCSS: settings?.customCSS,
        customJS: settings?.customJS,
        theme: settings?.theme || DEFAULT_LOGIN_CONFIG.theme,
        animations: settings?.animations !== undefined ? settings.animations : DEFAULT_LOGIN_CONFIG.animations,
        locale: settings?.locale || DEFAULT_LOGIN_CONFIG.locale,
        translations: settings?.translations
      };

      return this.mergeWithDefaults(appConfig) as LoginUIConfig;
    } catch (error) {
      logger.error('[LoginConfig] Error getting login config:', error);
      return this.mergeWithDefaults({}) as LoginUIConfig;
    }
  }

  /**
   * Get login configuration by application slug
   */
  async getLoginConfigBySlug(slug: string): Promise<LoginUIConfig> {
    try {
      const application = await ApplicationModel.findBySlug(slug);

      if (!application) {
        logger.warn(`[LoginConfig] Application not found for slug: ${slug}`);
        return this.mergeWithDefaults({}) as LoginUIConfig;
      }

      return this.getLoginConfig(application.id);
    } catch (error) {
      logger.error('[LoginConfig] Error getting login config by slug:', error);
      return this.mergeWithDefaults({}) as LoginUIConfig;
    }
  }

  /**
   * Update login configuration for an application
   */
  async updateLoginConfig(appId: string, config: Partial<LoginUIConfig>): Promise<LoginUIConfig> {
    try {
      const application = await ApplicationModel.findById(appId);

      if (!application) {
        throw new Error(`Application not found: ${appId}`);
      }

      // Extract current settings and branding
      const currentSettings = application.settings as any;
      const currentBranding = application.branding as any;

      // Merge new config with existing data
      const updatedSettings = {
        ...currentSettings,
        loginBackground: config.background,
        loginLayout: config.layout,
        loginForm: config.form,
        socialLogin: config.socialLogin,
        sso: config.sso,
        loginSecurity: config.security,
        loginAnalytics: config.analytics,
        customCSS: config.customCSS,
        customJS: config.customJS,
        theme: config.theme,
        animations: config.animations,
        locale: config.locale,
        translations: config.translations
      };

      const updatedBranding = {
        ...currentBranding,
        primaryColor: config.branding?.primaryColor,
        secondaryColor: config.branding?.secondaryColor,
        accentColor: config.branding?.accentColor,
        fontFamily: config.branding?.fontFamily,
        tagline: config.branding?.tagline,
        description: config.branding?.description
      };

      // Update application using ApplicationModel
      const updatedApplication = await ApplicationModel.update(appId, {
        name: config.branding?.appName || application.name,
        branding: updatedBranding,
        settings: updatedSettings
      });

      if (!updatedApplication) {
        throw new Error('Failed to update application');
      }

      logger.info(`[LoginConfig] Updated login config for app: ${appId}`);
      return this.getLoginConfig(appId);
    } catch (error) {
      logger.error('[LoginConfig] Error updating login config:', error);
      throw error;
    }
  }

  /**
   * Get all login configurations (for admin management)
   */
  async getAllLoginConfigs(): Promise<AppLoginConfig[]> {
    try {
      const applications = await ApplicationModel.findAll();

      return applications.map(app => ({
        appId: app.id,
        config: this.buildConfigFromApplication(app),
        isActive: true,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }));
    } catch (error) {
      logger.error('[LoginConfig] Error getting all login configs:', error);
      throw error;
    }
  }

  /**
   * Clone login configuration from one app to another
   */
  async cloneLoginConfig(fromAppId: string, toAppId: string): Promise<LoginUIConfig> {
    try {
      const sourceConfig = await this.getLoginConfig(fromAppId);
      return this.updateLoginConfig(toAppId, sourceConfig);
    } catch (error) {
      logger.error('[LoginConfig] Error cloning login config:', error);
      throw error;
    }
  }

  /**
   * Reset login configuration to defaults
   */
  async resetLoginConfig(appId: string): Promise<LoginUIConfig> {
    try {
      return this.updateLoginConfig(appId, DEFAULT_LOGIN_CONFIG);
    } catch (error) {
      logger.error('[LoginConfig] Error resetting login config:', error);
      throw error;
    }
  }

  /**
   * Validate login configuration
   */
  validateLoginConfig(config: Partial<LoginUIConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate branding
    if (config.branding?.primaryColor && !this.isValidColor(config.branding.primaryColor)) {
      errors.push('Invalid primary color format');
    }
    if (config.branding?.secondaryColor && !this.isValidColor(config.branding.secondaryColor)) {
      errors.push('Invalid secondary color format');
    }
    if (config.branding?.accentColor && !this.isValidColor(config.branding.accentColor)) {
      errors.push('Invalid accent color format');
    }

    // Validate background
    if (config.background?.type && !['solid', 'gradient', 'image', 'video', 'pattern'].includes(config.background.type)) {
      errors.push('Invalid background type');
    }
    if (config.background?.gradientStops && !Array.isArray(config.background.gradientStops)) {
      errors.push('Gradient stops must be an array');
    }

    // Validate layout
    if (config.layout?.layout && !['centered', 'split', 'full-width', 'card'].includes(config.layout.layout)) {
      errors.push('Invalid layout type');
    }

    // Validate theme
    if (config.theme && !['light', 'dark', 'auto'].includes(config.theme)) {
      errors.push('Invalid theme value');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper method to merge config with defaults
   */
  private mergeWithDefaults(config: Partial<LoginUIConfig>): Partial<LoginUIConfig> {
    return {
      branding: { ...DEFAULT_LOGIN_CONFIG.branding, ...config.branding },
      background: { 
        type: 'gradient',
        gradientStops: [],
        gradientDirection: 'to right',
        ...DEFAULT_LOGIN_CONFIG.background, 
        ...config.background 
      },
      layout: { 
        layout: 'centered',
        maxWidth: '400px',
        padding: '2rem',
        borderRadius: '1rem',
        shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        backdropBlur: true,
        showBranding: true,
        showFooter: true,
        ...DEFAULT_LOGIN_CONFIG.layout, 
        ...config.layout 
      },
      form: { ...DEFAULT_LOGIN_CONFIG.form, ...config.form },
      socialLogin: config.socialLogin || DEFAULT_LOGIN_CONFIG.socialLogin,
      sso: config.sso || DEFAULT_LOGIN_CONFIG.sso,
      security: { ...DEFAULT_LOGIN_CONFIG.security, ...config.security },
      analytics: { ...DEFAULT_LOGIN_CONFIG.analytics, ...config.analytics },
      customCSS: config.customCSS || DEFAULT_LOGIN_CONFIG.customCSS,
      customJS: config.customJS || DEFAULT_LOGIN_CONFIG.customJS,
      theme: config.theme || DEFAULT_LOGIN_CONFIG.theme,
      animations: config.animations !== undefined ? config.animations : DEFAULT_LOGIN_CONFIG.animations,
      locale: config.locale || DEFAULT_LOGIN_CONFIG.locale,
      translations: config.translations || DEFAULT_LOGIN_CONFIG.translations
    };
  }

  /**
   * Helper method to build config from application data
   */
  private buildConfigFromApplication(app: any): LoginUIConfig {
    const settings = app.settings as any;
    const branding = app.branding as any;

    return this.mergeWithDefaults({
      branding: {
        appName: app.name,
        logoUrl: app.logoUrl,
        primaryColor: branding?.primaryColor,
        secondaryColor: branding?.secondaryColor,
        accentColor: branding?.accentColor,
        fontFamily: branding?.fontFamily,
        tagline: branding?.tagline,
        description: branding?.description
      },
      background: settings?.loginBackground,
      layout: settings?.loginLayout,
      form: settings?.loginForm,
      socialLogin: settings?.socialLogin,
      sso: settings?.sso,
      security: settings?.loginSecurity,
      analytics: settings?.loginAnalytics,
      customCSS: settings?.customCSS,
      customJS: settings?.customJS,
      theme: settings?.theme,
      animations: settings?.animations,
      locale: settings?.locale,
      translations: settings?.translations
    }) as LoginUIConfig;
  }

  /**
   * Helper method to validate color format
   */
  private isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color) || 
           /^rgb\(\d+,\s*\d+,\s*\d+\)$/.test(color) ||
           /^rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)$/.test(color) ||
           /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/.test(color) ||
           /^hsla\(\d+,\s*\d+%,\s*\d+%,\s*[\d.]+\)$/.test(color);
  }
}

export const loginConfigService = new LoginConfigService();
