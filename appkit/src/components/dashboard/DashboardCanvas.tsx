'use client'

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  ChartBarIcon,
  TableCellsIcon,
  CalendarIcon,
  Squares2X2Icon,
  PhotoIcon,
  DocumentTextIcon,
  CloudIcon,
  CogIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  AdjustmentsHorizontalIcon,
  PaintBrushIcon,
  SparklesIcon,
  CubeIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  MapIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { DashboardDraggableWidget } from './DashboardDraggableWidget'
import { StyleToolbar } from '../cms/StyleToolbar'

interface DashboardWidget {
  id: string
  type: string
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
  data?: any
  style?: Record<string, any>
  props?: Record<string, any>
  order?: number
}

interface Dashboard {
  id: string
  name: string
  description: string
  isDefault: boolean
  widgets: DashboardWidget[]
  createdAt: string
  updatedAt: string
}

interface DashboardCanvasProps {
  dashboard: Dashboard
  onSave: (dashboard: Dashboard) => Promise<void>
  onCancel: () => void
  hideSidebar?: boolean
  hideProperties?: boolean
  hideHeader?: boolean
  onWidgetSelect?: (widget: DashboardWidget | null) => void
  selectedWidget?: DashboardWidget | null
}

// Widget Types Configuration
const WIDGET_TYPES = {
  stats: {
    name: 'Statistics',
    icon: Squares2X2Icon,
    description: 'Display key metrics and KPIs',
    defaultSize: { w: 300, h: 200 },
    category: 'Analytics'
  },
  chart: {
    name: 'Chart',
    icon: ChartBarIcon,
    description: 'Visualize data with charts',
    defaultSize: { w: 400, h: 300 },
    category: 'Visualization'
  },
  pieChart: {
    name: 'Pie Chart',
    icon: ChartPieIcon,
    description: 'Display data as pie chart',
    defaultSize: { w: 300, h: 300 },
    category: 'Visualization'
  },
  lineChart: {
    name: 'Line Chart',
    icon: PresentationChartLineIcon,
    description: 'Show trends over time',
    defaultSize: { w: 400, h: 300 },
    category: 'Visualization'
  },
  table: {
    name: 'Data Table',
    icon: TableCellsIcon,
    description: 'Display tabular data',
    defaultSize: { w: 400, h: 350 },
    category: 'Data'
  },
  calendar: {
    name: 'Calendar',
    icon: CalendarIcon,
    description: 'Show calendar events',
    defaultSize: { w: 300, h: 350 },
    category: 'Content'
  },
  gallery: {
    name: 'Image Gallery',
    icon: PhotoIcon,
    description: 'Display image collections',
    defaultSize: { w: 300, h: 300 },
    category: 'Content'
  },
  text: {
    name: 'Text Block',
    icon: DocumentTextIcon,
    description: 'Rich text content',
    defaultSize: { w: 300, h: 150 },
    category: 'Content'
  },
  storage: {
    name: 'Storage Usage',
    icon: CloudIcon,
    description: 'Show storage statistics',
    defaultSize: { w: 250, h: 250 },
    category: 'System'
  },
  map: {
    name: 'Map',
    icon: MapIcon,
    description: 'Interactive maps',
    defaultSize: { w: 400, h: 350 },
    category: 'Visualization'
  },
  clock: {
    name: 'Clock',
    icon: ClockIcon,
    description: 'Time and date display',
    defaultSize: { w: 150, h: 150 },
    category: 'Utility'
  },
  users: {
    name: 'User Stats',
    icon: UserGroupIcon,
    description: 'User activity metrics',
    defaultSize: { w: 250, h: 250 },
    category: 'Analytics'
  },
  revenue: {
    name: 'Revenue',
    icon: CurrencyDollarIcon,
    description: 'Financial metrics',
    defaultSize: { w: 250, h: 200 },
    category: 'Analytics'
  },
  website: {
    name: 'Website Stats',
    icon: GlobeAltIcon,
    description: 'Web analytics',
    defaultSize: { w: 300, h: 250 },
    category: 'Analytics'
  },
  mobile: {
    name: 'Mobile Stats',
    icon: DevicePhoneMobileIcon,
    description: 'Mobile app metrics',
    defaultSize: { w: 250, h: 250 },
    category: 'Analytics'
  },
  desktop: {
    name: 'Desktop Stats',
    icon: ComputerDesktopIcon,
    description: 'Desktop app metrics',
    defaultSize: { w: 250, h: 250 },
    category: 'Analytics'
  }
}

