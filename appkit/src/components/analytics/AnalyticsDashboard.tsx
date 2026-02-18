'use client'

import { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '../common/LoadingSpinner'

interface AnalyticsData {
  totalContent: number
  publishedContent: number
  draftContent: number
  featuredContent: number
  totalViews: number
  totalLikes: number
  totalComments: number
  contentByType: Array<{
    type: string
    count: number
  }>
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement proper analytics API endpoint
      // const response = await cmsService.getContent('1')
      // const content = response.data.content || []

      // Mock analytics data for now
      const analyticsData: AnalyticsData = {
        totalContent: 0,
        publishedContent: 0,
        draftContent: 0,
        featuredContent: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        contentByType: []
      }

      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading analytics..." />
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Error loading analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <ChartBarIcon className="h-7 w-7 text-gray-800" />
          Content Analytics
        </h2>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600">{analytics.totalContent}</div>
            <div className="text-gray-600">Total Content</div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 text-center">
            <EyeIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600">{analytics.publishedContent}</div>
            <div className="text-gray-600">Published</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 text-center">
            <HeartIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-yellow-600">{analytics.featuredContent}</div>
            <div className="text-gray-600">Featured</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6 text-center">
            <ChartBarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-600">{analytics.draftContent}</div>
            <div className="text-gray-600">Drafts</div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <EyeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{analytics.totalViews}</div>
            <div className="text-gray-600">Total Views</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <HeartIcon className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{analytics.totalLikes}</div>
            <div className="text-gray-600">Total Likes</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <ChatBubbleLeftIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{analytics.totalComments}</div>
            <div className="text-gray-600">Total Comments</div>
          </div>
        </div>

        {/* Content by Type */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Content by Type</h3>
          <div className="space-y-3">
            {analytics.contentByType.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700 capitalize">
                  {item.type.replace('_', ' ')}
                </span>
                <span className="font-semibold text-gray-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
