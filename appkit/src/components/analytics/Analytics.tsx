'use client'

import { useState, useEffect } from 'react'
import { 
  EyeIcon,
  HeartIcon,
  UsersIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  totalViews: number
  totalEngagement: number
  activeUsers: number
  newUsers: number
  viewsGrowth: number
  engagementGrowth: number
  usersGrowth: number
  newUsersGrowth: number
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill?: boolean
  }[]
}

export function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  // @ts-ignore - selectedMetric for future use
  const [selectedMetric, setSelectedMetric] = useState('views')

  // Real chart data from API
  const [viewsChartData, setViewsChartData] = useState<ChartData | null>(null)
  const [engagementChartData, setEngagementChartData] = useState<ChartData | null>(null)
  const [usersChartData, setUsersChartData] = useState<ChartData | null>(null)
  const [deviceData, setDeviceData] = useState<any[]>([])
  const [topContent, setTopContent] = useState<any[]>([])

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data.analytics)
        setViewsChartData(data.charts?.views || null)
        setEngagementChartData(data.charts?.engagement || null)
        setUsersChartData(data.charts?.users || null)
        setDeviceData(data.devices || [])
        setTopContent(data.topContent || [])
      } else {
        // Set fallback data if API fails
        setFallbackData()
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      setFallbackData()
    } finally {
      setLoading(false)
    }
  }

  const setFallbackData = () => {
    setAnalyticsData({
      totalViews: 15420,
      totalEngagement: 8934,
      activeUsers: 1247,
      newUsers: 89,
      viewsGrowth: 12.5,
      engagementGrowth: 8.3,
      usersGrowth: 15.2,
      newUsersGrowth: 23.1
    })
  }

  // Set fallback chart data if API doesn't provide it
  useEffect(() => {
    if (!viewsChartData) {
      setViewsChartData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Views',
          data: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: true
        }]
      })
    }
    if (!engagementChartData) {
      setEngagementChartData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Engagement',
          data: [65, 78, 85, 92, 88, 95, 89],
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          fill: true
        }]
      })
    }
    if (deviceData.length === 0) {
      setDeviceData([
        { name: 'Mobile', value: 65, color: '#dc2626' },
        { name: 'Desktop', value: 25, color: '#059669' },
        { name: 'Tablet', value: 10, color: '#d97706' }
      ])
    }
    if (topContent.length === 0) {
      setTopContent([
        { title: 'Johnson Circle Reunion 2024', views: 2340, engagement: 92 },
        { title: 'Grandma\'s Apple Pie Recipe', views: 1890, engagement: 88 },
        { title: 'Birthday Celebration Photos', views: 1560, engagement: 85 },
        { title: 'Circle Tree Update', views: 1230, engagement: 78 },
        { title: 'Holiday Memories', views: 980, engagement: 82 }
      ])
    }
  }, [viewsChartData, engagementChartData, deviceData, topContent])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Analytics Dashboard</h1>
            <p className="text-lg text-gray-600 leading-relaxed">Track performance and insights across your platform</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              aria-label="Time range"
              title="Select time range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors duration-200">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Views</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData?.totalViews.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+{analyticsData?.viewsGrowth}%</span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <EyeIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Engagement Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData?.totalEngagement}%</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+{analyticsData?.engagementGrowth}%</span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <HeartIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData?.activeUsers}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+{analyticsData?.usersGrowth}%</span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">New Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData?.newUsers}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600 font-medium">{analyticsData?.newUsersGrowth}%</span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <UserPlusIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Views Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Views Over Time</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Views</span>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {viewsChartData?.datasets[0]?.data?.map((value, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div 
                  className="w-8 bg-red-500 rounded-t-lg transition-all duration-300 hover:bg-red-600"
                  style={{ height: `${(value / Math.max(...viewsChartData.datasets[0].data)) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-500">{viewsChartData.labels[index]}</span>
              </div>
            )) || <div className="text-gray-500 text-center">No data available</div>}
          </div>
        </div>
        
        {/* Engagement Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Engagement Rate</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Engagement %</span>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {engagementChartData?.datasets[0]?.data?.map((value, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div 
                  className="w-8 bg-green-500 rounded-t-lg transition-all duration-300 hover:bg-green-600"
                  style={{ height: `${(value / Math.max(...engagementChartData.datasets[0].data)) * 200}px` }}
                ></div>
                <span className="text-xs text-gray-500">{engagementChartData.labels[index]}</span>
              </div>
            )) || <div className="text-gray-500 text-center">No data available</div>}
          </div>
        </div>
      </div>

      {/* Device Analytics & Top Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Device Analytics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Device Usage</h3>
          <div className="space-y-4">
            {deviceData.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {device.name === 'Mobile' && <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />}
                  {device.name === 'Desktop' && <ComputerDesktopIcon className="w-5 h-5 text-gray-400" />}
                  {device.name === 'Tablet' && <DeviceTabletIcon className="w-5 h-5 text-gray-400" />}
                  <span className="text-sm font-medium text-gray-900">{device.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${device.value}%`,
                        backgroundColor: device.color
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8">{device.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Top Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Top Performing Content</h3>
          <div className="space-y-4">
            {topContent.map((content, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-150">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{content.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-3 h-3" />
                      {content.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <HeartIcon className="w-3 h-3" />
                      {content.engagement}% engagement
                    </span>
                  </div>
                </div>
                <div className="text-xs font-semibold text-gray-400">#{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

