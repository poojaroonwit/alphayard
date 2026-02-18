'use client'

import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'
import { useProductionContentManagement } from '../../../../hooks/useProductionContentManagement'

// Enhanced Types
export interface ContentPage {
  id: string
  title: string
  slug: string
  type: 'page' | 'article' | 'guide' | 'template'
  status: 'draft' | 'published' | 'archived'
  content: string
  components?: ContentComponent[]
  mobile_display?: MobileDisplay
  seo?: SEOData
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  tags?: string[]
  featured_image?: string
}

export interface ContentComponent {
  id: string
  type: string
  props: Record<string, any>
  children?: ContentComponent[]
}

export interface MobileDisplay {
  layout: 'stack' | 'grid' | 'carousel'
  spacing: number
  hide_on_mobile?: boolean
}

export interface SEOData {
  title?: string
  description?: string
  keywords?: string[]
  og_image?: string
}

export interface ContentState {
  // UI State
  viewMode: 'grid' | 'list' | 'kanban'
  showEditor: boolean
  showTemplates: boolean
  showPreview: boolean
  editingPage: ContentPage | null
  selectedPages: Set<string>
  showDeleteConfirm: string | null
  showBulkActions: boolean
  
  // Filters and Search
  searchTerm: string
  filterType: string
  filterStatus: string
  filterTags: string[]
  sortBy: 'title' | 'created_at' | 'updated_at' | 'status'
  sortOrder: 'asc' | 'desc'
  
  // Pagination
  currentPage: number
  pageSize: number
  
  // Notifications
  notification: NotificationData | null
  
  // Performance
  isLoading: boolean
  lastUpdated: number
}

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ContentActions {
  // UI Actions
  setViewMode: (mode: 'grid' | 'list' | 'kanban') => void
  setShowEditor: (show: boolean) => void
  setShowTemplates: (show: boolean) => void
  setShowPreview: (show: boolean) => void
  setEditingPage: (page: ContentPage | null) => void
  setSelectedPages: (pages: Set<string>) => void
  setShowDeleteConfirm: (id: string | null) => void
  setShowBulkActions: (show: boolean) => void

  // Filter Actions
  setSearchTerm: (term: string) => void
  setFilterType: (type: string) => void
  setFilterStatus: (status: string) => void
  setFilterTags: (tags: string[]) => void
  setSortBy: (sort: 'title' | 'created_at' | 'updated_at' | 'status') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  clearFilters: () => void

  // Pagination Actions
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void

  // Notification Actions
  showNotification: (notification: Omit<NotificationData, 'id'>) => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void

  // Content Actions
  handleCreateNew: () => void
  handleEdit: (page: ContentPage) => void
  handleDelete: (pageId: string) => Promise<void>
  handleBulkDelete: (pageIds: string[]) => Promise<void>
  handleDuplicate: (page: ContentPage) => Promise<void>
  handlePublish: (page: ContentPage) => Promise<void>
  handleBulkPublish: (pageIds: string[]) => Promise<void>
  handleSelectPage: (page: ContentPage) => void
  handleSelectAll: () => void
  handleDeselectAll: () => void
}

// Initial state
const initialState: ContentState = {
  viewMode: 'grid',
  showEditor: false,
  showTemplates: false,
  showPreview: false,
  editingPage: null,
  selectedPages: new Set(),
  showDeleteConfirm: null,
  showBulkActions: false,
  searchTerm: '',
  filterType: 'all',
  filterStatus: 'all',
  filterTags: [],
  sortBy: 'updated_at',
  sortOrder: 'desc',
  currentPage: 1,
  pageSize: 20,
  notification: null,
  isLoading: false,
  lastUpdated: Date.now()
}

// Action types
type ContentAction = 
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' | 'kanban' }
  | { type: 'SET_SHOW_EDITOR'; payload: boolean }
  | { type: 'SET_SHOW_TEMPLATES'; payload: boolean }
  | { type: 'SET_SHOW_PREVIEW'; payload: boolean }
  | { type: 'SET_EDITING_PAGE'; payload: ContentPage | null }
  | { type: 'SET_SELECTED_PAGES'; payload: Set<string> }
  | { type: 'SET_SHOW_DELETE_CONFIRM'; payload: string | null }
  | { type: 'SET_SHOW_BULK_ACTIONS'; payload: boolean }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_FILTER_TYPE'; payload: string }
  | { type: 'SET_FILTER_STATUS'; payload: string }
  | { type: 'SET_FILTER_TAGS'; payload: string[] }
  | { type: 'SET_SORT_BY'; payload: 'title' | 'created_at' | 'updated_at' | 'status' }
  | { type: 'SET_SORT_ORDER'; payload: 'asc' | 'desc' }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SHOW_NOTIFICATION'; payload: NotificationData }
  | { type: 'CLEAR_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_LAST_UPDATED' }

