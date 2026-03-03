'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/use-toast'
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  BugIcon,
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  DownloadIcon,
  Loader2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ServerIcon,
  MonitorIcon,
  GlobeIcon,
  ShieldIcon,
  DatabaseIcon,
  XIcon,
  ClockIcon,
  SettingsIcon,
} from 'lucide-react'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
type LogSource = 'server' | 'client' | 'api' | 'auth' | 'database' | 'webhook'

interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  source: LogSource
  context?: Record<string, unknown>
  stack?: string
  userId?: string
  requestId?: string
  duration?: number
}

interface LogsSettings {
  minLevel: LogLevel
  sourceToggles: Record<LogSource, boolean>
  retentionDays: number
  livePollingIntervalSeconds: number
}

const DEFAULT_LOG_SETTINGS: LogsSettings = {
  minLevel: 'info',
  sourceToggles: {
    server: true,
    client: true,
    api: true,
    auth: true,
    database: true,
    webhook: true,
  },
  retentionDays: 90,
  livePollingIntervalSeconds: 5,
}

const LEVEL_CONFIG: Record<LogLevel, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  debug: { label: 'DEBUG', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-zinc-800', icon: <BugIcon className="w-3.5 h-3.5" /> },
  info: { label: 'INFO', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: <InfoIcon className="w-3.5 h-3.5" /> },
  warn: { label: 'WARN', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: <AlertTriangleIcon className="w-3.5 h-3.5" /> },
  error: { label: 'ERROR', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-500/10', icon: <AlertCircleIcon className="w-3.5 h-3.5" /> },
  fatal: { label: 'FATAL', color: 'text-red-800', bg: 'bg-red-100 dark:bg-red-500/20', icon: <AlertCircleIcon className="w-3.5 h-3.5" /> },
}

const SOURCE_CONFIG: Record<LogSource, { label: string; icon: React.ReactNode }> = {
  server: { label: 'Server', icon: <ServerIcon className="w-3.5 h-3.5" /> },
  client: { label: 'Client', icon: <MonitorIcon className="w-3.5 h-3.5" /> },
  api: { label: 'API', icon: <GlobeIcon className="w-3.5 h-3.5" /> },
  auth: { label: 'Auth', icon: <ShieldIcon className="w-3.5 h-3.5" /> },
  database: { label: 'Database', icon: <DatabaseIcon className="w-3.5 h-3.5" /> },
  webhook: { label: 'Webhook', icon: <GlobeIcon className="w-3.5 h-3.5" /> },
}

export default function SystemLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<LogSource | 'all'>('all')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [runningRetention, setRunningRetention] = useState(false)
  const [creatingTestLog, setCreatingTestLog] = useState(false)
  const [logSettings, setLogSettings] = useState<LogsSettings>(DEFAULT_LOG_SETTINGS)

  const loadLogSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/v1/admin/system/config/logs', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load log settings')
      const data = await res.json()
      setLogSettings((prev) => ({
        ...prev,
        ...(data?.config || {}),
        sourceToggles: {
          ...prev.sourceToggles,
          ...(data?.config?.sourceToggles || {}),
        },
      }))
    } catch (error) {
      console.error('Failed to load log settings:', error)
      toast({ title: 'Load failed', description: 'Could not load log settings.', variant: 'destructive' })
    }
  }, [toast])

  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token') || ''
      const query = new URLSearchParams()
      if (searchQuery) query.set('q', searchQuery)
      const effectiveLevel = levelFilter === 'all' ? logSettings.minLevel : levelFilter
      query.set('level', effectiveLevel)
      if (sourceFilter !== 'all' && logSettings.sourceToggles[sourceFilter]) query.set('source', sourceFilter)
      query.set('limit', '500')

      const res = await fetch(`/api/v1/admin/system/logs?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load logs')
      const data = await res.json()
      const entries: LogEntry[] = Array.isArray(data?.logs) ? data.logs : []
      const sourceFiltered = entries.filter((entry: LogEntry) => logSettings.sourceToggles[entry.source])
      setLogs(sourceFiltered)
      setFilteredLogs(sourceFiltered)
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      setLogs([])
      setFilteredLogs([])
      toast({ title: 'Fetch failed', description: 'Could not fetch system logs.', variant: 'destructive' })
    }
  }, [levelFilter, searchQuery, sourceFilter, logSettings, toast])

  useEffect(() => {
    loadLogSettings()
  }, [loadLogSettings])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (!isLive) return
    const intervalSeconds = Math.max(2, Number(logSettings.livePollingIntervalSeconds || 5))
    const interval = setInterval(fetchLogs, intervalSeconds * 1000)
    return () => clearInterval(interval)
  }, [fetchLogs, isLive, logSettings.livePollingIntervalSeconds])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchLogs().finally(() => setIsRefreshing(false))
  }

  const saveLogSettings = async () => {
    try {
      setSettingsSaving(true)
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/v1/admin/system/config/logs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config: logSettings }),
      })
      if (!res.ok) throw new Error('Failed to save log settings')
      toast({ title: 'Saved', description: 'Log settings updated successfully.', variant: 'success' })
      setSettingsOpen(false)
      fetchLogs()
    } catch (error) {
      console.error('Failed to save log settings:', error)
      toast({ title: 'Save failed', description: 'Could not save log settings.', variant: 'destructive' })
    } finally {
      setSettingsSaving(false)
    }
  }

  const runRetentionNow = async () => {
    try {
      setRunningRetention(true)
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/v1/admin/system/logs/retention', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Retention cleanup failed')
      const data = await res.json()
      const deletedTotal = Object.values(data?.deleted || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0)
      toast({ title: 'Retention completed', description: `Deleted ${deletedTotal} old log entries.`, variant: 'success' })
      fetchLogs()
    } catch (error) {
      console.error('Failed to run retention cleanup:', error)
      toast({ title: 'Retention failed', description: 'Could not execute log retention cleanup.', variant: 'destructive' })
    } finally {
      setRunningRetention(false)
    }
  }

  const createTestLog = async () => {
    try {
      setCreatingTestLog(true)
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/v1/admin/system/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          level: 'info',
          source: 'server',
          message: 'Manual test log created from System Logs page',
          context: { from: 'system-logs-ui' },
        }),
      })
      if (!res.ok) throw new Error('Failed to create test log')
      toast({ title: 'Test log created', description: 'A new internal log entry was added.', variant: 'success' })
      fetchLogs()
    } catch (error) {
      console.error('Failed to create test log:', error)
      toast({ title: 'Create failed', description: 'Could not create a test log entry.', variant: 'destructive' })
    } finally {
      setCreatingTestLog(false)
    }
  }

  const handleExport = () => {
    const csv = [
      'timestamp,level,source,message,requestId,userId,duration',
      ...filteredLogs.map(l =>
        `"${l.timestamp}","${l.level}","${l.source}","${l.message.replace(/"/g, '""')}","${l.requestId || ''}","${l.userId || ''}","${l.duration || ''}"`
      )
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatTimeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  const levelCounts = {
    error: logs.filter(l => l.level === 'error' || l.level === 'fatal').length,
    warn: logs.filter(l => l.level === 'warn').length,
    info: logs.filter(l => l.level === 'info').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">Real-time application logs, errors, and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon className="w-4 h-4 mr-1.5" />
            Settings
          </Button>
          <Button
            variant={isLive ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={isLive ? 'bg-emerald-500 text-white border-0 animate-pulse' : ''}
          >
            <span className={`w-2 h-2 rounded-full mr-1.5 ${isLive ? 'bg-white' : 'bg-gray-400'}`} />
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <RefreshCwIcon className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadIcon className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={createTestLog} disabled={creatingTestLog}>
            {creatingTestLog ? <Loader2Icon className="w-4 h-4 mr-1.5 animate-spin" /> : <BugIcon className="w-4 h-4 mr-1.5" />}
            Test Log
          </Button>
        </div>
      </div>

      {settingsOpen && (
        <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Log Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Minimum Level</label>
              <select
                title="Minimum log level"
                value={logSettings.minLevel}
                onChange={(e) => setLogSettings((prev) => ({ ...prev, minLevel: e.target.value as LogLevel }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
                <option value="fatal">Fatal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Retention Days</label>
              <input
                type="number"
                min={1}
                title="Retention days"
                value={logSettings.retentionDays}
                onChange={(e) => setLogSettings((prev) => ({ ...prev, retentionDays: Number(e.target.value || 90) }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Live Polling (seconds)</label>
              <input
                type="number"
                min={2}
                title="Live polling interval"
                value={logSettings.livePollingIntervalSeconds}
                onChange={(e) => setLogSettings((prev) => ({ ...prev, livePollingIntervalSeconds: Number(e.target.value || 5) }))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-2">Enabled Sources</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(logSettings.sourceToggles) as LogSource[]).map((source) => (
                <label key={source} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(logSettings.sourceToggles[source])}
                    onChange={(e) =>
                      setLogSettings((prev) => ({
                        ...prev,
                        sourceToggles: {
                          ...prev.sourceToggles,
                          [source]: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  {source}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={runRetentionNow} disabled={runningRetention}>
              {runningRetention ? 'Running...' : 'Run Retention Now'}
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={saveLogSettings} disabled={settingsSaving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              {settingsSaving ? 'Saving...' : 'Save Log Settings'}
            </Button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Logs</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{logs.length}</div>
        </div>
        <div className="p-3 rounded-xl border border-red-200/60 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Errors</div>
          <div className="text-xl font-bold text-red-600">{levelCounts.error}</div>
        </div>
        <div className="p-3 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5">
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Warnings</div>
          <div className="text-xl font-bold text-amber-600">{levelCounts.warn}</div>
        </div>
        <div className="p-3 rounded-xl border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Info</div>
          <div className="text-xl font-bold text-blue-600">{levelCounts.info}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            title="Search logs"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search logs by message, request ID, user ID..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} title="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          title="Filter by log level"
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value as LogLevel | 'all')}
          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="fatal">Fatal</option>
        </select>
        <select
          title="Filter by log source"
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value as LogSource | 'all')}
          className="px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Sources</option>
          <option value="server">Server</option>
          <option value="client">Client</option>
          <option value="api">API</option>
          <option value="auth">Auth</option>
          <option value="database">Database</option>
          <option value="webhook">Webhook</option>
        </select>
      </div>

      {/* Log Entries */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {filteredLogs.length} log {filteredLogs.length === 1 ? 'entry' : 'entries'}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <ClockIcon className="w-3 h-3" />
            Most recent first
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800/50 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <FilterIcon className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-zinc-400">No logs match your filters</p>
            </div>
          ) : (
            filteredLogs.map(entry => {
              const levelConf = LEVEL_CONFIG[entry.level]
              const sourceConf = SOURCE_CONFIG[entry.source]
              const isExpanded = expandedLogId === entry.id

              return (
                <div key={entry.id} className={`transition-colors ${entry.level === 'error' || entry.level === 'fatal' ? 'bg-red-50/20 dark:bg-red-500/[0.02]' : ''}`}>
                  <button
                    onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                    className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    title={`Toggle details for log ${entry.id}`}
                  >
                    {isExpanded ? <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" /> : <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />}

                    <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 w-16 shrink-0 mt-0.5">{formatTime(entry.timestamp)}</span>

                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${levelConf.color} ${levelConf.bg} shrink-0`}>
                      {levelConf.icon}
                      {levelConf.label}
                    </span>

                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-gray-500 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                      {sourceConf.icon}
                      {sourceConf.label}
                    </span>

                    <span className="text-xs text-gray-700 dark:text-zinc-300 truncate flex-1">{entry.message}</span>

                    {entry.duration !== undefined && (
                      <span className={`text-[10px] font-mono shrink-0 ${entry.duration > 1000 ? 'text-red-500' : entry.duration > 500 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {entry.duration}ms
                      </span>
                    )}

                    <span className="text-[10px] text-gray-400 shrink-0">{formatTimeAgo(entry.timestamp)}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 ml-[26px]">
                      <div className="rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
                        <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Details</span>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500">
                            {entry.requestId && <span>Request: <code className="text-blue-400">{entry.requestId}</code></span>}
                            {entry.userId && <span>User: <code className="text-emerald-400">{entry.userId}</code></span>}
                          </div>
                        </div>
                        <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                          <code>{JSON.stringify({ timestamp: entry.timestamp, level: entry.level, source: entry.source, message: entry.message, ...entry.context }, null, 2)}</code>
                        </pre>
                        {entry.stack && (
                          <>
                            <div className="px-3 py-1.5 bg-red-900/20 border-t border-slate-800">
                              <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Stack Trace</span>
                            </div>
                            <pre className="p-3 text-[11px] font-mono text-red-300 overflow-x-auto leading-relaxed">
                              <code>{entry.stack}</code>
                            </pre>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
