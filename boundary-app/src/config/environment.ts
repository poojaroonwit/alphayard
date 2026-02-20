// Environment Configuration for Boundary Mobile App

export interface EnvironmentConfig {
  // API Configuration
  apiUrl: string;

  // Application Configuration
  appName: string;
  appVersion: string;
  appId: string; // Unique identifier for multi-tenant backend
  appSlug: string; // Human-readable app identifier

  // Social Authentication
  googleClientId?: string;
  facebookAppId?: string;
  appleClientId?: string;

  // Push Notifications
  pushNotificationKey?: string;

  // Analytics & Monitoring
  analyticsKey?: string;
  errorReportingKey?: string;

  // Feature Flags
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePushNotifications: boolean;
  enableLocationServices: boolean;

  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  // __DEV__ is a React Native global. Provide a fallback for web environments (e.g., Next.js).
  const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';
  const isProduction = !isDevelopment;

  return {
    // API Configuration
    // Dev: ensure backend is running. For web use localhost; for device/emulator use EXPO_PUBLIC_API_URL=http://<your-pc-ip>:4000/api/v1
    apiUrl: process.env.EXPO_PUBLIC_API_URL || (isDevelopment ? 'http://localhost:4000/api/v1' : 'https://your-api-domain.com'),

    // Application Configuration
    appName: process.env.EXPO_PUBLIC_APP_NAME || 'Boundary',
    appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    // Multi-tenant application identifier - used in X-App-ID header
    // Set EXPO_PUBLIC_APP_ID to the application UUID from backend
    // Set EXPO_PUBLIC_APP_SLUG if using slug-based identification
    appId: process.env.EXPO_PUBLIC_APP_ID || '',
    appSlug: process.env.EXPO_PUBLIC_APP_SLUG || 'boundary',

    // Social Authentication
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    appleClientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID,

    // Push Notifications
    pushNotificationKey: process.env.EXPO_PUBLIC_PUSH_NOTIFICATION_KEY,

    // Analytics & Monitoring
    analyticsKey: process.env.EXPO_PUBLIC_ANALYTICS_KEY,
    errorReportingKey: process.env.EXPO_PUBLIC_ERROR_REPORTING_KEY,

    // Feature Flags
    enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true' || isProduction,
    enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true' || isProduction,
    enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true' || isProduction,
    enableLocationServices: process.env.EXPO_PUBLIC_ENABLE_LOCATION_SERVICES !== 'false',

    // Environment
    isDevelopment,
    isProduction,
  };
};

export const config = getEnvironmentConfig();

// Validation function to check if required environment variables are set
export const validateEnvironment = (): { isValid: boolean; missingVars: string[] } => {
  const missingVars: string[] = [];

  if (!config.apiUrl || config.apiUrl === 'https://your-api-domain.com') {
    missingVars.push('EXPO_PUBLIC_API_URL');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
};

// Log environment configuration (only in development)
if (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production') {
  console.log('🔧 Environment Configuration:', {
    appName: config.appName,
    appVersion: config.appVersion,
    apiUrl: config.apiUrl,
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
  });

  const validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('[WARN] Missing environment variables:', validation.missingVars);
    console.warn('Please set these variables in your .env file or environment');
  }
}

export default config;
