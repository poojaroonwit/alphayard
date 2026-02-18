"use client";

import React, { useState, useEffect } from 'react'
import { 
    Users, 
    FileText, 
    TrendingUp, 
    Smartphone,
    Activity,
    RefreshCw,
    Plus,
    Settings,
    Shield,
    Database,
    Clock,
    ArrowUp,
    ArrowDown,
    MoreHorizontal,
    Terminal,
    Cpu,
    HardDrive,
    Zap
} from 'lucide-react'

interface DashboardStats {
    totalUsers: number
    totalContent: number
    totalViews: number
    activeUsers: number
    totalScreens: number
    userGrowth: number
    contentGrowth: number
    engagementGrowth: number
}

interface RecentActivity {
    id: string
    type: 'user' | 'content' | 'system' | 'security'
    title: string
    description: string
    timestamp: string
    status: 'success' | 'warning' | 'info'
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalContent: 0,
        totalViews: 0,
        activeUsers: 0,
        totalScreens: 0,
        userGrowth: 0,
        contentGrowth: 0,
        engagementGrowth: 0
    })
    const [activities, setActivities] = useState<RecentActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            setStats({
                totalUsers: 1248,
                totalContent: 342,
                totalViews: 45678,
                activeUsers: 892,
                totalScreens: 24,
                userGrowth: 12.5,
                contentGrowth: 8.3,
                engagementGrowth: 23.7
            })

            setActivities([
                {
                    id: '1',
                    type: 'user',
                    title: 'New User Registration',
                    description: 'john.doe@example.com joined the platform',
                    timestamp: '2 minutes ago',
                    status: 'success'
                },
                {
                    id: '2',
                    type: 'content',
                    title: 'Blog Post Published',
                    description: 'New article "Getting Started" was published',
                    timestamp: '15 minutes ago',
                    status: 'info'
                },
                {
                    id: '3',
                    type: 'system',
                    title: 'Database Backup Completed',
                    description: 'Automated backup completed successfully',
                    timestamp: '1 hour ago',
                    status: 'success'
                },
                {
                    id: '4',
                    type: 'security',
                    title: 'Security Scan',
                    description: 'Weekly security scan completed',
                    timestamp: '2 hours ago',
                    status: 'warning'
                },
                {
                    id: '5',
                    type: 'user',
                    title: 'Admin Login',
                    description: 'Admin user logged in from new device',
                    timestamp: '3 hours ago',
                    status: 'info'
                }
            ])
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchDashboardData()
        setRefreshing(false)
    }

    const StatCard = ({ 
        title, 
        value, 
        icon: Icon, 
        growth, 
        color = "blue",
        description 
    }: {
        title: string
        value: string | number
        icon: any
        growth?: number
        color?: 'blue' | 'green' | 'purple' | 'orange'
        description?: string
    }) => {
        const colorClasses = {
            blue: 'border-blue-500/20 text-blue-400',
            green: 'border-green-500/20 text-green-400',
            purple: 'border-purple-500/20 text-purple-400',
            orange: 'border-orange-500/20 text-orange-400'
        }

        return (
            <div className={`p-4 border-l-2 ${colorClasses[color]} bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all rounded-r-lg`}>
                <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded ${colorClasses[color].split(' ')[0]} bg-gray-100 dark:bg-zinc-800`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    {growth && (
                        <div className={`flex items-center text-xs font-mono ${
                            growth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                            {growth > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                            {Math.abs(growth)}%
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-mono font-bold text-gray-900 dark:text-gray-100">{value}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono uppercase tracking-wider">{title}</p>
                    {description && (
                        <p className="text-xs text-gray-600 dark:text-gray-500 font-mono">{description}</p>
                    )}
                </div>
            </div>
        )
    }

    const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
        const getIcon = () => {
            switch (activity.type) {
                case 'user': return <Users className="w-4 h-4" />
                case 'content': return <FileText className="w-4 h-4" />
                case 'system': return <Settings className="w-4 h-4" />
                case 'security': return <Shield className="w-4 h-4" />
                default: return <Activity className="w-4 h-4" />
            }
        }

        const getStatusColor = () => {
            switch (activity.status) {
                case 'success': return 'border-green-500/20 text-green-400'
                case 'warning': return 'border-orange-500/20 text-orange-400'
                case 'info': return 'border-blue-500/20 text-blue-400'
                default: return 'border-gray-500/20 text-gray-400'
            }
        }

        return (
            <div className="flex items-start gap-3 p-3 border-l border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors rounded-r-lg">
                <div className={`p-1.5 rounded border ${getStatusColor()} bg-gray-100 dark:bg-zinc-800`}>
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-mono font-medium text-gray-900 dark:text-gray-200">{activity.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{activity.timestamp}</span>
                    </div>
                </div>
                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors" aria-label="More options" title="More options">
                    <MoreHorizontal className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                </button>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-950 min-h-screen">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="p-4 border-l-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 rounded-r-lg">
                            <div className="animate-pulse">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-50 dark:bg-zinc-950 min-h-screen text-gray-900 dark:text-gray-100">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h1 className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">SYSTEM_DASHBOARD</h1>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">status: operational | uptime: 99.9% | last_sync: 2m ago</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-xs font-mono rounded-lg"
                        >
                            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'SYNCING...' : 'SYNC'}
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 dark:bg-blue-600/30 border border-blue-500/30 dark:border-blue-400/30 hover:bg-blue-600/30 dark:hover:bg-blue-600/40 transition-colors text-xs font-mono text-blue-600 dark:text-blue-400 rounded-lg">
                            <Plus className="w-3 h-3" />
                            NEW_PROCESS
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="USERS"
                        value={stats.totalUsers.toLocaleString()}
                        icon={Users}
                        growth={stats.userGrowth}
                        color="blue"
                        description="active_sessions"
                    />
                    <StatCard
                        title="ENTITIES"
                        value={stats.totalContent.toLocaleString()}
                        icon={FileText}
                        growth={stats.contentGrowth}
                        color="green"
                        description="stored_objects"
                    />
                    <StatCard
                        title="REQUESTS"
                        value={stats.totalViews.toLocaleString()}
                        icon={TrendingUp}
                        growth={stats.engagementGrowth}
                        color="purple"
                        description="total_api_calls"
                    />
                    <StatCard
                        title="SCREENS"
                        value={stats.totalScreens}
                        icon={Smartphone}
                        color="orange"
                        description="extracted_ui"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* System Log */}
                    <div className="lg:col-span-2">
                        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 rounded-lg">
                            <div className="border-b border-gray-200 dark:border-gray-800 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <h2 className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">SYSTEM_LOG</h2>
                                    </div>
                                    <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-mono">
                                        VIEW_ALL
                                    </button>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                {activities.map((activity) => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* System Controls */}
                    <div className="space-y-4">
                        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 rounded-lg">
                            <div className="border-b border-gray-200 dark:border-gray-800 p-4">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <h2 className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">QUICK_CMDS</h2>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <button className="w-full flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left rounded-lg">
                                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <div>
                                        <div className="text-xs font-mono font-medium text-gray-900 dark:text-gray-200">user:add</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">create_new_user</div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left rounded-lg">
                                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <div>
                                        <div className="text-xs font-mono font-medium text-gray-900 dark:text-gray-200">content:create</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">new_entity</div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left rounded-lg">
                                    <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <div>
                                        <div className="text-xs font-mono font-medium text-gray-900 dark:text-gray-200">system:config</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">modify_settings</div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left rounded-lg">
                                    <Database className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    <div>
                                        <div className="text-xs font-mono font-medium text-gray-900 dark:text-gray-200">db:manage</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">database_ops</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-900 rounded-lg">
                            <div className="border-b border-gray-200 dark:border-gray-800 p-4">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                    <h2 className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">SYSTEM_STATUS</h2>
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">api.status</span>
                                    </div>
                                    <span className="text-xs text-green-600 dark:text-green-400 font-mono">ONLINE</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">db.status</span>
                                    </div>
                                    <span className="text-xs text-green-600 dark:text-green-400 font-mono">HEALTHY</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">storage.usage</span>
                                    </div>
                                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-mono">78%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">cdn.status</span>
                                    </div>
                                    <span className="text-xs text-green-600 dark:text-green-400 font-mono">ACTIVE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
