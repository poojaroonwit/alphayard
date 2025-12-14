'use client'

import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react'
import { useProductionContentManagement } from '../../../hooks/useProductionContentManagement'

// Types
export interface ContentPage {
  id: string
  title: string
  slug: string
  type: string
  status: string
  content: string
  components?: any[]
  mobile_display?: any
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface ContentState {
  viewMode: 'grid' | 'list'
  showEditor: boolean
  showTemplates: boolean
  editingPage: ContentPage | null
  selectedPages: Set<string>
  showDeleteConfirm: string | null
  searchTerm: string
  filterType: string
  filterStatus: string
  sortBy: string
  notification: { type: 'success' | 'error'; message: string } | null
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
  setSortBy: (sort: string) => void

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

// Initial state
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
  sortBy: 'updated_at',
  notification: null
}

// Action types
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
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SHOW_NOTIFICATION'; payload: { type: 'success' | 'error'; message: string } }
  | { type: 'CLEAR_NOTIFICATION' }

// Reducer
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
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload }
    case 'SHOW_NOTIFICATION':
      return { ...state, notification: action.payload }
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null }
    default:
      return state
  }
}

// Context
const ContentContext = createContext<{
  state: ContentState
  actions: ContentActions
  contentData: any
} | null>(null)

// Provider Component
export const ContentProviderWithNavigation: React.FC<{ 
  children: React.ReactNode
  onCreateNew: () => void
  onEdit: (page: ContentPage) => void
}> = ({ children, onCreateNew, onEdit }) => {
  const [state, dispatch] = useReducer(contentReducer, initialState)
  const contentData = useProductionContentManagement()

  // Filtered content
  const filteredContent = useMemo(() => {
    let filtered = contentData.contentPages || []

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase()
      filtered = filtered.filter((page: any) =>
        page.title.toLowerCase().includes(searchLower) ||
        page.slug.toLowerCase().includes(searchLower)
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

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (state.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return filtered
  }, [contentData.contentPages, state.searchTerm, state.filterType, state.filterStatus, state.sortBy])

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
    setSortBy: (sort) => dispatch({ type: 'SET_SORT_BY', payload: sort }),

    // Notification Actions
    showNotification: (type, message) => {
      dispatch({ type: 'SHOW_NOTIFICATION', payload: { type, message } })
      setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 5000)
    },
    clearNotification: () => dispatch({ type: 'CLEAR_NOTIFICATION' }),

    // Content Actions
    handleCreateNew: onCreateNew,
    handleEdit: onEdit,
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
        const allIds = new Set(filteredContent.map((page: any) => page.id))
        dispatch({ type: 'SET_SELECTED_PAGES', payload: allIds })
      }
    }
  }), [state.selectedPages, filteredContent, contentData, onCreateNew, onEdit])

  return (
    <ContentContext.Provider value={{ state, actions, contentData: { ...contentData, contentPages: filteredContent } }}>
      {children}
    </ContentContext.Provider>
  )
}

// Hook
export const useContentContext = () => {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('useContentContext must be used within a ContentProviderWithNavigation')
  }
  return context
}
