'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { HardDriveIcon, CheckCircleIcon, XCircleIcon, Loader2Icon, SaveIcon, ExternalLinkIcon, FolderIcon, FileIcon, RefreshCwIcon, UploadIcon, Trash2Icon, ImageIcon, FileTextIcon, FileArchiveIcon, DownloadIcon, CopyIcon, CheckCircle2Icon, FolderPlusIcon, SearchIcon, XIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
    } catch {
      // silent
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
    } catch {
      // silent
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
    } catch {}
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

  return (
    <div className="space-y-4">
      {/* Config Card */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HardDriveIcon className="w-4 h-4 text-amber-500" />
              Storage Connection
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Configure per-application object storage (S3-compatible or GCS/Azure).</p>
          </div>
          <div className="flex items-center gap-2">
            {saveMsg && (
              <span className={`text-xs font-medium ${saveMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-500'}`}>{saveMsg}</span>
            )}
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !config.bucket || !config.accessKey}>
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

        <div className="grid grid-cols-2 gap-4">
          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Provider</label>
            <select
              value={config.provider}
              onChange={e => setConfig(c => ({ ...c, provider: e.target.value as StorageConfig['provider'] }))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="minio">MinIO</option>
              <option value="s3">Amazon S3</option>
              <option value="gcs">Google Cloud Storage</option>
              <option value="azure">Azure Blob Storage</option>
            </select>
          </div>

          {/* Bucket */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Bucket Name</label>
            <input
              type="text"
              value={config.bucket}
              onChange={e => setConfig(c => ({ ...c, bucket: e.target.value }))}
              placeholder="my-app-bucket"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Endpoint (for MinIO/custom S3) */}
          {(config.provider === 'minio' || config.provider === 's3') && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                {config.provider === 'minio' ? 'Endpoint URL' : 'Custom Endpoint (optional)'}
              </label>
              <input
                type="text"
                value={config.endpoint || ''}
                onChange={e => setConfig(c => ({ ...c, endpoint: e.target.value }))}
                placeholder={config.provider === 'minio' ? 'http://localhost:9000' : 'https://s3.us-east-1.amazonaws.com'}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {/* Region */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Region</label>
            <input
              type="text"
              value={config.region || ''}
              onChange={e => setConfig(c => ({ ...c, region: e.target.value }))}
              placeholder="us-east-1"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Access Key */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Access Key ID</label>
            <input
              type="text"
              value={config.accessKey}
              onChange={e => setConfig(c => ({ ...c, accessKey: e.target.value }))}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Secret Access Key</label>
            <input
              type="password"
              value={config.secretKey}
              onChange={e => setConfig(c => ({ ...c, secretKey: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Public URL */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Public Base URL (optional)</label>
            <input
              type="url"
              value={config.publicUrl || ''}
              onChange={e => setConfig(c => ({ ...c, publicUrl: e.target.value }))}
              placeholder="https://cdn.example.com"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">Used for generating public file URLs (CDN prefix).</p>
          </div>

          {config.provider === 'minio' && (
            <div className="col-span-2 flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.usePathStyle ?? true}
                  onChange={e => setConfig(c => ({ ...c, usePathStyle: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Use Path-Style URLs (recommended for MinIO)
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Storage Studio */}
      <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderIcon className="w-4 h-4 text-amber-500" />
              Storage Studio
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Browse, upload, and manage files in the configured bucket.</p>
          </div>
          <button
            onClick={studioOpen ? () => { setStudioOpen(false); setObjects([]) } : handleOpenStudio}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
          >
            {studioOpen ? 'Close Studio' : (
              <><ExternalLinkIcon className="w-3.5 h-3.5" /> Open Studio</>
            )}
          </button>
        </div>

        {/* Image preview modal */}
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => { setPreviewUrl(null); setPreviewKey(null) }}>
            <div className="relative max-w-3xl max-h-[80vh] rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setPreviewUrl(null); setPreviewKey(null) }} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full z-10">
                <XIcon className="w-4 h-4" />
              </button>
              <img src={previewUrl} alt={previewKey || ''} className="max-w-full max-h-[80vh] object-contain" />
              <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-black/50 text-white text-xs truncate">{previewKey}</div>
            </div>
          </div>
        )}

        {studioOpen && (
          studioError ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
              <XCircleIcon className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-medium">Failed to connect</p>
                <p className="text-xs mt-0.5 opacity-80">{studioError}</p>
              </div>
              <button onClick={handleOpenStudio} className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-800/30 rounded">
                <RefreshCwIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              ref={dropRef}
              className={`rounded-lg border overflow-hidden transition-colors ${dragOver ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-500/5' : 'border-gray-200 dark:border-zinc-800'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {dragOver && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <UploadIcon className="w-4 h-4" /> Drop to upload
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700 flex-wrap">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1 text-xs font-mono text-gray-500 dark:text-zinc-400 flex-1 min-w-0 overflow-hidden">
                  <button onClick={() => { setPrefix(''); loadObjects('') }} className="hover:text-blue-500 shrink-0">{config.bucket}</button>
                  {breadParts.map((part, i) => {
                    const partPrefix = breadParts.slice(0, i + 1).join('/') + '/'
                    return (
                      <React.Fragment key={i}>
                        <ChevronRightIcon className="w-3 h-3 shrink-0 text-gray-300 dark:text-zinc-600" />
                        <button onClick={() => { setPrefix(partPrefix); loadObjects(partPrefix) }} className="hover:text-blue-500 truncate">{part}</button>
                      </React.Fragment>
                    )
                  })}
                </div>

                {/* Search */}
                <div className="relative">
                  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter..."
                    className="pl-6 pr-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>

                {/* Actions */}
                <button
                  onClick={() => setCreatingFolder(v => !v)}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-amber-500"
                  title="New folder"
                >
                  <FolderPlusIcon className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => loadObjects(prefix)} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400">
                  <RefreshCwIcon className="w-3.5 h-3.5" />
                </button>
                <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded cursor-pointer">
                  {uploading ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <UploadIcon className="w-3.5 h-3.5" />}
                  Upload
                  <input type="file" multiple className="hidden" onChange={async e => {
                    const files = Array.from(e.target.files || [])
                    for (const f of files) await handleUpload(f)
                    e.currentTarget.value = ''
                  }} />
                </label>
              </div>

              {/* Create folder inline */}
              {creatingFolder && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-500/5 border-b border-amber-100 dark:border-amber-800/20">
                  <FolderIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') } }}
                    placeholder="Folder name..."
                    className="flex-1 text-xs bg-transparent border-0 focus:outline-none text-gray-700 dark:text-zinc-300"
                  />
                  <button onClick={handleCreateFolder} className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded">Create</button>
                  <button onClick={() => { setCreatingFolder(false); setNewFolderName('') }} className="p-1 text-gray-400 hover:text-gray-600"><XIcon className="w-3.5 h-3.5" /></button>
                </div>
              )}

              {/* File List */}
              {studioLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2Icon className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              ) : folders.length === 0 && files.length === 0 ? (
                <div className="py-10 text-center">
                  <FolderIcon className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-zinc-500">{search ? 'No matches' : 'This folder is empty'}</p>
                  {!search && <p className="text-xs text-gray-300 dark:text-zinc-600 mt-1">Drag & drop files here to upload</p>}
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-zinc-800/50 max-h-[400px] overflow-y-auto">
                  {folders.map(obj => {
                    const folderName = obj.key.slice(prefix.length).replace(/\/$/, '').split('/')[0]
                    if (!folderName) return null
                    return (
                      <button
                        key={obj.key}
                        onClick={() => navigateToFolder(prefix + folderName)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors text-left"
                      >
                        <FolderIcon className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-zinc-300 flex-1 truncate">{folderName}/</span>
                      </button>
                    )
                  })}
                  {files.map(obj => {
                    const fileName = obj.key.slice(prefix.length)
                    if (!fileName) return null
                    const img = isImage(obj.key)
                    return (
                      <div key={obj.key} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800/40 group">
                        <button onClick={() => img ? handlePreview(obj.key) : handleDownload(obj.key)} className="shrink-0">
                          {getFileIcon(obj.key)}
                        </button>
                        <span
                          onClick={() => img ? handlePreview(obj.key) : undefined}
                          className={`text-sm text-gray-700 dark:text-zinc-300 flex-1 truncate ${img ? 'cursor-pointer hover:text-blue-500' : ''}`}
                          title={obj.key}
                        >
                          {fileName}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{formatBytes(obj.size)}</span>
                        <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0 hidden group-hover:inline">
                          {new Date(obj.lastModified).toLocaleDateString()}
                        </span>
                        {/* Action buttons */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button onClick={() => handleCopyUrl(obj.key)} title="Copy URL" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-blue-500">
                            {copiedKey === obj.key ? <CheckCircle2Icon className="w-3.5 h-3.5 text-green-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleDownload(obj.key)} title="Download" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-blue-500">
                            <DownloadIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(obj.key)}
                            disabled={deleting === obj.key}
                            title="Delete"
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                          >
                            {deleting === obj.key ? <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> : <Trash2Icon className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        )}

        {!studioOpen && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-dashed border-gray-200 dark:border-zinc-700">
            <HardDriveIcon className="w-5 h-5 text-gray-300 dark:text-zinc-600 shrink-0" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">Save a valid storage config above, then open Studio to browse and manage files.</p>
          </div>
        )}
      </div>
    </div>
  )
}
