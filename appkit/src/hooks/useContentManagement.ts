import { useState, useEffect, useCallback } from 'react'
import { cmsService } from '../services/cmsService'

export interface ContentPage {
  id: string
  title: string
  slug: string
  type: 'marketing' | 'news' | 'inspiration' | 'popup'
  status: 'draft' | 'published' | 'archived'
  components: any[]
  createdAt: string
  updatedAt: string
  views?: number
  analytics?: any
  mobileDisplay?: {
    showOnLogin: boolean
    showOnHome: boolean
    showOnNews: boolean
    showAsPopup: boolean
    popupTrigger: 'immediate' | 'scroll' | 'time' | 'exit'
  }
}

export interface ContentTemplate {
  id: string
  name: string
  description: string
  type: string
  preview: string
  components: any[]
  createdAt: string
  updatedAt: string
}

export interface ContentFilters {
  type: string
  status: string
  search: string
}

export interface UseContentManagementReturn {
  // State
  contentPages: ContentPage[]
  templates: ContentTemplate[]
  loading: boolean
  error: string | null
  
  // Filters
  filters: ContentFilters
  setFilters: (filters: Partial<ContentFilters>) => void
  
  // Actions
  createContent: (content: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContentPage>
  updateContent: (id: string, content: Partial<ContentPage>) => Promise<ContentPage>
  deleteContent: (id: string) => Promise<void>
  createFromTemplate: (templateId: string, overrides?: Partial<ContentPage>) => Promise<ContentPage>
  
  // Utilities
  refreshContent: () => Promise<void>
  refreshTemplates: () => Promise<void>
}

export const useContentManagement = (): UseContentManagementReturn => {
  const [contentPages, setContentPages] = useState<ContentPage[]>([])
  const [templates, setTemplates] = useState<ContentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ContentFilters>({
    type: 'all',
    status: 'all',
    search: ''
  })

  const setFilters = useCallback((newFilters: Partial<ContentFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  const refreshContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        type: filters.type !== 'all' ? filters.type : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined
      }
      
      const pages = await cmsService.getContentPages(params)
      setContentPages(pages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content pages'
      setError(errorMessage)
      console.error('Error loading content pages:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const refreshTemplates = useCallback(async () => {
    try {
      setError(null)
      const templatesData = await cmsService.getContentTemplates()
      setTemplates(templatesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates'
      setError(errorMessage)
      console.error('Error loading templates:', err)
    }
  }, [])

  const createContent = useCallback(async (content: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentPage> => {
    try {
      setError(null)
      const newPage = await cmsService.createContentPage(content)
      setContentPages(prev => [newPage, ...prev])
      return newPage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create content'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const updateContent = useCallback(async (id: string, content: Partial<ContentPage>): Promise<ContentPage> => {
    try {
      setError(null)
      const updatedPage = await cmsService.updateContentPage(id, content)
      setContentPages(prev => prev.map(p => p.id === id ? updatedPage : p))
      return updatedPage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update content'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const deleteContent = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      await cmsService.deleteContentPage(id)
      setContentPages(prev => prev.filter(page => page.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete content'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const createFromTemplate = useCallback(async (templateId: string, overrides: Partial<ContentPage> = {}): Promise<ContentPage> => {
    try {
      setError(null)
      const newPage = await cmsService.createContentFromTemplate(templateId, overrides)
      setContentPages(prev => [newPage, ...prev])
      return newPage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create content from template'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

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
    contentPages,
    templates,
    loading,
    error,
    filters,
    setFilters,
    createContent,
    updateContent,
    deleteContent,
    createFromTemplate,
    refreshContent,
    refreshTemplates
  }
}
