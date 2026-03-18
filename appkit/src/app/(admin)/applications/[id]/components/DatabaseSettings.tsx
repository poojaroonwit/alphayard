'use client'

import React, { useState, useEffect, useRef } from 'react'
import { DatabaseIcon, CheckCircleIcon, XCircleIcon, Loader2Icon, SaveIcon, ExternalLinkIcon, TableIcon, RefreshCwIcon, ChevronDownIcon, ChevronRightIcon, DownloadIcon, PlayIcon, CopyIcon, CheckCircle2Icon, ChevronLeftIcon, ChevronsLeftIcon, ChevronsRightIcon, SettingsIcon, SearchIcon, TerminalIcon, PlusIcon, FilterIcon, MoreHorizontalIcon, HashIcon, KeyIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Tooltip } from '@/components/ui/Tooltip'

interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite'
  connectionString: string
  host?: string
  port?: string
  database?: string
  username?: string
  password?: string
  ssl?: boolean
}

interface TableColumn {
  name: string
  type: string
  nullable: boolean
}

interface TableInfo {
  name: string
  rowCount: number
  columns: TableColumn[]
}

// ---------- Shared DataTable subcomponent ----------
interface DataTableProps {
  rows: any[]
  columns: TableColumn[]
  sortCol: string | null
  sortDir: 'asc' | 'desc'
  onSort: (col: string) => void
  copiedCell: string | null
  onCopyCell: (val: string, id: string) => void
}

