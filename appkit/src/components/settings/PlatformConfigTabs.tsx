'use client'

import React from 'react'
import { Button } from '../ui/Button'
import { 
  Globe, 
  Smartphone,
  Monitor,
  Tablet,
  Code,
  Palette,
  Layout,
  Shield,
  BarChart3,
  UserPlus,
  MonitorSmartphone,
  Cpu
} from 'lucide-react'
import { TabConfig } from './LoginConfigTypes'

interface PlatformConfigTabsProps {
  activePlatform: 'web-desktop' | 'web-mobile' | 'mobile-app'
  onPlatformChange: (platform: 'web-desktop' | 'web-mobile' | 'mobile-app') => void
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function PlatformConfigTabs({ activePlatform, onPlatformChange, activeTab, onTabChange }: PlatformConfigTabsProps) {
  const commonTabs: TabConfig[] = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'background', label: 'Background', icon: Globe },
    { id: 'layout', label: 'Layout', icon: Layout },
    { id: 'form', label: 'Form', icon: Code },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'animations', label: 'Animations', icon: BarChart3 },
    { id: 'responsive-config', label: 'Responsive', icon: MonitorSmartphone },
    { id: 'advanced', label: 'Advanced', icon: Cpu },
    { id: 'signup', label: 'Signup', icon: UserPlus },
  ]

  const tabs = commonTabs

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => onPlatformChange('web-desktop')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activePlatform === 'web-desktop'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Monitor className="h-4 w-4" />
          <span>Common</span>
        </button>
        <button
          onClick={() => onPlatformChange('web-mobile')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activePlatform === 'web-mobile'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Web Mobile</span>
        </button>
        <button
          onClick={() => onPlatformChange('mobile-app')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activePlatform === 'mobile-app'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tablet className="h-4 w-4" />
          <span>Mobile App</span>
        </button>
      </div>

      {/* Configuration Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
