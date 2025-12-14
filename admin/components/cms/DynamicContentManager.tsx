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
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { ProductionContentEditor } from './ProductionContentEditor'
import { SimpleProductionEditor } from './SimpleProductionEditor'
import { LookerStudioEditor } from './LookerStudioEditor'
import { ProductionContentPreview } from './ProductionContentPreview'
import { SEOManager } from './SEOManager'
import { MediaUpload, MediaGallery } from './MediaUpload'
import { useProductionContentManagement } from '../../hooks/useProductionContentManagement'
import { ContentPage, ContentTemplate } from '../../services/productionCmsService'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { LoadingCard, ContentListSkeleton, TemplateGridSkeleton, EmptyState, ErrorState } from '../ui/LoadingStates'
import { ResponsiveContainer, ResponsiveGrid, ResponsiveFlex, ResponsiveText } from '../ui/ResponsiveContainer'
import { SEOMetadata, ContentSEOMetadata } from '../ui/SEOMetadata'
import { ARIA_LABELS, focusManagement, keyboardNavigation } from '../../utils/accessibility'
import { validateContentForm, getFieldError, hasFieldError, getFieldErrorClass } from '../../utils/validation'

// Component for individual content page item
interface ContentPageItemProps {
  page: ContentPage
  onEdit: (page: ContentPage) => void
  onDelete: (pageId: string) => void
  onView: (page: ContentPage) => void
  isSelected?: boolean
  onSelect?: (page: ContentPage) => void
}

