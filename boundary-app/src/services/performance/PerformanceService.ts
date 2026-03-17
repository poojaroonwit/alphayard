import { PRODUCTION_CONFIG } from '../../config/production';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceConfig {
  cacheEnabled: boolean;
  cacheDuration: number;
  imageCompression: boolean;
  lazyLoading: boolean;
}

export class PerformanceService {
  private static instance: PerformanceService;
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  private constructor() {
    this.config = PRODUCTION_CONFIG.PERFORMANCE;
  }

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Start performance measurement
  startMeasurement(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric(name, duration, 'ms');
    };
  }

  // Record performance metric
  recordMetric(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    console.log('Performance Metric:', metric);
  }

  // Get performance metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics by name
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  // Get average metric value
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  // Cache data
  async cacheData(key: string, data: any, duration?: number): Promise<void> {
    if (!this.config.cacheEnabled) return;

    const cacheDuration = duration || this.config.cacheDuration;
    const cacheEntry = {
      data,
      timestamp: Date.now() + (cacheDuration * 1000),
    };

    this.cache.set(key, cacheEntry);
  }

  // Get cached data
  async getCachedData(key: string): Promise<any | null> {
    if (!this.config.cacheEnabled) return null;

    const cacheEntry = this.cache.get(key);
    if (!cacheEntry) return null;

    // Check if cache has expired
    if (Date.now() > cacheEntry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return cacheEntry.data;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp) {
        this.cache.delete(key);
      }
    }
  }

  // Compress image (placeholder)
  async compressImage(imageUri: string, quality: number = 0.8): Promise<string> {
    if (!this.config.imageCompression) {
      return imageUri;
    }

    try {
      // Here you would implement actual image compression
      // For now, we'll return the original URI
      return imageUri;
    } catch (error) {
      console.error('Image compression error:', error);
      return imageUri;
    }
  }

  // Lazy load component
  lazyLoadComponent<T>(importFn: () => Promise<T>): Promise<T> {
    if (!this.config.lazyLoading) {
      return importFn();
    }

    return new Promise((resolve, reject) => {
      // Add a small delay to simulate lazy loading
      setTimeout(() => {
        importFn()
          .then(resolve)
          .catch(reject);
      }, 100);
    });
  }

  // Monitor memory usage
  getMemoryUsage(): { used: number; total: number; percentage: number } {
    // This is a placeholder - in a real app you'd get actual memory usage
    const used = Math.random() * 100;
    const total = 100;
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  }

  // Monitor network performance
  async measureNetworkPerformance(url: string): Promise<number> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      this.recordMetric('network_request', duration, 'ms', { url });
      
      return duration;
    } catch (error) {
      console.error('Network performance measurement error:', error);
      return -1;
    }
  }

  // Monitor app startup time
  recordAppStartupTime(): void {
    // This should be called when the app finishes loading
    const startupTime = Date.now() - (global as any).appStartTime;
    this.recordMetric('app_startup', startupTime, 'ms');
  }

  // Monitor screen load time
  recordScreenLoadTime(screenName: string): void {
    const loadTime = performance.now() - (global as any)[`${screenName}_start_time`];
    this.recordMetric('screen_load', loadTime, 'ms', { screen: screenName });
  }

  // Start screen load measurement
  startScreenLoadMeasurement(screenName: string): void {
    (global as any)[`${screenName}_start_time`] = performance.now();
  }

  // Get performance report
  getPerformanceReport(): {
    metrics: PerformanceMetric[];
    cacheSize: number;
    memoryUsage: { used: number; total: number; percentage: number };
    averageMetrics: Record<string, number>;
  } {
    const averageMetrics: Record<string, number> = {};
    const uniqueMetricNames = [...new Set(this.metrics.map(m => m.name))];
    
    uniqueMetricNames.forEach(name => {
      averageMetrics[name] = this.getAverageMetric(name);
    });

    return {
      metrics: this.metrics,
      cacheSize: this.cache.size,
      memoryUsage: this.getMemoryUsage(),
      averageMetrics,
    };
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Get performance config
  getPerformanceConfig(): PerformanceConfig {
    return this.config;
  }

  // Update performance config
  updatePerformanceConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const performanceService = PerformanceService.getInstance();
export default performanceService; 
