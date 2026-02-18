'use client'

import React from 'react'
import { Button } from '../ui/Button'
import { 
  Palette, 
  Layout, 
  Shield, 
  BarChart3,
  Code,
  Globe,
  Smartphone
} from 'lucide-react'
import { TabConfig } from './LoginConfigTypes'

interface LoginConfigTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

const tabs: TabConfig[] = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'background', label: 'Background', icon: Globe },
  { id: 'layout', label: 'Layout', icon: Layout },
  { id: 'form', label: 'Form', icon: Code },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'animations', label: 'Animations', icon: BarChart3 },
]

export function LoginConfigTabs({ activeTab, onTabChange }: LoginConfigTabsProps) {
  return (
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
  )
}
