'use client'

import React from 'react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DeviceConfigTabsProps {
  activeDevice: 'desktop' | 'mobile' | 'tablet'
  onDeviceChange: (device: 'desktop' | 'mobile' | 'tablet') => void
  enableResponsive: boolean
}

export function DeviceConfigTabs({ activeDevice, onDeviceChange, enableResponsive }: DeviceConfigTabsProps) {
  if (!enableResponsive) {
    return null
  }

  const devices = [
    { id: 'desktop' as const, label: 'Desktop', icon: Monitor },
    { id: 'mobile' as const, label: 'Mobile', icon: Smartphone },
    { id: 'tablet' as const, label: 'Tablet', icon: Tablet }
  ]

  return (
    <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
      {devices.map((device) => {
        const Icon = device.icon
        return (
          <button
            key={device.id}
            onClick={() => onDeviceChange(device.id)}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeDevice === device.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{device.label}</span>
          </button>
        )
      })}
    </div>
  )
}
