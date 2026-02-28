import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  
  // Session Replay (captures user interactions leading to errors)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',

  // Environment tag
  environment: process.env.NODE_ENV,

  // Filter out noisy errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    /Loading chunk \d+ failed/,
    /NetworkError/,
  ],

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
})
