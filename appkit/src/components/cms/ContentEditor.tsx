'use client'

import React, { useState, useCallback, useRef } from 'react'
// import { DndProvider, useDrag, useDrop } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
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
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  LinkIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { VersionControl } from './VersionControl'

// Component Types
interface ContentComponent {
  id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'container' | 'button' | 'spacer'
  props: Record<string, any>
  children?: ContentComponent[]
  order: number
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
}

// Enhanced Component Library with Groups
const COMPONENT_GROUPS = [
  {
    name: 'Basic Elements',
    components: [
      { type: 'text', icon: DocumentTextIcon, label: 'Text Block', description: 'Rich text content' },
      { type: 'heading', icon: DocumentTextIcon, label: 'Heading', description: 'Page headings (H1-H6)' },
      { type: 'paragraph', icon: DocumentTextIcon, label: 'Paragraph', description: 'Text paragraph' },
      { type: 'list', icon: DocumentTextIcon, label: 'List', description: 'Bulleted or numbered list' },
      { type: 'quote', icon: DocumentTextIcon, label: 'Quote', description: 'Blockquote with citation' },
    ]
  },
  {
    name: 'Media',
    components: [
      { type: 'image', icon: PhotoIcon, label: 'Image', description: 'Image with caption' },
      { type: 'gallery', icon: PhotoIcon, label: 'Image Gallery', description: 'Multiple images in grid' },
      { type: 'video', icon: VideoCameraIcon, label: 'Video', description: 'Video player' },
      { type: 'audio', icon: SpeakerWaveIcon, label: 'Audio', description: 'Audio player' },
      { type: 'carousel', icon: PhotoIcon, label: 'Carousel', description: 'Image/video carousel' },
    ]
  },
  {
    name: 'Interactive',
    components: [
      { type: 'button', icon: RectangleStackIcon, label: 'Button', description: 'Call-to-action button' },
      { type: 'link', icon: DocumentTextIcon, label: 'Link', description: 'Text or image link' },
      { type: 'form', icon: DocumentTextIcon, label: 'Form', description: 'Contact or signup form' },
      { type: 'accordion', icon: DocumentTextIcon, label: 'Accordion', description: 'Collapsible content' },
      { type: 'tabs', icon: DocumentTextIcon, label: 'Tabs', description: 'Tabbed content' },
    ]
  },
  {
    name: 'Layout',
    components: [
      { type: 'container', icon: RectangleStackIcon, label: 'Container', description: 'Layout container' },
      { type: 'row', icon: RectangleStackIcon, label: 'Row', description: 'Horizontal layout row' },
      { type: 'column', icon: RectangleStackIcon, label: 'Column', description: 'Vertical layout column' },
      { type: 'grid', icon: RectangleStackIcon, label: 'Grid', description: 'CSS Grid layout' },
      { type: 'spacer', icon: RectangleStackIcon, label: 'Spacer', description: 'Vertical spacing' },
      { type: 'divider', icon: DocumentTextIcon, label: 'Divider', description: 'Horizontal line separator' },
    ]
  },
  {
    name: 'Content Blocks',
    components: [
      { type: 'card', icon: RectangleStackIcon, label: 'Card', description: 'Content card with header/body' },
      { type: 'hero', icon: PhotoIcon, label: 'Hero Section', description: 'Large banner with CTA' },
      { type: 'testimonial', icon: DocumentTextIcon, label: 'Testimonial', description: 'Customer testimonial' },
      { type: 'pricing', icon: DocumentTextIcon, label: 'Pricing Table', description: 'Pricing comparison' },
      { type: 'faq', icon: DocumentTextIcon, label: 'FAQ', description: 'Frequently asked questions' },
    ]
  },
  {
    name: 'Social & Marketing',
    components: [
      { type: 'social_links', icon: DocumentTextIcon, label: 'Social Links', description: 'Social media links' },
      { type: 'newsletter', icon: DocumentTextIcon, label: 'Newsletter Signup', description: 'Email subscription' },
      { type: 'countdown', icon: DocumentTextIcon, label: 'Countdown Timer', description: 'Event countdown' },
      { type: 'badge', icon: RectangleStackIcon, label: 'Badge', description: 'Status or achievement badge' },
      { type: 'progress', icon: DocumentTextIcon, label: 'Progress Bar', description: 'Progress indicator' },
    ]
  }
]

