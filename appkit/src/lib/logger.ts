import pino from 'pino'
import * as Sentry from '@sentry/nextjs'

const isServer = typeof window === 'undefined'
const isDev = process.env.NODE_ENV !== 'production'

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev && isServer
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    env: process.env.NODE_ENV,
    ...(isServer ? { service: 'appkit-server' } : { service: 'appkit-client' }),
  },
})

export type LogContext = Record<string, unknown>

/**
 * Structured application logger with Sentry integration.
 * 
 * Usage:
 *   import { log } from '@/lib/logger'
 *   log.info('User logged in', { userId: '123', method: 'oauth' })
 *   log.error('Payment failed', { orderId: 'abc', error: err })
 *   log.warn('Rate limit approaching', { ip: '1.2.3.4', remaining: 5 })
 */
export const log = {
  debug(message: string, context?: LogContext) {
    logger.debug(context || {}, message)
  },

  info(message: string, context?: LogContext) {
    logger.info(context || {}, message)
  },

  warn(message: string, context?: LogContext) {
    logger.warn(context || {}, message)
    if (!isDev) {
      Sentry.addBreadcrumb({ message, level: 'warning', data: context })
    }
  },

  error(message: string, context?: LogContext & { error?: Error | unknown }) {
    const { error, ...rest } = context || {}
    logger.error({ ...rest, err: error }, message)

    if (!isDev) {
      if (error instanceof Error) {
        Sentry.captureException(error, { extra: rest })
      } else {
        Sentry.captureMessage(message, { level: 'error', extra: context })
      }
    }
  },

  fatal(message: string, context?: LogContext & { error?: Error | unknown }) {
    const { error, ...rest } = context || {}
    logger.fatal({ ...rest, err: error }, message)

    if (!isDev) {
      if (error instanceof Error) {
        Sentry.captureException(error, { level: 'fatal', extra: rest })
      } else {
        Sentry.captureMessage(message, { level: 'fatal', extra: context })
      }
    }
  },

  /** Add user context for Sentry error tracking */
  setUser(user: { id: string; email?: string; name?: string }) {
    Sentry.setUser(user)
  },

  /** Clear user context (on logout) */
  clearUser() {
    Sentry.setUser(null)
  },

  /** Add a breadcrumb for Sentry (traces user journey before an error) */
  breadcrumb(message: string, category: string, data?: Record<string, string>) {
    Sentry.addBreadcrumb({ message, category, data, level: 'info' })
  },

  /** Create a child logger with bound context */
  child(bindings: LogContext) {
    const childLogger = logger.child(bindings)
    return {
      debug: (msg: string, ctx?: LogContext) => childLogger.debug(ctx || {}, msg),
      info: (msg: string, ctx?: LogContext) => childLogger.info(ctx || {}, msg),
      warn: (msg: string, ctx?: LogContext) => childLogger.warn(ctx || {}, msg),
      error: (msg: string, ctx?: LogContext) => childLogger.error(ctx || {}, msg),
    }
  },
}

export default log
