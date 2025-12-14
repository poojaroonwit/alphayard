'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  BellIcon,
  ShareIcon,
  DocumentTextIcon,
  TagIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { ContentPage } from '../../types/content'

// Content Schedule Interface
export interface ContentSchedule {
  id: string
  contentId: string
  content: ContentPage
  scheduledAt: string
  publishedAt?: string
  status: 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
  retryCount: number
  maxRetries: number
  errorMessage?: string
  metadata?: {
    platforms?: string[]
    channels?: string[]
    targetAudience?: string[]
    tags?: string[]
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    autoPromote?: boolean
    socialMedia?: {
      twitter?: boolean
      facebook?: boolean
      linkedin?: boolean
      instagram?: boolean
    }
  }
}

// Workflow Step Interface
export interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'approval' | 'review' | 'edit' | 'publish' | 'notification'
  assignedTo?: string
  assignedToName?: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'skipped'
  dueDate?: string
  completedAt?: string
  completedBy?: string
  completedByName?: string
  comments?: string
  metadata?: Record<string, any>
}

// Content Workflow Interface
export interface ContentWorkflow {
  id: string
  contentId: string
  name: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  steps: WorkflowStep[]
  currentStepIndex: number
  createdBy: string
  createdByName?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  metadata?: Record<string, any>
}

// Content Scheduling Component
interface ContentSchedulingProps {
  contentId: string
  content: ContentPage
  onSchedule: (schedule: ContentSchedule) => void
  onUnschedule: (scheduleId: string) => void
  onUpdateSchedule: (scheduleId: string, updates: Partial<ContentSchedule>) => void
  onStartWorkflow: (workflow: ContentWorkflow) => void
  onUpdateWorkflow: (workflowId: string, updates: Partial<ContentWorkflow>) => void
  className?: string
}

