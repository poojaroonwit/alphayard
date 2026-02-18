import { ContentPage, ContentComponent } from './productionCmsService'

// Performance monitoring and optimization service
export class PerformanceService {
  private static instance: PerformanceService
  private metrics: Map<string, PerformanceMetric> = new Map()
  private cache: Map<string, CacheEntry> = new Map()
  private cacheConfig: CacheConfig = {
    maxSize: 100,
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true
  }

  private constructor() {
    this.startCleanupInterval()
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService()
    }
    return PerformanceService.instance
  }

  // Performance Metrics
  public startTiming(key: string): void {
    this.metrics.set(key, {
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      metadata: {}
    })
  }

  public endTiming(key: string, metadata?: Record<string, any>): number {
    const metric = this.metrics.get(key)
    if (!metric) {
      console.warn(`No timing found for key: ${key}`)
      return 0
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata }
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`Slow operation detected: ${key} took ${metric.duration.toFixed(2)}ms`)
    }

    return metric.duration
  }

  public getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics)
  }

  public clearMetrics(): void {
    this.metrics.clear()
  }

  // Caching System
  public setCache<T>(key: string, value: T, ttl?: number): void {
    if (!this.cacheConfig.enabled) return

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.cacheConfig.ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    }

    this.cache.set(key, entry)
    this.enforceCacheSize()
  }

  public getCache<T>(key: string): T | null {
    if (!this.cacheConfig.enabled) return null

    const entry = this.cache.get(key) as CacheEntry<T>
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = Date.now()

    return entry.value
  }

  public invalidateCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      const keys = Array.from(this.cache.keys())
      for (const key of keys) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  public getCacheStats(): CacheStats {
    const entries = Array.from(this.cache.values())
    const totalSize = this.cache.size
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    const avgAccessTime = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + (Date.now() - entry.lastAccessed), 0) / entries.length
      : 0

    return {
      totalEntries: totalSize,
      totalAccesses,
      averageAccessTime: avgAccessTime,
      hitRate: totalAccesses > 0 ? (totalAccesses / (totalAccesses + this.getMissCount())) * 100 : 0,
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  // Content Optimization
  public optimizeContent(content: ContentPage): OptimizedContent {
    const startTime = performance.now()
    
    // Optimize components
    const optimizedComponents = content.components.map(component => 
      this.optimizeComponent(component)
    )

    // Generate cache key
    const cacheKey = this.generateContentCacheKey(content)
    
    // Optimize images
    const imageOptimizations = this.optimizeImages(optimizedComponents)
    
    // Generate critical CSS
    const criticalCSS = this.generateCriticalCSS(optimizedComponents)
    
    // Preload resources
    const preloadResources = this.generatePreloadResources(optimizedComponents)

    const endTime = performance.now()
    const optimizationTime = endTime - startTime

    return {
      ...content,
      components: optimizedComponents,
      optimizations: {
        cacheKey,
        imageOptimizations,
        criticalCSS,
        preloadResources,
        optimizationTime
      }
    }
  }

  private optimizeComponent(component: ContentComponent): ContentComponent {
    // Remove empty props
    const cleanedProps = Object.fromEntries(
      Object.entries(component.props).filter(([_, value]) => 
        value !== null && value !== undefined && value !== ''
      )
    )

    // Optimize image URLs
    if (component.type === 'image' && component.props.src) {
      cleanedProps.src = this.optimizeImageUrl(component.props.src)
    }

    return {
      ...component,
      props: cleanedProps
    }
  }

  private optimizeImageUrl(url: string): string {
    // Add image optimization parameters
    const urlObj = new URL(url)
    
    // Add WebP format if supported
    if (this.supportsWebP()) {
      urlObj.searchParams.set('format', 'webp')
    }
    
    // Add quality parameter
    urlObj.searchParams.set('quality', '85')
    
    // Add responsive sizing
    urlObj.searchParams.set('w', '1200')
    urlObj.searchParams.set('h', 'auto')
    
    return urlObj.toString()
  }

  private optimizeImages(components: ContentComponent[]): ImageOptimization[] {
    return components
      .filter(component => component.type === 'image' && component.props.src)
      .map(component => ({
        src: component.props.src,
        optimizedSrc: this.optimizeImageUrl(component.props.src),
        alt: component.props.alt || '',
        lazy: true,
        sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
      }))
  }

  private generateCriticalCSS(components: ContentComponent[]): string {
    // Generate minimal CSS for above-the-fold content
    const criticalStyles = [
      'body { margin: 0; font-Circle: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
      '.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }',
      'h1, h2, h3, h4, h5, h6 { font-weight: 600; line-height: 1.2; }',
      'img { max-width: 100%; height: auto; }',
      '.btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 0.25rem; text-decoration: none; }'
    ]

    return criticalStyles.join('\n')
  }

  private generatePreloadResources(components: ContentComponent[]): PreloadResource[] {
    const resources: PreloadResource[] = []

    // Preload critical images
    components
      .filter(component => component.type === 'image' && component.props.src)
      .slice(0, 3) // Only preload first 3 images
      .forEach(component => {
        resources.push({
          href: component.props.src,
          as: 'image',
          type: 'image/webp'
        })
      })

    // Preload fonts
    resources.push({
      href: '/fonts/inter.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous'
    })

    return resources
  }

  private generateContentCacheKey(content: ContentPage): string {
    const keyData = {
      id: content.id,
      updatedAt: content.updatedAt,
      version: '1.0'
    }
    return `content_${btoa(JSON.stringify(keyData))}`
  }

  // Utility Methods
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  private enforceCacheSize(): void {
    if (this.cache.size <= this.cacheConfig.maxSize) return

    // Remove least recently used entries
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    
    const toRemove = entries.slice(0, this.cache.size - this.cacheConfig.maxSize)
    toRemove.forEach(([key]) => this.cache.delete(key))
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now()
      const entries = Array.from(this.cache.entries())
      for (const [key, entry] of entries) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
        }
      }
    }, 60000) // Clean up every minute
  }

  private getMissCount(): number {
    // This would be tracked in a real implementation
    return 0
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0
    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      totalSize += key.length * 2 // UTF-16 characters
      totalSize += JSON.stringify(entry.value).length * 2
      totalSize += 100 // Overhead for the entry object
    }
    return totalSize
  }

  // Configuration
  public updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config }
  }

  public getCacheConfig(): CacheConfig {
    return { ...this.cacheConfig }
  }
}