// Enhanced reducer
const contentReducer = (state: ContentState, action: ContentAction): ContentState => {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'SET_SHOW_EDITOR':
      return { ...state, showEditor: action.payload }
    case 'SET_SHOW_TEMPLATES':
      return { ...state, showTemplates: action.payload }
    case 'SET_SHOW_PREVIEW':
      return { ...state, showPreview: action.payload }
    case 'SET_EDITING_PAGE':
      return { ...state, editingPage: action.payload }
    case 'SET_SELECTED_PAGES':
      return { 
        ...state, 
        selectedPages: action.payload,
        showBulkActions: action.payload.size > 0
      }
    case 'SET_SHOW_DELETE_CONFIRM':
      return { ...state, showDeleteConfirm: action.payload }
    case 'SET_SHOW_BULK_ACTIONS':
      return { ...state, showBulkActions: action.payload }
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, currentPage: 1 }
    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.payload, currentPage: 1 }
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.payload, currentPage: 1 }
    case 'SET_FILTER_TAGS':
      return { ...state, filterTags: action.payload, currentPage: 1 }
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload }
    case 'SET_SORT_ORDER':
      return { ...state, sortOrder: action.payload }
    case 'CLEAR_FILTERS':
      return {
        ...state,
        searchTerm: '',
        filterType: 'all',
        filterStatus: 'all',
        filterTags: [],
        currentPage: 1
      }
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload }
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, currentPage: 1 }
    case 'SHOW_NOTIFICATION':
      return { ...state, notification: action.payload }
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null }
    case 'CLEAR_ALL_NOTIFICATIONS':
      return { ...state, notification: null }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'UPDATE_LAST_UPDATED':
      return { ...state, lastUpdated: Date.now() }
    default:
      return state
  }
}

// Context
const ContentContext = createContext<{
  state: ContentState
  actions: ContentActions
  contentData: {
    contentPages: ContentPage[]
    templates: any[]
    loading: boolean
    error: Error | null
    refreshContent: () => Promise<void>
    refreshTemplates: () => Promise<void>
  }
  filteredContent: ContentPage[]
  paginatedContent: ContentPage[]
} | null>(null)