export const ContentScheduling: React.FC<ContentSchedulingProps> = ({
  contentId,
  content,
  onSchedule,
  onUnschedule,
  onUpdateSchedule,
  onStartWorkflow,
  onUpdateWorkflow,
  className = ''
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'schedule' | 'workflow' | 'calendar'>('schedule')
  const [schedules, setSchedules] = useState<ContentSchedule[]>([])
  const [workflows, setWorkflows] = useState<ContentWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date())
  const [scheduleTime, setScheduleTime] = useState<string>('09:00')
  const [schedulePlatforms, setSchedulePlatforms] = useState<string[]>(['web'])
  const [schedulePriority, setSchedulePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [scheduleAutoPromote, setScheduleAutoPromote] = useState(false)
  const [scheduleSocialMedia, setScheduleSocialMedia] = useState({
    twitter: false,
    facebook: false,
    linkedin: false,
    instagram: false
  })
  
  // Workflow modal state
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [selectedWorkflowTemplate, setSelectedWorkflowTemplate] = useState<string>('')

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual API calls
      const mockSchedules: ContentSchedule[] = [
        {
          id: 's1',
          contentId,
          content,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'scheduled',
          createdBy: 'user1',
          createdByName: 'John Doe',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          retryCount: 0,
          maxRetries: 3,
          metadata: {
            platforms: ['web', 'mobile'],
            priority: 'high',
            autoPromote: true,
            socialMedia: {
              twitter: true,
              facebook: false,
              linkedin: true,
              instagram: false
            }
          }
        }
      ]
      
      const mockWorkflows: ContentWorkflow[] = [
        {
          id: 'w1',
          contentId,
          name: 'Standard Publishing Workflow',
          description: 'Standard workflow for content publishing',
          status: 'active',
          currentStepIndex: 1,
          createdBy: 'user1',
          createdByName: 'John Doe',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          steps: [
            {
              id: 'step1',
              name: 'Content Review',
              description: 'Review content for accuracy and quality',
              type: 'review',
              assignedTo: 'user2',
              assignedToName: 'Jane Smith',
              status: 'completed',
              completedAt: new Date(Date.now() - 3600000).toISOString(),
              completedBy: 'user2',
              completedByName: 'Jane Smith',
              comments: 'Content looks good, ready for approval'
            },
            {
              id: 'step2',
              name: 'Editorial Approval',
              description: 'Final editorial approval',
              type: 'approval',
              assignedTo: 'user3',
              assignedToName: 'Mike Johnson',
              status: 'in_progress',
              dueDate: new Date(Date.now() + 86400000).toISOString()
            },
            {
              id: 'step3',
              name: 'Publish',
              description: 'Publish content to all platforms',
              type: 'publish',
              status: 'pending'
            }
          ]
        }
      ]
      
      setSchedules(mockSchedules)
      setWorkflows(mockWorkflows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduling data')
    } finally {
      setLoading(false)
    }
  }, [contentId, content])

  // Create schedule
  const handleCreateSchedule = useCallback(async () => {
    try {
      const scheduledAt = new Date(`${scheduleDate.toISOString().split('T')[0]}T${scheduleTime}:00`)
      
      const schedule: ContentSchedule = {
        id: `schedule_${Date.now()}`,
        contentId,
        content,
        scheduledAt: scheduledAt.toISOString(),
        status: 'scheduled',
        createdBy: 'current_user', // TODO: Get from auth context
        createdByName: 'Current User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
        metadata: {
          platforms: schedulePlatforms,
          priority: schedulePriority,
          autoPromote: scheduleAutoPromote,
          socialMedia: scheduleSocialMedia
        }
      }
      
      await onSchedule(schedule)
      setShowScheduleModal(false)
      loadData()
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }, [
    scheduleDate,
    scheduleTime,
    schedulePlatforms,
    schedulePriority,
    scheduleAutoPromote,
    scheduleSocialMedia,
    contentId,
    content,
    onSchedule,
    loadData
  ])

  // Create workflow
  const handleCreateWorkflow = useCallback(async () => {
    try {
      const workflow: ContentWorkflow = {
        id: `workflow_${Date.now()}`,
        contentId,
        name: workflowName,
        description: workflowDescription,
        status: 'draft',
        steps: workflowSteps,
        currentStepIndex: 0,
        createdBy: 'current_user', // TODO: Get from auth context
        createdByName: 'Current User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await onStartWorkflow(workflow)
      setShowWorkflowModal(false)
      setWorkflowName('')
      setWorkflowDescription('')
      setWorkflowSteps([])
      loadData()
    } catch (error) {
      console.error('Failed to create workflow:', error)
    }
  }, [
    workflowName,
    workflowDescription,
    workflowSteps,
    contentId,
    onStartWorkflow,
    loadData
  ])

  // Workflow templates
  const workflowTemplates = [
    {
      id: 'standard',
      name: 'Standard Publishing',
      description: 'Basic review and approval workflow',
      steps: [
        {
          id: 'review',
          name: 'Content Review',
          description: 'Review content for accuracy and quality',
          type: 'review' as const,
          status: 'pending' as const
        },
        {
          id: 'approval',
          name: 'Editorial Approval',
          description: 'Final editorial approval',
          type: 'approval' as const,
          status: 'pending' as const
        },
        {
          id: 'publish',
          name: 'Publish',
          description: 'Publish content to all platforms',
          type: 'publish' as const,
          status: 'pending' as const
        }
      ]
    },
    {
      id: 'social',
      name: 'Social Media Workflow',
      description: 'Workflow for social media content',
      steps: [
        {
          id: 'review',
          name: 'Content Review',
          description: 'Review content for brand compliance',
          type: 'review' as const,
          status: 'pending' as const
        },
        {
          id: 'social_approval',
          name: 'Social Media Approval',
          description: 'Approval from social media team',
          type: 'approval' as const,
          status: 'pending' as const
        },
        {
          id: 'schedule',
          name: 'Schedule Posts',
          description: 'Schedule posts across platforms',
          type: 'publish' as const,
          status: 'pending' as const
        }
      ]
    },
    {
      id: 'urgent',
      name: 'Urgent Publishing',
      description: 'Fast-track workflow for urgent content',
      steps: [
        {
          id: 'quick_review',
          name: 'Quick Review',
          description: 'Rapid content review',
          type: 'review' as const,
          status: 'pending' as const
        },
        {
          id: 'publish',
          name: 'Publish Immediately',
          description: 'Publish content immediately',
          type: 'publish' as const,
          status: 'pending' as const
        }
      ]
    }
  ]

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className={`content-scheduling ${className}`}>
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading scheduling data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`content-scheduling ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load scheduling data</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="content-button content-button-primary"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`content-scheduling ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Content Scheduling & Workflow</h3>
          <p className="text-sm text-gray-500">
            Manage content publishing schedules and approval workflows
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="content-button content-button-primary"
            aria-label="Schedule content"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule
          </button>
          <button
            onClick={() => setShowWorkflowModal(true)}
            className="content-button content-button-secondary"
            aria-label="Start workflow"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Workflow
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'schedule', label: 'Schedules', icon: CalendarIcon },
            { id: 'workflow', label: 'Workflows', icon: ArrowPathIcon },
            { id: 'calendar', label: 'Calendar', icon: ClockIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <ScheduleTab
          schedules={schedules}
          onUnschedule={onUnschedule}
          onUpdateSchedule={onUpdateSchedule}
        />
      )}

      {activeTab === 'workflow' && (
        <WorkflowTab
          workflows={workflows}
          onUpdateWorkflow={onUpdateWorkflow}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarTab
          schedules={schedules}
          workflows={workflows}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Schedule Content</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate.toISOString().split('T')[0]}
                    onChange={(e) => setScheduleDate(new Date(e.target.value))}
                    className="content-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="content-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platforms
                </label>
                <div className="flex space-x-4">
                  {[
                    { key: 'web', label: 'Web', icon: ComputerDesktopIcon },
                    { key: 'mobile', label: 'Mobile', icon: DevicePhoneMobileIcon },
                    { key: 'tablet', label: 'Tablet', icon: DeviceTabletIcon }
                  ].map((platform) => (
                    <label key={platform.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={schedulePlatforms.includes(platform.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSchedulePlatforms(prev => [...prev, platform.key])
                          } else {
                            setSchedulePlatforms(prev => prev.filter(p => p !== platform.key))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <platform.icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{platform.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={schedulePriority}
                  onChange={(e) => setSchedulePriority(e.target.value as any)}
                  className="content-input w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(scheduleSocialMedia).map(([platform, enabled]) => (
                    <label key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setScheduleSocialMedia(prev => ({
                          ...prev,
                          [platform]: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={scheduleAutoPromote}
                    onChange={(e) => setScheduleAutoPromote(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-promote on social media</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSchedule}
                className="content-button content-button-primary"
              >
                Schedule Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Modal */}
      {showWorkflowModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <ArrowPathIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Start Workflow</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Template
                </label>
                <select
                  value={selectedWorkflowTemplate}
                  onChange={(e) => {
                    setSelectedWorkflowTemplate(e.target.value)
                    const template = workflowTemplates.find(t => t.id === e.target.value)
                    if (template) {
                      setWorkflowName(template.name)
                      setWorkflowDescription(template.description)
                      setWorkflowSteps(template.steps.map(step => ({
                        ...step,
                        id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                      })))
                    }
                  }}
                  className="content-input w-full"
                >
                  <option value="">Select a template</option>
                  {workflowTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="content-input w-full"
                  placeholder="Enter workflow name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="content-input w-full"
                  rows={3}
                  placeholder="Enter workflow description"
                />
              </div>

              {workflowSteps.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Steps
                  </label>
                  <div className="space-y-2">
                    {workflowSteps.map((step, index) => (
                      <div key={step.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                        <span className="text-sm text-gray-900">{step.name}</span>
                        <span className="text-xs text-gray-500">({step.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                className="content-button content-button-primary"
              >
                Start Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Schedule Tab Component
interface ScheduleTabProps {
  schedules: ContentSchedule[]
  onUnschedule: (scheduleId: string) => void
  onUpdateSchedule: (scheduleId: string, updates: Partial<ContentSchedule>) => void
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({
  schedules,
  onUnschedule,
  onUpdateSchedule
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return ClockIcon
      case 'publishing': return ArrowPathIcon
      case 'published': return CheckCircleIcon
      case 'failed': return XCircleIcon
      case 'cancelled': return StopIcon
      default: return ClockIcon
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100'
      case 'publishing': return 'text-yellow-600 bg-yellow-100'
      case 'published': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-4">
      {schedules.length === 0 ? (
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
          <p className="text-gray-500">Schedule this content to publish it at a specific time</p>
        </div>
      ) : (
        schedules.map((schedule) => {
          const StatusIcon = getStatusIcon(schedule.status)
          return (
            <div key={schedule.id} className="schedule-item">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${getStatusColor(schedule.status)}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {new Date(schedule.scheduledAt).toLocaleString()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Created by {schedule.createdByName} • {schedule.metadata?.platforms?.join(', ')}
                    </div>
                    {schedule.metadata?.priority && (
                      <div className="text-xs text-gray-500 mt-1">
                        Priority: {schedule.metadata.priority}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {schedule.status === 'scheduled' && (
                    <button
                      onClick={() => onUnschedule(schedule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel schedule"
                      aria-label="Cancel schedule"
                    >
                      <XCircleIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// Workflow Tab Component
interface WorkflowTabProps {
  workflows: ContentWorkflow[]
  onUpdateWorkflow: (workflowId: string, updates: Partial<ContentWorkflow>) => void
}

const WorkflowTab: React.FC<WorkflowTabProps> = ({
  workflows,
  onUpdateWorkflow
}) => {
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon
      case 'in_progress': return ArrowPathIcon
      case 'rejected': return XCircleIcon
      case 'skipped': return StopIcon
      default: return ClockIcon
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'skipped': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-4">
      {workflows.length === 0 ? (
        <div className="text-center py-8">
          <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500">Start a workflow to manage content approval and publishing</p>
        </div>
      ) : (
        workflows.map((workflow) => (
          <div key={workflow.id} className="workflow-item">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                <p className="text-sm text-gray-500">{workflow.description}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                workflow.status === 'active' ? 'text-blue-600 bg-blue-100' :
                workflow.status === 'completed' ? 'text-green-600 bg-green-100' :
                workflow.status === 'cancelled' ? 'text-red-600 bg-red-100' :
                'text-gray-600 bg-gray-100'
              }`}>
                {workflow.status}
              </span>
            </div>
            
            <div className="space-y-2">
              {workflow.steps.map((step, index) => {
                const StepIcon = getStepStatusIcon(step.status)
                return (
                  <div key={step.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <div className={`p-1 rounded-full ${getStepStatusColor(step.status)}`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{step.name}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                      {step.assignedToName && (
                        <div className="text-xs text-gray-500">
                          Assigned to: {step.assignedToName}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Step {index + 1}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Calendar Tab Component
interface CalendarTabProps {
  schedules: ContentSchedule[]
  workflows: ContentWorkflow[]
}

const CalendarTab: React.FC<CalendarTabProps> = ({
  schedules,
  workflows
}) => {
  return (
    <div className="text-center py-8">
      <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
      <p className="text-gray-500">Calendar view coming soon</p>
    </div>
  )
}

// Scheduling Styles
export const schedulingStyles = `
.content-scheduling {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.schedule-item {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.schedule-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.workflow-item {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.workflow-item:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.content-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.content-button-primary {
  background: #3b82f6;
  color: white;
}

.content-button-primary:hover {
  background: #2563eb;
}

.content-button-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.content-button-secondary:hover {
  background: #e5e7eb;
}

.content-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.content-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`
