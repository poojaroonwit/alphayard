'use client'

import { useState, useEffect } from 'react'
import { 
  UsersIcon,
  CalendarIcon,
  DocumentIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  PhotoIcon,
  CloudIcon,
  ArrowLeftIcon,
  PencilIcon,
  Cog6ToothIcon as SettingsIcon,
  BellIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { Table } from '../ui/Table'
import { adminService } from '../../services/adminService'

interface CircleMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'child'
  avatar?: string
  joinedAt: string
  lastActive: string
  status: 'active' | 'inactive'
}

interface CircleDetail {
  id: string
  name: string
  description: string
  memberCount: number
  createdAt: string
  lastActive: string
  status: 'active' | 'inactive' | 'suspended'
  owner: {
    id: string
    name: string
    email: string
  }
  settings: {
    privacy: 'public' | 'private' | 'Circle-only'
    notifications: boolean
    moderation: boolean
  }
  members: CircleMember[]
}

interface CircleSidebarProps {
  CircleId: string
  activeSection: string
  setActiveSection: (section: string) => void
}

function CircleSidebar({ CircleId, activeSection, setActiveSection }: CircleSidebarProps) {
  const CircleSections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: UsersIcon,
      color: 'text-blue-600'
    },
    {
      id: 'storage',
      label: 'Storage',
      icon: CloudIcon,
      color: 'text-orange-600'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: CalendarIcon,
      color: 'text-pink-600'
    },
    {
      id: 'content',
      label: 'Content',
      icon: DocumentIcon,
      color: 'text-purple-600'
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: DocumentIcon,
      color: 'text-teal-600'
    },
    {
      id: 'safety',
      label: 'Safety',
      icon: ShieldCheckIcon,
      color: 'text-red-600'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      color: 'text-gray-600'
    }
  ]

  return (
    <Card variant="frosted" className="w-64 rounded-none border-r border-gray-200/50 h-full">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Circle Management</h3>
        <p className="text-xs text-gray-500 font-mono">Circle ID: {CircleId}</p>
      </CardHeader>
      
      <CardBody className="p-4">
        <nav className="space-y-1">
          {CircleSections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200/50' 
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                  }
                  group
                `}
              >
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-white shadow-sm' 
                    : 'group-hover:bg-white'
                  }
                `}>
                  <Icon className={`h-4 w-4 ${isActive ? section.color : 'text-gray-400 group-hover:' + section.color.replace('text-', 'text-')}`} aria-hidden="true" />
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-medium text-sm transition-colors ${
                    isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {section.label}
                  </div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" aria-hidden="true"></div>
                )}
              </button>
            )
          })}
        </nav>
      </CardBody>
    </Card>
  )
}

interface CircleDetailProps {
  CircleId?: string
  onBackToFamilies?: () => void
}

