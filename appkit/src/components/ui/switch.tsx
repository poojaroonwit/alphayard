'use client'

import * as React from 'react'
import { forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, defaultChecked = false, onCheckedChange, disabled, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
    
    const isControlled = checked !== undefined
    const isChecked = isControlled ? checked : internalChecked

    const handleClick = () => {
      if (disabled) return
      
      const newChecked = !isChecked
      if (!isControlled) {
        setInternalChecked(newChecked)
      }
      onCheckedChange?.(newChecked)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    }

    const baseClass = cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )

    // Use inline style to guarantee the background color cannot be overridden by consumer classNames
    const bgStyle: React.CSSProperties = {
      backgroundColor: isChecked ? '#10b981' : undefined, // emerald-500
    }

    return isChecked ? (
      <button
        ref={ref}
        type="button"
        aria-pressed="true"
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={baseClass}
        style={bgStyle}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
            'translate-x-5'
          )}
        />
      </button>
    ) : (
      <button
        ref={ref}
        type="button"
        aria-pressed="false"
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(baseClass, 'bg-gray-300 dark:bg-gray-700')}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
            'translate-x-0'
          )}
        />
      </button>
    )
  }
)

Switch.displayName = 'Switch'
