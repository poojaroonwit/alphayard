'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import {
  SaveIcon,
  Loader2Icon,
  BrainCircuitIcon,
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  ZapIcon
} from 'lucide-react'

interface AISettingsProps {
  appId: string;
  application: any;
  setApplication: React.Dispatch<React.SetStateAction<any>>;
  saving: boolean;
  message: string;
  onSave: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({
  application,
  setApplication,
  saving,
  message,
  onSave
}) => {
  const [showPrimary, setShowPrimary] = React.useState(false)
  const [showFallback, setShowFallback] = React.useState(false)

  if (!application) return null

  const aiConfig = application.settings?.aiConfig || {
    enabled: false,
    provider: 'openai',
    primaryKey: '',
    fallbackKey: '',
    model: 'gpt-4o'
  }

  const updateAIConfig = (updates: Partial<typeof aiConfig>) => {
    setApplication((prev: any) => ({
      ...prev,
      settings: {
        ...prev.settings,
        aiConfig: {
          ...aiConfig,
          ...updates
        }
      }
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI Configuration</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Manage AI providers and API keys for this application.</p>
        </div>
        <div className="flex items-center gap-2">
          {message && <span className={`text-xs font-medium ${message === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{message}</span>}
          <Button onClick={onSave} disabled={saving} className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
            {saving ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-1.5" />}
            Save AI Config
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <BrainCircuitIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">Enable AI Services</h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Toggle AI features on or off for this application.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={aiConfig.enabled}
              onChange={(e) => updateAIConfig({ enabled: e.target.checked })}
              title="Toggle AI services"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className={`space-y-6 ${!aiConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Provider</label>
              <select
                title="AI Provider"
                value={aiConfig.provider}
                onChange={(e) => updateAIConfig({ provider: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google Gemini</option>
                <option value="groq">Groq</option>
                <option value="mistral">Mistral AI</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Default Model</label>
              <input
                type="text"
                placeholder="e.g. gpt-4o, claude-3-5-sonnet-20240620"
                value={aiConfig.model}
                onChange={(e) => updateAIConfig({ model: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                title="Default AI Model"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Primary API Key</label>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <ShieldCheckIcon className="w-3 h-3" /> Securely Stored
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <KeyIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type={showPrimary ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={aiConfig.primaryKey}
                  onChange={(e) => updateAIConfig({ primaryKey: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  title="Primary API Key"
                />
                <button
                  type="button"
                  onClick={() => setShowPrimary(!showPrimary)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                  title={showPrimary ? 'Hide key' : 'Show key'}
                >
                  {showPrimary ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Fallback API Key</label>
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold">OPTIONAL</span>
                </div>
                <div className="group relative">
                  <AlertCircleIcon className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 rounded-lg bg-gray-900 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    Used automatically if the primary key fails or reaches rate limits.
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <ZapIcon className="w-4 h-4 text-amber-500/50" />
                </div>
                <input
                  type={showFallback ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={aiConfig.fallbackKey}
                  onChange={(e) => updateAIConfig({ fallbackKey: e.target.value })}
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  title="Fallback API Key"
                />
                <button
                  type="button"
                  onClick={() => setShowFallback(!showFallback)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
                  title={showFallback ? 'Hide key' : 'Show key'}
                >
                  {showFallback ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10">
            <h5 className="text-xs font-bold text-blue-900 dark:text-blue-100 flex items-center gap-1.5 mb-1.5">
              <ShieldCheckIcon className="w-3.5 h-3.5" /> Security Note
            </h5>
            <p className="text-[11px] text-blue-800/70 dark:text-blue-300/60 leading-relaxed">
              API keys are encrypted at rest and never shared with users or third parties. 
              Only your backend services will use these keys via the AlphaYard AI Proxy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
