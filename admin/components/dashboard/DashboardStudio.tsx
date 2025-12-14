'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { DashboardCanvas } from './DashboardCanvas'
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
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardWidget {
  id: string
  type: string
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
  data?: any
  style?: Record<string, any>
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

interface DashboardStudioProps {
  dashboard: Dashboard
  onSave: (dashboard: Dashboard) => void
}

// Widget Types Configuration
const WIDGET_TYPES = {
  stats: {
    name: 'Statistics',
    icon: Squares2X2Icon,
    description: 'Display key metrics and KPIs',
    defaultSize: { w: 3, h: 2 },
    category: 'Analytics'
  },
  chart: {
    name: 'Chart',
    icon: ChartBarIcon,
    description: 'Visualize data with charts',
    defaultSize: { w: 6, h: 4 },
    category: 'Visualization'
  },
  pieChart: {
    name: 'Pie Chart',
    icon: ChartPieIcon,
    description: 'Display data as pie chart',
    defaultSize: { w: 4, h: 4 },
    category: 'Visualization'
  },
  lineChart: {
    name: 'Line Chart',
    icon: PresentationChartLineIcon,
    description: 'Show trends over time',
    defaultSize: { w: 6, h: 4 },
    category: 'Visualization'
  },
  table: {
    name: 'Data Table',
    icon: TableCellsIcon,
    description: 'Display tabular data',
    defaultSize: { w: 6, h: 5 },
    category: 'Data'
  },
  calendar: {
    name: 'Calendar',
    icon: CalendarIcon,
    description: 'Show calendar events',
    defaultSize: { w: 4, h: 5 },
    category: 'Content'
  },
  gallery: {
    name: 'Image Gallery',
    icon: PhotoIcon,
    description: 'Display image collections',
    defaultSize: { w: 4, h: 4 },
    category: 'Content'
  },
  text: {
    name: 'Text Block',
    icon: DocumentTextIcon,
    description: 'Rich text content',
    defaultSize: { w: 4, h: 2 },
    category: 'Content'
  },
  storage: {
    name: 'Storage Usage',
    icon: CloudIcon,
    description: 'Show storage statistics',
    defaultSize: { w: 3, h: 3 },
    category: 'System'
  },
  map: {
    name: 'Map',
    icon: MapIcon,
    description: 'Interactive maps',
    defaultSize: { w: 6, h: 5 },
    category: 'Visualization'
  },
  clock: {
    name: 'Clock',
    icon: ClockIcon,
    description: 'Time and date display',
    defaultSize: { w: 2, h: 2 },
    category: 'Utility'
  },
  users: {
    name: 'User Stats',
    icon: UserGroupIcon,
    description: 'User activity metrics',
    defaultSize: { w: 3, h: 3 },
    category: 'Analytics'
  },
  revenue: {
    name: 'Revenue',
    icon: CurrencyDollarIcon,
    description: 'Financial metrics',
    defaultSize: { w: 3, h: 2 },
    category: 'Analytics'
  },
  website: {
    name: 'Website Stats',
    icon: GlobeAltIcon,
    description: 'Web analytics',
    defaultSize: { w: 4, h: 3 },
    category: 'Analytics'
  },
  mobile: {
    name: 'Mobile Stats',
    icon: DevicePhoneMobileIcon,
    description: 'Mobile app metrics',
    defaultSize: { w: 3, h: 3 },
    category: 'Analytics'
  },
  desktop: {
    name: 'Desktop Stats',
    icon: ComputerDesktopIcon,
    description: 'Desktop app metrics',
    defaultSize: { w: 3, h: 3 },
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

// Widget Component
const WidgetComponent: React.FC<{
  widget: DashboardWidget
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onEdit: () => void
}> = ({ widget, isSelected, onSelect, onDelete, onEdit }) => {
  const widgetConfig = WIDGET_TYPES[widget.type as keyof typeof WIDGET_TYPES]
  const IconComponent = widgetConfig?.icon || CogIcon

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <IconComponent className="h-4 w-4 text-gray-600" />
          </div>
          <h3 className="font-medium text-sm text-gray-900 truncate">{widget.title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit widget"
          >
            <PencilIcon className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete widget"
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-3 h-full">
        {renderWidgetContent(widget)}
      </div>

      {/* Resize Handle */}
      <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize">
        <div className="w-full h-full bg-gray-300 rounded-tl-lg"></div>
      </div>
    </div>
  )
}

// Render widget content based on type
const renderWidgetContent = (widget: DashboardWidget) => {
  switch (widget.type) {
    case 'stats':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-xs text-gray-500">Total Families</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">156</div>
            <div className="text-xs text-gray-500">Total Content</div>
          </div>
        </div>
      )
    case 'chart':
    case 'lineChart':
      return (
        <div className="h-24 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ChartBarIcon className="h-8 w-8 text-blue-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Chart Widget</span>
          </div>
        </div>
      )
    case 'pieChart':
      return (
        <div className="h-24 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ChartPieIcon className="h-8 w-8 text-purple-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Pie Chart</span>
          </div>
        </div>
      )
    case 'table':
      return (
        <div className="h-24 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TableCellsIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Data Table</span>
          </div>
        </div>
      )
    case 'calendar':
      return (
        <div className="h-24 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <CalendarIcon className="h-8 w-8 text-green-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Calendar</span>
          </div>
        </div>
      )
    case 'gallery':
      return (
        <div className="h-24 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <PhotoIcon className="h-8 w-8 text-yellow-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Gallery</span>
          </div>
        </div>
      )
    case 'text':
      return (
        <div className="h-24 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <DocumentTextIcon className="h-8 w-8 text-indigo-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Text Block</span>
          </div>
        </div>
      )
    case 'storage':
      return (
        <div className="h-24 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <CloudIcon className="h-8 w-8 text-cyan-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Storage</span>
          </div>
        </div>
      )
    case 'map':
      return (
        <div className="h-24 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapIcon className="h-8 w-8 text-red-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Map</span>
          </div>
        </div>
      )
    case 'clock':
      return (
        <div className="h-16 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ClockIcon className="h-6 w-6 text-violet-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Clock</span>
          </div>
        </div>
      )
    case 'users':
      return (
        <div className="h-24 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <UserGroupIcon className="h-8 w-8 text-emerald-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Users</span>
          </div>
        </div>
      )
    case 'revenue':
      return (
        <div className="h-16 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <CurrencyDollarIcon className="h-6 w-6 text-amber-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Revenue</span>
          </div>
        </div>
      )
    case 'website':
      return (
        <div className="h-24 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <GlobeAltIcon className="h-8 w-8 text-sky-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Website</span>
          </div>
        </div>
      )
    case 'mobile':
      return (
        <div className="h-24 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <DevicePhoneMobileIcon className="h-8 w-8 text-pink-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Mobile</span>
          </div>
        </div>
      )
    case 'desktop':
      return (
        <div className="h-24 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <ComputerDesktopIcon className="h-8 w-8 text-slate-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Desktop</span>
          </div>
        </div>
      )
    default:
      return (
        <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-500">Unknown Widget</span>
        </div>
      )
  }
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
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium ${
                activeTab === tab.id
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={widget.position.w}
                    onChange={(e) => {
                      const w = Math.max(1, Math.min(12, parseInt(e.target.value) || 1))
                      onUpdate({ position: { ...widget.position, w } })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={widget.position.h}
                    onChange={(e) => {
                      const h = Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                      onUpdate({ position: { ...widget.position, h } })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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

// Main Dashboard Studio Component
export const DashboardStudio: React.FC<DashboardStudioProps> = ({ dashboard, onSave }) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(dashboard.widgets)
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null)
  const [showProperties, setShowProperties] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [layout, setLayout] = useState<Layout[]>([])
  const [editMode, setEditMode] = useState<'grid' | 'canvas'>('grid')

  // Convert widgets to grid layout format
  const convertToLayout = (widgets: DashboardWidget[]): Layout[] => {
    return widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 20
    }))
  }

  // Convert grid layout back to widgets
  const convertFromLayout = (layout: Layout[]): DashboardWidget[] => {
    return widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        }
      }
      return widget
    })
  }

  // Handle layout change
  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout)
    const updatedWidgets = convertFromLayout(newLayout)
    setWidgets(updatedWidgets)
  }

  // Handle widget add
  const handleAddWidget = (type: string, widgetConfig: any) => {
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type: type,
      title: `New ${widgetConfig.name}`,
      position: { x: 0, y: 0, w: widgetConfig.defaultSize.w, h: widgetConfig.defaultSize.h },
      config: {},
      style: {}
    }
    
    setWidgets(prev => [...prev, newWidget])
    setSelectedWidget(newWidget)
    setShowProperties(true)
  }

  // Handle widget update
  const handleWidgetUpdate = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ))
    
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  // Handle widget delete
  const handleWidgetDelete = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null)
      setShowProperties(false)
    }
  }

  // Handle save
  const handleSave = () => {
    onSave({
      ...dashboard,
      widgets,
      updatedAt: new Date().toISOString()
    })
  }

  // Group widgets by category
  const groupedWidgets = Object.entries(WIDGET_TYPES).reduce((acc, [type, config]) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push({ type, config })
    return acc
  }, {} as Record<string, Array<{ type: string; config: any }>>)

  return (
    <div className="flex h-full bg-gray-50">
        {/* Widget Library Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Widget Library</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    previewMode 
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
                <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <CubeIcon className="h-4 w-4" />
                  {category}
                </h4>
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
              </div>
            ))}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Header */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{dashboard.name}</h2>
                <p className="text-sm text-gray-600">{dashboard.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setEditMode('grid')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      editMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setEditMode('canvas')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      editMode === 'canvas'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Canvas
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
                </span>
                <div className="w-px h-4 bg-gray-300"></div>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            {editMode === 'grid' ? (
              <div className="p-4">
                <div className="min-h-full">
                  <ResponsiveGridLayout
                    className="layout"
                    layouts={{ lg: convertToLayout(widgets) }}
                    breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                    cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                    rowHeight={60}
                    isDraggable={!previewMode}
                    isResizable={!previewMode}
                    onLayoutChange={handleLayoutChange}
                    margin={[16, 16]}
                    containerPadding={[0, 0]}
                    useCSSTransforms={false}
                  >
                    {widgets.map((widget) => (
                      <div key={widget.id} className="h-full">
                        <WidgetComponent
                          widget={widget}
                          isSelected={selectedWidget?.id === widget.id}
                          onSelect={() => {
                            setSelectedWidget(widget)
                            setShowProperties(true)
                          }}
                          onDelete={() => handleWidgetDelete(widget.id)}
                          onEdit={() => {
                            setSelectedWidget(widget)
                            setShowProperties(true)
                          }}
                        />
                      </div>
                    ))}
                  </ResponsiveGridLayout>
                </div>
              </div>
            ) : (
              <DashboardCanvas
                dashboard={{
                  ...dashboard,
                  widgets
                }}
                onSave={async (updatedDashboard) => {
                  setWidgets(updatedDashboard.widgets)
                  await onSave(updatedDashboard)
                }}
                onCancel={() => setEditMode('grid')}
                hideSidebar={true}
                hideProperties={false}
                hideHeader={true}
                onWidgetSelect={setSelectedWidget}
                selectedWidget={selectedWidget}
              />
            )}
          </div>
        </div>

        {/* Properties Panel - Grid Mode Only */}
        {showProperties && selectedWidget && editMode === 'grid' && (
          <WidgetPropertiesPanel
            widget={selectedWidget}
            onUpdate={(updates) => handleWidgetUpdate(selectedWidget.id, updates)}
            onClose={() => {
              setShowProperties(false)
              setSelectedWidget(null)
            }}
          />
        )}
    </div>
  )
}
