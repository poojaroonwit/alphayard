'use client'

import React, { useState, useRef, useCallback } from 'react'
import { ContentComponent } from '../../services/productionCmsService'
import { ContentRenderer } from './ContentRenderer'
import { DesignToolbar } from './DesignToolbar'
import { SelectionHandles } from './SelectionHandles'

interface DraggableComponentProps {
  component: ContentComponent
  isSelected: boolean
  onSelect: (id: string) => void
  onUpdate: (id: string, updates: Partial<ContentComponent>) => void
  onDelete: (id: string) => void
  deviceType: 'desktop' | 'tablet' | 'mobile'
  gridSize?: number
  snapToGrid?: boolean
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
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
  const componentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const snapToGridValue = (value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(component.id)
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - (component.props?.x || 0),
      y: e.clientY - (component.props?.y || 0)
    })
  }, [component.id, component.props?.x, component.props?.y, onSelect])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(component.id)
  }, [component.id, onSelect])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: component.props?.width || 100,
      height: component.props?.height || 100,
      left: component.props?.x || 0,
      top: component.props?.y || 0
    })
  }, [component.props?.width, component.props?.height, component.props?.x, component.props?.y])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = snapToGridValue(e.clientX - dragStart.x)
      const newY = snapToGridValue(e.clientY - dragStart.y)
      
      onUpdate(component.id, {
        props: {
          ...component.props,
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
      
      onUpdate(component.id, {
        props: {
          ...component.props,
          x: snapToGridValue(newX),
          y: snapToGridValue(newY),
          width: snapToGridValue(newWidth),
          height: snapToGridValue(newHeight)
        }
      })
    }
  }, [isDragging, isResizing, dragStart, resizeStart, component.id, component.props, onUpdate, snapToGridValue])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeDirection('')
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

  return (
    <>
      {/* Main Component */}
      <div
        ref={componentRef}
        className={`absolute cursor-move transition-all ${
          isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-gray-300'
        } ${isDragging ? 'z-50' : 'z-10'}`}
        style={{
          left: component.props?.x || 0,
          top: component.props?.y || 0,
          width: component.props?.width || 'auto',
          height: component.props?.height || 'auto',
          minWidth: component.type === 'image' || component.type === 'button' || component.type === 'container' ? '100px' : 'auto',
          minHeight: component.type === 'image' || component.type === 'button' || component.type === 'container' ? '50px' : 'auto',
          opacity: component.props?.opacity || 1,
          backgroundColor: component.props?.backgroundColor,
          color: component.props?.color,
          borderColor: component.props?.borderColor,
          borderWidth: component.props?.borderTopWidth || component.props?.borderRightWidth || component.props?.borderBottomWidth || component.props?.borderLeftWidth ? 
            `${component.props.borderTopWidth || 0}px ${component.props.borderRightWidth || 0}px ${component.props.borderBottomWidth || 0}px ${component.props.borderLeftWidth || 0}px` : undefined,
          borderStyle: component.props?.borderStyle || (component.props?.borderTopWidth || component.props?.borderRightWidth || component.props?.borderBottomWidth || component.props?.borderLeftWidth ? 'solid' : undefined),
          borderRadius: component.props?.borderTopLeftRadius || component.props?.borderTopRightRadius || component.props?.borderBottomRightRadius || component.props?.borderBottomLeftRadius ? 
            `${component.props.borderTopLeftRadius || 0}px ${component.props.borderTopRightRadius || 0}px ${component.props.borderBottomRightRadius || 0}px ${component.props.borderBottomLeftRadius || 0}px` : 
            (component.props?.borderRadius ? `${component.props.borderRadius}px` : undefined),
          padding: component.props?.paddingTop || component.props?.paddingRight || component.props?.paddingBottom || component.props?.paddingLeft ? 
            `${component.props.paddingTop || 0}px ${component.props.paddingRight || 0}px ${component.props.paddingBottom || 0}px ${component.props.paddingLeft || 0}px` : undefined,
          margin: component.props?.marginTop || component.props?.marginRight || component.props?.marginBottom || component.props?.marginLeft ? 
            `${component.props.marginTop || 0}px ${component.props.marginRight || 0}px ${component.props.marginBottom || 0}px ${component.props.marginLeft || 0}px` : undefined,
          gap: component.props?.gap ? `${component.props.gap}px` : undefined,
          boxShadow: component.props?.boxShadow === 'sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                     component.props?.boxShadow === 'md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' :
                     component.props?.boxShadow === 'lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' :
                     component.props?.boxShadow === 'xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' :
                     component.props?.boxShadow === '2xl' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' :
                     component.props?.boxShadow === 'inner' ? 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' : undefined,
          transform: component.props?.transform,
          fontSize: component.props?.fontSize ? `${component.props.fontSize}px` : undefined,
          fontWeight: component.props?.fontWeight,
          textAlign: component.props?.textAlign,
          lineHeight: component.props?.lineHeight,
          // Advanced effects
          filter: [
            component.props?.blur ? `blur(${component.props.blur}px)` : '',
            component.props?.brightness ? `brightness(${component.props.brightness})` : '',
            component.props?.contrast ? `contrast(${component.props.contrast})` : '',
            component.props?.saturation ? `saturate(${component.props.saturation})` : '',
            component.props?.hueRotate ? `hue-rotate(${component.props.hueRotate}deg)` : ''
          ].filter(Boolean).join(' ') || undefined,
          // Advanced layout
          zIndex: component.props?.zIndex,
          position: component.props?.position || 'absolute',
          display: component.props?.display,
          overflow: component.props?.overflow,
          cursor: component.props?.cursor,
          transition: component.props?.transition,
          animation: component.props?.animation
        }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        <ContentRenderer component={component} isSelected={isSelected} />
        
        {/* Selection handles */}
        {isSelected && (
          <SelectionHandles
            component={component}
            onDelete={onDelete}
            onResizeMouseDown={handleResizeMouseDown}
          />
        )}
      </div>

      {/* Design Toolbar */}
      {isSelected && mounted && (
        <DesignToolbar
          component={component}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onSelect={onSelect}
          mounted={mounted}
        />
      )}
    </>
  )
}
