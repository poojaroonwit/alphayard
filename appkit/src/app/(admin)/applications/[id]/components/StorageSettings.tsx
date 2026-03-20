'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { HardDriveIcon, CheckCircleIcon, XCircleIcon, Loader2Icon, SaveIcon, ExternalLinkIcon, FolderIcon, FileIcon, RefreshCwIcon, UploadIcon, Trash2Icon, ImageIcon, FileTextIcon, FileArchiveIcon, DownloadIcon, CopyIcon, CheckCircle2Icon, FolderPlusIcon, SearchIcon, XIcon, ChevronRightIcon, SettingsIcon, MoreHorizontalIcon, LayoutGridIcon, ListIcon, InfoIcon, ClockIcon, FilterIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Tooltip } from '@/components/ui/Tooltip'

interface StorageConfig {
  provider: 'minio' | 's3' | 'gcs' | 'azure'
  endpoint?: string
  region?: string
  bucket: string
  accessKey: string
  secretKey: string
  publicUrl?: string
  usePathStyle?: boolean
}

interface StorageObject {
  key: string
  size: number
  lastModified: string
  contentType?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif']

function isImage(key: string) {
  return IMAGE_EXTS.includes(key.split('.').pop()?.toLowerCase() || '')
}

function getFileIcon(key: string) {
  const ext = key.split('.').pop()?.toLowerCase()
  if (IMAGE_EXTS.includes(ext || '')) return <ImageIcon className="w-4 h-4 text-blue-400" />
  if (['zip', 'tar', 'gz', 'rar'].includes(ext || '')) return <FileArchiveIcon className="w-4 h-4 text-amber-400" />
  if (['txt', 'md', 'json', 'yaml', 'yml', 'csv'].includes(ext || '')) return <FileTextIcon className="w-4 h-4 text-green-400" />
  return <FileIcon className="w-4 h-4 text-gray-400" />
}

interface StorageSettingsProps {
  appId: string
  initialConfig?: StorageConfig | null
}

export const StorageSettings: React.FC<StorageSettingsProps> = ({ appId, initialConfig }) => {
  const [config, setConfig] = useState<StorageConfig>(
    initialConfig || { provider: 'minio', endpoint: '', bucket: '', accessKey: '', secretKey: '', usePathStyle: true }
  )
  const [loadingConfig, setLoadingConfig] = useState(!initialConfig)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  useEffect(() => {
    if (initialConfig) return
    setLoadingConfig(true)
    fetch(`/api/v1/admin/applications/${appId}/config/storage`)
      .then(r => r.json())
      .then(data => { if (data.storage) setConfig(data.storage) })
      .catch(() => {})
      .finally(() => setLoadingConfig(false))
  }, [appId, initialConfig])

  // Studio state
  const [studioOpen, setStudioOpen] = useState(false)
  const [studioLoading, setStudioLoading] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [objects, setObjects] = useState<StorageObject[]>([])
  const [studioError, setStudioError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  // New features
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showDetails, setShowDetails] = useState(true)
  const [selectedFile, setSelectedFile] = useState<StorageObject | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/storage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: config }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      setSaveMsg('Saved!')
      setTestResult(null)
    } catch (e: any) {
      setSaveMsg(e.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 5000)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/storage/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: config }),
      })
      const data = await res.json()
      setTestResult({ ok: res.ok && data.ok, message: data.message || (res.ok ? 'Connection successful!' : 'Connection failed') })
    } catch {
      setTestResult({ ok: false, message: 'Network error' })
    } finally {
      setTesting(false)
    }
  }

  const loadObjects = async (pfx = prefix) => {
    setStudioLoading(true)
    setStudioError(null)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/storage/studio/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: config, prefix: pfx }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to list objects')
      setObjects(data.objects || [])
    } catch (e: any) {
      setStudioError(e.message)
    } finally {
      setStudioLoading(false)
    }
  }

  const handleOpenStudio = async () => {
    setStudioOpen(true)
    setPrefix('')
    await loadObjects('')
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('storage', JSON.stringify(config))
      formData.append('prefix', prefix)
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/storage/studio/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
      await loadObjects(prefix)
    } catch (e: any) {
      setStudioError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete "${key}"?`)) return
    setDeleting(key)
    try {
      const res = await fetch(`/api/v1/admin/applications/${appId}/config/storage/studio/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: config, key }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setObjects(prev => prev.filter(o => o.key !== key))
    } catch (e: any) {
      setStudioError(e.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) await handleUpload(file)
  }, [prefix, config, appId])

  const handleGetUrl = async (key: string): Promise<string> => {
    const res = await fetch(`/api/v1/admin/applications/${appId}/config/storage/studio/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage: config, key }),
    })
    const data = await res.json()
    return data.url || ''
  }

  const handlePreview = async (key: string) => {
    const url = await handleGetUrl(key)
    setPreviewKey(key)
    setPreviewUrl(url)
  }

  const handleDownload = async (key: string) => {
    const url = await handleGetUrl(key)
    const a = document.createElement('a')
    a.href = url
    a.download = key.split('/').pop() || key
    a.target = '_blank'
    a.click()
  }

  const handleCopyUrl = async (key: string) => {
    const url = config.publicUrl
      ? `${config.publicUrl.replace(/\/$/, '')}/${key}`
      : await handleGetUrl(key)
    navigator.clipboard.writeText(url)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const folderKey = `${prefix}${newFolderName.trim().replace(/[/\\]/g, '')}/`
    try {
      await fetch(`/api/v1/admin/applications/${appId}/config/storage/studio/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: config, key: folderKey }),
      })
      setNewFolderName('')
      setCreatingFolder(false)
      await loadObjects(prefix)
    } catch (e: any) {
      setStudioError(e.message || 'Failed to create folder')
    }
  }

  const navigateToFolder = (folder: string) => {
    const newPrefix = folder.endsWith('/') ? folder : folder + '/'
    setPrefix(newPrefix)
    loadObjects(newPrefix)
  }

  const navigateUp = () => {
    const parts = prefix.replace(/\/$/, '').split('/')
    parts.pop()
    const newPrefix = parts.length > 0 ? parts.join('/') + '/' : ''
    setPrefix(newPrefix)
    loadObjects(newPrefix)
  }

  const allFolders = objects.filter(o => o.key.endsWith('/') || o.key.slice(prefix.length).includes('/'))
  const allFiles = objects.filter(o => !o.key.endsWith('/') && !o.key.slice(prefix.length).includes('/'))
  const folders = search ? allFolders.filter(o => o.key.toLowerCase().includes(search.toLowerCase())) : allFolders
  const files = search ? allFiles.filter(o => o.key.toLowerCase().includes(search.toLowerCase())) : allFiles

  // Breadcrumb parts
  const breadParts = prefix.replace(/\/$/, '').split('/').filter(Boolean)

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  const renderConfigForm = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Storage Connection</h4>
        {testResult && (
          <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${testResult.ok ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            {testResult.ok ? <CheckCircleIcon className="w-4 h-4 shrink-0" /> : <XCircleIcon className="w-4 h-4 shrink-0" />}
            {testResult.message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Provider</label>
            <select
              value={config.provider}
              onChange={e => setConfig(c => ({ ...c, provider: e.target.value as StorageConfig['provider'] }))}
              className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            >
              <option value="minio">MinIO</option>
              <option value="s3">Amazon S3</option>
              <option value="gcs">Google Cloud Storage</option>
              <option value="azure">Azure Blob Storage</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Bucket Name</label>
            <input
              type="text"
              value={config.bucket}
              onChange={e => setConfig(c => ({ ...c, bucket: e.target.value }))}
              placeholder="my-app-bucket"
              className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          {(config.provider === 'minio' || config.provider === 's3') && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                {config.provider === 'minio' ? 'Endpoint URL' : 'Custom Endpoint (optional)'}
              </label>
              <input
                type="text"
                value={config.endpoint || ''}
                onChange={e => setConfig(c => ({ ...c, endpoint: e.target.value }))}
                placeholder={config.provider === 'minio' ? 'http://localhost:9000' : 'https://s3.us-east-1.amazonaws.com'}
                className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Region</label>
            <input
              type="text"
              value={config.region || ''}
              onChange={e => setConfig(c => ({ ...c, region: e.target.value }))}
              placeholder="us-east-1"
              className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Access Key ID</label>
            <input
              type="text"
              value={config.accessKey}
              onChange={e => setConfig(c => ({ ...c, accessKey: e.target.value }))}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Secret Access Key</label>
            <input
              type="password"
              value={config.secretKey}
              onChange={e => setConfig(c => ({ ...c, secretKey: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Public Base URL (optional)</label>
            <input
              type="url"
              value={config.publicUrl || ''}
              onChange={e => setConfig(c => ({ ...c, publicUrl: e.target.value }))}
              placeholder="https://cdn.example.com"
              className="w-full px-3 py-2 bg-[var(--bg-default)] border border-[var(--border-default)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          {config.provider === 'minio' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="path-style-toggle"
                checked={config.usePathStyle ?? true}
                onChange={e => setConfig(c => ({ ...c, usePathStyle: e.target.checked }))}
                className="rounded border-[var(--border-default)] text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]"
              />
              <label htmlFor="path-style-toggle" className="text-xs font-medium text-[var(--text-secondary)] cursor-pointer">Use Path-Style URLs</label>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-[var(--border-default)] flex items-center gap-3">
        <Button variant="outline" className="flex-1 h-10 text-xs font-bold" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2Icon className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
          Test Connection
        </Button>
        <Button className="flex-1 h-10 text-xs font-bold bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white" onClick={handleSave} disabled={saving}>
          {saving && <Loader2Icon className="w-3.5 h-3.5 mr-2 animate-spin" />}
          {saveMsg === 'Saved!' ? 'Settings Saved' : 'Save Config'}
        </Button>
      </div>
      {saveMsg && (
        <div className={`mt-4 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${saveMsg === 'Saved!' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
          {saveMsg === 'Saved!' ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}
          {saveMsg}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <Drawer
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Storage Settings"
        className="w-screen max-w-sm"
      >
        {renderConfigForm()}
      </Drawer>

      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden flex flex-col min-h-[700px]">
        {/* Header / Toolbar */}
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-default)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <HardDriveIcon className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                Storage Studio
                {studioOpen && !studioLoading && (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Connected</span>
                )}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">Manage assets and object storage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfigOpen(true)}
              className="h-8 text-[11px] font-bold gap-2 border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              Connection
            </Button>
            {!studioOpen && (
              <Button
                size="sm"
                onClick={handleOpenStudio}
                className="h-8 text-[11px] font-bold gap-2 bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white border-0"
              >
                <ExternalLinkIcon className="w-3.5 h-3.5" />
                Open Studio
              </Button>
            )}
          </div>
        </div>

        {!studioOpen ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-default)]">
             <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center mb-6 border border-[var(--border-default)]">
                <HardDriveIcon className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
             </div>
             <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Connect to your Storage</h3>
             <p className="text-sm text-[var(--text-muted)] max-w-sm mb-8 leading-relaxed">
               Configure your S3-compatible, GCS, or Azure storage to browse buckets, upload assets, and manage files directly from AppKit.
             </p>
             <Button 
               onClick={() => setIsConfigOpen(true)}
               className="h-10 px-6 rounded-xl bg-[var(--primary-blue)] hover:bg-[var(--primary-blue-hover)] text-white text-xs font-bold shadow-lg shadow-[var(--primary-blue)]/20"
             >
               Configure Connection
             </Button>
          </div>
        ) : (
          /* Redesigned Studio Interface */
          <div className="flex-1 flex min-h-0 bg-[#1c1c1c] text-zinc-300">
            {/* Sidebar - Filesystem Tree Style */}
            <div className="w-64 border-r border-[#2e2e2e] flex flex-col bg-[#141414] shrink-0">
               <div className="p-4 border-b border-[#2e2e2e]">
                 <div className="flex items-center justify-between mb-4">
                   <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Buckets & Folders</span>
                   <button onClick={() => setCreatingFolder(true)} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors">
                     <FolderPlusIcon className="w-3.5 h-3.5" />
                   </button>
                 </div>
                 <div className="space-y-1">
                   <button 
                     onClick={() => { setPrefix(''); loadObjects('') }}
                     className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${prefix === '' ? 'bg-amber-500/10 text-amber-500 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                   >
                     <HardDriveIcon className="w-3.5 h-3.5" />
                     <span className="truncate">{config.bucket}</span>
                   </button>
                 </div>
               </div>

               <div className="flex-1 overflow-auto py-2 custom-scrollbar">
                  {breadParts.length > 0 && (
                    <div className="px-2 mb-2">
                       <button 
                         onClick={navigateUp}
                         className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                       >
                         <ChevronRightIcon className="w-3.5 h-3.5 rotate-180" />
                         Back to parent
                       </button>
                    </div>
                  )}
                  {folders.map(obj => {
                    const folderName = obj.key.slice(prefix.length).replace(/\/$/, '').split('/')[0]
                    if (!folderName) return null
                    return (
                      <button
                        key={obj.key}
                        onClick={() => navigateToFolder(prefix + folderName)}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 transition-all group text-left"
                      >
                        <FolderIcon className="w-3.5 h-3.5 text-amber-500/60 group-hover:text-amber-500 transition-colors shrink-0" />
                        <span className="text-xs truncate">{folderName}</span>
                      </button>
                    )
                  })}
               </div>
            </div>

            {/* Main Explorer Panel */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1c1c1c]">
               {/* Studio Toolbar */}
               <div className="h-12 flex items-center gap-4 px-4 border-b border-[#2e2e2e] bg-[#141414] shrink-0">
                  <div className="flex items-center gap-2 text-zinc-500 overflow-hidden">
                    <button onClick={() => { setPrefix(''); loadObjects('') }} className="text-[10px] font-bold hover:text-white uppercase tracking-wider shrink-0 transition-colors">Root</button>
                    {breadParts.map((part, i) => (
                      <React.Fragment key={i}>
                        <ChevronRightIcon className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] font-bold text-zinc-200 truncate max-w-[100px]">{part}</span>
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="h-4 w-[1px] bg-[#2e2e2e]" />

                  <div className="flex items-center gap-1">
                    <div className="relative group">
                      <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search files..."
                        className="h-8 pl-8 pr-3 bg-zinc-900 border border-[#2e2e2e] rounded-md text-[11px] w-48 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center bg-zinc-900 border border-[#2e2e2e] rounded-md p-1">
                       <button 
                         onClick={() => setViewMode('list')}
                         className={`p-1 rounded transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
                       >
                         <ListIcon className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         onClick={() => setViewMode('grid')}
                         className={`p-1 rounded transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
                       >
                         <LayoutGridIcon className="w-3.5 h-3.5" />
                       </button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className={`h-8 w-8 p-0 rounded-md transition-all ${showDetails ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-500 hover:text-white'}`}
                    >
                      <InfoIcon className="w-3.5 h-3.5" />
                    </Button>

                    <label className="h-8 flex items-center gap-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md cursor-pointer transition-all shadow-sm shadow-emerald-900/20">
                      {uploading ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <UploadIcon className="w-3.5 h-3.5" />}
                      Upload
                      <input type="file" multiple className="hidden" onChange={async e => {
                        const files = Array.from(e.target.files || [])
                        for (const f of files) await handleUpload(f)
                        e.currentTarget.value = ''
                      }} />
                    </label>
                  </div>
               </div>

               {/* Studio Error Alert */}
               {studioError && (
                 <div className="mx-4 mt-4 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
                   <div className="flex items-center gap-2">
                     <XCircleIcon className="w-3.5 h-3.5" />
                     {studioError}
                   </div>
                   <button onClick={() => setStudioError(null)} className="p-1 hover:bg-red-500/20 rounded transition-colors">
                     <XIcon className="w-3 h-3" />
                   </button>
                 </div>
               )}

               {/* Explorer Grid/List */}
               <div 
                 className={`flex-1 overflow-auto bg-[#1c1c1c] custom-scrollbar ${dragOver ? 'ring-2 ring-inset ring-amber-500/50 bg-amber-500/5' : ''}`}
                 onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                 onDragLeave={() => setDragOver(false)}
                 onDrop={handleDrop}
               >
                 {creatingFolder && (
                    <div className="m-4 flex items-center gap-3 p-3 rounded-lg bg-zinc-950 border border-amber-500/20 animate-in slide-in-from-top-2 duration-300">
                      <FolderIcon className="w-5 h-5 text-amber-500" />
                      <input
                        autoFocus
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') } }}
                        placeholder="Enter folder name..."
                        className="flex-1 bg-transparent border-0 focus:outline-none text-sm text-zinc-200"
                      />
                      <div className="flex items-center gap-2">
                        <Button onClick={() => { setCreatingFolder(false); setNewFolderName('') }} variant="ghost" className="h-7 text-[10px] font-bold text-zinc-500">Cancel</Button>
                        <Button onClick={handleCreateFolder} className="h-7 px-3 text-[10px] font-bold bg-amber-500 text-black hover:bg-amber-600">Create</Button>
                      </div>
                    </div>
                 )}

                 {studioLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 animate-pulse">
                      <div className="h-4 w-4 rounded-full bg-amber-500 mr-2 animate-ping" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">Syncing Storage...</span>
                    </div>
                 ) : folders.length === 0 && files.length === 0 && !creatingFolder ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 px-12 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                        <FolderIcon className="w-6 h-6 text-zinc-700" />
                      </div>
                      <p className="text-sm font-bold text-zinc-400">{search ? 'No matches found' : 'This folder is empty'}</p>
                      <p className="text-xs text-zinc-600 mt-1">Drag and drop files here to upload your first asset.</p>
                    </div>
                 ) : viewMode === 'list' ? (
                    /* List View */
                    <div className="min-w-full inline-block align-middle">
                       <table className="min-w-full divide-y divide-[#2e2e2e]">
                         <thead>
                           <tr className="bg-[#141414]/50">
                             <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                             <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Size</th>
                             <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                             <th className="px-6 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Updated</th>
                             <th className="px-6 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-[#2e2e2e]/50">
                           {folders.map(obj => {
                               const name = obj.key.slice(prefix.length).replace(/\/$/, '').split('/')[0]
                               if (!name) return null
                               return (
                                 <tr key={obj.key} onClick={() => navigateToFolder(prefix + name)} className="hover:bg-zinc-800/30 group cursor-pointer transition-colors border-l-2 border-transparent hover:border-amber-500/50">
                                   <td className="px-6 py-3">
                                     <div className="flex items-center gap-3">
                                       <FolderIcon className="w-4 h-4 text-amber-500/70" />
                                       <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">{name}/</span>
                                     </div>
                                   </td>
                                   <td className="px-6 py-3 text-[10px] text-zinc-600 font-mono">—</td>
                                   <td className="px-6 py-3 text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Directory</td>
                                   <td className="px-6 py-3 text-[10px] text-zinc-600 font-medium">—</td>
                                   <td className="px-6 py-3 text-right">
                                     <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-600 hover:text-zinc-200 transition-all opacity-0 group-hover:opacity-100">
                                       <MoreHorizontalIcon className="w-3.5 h-3.5" />
                                     </button>
                                   </td>
                                 </tr>
                               )
                           })}
                           {files.map(obj => {
                               const name = obj.key.slice(prefix.length)
                               const isImg = isImage(obj.key)
                               const isSelect = selectedFile?.key === obj.key
                               return (
                                 <tr key={obj.key} onClick={() => setSelectedFile(obj)} className={`hover:bg-zinc-800/30 group cursor-pointer transition-all border-l-2 ${isSelect ? 'bg-zinc-800/50 border-amber-500' : 'border-transparent'}`}>
                                   <td className="px-6 py-3">
                                     <div className="flex items-center gap-3">
                                       <div className="w-6 h-6 flex items-center justify-center">
                                         {getFileIcon(obj.key)}
                                       </div>
                                       <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors truncate max-w-xs">{name}</span>
                                     </div>
                                   </td>
                                   <td className="px-6 py-3 text-[10px] text-zinc-400 font-mono">{formatBytes(obj.size)}</td>
                                   <td className="px-6 py-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{obj.contentType?.split('/')[1] || name.split('.').pop()}</td>
                                   <td className="px-6 py-3 text-[10px] text-zinc-500 font-medium">{new Date(obj.lastModified).toLocaleDateString()}</td>
                                   <td className="px-6 py-3 text-right">
                                     <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                       <button onClick={(e) => { e.stopPropagation(); handleCopyUrl(obj.key) }} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all">
                                          {copiedKey === obj.key ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                       </button>
                                       <button onClick={(e) => { e.stopPropagation(); handleDownload(obj.key) }} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all">
                                          <DownloadIcon className="w-3.5 h-3.5" />
                                       </button>
                                       <button onClick={(e) => { e.stopPropagation(); handleDelete(obj.key) }} className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all">
                                          <Trash2Icon className="w-3.5 h-3.5" />
                                       </button>
                                     </div>
                                   </td>
                                 </tr>
                               )
                           })}
                         </tbody>
                       </table>
                    </div>
                 ) : (
                    /* Grid View */
                    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                      {folders.map(obj => {
                         const name = obj.key.slice(prefix.length).replace(/\/$/, '').split('/')[0]
                         if (!name) return null
                         return (
                           <button 
                             key={obj.key}
                             onClick={() => navigateToFolder(prefix + name)}
                             className="flex flex-col items-center p-4 rounded-xl hover:bg-zinc-800/50 group transition-all"
                           >
                             <div className="w-16 h-16 bg-zinc-900 border border-[#2e2e2e] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-105 transition-all shadow-lg group-hover:shadow-amber-500/10 group-hover:border-amber-500/30">
                               <FolderIcon className="w-8 h-8 text-amber-500/60 group-hover:text-amber-500 transition-colors" />
                             </div>
                             <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white text-center truncate w-full">{name}</span>
                           </button>
                         )
                      })}
                      {files.map(obj => {
                         const name = obj.key.slice(prefix.length)
                         const isImg = isImage(obj.key)
                         const isSelect = selectedFile?.key === obj.key
                         return (
                           <div 
                             key={obj.key}
                             onClick={() => setSelectedFile(obj)}
                             className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${isSelect ? 'bg-amber-500/10 ring-1 ring-amber-500/50' : 'hover:bg-zinc-800/30'}`}
                           >
                              <div className="w-full aspect-square bg-zinc-900 border border-[#2e2e2e] rounded-xl flex items-center justify-center mb-3 relative overflow-hidden group shadow-lg">
                                {isImg ? (
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); handlePreview(obj.key) }}
                                     className="w-full h-full flex items-center justify-center"
                                   >
                                     <img src="#" alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-zinc-700"><svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                                     }} />
                                   </button>
                                ) : (
                                   <div className="group-hover:scale-110 transition-transform">
                                     {getFileIcon(obj.key)}
                                   </div>
                                )}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all">
                                   <button onClick={(e) => { e.stopPropagation(); handleDelete(obj.key) }} className="p-1 bg-black/50 hover:bg-red-500 text-white rounded-md backdrop-blur-sm">
                                      <Trash2Icon className="w-2.5 h-2.5" />
                                   </button>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-zinc-400 text-center truncate w-full px-1">{name}</span>
                              <span className="text-[9px] text-zinc-600 font-mono mt-1">{formatBytes(obj.size)}</span>
                           </div>
                         )
                      })}
                    </div>
                 )}
               </div>

               {/* Detail Sidebar */}
               {showDetails && selectedFile && (
                  <div className="w-72 border-l border-[#2e2e2e] flex flex-col bg-[#141414] animate-in slide-in-from-right-4 duration-300">
                     <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between">
                       <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">File Details</span>
                       <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-zinc-800 rounded text-zinc-600 hover:text-white transition-colors">
                         <XIcon className="w-3.5 h-3.5" />
                       </button>
                     </div>
                     <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                        <div className="w-full aspect-video bg-zinc-900 border border-[#2e2e2e] rounded-xl flex items-center justify-center mb-6 overflow-hidden shadow-inner">
                           {isImage(selectedFile.key) ? (
                              <img src="#" alt="" className="w-full h-full object-contain" onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-zinc-800"><svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                              }} />
                           ) : (
                              <FileIcon className="w-12 h-12 text-zinc-800" />
                           )}
                        </div>
                        
                        <div className="space-y-6">
                           <div>
                              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Name</label>
                              <p className="text-xs font-bold text-zinc-200 break-all">{selectedFile.key.split('/').pop()}</p>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Size</label>
                                 <p className="text-xs font-bold text-zinc-200 font-mono">{formatBytes(selectedFile.size)}</p>
                              </div>
                              <div>
                                 <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Type</label>
                                 <p className="text-xs font-bold text-zinc-200 uppercase">{selectedFile.contentType?.split('/')[1] || 'Unknown'}</p>
                              </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Last Modified</label>
                              <div className="flex items-center gap-2 text-zinc-400">
                                 <ClockIcon className="w-3.5 h-3.5" />
                                 <p className="text-xs font-medium">{new Date(selectedFile.lastModified).toLocaleString()}</p>
                              </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Storage Path</label>
                              <code className="text-[10px] bg-zinc-900 border border-zinc-800 p-2 rounded block break-all text-amber-500/80">{selectedFile.key}</code>
                           </div>

                           <div className="pt-4 flex flex-col gap-2">
                             <Button onClick={() => handleCopyUrl(selectedFile.key)} className="h-9 w-full bg-[#2e2e2e] hover:bg-[#3e3e3e] text-[11px] font-bold gap-2">
                               {copiedKey === selectedFile.key ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                               Copy public URL
                             </Button>
                             <Button onClick={() => handleDownload(selectedFile.key)} className="h-9 w-full bg-[#2e2e2e] hover:bg-[#3e3e3e] text-[11px] font-bold gap-2">
                               <DownloadIcon className="w-3.5 h-3.5" />
                               Download file
                             </Button>
                             <Button onClick={() => handleDelete(selectedFile.key)} variant="ghost" className="h-9 w-full hover:bg-red-500/10 text-zinc-500 hover:text-red-500 text-[11px] font-bold gap-2">
                               <Trash2Icon className="w-3.5 h-3.5" />
                               Delete asset
                             </Button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Image preview modal (Fixed position outside overflow) */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 cursor-zoom-out" onClick={() => { setPreviewUrl(null); setPreviewKey(null) }}>
          <div className="relative max-w-5xl w-full max-h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 p-4 z-10">
              <button 
                onClick={() => { setPreviewUrl(null); setPreviewKey(null) }} 
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <img src={previewUrl} alt={previewKey || ''} className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg" />
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-white font-bold text-sm tracking-tight">{previewKey?.split('/').pop()}</span>
              <span className="text-zinc-500 text-xs font-medium font-mono">/{previewKey}</span>
            </div>
          </div>
        </div>
      )}

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
      `}</style>
    </div>
  )
}
