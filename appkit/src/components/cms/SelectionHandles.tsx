'use client'

import React from 'react'
import { ContentComponent } from '../../services/productionCmsService'

interface SelectionHandlesProps {
  component: ContentComponent
  onDelete: (id: string) => void
  onResizeMouseDown: (e: React.MouseEvent, direction: string) => void
}

export const SelectionHandles: React.FC<SelectionHandlesProps> = ({ 
  component, 
  onDelete, 
  onResizeMouseDown 
}) => {
  const resizableTypes = [
    'text', 'heading', 'paragraph', 'image', 'button', 'container', 
    'video', 'gallery', 'iframe', 'form', 'accordion', 'tabs',
    'columns', 'card', 'hero', 'table', 'code', 'timeline',
    'faq', 'testimonial', 'pricing', 'navbar', 'newsletter', 'caption'
  ]

  const isResizable = resizableTypes.includes(component.type)

  return (
    <>
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(component.id)
        }}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-20"
        aria-label="Delete component"
        title="Delete component"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Resize handles */}
      {isResizable && (
        <>
          {/* Corner handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize bg-blue-500 rounded-sm"
            style={{ transform: 'rotate(0deg)' }}
            onMouseDown={(e) => onResizeMouseDown(e, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize bg-blue-500 rounded-sm"
            style={{ transform: 'rotate(0deg)' }}
            onMouseDown={(e) => onResizeMouseDown(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize bg-blue-500 rounded-sm"
            style={{ transform: 'rotate(0deg)' }}
            onMouseDown={(e) => onResizeMouseDown(e, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize bg-blue-500 rounded-sm"
            style={{ transform: 'rotate(0deg)' }}
            onMouseDown={(e) => onResizeMouseDown(e, 'se')}
          />
          
          {/* Edge handles */}
          <div
            className="absolute -top-1 left-1/2 w-3 h-3 cursor-n-resize bg-blue-500 rounded-sm"
            style={{ transform: 'translateX(-50%) rotate(0deg)' }}
            onMouseDown={(e) => onResizeMouseDown(e, 'n')}
          />
          <div
            className="absolute -bottom-1 left-1/2 w-3 h-3 cursor-s-resize bg-blue-500 rounded-sm"
            style={{ transform: 'translateX(-50%) rotate(0deg)' }}
            onMouseDown={(e) => onResizeMouseDown(e, 's')}
          />
          <div
            className="absolute -left-1 top-1/2 w-3 h-3 cursor-w-resize bg-blue-500 rounded-sm"
            style={{ transform: 'translateY(-50%) rotate(0deg)' }}
            onMouseDown={(e) => onResizeMouseDown(e, 'w')}
          />
          <div
            className="absolute -right-1 top-1/2 w-3 h-3 cursor-e-resize bg-blue-500 rounded-sm"
            style={{ transform: 'translateY(-50%) rotate(0deg)' }}
            onMouseDown={(e) => onResizeMouseDown(e, 'e')}
          />
        </>
      )}
      
      {/* Element indicator */}
      <div 
        className="absolute -top-6 left-0 text-blue-500 text-xs px-2 py-1 font-medium bg-blue-50 border border-blue-200 rounded"
        style={{
          transform: 'rotate(0deg)',
          transformOrigin: 'center'
        }}
      >
        {component.type} - Selected
      </div>
    </>
  )
}
