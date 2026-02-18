'use client'

import React, { useState } from 'react'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Tabs } from '../ui/Tabs'
import { 
  Globe, 
  Smartphone, 
  AppWindow, 
  Copy, 
  Check,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  Server,
  Building2
} from 'lucide-react'
import { DEV_GUIDE_CONTENT, DevGuideCategory } from './DevGuideContent'

interface DevGuideDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function DevGuideDrawer({ isOpen, onClose }: DevGuideDrawerProps) {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('web-app')

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(id)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Globe': return <Globe className="h-4 w-4" />
      case 'Smartphone': return <Smartphone className="h-4 w-4" />
      case 'AppWindow': return <AppWindow className="h-4 w-4" />
      case 'Server': return <Server className="h-4 w-4" />
      case 'ShieldCheck': return <ShieldCheck className="h-4 w-4" />
      case 'Building2': return <Building2 className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const activeCategory = DEV_GUIDE_CONTENT.find(cat => cat.id === activeTab)

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Developer Integration Guide"
      className="max-w-xl"
    >
      <div className="flex flex-col h-full space-y-6">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 leading-relaxed">
            Choose your platform to see how to integrate the Boundary Authentication Gateway into your application.
          </p>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <div className="text-xs text-blue-800 dark:text-blue-300">
              Boundary uses standard <span className="font-bold">OAuth 2.0</span> and <span className="font-bold">OpenID Connect</span> protocols.
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <Tabs 
            tabs={DEV_GUIDE_CONTENT.map(cat => ({
              id: cat.id,
              label: cat.title,
              icon: getIcon(cat.icon)
            }))}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="mb-6"
          />

          <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-12">
            {activeCategory?.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {section.title}
                  </h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-slate-50">
                    {section.language}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {section.description}
                </p>

                <div className="relative group">
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 bg-white shadow-sm border border-slate-200"
                      onClick={() => handleCopy(section.code, `${activeTab}-${idx}`)}
                    >
                      {copiedIndex === `${activeTab}-${idx}` ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                      )}
                    </Button>
                  </div>
                  <pre className="p-4 bg-slate-950 rounded-2xl overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed border border-slate-800">
                    <code>{section.code}</code>
                  </pre>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold" onClick={() => {
                onClose()
                window.location.href = '/dev-hub'
              }}>
                <BookOpen className="h-4 w-4 mr-2" />
                View Full Integrated Dev Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
