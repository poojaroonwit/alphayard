'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface TooltipProps {
  content: string | ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top',
  delay = 300,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      updatePosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const spacing = 8

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - spacing
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
        break
      case 'bottom':
        top = triggerRect.bottom + spacing
        left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
        left = triggerRect.left - tooltipRect.width - spacing
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
        left = triggerRect.right + spacing
        break
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left < 0) left = 8
    if (left + tooltipRect.width > viewportWidth) left = viewportWidth - tooltipRect.width - 8
    if (top < 0) top = 8
    if (top + tooltipRect.height > viewportHeight) top = viewportHeight - tooltipRect.height - 8

    setTooltipPosition({ top, left })
  }

  useEffect(() => {
    if (!isVisible) return

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible])

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="macos-tooltip"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  )
}

