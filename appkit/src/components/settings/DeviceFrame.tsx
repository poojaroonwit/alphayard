'use client'

import React from 'react'
import { cn } from '../../lib/utils'

interface DeviceFrameProps {
  platform: 'web-desktop' | 'web-mobile' | 'mobile-app'
  deviceType: 'desktop' | 'mobile' | 'tablet'
  children: React.ReactNode
  className?: string
}

export function DeviceFrame({ platform, deviceType, children, className }: DeviceFrameProps) {
  // Web Desktop - Browser window frame
  if (platform === 'web-desktop') {
    return (
      <div className={cn('relative mx-auto', className)}>
        <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
          {/* Browser Header */}
          <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-gray-700 rounded px-3 py-1 text-xs text-gray-300 text-center">
                https://yourapp.com/login
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
            </div>
          </div>
          {/* Browser Content */}
          <div className="bg-white overflow-y-auto" style={{ width: '1200px', height: '800px' }}>
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Web Mobile - Mobile browser frame
  if (platform === 'web-mobile') {
    return (
      <div className={cn('relative mx-auto', className)}>
        <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden p-2">
          {/* Mobile Browser Header */}
          <div className="bg-gray-800 rounded-t-2xl px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex-1 mx-2">
                <div className="bg-gray-700 rounded px-2 py-1 text-xs text-gray-300 text-center truncate">
                  yourapp.com/login
                </div>
              </div>
              <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
                <div className="w-1 h-3 bg-gray-400 rounded"></div>
              </div>
            </div>
          </div>
          {/* Mobile Browser Content */}
          <div className="bg-white rounded-b-2xl overflow-y-auto" style={{ width: '375px', height: '667px' }}>
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Mobile App - Native app frame
  if (platform === 'mobile-app') {
    if (deviceType === 'mobile') {
      return (
        <div className={cn('relative mx-auto', className)}>
          <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ width: '375px', height: '812px' }}>
            {/* Phone Notch */}
            <div className="bg-black h-8 relative flex-none">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-black rounded-b-2xl"></div>
            </div>
            {/* App Content */}
            <div className="bg-white flex-1 overflow-y-auto relative">
              {children}
            </div>
            {/* Home Indicator */}
            <div className="bg-black h-8 flex items-center justify-center flex-none">
              <div className="w-32 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      )
    }

    if (deviceType === 'tablet') {
      return (
        <div className={cn('relative mx-auto', className)}>
          <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ width: '768px', height: '1024px' }}>
            {/* Tablet Status Bar */}
            <div className="bg-black h-6 flex-none"></div>
            {/* App Content */}
            <div className="bg-white flex-1 overflow-y-auto relative">
              {children}
            </div>
            {/* Home Indicator */}
            <div className="bg-black h-6 flex items-center justify-center flex-none">
              <div className="w-20 h-1 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      )
    }
  }

  // Fallback - Simple frame
  return (
    <div className={cn('bg-white rounded-lg shadow-lg border border-gray-200', className)}>
      {children}
    </div>
  )
}
