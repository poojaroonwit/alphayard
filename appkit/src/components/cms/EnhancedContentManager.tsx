'use client'

import React, { useState, useCallback, useMemo } from 'react'
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
  XMarkIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowsUpDownIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  ArchiveBoxIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline'
import { LookerStudioEditor } from './LookerStudioEditor'
import { ContentPage } from '../../services/productionCmsService'
import { useContentActions } from '../../hooks/useContentActions'
import { listContent, deleteContent, publishContent as publishContentAPI } from '../../services/contentService'

// Types
interface ViewMode {
  type: 'grid' | 'list'
  label: string
  icon: React.ComponentType<any>
}

interface SortOption {
  value: string
  label: string
  direction: 'asc' | 'desc'
}

interface BulkAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: (selectedIds: string[]) => Promise<void>
  variant: 'primary' | 'secondary' | 'danger'
}

// View modes
const VIEW_MODES: ViewMode[] = [
  { type: 'grid', label: 'Grid View', icon: Squares2X2Icon },
  { type: 'list', label: 'List View', icon: ListBulletIcon }
]

// Sort options
const SORT_OPTIONS: SortOption[] = [
  { value: 'updatedAt-desc', label: 'Last Updated', direction: 'desc' },
  { value: 'createdAt-desc', label: 'Date Created', direction: 'desc' },
  { value: 'title-asc', label: 'Title A-Z', direction: 'asc' },
  { value: 'title-desc', label: 'Title Z-A', direction: 'desc' },
  { value: 'status-asc', label: 'Status', direction: 'asc' },
  { value: 'type-asc', label: 'Type', direction: 'asc' }
]

// Content type options
const CONTENT_TYPES = [
  { value: 'all', label: 'All Types', icon: DocumentTextIcon },
  { value: 'marketing', label: 'Marketing', icon: GlobeAltIcon },
  { value: 'news', label: 'News', icon: DocumentTextIcon },
  { value: 'inspiration', label: 'Inspiration', icon: PhotoIcon },
  { value: 'popup', label: 'Popup', icon: BellIcon }
]

// Status options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
]

// Content Item Component
interface ContentItemProps {
  page: ContentPage
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (page: ContentPage) => void
  onEdit: (page: ContentPage) => void
  onDelete: (pageId: string) => void
  onDuplicate: (page: ContentPage) => void
  onPublish: (page: ContentPage) => void
  onPreview: (page: ContentPage) => void
}

