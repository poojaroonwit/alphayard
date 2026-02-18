'use client'

import { useState, useEffect } from 'react'
import { 
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  UserIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BookmarkIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'

interface Circle {
  id: string
  name: string
  description: string
  memberCount: number
}

interface Note {
  id: string
  title: string
  content: string
  CircleId: string
  createdBy: string
  createdAt: string
  updatedAt: string
  tags: string[]
  isPinned: boolean
  isShared: boolean
  category: 'meeting' | 'recipe' | 'memory' | 'reminder' | 'important' | 'other'
  priority: 'low' | 'medium' | 'high'
  attachments: string[]
}

export function Notes() {
  const [families, setFamilies] = useState<Circle[]>([])
  const [selectedCircle, setSelectedCircle] = useState<string>('')
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    category: 'other',
    priority: 'medium',
    isPinned: false,
    isShared: false
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCircle) {
      loadCircleNotes()
    }
  }, [selectedCircle])

  const loadData = async () => {
    setLoading(true)
    try {
      setFamilies([])
      setSelectedCircle('')
    } catch (error) {
      console.error('Error loading families:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCircleNotes = async () => {
    if (!selectedCircle) return
    
    try {
      setNotes([])
    } catch (error) {
      console.error('Error loading Circle notes:', error)
    }
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = filterCategory === 'all' || note.category === filterCategory
    const matchesPriority = filterPriority === 'all' || note.priority === filterPriority
    return matchesSearch && matchesCategory && matchesPriority
  })

  const handleCreate = () => {
    setEditingNote(null)
    setFormData({
      title: '',
      content: '',
      tags: [],
      category: 'other',
      priority: 'medium',
      isPinned: false,
      isShared: false
    })
    setShowForm(true)
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags,
      category: note.category,
      priority: note.priority,
      isPinned: note.isPinned,
      isShared: note.isShared
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (editingNote) {
      // Update existing note
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id 
          ? { ...note, ...formData as any, updatedAt: new Date().toISOString() }
          : note
      ))
    } else {
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        ...(formData as any),
        CircleId: selectedCircle,
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: []
      }
      setNotes(prev => [...prev, newNote])
    }
    setShowForm(false)
    setEditingNote(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(prev => prev.filter(note => note.id !== id))
    }
  }

  const handleTogglePin = (id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() }
        : note
    ))
  }

  const handleToggleShare = (id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, isShared: !note.isShared, updatedAt: new Date().toISOString() }
        : note
    ))
  }

  const getCategoryColor = (category: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (category) {
      case 'meeting': return 'info'
      case 'recipe': return 'success'
      case 'memory': return 'info'
      case 'reminder': return 'warning'
      case 'important': return 'error'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getSelectedCircleName = () => {
    const Circle = families.find(f => f.id === selectedCircle)
    return Circle?.name || 'Select Circle'
  }

  const formatContent = (content: string) => {
    if (content.length > 150) {
      return content.substring(0, 150) + '...'
    }
    return content
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card variant="frosted">
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Circle Notes</h2>
              <p className="text-sm text-gray-500">Manage notes and documentation for families</p>
            </div>
            <Button variant="primary" onClick={handleCreate}>
              <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Add Note
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Circle Selection */}
      <Card variant="frosted">
        <CardBody>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Circle:</label>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="macos-input w-auto px-4 py-1.5 rounded-lg border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
            >
              <option value="">Select Circle</option>
              {families.map(Circle => (
                <option key={Circle.id} value={Circle.id}>
                  {Circle.name} ({Circle.memberCount} members)
                </option>
              ))}
            </select>
          </div>
        </CardBody>
      </Card>

      {selectedCircle && (
        <>
          {/* Notes Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card variant="default" hoverable>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Notes</p>
                    <p className="text-3xl font-bold text-blue-600">{notes.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card variant="default" hoverable>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pinned Notes</p>
                    <p className="text-3xl font-bold text-green-600">{notes.filter(n => n.isPinned).length}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                    <BookmarkIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card variant="default" hoverable>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shared Notes</p>
                    <p className="text-3xl font-bold text-purple-600">{notes.filter(n => n.isShared).length}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                    <ShareIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card variant="default" hoverable>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">High Priority</p>
                    <p className="text-3xl font-bold text-orange-600">{notes.filter(n => n.priority === 'high').length}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                    <TagIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Filters */}
          <Card variant="frosted">
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
                  <Input
                    type="text"
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="macos-input w-auto px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="meeting">Meeting</option>
                  <option value="recipe">Recipe</option>
                  <option value="memory">Memory</option>
                  <option value="reminder">Reminder</option>
                  <option value="important">Important</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="macos-input w-auto px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <EmptyState
              icon={<DocumentTextIcon className="h-12 w-12 text-gray-400" />}
              title="No notes found"
              description={searchTerm ? 'Try adjusting your search terms.' : 'Create your first note to get started.'}
            />
          ) : (
            <Card variant="frosted">
              <CardBody>
                <div className="space-y-4">
                  {filteredNotes.map((note) => (
                    <Card key={note.id} variant="default" hoverable className="border border-gray-200/50">
                      <CardBody>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                                  {note.isPinned && (
                                    <Badge variant="warning" size="sm">
                                      <BookmarkIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                                      Pinned
                                    </Badge>
                                  )}
                                  <Badge variant={getCategoryColor(note.category) as any} size="sm">
                                    {note.category}
                                  </Badge>
                                  <Badge variant={getPriorityColor(note.priority) as any} size="sm">
                                    {note.priority}
                                  </Badge>
                                  {note.isShared && (
                                    <Badge variant="info" size="sm">
                                      Shared
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm mb-3">{formatContent(note.content)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {note.tags.map(tag => (
                                <Badge key={tag} variant="info" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <UserIcon className="h-4 w-4" aria-hidden="true" />
                                {note.createdBy}
                              </span>
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4" aria-hidden="true" />
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </span>
                              {note.attachments.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <TagIcon className="h-4 w-4" aria-hidden="true" />
                                  {note.attachments.length} attachments
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(note)}
                              aria-label="Edit note"
                            >
                              <PencilIcon className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePin(note.id)}
                              aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                            >
                              <BookmarkIcon className={`h-4 w-4 ${note.isPinned ? 'text-yellow-600' : 'text-gray-400'}`} aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleShare(note.id)}
                              aria-label={note.isShared ? 'Unshare note' : 'Share note'}
                            >
                              <ShareIcon className={`h-4 w-4 ${note.isShared ? 'text-green-600' : 'text-gray-400'}`} aria-hidden="true" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(note.id)}
                              aria-label="Delete note"
                            >
                              <TrashIcon className="h-4 w-4 text-red-600" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Note Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={`${editingNote ? 'Edit Note' : 'Create Note'} for ${getSelectedCircleName()}`}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          <Input
            label="Note Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              rows={6}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              >
                <option value="meeting">Meeting</option>
                <option value="recipe">Recipe</option>
                <option value="memory">Memory</option>
                <option value="reminder">Reminder</option>
                <option value="important">Important</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <Input
            label="Tags (comma-separated)"
            type="text"
            value={formData.tags.join(', ')}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
            placeholder="e.g., meeting, planning, important"
          />

          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Pin Note</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isShared}
                onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Share with Circle</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200/50">
            <Button type="submit" variant="primary">
              {editingNote ? 'Update Note' : 'Create Note'}
            </Button>
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