// Widget Library Item
const WidgetLibraryItem: React.FC<{
  type: string
  widgetConfig: typeof WIDGET_TYPES[keyof typeof WIDGET_TYPES]
  onAddWidget: (type: string, config: any) => void
}> = ({ type, widgetConfig, onAddWidget }) => {
  const IconComponent = widgetConfig.icon

  return (
    <div
      onClick={() => onAddWidget(type, widgetConfig)}
      className="p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <IconComponent className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm text-gray-900">{widgetConfig.name}</h4>
          <p className="text-xs text-gray-500">{widgetConfig.description}</p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Canvas Area
const CanvasArea: React.FC<{
  widgets: DashboardWidget[]
  onUpdateWidgets: (widgets: DashboardWidget[]) => void
  selectedWidget: DashboardWidget | null
  onSelectWidget: (widget: DashboardWidget | null) => void
  previewMode: boolean
  previewDevice: 'web' | 'mobile'
  onAddWidget: (type: string) => void
}> = ({ widgets, onUpdateWidgets, selectedWidget, onSelectWidget, previewMode, previewDevice, onAddWidget }) => {
  const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    const newWidgets = widgets.map(widget =>
      widget.id === id ? { ...widget, ...updates } : widget
    )
    onUpdateWidgets(newWidgets)
  }

  const deleteWidget = (id: string) => {
    onUpdateWidgets(widgets.filter(widget => widget.id !== id))
    if (selectedWidget?.id === id) {
      onSelectWidget(null)
    }
  }

  const getCanvasClasses = () => {
    return previewMode
      ? 'relative overflow-hidden bg-white min-h-screen'
      : 'relative overflow-hidden bg-white min-h-screen'
  }

  const handleCanvasClick = () => {
    onSelectWidget(null)
  }

  return (
    <div
      className={getCanvasClasses()}
      style={previewMode ? {
        width: previewDevice === 'mobile' ? '375px' : '100%',
        minHeight: previewDevice === 'mobile' ? '667px' : '600px'
      } : {
        backgroundImage: 'radial-gradient(circle, #E5E7EB 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
      onClick={handleCanvasClick}
    >
      {previewMode && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            {previewDevice === 'mobile' ? '📱 Mobile Preview' : '💻 Web Preview'}
          </div>
        </div>
      )}

      {widgets.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <ChartBarIcon className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Start building your dashboard</h3>
            <p className="text-sm">Click on widgets from the sidebar to get started</p>
          </div>
        </div>
      ) : (
        <>
          {widgets.map((widget) => (
            <DashboardDraggableWidget
              key={widget.id}
              widget={widget}
              isSelected={selectedWidget?.id === widget.id}
              onSelect={(id) => onSelectWidget(widgets.find(w => w.id === id) || null)}
              onUpdate={updateWidget}
              onDelete={deleteWidget}
              deviceType={previewDevice === 'mobile' ? 'mobile' : 'desktop'}
              gridSize={20}
              snapToGrid={!previewMode}
            />
          ))}
        </>
      )}
    </div>
  )
}


// Widget Properties Panel
const WidgetPropertiesPanel: React.FC<{
  widget: DashboardWidget
  onUpdate: (updates: Partial<DashboardWidget>) => void
  onClose: () => void
}> = ({ widget, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'data'>('content')

  const tabs = [
    { id: 'content', name: 'Content', icon: DocumentTextIcon },
    { id: 'style', name: 'Style', icon: PaintBrushIcon },
    { id: 'data', name: 'Data', icon: CubeIcon }
  ]

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Widget Properties</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <IconComponent className="h-4 w-4" />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={widget.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Type
              </label>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                {WIDGET_TYPES[widget.type as keyof typeof WIDGET_TYPES]?.name || widget.type}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={widget.style?.backgroundColor || '#ffffff'}
                onChange={(e) => onUpdate({
                  style: { ...widget.style, backgroundColor: e.target.value }
                })}
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Border Radius
              </label>
              <select
                value={widget.style?.borderRadius || '8px'}
                onChange={(e) => onUpdate({
                  style: { ...widget.style, borderRadius: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="0px">None</option>
                <option value="4px">Small</option>
                <option value="8px">Medium</option>
                <option value="12px">Large</option>
                <option value="16px">Extra Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shadow
              </label>
              <select
                value={widget.style?.boxShadow || 'sm'}
                onChange={(e) => onUpdate({
                  style: { ...widget.style, boxShadow: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <select
                value={widget.config?.dataSource || 'mock'}
                onChange={(e) => onUpdate({
                  config: { ...widget.config, dataSource: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mock">Mock Data</option>
                <option value="api">API Endpoint</option>
                <option value="database">Database</option>
                <option value="file">File Upload</option>
              </select>
            </div>

            {widget.config?.dataSource === 'api' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API URL
                </label>
                <input
                  type="url"
                  value={widget.config?.apiUrl || ''}
                  onChange={(e) => onUpdate({
                    config: { ...widget.config, apiUrl: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://api.example.com/data"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Interval
              </label>
              <select
                value={widget.config?.refreshInterval || 'manual'}
                onChange={(e) => onUpdate({
                  config: { ...widget.config, refreshInterval: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="manual">Manual</option>
                <option value="30s">30 seconds</option>
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="15m">15 minutes</option>
                <option value="1h">1 hour</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Dashboard Canvas Component
export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  dashboard,
  onSave,
  onCancel,
  hideSidebar = false,
  hideProperties = false,
  hideHeader = false,
  onWidgetSelect,
  selectedWidget: externalSelectedWidget
}) => {
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard>(dashboard)
  const [internalSelectedWidget, setInternalSelectedWidget] = useState<DashboardWidget | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'web' | 'mobile'>('web')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Analytics']))
  const [showVersionControl, setShowVersionControl] = useState(false)
  const [lastSavedVersion, setLastSavedVersion] = useState<any>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showProperties, setShowProperties] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  const [showToolbar, setShowToolbar] = useState(false)
  const [clipboardWidget, setClipboardWidget] = useState<DashboardWidget | null>(null)

  // Use external selected widget if provided, otherwise use internal state
  const selectedWidget = externalSelectedWidget !== undefined ? externalSelectedWidget : internalSelectedWidget

  const handleAddWidget = (type: string) => {
    const widgetConfig = WIDGET_TYPES[type as keyof typeof WIDGET_TYPES]
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type: type,
      title: `New ${widgetConfig.name}`,
      position: { x: 0, y: 0, w: widgetConfig.defaultSize.w, h: widgetConfig.defaultSize.h },
      config: {},
      style: {},
      props: {},
      order: currentDashboard.widgets.length
    }
    setCurrentDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }))
    if (onWidgetSelect) {
      onWidgetSelect(newWidget)
    } else {
      setInternalSelectedWidget(newWidget)
    }
    setShowProperties(true)
    handleContentChange()
  }

  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const updatedDashboard = {
        ...currentDashboard,
        updatedAt: new Date().toISOString(),
      }

      await onSave(updatedDashboard)

      setLastSavedVersion(updatedDashboard)
      setHasUnsavedChanges(false)
      setSaveMessage('Changes saved successfully!')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null)
      }, 3000)
    } catch (error) {
      console.error('Save failed:', error)
      setSaveMessage('Failed to save changes. Please try again.')

      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveMessage(null)
      }, 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleContentChange = () => {
    setHasUnsavedChanges(true)
  }

  const handleWidgetMove = (widgetId: string, direction: 'up' | 'down' | 'left' | 'right', amount: number = 20) => {
    const widget = currentDashboard.widgets.find(w => w.id === widgetId)
    if (!widget) return

    const updates: Partial<DashboardWidget> = {
      props: {
        ...widget.props,
        x: widget.props?.x || 0,
        y: widget.props?.y || 0
      }
    }

    switch (direction) {
      case 'up':
        updates.props!.y = Math.max(0, (widget.props?.y || 0) - amount)
        break
      case 'down':
        updates.props!.y = (widget.props?.y || 0) + amount
        break
      case 'left':
        updates.props!.x = Math.max(0, (widget.props?.x || 0) - amount)
        break
      case 'right':
        updates.props!.x = (widget.props?.x || 0) + amount
        break
    }

    handleWidgetUpdate(widgetId, updates)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const isTextInputTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName.toLowerCase()
      const isContentEditable = target.isContentEditable
      return tag === 'input' || tag === 'textarea' || isContentEditable
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid interfering with typing in inputs/textareas/contenteditable
      if (isTextInputTarget(event.target)) return

      // Ctrl+S or Cmd+S for save
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (hasUnsavedChanges && !isSaving) {
          handleSave()
        }
        return
      }

      // Ctrl+C / Cmd+C to copy selected widget
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        if (selectedWidget) {
          event.preventDefault()
          setClipboardWidget(selectedWidget)
        }
        return
      }

      // Ctrl+V / Cmd+V to paste widget from clipboard
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
        if (clipboardWidget) {
          event.preventDefault()
          const pasted: DashboardWidget = {
            ...clipboardWidget,
            id: `widget_${Date.now()}`,
            title: `${clipboardWidget.title} (Copy)`,
            props: {
              ...clipboardWidget.props,
              x: (clipboardWidget.props?.x || 0) + 20,
              y: (clipboardWidget.props?.y || 0) + 20
            }
          }

          setCurrentDashboard(prev => ({
            ...prev,
            widgets: [...prev.widgets, pasted]
          }))
          handleContentChange()

          if (onWidgetSelect) {
            onWidgetSelect(pasted)
          } else {
            setInternalSelectedWidget(pasted)
          }
          setShowProperties(true)
          setShowToolbar(true)
          setToolbarPosition({
            x: (pasted.props?.x || 0) + (pasted.props?.width || 200) / 2,
            y: (pasted.props?.y || 0)
          })
        }
        return
      }

      // Ctrl+X / Cmd+X to cut selected widget
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'x') {
        if (selectedWidget) {
          event.preventDefault()
          setClipboardWidget(selectedWidget)

          setCurrentDashboard(prev => ({
            ...prev,
            widgets: prev.widgets.filter(w => w.id !== selectedWidget.id)
          }))
          handleContentChange()

          // Clear selection and UI
          setShowToolbar(false)
          setShowProperties(false)
          if (onWidgetSelect) {
            onWidgetSelect(null)
          } else {
            setInternalSelectedWidget(null)
          }
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges, isSaving, handleSave, selectedWidget, clipboardWidget, onWidgetSelect])

  const handleWidgetDuplicate = (widgetId: string) => {
    const widget = currentDashboard.widgets.find(w => w.id === widgetId)
    if (!widget) return

    const duplicatedWidget: DashboardWidget = {
      ...widget,
      id: `widget_${Date.now()}`,
      title: `${widget.title} (Copy)`,
      props: {
        ...widget.props,
        x: (widget.props?.x || 0) + 20,
        y: (widget.props?.y || 0) + 20
      }
    }

    setCurrentDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, duplicatedWidget]
    }))
    handleContentChange()
  }

  const handleWidgetUpdate = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setCurrentDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      )
    }))

    if (selectedWidget?.id === widgetId) {
      const updatedWidget = selectedWidget ? { ...selectedWidget, ...updates } : null
      if (onWidgetSelect) {
        onWidgetSelect(updatedWidget)
      } else {
        setInternalSelectedWidget(updatedWidget)
      }
    }
    handleContentChange()
  }

  // Group widgets by category
  const groupedWidgets = useMemo(() => {
    if (hideSidebar) return {}

    return Object.entries(WIDGET_TYPES).reduce((acc, [type, config]) => {
      if (!acc[config.category]) {
        acc[config.category] = []
      }
      acc[config.category].push({ type, config })
      return acc
    }, {} as Record<string, Array<{ type: string; config: any }>>)
  }, [hideSidebar])

  return (
    <div className="flex h-full bg-gray-50">
      {/* Widget Library Sidebar */}
      {!hideSidebar && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Widget Library</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`p-2 rounded-lg transition-colors ${previewMode
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  title={previewMode ? 'Exit Preview' : 'Preview Mode'}
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSave}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Save Dashboard"
                >
                  <SparklesIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Click on widgets to add them to your dashboard
            </div>
          </div>

          {/* Widget Categories */}
          <div className="flex-1 overflow-y-auto p-4">
            {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => (
              <div key={category} className="mb-6">
                <button
                  onClick={() => {
                    const newExpanded = new Set(expandedGroups)
                    if (newExpanded.has(category)) {
                      newExpanded.delete(category)
                    } else {
                      newExpanded.add(category)
                    }
                    setExpandedGroups(newExpanded)
                  }}
                  className="flex items-center gap-2 w-full text-left mb-3"
                >
                  <CubeIcon className="h-4 w-4" />
                  <h4 className="font-medium text-sm text-gray-700">{category}</h4>
                  <span className="ml-auto text-xs text-gray-500">
                    {expandedGroups.has(category) ? '−' : '+'}
                  </span>
                </button>
                {expandedGroups.has(category) && (
                  <div className="space-y-2">
                    {categoryWidgets.map(({ type, config }) => (
                      <WidgetLibraryItem
                        key={type}
                        type={type}
                        widgetConfig={config}
                        onAddWidget={handleAddWidget}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Header */}
        {!hideHeader && (
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentDashboard.name}</h2>
                <p className="text-sm text-gray-600">{currentDashboard.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {currentDashboard.widgets.length} widget{currentDashboard.widgets.length !== 1 ? 's' : ''}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-sm text-orange-500">• Unsaved changes</span>
                )}
                <div className="w-px h-4 bg-gray-300"></div>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium ${isSaving || !hasUnsavedChanges
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                {saveMessage && (
                  <div className={`text-sm px-3 py-1 rounded-lg ${saveMessage.includes('successfully')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                    {saveMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 p-4 overflow-auto">
          <CanvasArea
            widgets={currentDashboard.widgets}
            onUpdateWidgets={(widgets) => {
              setCurrentDashboard(prev => ({ ...prev, widgets }))
              handleContentChange()
            }}
            selectedWidget={selectedWidget}
            onSelectWidget={(widget) => {
              if (onWidgetSelect) {
                onWidgetSelect(widget)
              } else {
                setInternalSelectedWidget(widget)
              }
              if (!hideProperties) {
                setShowProperties(!!widget)
              }

              // Show toolbar and position it above the widget
              if (widget) {
                setShowToolbar(true)
                setToolbarPosition({
                  x: (widget.props?.x || 0) + (widget.props?.width || 200) / 2,
                  y: (widget.props?.y || 0)
                })
              } else {
                setShowToolbar(false)
              }
            }}
            previewMode={previewMode}
            previewDevice={previewDevice}
            onAddWidget={handleAddWidget}
          />
        </div>
      </div>

      {/* Floating Save Button - shown when header is hidden and there are unsaved changes */}
      {hideHeader && hasUnsavedChanges && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Unsaved changes</span>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm ${isSaving
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
              {saveMessage && (
                <div className={`text-sm px-3 py-1 rounded-lg ${saveMessage.includes('successfully')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                  }`}>
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Style Toolbar */}
      {selectedWidget && (
        <StyleToolbar
          widget={selectedWidget}
          onUpdate={(updates) => handleWidgetUpdate(selectedWidget.id, updates)}
          onDelete={() => {
            const newWidgets = currentDashboard.widgets.filter(w => w.id !== selectedWidget.id)
            setCurrentDashboard(prev => ({ ...prev, widgets: newWidgets }))
            handleContentChange()
            setShowToolbar(false)
            if (onWidgetSelect) {
              onWidgetSelect(null)
            } else {
              setInternalSelectedWidget(null)
            }
          }}
          onDuplicate={() => handleWidgetDuplicate(selectedWidget.id)}
          onMoveUp={() => handleWidgetMove(selectedWidget.id, 'up')}
          onMoveDown={() => handleWidgetMove(selectedWidget.id, 'down')}
          onMoveLeft={() => handleWidgetMove(selectedWidget.id, 'left')}
          onMoveRight={() => handleWidgetMove(selectedWidget.id, 'right')}
          position={toolbarPosition}
          visible={showToolbar}
        />
      )}

      {/* Properties Panel */}
      {!hideProperties && showProperties && selectedWidget && (
        <WidgetPropertiesPanel
          widget={selectedWidget}
          onUpdate={(updates) => handleWidgetUpdate(selectedWidget.id, updates)}
          onClose={() => {
            setShowProperties(false)
            setShowToolbar(false)
            if (onWidgetSelect) {
              onWidgetSelect(null)
            } else {
              setInternalSelectedWidget(null)
            }
          }}
        />
      )}
    </div>
  )
}