const ContentPageItem: React.FC<ContentPageItemProps> = ({ 
  page, 
  onEdit, 
  onDelete, 
  onView, 
  isSelected = false,
  onSelect 
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

  const TypeIcon = getTypeIcon(page.type)
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.(page)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onSelect?.(page)
    }
  }, [page, onSelect])

  return (
    <div 
      className={`content-item ${isSelected ? 'content-item-selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(page)}
      onKeyDown={handleKeyDown}
      aria-label={`${page.title} - ${page.type} content, ${page.status} status`}
    >
      <div className="flex items-center space-x-4">
        <TypeIcon className="h-6 w-6 text-gray-500" />
        <div>
          <div className="font-medium text-gray-900">{page.title}</div>
          <div className="text-sm text-gray-500">
            {page.slug} • {new Date(page.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            {getTypeBadge(page.type)}
            {getStatusBadge(page.status)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-center">
          <div className="font-medium text-gray-900">{page.views || 0}</div>
          <div className="text-xs text-gray-500">views</div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView(page)
            }}
            className="content-button content-button-secondary"
            title="Preview"
            aria-label={`Preview ${page.title}`}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(page)
            }}
            className="content-button content-button-secondary"
            title="Edit"
            aria-label={`Edit ${page.title}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(page.id)
            }}
            className="content-button content-button-secondary text-red-600 hover:bg-red-50"
            title="Delete"
            aria-label={`Delete ${page.title}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Main component
export const DynamicContentManager: React.FC = () => {
  const [showEditor, setShowEditor] = useState(false)
  
  // Debug showEditor state changes
  React.useEffect(() => {
    console.log('showEditor state changed:', showEditor)
  }, [showEditor])
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedPage, setSelectedPage] = useState<ContentPage | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const {
    contentPages,
    templates,
    loading,
    error,
    saving,
    lastSaved,
    filters,
    pagination,
    setFilters,
    createContent,
    updateContent,
    deleteContent,
    duplicateContent,
    publishContent,
    unpublishContent,
    archiveContent,
    createFromTemplate,
    refreshContent,
    clearError
  } = useProductionContentManagement()

  // Memoized filtered pages
  const filteredPages = useMemo(() => {
    return contentPages.filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           page.slug.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || page.type === filterType
      const matchesStatus = filterStatus === 'all' || page.status === filterStatus
      return matchesSearch && matchesType && matchesStatus
    })
  }, [contentPages, searchTerm, filterType, filterStatus])

  // Notification handler
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Event handlers
  const handleCreateNew = useCallback(() => {
    console.log('Creating new content...')
    console.log('Before: showEditor =', showEditor)
    setEditingPage(null)
    setShowEditor(true)
    console.log('After: setShowEditor(true) called')
    focusManagement.restoreFocus.save()
  }, [showEditor])

  const handleEdit = useCallback((page: ContentPage) => {
    setEditingPage(page)
    setShowEditor(true)
    focusManagement.restoreFocus.save()
  }, [])

  const handleDelete = useCallback(async (pageId: string) => {
    try {
      await deleteContent(pageId)
      showNotification('success', 'Content page deleted successfully')
      setShowDeleteConfirm(null)
    } catch (error) {
      showNotification('error', 'Failed to delete content page')
    }
  }, [deleteContent, showNotification])

  const handleSave = useCallback(async (page: ContentPage) => {
    try {
      if (page.id) {
        await updateContent(page.id, page)
        showNotification('success', 'Content page updated successfully')
      } else {
        await createContent(page)
        showNotification('success', 'Content page created successfully')
      }
      setShowEditor(false)
      setEditingPage(null)
      focusManagement.restoreFocus.restore()
    } catch (error) {
      showNotification('error', 'Failed to save content page')
    }
  }, [createContent, updateContent, showNotification])

  const handleCreateFromTemplate = useCallback(async (template: ContentTemplate) => {
    try {
      await createFromTemplate(template.id, {
        title: `${template.name} - Copy`,
        slug: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      })
      showNotification('success', 'Content created from template successfully')
      setShowTemplates(false)
    } catch (error) {
      showNotification('error', 'Failed to create content from template')
    }
  }, [createFromTemplate, showNotification])

  const handleCancel = useCallback(() => {
    setShowEditor(false)
    setEditingPage(null)
    focusManagement.restoreFocus.restore()
  }, [])

  const handleRetry = useCallback(() => {
    refreshContent()
  }, [refreshContent])

  // Utility functions
  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'marketing': return GlobeAltIcon
      case 'news': return DocumentTextIcon
      case 'inspiration': return PhotoIcon
      case 'popup': return BellIcon
      default: return DocumentTextIcon
    }
  }, [])


  // Render editor
  if (showEditor) {
    return (
      <ErrorBoundary>
        <LookerStudioEditor
          page={editingPage || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          onPublish={async (page) => {
            try {
              await publishContent(page.id)
              showNotification('success', 'Content published successfully')
              setShowEditor(false)
              setEditingPage(null)
            } catch (error) {
              showNotification('error', 'Failed to publish content')
            }
          }}
          onPreview={(page) => {
            console.log('Previewing content:', page.title)
            // TODO: Implement preview logic
          }}
          onDuplicate={async (page) => {
            try {
              await duplicateContent(page.id)
              showNotification('success', 'Content duplicated successfully')
            } catch (error) {
              showNotification('error', 'Failed to duplicate content')
            }
          }}
        />
      </ErrorBoundary>
    )
  }

  // Render templates view
  if (showTemplates) {
    return (
      <ErrorBoundary>
        <SEOMetadata
          title="Content Templates"
          description="Choose from our collection of professionally designed content templates to create engaging marketing pages, news articles, and interactive content."
          keywords={['content templates', 'design templates', 'marketing templates', 'news templates']}
        />
        
        <ResponsiveContainer maxWidth="full" padding="lg">
          <div className="space-y-6">
            {/* Header */}
            <div className="content-card">
              <ResponsiveFlex
                direction="col"
                responsiveDirection={{ md: 'row' }}
                justify="between"
                align="start"
                gap="lg"
              >
                <div>
                  <ResponsiveText
                    size={{ default: 'lg', md: 'xl' }}
                    weight="semibold"
                    color="gray"
                  >
                    Content Templates
                  </ResponsiveText>
                  <ResponsiveText
                    size={{ default: 'sm', md: 'base' }}
                    color="gray"
                    className="mt-1"
                  >
                    Choose a template to start creating content
                  </ResponsiveText>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="content-button content-button-secondary w-full md:w-auto"
                  aria-label="Back to content management"
                >
                  Back to Content
                </button>
              </ResponsiveFlex>
            </div>

            {/* Templates Grid */}
            {loading ? (
              <TemplateGridSkeleton count={6} />
            ) : error ? (
              <ErrorState
                title="Failed to load templates"
                description="We couldn't load the content templates. Please try again."
                error={error}
                onRetry={handleRetry}
              />
            ) : templates.length === 0 ? (
              <EmptyState
                icon={RectangleStackIcon}
                title="No templates available"
                description="There are no content templates available at the moment."
              />
            ) : (
              <ResponsiveGrid
                cols={{ default: 1, md: 2, lg: 3 }}
                gap="lg"
              >
                {templates.map((template) => {
                  const TypeIcon = getTypeIcon(template.type)
                  return (
                    <div 
                      key={template.id} 
                      className="template-card"
                      role="article"
                      aria-label={`Template: ${template.name}`}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <TypeIcon className="h-6 w-6 text-gray-500" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-500">{template.description}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="template-preview">
                          <span className="text-gray-500">Template Preview</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCreateFromTemplate(template)}
                        className="content-button content-button-primary w-full"
                        aria-label={`Use template: ${template.name}`}
                      >
                        Use Template
                      </button>
                    </div>
                  )
                })}
              </ResponsiveGrid>
            )}
          </div>
        </ResponsiveContainer>
      </ErrorBoundary>
    )
  }

  // Main content management view
  return (
    <ErrorBoundary>
      <SEOMetadata
        title="Dynamic Content Management"
        description="Create and manage dynamic content with our powerful drag-and-drop editor. Build marketing pages, news articles, and interactive content."
        keywords={['content management', 'CMS', 'drag and drop', 'dynamic content', 'marketing', 'editor']}
      />
      
      <ResponsiveContainer maxWidth="full" padding="lg">
        <div className="space-y-6">
                 {/* Notification */}
                 {notification && (
                   <div className={`notification ${
                     notification.type === 'success'
                       ? 'notification-success'
                       : 'notification-error'
                   }`}>
                     <div className="flex items-center space-x-2">
                       {notification.type === 'success' ? (
                         <CheckCircleIcon className="h-5 w-5" />
                       ) : (
                         <ExclamationTriangleIcon className="h-5 w-5" />
                       )}
                       <span className="font-medium">{notification.message}</span>
                     </div>
                   </div>
                 )}

                 {/* Error Display */}
                 {error && (
                   <div className="notification notification-error">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-2">
                         <ExclamationTriangleIcon className="h-5 w-5" />
                         <span className="font-medium">{error}</span>
                       </div>
                       <button
                         onClick={clearError}
                         className="text-white hover:text-gray-200"
                       >
                         <XMarkIcon className="h-4 w-4" />
                       </button>
                     </div>
                   </div>
                 )}

                 {/* Saving Indicator */}
                 {saving && (
                   <div className="notification notification-warning">
                     <div className="flex items-center space-x-2">
                       <ArrowPathIcon className="h-5 w-5 animate-spin" />
                       <span className="font-medium">Saving changes...</span>
                     </div>
                   </div>
                 )}

                 {/* Last Saved Indicator */}
                 {lastSaved && !saving && (
                   <div className="notification notification-success">
                     <div className="flex items-center space-x-2">
                       <CheckCircleIcon className="h-5 w-5" />
                       <span className="font-medium">Last saved: {lastSaved.toLocaleTimeString()}</span>
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
              gap="lg"
            >
              <div>
                <ResponsiveText
                  size={{ default: 'xl', md: '2xl' }}
                  weight="bold"
                  color="gray"
                  className="mb-2"
                >
                  <DocumentTextIcon className="h-6 w-6 inline mr-2" />
                  Dynamic Content Management
                </ResponsiveText>
                <ResponsiveText
                  size={{ default: 'sm', md: 'base' }}
                  color="gray"
                >
                  Create and manage dynamic content with drag-and-drop editor
                </ResponsiveText>
              </div>
              <ResponsiveFlex
                direction="col"
                responsiveDirection={{ sm: 'row' }}
                gap="sm"
                className="w-full md:w-auto"
              >
                <button
                  onClick={() => setShowTemplates(true)}
                  className="content-button content-button-secondary w-full md:w-auto"
                  aria-label={ARIA_LABELS.CREATE_CONTENT}
                >
                  <RectangleStackIcon className="h-4 w-4 mr-2" />
                  Templates
                </button>
                <button
                  onClick={handleCreateNew}
                  className="content-button content-button-primary w-full md:w-auto"
                  aria-label={ARIA_LABELS.CREATE_CONTENT}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Content
                </button>
              </ResponsiveFlex>
            </ResponsiveFlex>
          </div>

          {/* Search and Filters */}
          <div className="content-card">
            <ResponsiveFlex
              direction="col"
              responsiveDirection={{ sm: 'row' }}
              gap="md"
              align="stretch"
            >
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content pages..."
                  value={filters.search}
                  onChange={(e) => setFilters({ search: e.target.value })}
                  className="content-input pl-10"
                  aria-label={ARIA_LABELS.SEARCH_CONTENT}
                />
              </div>
              
              <ResponsiveFlex
                direction="col"
                responsiveDirection={{ sm: 'row' }}
                gap="sm"
                className="w-full sm:w-auto"
              >
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ type: e.target.value })}
                  className="content-input w-full sm:w-48"
                  aria-label={ARIA_LABELS.FILTER_BY_TYPE}
                >
                  <option value="all">All Types</option>
                  <option value="marketing">Marketing</option>
                  <option value="news">News/Inspiration</option>
                  <option value="popup">Popup</option>
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ status: e.target.value })}
                  className="content-input w-full sm:w-48"
                  aria-label={ARIA_LABELS.FILTER_BY_STATUS}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </ResponsiveFlex>
            </ResponsiveFlex>
          </div>

        {/* Content Pages List */}
        <div className="content-card">
          {loading ? (
            <ContentListSkeleton count={5} />
          ) : error ? (
            <ErrorState
              title="Failed to load content"
              description="We couldn't load your content pages. Please try again."
              error={error}
              onRetry={handleRetry}
            />
          ) : filteredPages.length === 0 ? (
            <EmptyState
              icon={DocumentTextIcon}
              title="No content pages found"
              description="Create your first dynamic content page to get started!"
              action={{
                label: "Create Content",
                onClick: handleCreateNew
              }}
            />
          ) : (
            <div className="space-y-4" role="list" aria-label="Content pages list">
              {filteredPages.map((page) => (
                <ContentPageItem
                  key={page.id}
                  page={page}
                  onEdit={handleEdit}
                  onDelete={(id) => setShowDeleteConfirm(id)}
                  onView={(page) => {
                    // TODO: Implement preview functionality
                    console.log('Preview page:', page)
                  }}
                  isSelected={selectedPage?.id === page.id}
                  onSelect={setSelectedPage}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Content</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this content page? This action cannot be undone.
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
                  className="content-button content-button-primary"
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
