export const PRODUCTION_CONFIG = {
  // API Configuration
  API_BASE_URL: 'https://api.boundary.com/api/v1',
  API_TIMEOUT: 30000,
  
  // App Configuration
  APP_NAME: 'Boundary',
  APP_VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  
  // Feature Flags
  FEATURES: {
    LOCATION_TRACKING: true,
    PUSH_NOTIFICATIONS: true,
    VOICE_CALLS: true,
    VIDEO_CALLS: true,
    FILE_SHARING: true,
    EMERGENCY_ALERTS: true,
    CIRCLE_CHAT: true,
    CALENDAR: true,
    EXPENSES: true,
    PHOTOS: true,
  },
  
  // Security
  SECURITY: {
    encryptionEnabled: true,
    biometricAuth: true,
    sessionTimeout: 3600, // 1 hour
    maxLoginAttempts: 5,
  },
  
  // Performance
  PERFORMANCE: {
    cacheEnabled: true,
    cacheDuration: 300, // 5 minutes
    imageCompression: true,
    lazyLoading: true,
  },
  
  // Analytics
  ANALYTICS: {
    enabled: true,
    trackEvents: true,
    trackCrashes: true,
    trackPerformance: true,
  },
  
  // Monitoring
  MONITORING: {
    errorReporting: true,
    performanceMonitoring: true,
    crashReporting: true,
  },
}; 
