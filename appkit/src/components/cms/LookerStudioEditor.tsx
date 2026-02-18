'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
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
  MinusIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Squares2X2Icon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  DocumentDuplicateIcon as DuplicateIcon,
  PencilIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  QuestionMarkCircleIcon,
  CurrencyDollarIcon,
  Bars3Icon,
  ShareIcon,
  EnvelopeIcon,
  RectangleStackIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { v4 as uuidv4 } from '../../utils/uuid'
import { ContentPage, ContentComponent } from '../../services/productionCmsService'
import { DraggableComponent } from './DraggableComponent'

// Device types and their dimensions
const DEVICE_TYPES = {
  desktop: { name: 'Desktop', width: 1200, height: 800, icon: ComputerDesktopIcon },
  tablet: { name: 'Tablet', width: 768, height: 1024, icon: DeviceTabletIcon },
  mobile: { name: 'Mobile', width: 375, height: 667, icon: DevicePhoneMobileIcon }
}

// Component types with their default properties
const COMPONENT_TYPES = [
  // Basic Elements
  {
    id: 'text',
    name: 'Text',
    icon: DocumentTextIcon,
    category: 'Basic',
    description: 'Add text content',
    defaultProps: { content: 'Enter your text here...', fontSize: 16, color: '#000000' }
  },
  {
    id: 'heading',
    name: 'Heading',
    icon: DocumentTextIcon,
    category: 'Basic',
    description: 'Add headings (H1-H6)',
    defaultProps: { content: 'Heading', level: 'h2', fontSize: 24, color: '#000000' }
  },
  {
    id: 'paragraph',
    name: 'Paragraph',
    icon: DocumentTextIcon,
    category: 'Basic',
    description: 'Add paragraph text',
    defaultProps: { content: 'This is a paragraph...', fontSize: 14, color: '#374151' }
  },
  {
    id: 'caption',
    name: 'Caption',
    icon: DocumentTextIcon,
    category: 'Basic',
    description: 'Add image captions',
    defaultProps: { content: 'Image caption...', fontSize: 12, color: '#6B7280', italic: true }
  },
  
  // Media Elements
  {
    id: 'image',
    name: 'Image',
    icon: PhotoIcon,
    category: 'Media',
    description: 'Add images and photos',
    defaultProps: { src: '', alt: '', width: 300, height: 200 }
  },
  {
    id: 'video',
    name: 'Video',
    icon: VideoCameraIcon,
    category: 'Media',
    description: 'Embed video content',
    defaultProps: { src: '', width: 400, height: 225, autoplay: false }
  },
  {
    id: 'audio',
    name: 'Audio',
    icon: SpeakerWaveIcon,
    category: 'Media',
    description: 'Add audio player',
    defaultProps: { src: '', width: 300, height: 50 }
  },
  {
    id: 'gallery',
    name: 'Gallery',
    icon: PhotoIcon,
    category: 'Media',
    description: 'Image gallery carousel',
    defaultProps: { images: [], columns: 3, spacing: 10 }
  },
  {
    id: 'iframe',
    name: 'Embed',
    icon: GlobeAltIcon,
    category: 'Media',
    description: 'Embed external content',
    defaultProps: { src: '', width: 400, height: 300 }
  },
  
  // Interactive Elements
  {
    id: 'button',
    name: 'Button',
    icon: ButtonIcon,
    category: 'Interactive',
    description: 'Add clickable buttons',
    defaultProps: { text: 'Click me', href: '', variant: 'primary', backgroundColor: '#3B82F6', color: '#FFFFFF' }
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    category: 'Interactive',
    description: 'Add hyperlinks',
    defaultProps: { text: 'Link text', href: '', color: '#3B82F6' }
  },
  {
    id: 'form',
    name: 'Form',
    icon: DocumentTextIcon,
    category: 'Interactive',
    description: 'Contact or signup form',
    defaultProps: { fields: ['name', 'email'], submitText: 'Submit' }
  },
  {
    id: 'accordion',
    name: 'Accordion',
    icon: ChevronDownIcon,
    category: 'Interactive',
    description: 'Collapsible content sections',
    defaultProps: { items: [{ title: 'Section 1', content: 'Content here...' }] }
  },
  {
    id: 'tabs',
    name: 'Tabs',
    icon: RectangleStackIcon,
    category: 'Interactive',
    description: 'Tabbed content interface',
    defaultProps: { tabs: [{ title: 'Tab 1', content: 'Content here...' }] }
  },
  
  // Layout Elements
  {
    id: 'container',
    name: 'Container',
    icon: ContainerIcon,
    category: 'Layout',
    description: 'Group elements together',
    defaultProps: { backgroundColor: '#F3F4F6', padding: 20, borderRadius: 8 }
  },
  {
    id: 'spacer',
    name: 'Spacer',
    icon: SpacerIcon,
    category: 'Layout',
    description: 'Add vertical spacing',
    defaultProps: { height: 40 }
  },
  {
    id: 'divider',
    name: 'Divider',
    icon: MinusIcon,
    category: 'Layout',
    description: 'Add horizontal line',
    defaultProps: { color: '#E5E7EB', thickness: 1 }
  },
  {
    id: 'columns',
    name: 'Columns',
    icon: RectangleStackIcon,
    category: 'Layout',
    description: 'Multi-column layout',
    defaultProps: { columns: 2, gap: 20, content: ['Column 1', 'Column 2'] }
  },
  {
    id: 'card',
    name: 'Card',
    icon: RectangleStackIcon,
    category: 'Layout',
    description: 'Content card with shadow',
    defaultProps: { title: 'Card Title', content: 'Card content...', shadow: true }
  },
  {
    id: 'hero',
    name: 'Hero',
    icon: PhotoIcon,
    category: 'Layout',
    description: 'Hero section with background',
    defaultProps: { title: 'Hero Title', subtitle: 'Hero subtitle', backgroundImage: '' }
  },
  
  // Content Elements
  {
    id: 'list',
    name: 'List',
    icon: ListBulletIcon,
    category: 'Content',
    description: 'Add bullet or numbered lists',
    defaultProps: { items: ['Item 1', 'Item 2', 'Item 3'], type: 'bullet' }
  },
  {
    id: 'quote',
    name: 'Quote',
    icon: QuoteIcon,
    category: 'Content',
    description: 'Add blockquotes',
    defaultProps: { content: 'This is a quote...', author: '', fontSize: 18 }
  },
  {
    id: 'table',
    name: 'Table',
    icon: TableCellsIcon,
    category: 'Content',
    description: 'Add data tables',
    defaultProps: { rows: 3, columns: 3, headers: ['Header 1', 'Header 2', 'Header 3'] }
  },
  {
    id: 'code',
    name: 'Code',
    icon: CodeBracketIcon,
    category: 'Content',
    description: 'Add code blocks',
    defaultProps: { content: 'console.log("Hello World");', language: 'javascript' }
  },
  {
    id: 'timeline',
    name: 'Timeline',
    icon: ClockIcon,
    category: 'Content',
    description: 'Event timeline',
    defaultProps: { events: [{ date: '2024', title: 'Event', description: 'Description' }] }
  },
  {
    id: 'faq',
    name: 'FAQ',
    icon: QuestionMarkCircleIcon,
    category: 'Content',
    description: 'Frequently asked questions',
    defaultProps: { questions: [{ q: 'Question?', a: 'Answer...' }] }
  },
  {
    id: 'testimonial',
    name: 'Testimonial',
    icon: ChatBubbleLeftRightIcon,
    category: 'Content',
    description: 'Customer testimonials',
    defaultProps: { quote: 'Great service!', author: 'John Doe', role: 'Customer' }
  },
  {
    id: 'pricing',
    name: 'Pricing',
    icon: CurrencyDollarIcon,
    category: 'Content',
    description: 'Pricing table',
    defaultProps: { plans: [{ name: 'Basic', price: '$9', features: ['Feature 1'] }] }
  },
  
  // Navigation Elements
  {
    id: 'navbar',
    name: 'Navbar',
    icon: Bars3Icon,
    category: 'Navigation',
    description: 'Navigation menu',
    defaultProps: { links: ['Home', 'About', 'Contact'], logo: '' }
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    icon: ChevronRightIcon,
    category: 'Navigation',
    description: 'Breadcrumb navigation',
    defaultProps: { items: ['Home', 'Category', 'Page'] }
  },
  {
    id: 'pagination',
    name: 'Pagination',
    icon: ChevronLeftIcon,
    category: 'Navigation',
    description: 'Page navigation',
    defaultProps: { currentPage: 1, totalPages: 5 }
  },
  
  // Social Elements
  {
    id: 'social',
    name: 'Social',
    icon: ShareIcon,
    category: 'Social',
    description: 'Social media links',
    defaultProps: { platforms: ['facebook', 'twitter', 'instagram'], size: 'medium' }
  },
  {
    id: 'share',
    name: 'Share',
    icon: ShareIcon,
    category: 'Social',
    description: 'Share buttons',
    defaultProps: { platforms: ['facebook', 'twitter', 'linkedin'] }
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: EnvelopeIcon,
    category: 'Social',
    description: 'Email signup form',
    defaultProps: { title: 'Subscribe', placeholder: 'Enter email...' }
  }
]

