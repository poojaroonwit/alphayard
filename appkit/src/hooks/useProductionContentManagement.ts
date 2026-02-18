import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  productionCmsService, 
  ContentPage, 
  ContentTemplate, 
  ContentFilters, 
  PaginatedResponse,
  CmsApiError 
} from '../services/productionCmsService'

export interface UseProductionContentManagementReturn {
  // State
  contentPages: ContentPage[]
  templates: ContentTemplate[]
  loading: boolean
  error: string | null
  saving: boolean
  lastSaved: Date | null

  // Filters and pagination
  filters: ContentFilters
  pagination: PaginatedResponse<ContentPage>['pagination'] | null
  setFilters: (filters: Partial<ContentFilters>) => void

  // Actions
  createContent: (content: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContentPage>
  updateContent: (id: string, content: Partial<ContentPage>) => Promise<ContentPage>
  deleteContent: (id: string) => Promise<void>
  duplicateContent: (id: string, overrides?: Partial<ContentPage>) => Promise<ContentPage>
  publishContent: (id: string) => Promise<ContentPage>
  unpublishContent: (id: string) => Promise<ContentPage>
  archiveContent: (id: string) => Promise<ContentPage>
  createFromTemplate: (templateId: string, overrides?: Partial<ContentPage>) => Promise<ContentPage>

  // Utilities
  refreshContent: () => Promise<void>
  refreshTemplates: () => Promise<void>
  clearError: () => void
  getContentById: (id: string) => ContentPage | undefined
  searchContent: (query: string) => Promise<ContentPage[]>
}

export const useProductionContentManagement = (): UseProductionContentManagementReturn => {
  // State
  const [contentPages, setContentPages] = useState<ContentPage[]>([])
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [pagination, setPagination] = useState<PaginatedResponse<ContentPage>['pagination'] | null>(null)

  // Filters
  const [filters, setFiltersState] = useState<ContentFilters>({
    type: 'all',
    status: 'all',
    search: '',
    page: 1,
    pageSize: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  })

  // Error handling
  const handleError = useCallback((error: unknown, context: string) => {
    console.error(`[Content Management] ${context}:`, error)
    
    if (error instanceof CmsApiError) {
      setError(`${context}: ${error.message}`)
    } else if (error instanceof Error) {
      setError(`${context}: ${error.message}`)
    } else {
      setError(`${context}: An unknown error occurred`)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Filter management
  const setFilters = useCallback((newFilters: Partial<ContentFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Content management
  const refreshContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await productionCmsService.getContentPages(filters)
      setContentPages(response.data)
      setPagination(response.pagination)
    } catch (err: any) {
      // Gracefully handle 404 as empty result
      if (err && (err.code === 'HTTP_404' || /404/.test(String(err.code)))) {
        setContentPages([])
        setPagination({ page: filters.page || 1, pageSize: filters.pageSize || 20, total: 0, totalPages: 1, hasNext: false, hasPrev: false })
        setError(null)
      } else {
        handleError(err, 'Failed to load content pages')
      }
    } finally {
      setLoading(false)
    }
  }, [filters, handleError])

  const refreshTemplates = useCallback(async () => {
    try {
      setError(null)
      const templatesData = await productionCmsService.getContentTemplates()
      setTemplates(templatesData)
    } catch (err: any) {
      // Gracefully handle 404 as no templates
      if (err && (err.code === 'HTTP_404' || /404/.test(String(err.code)))) {
        setTemplates([])
        setError(null)
      } else {
        handleError(err, 'Failed to load templates')
      }
    }
  }, [handleError])

  const createContent = useCallback(async (content: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentPage> => {
    try {
      setSaving(true)
      setError(null)
      
      const newPage = await productionCmsService.createContentPage(content)
      setContentPages(prev => [newPage, ...prev])
      setLastSaved(new Date())
      
      return newPage
    } catch (err) {
      handleError(err, 'Failed to create content')
      throw err
    } finally {
      setSaving(false)
    }
  }, [handleError])

  const updateContent = useCallback(async (id: string, content: Partial<ContentPage>): Promise<ContentPage> => {
    try {
      setSaving(true)
      setError(null)
      
      const updatedPage = await productionCmsService.updateContentPage(id, content)
      setContentPages(prev => prev.map(p => p.id === id ? updatedPage : p))
      setLastSaved(new Date())
      
      return updatedPage
    } catch (err) {
      handleError(err, 'Failed to update content')
      throw err
    } finally {
      setSaving(false)
    }
  }, [handleError])

  const deleteContent = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      await productionCmsService.deleteContentPage(id)
      setContentPages(prev => prev.filter(page => page.id !== id))
    } catch (err) {
      handleError(err, 'Failed to delete content')
      throw err
    }
  }, [handleError])

  const duplicateContent = useCallback(async (id: string, overrides: Partial<ContentPage> = {}): Promise<ContentPage> => {
    try {
      setSaving(true)
      setError(null)
      
      const duplicatedPage = await productionCmsService.duplicateContentPage(id, overrides)
      setContentPages(prev => [duplicatedPage, ...prev])
      setLastSaved(new Date())
      
      return duplicatedPage
    } catch (err) {
      handleError(err, 'Failed to duplicate content')
      throw err
    } finally {
      setSaving(false)
    }
  }, [handleError])

  const publishContent = useCallback(async (id: string): Promise<ContentPage> => {
    try {
      setSaving(true)
      setError(null)
      
      const publishedPage = await productionCmsService.publishContentPage(id)
      setContentPages(prev => prev.map(p => p.id === id ? publishedPage : p))
      setLastSaved(new Date())
      
      return publishedPage
    } catch (err) {
      handleError(err, 'Failed to publish content')
      throw err
    } finally {
      setSaving(false)
    }
  }, [handleError])

  const unpublishContent = useCallback(async (id: string): Promise<ContentPage> => {
    try {
      setSaving(true)
      setError(null)
      
      const unpublishedPage = await productionCmsService.unpublishContentPage(id)
      setContentPages(prev => prev.map(p => p.id === id ? unpublishedPage : p))
      setLastSaved(new Date())
      
      return unpublishedPage
    } catch (err) {
      handleError(err, 'Failed to unpublish content')
      throw err
    } finally {
      setSaving(false)
    }
  }, [handleError])

  const archiveContent = useCallback(async (id: string): Promise<ContentPage> => {
    try {
      setSaving(true)
      setError(null)
      
      const archivedPage = await productionCmsService.archiveContentPage(id)
      setContentPages(prev => prev.map(p => p.id === id ? archivedPage : p))
      setLastSaved(new Date())
      
      return archivedPage
    } catch (err) {
      handleError(err, 'Failed to archive content')
      throw err
    } finally {
      setSaving(false)
    }
  }, [handleError])

  const createFromTemplate = useCallback(async (templateId: string, overrides: Partial<ContentPage> = {}): Promise<ContentPage> => {
    try {
      setSaving(true)
      setError(null)
      
      const newPage = await productionCmsService.createContentFromTemplate(templateId, overrides)
      setContentPages(prev => [newPage, ...prev])
      setLastSaved(new Date())
      
      return newPage
    } catch (err) {
      handleError(err, 'Failed to create content from template')
      throw err
    } finally {
      setSaving(false)
    }
  }, [handleError])

  const getContentById = useCallback((id: string): ContentPage | undefined => {
    return contentPages.find(page => page.id === id)
  }, [contentPages])

  const searchContent = useCallback(async (query: string): Promise<ContentPage[]> => {
    try {
      setError(null)
      const response = await productionCmsService.getContentPages({
        ...filters,
        search: query,
        page: 1,
        pageSize: 50
      })
      return response.data
    } catch (err) {
      handleError(err, 'Failed to search content')
      return []
    }
  }, [filters, handleError])

  // Memoized computed values
  const filteredPages = useMemo(() => {
    return contentPages.filter(page => {
      const matchesSearch = !filters.search || 
        page.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        page.slug.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesType = !filters.type || filters.type === 'all' || page.type === filters.type
      const matchesStatus = !filters.status || filters.status === 'all' || page.status === filters.status
      
      return matchesSearch && matchesType && matchesStatus
    })
  }, [contentPages, filters])

  // Load initial data
  useEffect(() => {
    refreshContent()
    refreshTemplates()
  }, [refreshContent, refreshTemplates])

  // Refresh content when filters change
  useEffect(() => {
    refreshContent()
  }, [filters, refreshContent])

  return {
    // State
    contentPages: filteredPages,
    templates,
    loading,
    error,
    saving,
    lastSaved,

    // Filters and pagination
    filters,
    pagination,
    setFilters,

    // Actions
    createContent,
    updateContent,
    deleteContent,
    duplicateContent,
    publishContent,
    unpublishContent,
    archiveContent,
    createFromTemplate,

    // Utilities
    refreshContent,
    refreshTemplates,
    clearError,
    getContentById,
    searchContent
  }
}
