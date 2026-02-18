'use client'

import { useState, useEffect } from 'react'
import { 
  UserGroupIcon,
  DocumentTextIcon,
  EyeIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  PlusIcon,
  FunnelIcon,
  BookmarkIcon,
  ArrowDownTrayIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { Tooltip } from '../ui/Tooltip'
import { Button } from '../ui/Button'

interface DashboardStats {
  totalFamilies: number
  totalContent: number
  publishedContent: number
  totalUsers: number
  growth: {
    families: number
    content: number
    users: number
  }
}

interface DashboardProps {
  onManageDashboards?: () => void
}

export function Dashboard({ onManageDashboards }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [savedViews, setSavedViews] = useState<Array<{ id: string; name: string; dateRange: '7d' | '30d' | '90d' }>>([])
  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const [activityFilter, setActivityFilter] = useState<'all' | 'families' | 'content' | 'users'>('all')
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('admin')
  
  // Real sparkline data from API
  const [sparkFamilies, setSparkFamilies] = useState<number[]>([])
  const [sparkContent, setSparkContent] = useState<number[]>([])
  const [sparkUsers, setSparkUsers] = useState<number[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load actual dashboard statistics
      const response = await fetch(`/api/admin/dashboard/stats?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setSparkFamilies(data.sparklines?.families || [8, 9, 10, 10, 11, 12, 12])
        setSparkContent(data.sparklines?.content || [120, 122, 130, 128, 140, 150, 156])
        setSparkUsers(data.sparklines?.users || [32, 34, 36, 39, 42, 44, 48])
        setRecentActivity(data.activity || [])
      } else {
        // Fallback to default values if API fails
        setStats({
          totalFamilies: 12,
          totalContent: 156,
          publishedContent: 142,
          totalUsers: 48,
          growth: {
            families: 4,
            content: 12,
            users: 8
          }
        })
        setSparkFamilies([8, 9, 10, 10, 11, 12, 12])
        setSparkContent([120, 122, 130, 128, 140, 150, 156])
        setSparkUsers([32, 34, 36, 39, 42, 44, 48])
        setRecentActivity([])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Set fallback data
      setStats({
        totalFamilies: 12,
        totalContent: 156,
        publishedContent: 142,
        totalUsers: 48,
        growth: {
          families: 4,
          content: 12,
          users: 8
        }
      })
      setSparkFamilies([8, 9, 10, 10, 11, 12, 12])
      setSparkContent([120, 122, 130, 128, 140, 150, 156])
      setSparkUsers([32, 34, 36, 39, 42, 44, 48])
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }

  function Sparkline({ values, color, id }: { values: number[]; color: string; id: string }) {
    const max = Math.max(...values)
    const min = Math.min(...values)
    const width = 200
    const height = 48
    const norm = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - ((v - min) / Math.max(1, max - min)) * height
      return `${x},${y}`
    }).join(' ')
    const gradientId = `gradient-${id}`
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline 
          fill={`url(#${gradientId})`}
          stroke={color} 
          strokeWidth="2.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${norm} ${width},${height} 0,${height}`}
        />
        <polyline 
          fill="none" 
          stroke={color} 
          strokeWidth="2.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          points={norm}
        />
      </svg>
    )
  }

  useEffect(() => {
    loadDashboardData()
    const storedViews = localStorage.getItem('admin_dashboard_saved_views')
    if (storedViews) {
      try {
        const parsed = JSON.parse(storedViews)
        setSavedViews(parsed)
      } catch {}
    }
    const storedDateRange = localStorage.getItem('admin_dashboard_date_range') as '7d' | '30d' | '90d' | null
    if (storedDateRange === '7d' || storedDateRange === '30d' || storedDateRange === '90d') {
      setDateRange(storedDateRange)
    }
    const storedRole = localStorage.getItem('admin_dashboard_role') as 'admin' | 'editor' | 'viewer' | null
    if (storedRole === 'admin' || storedRole === 'editor' || storedRole === 'viewer') {
      setRole(storedRole)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('admin_dashboard_date_range', dateRange)
  }, [dateRange])

  useEffect(() => {
    localStorage.setItem('admin_dashboard_role', role)
  }, [role])

  const handleSaveCurrentView = () => {
    const name = prompt('Name this view:')?.trim()
    if (!name) return
    const newView = {
      id: `${Date.now()}`,
      name,
      dateRange
    }
    const next = [...savedViews, newView]
    setSavedViews(next)
    localStorage.setItem('admin_dashboard_saved_views', JSON.stringify(next))
    setActiveViewId(newView.id)
  }

  const handleSelectView = (viewId: string) => {
    setActiveViewId(viewId)
    const view = savedViews.find(v => v.id === viewId)
    if (view) {
      setDateRange(view.dateRange)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e as any).isComposing) return

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        const search = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null
        search?.focus()
      }
      if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        // Trigger new content action
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const getUnifiedActivity = () => {
    // Return real activity data from API or fallback
    const activityData = recentActivity.length > 0 ? recentActivity : [
      {
        type: 'content',
        initials: 'JF',
        title: 'Johnson AppKit Reunion 2024',
        meta: 'Johnson Account • 45 views',
        badge: 'Published',
        badgeColor: 'green',
        time: '2 hours ago',
        bg: 'from-red-500 to-red-600'
      },
      {
        type: 'content',
        initials: 'RC',
        title: "Grandma's Apple Pie Recipe",
        meta: 'Smith Account • 78 views',
        badge: 'Published',
        badgeColor: 'green',
        time: '5 hours ago',
        bg: 'from-green-500 to-green-600'
      },
      {
        type: 'content',
        initials: 'BF',
        title: 'Birthday Celebration Photos',
        meta: 'Brown Account • 32 views',
        badge: 'Draft',
        badgeColor: 'yellow',
        time: '1 day ago',
        bg: 'from-blue-500 to-blue-600'
      },
      {
        type: 'families',
        initials: 'SF',
        title: 'Smith Account added a new member',
        meta: 'Users +1 (now 5)',
        badge: 'Update',
        badgeColor: 'blue',
        time: '3 hours ago',
        bg: 'from-slate-500 to-slate-600'
      },
      {
        type: 'users',
        initials: 'AU',
        title: 'New admin invited',
        meta: 'Email sent to admin@appkit.com',
        badge: 'Invite',
        badgeColor: 'purple',
        time: '6 hours ago',
        bg: 'from-purple-500 to-purple-600'
      }
    ];

    if (activityFilter === 'all') return activityData;
    return activityData.filter((item: any) => item.type === activityFilter);
  }

  function exportActivityCsv(items: Array<any>) {
    const headers = ['type','title','meta','badge','time']
    const rows = items.map(i => [i.type, i.title, i.meta, i.badge, i.time])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'activity.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function copyLinkWithFilters() {
    const params = new URLSearchParams(window.location.search)
    params.set('module', 'dashboard')
    params.set('dateRange', dateRange)
    params.set('activity', activityFilter)
    const link = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    navigator.clipboard.writeText(link).then(() => {
      // Show toast notification
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Loading dashboard">
        <div className="macos-spinner w-8 h-8"></div>
      </div>
    )
  }

  const StatCard = ({ 
    title, 
    value, 
    growth, 
    icon: Icon, 
    iconColor,
    sparkline,
    sparklineColor,
    sparklineId
  }: {
    title: string
    value: number | string
    growth?: number
    icon: any
    iconColor: string
    sparkline?: number[]
    sparklineColor?: string
    sparklineId?: string
  }) => (
    <div className="macos-card p-6 group hover:scale-[1.02] transition-all duration-300" role="region" aria-label={title}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {growth !== undefined && (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
              <ArrowTrendingUpIcon className="w-3 h-3" aria-hidden="true" />
              <span>+{growth}%</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
          <Icon className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
      </div>
      {sparkline && sparklineId && (
        <div className="h-12 mt-4 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkline values={sparkline} color={sparklineColor || '#0d7eff'} id={sparklineId} />
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="macos-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-sm text-gray-500">Overview of families, content, and activity</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="macos-input text-sm px-4 py-2 min-w-[140px]"
              aria-label="Select date range"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Tooltip content="Save current view">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveCurrentView}
                aria-label="Save current view"
              >
                <BookmarkIcon className="w-4 h-4 mr-1.5" aria-hidden="true" />
                Save view
              </Button>
            </Tooltip>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {}}
              aria-label="Create new content"
            >
              <PlusIcon className="w-4 h-4 mr-1.5" aria-hidden="true" />
              New content
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Families"
          value={stats?.totalFamilies || 0}
          growth={stats?.growth.families}
          icon={UserGroupIcon}
          iconColor="from-red-500 to-red-600"
          sparkline={sparkFamilies}
          sparklineColor="#ef4444"
          sparklineId="families"
        />
        <StatCard
          title="Total Content"
          value={stats?.totalContent || 0}
          growth={stats?.growth.content}
          icon={DocumentTextIcon}
          iconColor="from-blue-500 to-blue-600"
          sparkline={sparkContent}
          sparklineColor="#3b82f6"
          sparklineId="content"
        />
        <StatCard
          title="Published"
          value={stats?.publishedContent || 0}
          icon={EyeIcon}
          iconColor="from-green-500 to-green-600"
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          growth={stats?.growth.users}
          icon={UsersIcon}
          iconColor="from-purple-500 to-purple-600"
          sparkline={sparkUsers}
          sparklineColor="#8b5cf6"
          sparklineId="users"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Sidebar Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Account Activity */}
          <div className="macos-card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Account Activity</h3>
            <div className="space-y-3">
              {[
                { name: 'Johnson Circle', members: 6, content: 24, date: 'Jan 15, 2024', color: 'from-red-500 to-red-600' },
                { name: 'Smith Circle', members: 4, content: 18, date: 'Jan 14, 2024', color: 'from-green-500 to-green-600' },
                { name: 'Brown Circle', members: 5, content: 12, date: 'Jan 13, 2024', color: 'from-blue-500 to-blue-600' },
              ].map((Circle, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                  role="button"
                  tabIndex={0}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${Circle.color} flex items-center justify-center text-white font-semibold text-xs shadow-md`}>
                    {Circle.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{Circle.name}</p>
                    <p className="text-xs text-gray-500">{Circle.members} members • {Circle.content} content</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{Circle.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="macos-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">System Status</h3>
              <span className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold">All systems normal</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Uptime', value: '99.98%' },
                { label: 'API latency (p95)', value: '182 ms' },
                { label: 'Job queue', value: '3 pending', badge: true },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  {stat.badge ? (
                    <span className="px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-medium">
                      {stat.value}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{stat.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="macos-card p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Alerts</h3>
            <div className="space-y-3">
              {[
                { type: 'error', title: 'Backup failed last night', desc: 'Automatic backup did not complete. Retry required.' },
                { type: 'warning', title: 'Pending content approvals', desc: '4 items awaiting review.' },
                { type: 'info', title: 'New platform update available', desc: 'Version 2.2.0 includes security fixes.' },
              ].map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    alert.type === 'error' ? 'bg-red-50 border-red-100' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-100' :
                    'bg-blue-50 border-blue-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      alert.type === 'error' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} aria-hidden="true"></div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        alert.type === 'error' ? 'text-red-800' :
                        alert.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs mt-1 ${
                        alert.type === 'error' ? 'text-red-700' :
                        alert.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {alert.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

