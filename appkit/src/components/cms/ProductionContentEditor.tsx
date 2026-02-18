'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { 
  CheckIcon as SaveIcon,
  XMarkIcon,
  EyeIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  ChevronUpIcon as ArrowUpIcon,
  ChevronDownIcon as ArrowDownIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  CodeBracketIcon,
  LinkIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon as QuoteIcon,
  TableCellsIcon,
  CursorArrowRaysIcon as ButtonIcon,
  RectangleStackIcon as ContainerIcon,
  MinusIcon as SpacerIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  PencilIcon,
  DocumentDuplicateIcon as DuplicateIcon
} from '@heroicons/react/24/outline'
import { v4 as uuidv4 } from '../../utils/uuid'

// Types
interface ContentComponent {
  id: string
  type: 'text' | 'heading' | 'image' | 'video' | 'audio' | 'button' | 'container' | 'spacer' | 'divider' | 'quote' | 'list' | 'table' | 'code' | 'link'
  props: Record<string, any>
  children?: ContentComponent[]
  order: number
  styles?: Record<string, any>
}

interface ContentPage {
  id: string
  title: string
  slug: string
  type: 'marketing' | 'news' | 'inspiration' | 'popup'
  status: 'draft' | 'published' | 'archived'
  components: ContentComponent[]
  createdAt: string
  updatedAt: string
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
  }
  mobileDisplay?: {
    showOnLogin: boolean
    showOnHome: boolean
    showOnNews: boolean
    showAsPopup: boolean
    popupTrigger: 'immediate' | 'scroll' | 'time' | 'exit'
  }
}

interface ProductionContentEditorProps {
  page?: ContentPage
  onSave: (page: ContentPage) => Promise<void>
  onCancel: () => void
  onPublish?: (page: ContentPage) => Promise<void>
  onSchedule?: (page: ContentPage, date: Date) => Promise<void>
  onPreview?: (page: ContentPage) => void
  onDuplicate?: (page: ContentPage) => Promise<void>
}

// Component Library
const COMPONENT_TYPES = [
  {
    id: 'text',
    name: 'Text',
    icon: DocumentTextIcon,
    description: 'Rich text content',
    category: 'content'
  },
  {
    id: 'heading',
    name: 'Heading',
    icon: DocumentTextIcon,
    description: 'Page headings (H1-H6)',
    category: 'content'
  },
  {
    id: 'image',
    name: 'Image',
    icon: PhotoIcon,
    description: 'Images and media',
    category: 'media'
  },
  {
    id: 'video',
    name: 'Video',
    icon: VideoCameraIcon,
    description: 'Video content',
    category: 'media'
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: SpeakerWaveIcon,
    description: 'Audio content',
    category: 'media'
  },
  {
    id: 'button',
    name: 'Button',
    icon: ButtonIcon,
    description: 'Call-to-action buttons',
    category: 'interactive'
  },
  {
    id: 'container',
    name: 'Container',
    icon: ContainerIcon,
    description: 'Layout containers',
    category: 'layout'
  },
  {
    id: 'spacer',
    name: 'Spacer',
    icon: SpacerIcon,
    description: 'Vertical spacing',
    category: 'layout'
  },
  {
    id: 'divider',
    name: 'Divider',
    icon: SpacerIcon,
    description: 'Horizontal dividers',
    category: 'layout'
  },
  {
    id: 'quote',
    name: 'Quote',
    icon: QuoteIcon,
    description: 'Block quotes',
    category: 'content'
  },
  {
    id: 'list',
    name: 'List',
    icon: ListBulletIcon,
    description: 'Bulleted and numbered lists',
    category: 'content'
  },
  {
    id: 'table',
    name: 'Table',
    icon: TableCellsIcon,
    description: 'Data tables',
    category: 'content'
  },
  {
    id: 'code',
    name: 'Code',
    icon: CodeBracketIcon,
    description: 'Code blocks',
    category: 'content'
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    description: 'External links',
    category: 'interactive'
  }
]

