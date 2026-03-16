'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { BotIcon, SettingsIcon, MessageSquareIcon, BarChart3Icon, CheckCircleIcon, XCircleIcon, Loader2Icon, RefreshCwIcon, SaveIcon, Trash2Icon, ChevronRightIcon, ActivityIcon, ZapIcon, ToggleLeftIcon, ToggleRightIcon, UserIcon, ClockIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5001'
const AI_ADMIN_SECRET = process.env.AI_ADMIN_SECRET || 'ai-admin-secret'

interface AIConfig {
  provider: string
  model: string
  temperature: number
  maxTokens: number
  systemPromptTemplate: string
  enabledModules: string[]
}

interface ProviderModel {
  id: string
  label: string
}

interface Provider {
  id: string
  label: string
  models: ProviderModel[]
}

interface ToolModule {
  id: string
  label: string
  description: string
  tools: { name: string; description: string }[]
  enabled: boolean
}

interface ConversationSummary {
  userId: string
  messageCount: number
  lastMessage: { role: string; content: string; timestamp: number } | null
}

interface UsageStat {
  date: string
  requests: number
  input_tokens: number
  output_tokens: number
}

function adminHeaders() {
  return { 'Content-Type': 'application/json', 'X-Admin-Secret': AI_ADMIN_SECRET }
}

async function fetchAI(path: string, opts: RequestInit = {}) {
  return fetch(`${AI_SERVICE_URL}${path}`, { ...opts, headers: { ...adminHeaders(), ...(opts.headers || {}) } })
}

