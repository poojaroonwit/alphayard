'use client'

import { useState, useEffect } from 'react'
import { 
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface Circle {
  id: string
  name: string
  description: string
  memberCount: number
}

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  location?: string
  CircleId: string
  createdBy: string
  createdAt: string
  isRecurring: boolean
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  attendees: string[]
  isAllDay: boolean
  category: 'Circle' | 'birthday' | 'holiday' | 'meeting' | 'celebration' | 'other'
  priority: 'low' | 'medium' | 'high'
}

export function Calendar() {
  const [families, setFamilies] = useState<Circle[]>([])
  const [selectedCircle, setSelectedCircle] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    isAllDay: false,
    category: 'Circle',
    priority: 'medium',
    attendees: [] as string[]
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCircle) {
      loadCircleEvents()
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

  const loadCircleEvents = async () => {
    if (!selectedCircle) return
    
    try {
      setEvents([])
    } catch (error) {
      console.error('Error loading Circle events:', error)
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory
    const matchesPriority = filterPriority === 'all' || event.priority === filterPriority
    return matchesSearch && matchesCategory && matchesPriority
  })

  const handleCreate = () => {
    setEditingEvent(null)
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      isAllDay: false,
      category: 'Circle',
      priority: 'medium',
      attendees: []
    })
    setShowForm(true)
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      location: event.location || '',
      isAllDay: event.isAllDay,
      category: event.category,
      priority: event.priority,
      attendees: event.attendees
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (editingEvent) {
      // Update existing event
      setEvents(prev => prev.map(event => 
        event.id === editingEvent.id 
          ? { ...event, ...formData as any, updatedAt: new Date().toISOString() }
          : event
      ))
    } else {
      // Create new event
      const newEvent: Event = {
        id: Date.now().toString(),
        ...(formData as any),
        CircleId: selectedCircle,
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
        isRecurring: false,
        attendees: formData.attendees
      }
      setEvents(prev => [...prev, newEvent])
    }
    setShowForm(false)
    setEditingEvent(null)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(prev => prev.filter(event => event.id !== id))
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Circle': return 'blue'
      case 'birthday': return 'pink'
      case 'holiday': return 'green'
      case 'meeting': return 'purple'
      case 'celebration': return 'yellow'
      default: return 'gray'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const getSelectedCircleName = () => {
    const Circle = families.find(f => f.id === selectedCircle)
    return Circle?.name || 'Select Circle'
  }

  const formatEventTime = (event: Event) => {
    if (event.isAllDay) return 'All Day'
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`
    }
    return event.startTime || 'No time specified'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Circle Calendar</h2>
          <p className="text-gray-600">Manage events and schedules for families</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Event
        </button>
      </div>

      {/* Circle Selection */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <label className="form-label">Select Circle:</label>
            <select
              value={selectedCircle}
              onChange={(e) => setSelectedCircle(e.target.value)}
              className="form-select w-auto"
            >
              {families.map(Circle => (
                <option key={Circle.id} value={Circle.id}>
                  {Circle.name} ({Circle.memberCount} members)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCircle && (
        <>
          {/* Calendar Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-number text-blue-600">{events.length}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-green-600">
                {events.filter(e => e.category === 'Circle').length}
              </div>
              <div className="stat-label">Circle Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-purple-600">
                {events.filter(e => e.isRecurring).length}
              </div>
              <div className="stat-label">Recurring</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-orange-600">
                {events.filter(e => e.priority === 'high').length}
              </div>
              <div className="stat-label">High Priority</div>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
                
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="form-select w-auto"
                >
                  <option value="all">All Categories</option>
                  <option value="Circle">Circle</option>
                  <option value="birthday">Birthday</option>
                  <option value="holiday">Holiday</option>
                  <option value="meeting">Meeting</option>
                  <option value="celebration">Celebration</option>
                  <option value="other">Other</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="form-select w-auto"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events List */}
          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CalendarIcon className="h-12 w-12 text-gray-400" /></div>
              <h3 className="empty-state-title">No events found</h3>
              <p className="empty-state-description">
                {searchTerm ? 'Try adjusting your search terms.' : 'Create your first event to get started.'}
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <CalendarIcon className="h-6 w-6 text-blue-500" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                                <span className={`badge badge-${getCategoryColor(event.category)}`}>
                                  {event.category}
                                </span>
                                <span className={`badge badge-${getPriorityColor(event.priority)}`}>
                                  {event.priority}
                                </span>
                                {event.isRecurring && (
                                  <span className="badge badge-info">
                                    Recurring
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {new Date(event.startDate).toLocaleDateString()} • {formatEventTime(event)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPinIcon className="h-4 w-4" />
                                {event.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <UserGroupIcon className="h-4 w-4" />
                              {event.attendees.length} attendees
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Created by {event.createdBy} • {new Date(event.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(event)}
                            className="btn btn-ghost text-blue-600 hover:text-blue-700"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="btn btn-ghost text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Event Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingEvent ? 'Edit Event' : 'Create Event'} for {getSelectedCircleName()}
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Event Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="Circle">Circle</option>
                    <option value="birthday">Birthday</option>
                    <option value="holiday">Holiday</option>
                    <option value="meeting">Meeting</option>
                    <option value="celebration">Celebration</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="form-input"
                    disabled={formData.isAllDay}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="form-input"
                    disabled={formData.isAllDay}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                    className="form-checkbox mr-2"
                  />
                  All Day Event
                </label>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

