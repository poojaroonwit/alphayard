'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  RectangleStackIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { ContentTemplate, ContentComponent } from '../../types/content'

// Enhanced Template Interface
export interface EnhancedContentTemplate extends ContentTemplate {
  category: string
  tags: string[]
  isPublic: boolean
  isFeatured: boolean
  previewImage?: string
  previewVideo?: string
  author: string
  authorName?: string
  downloads: number
  rating: number
  ratingCount: number
  compatibility: {
    web: boolean
    mobile: boolean
    tablet: boolean
  }
  requirements?: {
    minComponents?: number
    maxComponents?: number
    requiredComponents?: string[]
  }
  customization: {
    colors: string[]
    fonts: string[]
    layouts: string[]
  }
  metadata: {
    lastUpdated: string
    version: string
    size: number
    complexity: 'beginner' | 'intermediate' | 'advanced'
    estimatedTime: string
  }
}

// Template Category Interface
export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: any
  color: string
  count: number
}

// Content Templates Component
interface ContentTemplatesProps {
  onUseTemplate: (template: EnhancedContentTemplate) => void
  onEditTemplate?: (template: EnhancedContentTemplate) => void
  onDeleteTemplate?: (templateId: string) => void
  onDuplicateTemplate?: (template: EnhancedContentTemplate) => void
  onImportTemplate?: (file: File) => void
  onExportTemplate?: (template: EnhancedContentTemplate) => void
  className?: string
}

