/**
 * Error Handling Utilities
 * Provides consistent error handling across the admin application
 */

export interface AppError {
  message: string
  code?: string
  statusCode?: number
  details?: any
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error.response) {
    // Axios error
    const status = error.response.status
    const data = error.response.data
    return new AppError(
      data?.message || error.message || 'An error occurred',
      data?.code,
      status,
      data
    )
  }

  if (error.message) {
    return new AppError(error.message)
  }

  return new AppError('An unexpected error occurred')
}

/**
 * Format error for display
 */
export function formatError(error: AppError | Error | any): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('Failed to fetch')
  )
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return (
    error?.statusCode === 401 ||
    error?.statusCode === 403 ||
    error?.code === 'UNAUTHORIZED' ||
    error?.code === 'FORBIDDEN'
  )
}

/**
 * Show user-friendly error toast
 */
export function showErrorToast(error: AppError | Error | any) {
  const message = formatError(error)
  
  // You can integrate with a toast library here
  // For now, we'll use console and could trigger a custom event
  console.error('Error:', message)
  
  // Dispatch custom event for toast system
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { type: 'error', message }
    }))
  }
}





