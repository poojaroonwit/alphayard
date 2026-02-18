'use client'

import * as React from 'react'
import { HTMLAttributes, forwardRef, ReactNode, createContext, useContext, useState, useRef, useEffect } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SelectContextType {
  open: boolean
  setOpen: (open: boolean) => void
  value: string
  onValueChange: (value: string) => void
  displayValue: string
  setDisplayValue: (value: string) => void
}

const SelectContext = createContext<SelectContextType | undefined>(undefined)

function useSelect() {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select')
  }
  return context
}

interface SelectProps {
  children: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
}

export function Select({ children, value: controlledValue, defaultValue = '', onValueChange }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const [displayValue, setDisplayValue] = useState('')
  
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue
  
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ open, setOpen, value, onValueChange: handleValueChange, displayValue, setDisplayValue }}>
      <div className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  disabled?: boolean
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, disabled, ...props }, ref) => {
    const { open, setOpen, displayValue } = useSelect()
    const triggerRef = useRef<HTMLButtonElement>(null)

    return (
      <button
        ref={ref || triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open ? true : false}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm',
          'ring-offset-white placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus:ring-gray-300',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className={cn('h-4 w-4 opacity-50 transition-transform', open && 'rotate-180')} />
      </button>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

interface SelectValueProps {
  placeholder?: string
  className?: string
}

export function SelectValue({ placeholder, className }: SelectValueProps) {
  const { displayValue, value } = useSelect()
  
  return (
    <span className={cn('block truncate', !displayValue && !value && 'text-gray-500', className)}>
      {displayValue || value || placeholder}
    </span>
  )
}

interface SelectContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  position?: 'popper' | 'item-aligned'
}

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, position = 'popper', ...props }, ref) => {
    const { open, setOpen } = useSelect()
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          const trigger = contentRef.current.parentElement?.querySelector('[role="combobox"]')
          if (trigger && !trigger.contains(e.target as Node)) {
            setOpen(false)
          }
        }
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false)
        }
      }

      if (open) {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [open, setOpen])

    if (!open) return null

    return (
      <div
        ref={contentRef}
        className={cn(
          'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg',
          'dark:border-gray-800 dark:bg-gray-950',
          'animate-in fade-in-0 zoom-in-95',
          className
        )}
        role="listbox"
        {...props}
      >
        {children}
      </div>
    )
  }
)
SelectContent.displayName = 'SelectContent'

interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  value: string
  disabled?: boolean
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value: itemValue, disabled, ...props }, ref) => {
    const { value, onValueChange, setDisplayValue } = useSelect()
    const isSelected = value === itemValue

    const handleSelect = () => {
      if (disabled) return
      onValueChange(itemValue)
      // Set display value based on children if it's a string
      if (typeof children === 'string') {
        setDisplayValue(children)
      }
    }

    // Set display value on mount if this item is selected
    useEffect(() => {
      if (isSelected && typeof children === 'string') {
        setDisplayValue(children)
      }
    }, [isSelected, children, setDisplayValue])

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected ? true : false}
        aria-disabled={disabled ? true : undefined}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleSelect()
          }
        }}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none',
          'transition-colors hover:bg-gray-100 focus:bg-gray-100',
          'dark:hover:bg-gray-800 dark:focus:bg-gray-800',
          isSelected && 'bg-gray-100 dark:bg-gray-800',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <CheckIcon className="h-4 w-4" />}
        </span>
        {children}
      </div>
    )
  }
)
SelectItem.displayName = 'SelectItem'

export const SelectGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="group" className={cn('p-1', className)} {...props} />
  )
)
SelectGroup.displayName = 'SelectGroup'

export const SelectLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)} {...props} />
  )
)
SelectLabel.displayName = 'SelectLabel'

export const SelectSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800', className)} {...props} />
  )
)
SelectSeparator.displayName = 'SelectSeparator'
