'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { 
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  LinkIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ChatBubbleLeftRightIcon,
  TableCellsIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon as SaveIcon,
  ShareIcon,
  ClockIcon,
  CalendarIcon,
  TagIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CogIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { ContentPage, ContentComponent } from '../../types/content'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { ResponsiveContainer, ResponsiveGrid, ResponsiveFlex, ResponsiveText } from '../ui/ResponsiveContainer'

// Enhanced Content Editor Interface
interface EnhancedContentEditorProps {
  page?: ContentPage
  onSave: (page: ContentPage) => void
  onCancel: () => void
  onPublish?: (page: ContentPage) => void
  onSchedule?: (page: ContentPage, date: Date) => void
  onPreview?: (page: ContentPage) => void
  onDuplicate?: (page: ContentPage) => void
  autoSave?: boolean
  autoSaveInterval?: number
}

export const EnhancedContentEditor: React.FC<EnhancedContentEditorProps> = ({
  page,
  onSave,
  onCancel,
  onPublish,
  onSchedule,
  onPreview,
  onDuplicate,
  autoSave = true,
  autoSaveInterval = 30000
}) => {
  // State management
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
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showSidebar, setShowSidebar] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'settings' | 'seo'>('content')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date())
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null)
  const [showComponentLibrary, setShowComponentLibrary] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Refs
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isDirty) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave()
      }, autoSaveInterval)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [content, isDirty, autoSave, autoSaveInterval])

  // Notification handler
  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Auto-save handler
  const handleAutoSave = useCallback(async () => {
    if (!isDirty) return
    
    try {
      setIsSaving(true)
      await onSave(content)
      setIsDirty(false)
      showNotification('success', 'Auto-saved')
    } catch (error) {
      showNotification('error', 'Auto-save failed')
    } finally {
      setIsSaving(false)
    }
  }, [content, isDirty, onSave, showNotification])

  // Content update handler
  const updateContent = useCallback((updates: Partial<ContentPage>) => {
    setContent(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }))
    setIsDirty(true)
  }, [])

  // Component management
  const addComponent = useCallback((type: string, props: any = {}) => {
    const newComponent: ContentComponent = {
      id: `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      props: props,
      order: content.components.length,
      style: {}
    }
    
    updateContent({
      components: [...content.components, newComponent]
    })
    setSelectedComponent(newComponent.id)
  }, [content.components, updateContent])

  const updateComponent = useCallback((componentId: string, updates: Partial<ContentComponent>) => {
    const updatedComponents = content.components.map(comp =>
      comp.id === componentId ? { ...comp, ...updates } : comp
    )
    updateContent({ components: updatedComponents })
  }, [content.components, updateContent])

  const deleteComponent = useCallback((componentId: string) => {
    const updatedComponents = content.components
      .filter(comp => comp.id !== componentId)
      .map((comp, index) => ({ ...comp, order: index }))
    updateContent({ components: updatedComponents })
    setSelectedComponent(null)
  }, [content.components, updateContent])

  const moveComponent = useCallback((componentId: string, direction: 'up' | 'down') => {
    const components = [...content.components]
    const index = components.findIndex(comp => comp.id === componentId)
    
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= components.length) return
    
    // Swap components
    [components[index], components[newIndex]] = [components[newIndex], components[index]]
    
    // Update order
    components.forEach((comp, idx) => {
      comp.order = idx
    })
    
    updateContent({ components })
  }, [content.components, updateContent])

  // Save handler
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true)
      await onSave(content)
      setIsDirty(false)
      showNotification('success', 'Content saved successfully')
    } catch (error) {
      showNotification('error', 'Failed to save content')
    } finally {
      setIsSaving(false)
    }
  }, [content, onSave, showNotification])

  // Publish handler
  const handlePublish = useCallback(async () => {
    try {
      const publishedContent = { ...content, status: 'published' as const }
      await onSave(publishedContent)
      setIsDirty(false)
      showNotification('success', 'Content published successfully')
      onPublish?.(publishedContent)
    } catch (error) {
      showNotification('error', 'Failed to publish content')
    }
  }, [content, onSave, onPublish, showNotification])

  // Schedule handler
  const handleSchedule = useCallback(async () => {
    try {
      const scheduledContent = { ...content, status: 'draft' as const }
      await onSave(scheduledContent)
      setIsDirty(false)
      showNotification('success', `Content scheduled for ${scheduleDate.toLocaleDateString()}`)
      onSchedule?.(scheduledContent, scheduleDate)
      setShowScheduleModal(false)
    } catch (error) {
      showNotification('error', 'Failed to schedule content')
    }
  }, [content, onSave, onSchedule, scheduleDate, showNotification])

  // Preview handler
  const handlePreview = useCallback(() => {
    onPreview?.(content)
  }, [content, onPreview])

  // Duplicate handler
  const handleDuplicate = useCallback(() => {
    const duplicatedContent = {
      ...content,
      id: '',
      title: `${content.title} (Copy)`,
      slug: `${content.slug}-copy-${Date.now()}`,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    onDuplicate?.(duplicatedContent)
  }, [content, onDuplicate])

  // Component library data
  const componentLibrary = [
    { type: 'heading', name: 'Heading', icon: DocumentTextIcon, description: 'Add headings (H1-H6)' },
    { type: 'text', name: 'Text', icon: DocumentTextIcon, description: 'Add text content' },
    { type: 'image', name: 'Image', icon: PhotoIcon, description: 'Add images' },
    { type: 'video', name: 'Video', icon: VideoCameraIcon, description: 'Add videos' },
    { type: 'audio', name: 'Audio', icon: SpeakerWaveIcon, description: 'Add audio files' },
    { type: 'button', name: 'Button', icon: LinkIcon, description: 'Add call-to-action buttons' },
    { type: 'container', name: 'Container', icon: DocumentTextIcon, description: 'Group content in containers' },
    { type: 'spacer', name: 'Spacer', icon: DocumentTextIcon, description: 'Add spacing between elements' },
    { type: 'divider', name: 'Divider', icon: DocumentTextIcon, description: 'Add visual separators' },
    { type: 'quote', name: 'Quote', icon: ChatBubbleLeftRightIcon, description: 'Add blockquotes' },
    { type: 'code', name: 'Code', icon: CodeBracketIcon, description: 'Add code blocks' },
    { type: 'table', name: 'Table', icon: TableCellsIcon, description: 'Add data tables' },
    { type: 'list', name: 'List', icon: ListBulletIcon, description: 'Add bullet or numbered lists' }
  ]

  const filteredComponents = componentLibrary.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Toggle sidebar"
              >
                <CogIcon className="h-5 w-5" />
              </button>
              <div>
                <input
                  type="text"
                  value={content.title}
                  onChange={(e) => updateContent({ title: e.target.value })}
                  placeholder="Content title..."
                  className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-0"
                />
                <div className="text-sm text-gray-500">
                  {content.slug} • {content.type} • {content.status}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isSaving && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded-lg ${
                    previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  aria-label="Desktop preview"
                >
                  <ComputerDesktopIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('tablet')}
                  className={`p-2 rounded-lg ${
                    previewMode === 'tablet' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  aria-label="Tablet preview"
                >
                  <DeviceTabletIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded-lg ${
                    previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                  }`}
                  aria-label="Mobile preview"
                >
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handlePreview}
                  className="content-button content-button-secondary"
                  aria-label="Preview content"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Preview
                </button>
                <button
                  onClick={handleDuplicate}
                  className="content-button content-button-secondary"
                  aria-label="Duplicate content"
                >
                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                  Duplicate
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="content-button content-button-secondary"
                  aria-label="Schedule content"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule
                </button>
                <button
                  onClick={handlePublish}
                  className="content-button content-button-primary"
                  aria-label="Publish content"
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Publish
                </button>
                <button
                  onClick={handleSave}
                  className="content-button content-button-primary"
                  aria-label="Save content"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save
                </button>
                <button
                  onClick={onCancel}
                  className="content-button content-button-secondary"
                  aria-label="Cancel editing"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

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

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
              {/* Sidebar Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'content', label: 'Content', icon: DocumentTextIcon },
                    { id: 'style', label: 'Style', icon: CogIcon },
                    { id: 'settings', label: 'Settings', icon: GlobeAltIcon },
                    { id: 'seo', label: 'SEO', icon: TagIcon }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="h-4 w-4 inline mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'content' && (
                  <ContentTab
                    componentLibrary={filteredComponents}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onAddComponent={addComponent}
                    selectedComponent={selectedComponent}
                    onSelectComponent={setSelectedComponent}
                    components={content.components}
                    onUpdateComponent={updateComponent}
                    onDeleteComponent={deleteComponent}
                    onMoveComponent={moveComponent}
                  />
                )}
                
                {activeTab === 'style' && (
                  <StyleTab
                    selectedComponent={selectedComponent}
                    components={content.components}
                    onUpdateComponent={updateComponent}
                  />
                )}
                
                {activeTab === 'settings' && (
                  <SettingsTab
                    content={content}
                    onUpdateContent={updateContent}
                  />
                )}
                
                {activeTab === 'seo' && (
                  <SEOTab
                    content={content}
                    onUpdateContent={updateContent}
                  />
                )}
              </div>
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Component Library Toggle */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <button
                onClick={() => setShowComponentLibrary(!showComponentLibrary)}
                className="content-button content-button-secondary"
                aria-label="Toggle component library"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Component
              </button>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className={`editor-canvas editor-${previewMode}`}>
                <div className="editor-content">
                  {content.components.length === 0 ? (
                    <div className="empty-editor">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start building your content</h3>
                      <p className="text-gray-500 mb-4">Add components from the sidebar or component library</p>
                      <button
                        onClick={() => setShowComponentLibrary(true)}
                        className="content-button content-button-primary"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add First Component
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {content.components
                        .sort((a, b) => a.order - b.order)
                        .map((component) => (
                          <ComponentRenderer
                            key={component.id}
                            component={component}
                            isSelected={selectedComponent === component.id}
                            onSelect={() => setSelectedComponent(component.id)}
                            onUpdate={(updates) => updateComponent(component.id, updates)}
                            onDelete={() => deleteComponent(component.id)}
                            onMoveUp={() => moveComponent(component.id, 'up')}
                            onMoveDown={() => moveComponent(component.id, 'down')}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="flex items-center space-x-3 mb-4">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Schedule Content</h3>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate.toISOString().slice(0, 16)}
                  onChange={(e) => setScheduleDate(new Date(e.target.value))}
                  className="content-input w-full"
                />
              </div>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="content-button content-button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedule}
                  className="content-button content-button-primary"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

// Content Tab Component
interface ContentTabProps {
  componentLibrary: any[]
  searchTerm: string
  onSearchChange: (term: string) => void
  onAddComponent: (type: string, props: any) => void
  selectedComponent: string | null
  onSelectComponent: (id: string) => void
  components: ContentComponent[]
  onUpdateComponent: (id: string, updates: Partial<ContentComponent>) => void
  onDeleteComponent: (id: string) => void
  onMoveComponent: (id: string, direction: 'up' | 'down') => void
}

const ContentTab: React.FC<ContentTabProps> = ({
  componentLibrary,
  searchTerm,
  onSearchChange,
  onAddComponent,
  selectedComponent,
  onSelectComponent,
  components,
  onUpdateComponent,
  onDeleteComponent,
  onMoveComponent
}) => {
  return (
    <div className="space-y-6">
      {/* Component Library */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Component Library</h3>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="content-input w-full pl-8"
          />
          <DocumentTextIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {componentLibrary.map((comp) => (
            <button
              key={comp.type}
              onClick={() => onAddComponent(comp.type, {})}
              className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <comp.icon className="h-5 w-5 text-gray-500 mb-2" />
              <div className="text-sm font-medium text-gray-900">{comp.name}</div>
              <div className="text-xs text-gray-500">{comp.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Component Tree */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Content Structure</h3>
        <div className="space-y-2">
          {components
            .sort((a, b) => a.order - b.order)
            .map((component) => (
              <div
                key={component.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedComponent === component.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelectComponent(component.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {component.type}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMoveComponent(component.id, 'up')
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                        aria-label="Move up"
                      >
                        <ChevronUpIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMoveComponent(component.id, 'down')
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                        aria-label="Move down"
                      >
                        <ChevronDownIcon className="h-3 w-3" />
                      </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteComponent(component.id)
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      aria-label="Delete component"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// Style Tab Component
interface StyleTabProps {
  selectedComponent: string | null
  components: ContentComponent[]
  onUpdateComponent: (id: string, updates: Partial<ContentComponent>) => void
}

const StyleTab: React.FC<StyleTabProps> = ({
  selectedComponent,
  components,
  onUpdateComponent
}) => {
  const component = components.find(comp => comp.id === selectedComponent)
  
  if (!component) {
    return (
      <div className="text-center py-8">
        <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Select a component to edit its styles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Component Styles</h3>
        <div className="text-sm text-gray-500 mb-4">
          Editing styles for: <span className="font-medium">{component.type}</span>
        </div>
        
        {/* Style controls based on component type */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <input
              type="color"
              value={component.style?.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdateComponent(component.id, {
                style: { ...component.style, backgroundColor: e.target.value }
              })}
              className="w-full h-10 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Padding
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={component.style?.padding || 0}
              onChange={(e) => onUpdateComponent(component.id, {
                style: { ...component.style, padding: parseInt(e.target.value) }
              })}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              {component.style?.padding || 0}px
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margin
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={component.style?.margin || 0}
              onChange={(e) => onUpdateComponent(component.id, {
                style: { ...component.style, margin: parseInt(e.target.value) }
              })}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              {component.style?.margin || 0}px
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Tab Component
interface SettingsTabProps {
  content: ContentPage
  onUpdateContent: (updates: Partial<ContentPage>) => void
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  content,
  onUpdateContent
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Content Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => onUpdateContent({ title: e.target.value })}
              className="content-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={content.slug}
              onChange={(e) => onUpdateContent({ slug: e.target.value })}
              className="content-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={content.type}
              onChange={(e) => onUpdateContent({ type: e.target.value as any })}
              className="content-input w-full"
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
              onChange={(e) => onUpdateContent({ status: e.target.value as any })}
              className="content-input w-full"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

// SEO Tab Component
interface SEOTabProps {
  content: ContentPage
  onUpdateContent: (updates: Partial<ContentPage>) => void
}

const SEOTab: React.FC<SEOTabProps> = ({
  content,
  onUpdateContent
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">SEO Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={content.seo?.title || ''}
              onChange={(e) => onUpdateContent({
                seo: { ...content.seo, title: e.target.value }
              })}
              className="content-input w-full"
              placeholder="SEO title (max 60 characters)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={content.seo?.description || ''}
              onChange={(e) => onUpdateContent({
                seo: { ...content.seo, description: e.target.value }
              })}
              className="content-input w-full"
              rows={3}
              placeholder="SEO description (max 160 characters)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={content.seo?.keywords?.join(', ') || ''}
              onChange={(e) => onUpdateContent({
                seo: { ...content.seo, keywords: e.target.value.split(',').map(k => k.trim()) }
              })}
              className="content-input w-full"
              placeholder="Comma-separated keywords"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Component Renderer
interface ComponentRendererProps {
  component: ContentComponent
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<ContentComponent>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  const renderComponent = () => {
    switch (component.type) {
      case 'heading':
        return (
          <h2 
            className="text-2xl font-bold"
            style={component.style}
          >
            {component.props.content || 'Heading'}
          </h2>
        )
      case 'text':
        return (
          <p 
            className="text-gray-700"
            style={component.style}
          >
            {component.props.content || 'Text content'}
          </p>
        )
      case 'image':
        return (
          <img
            src={component.props.src || '/placeholder-image.jpg'}
            alt={component.props.alt || 'Image'}
            className="max-w-full h-auto rounded-lg"
            style={component.style}
          />
        )
      case 'button':
        return (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            style={component.style}
          >
            {component.props.text || 'Button'}
          </button>
        )
      default:
        return (
          <div 
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500"
            style={component.style}
          >
            {component.type} component
          </div>
        )
    }
  }

  return (
    <div
      className={`component-wrapper ${isSelected ? 'component-selected' : ''}`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="component-controls">
          <button onClick={onMoveUp} className="control-btn" aria-label="Move up">
            ↑
          </button>
          <button onClick={onMoveDown} className="control-btn" aria-label="Move down">
            ↓
          </button>
          <button onClick={onDelete} className="control-btn text-red-600" aria-label="Delete">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {renderComponent()}
    </div>
  )
}
