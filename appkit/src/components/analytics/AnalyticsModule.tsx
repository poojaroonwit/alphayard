'use client'

import { useState, useEffect } from 'react'
import {
  NewspaperIcon,
  SparklesIcon,
  UserIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  LightBulbIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  totalContent: number
  publishedContent: number
  draftContent: number
  totalViews: number
  totalLikes: number
  contentByType: Array<{ type: string; count: number; views: number }>
  topContent: Array<{
    id: string
    title: string
    type: string
    views: number
    likes: number
  }>
  recentActivity: Array<{
    action: string
    content: string
    date: string
    user: string
  }>
}

export function AnalyticsModule() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Simulate API call with example data
      const exampleData: AnalyticsData = {
        totalContent: 25,
        publishedContent: 18,
        draftContent: 7,
        totalViews: 1247,
        totalLikes: 89,
        contentByType: [
          { type: 'news', count: 8, views: 234 },
          { type: 'event', count: 5, views: 456 },
          { type: 'recipe', count: 6, views: 312 },
          { type: 'alert', count: 2, views: 189 },
          { type: 'memory', count: 3, views: 45 },
          { type: 'tip', count: 1, views: 11 }
        ],
        topContent: [
          {
            id: '1',
            title: 'Safety Alert: Storm Warning',
            type: 'alert',
            views: 156,
            likes: 8
          },
          {
            id: '2',
            title: 'Grandma\'s Apple Pie Recipe',
            type: 'recipe',
            views: 78,
            likes: 23
          },
          {
            id: '3',
            title: 'Circle Reunion 2024',
            type: 'event',
            views: 45,
            likes: 12
          }
        ],
        recentActivity: [
          { action: 'Created', content: 'Circle Reunion 2024', date: '2024-01-15', user: 'Sarah Johnson' },
          { action: 'Published', content: 'Grandma\'s Apple Pie Recipe', date: '2024-01-10', user: 'Mary Smith' },
          { action: 'Updated', content: 'Safety Alert: Storm Warning', date: '2024-01-08', user: 'John Wilson' },
          { action: 'Created', content: 'Christmas Memories 2023', date: '2024-01-05', user: 'Lisa Brown' },
          { action: 'Published', content: 'Weekly Circle Tips', date: '2024-01-03', user: 'Mike Davis' }
        ]
      }
      
      setData(exampleData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news':
        return <NewspaperIcon className="h-5 w-5 text-gray-700" />
      case 'event':
        return <SparklesIcon className="h-5 w-5 text-purple-600" />
      case 'recipe':
        return <UserIcon className="h-5 w-5 text-emerald-600" />
      case 'alert':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      case 'memory':
        return <PhotoIcon className="h-5 w-5 text-blue-600" />
      case 'tip':
        return <LightBulbIcon className="h-5 w-5 text-amber-500" />
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Error loading analytics</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="page-header">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Content performance and insights</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card">
            <div className="stat-number text-blue-600">{data.totalContent}</div>
            <div className="stat-label">Total Content</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number text-green-600">{data.publishedContent}</div>
            <div className="stat-label">Published</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number text-purple-600">{data.totalViews}</div>
            <div className="stat-label">Total Views</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number text-orange-600">{data.totalLikes}</div>
            <div className="stat-label">Total Likes</div>
          </div>
        </div>

        {/* Content by Type */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content by Type</h3>
          <div className="space-y-4">
            {data.contentByType.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-3">{getTypeIcon(item.type)}</span>
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {item.type === 'news' ? 'News' :
                       item.type === 'event' ? 'Events' :
                       item.type === 'recipe' ? 'Recipes' :
                       item.type === 'alert' ? 'Alerts' :
                       item.type === 'memory' ? 'Memories' :
                       item.type === 'tip' ? 'Tips' : item.type}
                    </div>
                    <div className="text-sm text-gray-500">{item.views} views</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{item.count}</div>
                  <div className="text-sm text-gray-500">items</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Content */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Content</h3>
          <div className="space-y-3">
            {data.topContent.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="mr-3">{getTypeIcon(item.type)}</span>
                  <div>
                    <div className="font-medium text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{item.views} views</div>
                  <div className="text-sm text-gray-500">{item.likes} likes</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {data.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-900">{activity.action}</span>
                  <span className="text-gray-600 ml-2">{activity.content}</span>
                  <span className="text-gray-500 ml-2">by {activity.user}</span>
                </div>
                <span className="text-gray-500">{new Date(activity.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

