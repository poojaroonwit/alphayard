'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CogIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhotoIcon,
  CloudIcon
} from '@heroicons/react/24/outline'
import { DashboardStudio } from './DashboardStudio'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { EmptyState } from '../ui/EmptyState'
import { Modal } from '../ui/Modal'

interface Dashboard {
  id: string
  name: string
  description: string
  isDefault: boolean
  widgets: DashboardWidget[]
  createdAt: string
  updatedAt: string
}

interface DashboardWidget {
  id: string
  type: string
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
}

interface DashboardManagementProps {
  onBack: () => void
}

export const DashboardManagement: React.FC<DashboardManagementProps> = ({ onBack }) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    loadDashboards()
  }, [])

  const loadDashboards = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockDashboards = [
        {
          id: '1',
          name: 'Main Dashboard',
          description: 'Primary dashboard for Circle management',
          isDefault: true,
          widgets: [
            { id: 'w1', type: 'stats', title: 'Circle Stats', position: { x: 0, y: 0, w: 6, h: 4 }, config: {} },
            { id: 'w2', type: 'chart', title: 'Activity Chart', position: { x: 6, y: 0, w: 6, h: 4 }, config: {} }
          ],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Analytics Dashboard',
          description: 'Detailed analytics and reporting',
          isDefault: false,
          widgets: [
            { id: 'w3', type: 'chart', title: 'User Engagement', position: { x: 0, y: 0, w: 12, h: 6 }, config: {} },
            { id: 'w4', type: 'table', title: 'Recent Activity', position: { x: 0, y: 6, w: 12, h: 4 }, config: {} }
          ],
          createdAt: '2024-01-10',
          updatedAt: '2024-01-12'
        },
        {
          id: '3',
          name: 'Content Management',
          description: 'Manage Circle content and media',
          isDefault: false,
          widgets: [
            { id: 'w5', type: 'table', title: 'Content Library', position: { x: 0, y: 0, w: 8, h: 5 }, config: {} },
            { id: 'w6', type: 'stats', title: 'Storage Usage', position: { x: 8, y: 0, w: 4, h: 5 }, config: {} }
          ],
          createdAt: '2024-01-05',
          updatedAt: '2024-01-08'
        },
        {
          id: '4',
          name: 'User Activity',
          description: 'Monitor user engagement and activity',
          isDefault: false,
          widgets: [
            { id: 'w7', type: 'chart', title: 'Daily Active Users', position: { x: 0, y: 0, w: 6, h: 4 }, config: {} },
            { id: 'w8', type: 'stats', title: 'Session Metrics', position: { x: 6, y: 0, w: 6, h: 4 }, config: {} },
            { id: 'w9', type: 'table', title: 'Recent Logins', position: { x: 0, y: 4, w: 12, h: 4 }, config: {} }
          ],
          createdAt: '2024-01-03',
          updatedAt: '2024-01-06'
        }
      ]
      
      setDashboards(mockDashboards)
      if (mockDashboards.length > 0) {
        setSelectedDashboard(mockDashboards[0])
      }
    } catch (error) {
      console.error('Error loading dashboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dashboard.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDashboardSelect = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard)
    setEditMode(false)
  }

  const handleCreateDashboard = () => {
    setEditingDashboard(null)
    setShowCreateForm(true)
  }

  const handleEditDashboard = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard)
    setShowCreateForm(true)
  }

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      try {
        setDashboards(prev => prev.filter(d => d.id !== dashboardId))
        if (selectedDashboard?.id === dashboardId) {
          const remaining = dashboards.filter(d => d.id !== dashboardId)
          setSelectedDashboard(remaining.length > 0 ? remaining[0] : null)
        }
      } catch (error) {
        console.error('Error deleting dashboard:', error)
        alert('Error deleting dashboard')
      }
    }
  }

  const handleSaveDashboard = (dashboardData: Partial<Dashboard>) => {
    if (editingDashboard) {
      // Update existing dashboard
      const updatedDashboard = { ...editingDashboard, ...dashboardData, updatedAt: new Date().toISOString() }
      setDashboards(prev => prev.map(d => 
        d.id === editingDashboard.id ? updatedDashboard : d
      ))
      if (selectedDashboard?.id === editingDashboard.id) {
        setSelectedDashboard(updatedDashboard)
      }
    } else {
      // Create new dashboard
      const newDashboard: Dashboard = {
        id: Date.now().toString(),
        name: dashboardData.name || 'New Dashboard',
        description: dashboardData.description || '',
        isDefault: false,
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setDashboards(prev => [newDashboard, ...prev])
      setSelectedDashboard(newDashboard)
    }
    setShowCreateForm(false)
    setEditingDashboard(null)
  }

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'chart': return <ChartBarIcon className="h-4 w-4" />
      case 'table': return <TableCellsIcon className="h-4 w-4" />
      case 'calendar': return <CalendarIcon className="h-4 w-4" />
      case 'stats': return <Squares2X2Icon className="h-4 w-4" />
      case 'gallery': return <PhotoIcon className="h-4 w-4" />
      case 'text': return <DocumentTextIcon className="h-4 w-4" />
      case 'storage': return <CloudIcon className="h-4 w-4" />
      default: return <CogIcon className="h-4 w-4" />
    }
  }

  if (showCreateForm) {
    return (
      <DashboardForm
        dashboard={editingDashboard}
        onSave={handleSaveDashboard}
        onCancel={() => {
          setShowCreateForm(false)
          setEditingDashboard(null)
        }}
      />
    )
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Secondary Sidebar - Dashboard List */}
      <Card variant="frosted" className="w-80 rounded-none border-r border-gray-200/50 flex flex-col">
        {/* Header */}
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateDashboard}
            >
              <PlusIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              New
            </Button>
          </div>
          
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Dashboards</h2>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search dashboards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        {/* Dashboard List */}
        <CardBody className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-32" role="status" aria-label="Loading">
              <LoadingSpinner size="md" />
            </div>
          ) : filteredDashboards.length === 0 ? (
            <EmptyState
              icon={<ChartBarIcon className="h-12 w-12 text-gray-400" />}
              title={searchTerm ? 'No dashboards found' : 'No dashboards available'}
              description={searchTerm ? 'Try adjusting your search terms.' : 'Create your first dashboard to get started.'}
            />
          ) : (
            <div className="space-y-2">
              {filteredDashboards.map((dashboard) => (
                <Card
                  key={dashboard.id}
                  variant="default"
                  hoverable
                  onClick={() => handleDashboardSelect(dashboard)}
                  className={`cursor-pointer transition-all ${
                    selectedDashboard?.id === dashboard.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-md'
                      : ''
                  }`}
                >
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{dashboard.name}</h3>
                          {dashboard.isDefault && (
                            <Badge variant="info" size="sm">Default</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{dashboard.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{dashboard.widgets.length} widgets</span>
                          <span>Updated {new Date(dashboard.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditDashboard(dashboard)
                          }}
                          aria-label="Edit dashboard"
                        >
                          <PencilIcon className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDashboard(dashboard.id)
                          }}
                          aria-label="Delete dashboard"
                          disabled={dashboard.isDefault}
                        >
                          <TrashIcon className="h-4 w-4 text-red-600" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {selectedDashboard ? (
          <>
            {/* Dashboard Header */}
            <Card variant="frosted" className="rounded-none border-x-0 border-t-0 shadow-lg">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedDashboard.name}</h1>
                    <p className="text-sm text-gray-500">{selectedDashboard.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={editMode ? 'secondary' : 'primary'}
                      onClick={() => setEditMode(!editMode)}
                    >
                      {editMode ? (
                        <>
                          <EyeIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          View Mode
                        </>
                      ) : (
                        <>
                          <PencilIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                          Edit Mode
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Dashboard Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {editMode ? (
                <DashboardStudio 
                  dashboard={selectedDashboard}
                  onSave={(updatedDashboard) => {
                    setDashboards(prev => prev.map(d => 
                      d.id === updatedDashboard.id ? updatedDashboard : d
                    ))
                    setSelectedDashboard(updatedDashboard)
                  }}
                />
              ) : (
                <DashboardViewer dashboard={selectedDashboard} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<ChartBarIcon className="h-12 w-12 text-gray-400" />}
              title="No Dashboard Selected"
              description="Select a dashboard from the sidebar to view it"
              action={{
                label: 'Create New Dashboard',
                onClick: handleCreateDashboard
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Dashboard Viewer Component
function DashboardViewer({ dashboard }: { dashboard: Dashboard }) {
  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'chart': return <ChartBarIcon className="h-4 w-4" />
      case 'table': return <TableCellsIcon className="h-4 w-4" />
      case 'calendar': return <CalendarIcon className="h-4 w-4" />
      case 'stats': return <Squares2X2Icon className="h-4 w-4" />
      case 'gallery': return <PhotoIcon className="h-4 w-4" />
      case 'text': return <DocumentTextIcon className="h-4 w-4" />
      case 'storage': return <CloudIcon className="h-4 w-4" />
      default: return <CogIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {dashboard.widgets.map((widget) => (
        <Card
          key={widget.id}
          variant="frosted"
          hoverable
          style={{
            gridColumn: `span ${widget.position.w}`,
            gridRow: `span ${widget.position.h}`
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{widget.title}</h3>
              <div className="text-gray-400">
                {getWidgetIcon(widget.type)}
              </div>
            </div>
          </CardHeader>
          <CardBody>
          
            <div className="h-full">
              {widget.type === 'stats' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">12</div>
                    <div className="text-sm text-gray-500">Total Families</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-gray-500">Total Content</div>
                  </div>
                </div>
              )}
              
              {widget.type === 'chart' && (
                <div className="h-32 bg-gray-100/50 rounded-lg flex items-center justify-center border border-gray-200/50">
                  <span className="text-gray-500">Chart Widget</span>
                </div>
              )}
              
              {widget.type === 'table' && (
                <div className="h-32 bg-gray-100/50 rounded-lg flex items-center justify-center border border-gray-200/50">
                  <span className="text-gray-500">Table Widget</span>
                </div>
              )}

              {widget.type === 'calendar' && (
                <div className="h-32 bg-gray-100/50 rounded-lg flex items-center justify-center border border-gray-200/50">
                  <span className="text-gray-500">Calendar Widget</span>
                </div>
              )}

              {widget.type === 'gallery' && (
                <div className="h-32 bg-gray-100/50 rounded-lg flex items-center justify-center border border-gray-200/50">
                  <span className="text-gray-500">Gallery Widget</span>
                </div>
              )}

              {widget.type === 'text' && (
                <div className="h-32 bg-gray-100/50 rounded-lg flex items-center justify-center border border-gray-200/50">
                  <span className="text-gray-500">Text Widget</span>
                </div>
              )}

              {widget.type === 'storage' && (
                <div className="h-32 bg-gray-100/50 rounded-lg flex items-center justify-center border border-gray-200/50">
                  <span className="text-gray-500">Storage Widget</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

// Note: DashboardStudio component is now imported from separate file

// Dashboard Form Component
interface DashboardFormProps {
  dashboard?: Dashboard | null
  onSave: (data: Partial<Dashboard>) => void
  onCancel: () => void
}

const DashboardForm: React.FC<DashboardFormProps> = ({ dashboard, onSave, onCancel }) => {
  const [name, setName] = useState(dashboard?.name || '')
  const [description, setDescription] = useState(dashboard?.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      description: description.trim()
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card variant="frosted">
        <CardBody>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {dashboard ? 'Edit Dashboard' : 'Create New Dashboard'}
            </h2>
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card variant="frosted">
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Dashboard Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter dashboard name"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="macos-input w-full px-4 py-2.5 rounded-xl border border-gray-300/50 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                rows={3}
                placeholder="Enter dashboard description"
              />
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-gray-200/50">
              <Button type="button" variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {dashboard ? 'Update Dashboard' : 'Create Dashboard'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

