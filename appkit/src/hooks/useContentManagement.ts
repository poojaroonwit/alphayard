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
  mobileDisplay?: {
    showOnLogin: boolean
    showOnHome: boolean
    showOnNews: boolean
    showAsPopup: boolean
    popupTrigger: 'immediate' | 'scroll' | 'time' | 'exit'
  }
}

// Keep type exported for backwards compat with any remaining imports
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
  contentPages: ContentPage[]
  loading: boolean
  error: string | null
  filters: ContentFilters
  setFilters: (filters: Partial<ContentFilters>) => void
  createContent: (content: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContentPage>
  updateContent: (id: string, content: Partial<ContentPage>) => Promise<ContentPage>
  deleteContent: (id: string) => Promise<void>
  refreshContent: () => Promise<void>
}

export const useContentManagement = (applicationId?: string): UseContentManagementReturn => {
  const [contentPages, setContentPages] = useState<ContentPage[]>([])
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
      const pages = await cmsService.getContentPages(params, applicationId)
      setContentPages(pages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load content pages'
      setError(errorMessage)
      console.error('Error loading content pages:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, applicationId])

  const createContent = useCallback(async (content: Omit<ContentPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentPage> => {
    try {
      setError(null)
      const newPage = await cmsService.createContentPage(content, applicationId)
      setContentPages(prev => [newPage, ...prev])
      return newPage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create content'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [applicationId])

  const updateContent = useCallback(async (id: string, content: Partial<ContentPage>): Promise<ContentPage> => {
    try {
      setError(null)
      const updatedPage = await cmsService.updateContentPage(id, content, applicationId)
      setContentPages(prev => prev.map(p => p.id === id ? updatedPage : p))
      return updatedPage
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update content'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [applicationId])

  const deleteContent = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      await cmsService.deleteContentPage(id, applicationId)
      setContentPages(prev => prev.filter(page => page.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete content'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [applicationId])

  useEffect(() => {
    refreshContent()
  }, [refreshContent])

  useEffect(() => {
    refreshContent()
  }, [filters, refreshContent])

  return {
    contentPages,
    loading,
    error,
    filters,
    setFilters,
    createContent,
    updateContent,
    deleteContent,
    refreshContent,
  }
}
