import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { API_BASE_URL } from './apiConfig'

// Types
export interface ContentPage {
  id: string
  title: string
  slug: string
  route?: string
  type: 'marketing' | 'news' | 'inspiration' | 'popup'
  status: 'draft' | 'published' | 'archived'
  components: ContentComponent[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
  views?: number
  analytics?: ContentAnalytics
  seo?: SEOSettings
  mobileDisplay?: MobileDisplaySettings
  metadata?: Record<string, any>
}

export interface ContentComponent {
  id: string
  type: string
  props: Record<string, any>
  children?: ContentComponent[]
  order: number
  styles?: Record<string, any>
}

export interface ContentAnalytics {
  views: number
  uniqueViews: number
  avgTimeOnPage: number
  bounceRate: number
  conversionRate: number
  lastViewed?: string
}

export interface SEOSettings {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  twitterCard?: string
  canonicalUrl?: string
  robots?: string
  structuredData?: Record<string, any>
}

export interface MobileDisplaySettings {
  showOnLogin: boolean
  showOnHome: boolean
  showOnNews: boolean
  showAsPopup: boolean
  popupTrigger: 'immediate' | 'scroll' | 'time' | 'exit'
  popupDelay?: number
  popupScrollPercent?: number
}

export interface ContentTemplate {
  id: string
  name: string
  description: string
  type: string
  preview: string
  components: ContentComponent[]
  category: string
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentFilters {
  type?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
  timestamp: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

// Error handling
class CmsApiError extends Error {
  public code: string
  public details?: Record<string, any>
  public timestamp: string

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message)
    this.name = 'CmsApiError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

// API Client
class ProductionCmsService {
  private api: AxiosInstance
  private baseURL: string

  constructor() {
    // Use shared configuration
    // API_BASE_URL is imported from ./apiConfig and already includes /api/v1
    this.baseURL = API_BASE_URL;
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId()
        
        console.log(`[CMS API] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('[CMS API] Request error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[CMS API] ${response.status} ${response.config.url}`)
        return response
      },
      (error: AxiosError) => {
        const apiError = this.handleApiError(error)
        console.error('[CMS API] Response error:', apiError)
        return Promise.reject(apiError)
      }
    )
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private handleApiError(error: AxiosError): CmsApiError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      const errorData = data as any
      
      return new CmsApiError(
        errorData?.message || `HTTP ${status} Error`,
        errorData?.code || `HTTP_${status}`,
        errorData?.details
      )
    } else if (error.request) {
      // Request was made but no response received
      return new CmsApiError(
        'Network error - no response received',
        'NETWORK_ERROR'
      )
    } else {
      // Something else happened
      return new CmsApiError(
        error.message || 'Unknown error occurred',
        'UNKNOWN_ERROR'
      )
    }
  }