// Types
interface PerformanceMetric {
  startTime: number
  endTime: number
  duration: number
  metadata: Record<string, any>
}

interface CacheEntry<T = any> {
  value: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface CacheConfig {
  maxSize: number
  ttl: number
  enabled: boolean
}

interface CacheStats {
  totalEntries: number
  totalAccesses: number
  averageAccessTime: number
  hitRate: number
  memoryUsage: number
}

interface OptimizedContent extends ContentPage {
  optimizations: {
    cacheKey: string
    imageOptimizations: ImageOptimization[]
    criticalCSS: string
    preloadResources: PreloadResource[]
    optimizationTime: number
  }
}

interface ImageOptimization {
  src: string
  optimizedSrc: string
  alt: string
  lazy: boolean
  sizes: string
}

interface PreloadResource {
  href: string
  as: string
  type?: string
  crossOrigin?: string
}

// Export singleton instance
export const performanceService = PerformanceService.getInstance()

// React Hook for Performance Monitoring
export const usePerformanceMonitoring = () => {
  const startTiming = (key: string) => {
    performanceService.startTiming(key)
  }

  const endTiming = (key: string, metadata?: Record<string, any>) => {
    return performanceService.endTiming(key, metadata)
  }

  const getMetrics = () => {
    return performanceService.getMetrics()
  }

  const clearMetrics = () => {
    performanceService.clearMetrics()
  }

  return {
    startTiming,
    endTiming,
    getMetrics,
    clearMetrics
  }
}

// React Hook for Caching (requires React import in actual usage)
export const useCache = <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
  // Note: This would require React import in actual usage
  // const [data, setData] = React.useState<T | null>(null)
  // const [loading, setLoading] = React.useState(false)
  // const [error, setError] = React.useState<Error | null>(null)

  // Note: This is a template for React hook usage
  // In actual implementation, you would use React hooks here
  return {
    data: null,
    loading: false,
    error: null,
    refetch: async () => {},
    invalidate: () => {}
  }
}