export function CircleDetail({ CircleId, onBackToFamilies }: CircleDetailProps) {
  const [Circle, setCircle] = useState<CircleDetail | null>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (CircleId) {
      loadCircleData()
    }
  }, [CircleId])

  const loadCircleData = async () => {
    if (!CircleId) {
      setError('No Circle ID provided')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Load Circle data and members
      const [CircleData, membersData] = await Promise.all([
        adminService.getCircle(CircleId),
        adminService.getCircleMembers(CircleId)
      ])

      // Transform API data to match CircleDetail interface
      const transformedCircle: CircleDetail = {
        id: CircleData.id,
        name: CircleData.name,
        description: CircleData.description || '',
        memberCount: CircleData.memberCount || membersData.length,
        createdAt: CircleData.createdAt,
        lastActive: CircleData.updatedAt || CircleData.createdAt,
        status: CircleData.status === 'inactive' ? 'inactive' : 'active',
        owner: CircleData.owner ? {
          id: CircleData.owner.id,
          name: `${CircleData.owner.firstName} ${CircleData.owner.lastName}`,
          email: CircleData.owner.email
        } : {
          id: CircleData.ownerId,
          name: 'Unknown',
          email: ''
        },
        settings: {
          privacy: 'Circle-only', // Default, could be enhanced
          notifications: true,
          moderation: true
        },
        members: membersData.map(member => ({
          id: member.userId,
          name: member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Unknown',
          email: member.user?.email || '',
          role: member.role,
          avatar: member.user?.avatarUrl,
          joinedAt: member.joinedAt,
          lastActive: (member.user as any)?.createdAt || member.joinedAt, // Approximate
          status: 'active' // Could be enhanced with actual status
        }))
      }

      setCircle(transformedCircle)
    } catch (error: any) {
      console.error('Error loading Circle data:', error)
      setError(error?.message || 'Failed to load Circle data')
    } finally {
      setLoading(false)
    }
  }

  const renderSectionContent = () => {
    if (!Circle) return null

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="default" hoverable>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Members</p>
                      <p className="text-3xl font-bold text-gray-900">{Circle.memberCount}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <UsersIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card variant="default" hoverable>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Members</p>
                      <p className="text-3xl font-bold text-green-600">
                        {Circle.members.filter(m => m.status === 'active').length}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                      <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card variant="default" hoverable>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Circle Status</p>
                      <p className="text-3xl font-bold text-blue-600 capitalize">{Circle.status}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                      <ShieldCheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Circle Members</h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Circle.members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-xs">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-sm text-gray-900">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={member.role === 'owner' ? 'info' : member.role === 'admin' ? 'success' : 'default'} size="sm">
                              {member.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={member.status === 'active' ? 'success' : 'warning'} size="sm">
                              {member.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {new Date(member.lastActive).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Button variant="ghost" size="sm" aria-label="Edit member">
                              <PencilIcon className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        )

      case 'storage':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Circle Storage</h3>
                <p className="text-sm text-gray-500">Storage management for {Circle.name}</p>
              </CardHeader>
              <CardBody>
                <div className="mt-4">
                  <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">4.5 GB of 10 GB used</p>
                </div>
              </CardBody>
            </Card>
          </div>
        )

      case 'calendar':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Circle Calendar</h3>
                <p className="text-sm text-gray-500">Event calendar for {Circle.name}</p>
              </CardHeader>
            </Card>
          </div>
        )

      case 'content':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Circle Content</h3>
                <p className="text-sm text-gray-500">Content management for {Circle.name}</p>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card variant="default" hoverable>
                    <CardBody>
                      <h4 className="font-medium text-gray-900 mb-2">Marketing Content</h4>
                      <p className="text-sm text-gray-600">Manage marketing materials and campaigns</p>
                    </CardBody>
                  </Card>
                  <Card variant="default" hoverable>
                    <CardBody>
                      <h4 className="font-medium text-gray-900 mb-2">News & Updates</h4>
                      <p className="text-sm text-gray-600">Circle news and announcements</p>
                    </CardBody>
                  </Card>
                  <Card variant="default" hoverable>
                    <CardBody>
                      <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                      <p className="text-sm text-gray-600">Circle documents and files</p>
                    </CardBody>
                  </Card>
                  <Card variant="default" hoverable>
                    <CardBody>
                      <h4 className="font-medium text-gray-900 mb-2">Media Library</h4>
                      <p className="text-sm text-gray-600">Photos, videos, and other media</p>
                    </CardBody>
                  </Card>
                </div>
              </CardBody>
            </Card>
          </div>
        )

      case 'notes':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Circle Notes</h3>
                <p className="text-sm text-gray-500">Notes and documentation for {Circle.name}</p>
              </CardHeader>
            </Card>
          </div>
        )

      case 'safety':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Circle Safety</h3>
                <p className="text-sm text-gray-500">Safety settings and emergency contacts for {Circle.name}</p>
              </CardHeader>
            </Card>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Circle Settings</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200/50">
                    <div>
                      <div className="font-medium text-gray-900">Privacy</div>
                      <div className="text-sm text-gray-500">Current: {Circle.settings.privacy}</div>
                    </div>
                    <div className="flex items-center">
                      {Circle.settings.privacy === 'public' ? <GlobeAltIcon className="h-5 w-5 text-green-500" aria-hidden="true" /> : 
                       Circle.settings.privacy === 'private' ? <LockClosedIcon className="h-5 w-5 text-yellow-500" aria-hidden="true" /> :
                       <UsersIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200/50">
                    <div>
                      <div className="font-medium text-gray-900">Notifications</div>
                      <div className="text-sm text-gray-500">Email notifications</div>
                    </div>
                    <div className="flex items-center">
                      {Circle.settings.notifications ? <BellIcon className="h-5 w-5 text-green-500" aria-hidden="true" /> : 
                       <BellIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900">Content Moderation</div>
                      <div className="text-sm text-gray-500">Automatic content filtering</div>
                    </div>
                    <div className="flex items-center">
                      {Circle.settings.moderation ? <ShieldCheckIcon className="h-5 w-5 text-green-500" aria-hidden="true" /> : 
                       <ShieldCheckIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )

      default:
        return <div>Section not found</div>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="h-12 w-12 text-red-400 mx-auto mb-4" aria-hidden="true" />
        <p className="text-red-600 font-semibold mb-2">Error loading Circle</p>
        <p className="text-gray-500">{error}</p>
        <Button 
          variant="primary"
          onClick={loadCircleData}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!Circle) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
        <p className="text-gray-500">Circle not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Circle Sidebar */}
      <CircleSidebar 
        CircleId={Circle.id}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      
      {/* Main Content */}
      <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-y-auto">
        <Card variant="frosted" className="mb-6">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{Circle.name}</h2>
                <p className="text-sm text-gray-500">{Circle.description}</p>
              </div>
              <Button 
                variant="secondary"
                onClick={onBackToFamilies}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Back to Families
              </Button>
            </div>
          </CardBody>
        </Card>

        {renderSectionContent()}
      </div>
    </div>
  )
}

