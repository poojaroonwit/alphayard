'use client'

import React, { useState, useCallback } from 'react'
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
import { ContentPage, ContentComponent } from '../../services/productionCmsService'

interface SimpleProductionEditorProps {
  page?: ContentPage
  onSave: (page: ContentPage) => Promise<void>
  onCancel: () => void
  onPublish?: (page: ContentPage) => Promise<void>
  onPreview?: (page: ContentPage) => void
  onDuplicate?: (page: ContentPage) => Promise<void>
}

// Simple component renderer
const SimpleComponentRenderer: React.FC<{
  component: ContentComponent
  onUpdate: (id: string, updates: Partial<ContentComponent>) => void
  onDelete: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  isSelected: boolean
  onSelect: (id: string) => void
}> = ({ component, onUpdate, onDelete, onMove, isSelected, onSelect }) => {
  const handleUpdate = (updates: Partial<ContentComponent>) => {
    onUpdate(component.id, updates)
  }

  const renderComponent = () => {
    const componentType = component.type as string
    switch (componentType) {
      case 'text':
        return (
          <div className="p-4">
            <textarea
              value={component.props.content || ''}
              onChange={(e) => handleUpdate({ props: { ...component.props, content: e.target.value } })}
              className="w-full p-2 border rounded resize-none"
              rows={3}
              placeholder="Enter text content..."
            />
          </div>
        )

      case 'heading':
        const HeadingTag = component.props.level || 'h2'
        return (
          <div className="p-4">
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
              />
            </div>
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
                  <input
                    type="text"
                    value={component.props.alt || ''}
                    onChange={(e) => handleUpdate({ props: { ...component.props, alt: e.target.value } })}
                    className="w-full p-1 border rounded text-sm"
                    placeholder="Alt text"
                  />
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
            <div className="space-y-2">
              <input
                type="text"
                value={component.props.text || ''}
                onChange={(e) => handleUpdate({ props: { ...component.props, text: e.target.value } })}
                className="w-full p-2 border rounded"
                placeholder="Button text"
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
            </div>
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
export const SimpleProductionEditor: React.FC<SimpleProductionEditorProps> = ({
  page,
  onSave,
  onCancel,
  onPublish,
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
    updatedAt: new Date().toISOString()
  })

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Component management
  const addComponent = useCallback((type: string) => {
    const newComponent: ContentComponent = {
      id: uuidv4(),
      type: type as any,
      props: getDefaultProps(type),
      order: 0
    }

    setContent(prev => {
      const newComponents = [...prev.components, newComponent]
      const updatedComponents = newComponents.map((comp, index) => ({ ...comp, order: index }))
      
      return {
        ...prev,
        components: updatedComponents,
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
      case 'button':
        return { text: 'Click me', href: '', variant: 'primary' }
      default:
        return {}
    }
  }

  // Event handlers
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(content)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (onPublish) {
      setIsSaving(true)
      try {
        await onPublish({ ...content, status: 'published' })
      } catch (error) {
        console.error('Publish failed:', error)
      } finally {
        setIsSaving(false)
      }
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

  // Simple component types
  const componentTypes = [
    { id: 'text', name: 'Text', icon: DocumentTextIcon },
    { id: 'heading', name: 'Heading', icon: DocumentTextIcon },
    { id: 'image', name: 'Image', icon: PhotoIcon },
    { id: 'button', name: 'Button', icon: ButtonIcon }
  ]

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
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {isSaving ? (
                  <ArrowPathIcon className="h-4 w-4 mr-2 inline animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4 mr-2 inline" />
                )}
                {isSaving ? 'Publishing...' : 'Publish'}
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
            
            <div className="grid grid-cols-2 gap-2">
              {componentTypes.map((component) => {
                const IconComponent = component.icon
                return (
                  <button
                    key={component.id}
                    onClick={() => addComponent(component.id)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                  >
                    <IconComponent className="h-5 w-5 text-gray-600 mb-1" />
                    <div className="text-sm font-medium text-gray-900">{component.name}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter content title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={content.slug}
                    onChange={(e) => setContent({ ...content, slug: e.target.value, updatedAt: new Date().toISOString() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="content-slug"
                  />
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Components</h2>

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
                      <SimpleComponentRenderer
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
