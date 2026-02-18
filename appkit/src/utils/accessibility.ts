// Accessibility utilities for content management

export const ARIA_LABELS = {
  // Content management
  CREATE_CONTENT: 'Create new content',
  EDIT_CONTENT: 'Edit content',
  DELETE_CONTENT: 'Delete content',
  SAVE_CONTENT: 'Save content',
  CANCEL_EDIT: 'Cancel editing',
  PREVIEW_CONTENT: 'Preview content',
  PUBLISH_CONTENT: 'Publish content',
  
  // Navigation
  SEARCH_CONTENT: 'Search content pages',
  FILTER_BY_TYPE: 'Filter content by type',
  FILTER_BY_STATUS: 'Filter content by status',
  SORT_CONTENT: 'Sort content',
  
  // Components
  ADD_COMPONENT: 'Add component',
  REMOVE_COMPONENT: 'Remove component',
  MOVE_COMPONENT_UP: 'Move component up',
  MOVE_COMPONENT_DOWN: 'Move component down',
  SELECT_COMPONENT: 'Select component for editing',
  
  // Templates
  USE_TEMPLATE: 'Use this template',
  PREVIEW_TEMPLATE: 'Preview template',
  
  // Forms
  CONTENT_TITLE: 'Content title',
  CONTENT_SLUG: 'Content slug',
  CONTENT_TYPE: 'Content type',
  CONTENT_STATUS: 'Content status',
  COMPONENT_SETTINGS: 'Component settings panel'
}

export const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  SAVE: 'Ctrl+S',
  CANCEL: 'Escape',
  PREVIEW: 'Ctrl+P',
  SEARCH: 'Ctrl+F',
  
  // Editor shortcuts
  ADD_TEXT: 'Ctrl+T',
  ADD_IMAGE: 'Ctrl+I',
  ADD_BUTTON: 'Ctrl+B',
  DELETE_COMPONENT: 'Delete',
  DUPLICATE_COMPONENT: 'Ctrl+D',
  
  // Navigation shortcuts
  NEXT_COMPONENT: 'Tab',
  PREVIOUS_COMPONENT: 'Shift+Tab',
  MOVE_UP: 'ArrowUp',
  MOVE_DOWN: 'ArrowDown'
}

// Focus management utilities
export const focusManagement = {
  // Focus trap for modals and drawers
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  },

  // Restore focus to previous element
  restoreFocus: (() => {
    let previousActiveElement: HTMLElement | null = null

    return {
      save: () => {
        previousActiveElement = document.activeElement as HTMLElement
      },
      restore: () => {
        if (previousActiveElement && previousActiveElement.focus) {
          previousActiveElement.focus()
        }
      }
    }
  })(),

  // Announce changes to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }
}

// Keyboard navigation utilities
export const keyboardNavigation = {
  // Handle arrow key navigation in lists
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onSelect: (index: number) => void
  ) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = Math.min(currentIndex + 1, items.length - 1)
        onSelect(nextIndex)
        items[nextIndex]?.focus()
        break
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = Math.max(currentIndex - 1, 0)
        onSelect(prevIndex)
        items[prevIndex]?.focus()
        break
      case 'Home':
        event.preventDefault()
        onSelect(0)
        items[0]?.focus()
        break
      case 'End':
        event.preventDefault()
        const lastIndex = items.length - 1
        onSelect(lastIndex)
        items[lastIndex]?.focus()
        break
    }
  },

  // Handle Enter and Space key activation
  handleActivation: (
    event: KeyboardEvent,
    onActivate: () => void
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate()
    }
  },

  // Handle Escape key
  handleEscape: (
    event: KeyboardEvent,
    onEscape: () => void
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
    }
  }
}

// Screen reader utilities
export const screenReader = {
  // Hide element from screen readers
  hide: (element: HTMLElement) => {
    element.setAttribute('aria-hidden', 'true')
  },

  // Show element to screen readers
  show: (element: HTMLElement) => {
    element.removeAttribute('aria-hidden')
  },

  // Mark element as live region
  makeLive: (element: HTMLElement, priority: 'polite' | 'assertive' = 'polite') => {
    element.setAttribute('aria-live', priority)
    element.setAttribute('aria-atomic', 'true')
  },

  // Provide accessible name
  setAccessibleName: (element: HTMLElement, name: string) => {
    element.setAttribute('aria-label', name)
  },

  // Provide accessible description
  setAccessibleDescription: (element: HTMLElement, description: string) => {
    element.setAttribute('aria-describedby', description)
  }
}

// Color contrast utilities
export const colorContrast = {
  // Check if color combination meets WCAG AA standards
  checkContrast: (foreground: string, background: string): boolean => {
    // This is a simplified check - in production, use a proper color contrast library
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g)?.map(Number) || [0, 0, 0]
      const [r, g, b] = rgb.map(c => {
        c = c / 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const fgLuminance = getLuminance(foreground)
    const bgLuminance = getLuminance(background)
    const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05)
    
    return contrast >= 4.5 // WCAG AA standard
  },

  // Get accessible text color for background
  getAccessibleTextColor: (backgroundColor: string): string => {
    const rgb = backgroundColor.match(/\d+/g)?.map(Number) || [0, 0, 0]
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }
}

// Form accessibility utilities
export const formAccessibility = {
  // Associate label with input
  associateLabel: (inputId: string, labelText: string): HTMLLabelElement => {
    const label = document.createElement('label')
    label.setAttribute('for', inputId)
    label.textContent = labelText
    return label
  },

  // Create error message association
  createErrorMessage: (inputId: string, errorText: string): HTMLDivElement => {
    const errorId = `${inputId}-error`
    const errorElement = document.createElement('div')
    errorElement.id = errorId
    errorElement.setAttribute('role', 'alert')
    errorElement.setAttribute('aria-live', 'polite')
    errorElement.textContent = errorText
    errorElement.className = 'text-red-600 text-sm mt-1'
    
    const input = document.getElementById(inputId)
    if (input) {
      input.setAttribute('aria-describedby', errorId)
      input.setAttribute('aria-invalid', 'true')
    }
    
    return errorElement
  },

  // Clear error message
  clearErrorMessage: (inputId: string) => {
    const errorElement = document.getElementById(`${inputId}-error`)
    if (errorElement) {
      errorElement.remove()
    }
    
    const input = document.getElementById(inputId)
    if (input) {
      input.removeAttribute('aria-describedby')
      input.removeAttribute('aria-invalid')
    }
  }
}
