'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { ContentPage } from '../../../services/productionCmsService'
import { useProductionContentManagement } from '../../../hooks/useProductionContentManagement'

// Types
export interface ContentState {
  // UI State
  viewMode: 'grid' | 'list'
  showEditor: boolean
  showTemplates: boolean
  editingPage: ContentPage | null
  selectedPages: Set<string>
  showDeleteConfirm: string | null
  
  // Filters and Search
  searchTerm: string
  filterType: string
  filterStatus: string
  filterRoute?: string
  sortBy: string
  
  // Pagination
  currentPage: number
  pageSize: number
  
  // Notifications
  notification: { type: 'success' | 'error', message: string } | null
}

export interface ContentActions {
  // UI Actions
  setViewMode: (mode: 'grid' | 'list') => void
  setShowEditor: (show: boolean) => void
  setShowTemplates: (show: boolean) => void
  setEditingPage: (page: ContentPage | null) => void
  setSelectedPages: (pages: Set<string>) => void
  setShowDeleteConfirm: (id: string | null) => void
  
  // Filter Actions
  setSearchTerm: (term: string) => void
  setFilterType: (type: string) => void
  setFilterStatus: (status: string) => void
  setFilterRoute?: (route: string) => void
  setSortBy: (sort: string) => void
  
  // Pagination Actions
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  
  // Notification Actions
  showNotification: (type: 'success' | 'error', message: string) => void
  clearNotification: () => void
  
  // Content Actions
  handleCreateNew: () => void
  handleEdit: (page: ContentPage) => void
  handleDelete: (pageId: string) => Promise<void>
  handleDuplicate: (page: ContentPage) => Promise<void>
  handlePublish: (page: ContentPage) => Promise<void>
  handleSelectPage: (page: ContentPage) => void
  handleSelectAll: () => void
}

// Initial State
const initialState: ContentState = {
  viewMode: 'grid',
  showEditor: false,
  showTemplates: false,
  editingPage: null,
  selectedPages: new Set(),
  showDeleteConfirm: null,
  searchTerm: '',
  filterType: 'all',
  filterStatus: 'all',
  filterRoute: '',
  sortBy: 'updatedAt-desc',
  currentPage: 1,
  pageSize: 20,
  notification: null
}

// Context
const ContentContext = createContext<{
  state: ContentState
  actions: ContentActions
  contentData: ReturnType<typeof useProductionContentManagement> & {
    contentPages: ContentPage[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
  filteredContent: ContentPage[]
  paginatedContent: ContentPage[]
} | null>(null)

// Reducer
type ContentAction = 
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'SET_SHOW_EDITOR'; payload: boolean }
  | { type: 'SET_SHOW_TEMPLATES'; payload: boolean }
  | { type: 'SET_EDITING_PAGE'; payload: ContentPage | null }
  | { type: 'SET_SELECTED_PAGES'; payload: Set<string> }
  | { type: 'SET_SHOW_DELETE_CONFIRM'; payload: string | null }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_FILTER_TYPE'; payload: string }
  | { type: 'SET_FILTER_STATUS'; payload: string }
  | { type: 'SET_FILTER_ROUTE'; payload: string }
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'SHOW_NOTIFICATION'; payload: { type: 'success' | 'error', message: string } }
  | { type: 'CLEAR_NOTIFICATION' }

const contentReducer = (state: ContentState, action: ContentAction): ContentState => {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'SET_SHOW_EDITOR':
      return { ...state, showEditor: action.payload }
    case 'SET_SHOW_TEMPLATES':
      return { ...state, showTemplates: action.payload }
    case 'SET_EDITING_PAGE':
      return { ...state, editingPage: action.payload }
    case 'SET_SELECTED_PAGES':
      return { ...state, selectedPages: action.payload }
    case 'SET_SHOW_DELETE_CONFIRM':
      return { ...state, showDeleteConfirm: action.payload }
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload }
    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.payload }
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.payload }
    case 'SET_FILTER_ROUTE':
      return { ...state, filterRoute: action.payload }
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload }
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload }
    case 'SET_PAGE_SIZE':
      return { ...state, pageSize: action.payload, currentPage: 1 }
    case 'SHOW_NOTIFICATION':
      return { ...state, notification: action.payload }
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null }
    default:
      return state
  }
}