export default function AIPage() {
  const [tab, setTab] = useState('overview')
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const [serviceInfo, setServiceInfo] = useState<any>(null)
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [toolModules, setToolModules] = useState<ToolModule[]>([])
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [convMessages, setConvMessages] = useState<any[]>([])
  const [stats, setStats] = useState<{ daily: UsageStat[]; totals: any } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const checkHealth = useCallback(async () => {
    setServiceStatus('checking')
    try {
      const res = await fetch(`${AI_SERVICE_URL}/health`)
      const data = await res.json()
      setServiceInfo(data)
      setServiceStatus(data.status === 'ok' ? 'ok' : 'error')
    } catch {
      setServiceStatus('error')
    }
  }, [])

  const loadConfig = useCallback(async () => {
    try {
      const [cfgRes, toolsRes, provRes] = await Promise.all([
        fetchAI('/admin/config'),
        fetchAI('/admin/tools'),
        fetchAI('/admin/providers'),
      ])
      if (cfgRes.ok) setConfig(await cfgRes.json())
      if (toolsRes.ok) {
        const data = await toolsRes.json()
        setToolModules(data.modules || [])
      }
      if (provRes.ok) {
        const data = await provRes.json()
        setProviders(data.providers || [])
      }
    } catch {}
  }, [])

  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAI('/admin/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch {} finally { setLoading(false) }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetchAI('/admin/stats?days=30')
      if (res.ok) setStats(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    checkHealth()
    loadConfig()
    loadStats()
  }, [checkHealth, loadConfig, loadStats])

  useEffect(() => {
    if (tab === 'conversations') loadConversations()
  }, [tab, loadConversations])

  const handleSaveConfig = async () => {
    if (!config) return
    setSaving(true)
    try {
      const enabledModules = toolModules.filter(m => m.enabled).map(m => m.id)
      const res = await fetchAI('/admin/config', {
        method: 'PUT',
        body: JSON.stringify({ ...config, enabledModules }),
      })
      setSaveMsg(res.ok ? 'Saved!' : 'Failed to save')
    } catch { setSaveMsg('Error saving') }
    finally { setSaving(false); setTimeout(() => setSaveMsg(null), 2500) }
  }

  const handleViewConversation = async (userId: string) => {
    setSelectedConv(userId)
    try {
      const res = await fetchAI(`/admin/conversations/${userId}`)
      if (res.ok) {
        const data = await res.json()
        setConvMessages(data.messages || [])
      }
    } catch {}
  }

  const handleDeleteConversation = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    await fetchAI(`/admin/conversations/${userId}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.userId !== userId))
    if (selectedConv === userId) { setSelectedConv(null); setConvMessages([]) }
  }

  const toggleModule = (id: string) => {
    setToolModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: <ActivityIcon className="w-4 h-4" /> },
    { id: 'config', label: 'Configuration', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'conversations', label: 'Conversations', icon: <MessageSquareIcon className="w-4 h-4" /> },
    { id: 'stats', label: 'Analytics', icon: <BarChart3Icon className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            AI Service
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 ml-13">Manage your AI assistant — configuration, tools, conversations, and usage.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            serviceStatus === 'ok' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
            serviceStatus === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' :
            'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'
          }`}>
            {serviceStatus === 'checking' ? <Loader2Icon className="w-3 h-3 animate-spin" /> :
             serviceStatus === 'ok' ? <CheckCircleIcon className="w-3 h-3" /> :
             <XCircleIcon className="w-3 h-3" />}
            {serviceStatus === 'checking' ? 'Checking...' : serviceStatus === 'ok' ? 'Online' : 'Offline'}
          </div>
          <button onClick={checkHealth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400">
            <RefreshCwIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              tab === t.id
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Requests', value: stats?.totals?.requests?.toLocaleString() ?? '—', icon: <ZapIcon className="w-4 h-4 text-violet-500" />, color: 'violet' },
              { label: 'Input Tokens', value: stats?.totals?.input_tokens?.toLocaleString() ?? '—', icon: <ActivityIcon className="w-4 h-4 text-blue-500" />, color: 'blue' },
              { label: 'Output Tokens', value: stats?.totals?.output_tokens?.toLocaleString() ?? '—', icon: <BarChart3Icon className="w-4 h-4 text-indigo-500" />, color: 'indigo' },
              { label: 'Conversations', value: conversations.length.toString(), icon: <MessageSquareIcon className="w-4 h-4 text-emerald-500" />, color: 'emerald' },
            ].map(card => (
              <div key={card.label} className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  {card.icon}
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">{card.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Service Health */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-blue-500" /> Service Health
            </h3>
            {serviceInfo ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(serviceInfo.checks || {}).map(([key, ok]) => (
                  <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                    {ok ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <XCircleIcon className="w-4 h-4 text-red-500" />}
                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 capitalize">{key}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                  <ClockIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-zinc-300">Uptime: {Math.floor((serviceInfo.uptime || 0) / 60)}m</span>
                </div>
              </div>
            ) : serviceStatus === 'error' ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                <XCircleIcon className="w-4 h-4" />
                AI service is offline. Make sure it&apos;s running on port 5001.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2Icon className="w-4 h-4 animate-spin" /> Checking service health...
              </div>
            )}
          </div>

          {/* Current Config Summary */}
          {config && (
            <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BotIcon className="w-4 h-4 text-violet-500" /> Active Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">Provider</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{config.provider}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">Model</p>
                  <p className="font-medium text-gray-900 dark:text-white">{config.model}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">Temperature</p>
                  <p className="font-medium text-gray-900 dark:text-white">{config.temperature}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-0.5">Max Tokens</p>
                  <p className="font-medium text-gray-900 dark:text-white">{config.maxTokens}</p>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mb-1">Enabled Modules</p>
                  <div className="flex gap-2 flex-wrap">
                    {config.enabledModules.map(m => (
                      <span key={m} className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration Tab */}
      {tab === 'config' && config && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BotIcon className="w-4 h-4 text-violet-500" /> Model Settings
              </h3>
              <div className="flex items-center gap-2">
                {saveMsg && <span className={`text-xs font-medium ${saveMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{saveMsg}</span>}
                <Button size="sm" onClick={handleSaveConfig} disabled={saving} className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0">
                  {saving ? <Loader2Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5 mr-1.5" />}
                  Save
                </Button>
              </div>
            </div>

            {/* Provider + Model Selector */}
            <div className="space-y-4">
              {providers.map(provider => (
                <div key={provider.id}>
                  <button
                    onClick={() => setConfig(c => c ? { ...c, provider: provider.id, model: provider.models[0]?.id ?? c.model } : c)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border mb-2 text-left transition-all ${
                      config.provider === provider.id
                        ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-500/5'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${config.provider === provider.id ? 'bg-violet-500' : 'bg-gray-300 dark:bg-zinc-600'}`} />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{provider.label}</span>
                    {config.provider === provider.id && (
                      <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">ACTIVE</span>
                    )}
                  </button>

                  {config.provider === provider.id && (
                    <div className="pl-4 space-y-2">
                      {provider.models.map(m => (
                        <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          config.model === m.id
                            ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-500/5 dark:border-violet-500'
                            : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                        }`}>
                          <input type="radio" name="model" value={m.id} checked={config.model === m.id}
                            onChange={e => setConfig(c => c ? { ...c, model: e.target.value } : c)}
                            className="text-violet-500" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{m.label}</p>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Temperature + Max Tokens */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                  Temperature <span className="text-gray-400">({config.temperature})</span>
                </label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={config.temperature}
                  onChange={e => setConfig(c => c ? { ...c, temperature: parseFloat(e.target.value) } : c)}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  <span>Precise</span><span>Creative</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Max Tokens</label>
                <input
                  type="number" min="512" max="8192" step="256"
                  value={config.maxTokens}
                  onChange={e => setConfig(c => c ? { ...c, maxTokens: parseInt(e.target.value) } : c)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                System Prompt Template
                <span className="ml-2 text-gray-400 font-normal">Use {'{{date}}'} and {'{{userName}}'} as placeholders</span>
              </label>
              <textarea
                rows={6}
                value={config.systemPromptTemplate}
                onChange={e => setConfig(c => c ? { ...c, systemPromptTemplate: e.target.value } : c)}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
              />
            </div>
          </div>

          {/* Tool Modules */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ZapIcon className="w-4 h-4 text-amber-500" /> Tool Modules
            </h3>
            <div className="space-y-3">
              {toolModules.map(m => (
                <div key={m.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  m.enabled
                    ? 'border-violet-200 dark:border-violet-500/20 bg-violet-50/30 dark:bg-violet-500/5'
                    : 'border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30'
                }`}>
                  <button onClick={() => toggleModule(m.id)} className="mt-0.5 shrink-0">
                    {m.enabled
                      ? <ToggleRightIcon className="w-5 h-5 text-violet-500" />
                      : <ToggleLeftIcon className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.label}</p>
                      {m.enabled && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">ENABLED</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{m.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.tools.map(t => (
                        <span key={t.name} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">{t.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conversations Tab */}
      {tab === 'conversations' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* List */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Conversations ({conversations.length})</h3>
              <button onClick={loadConversations} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded">
                <RefreshCwIcon className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2Icon className="w-5 h-5 animate-spin text-violet-500" /></div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-zinc-500">
                <MessageSquareIcon className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                {conversations.map(conv => (
                  <div
                    key={conv.userId}
                    onClick={() => handleViewConversation(conv.userId)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group ${selectedConv === conv.userId ? 'bg-violet-50/50 dark:bg-violet-500/5' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-500 dark:text-zinc-400 truncate">{conv.userId}</p>
                      {conv.lastMessage && (
                        <p className="text-xs text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                          {conv.lastMessage.role === 'user' ? 'User: ' : 'AI: '}{conv.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-gray-400">{conv.messageCount} msgs</span>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.userId, e)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 text-gray-400 rounded"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
            {selectedConv ? (
              <>
                <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                  <p className="text-xs font-mono text-gray-500 dark:text-zinc-400 truncate">{selectedConv}</p>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
                  {convMessages.map((msg, i) => (
                    <div key={i} className={`px-4 py-3 ${msg.role === 'user' ? 'bg-gray-50/50 dark:bg-zinc-800/30' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase ${msg.role === 'user' ? 'text-blue-500' : 'text-violet-500'}`}>{msg.role}</span>
                        {msg.timestamp && <span className="text-[10px] text-gray-400 dark:text-zinc-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400 dark:text-zinc-500">
                <MessageSquareIcon className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">Select a conversation to view</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {tab === 'stats' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Requests (30d)', value: stats.totals.requests, color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Input Tokens (30d)', value: stats.totals.input_tokens?.toLocaleString(), color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Output Tokens (30d)', value: stats.totals.output_tokens?.toLocaleString(), color: 'text-indigo-600 dark:text-indigo-400' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Daily Requests (last 30 days)</h3>
            <div className="flex items-end gap-0.5 h-24">
              {stats.daily.slice(-30).map((d, i) => {
                const maxReq = Math.max(...stats.daily.map((x: UsageStat) => x.requests), 1)
                const h = (d.requests / maxReq) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${Math.max(h, 2)}%` }}
                      className="w-full rounded-t bg-violet-400 dark:bg-violet-500 opacity-70 group-hover:opacity-100 transition-opacity"
                      title={`${d.date}: ${d.requests} requests`}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
              <span>{stats.daily[0]?.date}</span>
              <span>{stats.daily[stats.daily.length - 1]?.date}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
