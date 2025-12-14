'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  TableCellsIcon,
  ListBulletIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  CursorArrowRaysIcon,
  Square3Stack3DIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  XMarkIcon,
  ArrowDownTrayIcon as SaveIcon
} from '@heroicons/react/24/outline'

// Content Type Schema Interface
export interface ContentTypeSchema {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  isActive: boolean
  isBuiltIn: boolean
  version: string
  createdAt: string
  updatedAt: string
  createdBy: string
  createdByName?: string
  fields: ContentTypeField[]
  validation: ContentTypeValidation
  display: ContentTypeDisplay
  metadata: {
    tags: string[]
    complexity: 'simple' | 'intermediate' | 'advanced'
    estimatedTime: string
    useCases: string[]
  }
}

// Content Type Field Interface
export interface ContentTypeField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'datetime' | 'file' | 'image' | 'video' | 'audio' | 'url' | 'email' | 'color' | 'json' | 'richtext'
  required: boolean
  defaultValue?: any
  placeholder?: string
  description?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: string
  }
  options?: Array<{ value: string; label: string }>
  conditional?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains'
    value: any
  }
  display: {
    order: number
    group?: string
    width?: 'full' | 'half' | 'third' | 'quarter'
    hidden?: boolean
  }
}

// Content Type Validation Interface
export interface ContentTypeValidation {
  rules: Array<{
    field: string
    rule: 'required' | 'min' | 'max' | 'pattern' | 'custom'
    value?: any
    message: string
  }>
  customValidators?: Array<{
    name: string
    function: string
    message: string
  }>
}

// Content Type Display Interface
export interface ContentTypeDisplay {
  layout: 'single' | 'two-column' | 'three-column' | 'tabs' | 'accordion'
  groups: Array<{
    id: string
    name: string
    description?: string
    fields: string[]
    collapsible?: boolean
    defaultCollapsed?: boolean
  }>
  preview: {
    template: string
    styles?: string
  }
}

// Content Types Component
interface ContentTypesProps {
  onTypeSelect?: (type: ContentTypeSchema) => void
  onTypeCreate?: (type: ContentTypeSchema) => void
  onTypeUpdate?: (typeId: string, updates: Partial<ContentTypeSchema>) => void
  onTypeDelete?: (typeId: string) => void
  onTypeDuplicate?: (type: ContentTypeSchema) => void
  className?: string
}