// Component Renderer
const ComponentRenderer: React.FC<{
  component: ContentComponent
  onUpdate: (id: string, updates: Partial<ContentComponent>) => void
  onDelete: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  isSelected: boolean
  onSelect: (id: string) => void
}> = ({ component, onUpdate, onDelete, onMove, isSelected, onSelect }) => {
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdate = (updates: Partial<ContentComponent>) => {
    onUpdate(component.id, updates)
  }

  const renderComponent = () => {
    switch (component.type) {
      case 'text':
        return (
          <div className="p-4">
            {isEditing ? (
              <textarea
                value={component.props.content || ''}
                onChange={(e) => handleUpdate({ props: { ...component.props, content: e.target.value } })}
                className="w-full p-2 border rounded resize-none"
                rows={3}
                placeholder="Enter text content..."
                autoFocus
                onBlur={() => setIsEditing(false)}
              />
            ) : (
              <div
                className="min-h-[2rem] p-2 border border-transparent hover:border-gray-300 rounded cursor-text"
                onClick={() => setIsEditing(true)}
              >
                {component.props.content || 'Click to add text...'}
              </div>
            )}
          </div>
        )

      case 'heading':
        const HeadingTag = component.props.level || 'h2'
        return (
          <div className="p-4">
            {isEditing ? (
              <div className="space-y-2">
                <select
                  value={component.props.level || 'h2'}
                  onChange={(e) => handleUpdate({ props: { ...component.props, level: e.target.value } })}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="h1">H1</option>
                  <option value="h2">H2</option>
                  <option value="h3">H3</option>
                  <option value="h4">H4</option>
                  <option value="h5">H5</option>
                  <option value="h6">H6</option>
                </select>
                <input
                  type="text"
                  value={component.props.content || ''}
                  onChange={(e) => handleUpdate({ props: { ...component.props, content: e.target.value } })}
                  className="w-full p-2 border rounded"
                  placeholder="Enter heading..."
                  autoFocus
                  onBlur={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <HeadingTag
                className="min-h-[2rem] p-2 border border-transparent hover:border-gray-300 rounded cursor-text"
                onClick={() => setIsEditing(true)}
              >
                {component.props.content || 'Click to add heading...'}
              </HeadingTag>
            )}
          </div>
        )

      case 'image':
        return (
          <div className="p-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {component.props.src ? (
                <div className="space-y-2">
                  <img
                    src={component.props.src}
                    alt={component.props.alt || ''}
                    className="max-w-full h-auto mx-auto rounded"
                  />
                  <div className="text-sm text-gray-600">
                    <input
                      type="text"
                      value={component.props.alt || ''}
                      onChange={(e) => handleUpdate({ props: { ...component.props, alt: e.target.value } })}
                      className="w-full p-1 border rounded text-sm"
                      placeholder="Alt text"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600">No image selected</p>
                  <input
                    type="url"
                    value={component.props.src || ''}
                    onChange={(e) => handleUpdate({ props: { ...component.props, src: e.target.value } })}
                    className="w-full p-2 border rounded"
                    placeholder="Enter image URL"
                  />
                </div>
              )}
            </div>
          </div>
        )

      case 'button':
        return (
          <div className="p-4">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={component.props.text || ''}
                  onChange={(e) => handleUpdate({ props: { ...component.props, text: e.target.value } })}
                  className="w-full p-2 border rounded"
                  placeholder="Button text"
                  autoFocus
                />
                <input
                  type="url"
                  value={component.props.href || ''}
                  onChange={(e) => handleUpdate({ props: { ...component.props, href: e.target.value } })}
                  className="w-full p-2 border rounded"
                  placeholder="Button URL"
                />
                <select
                  value={component.props.variant || 'primary'}
                  onChange={(e) => handleUpdate({ props: { ...component.props, variant: e.target.value } })}
                  className="w-full p-2 border rounded"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="outline">Outline</option>
                </select>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <button
                className={`px-6 py-2 rounded font-medium ${
                  component.props.variant === 'primary' ? 'bg-blue-600 text-white' :
                  component.props.variant === 'secondary' ? 'bg-gray-600 text-white' :
                  'border border-gray-300 text-gray-700'
                }`}
                onClick={() => setIsEditing(true)}
              >
                {component.props.text || 'Click to edit button'}
              </button>
            )}
          </div>
        )

      case 'spacer':
        return (
          <div className="p-4">
            <div className="border-2 border-dashed border-gray-300 rounded p-2 text-center">
              <SpacerIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Spacer</p>
              <input
                type="number"
                value={component.props.height || 20}
                onChange={(e) => handleUpdate({ props: { ...component.props, height: parseInt(e.target.value) } })}
                className="w-20 p-1 border rounded text-sm"
                min="10"
                max="200"
              />
              <span className="text-sm text-gray-600 ml-1">px</span>
            </div>
          </div>
        )

      case 'divider':
        return (
          <div className="p-4">
            <div className="border-t border-gray-300"></div>
            <div className="text-center mt-2">
              <span className="text-sm text-gray-600 bg-white px-2">Divider</span>
            </div>
          </div>
        )

      case 'quote':
        return (
          <div className="p-4">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={component.props.content || ''}
                  onChange={(e) => handleUpdate({ props: { ...component.props, content: e.target.value } })}
                  className="w-full p-2 border rounded resize-none"
                  rows={3}
                  placeholder="Enter quote..."
                  autoFocus
                />
                <input
                  type="text"
                  value={component.props.author || ''}
                  onChange={(e) => handleUpdate({ props: { ...component.props, author: e.target.value } })}
                  className="w-full p-2 border rounded"
                  placeholder="Quote author (optional)"
                />
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <blockquote
                className="border-l-4 border-blue-500 pl-4 py-2 cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <p className="text-lg italic">
                  {component.props.content || 'Click to add quote...'}
                </p>
                {component.props.author && (
                  <footer className="text-sm text-gray-600 mt-2">
                    — {component.props.author}
                  </footer>
                )}
              </blockquote>
            )}
          </div>
        )

      default:
        return (
          <div className="p-4 border border-gray-300 rounded">
            <p className="text-gray-600">Unsupported component: {component.type}</p>
          </div>
        )
    }
  }

  return (
    <div
      className={`relative border-2 rounded-lg transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300'
      }`}
      onClick={() => onSelect(component.id)}
    >
      {/* Component Controls */}
      {isSelected && (
        <div className="absolute -top-8 right-0 flex space-x-1 bg-white border border-gray-300 rounded shadow-lg p-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMove(component.id, 'up')
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Move up"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMove(component.id, 'down')
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="Move down"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(component.id)
            }}
            className="p-1 hover:bg-red-100 text-red-600 rounded"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {renderComponent()}
    </div>
  )
}

