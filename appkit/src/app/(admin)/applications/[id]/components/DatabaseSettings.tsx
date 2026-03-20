'use client'

import React, { useState, useEffect } from 'react'
import { 
  DatabaseIcon, CheckCircleIcon, XCircleIcon, Loader2Icon, SaveIcon, 
  ExternalLinkIcon, TableIcon, RefreshCwIcon, ChevronRightIcon, 
  DownloadIcon, PlayIcon, CopyIcon, CheckCircle2Icon, ChevronLeftIcon, 
  ChevronsLeftIcon, SettingsIcon, TerminalIcon, KeyIcon, PencilIcon 
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'

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
  isPrimary?: boolean
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
  onUpdateCell?: (row: any, col: string, newVal: any) => Promise<void>
}

function DataTable({ rows, columns, sortCol, sortDir, onSort, copiedCell, onCopyCell, onUpdateCell }: DataTableProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const keys = columns.length > 0 ? columns.map(c => c.name) : (rows.length > 0 ? Object.keys(rows[0]) : [])

  const handleStartEdit = (val: any, id: string) => {
    if (!onUpdateCell) return
    setEditingCell(id)
    setEditValue(val === null || val === undefined ? '' : String(val))
  }

  const handleSaveEdit = async (row: any, col: string, id: string) => {
    if (editValue === String(row[col])) {
      setEditingCell(null)
      return
    }
    setUpdatingId(id)
    try {
      await onUpdateCell?.(row, col, editValue)
    } finally {
      setUpdatingId(null)
      setEditingCell(null)
    }
  }

  return (
    <div className="overflow-x-auto custom-scrollbar-thin">
      <table className="w-full text-xs text-left border-collapse">
        <thead>
          <tr className="border-b border-[#2e2e2e] bg-[#141414] sticky top-0 z-10">
            {keys.map(k => {
              const col = columns.find(c => c.name === k)
              const isSort = sortCol === k
              return (
                <th
                  key={k}
                  onClick={() => onSort(k)}
                  className="px-3 py-2 font-bold text-zinc-500 whitespace-nowrap cursor-pointer hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    {col?.isPrimary && <KeyIcon className="w-3 h-3 text-amber-500" />}
                    <span>{k}</span>
                    {col && <span className="text-[10px] text-zinc-700 font-normal">{col.type}</span>}
                    <span className={`text-[9px] ${isSort ? 'opacity-100 text-emerald-500' : 'opacity-0 group-hover:opacity-40'}`}>
                      {isSort && sortDir === 'desc' ? '↓' : '↑'}
                    </span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#232323] hover:bg-[#2a2a2a] group/row transition-colors">
              {keys.map((k, j) => {
                const val = row[k]
                const id = `${i}-${j}`
                const isEditing = editingCell === id
                const isUpdating = updatingId === id

                if (isEditing) {
                  return (
                    <td key={j} className="p-1 min-w-[120px]">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(row, k, id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit(row, k, id)
                          if (e.key === 'Escape') setEditingCell(null)
                        }}
                        className="w-full h-7 px-2 bg-[#0c0c0c] border border-emerald-500 rounded text-xs font-mono text-white focus:outline-none"
                      />
                    </td>
                  )
                }

                const display = val === null || val === undefined
                  ? <span className="text-zinc-700 italic">null</span>
                  : String(val)

                return (
                  <td 
                    key={j} 
                    onDoubleClick={() => handleStartEdit(val, id)}
                    className="px-3 py-1.5 font-mono whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis text-zinc-400 relative group/cell"
                  >
                    {isUpdating ? <Loader2Icon className="w-3 h-3 animate-spin text-emerald-500" /> : display}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity bg-inherit pl-2">
                       <button
                        onClick={() => onCopyCell(String(val), id)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white"
                        title="Copy value"
                      >
                        {copiedCell === id ? <CheckCircle2Icon className="w-3 h-3 text-emerald-500" /> : <CopyIcon className="w-3 h-3" />}
                      </button>
                      {onUpdateCell && (
                        <button
                          onClick={() => handleStartEdit(val, id)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white"
                          title="Edit cell"
                        >
                          <PencilIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

  // Studio state
  const [studioOpen, setStudioOpen] = useState(false)
  const [studioLoading, setStudioLoading] = useState(false)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [tableLoading, setTableLoading] = useState(false)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [studioError, setStudioError] = useState<string | null>(null)
  const [copiedCell, setCopiedCell] = useState<string | null>(null)
  
  // Pagination & sort
  const [tablePage, setTablePage] = useState(0)
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const PAGE_SIZE = 50

  // SQL editor
  const [sqlMode, setSqlMode] = useState(false)
  const [sqlQuery, setSqlQuery] = useState('')
  const [sqlRunning, setSqlRunning] = useState(false)
  const [sqlError, setSqlError] = useState<string | null>(null)

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
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (e: any) {
      setSaveMsg(e.message)
    } finally {
      setSaving(false)
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

  const handleSelectTable = async (tableName: string, page = 0, col: string | null = sortCol, dir: 'asc' | 'desc' = sortDir) => {
    setSelectedTable(tableName)
    setTableLoading(true)
    setTableData([])
    setSqlMode(false)
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

  const handleUpdateCell = async (row: any, col: string, newVal: any) => {
    if (!selectedTable) return
    const tableInfo = tables.find(t => t.name === selectedTable)
    if (!tableInfo) return
    const pkCols = tableInfo.columns.filter(c => c.isPrimary)
    if (pkCols.length === 0) {
      setStudioError('Cannot edit: No primary key defined for this table.')
      return
    }

    const primaryKey: Record<string, any> = {}
    pkCols.forEach(c => primaryKey[c.name] = row[c.name])

    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/database/studio/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: config, table: selectedTable, primaryKey, updatedRow: { [col]: newVal } }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed')
      setTableData(prev => prev.map(r => {
        const isMatch = pkCols.every(pk => r[pk.name] === primaryKey[pk.name])
        return isMatch ? { ...r, [col]: newVal } : r
      }))
    } catch (e: any) {
      setStudioError(e.message)
    }
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

  const handleSort = (col: string) => {
    const newDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'
    setSortCol(col)
    setSortDir(newDir)
    if (selectedTable) handleSelectTable(selectedTable, tablePage, col, newDir)
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
          {useConnectionString ? (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Connection String</label>
              <input
                type="password"
                value={config.connectionString}
                onChange={e => setConfig(c => ({ ...c, connectionString: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Host</label>
                <input type="text" value={config.host || ''} onChange={e => setConfig(c => ({ ...c, host: e.target.value }))} className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Port</label>
                <input type="text" value={config.port || ''} onChange={e => setConfig(c => ({ ...c, port: e.target.value }))} className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="pt-6 border-t border-[var(--border-default)] flex flex-col gap-3">
        <Button variant="outline" className="w-full justify-center" onClick={handleTest} disabled={testing}>
          {testing && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
          Test Connection
        </Button>
        <Button className="w-full justify-center bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white" onClick={handleSave} disabled={saving}>
          {saving && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
          {saveMsg === 'Saved!' ? 'Settings Saved' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <Drawer isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="Database Settings" className="w-screen max-w-sm">
        {renderConfigForm()}
      </Drawer>

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden flex flex-col min-h-[700px]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-default)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DatabaseIcon className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Database Studio</h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">Manage and explore your data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {studioOpen && (
              <Button variant="outline" size="sm" onClick={() => setIsConfigOpen(true)} className="h-8 text-xs font-semibold gap-1.5">
                <SettingsIcon className="w-3.5 h-3.5" /> Connection
              </Button>
            )}
            <Button 
              onClick={studioOpen ? () => { setStudioOpen(false); setTables([]); setSelectedTable(null) } : handleOpenStudio}
              variant={studioOpen ? "outline" : "primary"}
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5"
            >
              {studioOpen ? 'Exit' : <><ExternalLinkIcon className="w-3.5 h-3.5" /> Studio</>}
            </Button>
          </div>
        </div>

        {!studioOpen ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-default)]">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center mb-6 border border-[var(--border-default)]">
              <DatabaseIcon className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
            </div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">Connect to Data Studio</h4>
            <Button onClick={handleOpenStudio} className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-8 rounded-xl">
              Connect Now
            </Button>
          </div>
        ) : studioLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2Icon className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="mt-4 text-sm font-medium text-[var(--text-secondary)]">Connecting...</p>
          </div>
        ) : studioError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-red-500/5 text-center">
            <XCircleIcon className="w-8 h-8 text-red-500 mb-4" />
            <h4 className="text-base font-bold text-red-600">Failed</h4>
            <p className="text-sm text-red-500/80 mt-1 max-w-md">{studioError}</p>
            <Button size="sm" onClick={handleOpenStudio} className="mt-6 bg-red-600 text-white">Retry</Button>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden bg-[#1c1c1c] text-zinc-300">
            {/* Main Panel */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1c1c1c]">
              {sqlMode ? (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  <div className="h-10 flex items-center px-4 border-b border-[#2e2e2e] bg-[#141414] justify-between">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase">SQL Editor</span>
                    <Button onClick={handleRunSql} disabled={sqlRunning || !sqlQuery.trim()} className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-3">
                      {sqlRunning ? <Loader2Icon className="w-3 h-3 animate-spin mr-1.5" /> : <PlayIcon className="w-3 h-3 mr-1.5" />}
                      Run
                    </Button>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <textarea 
                      value={sqlQuery} 
                      onChange={e => setSqlQuery(e.target.value)} 
                      placeholder="SELECT * FROM table LIMIT 100"
                      className="flex-1 p-4 font-mono text-xs text-zinc-300 bg-transparent resize-none focus:outline-none custom-scrollbar"
                    />
                    {sqlError && <div className="p-4 bg-red-500/10 text-red-400 text-xs font-mono">{sqlError}</div>}
                    {tableData.length > 0 && (
                      <div className="h-1/2 border-t border-[#2e2e2e] bg-[#141414] overflow-auto">
                        <DataTable rows={tableData} columns={[]} sortCol={sortCol} sortDir={sortDir} onSort={() => {}} copiedCell={copiedCell} onCopyCell={handleCopyCell} />
                      </div>
                    )}
                  </div>
                </div>
              ) : !selectedTable ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                  <DatabaseIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">Select a table from the right sidebar</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="h-10 flex items-center gap-4 px-4 border-b border-[#2e2e2e] bg-[#141414] justify-between">
                    <div className="flex items-center gap-2">
                       <TableIcon className="w-4 h-4 text-emerald-500" />
                       <span className="text-xs font-bold">{selectedTable}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleExportCsv} className="p-1.5 text-zinc-500 hover:text-white"><DownloadIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => selectedTable && handleSelectTable(selectedTable, tablePage)} className="p-1.5 text-zinc-500 hover:text-white"><RefreshCwIcon className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-[#1c1c1c] custom-scrollbar">
                    {tableLoading ? (
                      <div className="flex items-center justify-center h-full"><Loader2Icon className="w-6 h-6 animate-spin text-emerald-500" /></div>
                    ) : (
                      <DataTable 
                        rows={tableData} columns={selectedTableColumns} 
                        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} 
                        copiedCell={copiedCell} onCopyCell={handleCopyCell} onUpdateCell={handleUpdateCell} 
                      />
                    )}
                  </div>
                  <div className="h-10 flex items-center justify-between px-4 border-t border-[#2e2e2e] bg-[#141414]">
                    <div className="flex items-center gap-2">
                      <button onClick={() => selectedTable && handleSelectTable(selectedTable, 0)} disabled={tablePage === 0} className="p-1.5 text-zinc-500 disabled:opacity-20"><ChevronsLeftIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => selectedTable && handleSelectTable(selectedTable, tablePage-1)} disabled={tablePage === 0} className="p-1.5 text-zinc-500 disabled:opacity-20"><ChevronLeftIcon className="w-3.5 h-3.5" /></button>
                      <span className="text-[10px]">Page {tablePage + 1}</span>
                      <button onClick={() => selectedTable && handleSelectTable(selectedTable, tablePage+1)} disabled={tableData.length < PAGE_SIZE} className="p-1.5 text-zinc-500 disabled:opacity-20"><ChevronRightIcon className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar (Right) */}
            <div className="w-64 border-l border-[#2e2e2e] bg-[#141414] overflow-y-auto custom-scrollbar">
              <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-600 uppercase">Tables</span>
                <button onClick={() => setSqlMode(true)} className={`p-1 text-zinc-500 ${sqlMode && 'text-emerald-500'}`}><TerminalIcon className="w-4 h-4" /></button>
              </div>
              <div className="p-2 space-y-1">
                {tables.map(t => (
                  <div key={t.name}>
                    <button
                      onClick={() => { toggleTableExpand(t.name); handleSelectTable(t.name, 0) }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs ${selectedTable === t.name && !sqlMode ? 'bg-[#2e2e2e] text-white' : 'hover:bg-[#1c1c1c] text-zinc-500'}`}
                    >
                      <ChevronRightIcon className={`w-3 h-3 transition-transform ${expandedTables.has(t.name) ? 'rotate-90' : ''}`} />
                      <TableIcon className="w-3.5 h-3.5" />
                      <span className="truncate">{t.name}</span>
                    </button>
                    {expandedTables.has(t.name) && (
                      <div className="ml-6 py-1 border-l border-[#2e2e2e] space-y-1">
                        {t.columns.map(c => (
                          <div key={c.name} className="flex items-center gap-2 pl-3 py-0.5 text-[10px] text-zinc-600">
                            {c.isPrimary ? <KeyIcon className="w-2.5 h-2.5 text-amber-500" /> : <div className="w-1 h-1 rounded-full bg-zinc-800" />}
                            <span className="truncate">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #141414; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: #141414; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 3px; }
      `}</style>
    </div>
  )
}