const ContentItem: React.FC<ContentItemProps> = ({
  page,
  viewMode,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onPublish,
  onPreview
}) => {
  const getTypeIcon = (type: string) => {
    const typeConfig = CONTENT_TYPES.find(t => t.value === type)
    return typeConfig?.icon || DocumentTextIcon
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'marketing': return 'bg-blue-100 text-blue-800'
      case 'news': return 'bg-purple-100 text-purple-800'
      case 'inspiration': return 'bg-pink-100 text-pink-800'
      case 'popup': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const TypeIcon = getTypeIcon(page.type)

  if (viewMode === 'grid') {
    return (
      <div 
        className={`relative bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => onSelect(page)}
      >
        {/* Selection checkbox */}
        <div className="absolute top-3 right-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(page)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {/* Type icon */}
        <div className="flex items-center mb-3">
          <TypeIcon className="h-6 w-6 text-gray-500 mr-2" />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(page.type)}`}>
            {page.type}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{page.title}</h3>

        {/* Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(page.status)}`}>
            {page.status}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(page.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPreview(page)
            }}
            className="flex-1 px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="Preview"
          >
            <EyeIcon className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(page)
            }}
            className="flex-1 px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4 mx-auto" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate(page)
            }}
            className="flex-1 px-3 py-2 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mx-auto" />
          </button>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div 
      className={`flex items-center justify-between p-4 bg-white rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(page)}
    >
      <div className="flex items-center space-x-4 flex-1">
        {/* Selection checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(page)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />

        {/* Type icon */}
        <TypeIcon className="h-5 w-5 text-gray-500" />

        {/* Content info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{page.title}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(page.type)}`}>
              {page.type}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(page.status)}`}>
              {page.status}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(page.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPreview(page)
          }}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          title="Preview"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(page)
          }}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
          title="Edit"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDuplicate(page)
          }}
          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors"
          title="Duplicate"
        >
          <DocumentDuplicateIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(page.id)
          }}
          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Main Component
export const EnhancedContentManager: React.FC = () => {
  // State
  const [content, setContent] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null)
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('updatedAt-desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  // Hooks
  const { saveContent, publishContent, duplicateContent, isSaving, isPublishing, isDuplicating } = useContentActions()

  // Load content
  const loadContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listContent()
      setContent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load content on mount
  React.useEffect(() => {
    loadContent()
  }, [loadContent])

  // Filtered and sorted content
  const filteredContent = useMemo(() => {
    let filtered = content.filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           page.slug.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || page.type === filterType
      const matchesStatus = filterStatus === 'all' || page.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })

    // Sort content
    const [sortField, sortDirection] = sortBy.split('-')
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof ContentPage]
      let bValue: any = b[sortField as keyof ContentPage]

      if (sortField === 'updatedAt' || sortField === 'createdAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === 'desc') {
        return bValue > aValue ? 1 : -1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })

    return filtered
  }, [content, searchTerm, filterType, filterStatus, sortBy])

  // Notification handler
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Selection handlers
  const handleSelectPage = useCallback((page: ContentPage) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(page.id)) {
        newSet.delete(page.id)
      } else {
        newSet.add(page.id)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedPages.size === filteredContent.length) {
      setSelectedPages(new Set())
    } else {
      setSelectedPages(new Set(filteredContent.map(page => page.id)))
    }
  }, [selectedPages.size, filteredContent])

  // Action handlers
  const handleCreateNew = useCallback(() => {
    setEditingPage(null)
    setShowEditor(true)
  }, [])

  const handleEdit = useCallback((page: ContentPage) => {
    setEditingPage(page)
    setShowEditor(true)
  }, [])

  const handleDelete = useCallback(async (pageId: string) => {
    try {
      await deleteContent(pageId)
      await loadContent()
      showNotification('success', 'Content deleted successfully')
      setShowDeleteConfirm(null)
    } catch (error) {
      showNotification('error', 'Failed to delete content')
    }
  }, [loadContent, showNotification])

  const handleDuplicate = useCallback(async (page: ContentPage) => {
    try {
      await duplicateContent(page)
      await loadContent()
      showNotification('success', 'Content duplicated successfully')
    } catch (error) {
      showNotification('error', 'Failed to duplicate content')
    }
  }, [duplicateContent, loadContent, showNotification])

  const handlePublish = useCallback(async (page: ContentPage) => {
    try {
      await publishContent(page)
      await loadContent()
      showNotification('success', 'Content published successfully')
    } catch (error) {
      showNotification('error', 'Failed to publish content')
    }
  }, [publishContent, loadContent, showNotification])

  const handlePreview = useCallback((page: ContentPage) => {
    // Open preview in new window
    const previewUrl = `/content-preview?id=${page.id}`
    window.open(previewUrl, '_blank')
  }, [])

  const handleSave = useCallback(async (page: ContentPage) => {
    try {
      await saveContent(page)
      await loadContent()
      setShowEditor(false)
      setEditingPage(null)
      showNotification('success', 'Content saved successfully')
    } catch (error) {
      showNotification('error', 'Failed to save content')
    }
  }, [saveContent, loadContent, showNotification])

  const handleCancel = useCallback(() => {
    setShowEditor(false)
    setEditingPage(null)
  }, [])

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'publish',
      label: 'Publish Selected',
      icon: CloudArrowUpIcon,
      action: async (selectedIds: string[]) => {
        try {
          for (const id of selectedIds) {
            const page = content.find(p => p.id === id)
            if (page) {
              await publishContent(page)
            }
          }
          await loadContent()
          setSelectedPages(new Set())
          showNotification('success', `${selectedIds.length} content items published successfully`)
        } catch (error) {
          showNotification('error', 'Failed to publish selected content')
        }
      },
      variant: 'primary'
    },
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: TrashIcon,
      action: async (selectedIds: string[]) => {
        try {
          for (const id of selectedIds) {
            await deleteContent(id)
          }
          await loadContent()
          setSelectedPages(new Set())
          showNotification('success', `${selectedIds.length} content items deleted successfully`)
        } catch (error) {
          showNotification('error', 'Failed to delete selected content')
        }
      },
      variant: 'danger'
    }
  ]

  // Render editor
  if (showEditor) {
    return (
      <LookerStudioEditor
        page={editingPage || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
        onPublish={handlePublish}
        onPreview={handlePreview}
        onDuplicate={handleDuplicate}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-8 w-8 mr-3" />
                Content Management
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage your dynamic content
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Content
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CONTENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Mode */}
              <div className="flex border border-gray-300 rounded-lg">
                {VIEW_MODES.map(mode => {
                  const IconComponent = mode.icon
                  return (
                    <button
                      key={mode.type}
                      onClick={() => setViewMode(mode.type)}
                      className={`px-3 py-2 ${
                        viewMode === mode.type
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      } ${mode.type === 'grid' ? 'rounded-l-lg' : 'rounded-r-lg border-l border-gray-300'}`}
                      title={mode.label}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedPages.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedPages.size} item{selectedPages.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  {bulkActions.map(action => {
                    const IconComponent = action.icon
                    return (
                      <button
                        key={action.id}
                        onClick={() => action.action(Array.from(selectedPages))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                          action.variant === 'danger'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : action.variant === 'primary'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mr-2" />
                        {action.label}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setSelectedPages(new Set())}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Loading content...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <ExclamationTriangleIcon className="h-8 w-8 mx-auto text-red-400 mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadContent}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first content to get started'
                }
              </p>
              {(!searchTerm && filterType === 'all' && filterStatus === 'all') && (
                <button
                  onClick={handleCreateNew}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Content
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              {/* Select All */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPages.size === filteredContent.length && filteredContent.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Select all ({filteredContent.length} items)
                  </span>
                </label>
              </div>

              {/* Content Grid/List */}
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-2'
              }>
                {filteredContent.map(page => (
                  <ContentItem
                    key={page.id}
                    page={page}
                    viewMode={viewMode}
                    isSelected={selectedPages.has(page.id)}
                    onSelect={handleSelectPage}
                    onEdit={handleEdit}
                    onDelete={setShowDeleteConfirm}
                    onDuplicate={handleDuplicate}
                    onPublish={handlePublish}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Content</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this content? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
