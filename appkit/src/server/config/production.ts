import { config } from './env';

/**
 * Production-specific security configurations
 * These settings override development defaults when NODE_ENV=production
 */

export const productionConfig = {
  // Security settings
  security: {
    // JWT settings
    jwt: {
      algorithm: 'HS256',
      expiresIn: config.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: '7d',
      issuer: 'appkit.com',
      audience: 'appkit-api',
    },

    // Password policies
    passwordPolicy: {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
      preventUserInfo: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
    },

    // Session settings
    session: {
      timeout: 30 * 60 * 1000, // 30 minutes
      maxConcurrent: 3,
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
    },

    // Rate limiting
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: {
        general: 100,
        auth: 5,
        upload: 50,
        admin: 200,
        passwordReset: 3,
      },
      blockDuration: 60 * 60 * 1000, // 1 hour
    },

    // CORS settings
    cors: {
      allowedOrigins: [
        'https://appkit.com',
        'https://admin.appkit.com',
        'https://api.appkit.com',
      ],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
    },
  },

  // Database settings
  database: {
    connectionTimeout: 10000,
    queryTimeout: 30000,
    maxConnections: 20,
    idleTimeout: 30000,
    ssl: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
  },

  // File upload settings
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/json',
    ],
    scanForMalware: true,
    virusScanEnabled: true,
  },

  // Logging settings
  logging: {
    level: 'info',
    format: 'json',
    auditSensitive: true,
    retentionDays: 90,
    enableFileLogging: true,
    enableConsoleLogging: false,
  },

  // Monitoring settings
  monitoring: {
    enableMetrics: true,
    enableHealthChecks: true,
    enablePerformanceMonitoring: true,
    enableSecurityMonitoring: true,
    alertThresholds: {
      errorRate: 0.05, // 5%
      responseTime: 2000, // 2 seconds
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8, // 80%
    },
  },

  // Backup settings
  backup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 30, // 30 days
    encryption: true,
    compression: true,
  },

  // SSL/TLS settings
  ssl: {
    enabled: true,
    forceHttps: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    certificates: {
      autoRenew: true,
      renewBefore: 30, // days before expiry
    },
  },
};

/**
 * Validate production configuration
 */
export function validateProductionConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_HOST',
    'REDIS_PORT',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Check JWT secret strength
  if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Check database URL format
  if (config.DATABASE_URL && !config.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Check CORS origins
  if (process.env.NODE_ENV === 'production' && config.CORS_ORIGIN === '*') {
    errors.push('CORS_ORIGIN cannot be "*" in production');
  }

  // Check rate limiting settings
  if (process.env.NODE_ENV === 'production') {
    const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
    if (rateLimitMax > 1000) {
      errors.push('RATE_LIMIT_MAX_REQUESTS should not exceed 1000 in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get production-ready configuration
 */
export function getProductionConfig() {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('âš ï¸  Production config requested but NODE_ENV is not "production"');
  }

  const validation = validateProductionConfig();
  if (!validation.isValid) {
    throw new Error(`Production configuration validation failed:\n${validation.errors.join('\n')}`);
  }

  return productionConfig;
}

/**
 * Security headers for production
 */
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.appkit.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-Robots-Tag': 'none',
};

export default productionConfig;
