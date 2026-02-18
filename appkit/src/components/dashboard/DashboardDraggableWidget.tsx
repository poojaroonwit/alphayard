'use client'

import React, { useState, useRef, useCallback } from 'react'
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
import { SelectionHandles } from '../cms/SelectionHandles'
import { DesignToolbar } from '../cms/DesignToolbar'

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

interface DashboardDraggableWidgetProps {
  widget: DashboardWidget
  isSelected: boolean
  onSelect: (id: string) => void
  onUpdate: (id: string, updates: Partial<DashboardWidget>) => void
  onDelete: (id: string) => void
  deviceType: 'desktop' | 'tablet' | 'mobile'
  gridSize?: number
  snapToGrid?: boolean
}

export const DashboardDraggableWidget: React.FC<DashboardDraggableWidgetProps> = ({
  widget,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  deviceType,
  gridSize = 20,
  snapToGrid = true
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 })
  const widgetRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [showResizeHandles, setShowResizeHandles] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const snapToGridValue = (value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(widget.id)

    setIsDragging(true)
    setDragStart({
      x: e.clientX - (widget.props?.x || 0),
      y: e.clientY - (widget.props?.y || 0)
    })
  }, [widget.id, widget.props?.x, widget.props?.y, onSelect])

  const handleMouseEnter = useCallback(() => {
    if (isSelected) {
      setShowResizeHandles(true)
    }
  }, [isSelected])

  const handleMouseLeave = useCallback(() => {
    if (!isResizing) {
      setShowResizeHandles(false)
    }
  }, [isResizing])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(widget.id)
  }, [widget.id, onSelect])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: widget.props?.width || widget.position.w * 20, // Convert grid units to pixels
      height: widget.props?.height || widget.position.h * 20,
      left: widget.props?.x || 0,
      top: widget.props?.y || 0
    })
  }, [widget.props?.width, widget.props?.height, widget.props?.x, widget.props?.y, widget.position.w, widget.position.h])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = snapToGridValue(e.clientX - dragStart.x)
      const newY = snapToGridValue(e.clientY - dragStart.y)

      onUpdate(widget.id, {
        props: {
          ...widget.props,
          x: Math.max(0, newX),
          y: Math.max(0, newY)
        }
      })
    }

    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = resizeStart.left
      let newY = resizeStart.top

      // Handle different resize directions
      if (resizeDirection.includes('e')) { // East (right)
        newWidth = Math.max(50, resizeStart.width + deltaX)
      }
      if (resizeDirection.includes('w')) { // West (left)
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newX = resizeStart.left + deltaX
      }
      if (resizeDirection.includes('s')) { // South (bottom)
        newHeight = Math.max(50, resizeStart.height + deltaY)
      }
      if (resizeDirection.includes('n')) { // North (top)
        newHeight = Math.max(50, resizeStart.height - deltaY)
        newY = resizeStart.top + deltaY
      }

      onUpdate(widget.id, {
        props: {
          ...widget.props,
          x: snapToGridValue(newX),
          y: snapToGridValue(newY),
          width: snapToGridValue(newWidth),
          height: snapToGridValue(newHeight)
        }
      })
    }
  }, [isDragging, isResizing, dragStart, resizeStart, widget.id, widget.props, onUpdate, snapToGridValue])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeDirection('')
    setShowResizeHandles(false)
  }, [])

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'stats':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <Squares2X2Icon className="h-4 w-4 text-gray-400" />
            </div>
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
          </div>
        )
      case 'chart':
      case 'lineChart':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <ChartBarIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-8 w-8 text-blue-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Chart Widget</span>
              </div>
            </div>
          </div>
        )
      case 'pieChart':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <ChartPieIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartPieIcon className="h-8 w-8 text-purple-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Pie Chart</span>
              </div>
            </div>
          </div>
        )
      case 'table':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <TableCellsIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TableCellsIcon className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Data Table</span>
              </div>
            </div>
          </div>
        )
      case 'calendar':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <CalendarIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <CalendarIcon className="h-8 w-8 text-green-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Calendar</span>
              </div>
            </div>
          </div>
        )
      case 'gallery':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <PhotoIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PhotoIcon className="h-8 w-8 text-yellow-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Gallery</span>
              </div>
            </div>
          </div>
        )
      case 'text':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <DocumentTextIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-24 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <DocumentTextIcon className="h-8 w-8 text-indigo-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Text Block</span>
              </div>
            </div>
          </div>
        )
      case 'storage':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <CloudIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <CloudIcon className="h-8 w-8 text-cyan-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Storage</span>
              </div>
            </div>
          </div>
        )
      case 'map':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <MapIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapIcon className="h-8 w-8 text-red-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Map</span>
              </div>
            </div>
          </div>
        )
      case 'clock':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <ClockIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-24 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ClockIcon className="h-6 w-6 text-violet-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Clock</span>
              </div>
            </div>
          </div>
        )
      case 'users':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <UserGroupIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <UserGroupIcon className="h-8 w-8 text-emerald-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Users</span>
              </div>
            </div>
          </div>
        )
      case 'revenue':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-24 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <CurrencyDollarIcon className="h-6 w-6 text-amber-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Revenue</span>
              </div>
            </div>
          </div>
        )
      case 'website':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <GlobeAltIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <GlobeAltIcon className="h-8 w-8 text-sky-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Website</span>
              </div>
            </div>
          </div>
        )
      case 'mobile':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <DevicePhoneMobileIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <DevicePhoneMobileIcon className="h-8 w-8 text-pink-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Mobile</span>
              </div>
            </div>
          </div>
        )
      case 'desktop':
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <ComputerDesktopIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ComputerDesktopIcon className="h-8 w-8 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Desktop</span>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-gray-900">{widget.title}</h3>
              <CogIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-500">Unknown Widget</span>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      {/* Main Widget */}
      <div
        ref={widgetRef}
        className={`absolute cursor-move transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'
          } ${isDragging ? 'z-50' : 'z-10'}`}
        style={{
          left: widget.props?.x || 0,
          top: widget.props?.y || 0,
          width: widget.props?.width || widget.position.w * 20, // Convert grid units to pixels
          height: widget.props?.height || widget.position.h * 20,
          minWidth: '200px',
          minHeight: '150px',
          opacity: widget.props?.opacity || 1,
          backgroundColor: widget.props?.backgroundColor,
          color: widget.props?.color,
          borderColor: widget.props?.borderColor,
          borderWidth: widget.props?.borderTopWidth || widget.props?.borderRightWidth || widget.props?.borderBottomWidth || widget.props?.borderLeftWidth ?
            `${widget.props.borderTopWidth || 0}px ${widget.props.borderRightWidth || 0}px ${widget.props.borderBottomWidth || 0}px ${widget.props.borderLeftWidth || 0}px` : undefined,
          borderStyle: widget.props?.borderStyle || (widget.props?.borderTopWidth || widget.props?.borderRightWidth || widget.props?.borderBottomWidth || widget.props?.borderLeftWidth ? 'solid' : undefined),
          borderRadius: widget.props?.borderTopLeftRadius || widget.props?.borderTopRightRadius || widget.props?.borderBottomRightRadius || widget.props?.borderBottomLeftRadius ?
            `${widget.props.borderTopLeftRadius || 0}px ${widget.props.borderTopRightRadius || 0}px ${widget.props.borderBottomRightRadius || 0}px ${widget.props.borderBottomLeftRadius || 0}px` :
            (widget.props?.borderRadius ? `${widget.props.borderRadius}px` : undefined),
          padding: widget.props?.paddingTop || widget.props?.paddingRight || widget.props?.paddingBottom || widget.props?.paddingLeft ?
            `${widget.props.paddingTop || 0}px ${widget.props.paddingRight || 0}px ${widget.props.paddingBottom || 0}px ${widget.props.paddingLeft || 0}px` : undefined,
          margin: widget.props?.marginTop || widget.props?.marginRight || widget.props?.marginBottom || widget.props?.marginLeft ?
            `${widget.props.marginTop || 0}px ${widget.props.marginRight || 0}px ${widget.props.marginBottom || 0}px ${widget.props.marginLeft || 0}px` : undefined,
          gap: widget.props?.gap ? `${widget.props.gap}px` : undefined,
          boxShadow: widget.props?.boxShadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
            widget.props?.boxShadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' :
              widget.props?.boxShadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' :
                widget.props?.boxShadow === 'xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' :
                  widget.props?.boxShadow === '2xl' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' :
                    widget.props?.boxShadow === 'inner' ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' : undefined,
          transform: widget.props?.transform,
          fontSize: widget.props?.fontSize ? `${widget.props.fontSize}px` : undefined,
          fontWeight: widget.props?.fontWeight,
          textAlign: widget.props?.textAlign,
          lineHeight: widget.props?.lineHeight,
          // Advanced effects
          filter: [
            widget.props?.blur ? `blur(${widget.props.blur}px)` : '',
            widget.props?.brightness ? `brightness(${widget.props.brightness})` : '',
            widget.props?.contrast ? `contrast(${widget.props.contrast})` : '',
            widget.props?.saturation ? `saturate(${widget.props.saturation})` : '',
            widget.props?.hueRotate ? `hue-rotate(${widget.props.hueRotate}deg)` : ''
          ].filter(Boolean).join(' ') || undefined,
          // Advanced layout
          zIndex: widget.props?.zIndex,
          position: widget.props?.position || 'absolute',
          display: widget.props?.display,
          overflow: widget.props?.overflow,
          cursor: widget.props?.cursor,
          transition: widget.props?.transition,
          animation: widget.props?.animation
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {renderWidgetContent()}

        {/* Custom Resize Handles */}
        {isSelected && showResizeHandles && (
          <>
            {/* Corner resize handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-ne-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-sw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            />

            {/* Edge resize handles */}
            <div
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-n-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            />
            <div
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-s-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            />
            <div
              className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-w-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            />
            <div
              className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-e-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            />
          </>
        )}

        {/* Delete button */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(widget.id)
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center text-xs font-bold"
            title="Delete widget"
          >
            ×
          </button>
        )}
      </div>

      {/* Design Toolbar */}
      {isSelected && mounted && (
        <DesignToolbar
          component={{
            id: widget.id,
            type: widget.type,
            props: widget.props || {}
          } as any}
          onUpdate={(updates) => onUpdate(widget.id, { props: { ...(widget.props || {}), ...(updates as any) } })}
          onDelete={() => onDelete(widget.id)}
          onSelect={() => onSelect(widget.id)}
          mounted={mounted}
        />
      )}
    </>
  )
}
