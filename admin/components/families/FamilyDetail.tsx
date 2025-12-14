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

interface FamilyMember {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'member' | 'child'
  avatar?: string
  joinedAt: string
  lastActive: string
  status: 'active' | 'inactive'
}

interface FamilyDetail {
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
    privacy: 'public' | 'private' | 'family-only'
    notifications: boolean
    moderation: boolean
  }
  members: FamilyMember[]
}

interface FamilySidebarProps {
  familyId: string
  activeSection: string
  setActiveSection: (section: string) => void
}

function FamilySidebar({ familyId, activeSection, setActiveSection }: FamilySidebarProps) {
  const familySections = [
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
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Family Management</h3>
        <p className="text-xs text-gray-500 font-mono">Family ID: {familyId}</p>
      </CardHeader>
      
      <CardBody className="p-4">
        <nav className="space-y-1">
          {familySections.map((section) => {
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

interface FamilyDetailProps {
  familyId?: string
  onBackToFamilies?: () => void
}

export function FamilyDetail({ familyId, onBackToFamilies }: FamilyDetailProps) {
  const [family, setFamily] = useState<FamilyDetail | null>(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (familyId) {
      loadFamilyData()
    }
  }, [familyId])

  const loadFamilyData = async () => {
    if (!familyId) {
      setError('No family ID provided')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Load family data and members
      const [familyData, membersData] = await Promise.all([
        adminService.getFamily(familyId),
        adminService.getFamilyMembers(familyId)
      ])

      // Transform API data to match FamilyDetail interface
      const transformedFamily: FamilyDetail = {
        id: familyData.id,
        name: familyData.name,
        description: familyData.description || '',
        memberCount: familyData.member_count || membersData.length,
        createdAt: familyData.created_at,
        lastActive: familyData.updated_at || familyData.created_at,
        status: familyData.is_active ? 'active' : 'inactive',
        owner: familyData.owner ? {
          id: familyData.owner.id,
          name: `${familyData.owner.first_name} ${familyData.owner.last_name}`,
          email: familyData.owner.email
        } : {
          id: familyData.owner_id,
          name: 'Unknown',
          email: ''
        },
        settings: {
          privacy: 'family-only', // Default, could be enhanced
          notifications: true,
          moderation: true
        },
        members: membersData.map(member => ({
          id: member.user_id,
          name: member.user ? `${member.user.first_name} ${member.user.last_name}` : 'Unknown',
          email: member.user?.email || '',
          role: member.role,
          avatar: member.user?.avatar_url,
          joinedAt: member.joined_at,
          lastActive: (member.user as any)?.created_at || member.joined_at, // Approximate
          status: 'active' // Could be enhanced with actual status
        }))
      }

      setFamily(transformedFamily)
    } catch (error: any) {
      console.error('Error loading family data:', error)
      setError(error?.message || 'Failed to load family data')
    } finally {
      setLoading(false)
    }
  }

  const renderSectionContent = () => {
    if (!family) return null

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
                      <p className="text-3xl font-bold text-gray-900">{family.memberCount}</p>
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
                        {family.members.filter(m => m.status === 'active').length}
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
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Family Status</p>
                      <p className="text-3xl font-bold text-blue-600 capitalize">{family.status}</p>
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
                <h3 className="text-lg font-semibold text-gray-900">Family Members</h3>
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
                      {family.members.map((member) => (
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
                <h3 className="text-lg font-semibold text-gray-900">Family Storage</h3>
                <p className="text-sm text-gray-500">Storage management for {family.name}</p>
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
                <h3 className="text-lg font-semibold text-gray-900">Family Calendar</h3>
                <p className="text-sm text-gray-500">Event calendar for {family.name}</p>
              </CardHeader>
            </Card>
          </div>
        )

      case 'content':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Family Content</h3>
                <p className="text-sm text-gray-500">Content management for {family.name}</p>
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
                      <p className="text-sm text-gray-600">Family news and announcements</p>
                    </CardBody>
                  </Card>
                  <Card variant="default" hoverable>
                    <CardBody>
                      <h4 className="font-medium text-gray-900 mb-2">Documents</h4>
                      <p className="text-sm text-gray-600">Family documents and files</p>
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
                <h3 className="text-lg font-semibold text-gray-900">Family Notes</h3>
                <p className="text-sm text-gray-500">Notes and documentation for {family.name}</p>
              </CardHeader>
            </Card>
          </div>
        )

      case 'safety':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Family Safety</h3>
                <p className="text-sm text-gray-500">Safety settings and emergency contacts for {family.name}</p>
              </CardHeader>
            </Card>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6 animate-fade-in">
            <Card variant="frosted">
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Family Settings</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-200/50">
                    <div>
                      <div className="font-medium text-gray-900">Privacy</div>
                      <div className="text-sm text-gray-500">Current: {family.settings.privacy}</div>
                    </div>
                    <div className="flex items-center">
                      {family.settings.privacy === 'public' ? <GlobeAltIcon className="h-5 w-5 text-green-500" aria-hidden="true" /> : 
                       family.settings.privacy === 'private' ? <LockClosedIcon className="h-5 w-5 text-yellow-500" aria-hidden="true" /> :
                       <UsersIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-200/50">
                    <div>
                      <div className="font-medium text-gray-900">Notifications</div>
                      <div className="text-sm text-gray-500">Email notifications</div>
                    </div>
                    <div className="flex items-center">
                      {family.settings.notifications ? <BellIcon className="h-5 w-5 text-green-500" aria-hidden="true" /> : 
                       <BellIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900">Content Moderation</div>
                      <div className="text-sm text-gray-500">Automatic content filtering</div>
                    </div>
                    <div className="flex items-center">
                      {family.settings.moderation ? <ShieldCheckIcon className="h-5 w-5 text-green-500" aria-hidden="true" /> : 
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
        <p className="text-red-600 font-semibold mb-2">Error loading family</p>
        <p className="text-gray-500">{error}</p>
        <Button 
          variant="primary"
          onClick={loadFamilyData}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!family) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
        <p className="text-gray-500">Family not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-full animate-fade-in">
      {/* Family Sidebar */}
      <FamilySidebar 
        familyId={family.id}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      
      {/* Main Content */}
      <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-y-auto">
        <Card variant="frosted" className="mb-6">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{family.name}</h2>
                <p className="text-sm text-gray-500">{family.description}</p>
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