interface LookerStudioEditorProps {
  page?: ContentPage
  onSave: (page: ContentPage) => Promise<void>
  onCancel: () => void
  onPublish?: (page: ContentPage) => Promise<void>
  onPreview?: (page: ContentPage) => void
  onDuplicate?: (page: ContentPage) => Promise<void>
}


// Property Panel Component
const PropertyPanel: React.FC<{
  selectedComponent: ContentComponent | null
  onUpdate: (id: string, updates: Partial<ContentComponent>) => void
}> = ({ selectedComponent, onUpdate }) => {
  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
        <div className="text-center text-gray-500 py-8">
          <Cog6ToothIcon className="h-12 w-12 mx-auto mb-2" />
          <p>Select a component to edit its properties</p>
        </div>
      </div>
    )
  }

  const updateProp = (key: string, value: any) => {
    onUpdate(selectedComponent.id, {
      props: { ...selectedComponent.props, [key]: value }
    })
  }

  const renderPropertyControls = () => {
    const props = selectedComponent.props || {}
    
    switch (selectedComponent.type) {
      case 'text':
      case 'heading':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={props.content || ''}
                onChange={(e) => updateProp('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded-md flex items-start gap-2">
              <LightBulbIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p>Use the toolbar above to adjust styling (font size, colors, alignment, etc.)</p>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={props.src || ''}
                onChange={(e) => updateProp('src', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
              <input
                type="text"
                value={props.alt || ''}
                onChange={(e) => updateProp('alt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded-md flex items-start gap-2">
              <LightBulbIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p>Use the toolbar above to adjust styling (size, effects, borders, etc.)</p>
            </div>
          </div>
        )

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={props.text || ''}
                onChange={(e) => updateProp('text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
              <input
                type="url"
                value={props.href || ''}
                onChange={(e) => updateProp('href', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded-md flex items-start gap-2">
              <LightBulbIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p>Use the toolbar above to adjust styling (colors, size, effects, etc.)</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <p>No content properties available for this component type</p>
            </div>
            <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded-md flex items-start gap-2">
              <LightBulbIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p>Use the toolbar above to adjust styling and effects</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-3 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Properties</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Component Type</label>
          <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-600">
            {selectedComponent.type}
          </div>
        </div>
        {renderPropertyControls()}
      </div>
    </div>
  )
}

// Main Looker Studio Editor Component
export const LookerStudioEditor: React.FC<LookerStudioEditorProps> = ({
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
    route: '',
    type: 'marketing',
    status: 'draft',
    components: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const [selectedDevice, setSelectedDevice] = useState<keyof typeof DEVICE_TYPES>('desktop')
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [history, setHistory] = useState<ContentPage[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Routes for assignment
  const [routes, setRoutes] = useState<string[]>([])
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:3001'
        const res = await fetch(`${base}/api/mobile/routes`)
        const data = await res.json()
        setRoutes(data.routes || [])
      } catch {
        setRoutes([])
      }
    }
    loadRoutes()
  }, [])

  // Helper functions for default dimensions
  const getDefaultWidth = (type: string): number => {
    const widthMap: Record<string, number> = {
      'image': 300,
      'video': 400,
      'gallery': 350,
      'iframe': 400,
      'button': 150,
      'container': 300,
      'form': 300,
      'accordion': 300,
      'tabs': 300,
      'columns': 400,
      'card': 250,
      'hero': 500,
      'table': 400,
      'code': 400,
      'timeline': 350,
      'faq': 350,
      'testimonial': 300,
      'pricing': 300,
      'navbar': 500,
      'newsletter': 300
    }
    return widthMap[type] || 200
  }

  const getDefaultHeight = (type: string): number => {
    const heightMap: Record<string, number> = {
      'image': 200,
      'video': 225,
      'gallery': 200,
      'iframe': 300,
      'button': 40,
      'container': 100,
      'form': 200,
      'accordion': 150,
      'tabs': 120,
      'columns': 150,
      'card': 120,
      'hero': 300,
      'table': 200,
      'code': 150,
      'timeline': 200,
      'faq': 180,
      'testimonial': 120,
      'pricing': 250,
      'navbar': 60,
      'newsletter': 100
    }
    return heightMap[type] || 100
  }

  // History management
  const saveToHistory = useCallback((newContent: ContentPage) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setContent(history[historyIndex - 1])
    }
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setContent(history[historyIndex + 1])
    }
  }, [historyIndex, history])

  // Component management
  const addComponent = useCallback((type: string, x?: number, y?: number) => {
    const componentType = COMPONENT_TYPES.find(ct => ct.id === type)
    if (!componentType) return

    const newComponent: ContentComponent = {
      id: uuidv4(),
      type: type,
      props: {
        ...componentType.defaultProps,
        x: typeof x === 'number' ? Math.max(0, Math.floor(x)) : 50,
        y: typeof y === 'number' ? Math.max(0, Math.floor(y)) : 50,
        width: getDefaultWidth(type),
        height: getDefaultHeight(type)
      },
      order: content.components.length
    }

    const newContent = {
      ...content,
      components: [...content.components, newComponent],
      updatedAt: new Date().toISOString()
    }

    setContent(newContent)
    saveToHistory(newContent)
    setSelectedComponent(newComponent.id)
  }, [content, saveToHistory])

  // DnD from sidebar → canvas
  const handleDragStart = useCallback((e: React.DragEvent, componentTypeId: string) => {
    e.dataTransfer.setData('text/plain', componentTypeId)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handleDragOverCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDropOnCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('text/plain')
    if (!type || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scale = zoom / 100
    const localX = (e.clientX - rect.left) / scale
    const localY = (e.clientY - rect.top) / scale

    // Constrain within canvas bounds
    const x = Math.max(0, Math.min(localX, rect.width / scale))
    const y = Math.max(0, Math.min(localY, rect.height / scale))

    addComponent(type, x, y)
  }, [addComponent, zoom])

  const updateComponent = useCallback((id: string, updates: Partial<ContentComponent>) => {
    const newContent = {
      ...content,
      components: content.components.map(comp =>
        comp.id === id ? { ...comp, ...updates } : comp
      ),
      updatedAt: new Date().toISOString()
    }
    setContent(newContent)
    saveToHistory(newContent)
  }, [content, saveToHistory])

  const deleteComponent = useCallback((id: string) => {
    const newContent = {
      ...content,
      components: content.components.filter(comp => comp.id !== id),
      updatedAt: new Date().toISOString()
    }
    setContent(newContent)
    saveToHistory(newContent)
    setSelectedComponent(null)
  }, [content, saveToHistory])

  // Event handlers
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(content)
      setShowSuccessMessage('Content saved successfully!')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (onPublish) {
      setIsPublishing(true)
      try {
        await onPublish({ ...content, status: 'published' })
        setShowSuccessMessage('Content published successfully!')
        setTimeout(() => setShowSuccessMessage(null), 3000)
      } catch (error) {
        console.error('Publish failed:', error)
      } finally {
        setIsPublishing(false)
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

  const handleCanvasClick = () => {
    setSelectedComponent(null)
  }

  const selectedComponentData = content.components.find(c => c.id === selectedComponent) || null
  
  // Debug log for selection
  React.useEffect(() => {
    console.log('Selected component:', selectedComponent, 'Data:', selectedComponentData)
  }, [selectedComponent, selectedComponentData])

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5" />
            <span>{showSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {content.id ? 'Edit Content' : 'Create New Content'}
            </h1>
            <p className="text-sm text-gray-500">
              {content.title || 'Untitled Content'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Device Selection */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {Object.entries(DEVICE_TYPES).map(([key, device]) => {
              const IconComponent = device.icon
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDevice(key as keyof typeof DEVICE_TYPES)}
                  className={`p-2 rounded-md transition-colors ${
                    selectedDevice === key
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title={device.name}
                >
                  <IconComponent className="h-5 w-5" />
                </button>
              )
            })}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-md"
            >
              <MagnifyingGlassMinusIcon className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm text-gray-600 min-w-[3rem] text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-md"
            >
              <MagnifyingGlassPlusIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Undo/Redo Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
              title="Undo"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
              title="Redo"
            >
              <ArrowUturnRightIcon className="h-4 w-4" />
            </button>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-md transition-colors ${
                showGrid ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Toggle Grid"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-2 rounded-md transition-colors ${
                snapToGrid ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Snap to Grid"
            >
              <ArrowsPointingInIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-2 ml-4">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              content.status === 'published' 
                ? 'bg-green-100 text-green-800' 
                : content.status === 'draft'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {content.status === 'published' ? 'Published' : 
               content.status === 'draft' ? 'Draft' : 
               'Unpublished'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            {onPreview && (
              <button
                onClick={handlePreview}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <EyeIcon className="h-4 w-4 mr-2 inline" />
                Preview
              </button>
            )}
            
            {onDuplicate && content.id && (
              <button
                onClick={handleDuplicate}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <DuplicateIcon className="h-4 w-4 mr-2 inline" />
                Duplicate
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={isSaving || isPublishing}
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
                disabled={isSaving || isPublishing}
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

      <div className="flex-1 flex overflow-hidden">
        {/* Component Library Sidebar */}
        <div className="w-80 min-w-[20rem] shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Elements</h2>
              <span className="text-sm text-gray-500">{COMPONENT_TYPES.length} elements</span>
            </div>
            
            {Object.entries(
              COMPONENT_TYPES.reduce((acc, component) => {
                if (!acc[component.category]) {
                  acc[component.category] = []
                }
                acc[component.category].push(component)
                return acc
              }, {} as Record<string, typeof COMPONENT_TYPES>)
            ).map(([category, components]) => (
              <div key={category} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{category}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {components.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {components.map((component) => {
                    const IconComponent = component.icon
                    return (
                      <button
                        key={component.id}
                        onClick={() => addComponent(component.id)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, component.id)}
                        className="flex flex-col items-center p-2 text-center hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded-lg transition-all duration-200 group"
                        title={component.description}
                      >
                        <div className="flex-shrink-0 mb-1">
                          <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-900 group-hover:text-blue-900 block leading-tight">
                            {component.name}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            
            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    // Add multiple components at once
                    addComponent('heading')
                    setTimeout(() => addComponent('text'), 100)
                    setTimeout(() => addComponent('button'), 200)
                  }}
                  className="flex items-center space-x-3 p-3 text-left hover:bg-green-50 hover:border-green-200 border border-transparent rounded-lg transition-all duration-200 group"
                >
                  <PlusIcon className="h-5 w-5 text-gray-600 group-hover:text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-green-900 block">
                      Add Hero Section
                    </span>
                    <p className="text-xs text-gray-500 group-hover:text-green-600">
                      Heading + Text + Button
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    addComponent('container')
                    setTimeout(() => addComponent('image'), 100)
                    setTimeout(() => addComponent('text'), 200)
                  }}
                  className="flex items-center space-x-3 p-3 text-left hover:bg-purple-50 hover:border-purple-200 border border-transparent rounded-lg transition-all duration-200 group"
                >
                  <PhotoIcon className="h-5 w-5 text-gray-600 group-hover:text-purple-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-purple-900 block">
                      Add Image Block
                    </span>
                    <p className="text-xs text-gray-500 group-hover:text-purple-600">
                      Container + Image + Text
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {DEVICE_TYPES[selectedDevice].name} ({DEVICE_TYPES[selectedDevice].width} × {DEVICE_TYPES[selectedDevice].height})
                </span>
                <span className="text-sm text-gray-500">
                  {content.components.length} components
                </span>
                {/* Route selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Route:</span>
                  <select
                    value={(content as any).route || ''}
                    onChange={(e) => setContent({ ...content, route: e.target.value as any })}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">No Route</option>
                    {routes.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {selectedComponent ? 'Component selected' : 'Click to select component'}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-gray-100">
            <div className="flex justify-center">
              <div
                ref={canvasRef}
                className="relative bg-white shadow-lg"
                style={{
                  width: DEVICE_TYPES[selectedDevice].width,
                  height: DEVICE_TYPES[selectedDevice].height,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  backgroundImage: showGrid 
                    ? `radial-gradient(circle, #E5E7EB 1px, transparent 1px)`
                    : 'none',
                  backgroundSize: '20px 20px'
                }}
                onClick={handleCanvasClick}
                onDragOver={handleDragOverCanvas}
                onDrop={handleDropOnCanvas}
              >
                {content.components.map((component) => (
                  <DraggableComponent
                    key={component.id}
                    component={component}
                    isSelected={selectedComponent === component.id}
                    onSelect={setSelectedComponent}
                    onUpdate={updateComponent}
                    onDelete={deleteComponent}
                    deviceType={selectedDevice}
                    gridSize={gridSize}
                    snapToGrid={snapToGrid}
                  />
                ))}
                
                {content.components.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Start building your content</h3>
                      <p className="text-sm">Drag components from the sidebar to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Property Panel */}
        {selectedComponentData ? (
          <PropertyPanel
            selectedComponent={selectedComponentData}
            onUpdate={updateComponent}
          />
        ) : (
          <div className="w-80 shrink-0 bg-white border-l border-gray-200 flex items-center justify-center text-gray-400">
            {/* Placeholder when no selection */}
            <div className="text-center">
              <Cog6ToothIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">Select a component to edit its properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