export const ContentTemplates: React.FC<ContentTemplatesProps> = ({
  onUseTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onImportTemplate,
  onExportTemplate,
  className = ''
}) => {
  // State management
  const [templates, setTemplates] = useState<EnhancedContentTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating' | 'downloads'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    complexity: 'all',
    compatibility: 'all',
    isPublic: 'all',
    isFeatured: false
  })
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedContentTemplate | null>(null)

  // Load templates and categories
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual API calls
      const mockCategories: TemplateCategory[] = [
        {
          id: 'marketing',
          name: 'Marketing',
          description: 'Templates for marketing campaigns and promotions',
          icon: GlobeAltIcon,
          color: 'blue',
          count: 12
        },
        {
          id: 'news',
          name: 'News & Articles',
          description: 'Templates for news articles and blog posts',
          icon: DocumentTextIcon,
          color: 'green',
          count: 8
        },
        {
          id: 'inspiration',
          name: 'Inspiration',
          description: 'Templates for inspirational and motivational content',
          icon: PhotoIcon,
          color: 'purple',
          count: 6
        },
        {
          id: 'popup',
          name: 'Popups & Modals',
          description: 'Templates for popup notifications and modals',
          icon: ShareIcon,
          color: 'orange',
          count: 4
        },
        {
          id: 'landing',
          name: 'Landing Pages',
          description: 'Templates for landing pages and conversions',
          icon: ComputerDesktopIcon,
          color: 'red',
          count: 10
        },
        {
          id: 'social',
          name: 'Social Media',
          description: 'Templates for social media posts and campaigns',
          icon: ShareIcon,
          color: 'pink',
          count: 15
        }
      ]
      
      const mockTemplates: EnhancedContentTemplate[] = [
        {
          id: 't1',
          name: 'Hero Marketing Banner',
          description: 'Eye-catching hero banner for marketing campaigns',
          type: 'marketing',
          category: 'marketing',
          tags: ['hero', 'banner', 'marketing', 'cta'],
          isPublic: true,
          isFeatured: true,
          previewImage: '/templates/hero-banner.jpg',
          author: 'user1',
          authorName: 'John Doe',
          downloads: 1250,
          rating: 4.8,
          ratingCount: 89,
          compatibility: {
            web: true,
            mobile: true,
            tablet: true
          },
          requirements: {
            minComponents: 3,
            maxComponents: 8
          },
          customization: {
            colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'],
            fonts: ['Inter', 'Roboto', 'Open Sans'],
            layouts: ['centered', 'left-aligned', 'right-aligned']
          },
          metadata: {
            lastUpdated: new Date(Date.now() - 86400000 * 7).toISOString(),
            version: '2.1.0',
            size: 2048,
            complexity: 'beginner',
            estimatedTime: '5-10 minutes'
          },
          components: [
            {
              id: 'comp1',
              type: 'heading',
              props: {
                content: 'Welcome to Our Platform',
                level: 'h1',
                fontSize: 48,
                color: '#1F2937',
                alignment: 'center'
              },
              order: 0,
              style: {
                marginBottom: '1rem'
              }
            },
            {
              id: 'comp2',
              type: 'text',
              props: {
                content: 'Discover amazing features and transform your workflow with our powerful tools.',
                fontSize: 18,
                color: '#6B7280',
                alignment: 'center'
              },
              order: 1,
              style: {
                marginBottom: '2rem'
              }
            },
            {
              id: 'comp3',
              type: 'button',
              props: {
                text: 'Get Started',
                variant: 'primary',
                size: 'lg',
                alignment: 'center'
              },
              order: 2,
              style: {
                marginBottom: '1rem'
              }
            }
          ],
          preview: 'Hero banner with title, description, and call-to-action button',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 7).toISOString()
        },
        {
          id: 't2',
          name: 'News Article Layout',
          description: 'Clean and professional layout for news articles',
          type: 'news',
          category: 'news',
          tags: ['article', 'news', 'blog', 'content'],
          isPublic: true,
          isFeatured: false,
          previewImage: '/templates/news-article.jpg',
          author: 'user2',
          authorName: 'Jane Smith',
          downloads: 890,
          rating: 4.6,
          ratingCount: 67,
          compatibility: {
            web: true,
            mobile: true,
            tablet: true
          },
          requirements: {
            minComponents: 5,
            maxComponents: 15
          },
          customization: {
            colors: ['#1F2937', '#6B7280', '#3B82F6'],
            fonts: ['Georgia', 'Times New Roman', 'Merriweather'],
            layouts: ['single-column', 'two-column', 'magazine']
          },
          metadata: {
            lastUpdated: new Date(Date.now() - 86400000 * 14).toISOString(),
            version: '1.5.0',
            size: 1536,
            complexity: 'intermediate',
            estimatedTime: '10-15 minutes'
          },
          components: [
            {
              id: 'comp1',
              type: 'heading',
              props: {
                content: 'Article Title',
                level: 'h1',
                fontSize: 32,
                color: '#1F2937',
                alignment: 'left'
              },
              order: 0,
              style: {
                marginBottom: '1rem'
              }
            },
            {
              id: 'comp2',
              type: 'text',
              props: {
                content: 'Article excerpt or summary...',
                fontSize: 16,
                color: '#6B7280',
                alignment: 'left'
              },
              order: 1,
              style: {
                marginBottom: '1.5rem'
              }
            },
            {
              id: 'comp3',
              type: 'image',
              props: {
                src: '/placeholder-image.jpg',
                alt: 'Article image',
                alignment: 'center'
              },
              order: 2,
              style: {
                marginBottom: '1.5rem'
              }
            },
            {
              id: 'comp4',
              type: 'text',
              props: {
                content: 'Article content goes here...',
                fontSize: 16,
                color: '#374151',
                alignment: 'left'
              },
              order: 3,
              style: {
                lineHeight: 1.6
              }
            }
          ],
          preview: 'Professional news article layout with title, excerpt, image, and content',
          createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 14).toISOString()
        }
      ]
      
      setCategories(mockCategories)
      setTemplates(mockTemplates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesSearch = searchTerm === '' ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesComplexity = filters.complexity === 'all' || template.metadata.complexity === filters.complexity
      const matchesCompatibility = filters.compatibility === 'all' ||
        (filters.compatibility === 'web' && template.compatibility.web) ||
        (filters.compatibility === 'mobile' && template.compatibility.mobile) ||
        (filters.compatibility === 'tablet' && template.compatibility.tablet)
      
      const matchesPublic = filters.isPublic === 'all' ||
        (filters.isPublic === 'public' && template.isPublic) ||
        (filters.isPublic === 'private' && !template.isPublic)
      
      const matchesFeatured = !filters.isFeatured || template.isFeatured
      
      return matchesCategory && matchesSearch && matchesComplexity && 
             matchesCompatibility && matchesPublic && matchesFeatured
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
        case 'downloads':
          comparison = a.downloads - b.downloads
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className={`content-templates ${className}`}>
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading templates...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`content-templates ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load templates</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="content-button content-button-primary"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`content-templates ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Content Templates</h3>
          <p className="text-sm text-gray-500">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="content-button content-button-secondary"
            aria-label="Import template"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="content-button content-button-primary"
            aria-label="Create new template"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({templates.length})
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <category.icon className="h-4 w-4" />
              <span>{category.name} ({category.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="content-input pl-10 w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label="Grid view"
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label="List view"
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="content-button content-button-secondary"
          aria-label="Toggle filters"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>
        
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('-')
            setSortBy(newSortBy as any)
            setSortOrder(newSortOrder as any)
          }}
          className="content-input w-48"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="rating-desc">Highest rated</option>
          <option value="downloads-desc">Most downloaded</option>
        </select>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complexity
              </label>
              <select
                value={filters.complexity}
                onChange={(e) => setFilters(prev => ({ ...prev, complexity: e.target.value }))}
                className="content-input w-full"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compatibility
              </label>
              <select
                value={filters.compatibility}
                onChange={(e) => setFilters(prev => ({ ...prev, compatibility: e.target.value }))}
                className="content-input w-full"
              >
                <option value="all">All Platforms</option>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                value={filters.isPublic}
                onChange={(e) => setFilters(prev => ({ ...prev, isPublic: e.target.value }))}
                className="content-input w-full"
              >
                <option value="all">All Templates</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.isFeatured}
                  onChange={(e) => setFilters(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Featured only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8">
          <RectangleStackIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first template to get started'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode={viewMode}
              onUse={() => onUseTemplate(template)}
              onPreview={() => {
                setSelectedTemplate(template)
                setShowPreviewModal(true)
              }}
              onEdit={onEditTemplate ? () => onEditTemplate(template) : undefined}
              onDelete={onDeleteTemplate ? () => onDeleteTemplate(template.id) : undefined}
              onDuplicate={onDuplicateTemplate ? () => onDuplicateTemplate(template) : undefined}
              onExport={onExportTemplate ? () => onExportTemplate(template) : undefined}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="flex items-center space-x-3 mb-4">
              <EyeIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Template Preview</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  {selectedTemplate.previewImage ? (
                    <img
                      src={selectedTemplate.previewImage}
                      alt={selectedTemplate.name}
                      className="max-w-full max-h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <RectangleStackIcon className="h-12 w-12 mx-auto mb-2" />
                      <p>Preview Image</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="h-3 w-3" />
                      <span>{selectedTemplate.rating} ({selectedTemplate.ratingCount})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ArrowDownTrayIcon className="h-3 w-3" />
                      <span>{selectedTemplate.downloads}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-3 w-3" />
                      <span>{selectedTemplate.authorName}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Template Details</h5>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-sm text-gray-600">{selectedTemplate.category}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Complexity:</span>
                    <span className="ml-2 text-sm text-gray-600 capitalize">{selectedTemplate.metadata.complexity}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Estimated Time:</span>
                    <span className="ml-2 text-sm text-gray-600">{selectedTemplate.metadata.estimatedTime}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Components:</span>
                    <span className="ml-2 text-sm text-gray-600">{selectedTemplate.components.length}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Compatibility:</span>
                    <div className="ml-2 flex items-center space-x-2">
                      {selectedTemplate.compatibility.web && (
                        <ComputerDesktopIcon className="h-4 w-4 text-green-600" title="Web" />
                      )}
                      {selectedTemplate.compatibility.mobile && (
                        <DevicePhoneMobileIcon className="h-4 w-4 text-green-600" title="Mobile" />
                      )}
                      {selectedTemplate.compatibility.tablet && (
                        <DeviceTabletIcon className="h-4 w-4 text-green-600" title="Tablet" />
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tags:</span>
                    <div className="ml-2 flex flex-wrap gap-1">
                      {selectedTemplate.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => {
                      onUseTemplate(selectedTemplate)
                      setShowPreviewModal(false)
                    }}
                    className="content-button content-button-primary flex-1"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="content-button content-button-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Template Card Component
interface TemplateCardProps {
  template: EnhancedContentTemplate
  viewMode: 'grid' | 'list'
  onUse: () => void
  onPreview: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onExport?: () => void
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  viewMode,
  onUse,
  onPreview,
  onEdit,
  onDelete,
  onDuplicate,
  onExport
}) => {
  if (viewMode === 'list') {
    return (
      <div className="template-card-list">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            {template.previewImage ? (
              <img
                src={template.previewImage}
                alt={template.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <RectangleStackIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              {template.isFeatured && (
                <StarIcon className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <p className="text-sm text-gray-600">{template.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
              <div className="flex items-center space-x-1">
                <StarIcon className="h-3 w-3" />
                <span>{template.rating} ({template.ratingCount})</span>
              </div>
              <div className="flex items-center space-x-1">
                <ArrowDownTrayIcon className="h-3 w-3" />
                <span>{template.downloads}</span>
              </div>
              <div className="flex items-center space-x-1">
                <UserIcon className="h-3 w-3" />
                <span>{template.authorName}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onPreview}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Preview"
              aria-label="Preview template"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onUse}
              className="content-button content-button-primary"
            >
              Use Template
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="template-card-grid">
      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
        {template.previewImage ? (
          <img
            src={template.previewImage}
            alt={template.name}
            className="max-w-full max-h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-center text-gray-500">
            <RectangleStackIcon className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Preview</p>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900">{template.name}</h4>
            {template.isFeatured && (
              <StarIcon className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onPreview}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Preview"
              aria-label="Preview template"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                title="Edit"
                aria-label="Edit template"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                title="Duplicate"
                aria-label="Duplicate template"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                title="Export"
                aria-label="Export template"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
                aria-label="Delete template"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
        
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <StarIcon className="h-3 w-3" />
            <span>{template.rating}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowDownTrayIcon className="h-3 w-3" />
            <span>{template.downloads}</span>
          </div>
          <div className="flex items-center space-x-1">
            <UserIcon className="h-3 w-3" />
            <span>{template.authorName}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {template.compatibility.web && (
              <ComputerDesktopIcon className="h-4 w-4 text-green-600" title="Web" />
            )}
            {template.compatibility.mobile && (
              <DevicePhoneMobileIcon className="h-4 w-4 text-green-600" title="Mobile" />
            )}
            {template.compatibility.tablet && (
              <DeviceTabletIcon className="h-4 w-4 text-green-600" title="Tablet" />
            )}
          </div>
          <button
            onClick={onUse}
            className="content-button content-button-primary text-sm"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  )
}

// Template Styles
export const templateStyles = `
.content-templates {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.template-card-grid {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
  background: white;
}

.template-card-grid:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.template-card-list {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
  background: white;
}

.template-card-list:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.content-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.content-button-primary {
  background: #3b82f6;
  color: white;
}

.content-button-primary:hover {
  background: #2563eb;
}

.content-button-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.content-button-secondary:hover {
  background: #e5e7eb;
}

.content-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.content-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`

