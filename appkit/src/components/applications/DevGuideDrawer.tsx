'use client'

import React, { useState } from 'react'
import { XIcon, CodeIcon, CopyIcon, CheckIcon, GlobeIcon, SmartphoneIcon } from 'lucide-react'

interface DevGuideDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  platform?: 'web' | 'mobile' | 'both'
  webContent?: { description: string; code: string; language?: string }[]
  mobileContent?: { description: string; code: string; language?: string }[]
  sharedContent?: { description: string; code: string; language?: string }[]
  apiEndpoints?: string
}

export default function DevGuideDrawer({ open, onClose, title, description, platform = 'both', webContent, mobileContent, sharedContent, apiEndpoints }: DevGuideDrawerProps) {
  const [activeTab, setActiveTab] = useState<'web' | 'mobile'>(platform === 'mobile' ? 'mobile' : 'web')
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null)

  if (!open) return null

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedIdx(id)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const content = sharedContent || (activeTab === 'web' ? webContent : mobileContent) || []

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-[520px] max-w-[90vw] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <CodeIcon className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button onClick={onClose} title="Close drawer" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Tabs (only if both platforms have content) */}
        {platform === 'both' && webContent && mobileContent && (
          <div className="flex items-center gap-1 px-5 pt-3">
            <button
              onClick={() => setActiveTab('web')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'web' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <GlobeIcon className="w-3.5 h-3.5" />
              Web App
            </button>
            <button
              onClick={() => setActiveTab('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'mobile' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
            >
              <SmartphoneIcon className="w-3.5 h-3.5" />
              Mobile App
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <p className="text-xs text-gray-500 dark:text-zinc-400">{description}</p>

          {content.map((item, i) => (
            <div key={`${activeTab}-${i}`} className="space-y-2">
              {item.description && <p className="text-xs text-gray-600 dark:text-zinc-400">{item.description}</p>}
              <div className="relative group">
                <pre className="p-3 rounded-lg bg-[#0d1117] text-gray-300 text-xs overflow-x-auto border border-gray-800 leading-relaxed">
                  <code>{item.code}</code>
                </pre>
                <button
                  onClick={() => copyCode(item.code, `${activeTab}-${i}`)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy code"
                >
                  {copiedIdx === `${activeTab}-${i}` ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <CopyIcon className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}

          {apiEndpoints && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800/50">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">API Endpoints:</p>
              <div className="relative group">
                <pre className="p-3 rounded-lg bg-[#0d1117] text-gray-300 text-xs overflow-x-auto border border-gray-800 leading-relaxed">
                  <code>{apiEndpoints}</code>
                </pre>
                <button
                  onClick={() => copyCode(apiEndpoints, 'api')}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy endpoints"
                >
                  {copiedIdx === 'api' ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <CopyIcon className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
