'use client'

import React from 'react'
import {
  PaintBrushIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

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

interface StyleToolbarProps {
  widget: DashboardWidget
  onUpdate: (updates: Partial<DashboardWidget>) => void
  onDelete: () => void
  onDuplicate?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  onMoveLeft?: () => void
  onMoveRight?: () => void
  position: { x: number; y: number }
  visible: boolean
}

export const StyleToolbar: React.FC<StyleToolbarProps> = ({
  widget,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  position,
  visible
}) => {
  if (!visible) return null

  const handleColorChange = (color: string) => {
    onUpdate({
      style: {
        ...widget.style,
        backgroundColor: color
      }
    })
  }

  const handleBorderRadiusChange = (radius: string) => {
    onUpdate({
      style: {
        ...widget.style,
        borderRadius: radius
      }
    })
  }

  const handleShadowChange = (shadow: string) => {
    onUpdate({
      style: {
        ...widget.style,
        boxShadow: shadow
      }
    })
  }

  const handleOpacityChange = (opacity: number) => {
    onUpdate({
      props: {
        ...widget.props,
        opacity: opacity / 100
      }
    })
  }

  const predefinedColors = [
    '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
    '#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a',
    '#10b981', '#059669', '#047857', '#065f46',
    '#f59e0b', '#d97706', '#b45309', '#92400e',
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b',
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'
  ]

  const borderRadiusOptions = [
    { value: '0px', label: 'None' },
    { value: '4px', label: 'Small' },
    { value: '8px', label: 'Medium' },
    { value: '12px', label: 'Large' },
    { value: '16px', label: 'XL' },
    { value: '50%', label: 'Round' }
  ]

  const shadowOptions = [
    { value: 'none', label: 'None' },
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
    { value: 'xl', label: 'XL' }
  ]

  return (
    <div
      className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-max"
      style={{
        left: position.x,
        top: position.y - 60,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="flex items-center gap-2">
        {/* Background Color */}
        <div className="flex items-center gap-1">
          <PaintBrushIcon className="h-4 w-4 text-gray-500" />
          <div className="flex gap-1">
            {predefinedColors.slice(0, 8).map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-6 h-6 rounded border-2 ${
                  widget.style?.backgroundColor === color 
                    ? 'border-blue-500' 
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
                title={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Border Radius */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Radius:</span>
          <select
            value={widget.style?.borderRadius || '8px'}
            onChange={(e) => handleBorderRadiusChange(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {borderRadiusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Shadow */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Shadow:</span>
          <select
            value={widget.style?.boxShadow || 'sm'}
            onChange={(e) => handleShadowChange(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {shadowOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Opacity */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Opacity:</span>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round((widget.props?.opacity || 1) * 100)}
            onChange={(e) => handleOpacityChange(parseInt(e.target.value))}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-500 w-8">
            {Math.round((widget.props?.opacity || 1) * 100)}%
          </span>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              aria-label="Move up"
              title="Move up"
            >
              <ArrowUpIcon className="h-4 w-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              aria-label="Move down"
              title="Move down"
            >
              <ArrowDownIcon className="h-4 w-4" />
            </button>
          )}
          {onMoveLeft && (
            <button
              onClick={onMoveLeft}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              aria-label="Move left"
              title="Move left"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          )}
          {onMoveRight && (
            <button
              onClick={onMoveRight}
              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              aria-label="Move right"
              title="Move right"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
              aria-label="Duplicate"
              title="Duplicate"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            aria-label="Delete"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