// Provider Component
export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(contentReducer, initialState)
  const contentData = useProductionContentManagement()

  // Enhanced filtering and sorting
  const filteredContent = useMemo(() => {
    let filtered = contentData.contentPages || []

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase()
      filtered = filtered.filter((page: any) =>
        page.title.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower) ||
        page.content.toLowerCase().includes(searchLower) ||
        (page.tags && page.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
      )
    }

    // Apply type filter
    if (state.filterType !== 'all') {
      filtered = filtered.filter((page: any) => page.type === state.filterType)
    }

    // Apply status filter
    if (state.filterStatus !== 'all') {
      filtered = filtered.filter((page: any) => page.status === state.filterStatus)
    }

    // Apply tags filter
    if (state.filterTags.length > 0) {
      filtered = filtered.filter((page: any) =>
        page.tags && state.filterTags.some((tag: string) => page.tags!.includes(tag))
      )
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let comparison = 0
      
      switch (state.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
      
      return state.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [
    contentData.contentPages, 
    state.searchTerm, 
    state.filterType, 
    state.filterStatus, 
    state.filterTags,
    state.sortBy, 
    state.sortOrder
  ])

  // Pagination
  const paginatedContent = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.pageSize
    const endIndex = startIndex + state.pageSize
    return filteredContent.slice(startIndex, endIndex)
  }, [filteredContent, state.currentPage, state.pageSize])

  // Enhanced actions
  const actions = useMemo((): ContentActions => ({
    // UI Actions
    setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    setShowEditor: (show) => dispatch({ type: 'SET_SHOW_EDITOR', payload: show }),
    setShowTemplates: (show) => dispatch({ type: 'SET_SHOW_TEMPLATES', payload: show }),
    setShowPreview: (show) => dispatch({ type: 'SET_SHOW_PREVIEW', payload: show }),
    setEditingPage: (page) => dispatch({ type: 'SET_EDITING_PAGE', payload: page }),
    setSelectedPages: (pages) => dispatch({ type: 'SET_SELECTED_PAGES', payload: pages }),
    setShowDeleteConfirm: (id) => dispatch({ type: 'SET_SHOW_DELETE_CONFIRM', payload: id }),
    setShowBulkActions: (show) => dispatch({ type: 'SET_SHOW_BULK_ACTIONS', payload: show }),

    // Filter Actions
    setSearchTerm: (term) => dispatch({ type: 'SET_SEARCH_TERM', payload: term }),
    setFilterType: (type) => dispatch({ type: 'SET_FILTER_TYPE', payload: type }),
    setFilterStatus: (status) => dispatch({ type: 'SET_FILTER_STATUS', payload: status }),
    setFilterTags: (tags) => dispatch({ type: 'SET_FILTER_TAGS', payload: tags }),
    setSortBy: (sort) => dispatch({ type: 'SET_SORT_BY', payload: sort }),
    setSortOrder: (order) => dispatch({ type: 'SET_SORT_ORDER', payload: order }),
    clearFilters: () => dispatch({ type: 'CLEAR_FILTERS' }),

    // Pagination Actions
    setCurrentPage: (page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
    setPageSize: (size) => dispatch({ type: 'SET_PAGE_SIZE', payload: size }),

    // Notification Actions
    showNotification: (notification) => {
      const id = Math.random().toString(36).substr(2, 9)
      const notificationWithId = { ...notification, id }
      dispatch({ type: 'SHOW_NOTIFICATION', payload: notificationWithId })
      
      if (notification.duration !== 0) {
        setTimeout(() => {
          dispatch({ type: 'CLEAR_NOTIFICATION', payload: id })
        }, notification.duration || 5000)
      }
    },
    clearNotification: (id) => dispatch({ type: 'CLEAR_NOTIFICATION', payload: id }),
    clearAllNotifications: () => dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' }),

    // Content Actions
    handleCreateNew: () => {
      dispatch({ type: 'SET_EDITING_PAGE', payload: null })
      dispatch({ type: 'SET_SHOW_EDITOR', payload: true })
    },
    handleEdit: (page) => {
      dispatch({ type: 'SET_EDITING_PAGE', payload: page })
      dispatch({ type: 'SET_SHOW_EDITOR', payload: true })
    },
    handleDelete: async (pageId) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        await contentData.deleteContent(pageId)
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'success',
          message: 'Content deleted successfully',
          id: ''
        }})
        dispatch({ type: 'SET_SHOW_DELETE_CONFIRM', payload: null })
        dispatch({ type: 'UPDATE_LAST_UPDATED' })
      } catch (error) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'error',
          message: 'Failed to delete content',
          id: ''
        }})
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    handleBulkDelete: async (pageIds) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        await Promise.all(pageIds.map(id => contentData.deleteContent(id)))
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'success',
          message: `${pageIds.length} content items deleted successfully`,
          id: ''
        }})
        dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set() })
        dispatch({ type: 'UPDATE_LAST_UPDATED' })
      } catch (error) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'error',
          message: 'Failed to delete some content items',
          id: ''
        }})
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    handleDuplicate: async (page) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        await contentData.duplicateContent(page.id)
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'success',
          message: 'Content duplicated successfully',
          id: ''
        }})
        dispatch({ type: 'UPDATE_LAST_UPDATED' })
      } catch (error) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'error',
          message: 'Failed to duplicate content',
          id: ''
        }})
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    handlePublish: async (page) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        await contentData.publishContent(page.id)
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'success',
          message: 'Content published successfully',
          id: ''
        }})
        dispatch({ type: 'UPDATE_LAST_UPDATED' })
      } catch (error) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'error',
          message: 'Failed to publish content',
          id: ''
        }})
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    handleBulkPublish: async (pageIds) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        await Promise.all(pageIds.map(id => contentData.publishContent(id)))
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'success',
          message: `${pageIds.length} content items published successfully`,
          id: ''
        }})
        dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set() })
        dispatch({ type: 'UPDATE_LAST_UPDATED' })
      } catch (error) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: {
          type: 'error',
          message: 'Failed to publish some content items',
          id: ''
        }})
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    handleSelectPage: (page) => {
      const newSelected = new Set(state.selectedPages)
      if (newSelected.has(page.id)) {
        newSelected.delete(page.id)
      } else {
        newSelected.add(page.id)
      }
      dispatch({ type: 'SET_SELECTED_PAGES', payload: newSelected })
    },
    handleSelectAll: () => {
      const allIds = new Set(paginatedContent.map((page: any) => page.id))
      dispatch({ type: 'SET_SELECTED_PAGES', payload: allIds })
    },
    handleDeselectAll: () => {
      dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set() })
    }
  }), [state.selectedPages, paginatedContent, contentData])

  return (
    <ContentContext.Provider value={{ 
      state, 
      actions, 
      contentData: contentData as any, 
      filteredContent: filteredContent as any, 
      paginatedContent: paginatedContent as any 
    }}>
      {children}
    </ContentContext.Provider>
  )
}

// Hook
export const useContentContext = () => {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('useContentContext must be used within a ContentProvider')
  }
  return context
}
