'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  TicketIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  PlusIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { Table } from '../ui/Table'

interface Ticket {
  id: string
  title: string
  description: string
  type: 'post_report' | 'user_complaint' | 'technical_issue' | 'feature_request' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled'
  reporter: {
    id: string
    name: string
    email: string
    circleId: string
    circleName: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  tags?: string[]
  attachments?: string[]
  comments?: TicketComment[]
}

interface TicketComment {
  id: string
  content: string
  author: {
    id: string
    name: string
    role: 'admin' | 'user' | 'system'
  }
  createdAt: string
  isInternal: boolean
}

interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  overdue: number
  avgResolutionTime: number
}

export function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
    avgResolutionTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showTicketDetail, setShowTicketDetail] = useState(false)
  const [showCreateTicket, setShowCreateTicket] = useState(false)
  const [showTicketDrawer, setShowTicketDrawer] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      setTickets([])
      setStats({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        overdue: 0,
        avgResolutionTime: 0
      })
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus
    const matchesType = filterType === 'all' || ticket.type === filterType
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority
    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'red'
      case 'in_progress': return 'blue'
      case 'resolved': return 'green'
      case 'closed': return 'gray'
      case 'cancelled': return 'gray'
      default: return 'gray'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post_report': return <FlagIcon className="h-5 w-5" />
      case 'user_complaint': return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'technical_issue': return <TicketIcon className="h-5 w-5" />
      case 'feature_request': return <ChatBubbleLeftRightIcon className="h-5 w-5" />
      default: return <TicketIcon className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading tickets">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card variant="frosted">
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Management</h2>
              <p className="text-sm text-gray-500">Manage support tickets, reports, and user complaints</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateTicket(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Create Ticket
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <TicketIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Open</p>
                <p className="text-3xl font-bold text-red-600">{stats.open}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card variant="frosted" hoverable>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resolved</p>
                <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters Section */}
      <Card variant="frosted">
        <CardHeader>
          <h3 className="text-base font-semibold text-gray-900">Filters & Search</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              title="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              title="Filter by type"
            >
              <option value="all">All Types</option>
              <option value="post_report">Post Report</option>
              <option value="user_complaint">User Complaint</option>
              <option value="technical_issue">Technical Issue</option>
              <option value="feature_request">Feature Request</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              title="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="h-12 w-12" />}
          title="No tickets found"
          description="Try adjusting your search or filter criteria"
        />
      ) : (
        <Card variant="frosted">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Tickets ({filteredTickets.length})</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-200/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reporter</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50">
                  {filteredTickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors duration-150"
                      onClick={() => {
                        setSelectedTicket(ticket)
                        setShowTicketDrawer(true)
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">#{ticket.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{ticket.title}</div>
                          <div className="text-sm text-gray-500 truncate">
                            {ticket.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-gray-400">
                            {getTypeIcon(ticket.type)}
                          </div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {ticket.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            ticket.priority === 'urgent' ? 'error' :
                            ticket.priority === 'high' ? 'warning' :
                            ticket.priority === 'medium' ? 'warning' :
                            'success'
                          }
                          size="sm"
                        >
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            ticket.status === 'open' ? 'error' :
                            ticket.status === 'in_progress' ? 'info' :
                            ticket.status === 'resolved' ? 'success' :
                            'default'
                          }
                          size="sm"
                        >
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{ticket.reporter.name}</div>
                            <div className="text-xs text-gray-500 truncate">{ticket.reporter.circleName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTicket(ticket)
                              setShowTicketDrawer(true)
                            }}
                            aria-label="View ticket details"
                          >
                            <EyeIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Edit ticket"
                          >
                            <PencilIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Delete ticket"
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Create Ticket Modal */}
      {showCreateTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Create New Ticket</h3>
                  <p className="text-sm text-gray-600">Fill out the form below to create a new support ticket</p>
                </div>
                <button
                  onClick={() => setShowCreateTicket(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <PlusIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Create Ticket Form</h4>
                <p className="text-gray-600 mb-6">Create ticket functionality coming soon...</p>
                <button
                  onClick={() => setShowCreateTicket(false)}
                  className="btn btn-secondary px-6 py-3 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Drawer */}
      {isClient && showTicketDrawer && selectedTicket && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Backdrop */}
          <div 
            className="drawer-overlay"
            onClick={() => setShowTicketDrawer(false)}
          />
          
          {/* Drawer */}
          <div className="drawer-panel">
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedTicket.title}</h3>
                    <p className="text-sm text-gray-600">Ticket #{selectedTicket.id}</p>
                  </div>
                  <button
                    onClick={() => setShowTicketDrawer(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-gray-900 leading-relaxed">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">
                        {getTypeIcon(selectedTicket.type)}
                      </div>
                      <span className="text-gray-900 font-medium capitalize">
                        {selectedTicket.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTicket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      selectedTicket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedTicket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedTicket.priority}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTicket.status === 'open' ? 'bg-red-100 text-red-800' :
                      selectedTicket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reporter</label>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{selectedTicket.reporter.name}</div>
                      <div className="text-sm text-gray-600">{selectedTicket.reporter.email}</div>
                      <div className="text-sm text-gray-500">{selectedTicket.reporter.circleName}</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <span>{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span>{new Date(selectedTicket.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="bg-white rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Comments</label>
                  <div className="space-y-3">
                    {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                      selectedTicket.comments.map((comment, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{comment.author.name}</span>
                            <span className="text-xs text-gray-500">{comment.author.role}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No comments yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between gap-3">
                  <button
                    className="btn btn-secondary px-6 py-2 rounded-lg"
                    onClick={() => setShowTicketDrawer(false)}
                  >
                    Close
                  </button>
                  <div className="flex gap-2">
                    <button className="btn btn-primary px-6 py-2 rounded-lg">
                      Edit Ticket
                    </button>
                    <button className="btn btn-outline px-6 py-2 rounded-lg">
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

