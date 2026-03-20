'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  RectangleStackIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  GlobeAltIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ShareIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  CogIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon
} from '@heroicons/react/24/outline'
import { ContentEditor } from './ContentEditor'
import { ContentTypes, ContentTypeSchema } from './ContentTypes'
import { useContentManagement, ContentPage } from '../../hooks/useContentManagement'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { LoadingCard, ContentListSkeleton, EmptyState, ErrorState } from '../ui/LoadingStates'
import { ResponsiveContainer, ResponsiveGrid, ResponsiveFlex, ResponsiveText } from '../ui/ResponsiveContainer'
import { SEOMetadata, ContentSEOMetadata } from '../ui/SEOMetadata'
import { ARIA_LABELS, focusManagement, keyboardNavigation } from '../../utils/accessibility'
import { validateContentForm, getFieldError, hasFieldError, getFieldErrorClass } from '../../utils/validation'

// Enhanced Content Studio Interface
interface ContentStudioProps {
  applicationId?: string
  isContentStudio?: boolean
  initialMode?: 'list' | 'editor'
  selectedContentId?: string
  onContentSelect?: (content: ContentPage) => void
  onContentPublish?: (content: ContentPage) => void
  onContentSchedule?: (content: ContentPage, scheduleDate: Date) => void
}