function DataTable({ rows, columns, sortCol, sortDir, onSort, copiedCell, onCopyCell }: DataTableProps) {
  const keys = columns.length > 0 ? columns.map(c => c.name) : Object.keys(rows[0] || {})
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/80">
          {keys.map(k => {
            const col = columns.find(c => c.name === k)
            const isSort = sortCol === k
            return (
              <th
                key={k}
                onClick={() => onSort(k)}
                className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-zinc-400 whitespace-nowrap cursor-pointer select-none hover:text-gray-700 dark:hover:text-zinc-200 group"
              >
                <span className="inline-flex items-center gap-1">
                  {k}
                  {col && <span className="text-[9px] text-gray-300 dark:text-zinc-600 font-normal">{col.type}</span>}
                  <span className={`text-[9px] ${isSort ? 'opacity-100 text-blue-400' : 'opacity-0 group-hover:opacity-40'}`}>
                    {isSort && sortDir === 'desc' ? '↓' : '↑'}
                  </span>
                </span>
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 group/row">
            {keys.map((k, j) => {
              const val = row[k]
              const id = `${i}-${j}`
              const display = val === null || val === undefined
                ? <span className="text-gray-300 dark:text-zinc-600 italic">null</span>
                : String(val)
              return (
                <td key={j} className="px-3 py-1.5 font-mono whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis text-gray-700 dark:text-zinc-300 relative">
                  {display}
                  {val !== null && val !== undefined && (
                    <button
                      onClick={() => onCopyCell(String(val), id)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover/row:opacity-100 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 transition-all"
                      title="Copy value"
                    >
                      {copiedCell === id ? <CheckCircle2Icon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                    </button>
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
// ---------------------------------------------------

interface DatabaseSettingsProps {
  appId: string
  initialConfig?: DatabaseConfig | null
}

export const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({ appId, initialConfig }) => {
  const [config, setConfig] = useState<DatabaseConfig>(
    initialConfig || { type: 'postgresql', connectionString: '', ssl: false }
  )
  const [loadingConfig, setLoadingConfig] = useState(!initialConfig)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [useConnectionString, setUseConnectionString] = useState(true)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  useEffect(() => {
    if (initialConfig) return
    setLoadingConfig(true)
    fetch(`/api/v1/admin/applications/${appId}/config/database`)
      .then(r => r.json())
      .then(data => {
        if (data.database) {
          setConfig(data.database)
          setUseConnectionString(!!data.database.connectionString)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false))
  }, [appId, initialConfig])

  // Studio state
  const [studioOpen, setStudioOpen] = useState(false)
  const [studioLoading, setStudioLoading] = useState(false)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [studioError, setStudioError] = useState<string | null>(null)
  // Pagination & sort
  const [tablePage, setTablePage] = useState(0)
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [copiedCell, setCopiedCell] = useState<string | null>(null)
  // SQL editor
  const [sqlMode, setSqlMode] = useState(false)
  const [sqlQuery, setSqlQuery] = useState('')
  const [sqlRunning, setSqlRunning] = useState(false)
  const [sqlError, setSqlError] = useState<string | null>(null)
  const PAGE_SIZE = 50

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/database`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: config }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setSaveMsg('Saved!')
      setTestResult(null)
    } catch (e: any) {
      setSaveMsg(e.message)
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/database/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: config }),
      })
      const data = await res.json()
      setTestResult({ ok: res.ok && data.ok, message: data.message || (res.ok ? 'Connection successful!' : 'Connection failed') })
    } catch {
      setTestResult({ ok: false, message: 'Network error' })
    } finally {
      setTesting(false)
    }
  }

  const handleOpenStudio = async () => {
    const hasConnection = config.connectionString || config.host
    if (!hasConnection) {
      setStudioOpen(true)
      setStudioError('No database connection configured. Save a connection string or host details first.')
      return
    }
    setStudioOpen(true)
    setStudioLoading(true)
    setStudioError(null)
    setTables([])
    setSelectedTable(null)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/database/studio/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to connect')
      setTables(data.tables || [])
    } catch (e: any) {
      setStudioError(e.message)
    } finally {
      setStudioLoading(false)
    }
  }

  const handleSelectTable = async (tableName: string, page = 0, col: string | null = null, dir: 'asc' | 'desc' = 'asc') => {
    setSelectedTable(tableName)
    setTableLoading(true)
    setTableData([])
    setSqlMode(false)
    setSqlError(null)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/database/studio/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: config, table: tableName, limit: PAGE_SIZE, offset: page * PAGE_SIZE, sortCol: col, sortDir: dir }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setTableData(data.rows || [])
      setTablePage(page)
    } catch (e: any) {
      setTableData([])
    } finally {
      setTableLoading(false)
    }
  }

  const handleSort = (col: string) => {
    const newDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'
    setSortCol(col)
    setSortDir(newDir)
    if (selectedTable) handleSelectTable(selectedTable, tablePage, col, newDir)
  }

  const handleRunSql = async () => {
    if (!sqlQuery.trim()) return
    setSqlRunning(true)
    setSqlError(null)
    setTableData([])
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/database/studio/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: config, sql: sqlQuery }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Query failed')
      setTableData(data.rows || [])
    } catch (e: any) {
      setSqlError(e.message)
    } finally {
      setSqlRunning(false)
    }
  }

  const handleExportCsv = () => {
    if (!tableData.length) return
    const cols = Object.keys(tableData[0])
    const rows = tableData.map(r => cols.map(c => {
      const v = r[c]
      if (v === null || v === undefined) return ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }).join(','))
    const csv = [cols.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${selectedTable || 'query'}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyCell = (val: string, id: string) => {
    navigator.clipboard.writeText(val)
    setCopiedCell(id)
    setTimeout(() => setCopiedCell(null), 1200)
  }

  const toggleTableExpand = (name: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const selectedTableInfo = tables.find(t => t.name === selectedTable)
  const selectedTableColumns = selectedTableInfo?.columns || []

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="w-6 h-6 animate-spin text-[var(--primary-blue)]" />
      </div>
    )
  }

  const renderConfigForm = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Connection Settings</h4>
        {testResult && (
          <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${testResult.ok ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            {testResult.ok ? <CheckCircleIcon className="w-4 h-4 shrink-0" /> : <XCircleIcon className="w-4 h-4 shrink-0" />}
            {testResult.message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Database Type</label>
            <select
              value={config.type}
              onChange={e => setConfig(c => ({ ...c, type: e.target.value as DatabaseConfig['type'] }))}
              className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ssl-toggle"
              checked={config.ssl || false}
              onChange={e => setConfig(c => ({ ...c, ssl: e.target.checked }))}
              className="rounded border-[var(--border-default)] text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]"
            />
            <label htmlFor="ssl-toggle" className="text-xs font-medium text-[var(--text-secondary)] cursor-pointer">Enable SSL/TLS</label>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface-hover)] rounded-lg w-full">
            <button
              onClick={() => setUseConnectionString(true)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${useConnectionString ? 'bg-[var(--bg-default)] shadow text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
            >
              Connection String
            </button>
            <button
              onClick={() => setUseConnectionString(false)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${!useConnectionString ? 'bg-[var(--bg-default)] shadow text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}
            >
              Host / Port
            </button>
          </div>

          {useConnectionString ? (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Connection String</label>
              <input
                type="password"
                value={config.connectionString}
                onChange={e => setConfig(c => ({ ...c, connectionString: e.target.value }))}
                placeholder={config.type === 'postgresql' ? 'postgresql://user:password@host:5432/dbname' : config.type === 'mysql' ? 'mysql://user:password@host:3306/dbname' : 'mongodb://user:password@host:27017/dbname'}
                className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1.5 italic">Stored securely using AES-256 encryption.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Host</label>
                  <input
                    type="text"
                    value={config.host || ''}
                    onChange={e => setConfig(c => ({ ...c, host: e.target.value }))}
                    placeholder="localhost"
                    className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Port</label>
                  <input
                    type="text"
                    value={config.port || ''}
                    onChange={e => setConfig(c => ({ ...c, port: e.target.value }))}
                    placeholder={config.type === 'postgresql' ? '5432' : config.type === 'mysql' ? '3306' : '27017'}
                    className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Database</label>
                  <input
                    type="text"
                    value={config.database || ''}
                    onChange={e => setConfig(c => ({ ...c, database: e.target.value }))}
                    placeholder="mydb"
                    className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Username</label>
                  <input
                    type="text"
                    value={config.username || ''}
                    onChange={e => setConfig(c => ({ ...c, username: e.target.value }))}
                    placeholder="admin"
                    className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
                <input
                  type="password"
                  value={config.password || ''}
                  onChange={e => setConfig(c => ({ ...c, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--border-default)] flex flex-col gap-3">
        <Button 
          variant="outline" 
          className="w-full justify-center" 
          onClick={handleTest} 
          disabled={testing || (!config.connectionString && !config.host)}
        >
          {testing ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : null}
          Test Connection
        </Button>
        <Button 
          className="w-full justify-center bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white" 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <SaveIcon className="w-4 h-4 mr-2" />}
          {saveMsg === 'Saved!' ? 'Settings Saved' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Config Drawer */}
      <Drawer
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Database Settings"
        className="w-screen max-w-sm"
      >
        {renderConfigForm()}
      </Drawer>

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden flex flex-col min-h-[700px]">
        {/* Header / Toolbar */}
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-default)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DatabaseIcon className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                Database Studio
                {studioOpen && !studioLoading && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Connected</span>
                )}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">Manage and explore your application data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {studioOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigOpen(true)}
                className="h-8 text-xs font-semibold gap-1.5 border-[var(--border-default)]"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                Connection
              </Button>
            )}
            <Button
              onClick={studioOpen ? () => { setStudioOpen(false); setTables([]); setSelectedTable(null) } : handleOpenStudio}
              variant={studioOpen ? "outline" : "primary"}
              size="sm"
              className={`h-8 text-xs font-semibold gap-1.5 ${!studioOpen ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              {studioOpen ? 'Exit Studio' : <><ExternalLinkIcon className="w-3.5 h-3.5" /> Open Studio</>}
            </Button>
          </div>
        </div>

        {!studioOpen ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-surface-hover)]/30">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm flex items-center justify-center mb-4">
              <TableIcon className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
            </div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">Ready to explore?</h4>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
              Connect to your database to browse tables, run SQL queries, and manage your data directly from AppKit.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button 
                onClick={handleOpenStudio} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 rounded-xl"
              >
                Launch Studio
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsConfigOpen(true)}
                className="font-bold h-10 px-6 rounded-xl border-[var(--border-default)]"
              >
                Configure Connection
              </Button>
            </div>
          </div>
        ) : studioLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
              <Loader2Icon className="w-8 h-8 animate-spin text-emerald-500 relative" />
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">Establishing secure connection...</p>
          </div>
        ) : studioError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-red-500/5">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <XCircleIcon className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="text-base font-bold text-red-600">Connection Failed</h4>
            <p className="text-sm text-red-500/80 mt-1 max-w-md text-center">{studioError}</p>
            <div className="flex gap-3 mt-6">
              <Button size="sm" onClick={handleOpenStudio} className="bg-red-600 hover:bg-red-700 text-white gap-2 h-9 px-4">
                <RefreshCwIcon className="w-3.5 h-3.5" />
                Retry Connection
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsConfigOpen(true)} className="h-9 px-4 border-red-200 text-red-700">
                Fix Configuration
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden bg-[#1c1c1c] text-zinc-300">
            {/* Sidebar: Schema Tree */}
            <div className="w-64 shrink-0 border-r border-[#2e2e2e] flex flex-col bg-[#141414]">
              <div className="p-4 flex items-center justify-between">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search tables..." 
                    className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-md pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-medium"
                  />
                </div>
                <button
                  onClick={() => { setSqlMode(true); setSelectedTable(null); setTableData([]); setSqlError(null) }}
                  className={`ml-2 p-1.5 rounded-md transition-all ${sqlMode ? 'bg-emerald-500/10 text-emerald-500' : 'text-zinc-500 hover:bg-zinc-800'}`}
                  title="New SQL Query"
                >
                  <TerminalIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scrollbar">
                <div className="px-2 py-2">
                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Schemas / Tables</span>
                </div>
                
                {tables.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-zinc-600 italic">No tables found in this database.</p>
                  </div>
                ) : (
                  tables.map(t => (
                    <div key={t.name} className="space-y-0.5">
                      <button
                        onClick={() => { toggleTableExpand(t.name); handleSelectTable(t.name, 0, sortCol, sortDir) }}
                        className={`w-full group flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-all ${selectedTable === t.name && !sqlMode ? 'bg-[#2e2e2e] text-white shadow-sm' : 'hover:bg-[#1c1c1c]'}`}
                      >
                        <div className={`transition-transform duration-200 ${expandedTables.has(t.name) ? 'rotate-90' : ''}`}>
                          <ChevronRightIcon className="w-3 h-3 text-zinc-600" />
                        </div>
                        <TableIcon className={`w-3.5 h-3.5 ${selectedTable === t.name && !sqlMode ? 'text-emerald-500' : 'text-zinc-500'}`} />
                        <span className="flex-1 truncate font-medium">{t.name}</span>
                        <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 tabular-nums">
                          {t.rowCount > 1000 ? `${(t.rowCount / 1000).toFixed(1)}k` : t.rowCount}
                        </span>
                      </button>
                      
                      {expandedTables.has(t.name) && (
                        <div className="ml-7 border-l border-[#2e2e2e] py-1 space-y-1 animate-in slide-in-from-left-2 duration-200">
                          {t.columns.map(col => (
                            <div key={col.name} className="pl-3 pr-2 py-1 flex items-center gap-2 group cursor-default">
                              {col.name.toLowerCase().includes('id') || col.name === 'pk' ? (
                                <KeyIcon className="w-2.5 h-2.5 text-amber-500/60" />
                              ) : col.type.includes('int') ? (
                                <HashIcon className="w-2.5 h-2.5 text-blue-500/60" />
                              ) : (
                                <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-800 border border-zinc-700" />
                              )}
                              <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 truncate transition-colors">{col.name}</span>
                              <span className="text-[9px] text-zinc-700 font-mono ml-auto opacity-0 group-hover:opacity-100">{col.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 border-t border-[#2e2e2e] bg-[#0c0c0c]/50">
                <Button variant="ghost" className="w-full h-8 text-[11px] justify-start gap-2 hover:bg-[#1c1c1c] text-zinc-500">
                  <PlusIcon className="w-3.5 h-3.5" /> New Table
                </Button>
              </div>
            </div>

            {/* Main Editor/Viewer Panel */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1c1c1c]">
              {sqlMode ? (
                /* SQL Editor View */
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  <div className="h-12 flex items-center gap-4 px-4 border-b border-[#2e2e2e] bg-[#141414]">
                    <div className="flex items-center gap-2">
                       <TerminalIcon className="w-4 h-4 text-emerald-500" />
                       <span className="text-xs font-bold text-zinc-300">SQL Editor</span>
                    </div>
                    <div className="h-4 w-[1px] bg-[#2e2e2e]" />
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={handleRunSql}
                        disabled={sqlRunning || !sqlQuery.trim()}
                        className="h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold gap-2 px-4 shadow-sm shadow-emerald-900/20"
                      >
                        {sqlRunning ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <PlayIcon className="w-3.5 h-3.5" />}
                        Run Query
                      </Button>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-white">
                        <SaveIcon className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {tableData.length > 0 && (
                        <div className="flex items-center gap-2 mr-2">
                          <span className="text-[10px] text-zinc-500 font-medium">{tableData.length} results</span>
                          <button onClick={handleExportCsv} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 transition-colors">
                            <DownloadIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col min-h-0">
                    <textarea
                      value={sqlQuery}
                      onChange={e => setSqlQuery(e.target.value)}
                      onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleRunSql() }}
                      placeholder={`-- Write your SQL query here\nSELECT * FROM public.users LIMIT 100;`}
                      className="flex-1 px-6 py-4 font-mono text-[13px] leading-relaxed text-zinc-300 bg-transparent resize-none focus:outline-none placeholder:text-zinc-700 custom-scrollbar"
                    />
                    
                    {sqlError && (
                      <div className="mx-4 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-2 text-red-500 mb-1">
                          <XCircleIcon className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Query Error</span>
                        </div>
                        <p className="text-xs font-mono text-red-400/90 leading-relaxed">{sqlError}</p>
                      </div>
                    )}
                    
                    {tableData.length > 0 && (
                      <div className="h-[40%] flex flex-col border-t border-[#2e2e2e] bg-[#141414] animate-in slide-in-from-bottom-4 duration-500">
                        <div className="px-4 py-2 flex items-center justify-between border-b border-[#2e2e2e]">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Query Results</span>
                          <button onClick={() => setTableData([])} className="text-[10px] text-zinc-600 hover:text-zinc-400 font-medium">Clear</button>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar-thin">
                          <div className="min-w-full inline-block align-middle">
                             <DataTable rows={tableData} columns={[]} sortCol={sortCol} sortDir={sortDir} onSort={() => {}} copiedCell={copiedCell} onCopyCell={handleCopyCell} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : !selectedTable ? (
                /* Empty State / Dashboard */
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-[#1c1c1c]">
                  <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl">
                    <DatabaseIcon className="w-10 h-10 text-zinc-700 opacity-50" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Select a Table</h3>
                  <p className="text-sm text-zinc-500 max-w-xs text-center leading-relaxed">
                    Choose a table from the sidebar to browse its content and structure, or use the SQL Editor for complex queries.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-8">
                     <button onClick={() => setSqlMode(true)} className="flex flex-col items-center p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all group">
                       <TerminalIcon className="w-5 h-5 mb-2 text-zinc-600 group-hover:text-emerald-500" />
                       <span className="text-xs font-bold text-zinc-400">SQL Editor</span>
                     </button>
                     <button onClick={() => setIsConfigOpen(true)} className="flex flex-col items-center p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800/50 transition-all group">
                       <SettingsIcon className="w-5 h-5 mb-2 text-zinc-600 group-hover:text-emerald-500" />
                       <span className="text-xs font-bold text-zinc-400">Settings</span>
                     </button>
                  </div>
                </div>
              ) : (
                /* Table Browse View */
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  {/* Studio View Toolbar */}
                  <div className="h-12 flex items-center gap-4 px-4 border-b border-[#2e2e2e] bg-[#141414] shrink-0">
                    <div className="flex items-center gap-2">
                       <TableIcon className="w-4 h-4 text-emerald-500" />
                       <span className="text-xs font-bold text-zinc-200">{selectedTable}</span>
                    </div>
                    
                    <div className="h-4 w-[1px] bg-[#2e2e2e]" />
                    
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" className="h-8 text-[11px] gap-2 px-3 text-zinc-400 hover:text-white hover:bg-[#2e2e2e]">
                        <PlusIcon className="w-3.5 h-3.5" /> Insert Row
                      </Button>
                      <Button variant="ghost" className="h-8 text-[11px] gap-2 px-3 text-zinc-400 hover:text-white hover:bg-[#2e2e2e]">
                        <FilterIcon className="w-3.5 h-3.5" /> Filter
                      </Button>
                      <Button variant="ghost" className="h-8 text-[11px] gap-2 px-3 text-zinc-400 hover:text-white hover:bg-[#2e2e2e]" onClick={handleRunSql}>
                        <RefreshCwIcon className="w-3.5 h-3.5" /> Refresh
                      </Button>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hidden sm:inline">
                         {selectedTableInfo?.rowCount.toLocaleString()} Total rows
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={handleExportCsv} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 transition-colors" title="Export as CSV">
                          <DownloadIcon className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 transition-colors">
                          <MoreHorizontalIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Spreadsheet Grid */}
                  <div className="flex-1 overflow-auto bg-[#1c1c1c] custom-scrollbar">
                    {tableLoading ? (
                      <div className="flex-1 flex items-center justify-center p-20 animate-pulse">
                        <div className="h-4 w-4 rounded-full bg-emerald-500 mr-2 animate-ping" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Loading Records...</span>
                      </div>
                    ) : tableData.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-24 px-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                          <TableIcon className="w-6 h-6 text-zinc-700" />
                        </div>
                        <p className="text-sm font-bold text-zinc-400">No data found</p>
                        <p className="text-xs text-zinc-600 mt-1">This table appears to be empty.</p>
                        <Button variant="outline" className="mt-6 h-8 text-xs border-zinc-800 text-zinc-400">Create first row</Button>
                      </div>
                    ) : (
                      <div className="min-w-full inline-block align-middle pb-12">
                        <DataTable
                          rows={tableData}
                          columns={selectedTableColumns}
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                          copiedCell={copiedCell}
                          onCopyCell={handleCopyCell}
                        />
                      </div>
                    )}
                  </div>

                  {/* Pagination Footer */}
                  <div className="h-10 flex items-center gap-4 px-4 border-t border-[#2e2e2e] bg-[#141414] shrink-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSelectTable(selectedTable, 0, sortCol, sortDir)} disabled={tablePage === 0} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 disabled:opacity-20 transition-all">
                        <ChevronsLeftIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleSelectTable(selectedTable, tablePage - 1, sortCol, sortDir)} disabled={tablePage === 0} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 disabled:opacity-20 transition-all">
                        <ChevronLeftIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Page <span className="text-white bg-zinc-800 px-1.5 py-0.5 rounded ml-1">{tablePage + 1}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSelectTable(selectedTable, tablePage + 1, sortCol, sortDir)} disabled={tableData.length < PAGE_SIZE} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 disabled:opacity-20 transition-all">
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { const total = selectedTableInfo?.rowCount || 0; const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1); handleSelectTable(selectedTable, lastPage, sortCol, sortDir) }} disabled={tableData.length < PAGE_SIZE} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 disabled:opacity-20 transition-all">
                        <ChevronsRightIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="ml-auto text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                      Showing {tablePage * PAGE_SIZE + 1}–{tablePage * PAGE_SIZE + tableData.length} of ~{selectedTableInfo?.rowCount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #141414;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2e2e2e;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3e3e3e;
        }
        .custom-scrollbar-thin::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-track {
          background: #141414;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background: #2e2e2e;
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}