// Provider Component
export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(contentReducer, initialState)
  const contentData = useProductionContentManagement()

  // Memoized filtered and sorted content
  const filteredContent = useMemo(() => {
    let filtered = contentData.contentPages || []

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase()
      filtered = filtered.filter(page => 
        page.title.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower)
      )
    }

    // Apply type filter
    if (state.filterType !== 'all') {
      filtered = filtered.filter(page => page.type === state.filterType)
    }

    // Apply status filter
    if (state.filterStatus !== 'all') {
      filtered = filtered.filter(page => page.status === state.filterStatus)
    }

    // Apply route filter
    if (state.filterRoute) {
      filtered = filtered.filter(page => (page as any).route === state.filterRoute)
    }

    // Apply sorting
    const [sortField, sortDirection] = state.sortBy.split('-')
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof ContentPage]
      let bValue: any = b[sortField as keyof ContentPage]

      if (sortField === 'title') {
        aValue = aValue?.toLowerCase() || ''
        bValue = bValue?.toLowerCase() || ''
      }

      if (sortDirection === 'desc') {
        return bValue > aValue ? 1 : -1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })

    return filtered
  }, [contentData.contentPages, state.searchTerm, state.filterType, state.filterStatus, state.sortBy])

  // Simple pagination when backend doesn't provide it
  const paginated = useMemo(() => {
    const start = (state.currentPage - 1) * state.pageSize
    return filteredContent.slice(start, start + state.pageSize)
  }, [filteredContent, state.currentPage, state.pageSize])

  // Actions
  const actions = useMemo((): ContentActions => ({
    // UI Actions
    setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    setShowEditor: (show) => dispatch({ type: 'SET_SHOW_EDITOR', payload: show }),
    setShowTemplates: (show) => dispatch({ type: 'SET_SHOW_TEMPLATES', payload: show }),
    setEditingPage: (page) => dispatch({ type: 'SET_EDITING_PAGE', payload: page }),
    setSelectedPages: (pages) => dispatch({ type: 'SET_SELECTED_PAGES', payload: pages }),
    setShowDeleteConfirm: (id) => dispatch({ type: 'SET_SHOW_DELETE_CONFIRM', payload: id }),

    // Filter Actions
    setSearchTerm: (term) => dispatch({ type: 'SET_SEARCH_TERM', payload: term }),
    setFilterType: (type) => dispatch({ type: 'SET_FILTER_TYPE', payload: type }),
    setFilterStatus: (status) => dispatch({ type: 'SET_FILTER_STATUS', payload: status }),
    setFilterRoute: (route: string) => dispatch({ type: 'SET_FILTER_ROUTE', payload: route }),
    setSortBy: (sort) => dispatch({ type: 'SET_SORT_BY', payload: sort }),
    setCurrentPage: (page) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
    setPageSize: (size) => dispatch({ type: 'SET_PAGE_SIZE', payload: size }),

    // Notification Actions
    showNotification: (type, message) => {
      dispatch({ type: 'SHOW_NOTIFICATION', payload: { type, message } })
      setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 5000)
    },
    clearNotification: () => dispatch({ type: 'CLEAR_NOTIFICATION' }),

    // Content Actions
    handleCreateNew: () => {
      if (typeof window !== 'undefined') {
        // Use the existing ContentManagerWrapper's create flow
        const url = new URL(window.location.href)
        url.searchParams.set('module', 'dynamic-content')
        url.searchParams.set('studio', 'create')
        // Use pushState instead of direct navigation to avoid page reload
        window.history.pushState({}, '', url.toString())
        // Trigger a popstate event to update the UI
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    },

    handleEdit: (page) => {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('module', 'dynamic-content')
        url.searchParams.set('studio', 'edit')
        url.searchParams.set('id', page.id)
        // Use pushState instead of direct navigation to avoid page reload
        window.history.pushState({}, '', url.toString())
        // Trigger a popstate event to update the UI
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    },

    handleDelete: async (pageId) => {
      try {
        await contentData.deleteContent(pageId)
        dispatch({ type: 'SHOW_NOTIFICATION', payload: { type: 'success', message: 'Content deleted successfully' } })
        dispatch({ type: 'SET_SHOW_DELETE_CONFIRM', payload: null })
      } catch (error) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: { type: 'error', message: 'Failed to delete content' } })
      }
    },

    handleDuplicate: async (page) => {
      try {
        await contentData.duplicateContent(page.id)
        dispatch({ type: 'SHOW_NOTIFICATION', payload: { type: 'success', message: 'Content duplicated successfully' } })
      } catch (error) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: { type: 'error', message: 'Failed to duplicate content' } })
      }
    },

    handlePublish: async (page) => {
      try {
        await contentData.publishContent(page.id)
        dispatch({ type: 'SHOW_NOTIFICATION', payload: { type: 'success', message: 'Content published successfully' } })
      } catch (error) {
        dispatch({ type: 'SHOW_NOTIFICATION', payload: { type: 'error', message: 'Failed to publish content' } })
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
      if (state.selectedPages.size === filteredContent.length) {
        dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set() })
      } else {
        dispatch({ type: 'SET_SELECTED_PAGES', payload: new Set(filteredContent.map(page => page.id)) })
      }
    }
  }), [state.selectedPages, filteredContent, contentData])

  const contextValue = useMemo(() => ({
    state: {
      ...state,
      contentData: {
        ...contentData,
        contentPages: filteredContent
      }
    },
    actions,
    contentData: {
      ...contentData,
      contentPages: filteredContent,
      pagination: {
        page: state.currentPage,
        pageSize: state.pageSize,
        total: filteredContent.length,
        totalPages: Math.max(1, Math.ceil(filteredContent.length / state.pageSize)),
        hasNext: state.currentPage * state.pageSize < filteredContent.length,
        hasPrev: state.currentPage > 1
      }
    },
    filteredContent,
    paginatedContent: paginated
  }), [state, actions, contentData, filteredContent, paginated])

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  )
}

// Hook to use the context
export const useContentContext = () => {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('useContentContext must be used within a ContentProvider')
  }
  return context
}
