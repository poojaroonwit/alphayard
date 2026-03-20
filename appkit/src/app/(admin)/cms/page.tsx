'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import {
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  MoreVerticalIcon,
  Trash2Icon,
  PencilIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Loader2Icon,
  EyeIcon,
  EyeOffIcon,
  ChevronDownIcon,
  CalendarIcon,
} from 'lucide-react'
import { cmsService } from '@/services/cmsService'

interface ContentPage {
  id: string
  title: string
  slug: string
  type: 'marketing' | 'news' | 'inspiration' | 'popup'
  status: 'draft' | 'published' | 'archived'
  updatedAt?: string
  createdAt?: string
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived'

const STATUS_CONFIG: Record<ContentPage['status'], { label: string; className: string }> = {
  published: { label: 'Published', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  draft:     { label: 'Draft',     className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  archived:  { label: 'Archived',  className: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
}

const TYPE_CONFIG: Record<ContentPage['type'], { label: string; className: string }> = {
  marketing:   { label: 'Marketing',   className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  news:        { label: 'News',        className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20' },
  inspiration: { label: 'Inspiration', className: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20' },
  popup:       { label: 'Popup',       className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' },
}

const TYPE_GRADIENTS: Record<ContentPage['type'], string> = {
  marketing:   'from-blue-500 to-indigo-600',
  news:        'from-violet-500 to-purple-600',
  inspiration: 'from-pink-500 to-rose-600',
  popup:       'from-orange-500 to-amber-600',
}

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'All Statuses' },
  { value: 'draft',     label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived',  label: 'Archived' },
]

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CMSPage() {
  const [pages, setPages] = useState<ContentPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Status filter dropdown
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // 3-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Create modal
  const [createModal, setCreateModal] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createSlug, setCreateSlug] = useState('')
  const [createType, setCreateType] = useState<ContentPage['type']>('marketing')
  const [creating, setCreating] = useState(false)

  // Edit modal
  const [editModal, setEditModal] = useState<ContentPage | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editType, setEditType] = useState<ContentPage['type']>('marketing')
  const [editStatus, setEditStatus] = useState<ContentPage['status']>('draft')
  const [saving, setSaving] = useState(false)

  // Delete modal
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadPages = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await cmsService.getContentPages()
      setPages(data)
    } catch {
      setPages([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadPages() }, [loadPages])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false)
      }
      if (openMenuId) {
        const ref = menuRefs.current[openMenuId]
        if (ref && !ref.contains(e.target as Node)) setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const selectedStatusLabel = STATUS_FILTER_OPTIONS.find(o => o.value === statusFilter)?.label ?? 'All Statuses'

  const filtered = pages.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async () => {
    if (!createTitle.trim()) return
    setCreating(true)
    try {
      await cmsService.createContentPage({
        title: createTitle.trim(),
        slug: createSlug.trim() || slugify(createTitle.trim()),
        type: createType,
        status: 'draft',
        components: [],
      })
      setCreateModal(false)
      setCreateTitle('')
      setCreateSlug('')
      setCreateType('marketing')
      await loadPages()
    } catch {
      alert('Failed to create page.')
    } finally {
      setCreating(false)
    }
  }

  const openEdit = (page: ContentPage) => {
    setEditModal(page)
    setEditTitle(page.title)
    setEditSlug(page.slug)
    setEditType(page.type)
    setEditStatus(page.status)
  }

  const handleEdit = async () => {
    if (!editModal) return
    setSaving(true)
    try {
      await cmsService.updateContentPage(editModal.id, {
        title: editTitle.trim(),
        slug: editSlug.trim(),
        type: editType,
        status: editStatus,
      })
      setEditModal(null)
      await loadPages()
    } catch {
      alert('Failed to save page.')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (page: ContentPage) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published'
    try {
      await cmsService.updateContentPage(page.id, { status: newStatus })
      await loadPages()
    } catch {
      alert('Failed to update status.')
    }
  }

  const handleDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await cmsService.deleteContentPage(deleteModal.id)
      setDeleteModal(null)
      await loadPages()
    } catch {
      alert('Failed to delete page.')
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500 dark:text-zinc-400">{filtered.length} of {pages.length} pages</p>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Filter Dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setStatusDropdownOpen(v => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors shadow-sm"
            >
              <FileTextIcon className="w-3.5 h-3.5 text-gray-400" />
              {selectedStatusLabel}
              <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {statusDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-40 py-1 overflow-hidden">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                  Filter by Status
                </div>
                {STATUS_FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setStatusDropdownOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      statusFilter === opt.value
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {statusFilter === opt.value && <CheckCircle2Icon className="w-3.5 h-3.5 ml-auto text-blue-500" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25 border-0"
            onClick={() => setCreateModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Page
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(page => {
          const statusCfg = STATUS_CONFIG[page.status]
          const typeCfg = TYPE_CONFIG[page.type]
          const gradient = TYPE_GRADIENTS[page.type]
          const isMenuOpen = openMenuId === page.id

          return (
            <div
              key={page.id}
              className="group relative rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-blue-200 dark:hover:border-blue-500/30"
            >
              {/* Icon + Title */}
              <div className="flex items-start space-x-3 mb-3 pr-8">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0`}>
                  {page.title.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {page.title}
                  </h3>
                  <p className="text-xs font-mono text-gray-400 dark:text-zinc-500 mt-0.5 truncate">/{page.slug}</p>
                </div>
              </div>

              {/* 3-dot menu */}
              <div
                className="absolute top-4 right-4"
                ref={el => { menuRefs.current[page.id] = el }}
              >
                <button
                  onClick={e => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : page.id) }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <MoreVerticalIcon className="w-4 h-4" />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl z-30 py-1 overflow-hidden">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(null); openEdit(page) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 text-gray-400" />
                      Edit
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(null); handleTogglePublish(page) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {page.status === 'published'
                        ? <EyeOffIcon className="w-4 h-4 text-gray-400" />
                        : <EyeIcon className="w-4 h-4 text-gray-400" />
                      }
                      {page.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />
                    <button
                      onClick={e => { e.stopPropagation(); setOpenMenuId(null); setDeleteModal({ id: page.id, title: page.title }) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2Icon className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center flex-wrap gap-1.5 mb-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${typeCfg.className}`}>
                  {typeCfg.label}
                </span>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-zinc-500">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(page.updatedAt)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <FileTextIcon className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No pages found</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Create your first content page.'}
          </p>
        </div>
      )}

      {/* ── Create Modal ── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <FileTextIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New Page</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Create a draft content page</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={e => { setCreateTitle(e.target.value); setCreateSlug(slugify(e.target.value)) }}
                  placeholder="Page title"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Slug</label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={e => setCreateSlug(e.target.value)}
                  placeholder="page-slug"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Type</label>
                <select
                  value={createType}
                  onChange={e => setCreateType(e.target.value as ContentPage['type'])}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="marketing">Marketing</option>
                  <option value="news">News</option>
                  <option value="inspiration">Inspiration</option>
                  <option value="popup">Popup</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => { setCreateModal(false); setCreateTitle(''); setCreateSlug(''); setCreateType('marketing') }}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createTitle.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                {creating ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <PencilIcon className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Page</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 font-mono">/{editModal.slug}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Slug</label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={e => setEditSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Type</label>
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value as ContentPage['type'])}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="marketing">Marketing</option>
                    <option value="news">News</option>
                    <option value="inspiration">Inspiration</option>
                    <option value="popup">Popup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as ContentPage['status'])}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setEditModal(null)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={saving || !editTitle.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                {saving ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <CheckCircle2Icon className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangleIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Delete Page</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-zinc-300">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{deleteModal.title}</span>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {deleting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Trash2Icon className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
