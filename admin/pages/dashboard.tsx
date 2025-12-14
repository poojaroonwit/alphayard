import React, { useState } from 'react'
import {
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  PhotoIcon,
  GlobeAltIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { EnhancedContentManager } from '../components/cms/EnhancedContentManager'

interface DashboardStats {
  totalContent: number
  publishedContent: number
  draftContent: number
  totalViews: number
  recentActivity: Array<{
    id: string
    type: 'create' | 'update' | 'publish' | 'delete'
    title: string
    timestamp: string
    user: string
  }>
}

interface DashboardProps {
  stats?: DashboardStats
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'settings'>('overview')

  const mockStats: DashboardStats = {
    totalContent: 24,
    publishedContent: 18,
    draftContent: 6,
    totalViews: 15420,
    recentActivity: [
      {
        id: '1',
        type: 'publish',
        title: 'Summer Sale Landing Page',
        timestamp: '2 hours ago',
        user: 'John Doe'
      },
      {
        id: '2',
        type: 'create',
        title: 'Product Feature Article',
        timestamp: '4 hours ago',
        user: 'Jane Smith'
      },
      {
        id: '3',
        type: 'update',
        title: 'About Us Page',
        timestamp: '1 day ago',
        user: 'Mike Johnson'
      },
      {
        id: '4',
        type: 'publish',
        title: 'Newsletter Signup',
        timestamp: '2 days ago',
        user: 'Sarah Wilson'
      }
    ]
  }

  const currentStats = stats || mockStats

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return PencilIcon
      case 'update': return PencilIcon
      case 'publish': return GlobeAltIcon
      case 'delete': return TrashIcon
      default: return DocumentTextIcon
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create': return 'text-green-600 bg-green-100'
      case 'update': return 'text-blue-600 bg-blue-100'
      case 'publish': return 'text-purple-600 bg-purple-100'
      case 'delete': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'content', label: 'Content', icon: DocumentTextIcon },
    { id: 'analytics', label: 'Analytics', icon: ArrowTrendingUpIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon }
  ]

  if (activeTab === 'content') {
    return <EnhancedContentManager />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Content Management Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <BellIcon className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <span className="text-sm text-gray-700">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Content</p>
                    <p className="text-2xl font-semibold text-gray-900">{currentStats.totalContent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <GlobeAltIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-semibold text-gray-900">{currentStats.publishedContent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <PencilIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Drafts</p>
                    <p className="text-2xl font-semibold text-gray-900">{currentStats.draftContent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <EyeIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-semibold text-gray-900">{currentStats.totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {currentStats.recentActivity.map(activity => {
                  const IconComponent = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="px-6 py-4 flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.type} by {activity.user} • {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('content')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <h4 className="font-medium text-gray-900">Create Content</h4>
                  <p className="text-sm text-gray-600">Start building your next page</p>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <ChartBarIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <h4 className="font-medium text-gray-900">View Analytics</h4>
                  <p className="text-sm text-gray-600">Check your content performance</p>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-left"
                >
                  <CogIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <h4 className="font-medium text-gray-900">Settings</h4>
                  <p className="text-sm text-gray-600">Configure your workspace</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
            <p className="text-gray-600">Analytics dashboard coming soon...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            <p className="text-gray-600">Settings panel coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
