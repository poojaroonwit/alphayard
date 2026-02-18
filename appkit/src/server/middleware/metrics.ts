import { Request, Response, NextFunction } from 'express';
import { promisify } from 'util';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry for our metrics
const registry = new Registry();

// Default metrics (process info, etc.)
collectDefaultMetrics({
  register: registry,
  prefix: 'appkit_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom metrics
const httpRequestDuration = new Histogram({
  name: 'appkit_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

const httpRequestTotal = new Counter({
  name: 'appkit_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

const activeConnections = new Gauge({
  name: 'appkit_active_connections',
  help: 'Number of active connections',
  registers: [registry],
});

const databaseConnections = new Gauge({
  name: 'appkit_database_connections',
  help: 'Number of active database connections',
  registers: [registry],
});

const redisConnections = new Gauge({
  name: 'appkit_redis_connections',
  help: 'Number of active Redis connections',
  registers: [registry],
});

const authenticationAttempts = new Counter({
  name: 'appkit_authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status'],
  registers: [registry],
});

const rateLimitHits = new Counter({
  name: 'appkit_rate_limit_hits_total',
  help: 'Total number of rate limit hits',
  labelNames: ['endpoint', 'client_ip'],
  registers: [registry],
});

const errorCount = new Counter({
  name: 'appkit_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'route'],
  registers: [registry],
});

const userSessions = new Gauge({
  name: 'appkit_user_sessions',
  help: 'Number of active user sessions',
  registers: [registry],
});

const fileUploads = new Counter({
  name: 'appkit_file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['status', 'file_type'],
  registers: [registry],
});

const apiResponseSize = new Histogram({
  name: 'appkit_api_response_size_bytes',
  help: 'Size of API responses in bytes',
  labelNames: ['route'],
  buckets: [100, 1000, 10000, 100000, 1000000],
  registers: [registry],
});

class MetricsService {
  private static instance: MetricsService;
  private connectionCount: number = 0;

  private constructor() {}

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Middleware to collect HTTP request metrics
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      
      // Increment connection count
      this.connectionCount++;
      activeConnections.set(this.connectionCount);

      // Track response size
      const originalSend = res.send;
      res.send = function(data) {
        const responseSize = Buffer.byteLength(data || '', 'utf8');
        apiResponseSize
          .labels(req.route?.path || req.path)
          .observe(responseSize);
        return originalSend.call(this, data);
      };

      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route?.path || req.path;
        const statusCode = res.statusCode.toString();

        // Record request duration
        httpRequestDuration
          .labels(req.method, route, statusCode)
          .observe(duration);

        // Record request count
        httpRequestTotal
          .labels(req.method, route, statusCode)
          .inc();

        // Decrement connection count
        this.connectionCount--;
        activeConnections.set(this.connectionCount);

        // Record errors
        if (res.statusCode >= 400) {
          const errorType = res.statusCode >= 500 ? 'server' : 'client';
          errorCount.labels(errorType, route).inc();
        }
      });

      next();
    };
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(method: string, status: 'success' | 'failure'): void {
    authenticationAttempts.labels(method, status).inc();
  }

  /**
   * Record rate limit hit
   */
  recordRateLimitHit(endpoint: string, clientIp: string): void {
    rateLimitHits.labels(endpoint, clientIp).inc();
  }

  /**
   * Record file upload
   */
  recordFileUpload(status: 'success' | 'failure', fileType: string): void {
    fileUploads.labels(status, fileType).inc();
  }

  /**
   * Update database connection count
   */
  updateDatabaseConnections(count: number): void {
    databaseConnections.set(count);
  }

  /**
   * Update Redis connection count
   */
  updateRedisConnections(count: number): void {
    redisConnections.set(count);
  }

  /**
   * Update active user sessions
   */
  updateUserSessions(count: number): void {
    userSessions.set(count);
  }

  /**
   * Record custom business metric
   */
  recordBusinessMetric(name: string, value: number, labels?: Record<string, string>): void {
    const gauge = new Gauge({
      name: `appkit_business_${name}`,
      help: `Business metric: ${name}`,
      labelNames: labels ? Object.keys(labels) : [],
      registers: [registry],
    });

    if (labels) {
      gauge.labels(labels).set(value);
    } else {
      gauge.set(value);
    }
  }

  /**
   * Get metrics registry
   */
  getRegistry(): Registry {
    return registry;
  }

  /**
   * Get metrics for Prometheus
   */
  async getMetrics(): Promise<string> {
    return registry.metrics();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    registry.clear();
    collectDefaultMetrics({
      register: registry,
      prefix: 'appkit_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });
  }
}

export const metricsService = MetricsService.getInstance();

// Metrics endpoint middleware
export function metricsEndpoint(req: Request, res: Response): void {
  res.set('Content-Type', registry.contentType);
  res.end(registry.metrics());
}

// Health check metrics
export function updateHealthMetrics(healthData: any): void {
  // Update database health
  const dbHealthy = healthData.checks?.database?.status === 'healthy' ? 1 : 0;
  metricsService.recordBusinessMetric('database_healthy', dbHealthy);

  // Update Redis health
  const redisHealthy = healthData.checks?.redis?.status === 'healthy' ? 1 : 0;
  metricsService.recordBusinessMetric('redis_healthy', redisHealthy);

  // Update memory usage
  const memoryUsage = healthData.checks?.memory?.details?.percentage || 0;
  metricsService.recordBusinessMetric('memory_usage_percent', memoryUsage);

  // Update disk usage
  const diskUsage = healthData.checks?.disk?.details?.percentage || 0;
  metricsService.recordBusinessMetric('disk_usage_percent', diskUsage);
}

export default metricsService;
