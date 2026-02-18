'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 animate-pulse" />
    )
  }

  const themes = [
    { id: 'light', icon: SunIcon, label: 'Light' },
    { id: 'dark', icon: MoonIcon, label: 'Dark' },
    { id: 'system', icon: ComputerDesktopIcon, label: 'System' },
  ]

  return (
    <div className="flex items-center p-1 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
      {themes.map((t) => {
        const isActive = theme === t.id
        const Icon = t.icon
        
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`
              p-1.5 rounded-md transition-all duration-200
              ${isActive 
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            aria-label={`Switch to ${t.label} theme`}
            title={t.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}