// Main Editor Component
export const ProductionContentEditor: React.FC<ProductionContentEditorProps> = ({
  page,
  onSave,
  onCancel,
  onPublish,
  onSchedule,
  onPreview,
  onDuplicate
}) => {
  const [content, setContent] = useState<ContentPage>(page || {
    id: '',
    title: '',
    slug: '',
    type: 'marketing',
    status: 'draft',
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seo: {},
    mobileDisplay: {
      showOnLogin: false,
      showOnHome: false,
      showOnNews: false,
      showAsPopup: false,
      popupTrigger: 'immediate'
    }
  })

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'mobile' | 'settings'>('content')
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [autoSave, setAutoSave] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && content.title) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await onSave(content)
          setLastSaved(new Date())
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }, 2000)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [content, autoSave, onSave])

  // Validation
  const validateContent = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!content.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!content.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(content.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    if (content.components.length === 0) {
      newErrors.components = 'At least one component is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [content])

  // Component management
  const addComponent = useCallback((type: string, position: 'before' | 'after' | 'end', targetId?: string) => {
    const newComponent: ContentComponent = {
      id: uuidv4(),
      type: type as any,
      props: getDefaultProps(type),
      order: 0
    }

    setContent(prev => {
      let newComponents = [...prev.components]
      
      if (targetId) {
        const targetIndex = newComponents.findIndex(comp => comp.id === targetId)
        if (targetIndex !== -1) {
          if (position === 'before') {
            newComponents.splice(targetIndex, 0, newComponent)
          } else {
            newComponents.splice(targetIndex + 1, 0, newComponent)
          }
        } else {
          newComponents.push(newComponent)
        }
      } else {
        newComponents.push(newComponent)
      }

      // Re-order components
      newComponents = newComponents.map((comp, index) => ({ ...comp, order: index }))
      
      return {
        ...prev,
        components: newComponents,
        updatedAt: new Date().toISOString()
      }
    })

    setSelectedComponent(newComponent.id)
  }, [])

  const updateComponent = useCallback((id: string, updates: Partial<ContentComponent>) => {
    setContent(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === id ? { ...comp, ...updates } : comp
      ),
      updatedAt: new Date().toISOString()
    }))
  }, [])

  const deleteComponent = useCallback((id: string) => {
    setContent(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== id),
      updatedAt: new Date().toISOString()
    }))
    setSelectedComponent(null)
  }, [])

  const moveComponent = useCallback((id: string, direction: 'up' | 'down') => {
    setContent(prev => {
      const components = [...prev.components]
      const index = components.findIndex(comp => comp.id === id)
      
      if (index === -1) return prev as ContentPage
      
      const newIndex = direction === 'up' ? index - 1 : index + 1
      
      if (newIndex < 0 || newIndex >= components.length) return prev as ContentPage
      
      // Swap components
      [components[index], components[newIndex]] = [components[newIndex], components[index]]
      
      // Update order
      const updatedComponents = components.map((comp, idx) => ({ ...comp, order: idx }))
      
      return {
        ...prev,
        components: updatedComponents,
        updatedAt: new Date().toISOString()
      }
    })
  }, [])

  const getDefaultProps = (type: string): Record<string, any> => {
    switch (type) {
      case 'text':
        return { content: '' }
      case 'heading':
        return { level: 'h2', content: '' }
      case 'image':
        return { src: '', alt: '' }
      case 'video':
        return { src: '', title: '' }
      case 'audio':
        return { src: '', title: '' }
      case 'button':
        return { text: 'Click me', href: '', variant: 'primary' }
      case 'spacer':
        return { height: 20 }
      case 'quote':
        return { content: '', author: '' }
      case 'list':
        return { items: [], ordered: false }
      case 'table':
        return { headers: [], rows: [] }
      case 'code':
        return { code: '', language: 'javascript' }
      case 'link':
        return { text: '', href: '', target: '_blank' }
      default:
        return {}
    }
  }

  // Event handlers
  const handleSave = async () => {
    if (!validateContent()) return

    setIsSaving(true)
    try {
      await onSave(content)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!validateContent()) return

    setIsPublishing(true)
    try {
      if (onPublish) {
        await onPublish({ ...content, status: 'published' })
      } else {
        await onSave({ ...content, status: 'published' })
      }
      setLastSaved(new Date())
    } catch (error) {
      console.error('Publish failed:', error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(content)
    }
  }

  const handleDuplicate = async () => {
    if (onDuplicate) {
      try {
        await onDuplicate(content)
      } catch (error) {
        console.error('Duplicate failed:', error)
      }
    }
  }

  // Group components by category
  const groupedComponents = COMPONENT_TYPES.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = []
    }
    acc[component.category].push(component)
    return acc
  }, {} as Record<string, typeof COMPONENT_TYPES>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {content.id ? 'Edit Content' : 'Create New Content'}
              </h1>
              <p className="text-sm text-gray-600">
                {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {onPreview && (
              <button
                onClick={handlePreview}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <EyeIcon className="h-4 w-4 mr-2 inline" />
                Preview
              </button>
            )}
            
            {onDuplicate && content.id && (
              <button
                onClick={handleDuplicate}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <DuplicateIcon className="h-4 w-4 mr-2 inline" />
                Duplicate
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {isSaving ? (
                <ArrowPathIcon className="h-4 w-4 mr-2 inline animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4 mr-2 inline" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            
            {onPublish && (
              <button
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {isPublishing ? (
                  <ArrowPathIcon className="h-4 w-4 mr-2 inline animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 mr-2 inline" />
                )}
                {isPublishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Component Library */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Components</h2>
            
            {Object.entries(groupedComponents).map(([category, components]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                  {category}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {components.map((component) => {
                    const IconComponent = component.icon
                    return (
                      <button
                        key={component.id}
                        onClick={() => addComponent(component.id, 'end')}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                      >
                        <IconComponent className="h-5 w-5 text-gray-600 mb-1" />
                        <div className="text-sm font-medium text-gray-900">{component.name}</div>
                        <div className="text-xs text-gray-500">{component.description}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'content', label: 'Content', icon: DocumentTextIcon },
                { id: 'seo', label: 'SEO', icon: GlobeAltIcon },
                { id: 'mobile', label: 'Mobile', icon: DevicePhoneMobileIcon },
                { id: 'settings', label: 'Settings', icon: ClockIcon }
              ].map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'content' && (
              <div className="p-6">
                {/* Basic Information */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={content.title}
                        onChange={(e) => setContent({ ...content, title: e.target.value, updatedAt: new Date().toISOString() })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter content title"
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slug *
                      </label>
                      <input
                        type="text"
                        value={content.slug}
                        onChange={(e) => setContent({ ...content, slug: e.target.value, updatedAt: new Date().toISOString() })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.slug ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="content-slug"
                      />
                      {errors.slug && (
                        <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={content.type}
                        onChange={(e) => setContent({ ...content, type: e.target.value as any, updatedAt: new Date().toISOString() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="marketing">Marketing</option>
                        <option value="news">News</option>
                        <option value="inspiration">Inspiration</option>
                        <option value="popup">Popup</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={content.status}
                        onChange={(e) => setContent({ ...content, status: e.target.value as any, updatedAt: new Date().toISOString() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Content Components */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Content Components</h2>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={autoSave}
                          onChange={(e) => setAutoSave(e.target.checked)}
                          className="rounded"
                        />
                        <span>Auto-save</span>
                      </label>
                    </div>
                  </div>

                  {content.components.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No components yet</h3>
                      <p className="text-gray-600 mb-4">
                        Add components from the sidebar to start building your content.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {content.components
                        .sort((a, b) => a.order - b.order)
                        .map((component) => (
                          <ComponentRenderer
                            key={component.id}
                            component={component}
                            onUpdate={updateComponent}
                            onDelete={deleteComponent}
                            onMove={moveComponent}
                            isSelected={selectedComponent === component.id}
                            onSelect={setSelectedComponent}
                          />
                        ))}
                    </div>
                  )}

                  {errors.components && (
                    <p className="text-red-500 text-sm mt-2">{errors.components}</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Title
                      </label>
                      <input
                        type="text"
                        value={content.seo?.title || ''}
                        onChange={(e) => setContent({
                          ...content,
                          seo: { ...content.seo, title: e.target.value },
                          updatedAt: new Date().toISOString()
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="SEO title (leave empty to use main title)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description
                      </label>
                      <textarea
                        value={content.seo?.description || ''}
                        onChange={(e) => setContent({
                          ...content,
                          seo: { ...content.seo, description: e.target.value },
                          updatedAt: new Date().toISOString()
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Meta description for search engines"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keywords
                      </label>
                      <input
                        type="text"
                        value={content.seo?.keywords?.join(', ') || ''}
                        onChange={(e) => setContent({
                          ...content,
                          seo: { ...content.seo, keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) },
                          updatedAt: new Date().toISOString()
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Keywords (comma-separated)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Open Graph Image URL
                      </label>
                      <input
                        type="url"
                        value={content.seo?.ogImage || ''}
                        onChange={(e) => setContent({
                          ...content,
                          seo: { ...content.seo, ogImage: e.target.value },
                          updatedAt: new Date().toISOString()
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mobile' && (
              <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Mobile Display Settings</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={content.mobileDisplay?.showOnLogin || false}
                          onChange={(e) => setContent({
                            ...content,
                            mobileDisplay: { ...content.mobileDisplay!, showOnLogin: e.target.checked },
                            updatedAt: new Date().toISOString()
                          })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Show on Login</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={content.mobileDisplay?.showOnHome || false}
                          onChange={(e) => setContent({
                            ...content,
                            mobileDisplay: { ...content.mobileDisplay!, showOnHome: e.target.checked },
                            updatedAt: new Date().toISOString()
                          })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Show on Home</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={content.mobileDisplay?.showOnNews || false}
                          onChange={(e) => setContent({
                            ...content,
                            mobileDisplay: { ...content.mobileDisplay!, showOnNews: e.target.checked },
                            updatedAt: new Date().toISOString()
                          })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Show on News</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={content.mobileDisplay?.showAsPopup || false}
                          onChange={(e) => setContent({
                            ...content,
                            mobileDisplay: { ...content.mobileDisplay!, showAsPopup: e.target.checked },
                            updatedAt: new Date().toISOString()
                          })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Show as Popup</span>
                      </label>
                    </div>
                    
                    {content.mobileDisplay?.showAsPopup && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Popup Trigger
                        </label>
                        <select
                          value={content.mobileDisplay?.popupTrigger || 'immediate'}
                          onChange={(e) => setContent({
                            ...content,
                            mobileDisplay: { ...content.mobileDisplay!, popupTrigger: e.target.value as any },
                            updatedAt: new Date().toISOString()
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="scroll">On Scroll</option>
                          <option value="time">After Time</option>
                          <option value="exit">On Exit Intent</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Created At
                      </label>
                      <input
                        type="datetime-local"
                        value={new Date(content.createdAt).toISOString().slice(0, 16)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Updated
                      </label>
                      <input
                        type="datetime-local"
                        value={new Date(content.updatedAt).toISOString().slice(0, 16)}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content ID
                      </label>
                      <input
                        type="text"
                        value={content.id || 'Will be generated on save'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