// Individual Component Editors
const TextEditor: React.FC<{ component: ContentComponent; onUpdate: (props: any) => void }> = ({ component, onUpdate }) => {
  const [content, setContent] = useState(component.props.content || '')
  const [fontSize, setFontSize] = useState(component.props.fontSize || 16)
  const [color, setColor] = useState(component.props.color || '#000000')
  const [alignment, setAlignment] = useState(component.props.alignment || 'left')

  const handleUpdate = () => {
    onUpdate({ content, fontSize, color, alignment })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <h4 className="font-semibold">Text Block Settings</h4>
      
      <div>
        <label className="block text-sm font-medium mb-2">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleUpdate}
          className="w-full p-2 border rounded"
          rows={4}
          placeholder="Enter text content..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Font Size</label>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            onBlur={handleUpdate}
            className="w-full p-2 border rounded"
            min="8"
            max="72"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            onBlur={handleUpdate}
            className="w-full h-10 border rounded"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Alignment</label>
          <select
            value={alignment}
            onChange={(e) => setAlignment(e.target.value)}
            onBlur={handleUpdate}
            className="w-full p-2 border rounded"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>
      </div>
    </div>
  )
}

const ImageEditor: React.FC<{ component: ContentComponent; onUpdate: (props: any) => void }> = ({ component, onUpdate }) => {
  const [src, setSrc] = useState(component.props.src || '')
  const [alt, setAlt] = useState(component.props.alt || '')
  const [caption, setCaption] = useState(component.props.caption || '')
  const [width, setWidth] = useState(component.props.width || 100)

  const handleUpdate = () => {
    onUpdate({ src, alt, caption, width })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <h4 className="font-semibold">Image Settings</h4>
      
      <div>
        <label className="block text-sm font-medium mb-2">Image URL</label>
        <input
          type="url"
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          onBlur={handleUpdate}
          className="w-full p-2 border rounded"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Alt Text</label>
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onBlur={handleUpdate}
          className="w-full p-2 border rounded"
          placeholder="Describe the image"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Caption</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={handleUpdate}
          className="w-full p-2 border rounded"
          placeholder="Image caption"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Width (%)</label>
        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          onBlur={handleUpdate}
          className="w-full p-2 border rounded"
          min="10"
          max="100"
        />
      </div>
    </div>
  )
}