  // Content Pages
  async getContentPages(filters?: ContentFilters): Promise<PaginatedResponse<ContentPage>> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.type && filters.type !== 'all') {
        params.append('type', filters.type)
      }
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters?.search) {
        params.append('search', filters.search)
      }
      if (filters?.page) {
        params.append('page', filters.page.toString())
      }
      if (filters?.pageSize) {
        params.append('pageSize', filters.pageSize.toString())
      }
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy)
      }
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder)
      }
      if (filters?.dateFrom) {
        params.append('dateFrom', filters.dateFrom)
      }
      if (filters?.dateTo) {
        params.append('dateTo', filters.dateTo)
      }

      const response = await this.api.get(`/cms/content/pages?${params.toString()}`)
      // Accept multiple backend response shapes
      const data = response.data as any
      if (data && data.data && data.pagination) {
        return data as PaginatedResponse<ContentPage>
      }
      if (data && (data.pages || Array.isArray(data))) {
        const pages: ContentPage[] = data.pages || data
        // Best-effort pagination when backend doesn't provide it
        const page = Number(filters?.page || 1)
        const pageSize = Number(filters?.pageSize || pages.length || 20)
        return {
          data: pages,
          pagination: {
            page,
            pageSize,
            total: pages.length,
            totalPages: Math.max(1, Math.ceil(pages.length / pageSize)),
            hasNext: false,
            hasPrev: page > 1
          }
        }
      }
      // Unknown shape
      return data
    } catch (error: any) {
      // Fallback to public admin content endpoint (no auth) if authorized route fails
      try {
        const fallback = await this.api.get(`/cms/content/admin/content`)
        const data = fallback.data as any
        const pages: ContentPage[] = data?.pages || []
        const page = Number(filters?.page || 1)
        const pageSize = Number(filters?.pageSize || pages.length || 20)
        return {
          data: pages,
          pagination: {
            page,
            pageSize,
            total: pages.length,
            totalPages: Math.max(1, Math.ceil(pages.length / pageSize)),
            hasNext: false,
            hasPrev: page > 1
          }
        }
      } catch (_fallbackErr) {
        // If both fail, return empty results on 404 to allow graceful UI
        if (error?.code === 'HTTP_404' || /404/.test(String(error?.code))) {
          const page = Number(filters?.page || 1)
          const pageSize = Number(filters?.pageSize || 20)
          return {
            data: [],
            pagination: {
              page,
              pageSize,
              total: 0,
              totalPages: 1,
              hasNext: false,
              hasPrev: false
            }
          }
        }
        throw error
      }
    }
  }

  async getContentPage(id: string): Promise<ContentPage> {
    try {
      const response = await this.api.get(`/cms/content/pages/${id}`)
      const data = response.data as any
      return data?.data || data?.page || data
    } catch (error) {
      throw error
    }
  }

  async createContentPage(page: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentPage> {
    try {
      // Validate required fields
      this.validateContentPage(page)
      
      const response = await this.api.post('/cms/content/pages', {
        ...page,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      const data = response.data as any
      return data?.data || data?.page || data
    } catch (error) {
      throw error
    }
  }

  async updateContentPage(id: string, updates: Partial<ContentPage>): Promise<ContentPage> {
    try {
      // Validate updates
      if (updates.title !== undefined) {
        this.validateTitle(updates.title)
      }
      if (updates.slug !== undefined) {
        this.validateSlug(updates.slug)
      }
      
      const response = await this.api.put(`/cms/content/pages/${id}`, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      const data = response.data as any
      return data?.data || data?.page || data
    } catch (error) {
      throw error
    }
  }

  async deleteContentPage(id: string): Promise<void> {
    try {
      await this.api.delete(`/cms/content/pages/${id}`)
    } catch (error) {
      throw error
    }
  }

  async duplicateContentPage(id: string, overrides?: Partial<ContentPage>): Promise<ContentPage> {
    try {
      const originalPage = await this.getContentPage(id)
      const duplicatedPage = {
        ...originalPage,
        id: '', // Will be generated
        title: `${originalPage.title} (Copy)`,
        slug: `${originalPage.slug}-copy-${Date.now()}`,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides
      }
      
      return await this.createContentPage(duplicatedPage)
    } catch (error) {
      throw error
    }
  }

  async publishContentPage(id: string): Promise<ContentPage> {
    try {
      return await this.updateContentPage(id, { status: 'published' })
    } catch (error) {
      throw error
    }
  }

  async unpublishContentPage(id: string): Promise<ContentPage> {
    try {
      return await this.updateContentPage(id, { status: 'draft' })
    } catch (error) {
      throw error
    }
  }

  async archiveContentPage(id: string): Promise<ContentPage> {
    try {
      return await this.updateContentPage(id, { status: 'archived' })
    } catch (error) {
      throw error
    }
  }

  // Content Templates
  async getContentTemplates(filters?: { category?: string; search?: string; activeOnly?: boolean }): Promise<ContentTemplate[]> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.category && filters.category !== 'all') {
        params.append('category', filters.category)
      }
      if (filters?.search) {
        params.append('search', filters.search)
      }
      if (filters?.activeOnly) {
        params.append('activeOnly', 'true')
      }

      const response = await this.api.get(`/cms/content/templates?${params.toString()}`)
      return response.data.data
    } catch (error: any) {
      // Gracefully degrade on 404
      if (error?.code === 'HTTP_404' || /404/.test(String(error?.code))) {
        return []
      }
      throw error
    }
  }

  async getContentTemplate(id: string): Promise<ContentTemplate> {
    try {
      const response = await this.api.get(`/cms/content/templates/${id}`)
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  async createContentFromTemplate(templateId: string, overrides?: Partial<ContentPage>): Promise<ContentPage> {
    try {
      const template = await this.getContentTemplate(templateId)
      
      const newPage: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'> = {
        title: overrides?.title || `${template.name} - New`,
        slug: overrides?.slug || `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        type: overrides?.type || 'marketing',
        status: 'draft',
        components: template.components,
        seo: overrides?.seo,
        mobileDisplay: overrides?.mobileDisplay,
        metadata: overrides?.metadata,
        ...overrides
      }
      
      return await this.createContentPage(newPage)
    } catch (error) {
      throw error
    }
  }

  // Media Management
  async uploadMedia(file: File, options?: { folder?: string; resize?: boolean; quality?: number }): Promise<{ url: string; id: string; size: number; type: string }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options?.folder) {
        formData.append('folder', options.folder)
      }
      if (options?.resize) {
        formData.append('resize', 'true')
      }
      if (options?.quality) {
        formData.append('quality', options.quality.toString())
      }

      const response = await this.api.post('/cms/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          console.log(`Upload progress: ${percentCompleted}%`)
        },
      })
      
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  async deleteMedia(id: string): Promise<void> {
    try {
      await this.api.delete(`/cms/media/${id}`)
    } catch (error) {
      throw error
    }
  }

  async getMediaList(filters?: { type?: string; folder?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<{ id: string; url: string; name: string; size: number; type: string; createdAt: string }>> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.type) {
        params.append('type', filters.type)
      }
      if (filters?.folder) {
        params.append('folder', filters.folder)
      }
      if (filters?.page) {
        params.append('page', filters.page.toString())
      }
      if (filters?.pageSize) {
        params.append('pageSize', filters.pageSize.toString())
      }

      const response = await this.api.get(`/cms/media?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  // Analytics
  async getContentAnalytics(id: string, period?: 'day' | 'week' | 'month' | 'year'): Promise<ContentAnalytics> {
    try {
      const params = new URLSearchParams()
      if (period) {
        params.append('period', period)
      }

      const response = await this.api.get(`/cms/content/pages/${id}/analytics?${params.toString()}`)
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  async trackContentView(id: string, metadata?: Record<string, any>): Promise<void> {
    try {
      await this.api.post(`/cms/content/pages/${id}/track`, {
        timestamp: new Date().toISOString(),
        metadata
      })
    } catch (error) {
      // Don't throw error for tracking failures
      console.warn('Failed to track content view:', error)
    }
  }

  // Validation
  private validateContentPage(page: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.validateTitle(page.title)
    this.validateSlug(page.slug)
    this.validateType(page.type)
    this.validateStatus(page.status)
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new CmsApiError('Title is required', 'VALIDATION_ERROR', { field: 'title' })
    }
    if (title.length < 3) {
      throw new CmsApiError('Title must be at least 3 characters long', 'VALIDATION_ERROR', { field: 'title' })
    }
    if (title.length > 100) {
      throw new CmsApiError('Title must be less than 100 characters long', 'VALIDATION_ERROR', { field: 'title' })
    }
  }

  private validateSlug(slug: string): void {
    if (!slug || slug.trim().length === 0) {
      throw new CmsApiError('Slug is required', 'VALIDATION_ERROR', { field: 'slug' })
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new CmsApiError('Slug can only contain lowercase letters, numbers, and hyphens', 'VALIDATION_ERROR', { field: 'slug' })
    }
    if (slug.length < 3) {
      throw new CmsApiError('Slug must be at least 3 characters long', 'VALIDATION_ERROR', { field: 'slug' })
    }
    if (slug.length > 50) {
      throw new CmsApiError('Slug must be less than 50 characters long', 'VALIDATION_ERROR', { field: 'slug' })
    }
  }

  private validateType(type: string): void {
    const validTypes = ['marketing', 'news', 'inspiration', 'popup']
    if (!validTypes.includes(type)) {
      throw new CmsApiError(`Invalid content type. Must be one of: ${validTypes.join(', ')}`, 'VALIDATION_ERROR', { field: 'type' })
    }
  }

  private validateStatus(status: string): void {
    const validStatuses = ['draft', 'published', 'archived']
    if (!validStatuses.includes(status)) {
      throw new CmsApiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 'VALIDATION_ERROR', { field: 'status' })
    }
  }

  // Utility methods
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    try {
      const response = await this.api.get('/cms/health')
      return response.data
    } catch (error) {
      throw error
    }
  }

  async getSystemInfo(): Promise<{ version: string; environment: string; features: string[] }> {
    try {
      const response = await this.api.get('/cms/system/info')
      return response.data.data
    } catch (error) {
      throw error
    }
  }
}

// Export singleton instance
export const productionCmsService = new ProductionCmsService()

// Export types
export { CmsApiError }
