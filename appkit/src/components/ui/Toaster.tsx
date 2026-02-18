'use client'

import { useToast } from '@/hooks/use-toast'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'glass rounded-xl shadow-frosted-lg border p-4 min-w-[300px] max-w-md',
            'animate-slide-down',
            toast.variant === 'destructive' && 'bg-red-50 border-red-200 text-red-800',
            toast.variant === 'success' && 'bg-green-50 border-green-200 text-green-800',
            (!toast.variant || toast.variant === 'default') && 'bg-white border-gray-200 text-gray-800'
          )}
          role="alert"
        >
          <div className="flex items-start gap-3">
            {toast.variant === 'success' && (
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
            )}
            {toast.variant === 'destructive' && (
              <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            )}
            <div className="flex-1">
              {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
              {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/40 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