const ButtonEditor: React.FC<{ component: ContentComponent; onUpdate: (props: any) => void }> = ({ component, onUpdate }) => {
  const [text, setText] = useState(component.props.text || 'Click Me')
  const [action, setAction] = useState(component.props.action || '')
  const [style, setStyle] = useState(component.props.style || 'primary')
  const [size, setSize] = useState(component.props.size || 'medium')

  const handleUpdate = () => {
    onUpdate({ text, action, style, size })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <h4 className="font-semibold">Button Settings</h4>
      
      <div>
        <label className="block text-sm font-medium mb-2">Button Text</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleUpdate}
          className="w-full p-2 border rounded"
          placeholder="Button text"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Action</label>
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onBlur={handleUpdate}
          className="w-full p-2 border rounded"
          placeholder="URL or action"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            onBlur={handleUpdate}
            className="w-full p-2 border rounded"
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            onBlur={handleUpdate}
            className="w-full p-2 border rounded"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// Component Library Item
const ComponentLibraryItem: React.FC<{ 
  componentType: any
  onAddComponent: (type: string) => void 
}> = ({ componentType, onAddComponent }) => {
  return (
    <div
      onClick={() => onAddComponent(componentType.type)}
      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-center"
    >
      <componentType.icon className="h-6 w-6 text-gray-600 mx-auto mb-1" />
      <div className="font-medium text-xs leading-tight">{componentType.label}</div>
    </div>
  )
}

// Content Canvas Area
const CanvasArea: React.FC<{
  components: ContentComponent[]
  onUpdateComponents: (components: ContentComponent[]) => void
  selectedComponent: ContentComponent | null
  onSelectComponent: (component: ContentComponent | null) => void
  previewMode: boolean
  previewDevice: 'web' | 'mobile'
  onAddComponent: (type: string) => void
}> = ({ components, onUpdateComponents, selectedComponent, onSelectComponent, previewMode, previewDevice, onAddComponent }) => {
  const updateComponent = (id: string, props: any) => {
    const newComponents = components.map(comp =>
      comp.id === id ? { ...comp, props: { ...comp.props, ...props } } : comp
    )
    onUpdateComponents(newComponents)
  }

  const deleteComponent = (id: string) => {
    onUpdateComponents(components.filter(comp => comp.id !== id))
    if (selectedComponent?.id === id) {
      onSelectComponent(null)
    }
  }

  const moveComponentUp = (index: number) => {
    if (index > 0) {
      const newComponents = [...components]
      const [moved] = newComponents.splice(index, 1)
      newComponents.splice(index - 1, 0, moved)
      newComponents.forEach((c, i) => { c.order = i })
      onUpdateComponents(newComponents)
    }
  }

  const moveComponentDown = (index: number) => {
    if (index < components.length - 1) {
      const newComponents = [...components]
      const [moved] = newComponents.splice(index, 1)
      newComponents.splice(index + 1, 0, moved)
      newComponents.forEach((c, i) => { c.order = i })
      onUpdateComponents(newComponents)
    }
  }

  const getCanvasClasses = () => {
    return previewMode 
      ? 'relative overflow-hidden bg-white min-h-screen'
      : 'border-2 border-dashed rounded-lg transition-colors bg-white min-h-screen border-gray-300'
  }

  return (
    <div
      className={getCanvasClasses()}
      style={previewMode ? { 
        width: previewDevice === 'mobile' ? '375px' : '100%',
        minHeight: previewDevice === 'mobile' ? '667px' : '600px'
      } : {}}
    >
      {previewMode && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {previewDevice === 'mobile' ? (
              <span className="flex items-center gap-1">
                <DevicePhoneMobileIcon className="w-4 h-4" />
                Mobile Preview
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ComputerDesktopIcon className="w-4 h-4" />
                Web Preview
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className={previewMode ? 'p-4' : 'space-y-4'}>
        {components.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No components added yet</p>
            <p className="text-sm">Click on components from the left panel to add them to your content</p>
          </div>
        ) : (
          <div className="space-y-4">
            {components
              .sort((a, b) => a.order - b.order)
              .map((component, index) => (
                <div key={component.id} className="relative group">
                  {!previewMode && (
                    <div className="absolute -left-12 top-0 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveComponentUp(index)}
                        disabled={index === 0}
                        className="p-1 bg-white border rounded shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveComponentDown(index)}
                        disabled={index === components.length - 1}
                        className="p-1 bg-white border rounded shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <CanvasComponent
                    component={component}
                    index={index}
                    isSelected={selectedComponent?.id === component.id}
                    onSelect={() => onSelectComponent(component)}
                    onUpdate={(props) => updateComponent(component.id, props)}
                    onDelete={() => deleteComponent(component.id)}
                    onMove={() => {}} // No-op for compatibility
                    previewMode={previewMode}
                    previewDevice={previewDevice}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}


// (Flow drop zones removed for pure freeform)

// Individual Canvas Component
const CanvasComponent: React.FC<{
  component: ContentComponent
  index: number
  isSelected: boolean
  onSelect: () => void
  onUpdate: (props: any) => void
  onDelete: () => void
  onMove: (dragIndex: number, hoverIndex: number) => void
  previewMode: boolean
  previewDevice: 'web' | 'mobile'
}> = ({ component, index, isSelected, onSelect, onUpdate, onDelete, onMove, previewMode, previewDevice }) => {

  const renderComponent = () => {
    const getResponsiveStyle = () => {
      if (previewMode && previewDevice === 'mobile') {
        return { fontSize: Math.max((component.props.fontSize || 16) * 0.8, 12) }
      }
      return {}
    }

    switch (component.type as any) {
      // Basic Elements
      case 'text':
        return (
          <div
            style={{
              fontSize: component.props.fontSize || 16,
              color: component.props.color || '#000000',
              textAlign: component.props.alignment || 'left',
              ...getResponsiveStyle()
            }}
          >
            {component.props.content || 'Click to edit text...'}
          </div>
        )
      case 'heading':
        const HeadingTag = component.props.level || 'h2'
        return (
          <HeadingTag
            style={{
              fontSize: component.props.fontSize || 24,
              color: component.props.color || '#1f2937',
              textAlign: component.props.alignment || 'left',
              margin: '0 0 16px 0',
              ...getResponsiveStyle()
            }}
          >
            {component.props.content || 'New Heading'}
          </HeadingTag>
        )
      case 'paragraph':
        return (
          <p
            style={{
              fontSize: component.props.fontSize || 16,
              color: component.props.color || '#374151',
              textAlign: component.props.alignment || 'left',
              lineHeight: 1.6,
              margin: '0 0 16px 0',
              ...getResponsiveStyle()
            }}
          >
            {component.props.content || 'New paragraph text...'}
          </p>
        )
      case 'list':
        const ListTag = component.props.type === 'number' ? 'ol' : 'ul'
        return (
          <ListTag
            style={{
              fontSize: component.props.fontSize || 16,
              color: component.props.color || '#374151',
              paddingLeft: '20px',
              ...getResponsiveStyle()
            }}
          >
            {(component.props.items || ['Item 1', 'Item 2', 'Item 3']).map((item: string, idx: number) => (
              <li key={idx}>{item}</li>
            ))}
          </ListTag>
        )
      case 'quote':
        return (
          <blockquote
            style={{
              fontSize: component.props.fontSize || 18,
              color: component.props.color || '#6b7280',
              fontStyle: 'italic',
              borderLeft: '4px solid #e5e7eb',
              paddingLeft: '16px',
              margin: '16px 0',
              ...getResponsiveStyle()
            }}
          >
            <p>"{component.props.content || 'This is a quote'}"</p>
            {component.props.author && (
              <cite style={{ fontSize: '14px', color: '#9ca3af' }}>
                — {component.props.author}
              </cite>
            )}
          </blockquote>
        )

      // Media
      case 'image':
        return (
          <div className="text-center">
            {component.props.src ? (
              <img
                src={component.props.src}
                alt={component.props.alt || ''}
                style={{ 
                  width: `${component.props.width || 100}%`,
                  maxWidth: previewDevice === 'mobile' ? '100%' : 'none'
                }}
                className="mx-auto rounded"
              />
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                <PhotoIcon className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-gray-500">No image selected</span>
              </div>
            )}
            {component.props.caption && (
              <p className="text-sm text-gray-600 mt-2">{component.props.caption}</p>
            )}
          </div>
        )
      case 'gallery':
        return (
          <div className="grid gap-4" style={{ 
            gridTemplateColumns: `repeat(${Math.min(component.props.columns || 3, previewDevice === 'mobile' ? 2 : 4)}, 1fr)` 
          }}>
            {(component.props.images || []).length > 0 ? (
              component.props.images.map((img: any, idx: number) => (
                <div key={idx} className="relative">
                  <img src={img.src} alt={img.alt} className="w-full h-32 object-cover rounded" />
                  {component.props.showCaptions && img.caption && (
                    <p className="text-xs text-gray-600 mt-1">{img.caption}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <PhotoIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No images in gallery</p>
              </div>
            )}
          </div>
        )
      case 'video':
        return (
          <div className="text-center">
            {component.props.src ? (
              <video
                src={component.props.src}
                poster={component.props.poster}
                controls={component.props.controls}
                autoPlay={component.props.autoplay}
                style={{ width: `${component.props.width || 100}%` }}
                className="rounded"
              />
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                <VideoCameraIcon className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-gray-500">No video selected</span>
              </div>
            )}
          </div>
        )
      case 'audio':
        return (
          <div className="text-center">
            {component.props.src ? (
              <div className="bg-gray-100 p-4 rounded">
                <audio src={component.props.src} controls className="w-full" />
                {component.props.title && (
                  <p className="text-sm font-medium mt-2">{component.props.title}</p>
                )}
                {component.props.artist && (
                  <p className="text-xs text-gray-600">{component.props.artist}</p>
                )}
              </div>
            ) : (
              <div className="w-full h-16 bg-gray-200 rounded flex items-center justify-center">
                <SpeakerWaveIcon className="h-6 w-6 text-gray-400" />
                <span className="ml-2 text-gray-500">No audio selected</span>
              </div>
            )}
          </div>
        )

      // Interactive
      case 'button':
        return (
          <button
            className={`btn btn-${component.props.style || 'primary'} btn-${component.props.size || 'medium'}`}
            onClick={() => {
              if (component.props.action) {
                window.open(component.props.action, '_blank')
              }
            }}
          >
            {component.props.text || 'Click Me'}
          </button>
        )
      case 'link':
        return (
          <a
            href={component.props.url || '#'}
            target={component.props.target || '_self'}
            className={`link-${component.props.style || 'default'}`}
            style={{ textDecoration: 'none' }}
          >
            {component.props.text || 'Link Text'}
          </a>
        )
      case 'form':
        return (
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-3">{component.props.title || 'Contact Form'}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Name" className="w-full p-2 border rounded" />
              <input type="email" placeholder="Email" className="w-full p-2 border rounded" />
              <textarea placeholder="Message" className="w-full p-2 border rounded h-20"></textarea>
              <button className="btn btn-primary">
                {component.props.submitText || 'Submit'}
              </button>
            </div>
          </div>
        )

      // Layout
      case 'container':
        return (
          <div
            style={{
              backgroundColor: component.props.backgroundColor || 'transparent',
              padding: `${component.props.padding || 16}px`,
              margin: `${component.props.margin || 0}px`,
              borderRadius: `${component.props.borderRadius || 0}px`,
              border: '1px dashed #e5e7eb'
            }}
          >
            {component.children && component.children.length > 0 ? (
              component.children
                .sort((a, b) => a.order - b.order)
                .map((child) => (
                  <CanvasComponent
                    key={child.id}
                    component={child}
                    index={0}
                    isSelected={false}
                    onSelect={() => {}}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                    onMove={() => {}}
                    previewMode={previewMode}
                    previewDevice={previewDevice}
                  />
                ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                Container - Add components here
              </div>
            )}
          </div>
        )
      case 'spacer':
        return (
          <div 
            style={{ 
              height: component.props.height || 20,
              backgroundColor: previewMode ? 'transparent' : '#f3f4f6',
              borderRadius: '4px'
            }} 
          />
        )
      case 'divider':
        return (
          <hr
            style={{
              border: 'none',
              borderTop: `${component.props.thickness || 1}px ${component.props.style || 'solid'} ${component.props.color || '#e5e7eb'}`,
              width: `${component.props.width || 100}%`,
              margin: '16px 0'
            }}
          />
        )

      // Content Blocks
      case 'card':
        return (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {component.props.image && (
              <img src={component.props.image} alt="" className="w-full h-32 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{component.props.title || 'Card Title'}</h3>
              <p className="text-gray-600">{component.props.content || 'Card content...'}</p>
            </div>
          </div>
        )
      case 'hero':
        return (
          <div 
            className="relative bg-gray-900 text-white rounded-lg overflow-hidden"
            style={{ minHeight: '300px' }}
          >
            {component.props.image && (
              <img 
                src={component.props.image} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover opacity-50" 
              />
            )}
            <div className="relative z-10 p-8 text-center">
              <h1 className="text-4xl font-bold mb-4">{component.props.title || 'Hero Title'}</h1>
              <p className="text-xl mb-6">{component.props.subtitle || 'Hero subtitle'}</p>
              {component.props.ctaText && (
                <button className="btn btn-primary btn-lg">
                  {component.props.ctaText}
                </button>
              )}
            </div>
          </div>
        )
      case 'testimonial':
        return (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <div className="text-2xl text-gray-400 mb-4">"</div>
            <p className="text-lg italic mb-4">{component.props.quote || 'Great product!'}</p>
            <div className="flex items-center justify-center">
              {component.props.avatar && (
                <img src={component.props.avatar} alt="" className="w-12 h-12 rounded-full mr-3" />
              )}
              <div>
                <p className="font-semibold">{component.props.author || 'John Doe'}</p>
                <p className="text-sm text-gray-600">{component.props.role || 'Customer'}</p>
              </div>
            </div>
            {component.props.rating && (
              <div className="mt-2 flex">
                {[...Array(5)].map((_, i) => (
                  i < component.props.rating ? (
                    <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <StarIcon key={i} className="w-4 h-4 text-gray-300" />
                  )
                ))}
              </div>
            )}
          </div>
        )

      // Social & Marketing
      case 'social_links':
        return (
          <div className="flex justify-center space-x-4">
            {(component.props.platforms || ['facebook', 'twitter', 'instagram']).map((platform: string) => (
              <a key={platform} href="#" className="text-gray-600 hover:text-gray-900">
                <LinkIcon className="w-6 h-6" />
              </a>
            ))}
          </div>
        )
      case 'newsletter':
        return (
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <h3 className="font-semibold text-lg mb-2">{component.props.title || 'Subscribe to Newsletter'}</h3>
            <div className="flex gap-2 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder={component.props.placeholder || 'Enter email'} 
                className="flex-1 p-2 border rounded"
              />
              <button className="btn btn-primary">
                {component.props.buttonText || 'Subscribe'}
              </button>
            </div>
          </div>
        )
      case 'badge':
        return (
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              component.props.style === 'pill' ? 'rounded-full' : 'rounded'
            }`}
            style={{ 
              backgroundColor: component.props.color || '#dc2626',
              color: 'white'
            }}
          >
            {component.props.text || 'New'}
          </span>
        )
      case 'progress':
        return (
          <div className="w-full">
            {component.props.label && (
              <div className="flex justify-between text-sm mb-1">
                <span>{component.props.label}</span>
                {component.props.showPercentage && (
                  <span>{component.props.value || 50}%</span>
                )}
              </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${component.props.value || 50}%`,
                  backgroundColor: component.props.color || '#dc2626'
                }}
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded text-center text-gray-500">
            <p>Unknown component: {component.type}</p>
            <p className="text-sm">Component not implemented yet</p>
          </div>
        )
    }
  }

  return (
    <div
      className={`relative p-4 border-2 rounded-lg transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      {renderComponent()}
      
      {isSelected && !previewMode && (
        <div className="absolute -top-2 -right-2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Helper function for default component props
const getDefaultProps = (type: string) => {
  switch (type) {
    // Basic Elements
    case 'text':
      return { content: 'New text block', fontSize: 16, color: '#000000', alignment: 'left' }
    case 'heading':
      return { content: 'New Heading', level: 'h2', fontSize: 24, color: '#1f2937', alignment: 'left' }
    case 'paragraph':
      return { content: 'New paragraph text...', fontSize: 16, color: '#374151', alignment: 'left' }
    case 'list':
      return { items: ['Item 1', 'Item 2', 'Item 3'], type: 'bullet', fontSize: 16, color: '#374151' }
    case 'quote':
      return { content: 'This is a quote', author: 'Author Name', fontSize: 18, color: '#6b7280' }
    
    // Media
    case 'image':
      return { src: '', alt: '', caption: '', width: 100, aspectRatio: '16/9' }
    case 'gallery':
      return { images: [], columns: 3, spacing: 16, showCaptions: true }
    case 'video':
      return { src: '', poster: '', autoplay: false, controls: true, width: 100 }
    case 'audio':
      return { src: '', title: '', artist: '', controls: true }
    case 'carousel':
      return { items: [], autoplay: false, interval: 5000, showDots: true, showArrows: true }
    
    // Interactive
    case 'button':
      return { text: 'Click Me', action: '', style: 'primary', size: 'medium' }
    case 'link':
      return { text: 'Link Text', url: '', target: '_self', style: 'default' }
    case 'form':
      return { title: 'Contact Form', fields: [], submitText: 'Submit', action: '' }
    case 'accordion':
      return { items: [{ title: 'Item 1', content: 'Content 1' }], allowMultiple: false }
    case 'tabs':
      return { tabs: [{ title: 'Tab 1', content: 'Content 1' }], activeTab: 0 }
    
    // Layout
    case 'container':
      return { backgroundColor: 'transparent', padding: 16, margin: 0, borderRadius: 0 }
    case 'row':
      return { columns: 2, gap: 16, alignItems: 'stretch', justifyContent: 'flex-start' }
    case 'column':
      return { width: '50%', backgroundColor: 'transparent', padding: 16 }
    case 'grid':
      return { columns: 3, gap: 16, rows: 'auto', template: 'repeat(3, 1fr)' }
    case 'spacer':
      return { height: 20, backgroundColor: 'transparent' }
    case 'divider':
      return { thickness: 1, color: '#e5e7eb', style: 'solid', width: 100 }
    
    // Content Blocks
    case 'card':
      return { title: 'Card Title', content: 'Card content...', image: '', style: 'default' }
    case 'hero':
      return { title: 'Hero Title', subtitle: 'Hero subtitle', image: '', ctaText: 'Get Started', ctaAction: '' }
    case 'testimonial':
      return { quote: 'Great product!', author: 'John Doe', role: 'Customer', avatar: '', rating: 5 }
    case 'pricing':
      return { plans: [], currency: '$', period: 'month' }
    case 'faq':
      return { questions: [{ q: 'Question 1?', a: 'Answer 1' }] }
    
    // Social & Marketing
    case 'social_links':
      return { platforms: ['facebook', 'twitter', 'instagram'], style: 'icons', size: 'medium' }
    case 'newsletter':
      return { title: 'Subscribe to Newsletter', placeholder: 'Enter email', buttonText: 'Subscribe' }
    case 'countdown':
      return { targetDate: '', title: 'Event Starting In', showDays: true, showHours: true }
    case 'badge':
      return { text: 'New', color: '#dc2626', size: 'medium', style: 'pill' }
    case 'progress':
      return { value: 50, max: 100, label: 'Progress', showPercentage: true, color: '#dc2626' }
    
    default:
      return {}
  }
}

// Main Content Editor Component
export const ContentEditor: React.FC<{
  page?: ContentPage
  onSave: (page: ContentPage) => void
  onCancel: () => void
}> = ({ page, onSave, onCancel }) => {
  const [currentPage, setCurrentPage] = useState<ContentPage>(
    page || {
      id: '',
      title: '',
      slug: '',
      type: 'marketing',
      status: 'draft',
      components: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  )

  const [selectedComponent, setSelectedComponent] = useState<ContentComponent | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'web' | 'mobile'>('web')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Basic Elements']))
  const [showVersionControl, setShowVersionControl] = useState(false)
  const [lastSavedVersion, setLastSavedVersion] = useState<any>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [layoutMode, setLayoutMode] = useState<'freeform' | 'flow'>('freeform')

  const handleAddComponent = (type: string) => {
    const newComponent: ContentComponent = {
      id: `comp_${Date.now()}`,
      type: type as any,
      props: getDefaultProps(type),
      order: currentPage.components.length,
    }
    setCurrentPage(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }))
    setSelectedComponent(newComponent)
    handleContentChange()
  }

  const handleSave = () => {
    const updatedPage = {
      ...currentPage,
      updatedAt: new Date().toISOString(),
    }
    setLastSavedVersion(updatedPage)
    setHasUnsavedChanges(false)
    onSave(updatedPage)
  }

  const handleRestoreVersion = (version: any) => {
    setCurrentPage(version.content)
    setLastSavedVersion(version.content)
    setHasUnsavedChanges(false)
    setSelectedComponent(null)
  }

  const handleSaveVersion = (description: string) => {
    // This would typically save to the backend
    console.log('Saving version:', description, currentPage)
    setLastSavedVersion(currentPage)
    setHasUnsavedChanges(false)
  }

  const handleContentChange = () => {
    setHasUnsavedChanges(true)
  }

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const renderComponentEditor = () => {
    if (!selectedComponent) return null

    switch (selectedComponent.type) {
      case 'text':
        return <TextEditor component={selectedComponent} onUpdate={(props) => {
          setCurrentPage(prev => ({
            ...prev,
            components: prev.components.map(comp =>
              comp.id === selectedComponent.id ? { ...comp, props: { ...comp.props, ...props } } : comp
            )
          }))
          handleContentChange()
        }} />
      case 'image':
        return <ImageEditor component={selectedComponent} onUpdate={(props) => {
          setCurrentPage(prev => ({
            ...prev,
            components: prev.components.map(comp =>
              comp.id === selectedComponent.id ? { ...comp, props: { ...comp.props, ...props } } : comp
            )
          }))
          handleContentChange()
        }} />
      case 'button':
        return <ButtonEditor component={selectedComponent} onUpdate={(props) => {
          setCurrentPage(prev => ({
            ...prev,
            components: prev.components.map(comp =>
              comp.id === selectedComponent.id ? { ...comp, props: { ...comp.props, ...props } } : comp
            )
          }))
          handleContentChange()
        }} />
      default:
        return <div className="p-4 text-gray-500">No editor available for this component type</div>
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b p-4">
        <h2 className="text-xl font-semibold">
          {page ? 'Edit Content' : 'Create New Content'}
        </h2>
      </div>
      
      <div className="flex-1 p-4">
        <input
          type="text"
          value={currentPage.title}
          onChange={(e) => setCurrentPage(prev => ({ ...prev, title: e.target.value }))}
          className="w-full text-2xl font-bold border-none outline-none mb-4"
          placeholder="Content Title"
        />
        
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