export const ContentTypes: React.FC<ContentTypesProps> = ({
  onTypeSelect,
  onTypeCreate,
  onTypeUpdate,
  onTypeDelete,
  onTypeDuplicate,
  className = ''
}) => {
  // State management
  const [types, setTypes] = useState<ContentTypeSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<ContentTypeSchema | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterComplexity, setFilterComplexity] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'usage'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<ContentTypeSchema>>({
    name: '',
    description: '',
    category: 'content',
    icon: 'DocumentTextIcon',
    color: 'blue',
    isActive: true,
    fields: [],
    validation: { rules: [] },
    display: {
      layout: 'single',
      groups: [],
      preview: { template: '' }
    },
    metadata: {
      tags: [],
      complexity: 'simple',
      estimatedTime: '5-10 minutes',
      useCases: []
    }
  })

  // Load content types
  const loadTypes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual API call
      const mockTypes: ContentTypeSchema[] = [
        {
          id: 'ct1',
          name: 'Article',
          description: 'Standard article content type with title, content, and metadata',
          category: 'content',
          icon: 'DocumentTextIcon',
          color: 'blue',
          isActive: true,
          isBuiltIn: true,
          version: '1.0.0',
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          createdBy: 'system',
          createdByName: 'System',
          fields: [
            {
              id: 'title',
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
              placeholder: 'Enter article title',
              description: 'The main title of the article',
              display: { order: 1, width: 'full' }
            },
            {
              id: 'content',
              name: 'content',
              label: 'Content',
              type: 'richtext',
              required: true,
              description: 'The main content of the article',
              display: { order: 2, width: 'full' }
            },
            {
              id: 'excerpt',
              name: 'excerpt',
              label: 'Excerpt',
              type: 'textarea',
              required: false,
              placeholder: 'Brief description of the article',
              description: 'Short summary for previews and listings',
              display: { order: 3, width: 'full' }
            },
            {
              id: 'featured_image',
              name: 'featured_image',
              label: 'Featured Image',
              type: 'image',
              required: false,
              description: 'Main image for the article',
              display: { order: 4, width: 'half' }
            },
            {
              id: 'category',
              name: 'category',
              label: 'Category',
              type: 'select',
              required: true,
              options: [
                { value: 'news', label: 'News' },
                { value: 'tutorial', label: 'Tutorial' },
                { value: 'review', label: 'Review' },
                { value: 'opinion', label: 'Opinion' }
              ],
              display: { order: 5, width: 'half' }
            },
            {
              id: 'tags',
              name: 'tags',
              label: 'Tags',
              type: 'multiselect',
              required: false,
              options: [
                { value: 'technology', label: 'Technology' },
                { value: 'business', label: 'Business' },
                { value: 'design', label: 'Design' },
                { value: 'development', label: 'Development' }
              ],
              display: { order: 6, width: 'full' }
            },
            {
              id: 'published',
              name: 'published',
              label: 'Published',
              type: 'boolean',
              required: false,
              defaultValue: false,
              display: { order: 7, width: 'half' }
            },
            {
              id: 'publish_date',
              name: 'publish_date',
              label: 'Publish Date',
              type: 'datetime',
              required: false,
              conditional: {
                field: 'published',
                operator: 'equals',
                value: true
              },
              display: { order: 8, width: 'half' }
            }
          ],
          validation: {
            rules: [
              {
                field: 'title',
                rule: 'required',
                message: 'Title is required'
              },
              {
                field: 'title',
                rule: 'min',
                value: 5,
                message: 'Title must be at least 5 characters'
              },
              {
                field: 'content',
                rule: 'required',
                message: 'Content is required'
              }
            ]
          },
          display: {
            layout: 'single',
            groups: [
              {
                id: 'basic',
                name: 'Basic Information',
                fields: ['title', 'excerpt', 'featured_image']
              },
              {
                id: 'content',
                name: 'Content',
                fields: ['content']
              },
              {
                id: 'metadata',
                name: 'Metadata',
                fields: ['category', 'tags', 'published', 'publish_date']
              }
            ],
            preview: {
              template: `
                <div class="article-preview">
                  <h1>{{title}}</h1>
                  <div class="meta">
                    <span class="category">{{category}}</span>
                    <span class="date">{{publish_date}}</span>
                  </div>
                  <div class="excerpt">{{excerpt}}</div>
                  <div class="content">{{content}}</div>
                </div>
              `
            }
          },
          metadata: {
            tags: ['content', 'article', 'blog'],
            complexity: 'simple',
            estimatedTime: '5-10 minutes',
            useCases: ['Blog posts', 'News articles', 'Tutorials', 'Reviews']
          }
        },
        {
          id: 'ct2',
          name: 'Product',
          description: 'Product information with pricing, images, and specifications',
          category: 'ecommerce',
          icon: 'PhotoIcon',
          color: 'green',
          isActive: true,
          isBuiltIn: false,
          version: '1.2.0',
          createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          createdBy: 'user1',
          createdByName: 'John Doe',
          fields: [
            {
              id: 'name',
              name: 'name',
              label: 'Product Name',
              type: 'text',
              required: true,
              display: { order: 1, width: 'full' }
            },
            {
              id: 'description',
              name: 'description',
              label: 'Description',
              type: 'richtext',
              required: true,
              display: { order: 2, width: 'full' }
            },
            {
              id: 'price',
              name: 'price',
              label: 'Price',
              type: 'number',
              required: true,
              validation: { min: 0 },
              display: { order: 3, width: 'half' }
            },
            {
              id: 'currency',
              name: 'currency',
              label: 'Currency',
              type: 'select',
              required: true,
              defaultValue: 'USD',
              options: [
                { value: 'USD', label: 'USD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' }
              ],
              display: { order: 4, width: 'half' }
            },
            {
              id: 'images',
              name: 'images',
              label: 'Product Images',
              type: 'image',
              required: false,
              display: { order: 5, width: 'full' }
            },
            {
              id: 'in_stock',
              name: 'in_stock',
              label: 'In Stock',
              type: 'boolean',
              required: false,
              defaultValue: true,
              display: { order: 6, width: 'half' }
            },
            {
              id: 'stock_quantity',
              name: 'stock_quantity',
              label: 'Stock Quantity',
              type: 'number',
              required: false,
              validation: { min: 0 },
              conditional: {
                field: 'in_stock',
                operator: 'equals',
                value: true
              },
              display: { order: 7, width: 'half' }
            }
          ],
          validation: {
            rules: [
              {
                field: 'name',
                rule: 'required',
                message: 'Product name is required'
              },
              {
                field: 'price',
                rule: 'required',
                message: 'Price is required'
              },
              {
                field: 'price',
                rule: 'min',
                value: 0,
                message: 'Price must be greater than 0'
              }
            ]
          },
          display: {
            layout: 'two-column',
            groups: [
              {
                id: 'basic',
                name: 'Basic Information',
                fields: ['name', 'description']
              },
              {
                id: 'pricing',
                name: 'Pricing',
                fields: ['price', 'currency']
              },
              {
                id: 'inventory',
                name: 'Inventory',
                fields: ['in_stock', 'stock_quantity']
              },
              {
                id: 'media',
                name: 'Media',
                fields: ['images']
              }
            ],
            preview: {
              template: `
                <div class="product-preview">
                  <img src="{{images}}" alt="{{name}}" />
                  <h2>{{name}}</h2>
                  <p class="price">{{currency}} {{price}}</p>
                  <div class="description">{{description}}</div>
                  <div class="stock">{{#if in_stock}}In Stock{{else}}Out of Stock{{/if}}</div>
                </div>
              `
            }
          },
          metadata: {
            tags: ['ecommerce', 'product', 'catalog'],
            complexity: 'intermediate',
            estimatedTime: '10-15 minutes',
            useCases: ['Product catalogs', 'E-commerce sites', 'Inventory management']
          }
        }
      ]
      
      setTypes(mockTypes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content types')
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter and sort types
  const filteredTypes = types
    .filter(type => {
      const matchesSearch = searchTerm === '' ||
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = filterCategory === 'all' || type.category === filterCategory
      const matchesComplexity = filterComplexity === 'all' || type.metadata.complexity === filterComplexity
      
      return matchesSearch && matchesCategory && matchesComplexity
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
        case 'usage':
          // TODO: Implement usage tracking
          comparison = 0
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Load types on mount
  useEffect(() => {
    loadTypes()
  }, [loadTypes])

  if (loading) {
    return (
      <div className={`content-types ${className}`}>
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading content types...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`content-types ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load content types</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadTypes}
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
    <div className={`content-types ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Content Types</h3>
          <p className="text-sm text-gray-500">
            {filteredTypes.length} content type{filteredTypes.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="content-button content-button-primary"
          aria-label="Create new content type"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Type
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search content types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="content-input pl-10 w-full"
            />
          </div>
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="content-input w-48"
        >
          <option value="all">All Categories</option>
          <option value="content">Content</option>
          <option value="ecommerce">E-commerce</option>
          <option value="marketing">Marketing</option>
          <option value="media">Media</option>
        </select>
        
        <select
          value={filterComplexity}
          onChange={(e) => setFilterComplexity(e.target.value)}
          className="content-input w-48"
        >
          <option value="all">All Complexity</option>
          <option value="simple">Simple</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('-')
            setSortBy(newSortBy as any)
            setSortOrder(newSortOrder as any)
          }}
          className="content-input w-48"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="usage-desc">Most used</option>
        </select>
      </div>

      {/* Content Types Grid */}
      {filteredTypes.length === 0 ? (
        <div className="text-center py-8">
          <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content types found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first content type to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTypes.map((type) => (
            <ContentTypeCard
              key={type.id}
              type={type}
              onSelect={() => {
                setSelectedType(type)
                onTypeSelect?.(type)
              }}
              onEdit={() => {
                setSelectedType(type)
                setFormData(type)
                setShowEditModal(true)
              }}
              onDelete={onTypeDelete ? () => onTypeDelete(type.id) : undefined}
              onDuplicate={onTypeDuplicate ? () => onTypeDuplicate(type) : undefined}
              onPreview={() => {
                setSelectedType(type)
                setShowPreviewModal(true)
              }}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="flex items-center space-x-3 mb-4">
              <CogIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {showCreateModal ? 'Create Content Type' : 'Edit Content Type'}
              </h3>
            </div>
            
            <ContentTypeForm
              data={formData}
              onChange={setFormData}
              onSubmit={async (data) => {
                try {
                  if (showCreateModal) {
                    await onTypeCreate?.(data as ContentTypeSchema)
                  } else {
                    await onTypeUpdate?.(selectedType!.id, data)
                  }
                  setShowCreateModal(false)
                  setShowEditModal(false)
                  setFormData({})
                  loadTypes()
                } catch (error) {
                  console.error('Failed to save content type:', error)
                }
              }}
              onCancel={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
                setFormData({})
              }}
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedType && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="flex items-center space-x-3 mb-4">
              <EyeIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Content Type Preview</h3>
            </div>
            
            <ContentTypePreview type={selectedType} />
            
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="content-button content-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Content Type Card Component
interface ContentTypeCardProps {
  type: ContentTypeSchema
  onSelect: () => void
  onEdit: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onPreview: () => void
}

const ContentTypeCard: React.FC<ContentTypeCardProps> = ({
  type,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview
}) => {
  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      DocumentTextIcon,
      PhotoIcon,
      VideoCameraIcon,
      SpeakerWaveIcon,
      TableCellsIcon,
      ListBulletIcon,
      CodeBracketIcon,
      ChatBubbleLeftRightIcon,
      LinkIcon,
      CursorArrowRaysIcon,
      Square3Stack3DIcon
    }
    return icons[iconName] || DocumentTextIcon
  }

  const IconComponent = getIcon(type.icon)

  return (
    <div className="content-type-card">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-lg bg-${type.color}-100`}>
          <IconComponent className={`h-6 w-6 text-${type.color}-600`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900">{type.name}</h4>
            {type.isBuiltIn && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Built-in
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{type.description}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Fields: {type.fields.length}</span>
          <span>v{type.version}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="capitalize">{type.metadata.complexity}</span>
          <span>{type.metadata.estimatedTime}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {type.metadata.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          >
            <TagIcon className="h-3 w-3 mr-1" />
            {tag}
          </span>
        ))}
        {type.metadata.tags.length > 3 && (
          <span className="text-xs text-gray-500">+{type.metadata.tags.length - 3} more</span>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onPreview}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Preview"
          aria-label="Preview content type"
        >
          <EyeIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title="Edit"
          aria-label="Edit content type"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Duplicate"
            aria-label="Duplicate content type"
          >
            <DocumentTextIcon className="h-4 w-4" />
          </button>
        )}
        {onDelete && !type.isBuiltIn && (
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
            aria-label="Delete content type"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onSelect}
          className="content-button content-button-primary flex-1"
        >
          Use Type
        </button>
      </div>
    </div>
  )
}

// Content Type Form Component
interface ContentTypeFormProps {
  data: Partial<ContentTypeSchema>
  onChange: (data: Partial<ContentTypeSchema>) => void
  onSubmit: (data: Partial<ContentTypeSchema>) => void
  onCancel: () => void
}

const ContentTypeForm: React.FC<ContentTypeFormProps> = ({
  data,
  onChange,
  onSubmit,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'fields' | 'validation' | 'display'>('basic')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'fields', label: 'Fields' },
            { id: 'validation', label: 'Validation' },
            { id: 'display', label: 'Display' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={data.name || ''}
                onChange={(e) => onChange({ ...data, name: e.target.value })}
                className="content-input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={data.category || 'content'}
                onChange={(e) => onChange({ ...data, category: e.target.value })}
                className="content-input w-full"
              >
                <option value="content">Content</option>
                <option value="ecommerce">E-commerce</option>
                <option value="marketing">Marketing</option>
                <option value="media">Media</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={data.description || ''}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
              className="content-input w-full"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <select
                value={data.icon || 'DocumentTextIcon'}
                onChange={(e) => onChange({ ...data, icon: e.target.value })}
                className="content-input w-full"
              >
                <option value="DocumentTextIcon">Document</option>
                <option value="PhotoIcon">Photo</option>
                <option value="VideoCameraIcon">Video</option>
                <option value="SpeakerWaveIcon">Audio</option>
                <option value="TableCellsIcon">Table</option>
                <option value="ListBulletIcon">List</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <select
                value={data.color || 'blue'}
                onChange={(e) => onChange({ ...data, color: e.target.value })}
                className="content-input w-full"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="red">Red</option>
                <option value="yellow">Yellow</option>
                <option value="gray">Gray</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complexity
              </label>
              <select
                value={data.metadata?.complexity || 'simple'}
                onChange={(e) => onChange({ 
                  ...data, 
                  metadata: { ...data.metadata, complexity: e.target.value as any } as any
                })}
                className="content-input w-full"
              >
                <option value="simple">Simple</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fields' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Fields</h4>
            <button
              type="button"
              className="content-button content-button-secondary"
              onClick={() => {
                const newField: ContentTypeField = {
                  id: `field_${Date.now()}`,
                  name: '',
                  label: '',
                  type: 'text',
                  required: false,
                  display: { order: (data.fields?.length || 0) + 1, width: 'full' }
                }
                onChange({
                  ...data,
                  fields: [...(data.fields || []), newField]
                })
              }}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Field
            </button>
          </div>
          
          <div className="space-y-3">
            {data.fields?.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Name
                    </label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        const newFields = [...(data.fields || [])]
                        newFields[index] = { ...field, name: e.target.value }
                        onChange({ ...data, fields: newFields })
                      }}
                      className="content-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const newFields = [...(data.fields || [])]
                        newFields[index] = { ...field, type: e.target.value as any }
                        onChange({ ...data, fields: newFields })
                      }}
                      className="content-input w-full"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="select">Select</option>
                      <option value="multiselect">Multi-select</option>
                      <option value="date">Date</option>
                      <option value="datetime">DateTime</option>
                      <option value="file">File</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="url">URL</option>
                      <option value="email">Email</option>
                      <option value="color">Color</option>
                      <option value="json">JSON</option>
                      <option value="richtext">Rich Text</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => {
                        const newFields = [...(data.fields || [])]
                        newFields[index] = { ...field, required: e.target.checked }
                        onChange({ ...data, fields: newFields })
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newFields = (data.fields || []).filter((_, i) => i !== index)
                      onChange({ ...data, fields: newFields })
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex space-x-3 justify-end pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="content-button content-button-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="content-button content-button-primary"
        >
          <SaveIcon className="h-4 w-4 mr-2" />
          Save Content Type
        </button>
      </div>
    </form>
  )
}

// Content Type Preview Component
interface ContentTypePreviewProps {
  type: ContentTypeSchema
}

const ContentTypePreview: React.FC<ContentTypePreviewProps> = ({ type }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Form Preview</h4>
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            {type.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label || field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="content-input w-full"
                    disabled
                  />
                )}
                {field.type === 'textarea' && (
                  <textarea
                    placeholder={field.placeholder}
                    className="content-input w-full"
                    rows={3}
                    disabled
                  />
                )}
                {field.type === 'select' && (
                  <select className="content-input w-full" disabled>
                    <option>Select an option</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === 'boolean' && (
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" disabled />
                    <span className="text-sm text-gray-700">{field.label}</span>
                  </label>
                )}
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Content Preview</h4>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500">
              Preview template would be rendered here
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Content Types Styles
export const contentTypesStyles = `
.content-types {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.content-type-card {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
  background: white;
}

.content-type-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