export const ContentStudio: React.FC<ContentStudioProps> = ({
  applicationId,
  isContentStudio,
  initialMode = 'list',
  selectedContentId,
  onContentSelect,
  onContentPublish,
  onContentSchedule
}) => {
  // State management
  const [currentMode, setCurrentMode] = useState<'list' | 'editor' | 'preview' | 'collections' | 'data'>(initialMode as any)
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeSchema | null>(null)
  const [selectedContent, setSelectedContent] = useState<ContentPage | null>(null)
  const [editingContent, setEditingContent] = useState<ContentPage | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'updatedAt' | 'views'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [bulkSelection, setBulkSelection] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const contentListRef = useRef<HTMLDivElement>(null)

  // Content management hook
  const {
    contentPages,
    loading,
    error,
    filters,
    setFilters,
    createContent,
    updateContent,
    deleteContent,
    refreshContent
  } = useContentManagement(applicationId)

  // Memoized filtered and sorted content
  const processedContent = useMemo(() => {
    const filtered = contentPages.filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (page.components && JSON.stringify(page.components).toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesType = filterType === 'all' || page.type === filterType
      const matchesStatus = filterStatus === 'all' || page.status === filterStatus
      
      let matchesDate = true
      if (filterDate !== 'all') {
        const now = new Date()
        const pageDate = new Date(page.updatedAt)
        const daysDiff = Math.floor((now.getTime() - pageDate.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (filterDate) {
          case 'today':
            matchesDate = daysDiff === 0
            break
          case 'week':
            matchesDate = daysDiff <= 7
            break
          case 'month':
            matchesDate = daysDiff <= 30
            break
          case 'year':
            matchesDate = daysDiff <= 365
            break
        }
      }
      
      return matchesSearch && matchesType && matchesStatus && matchesDate
    })

    // Sort content
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        case 'views':
          aValue = a.views || 0
          bValue = b.views || 0
          break
        default:
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [contentPages, searchTerm, filterType, filterStatus, filterDate, sortBy, sortOrder])

  // Notification handler
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Event handlers
  const handleCreateNew = useCallback(() => {
    setEditingContent(null)
    setCurrentMode('editor')
    focusManagement.restoreFocus.save()
  }, [])

  const handleEdit = useCallback((content: ContentPage) => {
    setEditingContent(content)
    setCurrentMode('editor')
    focusManagement.restoreFocus.save()
  }, [])

  const handleView = useCallback((content: ContentPage) => {
    setSelectedContent(content)
    setCurrentMode('preview')
    onContentSelect?.(content)
  }, [onContentSelect])

  const handleDelete = useCallback(async (contentId: string) => {
    try {
      await deleteContent(contentId)
      showNotification('success', 'Content deleted successfully')
      setShowDeleteConfirm(null)
      setBulkSelection(prev => prev.filter(id => id !== contentId))
    } catch (error) {
      showNotification('error', 'Failed to delete content')
    }
  }, [deleteContent, showNotification])

  const handleBulkDelete = useCallback(async () => {
    try {
      await Promise.all(bulkSelection.map(id => deleteContent(id)))
      showNotification('success', `${bulkSelection.length} content items deleted successfully`)
      setBulkSelection([])
      setShowBulkActions(false)
    } catch (error) {
      showNotification('error', 'Failed to delete selected content')
    }
  }, [bulkSelection, deleteContent, showNotification])

  const handleSave = useCallback(async (content: ContentPage) => {
    try {
      if (content.id) {
        await updateContent(content.id, content)
        showNotification('success', 'Content updated successfully')
      } else {
        await createContent(content)
        showNotification('success', 'Content created successfully')
      }
      setCurrentMode('list')
      setEditingContent(null)
      focusManagement.restoreFocus.restore()
    } catch (error) {
      showNotification('error', 'Failed to save content')
    }
  }, [createContent, updateContent, showNotification])

  const handlePublish = useCallback(async (content: ContentPage) => {
    try {
      await updateContent(content.id, { ...content, status: 'published' })
      showNotification('success', 'Content published successfully')
      onContentPublish?.(content)
    } catch (error) {
      showNotification('error', 'Failed to publish content')
    }
  }, [updateContent, showNotification, onContentPublish])

  const handleSchedule = useCallback(async (content: ContentPage, scheduleDate: Date) => {
    try {
      // TODO: Implement scheduling logic
      showNotification('success', `Content scheduled for ${scheduleDate.toLocaleDateString()}`)
      onContentSchedule?.(content, scheduleDate)
    } catch (error) {
      showNotification('error', 'Failed to schedule content')
    }
  }, [showNotification, onContentSchedule])

  const handleCancel = useCallback(() => {
    setCurrentMode('list')
    setEditingContent(null)
    setSelectedContent(null)
    focusManagement.restoreFocus.restore()
  }, [])

  const handleRetry = useCallback(() => {
    refreshContent()
  }, [refreshContent])

  const handleBulkSelect = useCallback((contentId: string, selected: boolean) => {
    setBulkSelection(prev => {
      if (selected) {
        return [...prev, contentId]
      } else {
        return prev.filter(id => id !== contentId)
      }
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (bulkSelection.length === processedContent.length) {
      setBulkSelection([])
    } else {
      setBulkSelection(processedContent.map(content => content.id))
    }
  }, [bulkSelection.length, processedContent])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault()
            handleCreateNew()
            break
          case 'f':
            e.preventDefault()
            searchInputRef.current?.focus()
            break
          case 'a':
            if (currentMode === 'list') {
              e.preventDefault()
              handleSelectAll()
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleCreateNew, handleSelectAll, currentMode])

  // Auto-save functionality
  useEffect(() => {
    if (editingContent && currentMode === 'editor') {
      const autoSaveInterval = setInterval(() => {
        // TODO: Implement auto-save logic
        console.log('Auto-saving content...')
      }, 30000) // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval)
    }
    return undefined
  }, [editingContent, currentMode])

  // Render different modes
  if (currentMode === 'editor') {
    return (
      <ErrorBoundary>
        <ContentEditor
          page={editingContent || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </ErrorBoundary>
    )
  }

  if (currentMode === 'preview') {
    return (
      <ErrorBoundary>
        <PreviewView
          content={selectedContent}
          previewMode={previewMode}
          onPreviewModeChange={setPreviewMode}
          onEdit={() => handleEdit(selectedContent!)}
          onBack={() => setCurrentMode('list')}
        />
      </ErrorBoundary>
    )
  }

  if (currentMode === 'collections') {
    return (
      <ErrorBoundary>
        <ContentTypes />
      </ErrorBoundary>
    )
  }

  if (currentMode === 'data') {
    return (
      <ErrorBoundary>
        <div className="p-8 text-center text-gray-500">
          Collection Data Manager is coming soon.
        </div>
      </ErrorBoundary>
    )
  }

  // Main list view
  return (
    <ErrorBoundary>
      <SEOMetadata
        title="Content Studio"
        description="Professional content management and creation studio with advanced editing, preview, and publishing capabilities."
        keywords={['content management', 'CMS', 'content studio', 'editor', 'publishing']}
      />
      
      <ResponsiveContainer maxWidth="full" padding="lg">
        <div className="space-y-6">
          {/* Notification */}
          {notification && (
            <div className={`notification ${
              notification.type === 'success' 
                ? 'notification-success' 
                : notification.type === 'error'
                ? 'notification-error'
                : 'notification-warning'
            }`}>
              <div className="flex items-center space-x-2">
                {notification.type === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : notification.type === 'error' ? (
                  <ExclamationTriangleIcon className="h-5 w-5" />
                ) : (
                  <ClockIcon className="h-5 w-5" />
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="content-card">
            <ResponsiveFlex
              direction="col"
              responsiveDirection={{ md: 'row' }}
              justify="between"
              align="start"
              gap="md"
            >
              <div>
                <ResponsiveText
                  size={{ default: 'lg', md: 'xl' }} 
                  weight="bold"
                  className="mb-1 text-white"
                >
                  <DocumentTextIcon className="h-5 w-5 inline mr-2 text-white" />
                  Content Studio
                </ResponsiveText>
                <ResponsiveText
                  size={{ default: 'xs', md: 'sm' }}
                  color="gray"
                >
                  Professional content management and creation studio
                </ResponsiveText>
              </div>
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setCurrentMode('list')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  ((currentMode as any) === 'list' || (currentMode as any) === 'editor' || (currentMode as any) === 'preview')
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300'
                }`}
              >
                Pages
              </button>
              <button
                onClick={() => setCurrentMode('collections')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  (currentMode as any) === 'collections'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300'
                }`}
              >
                Collections
              </button>
              <button
                onClick={() => setCurrentMode('data')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  (currentMode as any) === 'data'
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300'
                }`}
              >
                Data
              </button>
            </div>
            <ResponsiveFlex
                direction="col"
                responsiveDirection={{ sm: 'row' }}
                gap="sm"
                className="w-full md:w-auto"
              >
                {currentMode === 'list' && (
                  <button
                    onClick={handleCreateNew}
                    className="content-button content-button-primary w-full md:w-auto text-xs"
                    aria-label="Create new content"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Content
                  </button>
                )}
              </ResponsiveFlex>
            </ResponsiveFlex>
          </div>

          {/* Search and Filters */}
          <div className="content-card">
            <ResponsiveFlex
              direction="col"
              responsiveDirection={{ sm: 'row' }}
              gap="sm"
              align="stretch"
            >
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search content... (Ctrl+F)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="content-input pl-9 py-1.5 text-sm"
                  aria-label="Search content"
                />
              </div>
              
              <ResponsiveFlex
                direction="col"
                responsiveDirection={{ sm: 'row' }}
                gap="sm"
                className="w-full sm:w-auto"
              >
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="content-input w-full sm:w-40 py-1.5 text-sm"
                  aria-label="Filter by type"
                >
                  <option value="all">All Types</option>
                  <option value="marketing">Marketing</option>
                  <option value="news">News</option>
                  <option value="inspiration">Inspiration</option>
                  <option value="popup">Popup</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="content-input w-full sm:w-40 py-1.5 text-sm"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>


                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="content-input w-full sm:w-48"
                  aria-label="Filter by date"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="content-button content-button-secondary w-full sm:w-auto"
                  aria-label="Toggle advanced filters"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </ResponsiveFlex>
            </ResponsiveFlex>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <ResponsiveFlex
                  direction="col"
                  responsiveDirection={{ sm: 'row' }}
                  gap="sm"
                  align="stretch"
                >
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="content-input w-full sm:w-48"
                    aria-label="Sort by"
                  >
                    <option value="title">Sort by Title</option>
                    <option value="createdAt">Sort by Created</option>
                    <option value="updatedAt">Sort by Updated</option>
                    <option value="views">Sort by Views</option>
                  </select>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="content-input w-full sm:w-48"
                    aria-label="Sort order"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>

                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilterType('all')
                      setFilterStatus('all')
                      setFilterDate('all')
                      setSortBy('updatedAt')
                      setSortOrder('desc')
                    }}
                    className="content-button content-button-secondary w-full sm:w-auto"
                    aria-label="Reset filters"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Reset
                  </button>
                </ResponsiveFlex>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {bulkSelection.length > 0 && (
            <div className="content-card bg-blue-900/20 border-blue-900/50">
              <ResponsiveFlex
                direction="col"
                responsiveDirection={{ sm: 'row' }}
                justify="between"
                align="center"
                gap="md"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                  <span className="font-medium text-blue-100">
                    {bulkSelection.length} item{bulkSelection.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <ResponsiveFlex
                  direction="col"
                  responsiveDirection={{ sm: 'row' }}
                  gap="sm"
                  className="w-full sm:w-auto"
                >
                  <button
                    onClick={handleBulkDelete}
                    className="content-button content-button-secondary text-red-400 hover:bg-red-900/20 w-full sm:w-auto"
                    aria-label="Delete selected items"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Selected
                  </button>
                  <button
                    onClick={() => {
                      setBulkSelection([])
                      setShowBulkActions(false)
                    }}
                    className="content-button content-button-secondary w-full sm:w-auto"
                    aria-label="Clear selection"
                  >
                    Clear Selection
                  </button>
                </ResponsiveFlex>
              </ResponsiveFlex>
            </div>
          )}

          {/* Content List */}
          <div className="content-card">
            {loading ? (
              <ContentListSkeleton count={5} />
            ) : error ? (
              <ErrorState
                title="Failed to load content"
                description="We couldn't load your content. Please try again."
                error={error}
                onRetry={handleRetry}
              />
            ) : processedContent.length === 0 ? (
              <EmptyState
                icon={DocumentTextIcon}
                title="No content found"
                description="Create your first content piece to get started!"
                action={{
                  label: "Create Content",
                  onClick: handleCreateNew
                }}
              />
            ) : (
              <div className="space-y-4" role="list" aria-label="Content list">
                {processedContent.map((content) => (
                  <ContentStudioItem
                    key={content.id}
                    content={content}
                    isSelected={bulkSelection.includes(content.id)}
                    onSelect={(selected) => handleBulkSelect(content.id, selected)}
                    onEdit={handleEdit}
                    onView={handleView}
                    onDelete={(id) => setShowDeleteConfirm(id)}
                    onPublish={handlePublish}
                    onSchedule={handleSchedule}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-supabase-dark border border-supabase-border rounded-lg p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-white">Delete Content</h3>
                </div>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete this content? This action cannot be undone.
                </p>
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="content-button content-button-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="content-button content-button-primary bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </ErrorBoundary>
  )
}

// Content Studio Item Component
interface ContentStudioItemProps {
  content: ContentPage
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onEdit: (content: ContentPage) => void
  onView: (content: ContentPage) => void
  onDelete: (id: string) => void
  onPublish: (content: ContentPage) => void
  onSchedule: (content: ContentPage, date: Date) => void
}

const ContentStudioItem: React.FC<ContentStudioItemProps> = ({
  content,
  isSelected,
  onSelect,
  onEdit,
  onView,
  onDelete,
  onPublish,
  onSchedule
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'marketing': return GlobeAltIcon
      case 'news': return DocumentTextIcon
      case 'inspiration': return PhotoIcon
      case 'popup': return BellIcon
      default: return DocumentTextIcon
    }
  }

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      draft: 'badge badge-draft',
      published: 'badge badge-published',
      archived: 'badge badge-archived'
    }
    return (
      <span className={badgeClasses[status as keyof typeof badgeClasses]}>
        {status}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const badgeClasses = {
      marketing: 'badge badge-marketing',
      news: 'badge badge-news',
      inspiration: 'badge badge-inspiration',
      popup: 'badge badge-popup'
    }
    return (
      <span className={badgeClasses[type as keyof typeof badgeClasses]}>
        {type}
      </span>
    )
  }

  const TypeIcon = getTypeIcon(content.type)
  
  return (
    <div 
      className={`content-item ${isSelected ? 'content-item-selected' : ''}`}
      role="listitem"
    >
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-supabase-black border-supabase-border rounded"
          aria-label={`Select ${content.title}`}
        />
        <TypeIcon className="h-6 w-6 text-gray-500" />
        <div className="flex-1">
          <div className="font-medium text-gray-900">{content.title}</div>
          <div className="text-sm text-gray-500">
            {content.slug} • {new Date(content.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            {getTypeBadge(content.type)}
            {getStatusBadge(content.status)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-center">
          <div className="font-medium text-gray-900">{content.views || 0}</div>
          <div className="text-xs text-gray-500">views</div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onView(content)}
            className="content-button content-button-secondary"
            title="Preview"
            aria-label={`Preview ${content.title}`}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(content)}
            className="content-button content-button-secondary"
            title="Edit"
            aria-label={`Edit ${content.title}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {content.status === 'draft' && (
            <button
              onClick={() => onPublish(content)}
              className="content-button content-button-secondary text-green-600 hover:bg-green-50"
              title="Publish"
              aria-label={`Publish ${content.title}`}
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(content.id)}
            className="content-button content-button-secondary text-red-600 hover:bg-red-50"
            title="Delete"
            aria-label={`Delete ${content.title}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

