'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (event: CustomEvent<{ type: string; message: string }>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        type: event.detail.type as Toast['type'],
        message: event.detail.message,
        duration: 5000
      }
      setToasts(prev => [...prev, toast])

      if (toast.duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id))
        }, toast.duration)
      }
    }

    window.addEventListener('show-toast', handleToast as EventListener)
    return () => window.removeEventListener('show-toast', handleToast as EventListener)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    warning: ExclamationCircleIcon,
    info: InformationCircleIcon,
  }

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={clsx(
        'glass rounded-xl shadow-frosted-lg border p-4 min-w-[300px] max-w-md',
        'animate-slide-down',
        styles[toast.type]
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm font-medium">
          {toast.message}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/40 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}





