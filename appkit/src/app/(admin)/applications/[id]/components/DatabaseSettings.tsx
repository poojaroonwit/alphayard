'use client'

import React, { useState, useEffect, useRef } from 'react'
import { DatabaseIcon, CheckCircleIcon, XCircleIcon, Loader2Icon, SaveIcon, ExternalLinkIcon, TableIcon, RefreshCwIcon, ChevronDownIcon, ChevronRightIcon, DownloadIcon, PlayIcon, CopyIcon, CheckCircle2Icon, ChevronLeftIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
        <Loader2Icon className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Config Card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DatabaseIcon className="w-4 h-4 text-blue-500" />
              Database Connection
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Configure a per-application database. Stored securely in application settings.</p>
          </div>
          <div className="flex items-center gap-2">
            {saveMsg && (
              <span className={`text-xs font-medium ${saveMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{saveMsg}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || (!config.connectionString && !config.host)}>
              {testing ? <Loader2Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              Test Connection
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              {saving ? <Loader2Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5 mr-1.5" />}
              Save
            </Button>
          </div>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${testResult.ok ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
            {testResult.ok ? <CheckCircleIcon className="w-4 h-4 shrink-0" /> : <XCircleIcon className="w-4 h-4 shrink-0" />}
            {testResult.message}
          </div>
        )}

        {/* Database Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Database Type</label>
            <select
              value={config.type}
              onChange={e => setConfig(c => ({ ...c, type: e.target.value as DatabaseConfig['type'] }))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.ssl || false}
                onChange={e => setConfig(c => ({ ...c, ssl: e.target.checked }))}
                className="rounded border-gray-300"
              />
              Enable SSL/TLS
            </label>
          </div>
        </div>

        {/* Connection Method Toggle */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg w-fit">
          <button
            onClick={() => setUseConnectionString(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${useConnectionString ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`}
          >
            Connection String
          </button>
          <button
            onClick={() => setUseConnectionString(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!useConnectionString ? 'bg-white dark:bg-zinc-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`}
          >
            Host / Port
          </button>
        </div>

        {useConnectionString ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Connection String</label>
            <input
              type="password"
              value={config.connectionString}
              onChange={e => setConfig(c => ({ ...c, connectionString: e.target.value }))}
              placeholder={config.type === 'postgresql' ? 'postgresql://user:password@host:5432/dbname' : config.type === 'mysql' ? 'mysql://user:password@host:3306/dbname' : 'mongodb://user:password@host:27017/dbname'}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">Connection string is stored encrypted in application settings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Host</label>
              <input
                type="text"
                value={config.host || ''}
                onChange={e => setConfig(c => ({ ...c, host: e.target.value }))}
                placeholder="localhost"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Port</label>
              <input
                type="text"
                value={config.port || ''}
                onChange={e => setConfig(c => ({ ...c, port: e.target.value }))}
                placeholder={config.type === 'postgresql' ? '5432' : config.type === 'mysql' ? '3306' : '27017'}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Database</label>
              <input
                type="text"
                value={config.database || ''}
                onChange={e => setConfig(c => ({ ...c, database: e.target.value }))}
                placeholder="mydb"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Username</label>
              <input
                type="text"
                value={config.username || ''}
                onChange={e => setConfig(c => ({ ...c, username: e.target.value }))}
                placeholder="admin"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Password</label>
              <input
                type="password"
                value={config.password || ''}
                onChange={e => setConfig(c => ({ ...c, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Database Studio */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-purple-500" />
              Database Studio
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Browse and inspect tables in the configured database.</p>
          </div>
          <button
            onClick={studioOpen ? () => { setStudioOpen(false); setTables([]); setSelectedTable(null) } : handleOpenStudio}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
          >
            {studioOpen ? 'Close Studio' : (
              <><ExternalLinkIcon className="w-3.5 h-3.5" /> Open Studio</>
            )}
          </button>
        </div>

        {studioOpen && (
          studioLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2Icon className="w-5 h-5 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">Connecting to database...</span>
            </div>
          ) : studioError ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              <XCircleIcon className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-medium">Connection failed</p>
                <p className="text-xs mt-0.5 opacity-80">{studioError}</p>
              </div>
              <button onClick={handleOpenStudio} className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800/30 rounded">
                <RefreshCwIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-0 h-[560px] overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-800">
              {/* Table List */}
              <div className="w-48 shrink-0 border-r border-gray-200 dark:border-zinc-800 overflow-y-auto flex flex-col">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Tables ({tables.length})</p>
                  <button
                    onClick={() => { setSqlMode(true); setSelectedTable(null); setTableData([]); setSqlError(null) }}
                    title="SQL Editor"
                    className={`p-1 rounded text-xs font-bold transition-colors ${sqlMode ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10' : 'text-gray-400 hover:text-purple-500'}`}
                  >
                    SQL
                  </button>
                </div>
                {tables.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-gray-400 dark:text-zinc-500 italic">No tables found</p>
                ) : tables.map(t => (
                  <div key={t.name}>
                    <button
                      onClick={() => { toggleTableExpand(t.name); handleSelectTable(t.name, 0, sortCol, sortDir) }}
                      className={`w-full flex items-center gap-1.5 px-3 py-2 text-left text-xs transition-colors ${selectedTable === t.name && !sqlMode ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      {expandedTables.has(t.name) ? <ChevronDownIcon className="w-3 h-3 shrink-0" /> : <ChevronRightIcon className="w-3 h-3 shrink-0" />}
                      <DatabaseIcon className="w-3 h-3 shrink-0 opacity-60" />
                      <span className="truncate">{t.name}</span>
                    </button>
                    {expandedTables.has(t.name) && t.columns.map(col => (
                      <div key={col.name} className="pl-9 pr-3 py-0.5 flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-500 dark:text-zinc-400 truncate">{col.name}</span>
                        <span className="text-[9px] text-gray-400 dark:text-zinc-600 font-mono ml-auto shrink-0">{col.type}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Main Panel */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {sqlMode ? (
                  /* SQL Editor */
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50/50 dark:bg-purple-500/5 border-b border-gray-200 dark:border-zinc-700">
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">SQL Editor</span>
                      <button
                        onClick={handleRunSql}
                        disabled={sqlRunning || !sqlQuery.trim()}
                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium rounded-md"
                      >
                        {sqlRunning ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <PlayIcon className="w-3.5 h-3.5" />}
                        Run
                      </button>
                      {tableData.length > 0 && (
                        <button onClick={handleExportCsv} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <DownloadIcon className="w-3.5 h-3.5" /> CSV
                        </button>
                      )}
                    </div>
                    <textarea
                      value={sqlQuery}
                      onChange={e => setSqlQuery(e.target.value)}
                      onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleRunSql() }}
                      placeholder={`SELECT * FROM users LIMIT 50;\n\n-- Ctrl/Cmd+Enter to run`}
                      className="flex-1 px-4 py-3 font-mono text-xs text-gray-800 dark:text-zinc-200 bg-transparent resize-none focus:outline-none"
                      style={{ maxHeight: '160px', minHeight: '80px' }}
                    />
                    {sqlError && (
                      <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-mono border-t border-red-100 dark:border-red-800/30">
                        {sqlError}
                      </div>
                    )}
                    {tableData.length > 0 && (
                      <div className="flex-1 overflow-auto border-t border-gray-200 dark:border-zinc-700">
                        <DataTable rows={tableData} columns={[]} sortCol={sortCol} sortDir={sortDir} onSort={() => {}} copiedCell={copiedCell} onCopyCell={handleCopyCell} />
                      </div>
                    )}
                  </div>
                ) : !selectedTable ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-zinc-500">
                    <TableIcon className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">Select a table to browse data</p>
                    <p className="text-xs mt-1 opacity-60">or click SQL to write a custom query</p>
                  </div>
                ) : tableLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2Icon className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Table toolbar */}
                    <div className="sticky top-0 flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-zinc-800/80 border-b border-gray-200 dark:border-zinc-700 shrink-0">
                      <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{selectedTable}</span>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                        {selectedTableInfo?.rowCount !== undefined ? `~${selectedTableInfo.rowCount.toLocaleString()} rows` : ''}
                        {tableData.length > 0 ? ` · showing ${tablePage * PAGE_SIZE + 1}–${tablePage * PAGE_SIZE + tableData.length}` : ''}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        <button onClick={handleExportCsv} disabled={!tableData.length} title="Export CSV" className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                          <DownloadIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleSelectTable(selectedTable, tablePage, sortCol, sortDir)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400">
                          <RefreshCwIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Data */}
                    <div className="flex-1 overflow-auto">
                      {tableData.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-400 dark:text-zinc-500 italic text-center">No rows returned</p>
                      ) : (
                        <DataTable
                          rows={tableData}
                          columns={selectedTableColumns}
                          sortCol={sortCol}
                          sortDir={sortDir}
                          onSort={handleSort}
                          copiedCell={copiedCell}
                          onCopyCell={handleCopyCell}
                        />
                      )}
                    </div>

                    {/* Pagination */}
                    <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
                      <button onClick={() => handleSelectTable(selectedTable, 0, sortCol, sortDir)} disabled={tablePage === 0} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 disabled:opacity-30">
                        <ChevronsLeftIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleSelectTable(selectedTable, tablePage - 1, sortCol, sortDir)} disabled={tablePage === 0} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 disabled:opacity-30">
                        <ChevronLeftIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-gray-500 dark:text-zinc-400">Page {tablePage + 1}</span>
                      <button onClick={() => handleSelectTable(selectedTable, tablePage + 1, sortCol, sortDir)} disabled={tableData.length < PAGE_SIZE} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 disabled:opacity-30">
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { const total = selectedTableInfo?.rowCount || 0; const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1); handleSelectTable(selectedTable, lastPage, sortCol, sortDir) }} disabled={tableData.length < PAGE_SIZE} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 disabled:opacity-30">
                        <ChevronsRightIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="ml-auto text-[10px] text-gray-400 dark:text-zinc-500">{PAGE_SIZE} rows/page</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {!studioOpen && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-dashed border-gray-200 dark:border-zinc-700">
            <TableIcon className="w-5 h-5 text-gray-300 dark:text-zinc-600 shrink-0" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">Save a valid connection config above, then open Studio to browse tables and data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
