import { Platform } from 'react-native';
import { PRODUCTION_CONFIG } from '../../config/production';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface UserProperties {
  userId: string;
  circleId?: string;
  subscription?: string;
  deviceType: string;
  appVersion: string;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private isEnabled: boolean;
  private userId?: string;
  private sessionId: string;

  private constructor() {
    this.isEnabled = PRODUCTION_CONFIG.ANALYTICS.enabled;
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Initialize analytics
  initialize(userId: string): void {
    if (!this.isEnabled) return;
    
    this.userId = userId;
    this.trackEvent('app_launched', {
      platform: Platform.OS,
      version: PRODUCTION_CONFIG.APP_VERSION,
    });
  }

  // Track custom events
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    console.log('Analytics Event:', event);
    // Here you would send to your analytics service (Firebase, Mixpanel, etc.)
  }

  // Track screen views
  trackScreen(screenName: string, properties?: Record<string, any>): void {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  // Track user actions
  trackAction(action: string, properties?: Record<string, any>): void {
    this.trackEvent('user_action', {
      action,
      ...properties,
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>): void {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  // Track performance
  trackPerformance(metric: string, value: number, properties?: Record<string, any>): void {
    this.trackEvent('performance', {
      metric,
      value,
      ...properties,
    });
  }

  // Track user properties
  setUserProperties(properties: Partial<UserProperties>): void {
    if (!this.isEnabled) return;

    this.trackEvent('user_properties_updated', properties);
  }

  // Track conversion events
  trackConversion(eventName: string, value?: number, properties?: Record<string, any>): void {
    this.trackEvent('conversion', {
      event_name: eventName,
      value,
      ...properties,
    });
  }

  // Track engagement
  trackEngagement(action: string, duration?: number, properties?: Record<string, any>): void {
    this.trackEvent('engagement', {
      action,
      duration,
      ...properties,
    });
  }

  // Track crashes
  trackCrash(error: Error, context?: Record<string, any>): void {
    this.trackEvent('crash', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  // Generate session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Check if analytics is enabled
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  private sentryDsn?: string;
  private mixpanelToken?: string;
  private googleAnalyticsId?: string;

  // Update configuration from dynamic branding
  updateConfig(config: { sentryDsn?: string; mixpanelToken?: string; googleAnalyticsId?: string; enableDebugLogs?: boolean }): void {
    if (config.sentryDsn) this.sentryDsn = config.sentryDsn;
    if (config.mixpanelToken) this.mixpanelToken = config.mixpanelToken;
    if (config.googleAnalyticsId) this.googleAnalyticsId = config.googleAnalyticsId;
    
    if (config.enableDebugLogs !== undefined) {
        // Logging in production if enabled in admin
        if (config.enableDebugLogs) {
            console.log('[AnalyticsService] Dynamic Debug Logs Enabled');
        }
    }
    
    console.log('[AnalyticsService] Config updated:', {
        hasSentry: !!this.sentryDsn,
        hasMixpanel: !!this.mixpanelToken,
        hasGoogleAnalytics: !!this.googleAnalyticsId,
        googleAnalyticsId: this.googleAnalyticsId
    });

    if (this.googleAnalyticsId) {
        // Initialize GA tracker here (e.g., set tracker ID if using a library)
        console.log(`[AnalyticsService] Initializing Google Analytics with ID: ${this.googleAnalyticsId}`);
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService; 
