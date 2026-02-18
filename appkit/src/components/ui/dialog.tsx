'use client'

import * as React from 'react'
import { HTMLAttributes, forwardRef, ReactNode, useEffect, useRef, createContext, useContext, useState } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { XMarkIcon } from '@heroicons/react/24/outline'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DialogContextType {
  open: boolean
  setOpen: (open: boolean) => void
  onOpenChange?: (open: boolean) => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog')
  }
  return context
}

interface DialogProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

export function Dialog({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  
  const setOpen = (value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }

  return (
    <DialogContext.Provider value={{ open, setOpen, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: ReactNode
}

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { setOpen } = useDialog()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      setOpen(true)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          (children as React.ReactElement<any>).props.onClick?.(e)
          setOpen(true)
        },
      })
    }

    return (
      <button ref={ref} type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)
DialogTrigger.displayName = 'DialogTrigger'

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  onInteractOutside?: (e: Event) => void
  onEscapeKeyDown?: (e: KeyboardEvent) => void
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onInteractOutside, onEscapeKeyDown, ...props }, ref) => {
    const { open, setOpen } = useDialog()
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
        // Focus trap
        const firstFocusable = contentRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement
        firstFocusable?.focus()
      } else {
        document.body.style.overflow = ''
      }

      return () => {
        document.body.style.overflow = ''
      }
    }, [open])

    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          onEscapeKeyDown?.(e)
          if (!e.defaultPrevented) {
            setOpen(false)
          }
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [open, setOpen, onEscapeKeyDown])

    if (!open) return null

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (onInteractOutside) {
        const customEvent = new Event('click')
        onInteractOutside(customEvent)
        if (customEvent.defaultPrevented) return
      }
      setOpen(false)
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Dialog */}
        <div
          ref={contentRef}
          className={cn(
            'fixed z-50 grid w-full max-w-lg gap-4 border bg-white dark:bg-zinc-900 p-6 shadow-lg rounded-2xl',
            'border-gray-200/50 dark:border-zinc-800',
            'animate-in fade-in-0 zoom-in-95',
            'duration-200',
            className
          )}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    )
  }
)
DialogContent.displayName = 'DialogContent'

export const DialogHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  )
)
DialogHeader.displayName = 'DialogHeader'

export const DialogFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  )
)
DialogFooter.displayName = 'DialogFooter'

export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
      {...props}
    />
  )
)
DialogDescription.displayName = 'DialogDescription'

export const DialogClose = forwardRef<HTMLButtonElement, HTMLAttributes<HTMLButtonElement>>(
  ({ className, children, onClick, ...props }, ref) => {
    const { setOpen } = useDialog()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e as any)
      setOpen(false)
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={className}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DialogClose.displayName = 'DialogClose'
