'use client'

import * as React from 'react'
import { HTMLAttributes, forwardRef, ReactNode, createContext, useContext, useState, useRef, useEffect } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CheckIcon } from '@heroicons/react/24/outline'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DropdownMenuContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = createContext<DropdownMenuContextType | undefined>(undefined)

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu')
  }
  return context
}

interface DropdownMenuProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  
  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: ReactNode
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { open, setOpen } = useDropdownMenu()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      setOpen(!open)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          (children as React.ReactElement<any>).props.onClick?.(e)
          setOpen(!open)
        },
        'aria-expanded': open ? true : false,
        'aria-haspopup': 'menu',
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        aria-expanded={open ? true : false}
        aria-haspopup="menu"
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, align = 'end', sideOffset = 4, ...props }, ref) => {
    const { open, setOpen } = useDropdownMenu()
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          // Check if click is on the trigger
          const trigger = contentRef.current.parentElement?.querySelector('[aria-haspopup="menu"]')
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

    const alignClasses = {
      start: 'left-0',
      center: 'left-1/2 -translate-x-1/2',
      end: 'right-0',
    }

    return (
      <div
        ref={contentRef}
        className={cn(
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg',
          'dark:border-gray-800 dark:bg-gray-950',
          'animate-in fade-in-0 zoom-in-95',
          alignClasses[align],
          `mt-${sideOffset}`,
          className
        )}
        role="menu"
        aria-orientation="vertical"
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  disabled?: boolean
  onSelect?: () => void
  inset?: boolean
}

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, children, disabled, onSelect, inset, onClick, ...props }, ref) => {
    const { setOpen } = useDropdownMenu()

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return
      onClick?.(e)
      onSelect?.()
      setOpen(false)
    }

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? true : undefined}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick(e as any)
          }
        }}
        className={cn(
          'relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none',
          'transition-colors hover:bg-gray-100 focus:bg-gray-100',
          'dark:hover:bg-gray-800 dark:focus:bg-gray-800',
          disabled && 'pointer-events-none opacity-50',
          inset && 'pl-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

interface DropdownMenuCheckboxItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

export const DropdownMenuCheckboxItem = forwardRef<HTMLDivElement, DropdownMenuCheckboxItemProps>(
  ({ className, children, checked, onCheckedChange, disabled, ...props }, ref) => {
    const { setOpen } = useDropdownMenu()

    const handleClick = () => {
      if (disabled) return
      onCheckedChange?.(!checked)
    }

    return (
      <div
        ref={ref}
        role="menuitemcheckbox"
        aria-checked={checked ? true : false}
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? true : undefined}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        className={cn(
          'relative flex cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none',
          'transition-colors hover:bg-gray-100 focus:bg-gray-100',
          'dark:hover:bg-gray-800 dark:focus:bg-gray-800',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {checked && <CheckIcon className="h-4 w-4" />}
        </span>
        {children}
      </div>
    )
  }
)
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

export const DropdownMenuLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { inset?: boolean }>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-sm font-semibold',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  )
)
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

export const DropdownMenuSeparator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-gray-100 dark:bg-gray-800', className)}
      {...props}
    />
  )
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export const DropdownMenuShortcut = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
    {...props}
  />
)
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

// Group component
export const DropdownMenuGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="group" className={className} {...props} />
  )
)
DropdownMenuGroup.displayName = 'DropdownMenuGroup'

// Sub menu components (simplified - just renders children)
export const DropdownMenuSub = ({ children }: { children: ReactNode }) => <>{children}</>
export const DropdownMenuSubTrigger = DropdownMenuItem
export const DropdownMenuSubContent = DropdownMenuContent
export const DropdownMenuPortal = ({ children }: { children: ReactNode }) => <>{children}</>
export const DropdownMenuRadioGroup = DropdownMenuGroup
export const DropdownMenuRadioItem = DropdownMenuCheckboxItem
