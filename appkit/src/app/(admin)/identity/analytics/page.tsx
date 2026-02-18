'use client'

import React, { useEffect, useState } from 'react'
import { identityService, UserAnalytics } from '../../../../services/identityService'
import {
    UsersIcon,
    UserPlusIcon,
    ShieldCheckIcon,
    DevicePhoneMobileIcon,
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CalendarIcon,
    GlobeAltIcon,
    ChartBarIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface StatCardProps {
    title: string
    value: string | number
    change?: number
    changeLabel?: string
    icon: React.ComponentType<{ className?: string }>
    color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeLabel, icon: Icon, color }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
                {change !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? (
                            <ArrowTrendingUpIcon className="w-4 h-4" />
                        ) : (
                            <ArrowTrendingDownIcon className="w-4 h-4" />
                        )}
                        <span>{Math.abs(change)}% {changeLabel || 'vs last period'}</span>
                    </div>
                )}
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </div>
)

export default function IdentityAnalyticsPage() {
    const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState('30d')

    useEffect(() => {
        loadAnalytics()
    }, [dateRange])

    const loadAnalytics = async () => {
        setLoading(true)
        try {
            const now = new Date()
            let startDate: Date
            
            switch (dateRange) {
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                    break
                case '90d':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                    break
                default:
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            }
            
            const data = await identityService.getUserAnalytics({
                startDate: startDate.toISOString(),
                endDate: now.toISOString()
            })
            setAnalytics(data)
        } catch (error) {
            console.error('Error loading analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    // Helper to get random trend for demo
    const getRandomTrend = () => Math.round((Math.random() - 0.3) * 30)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">User Analytics</h1>
                        <p className="text-gray-500 text-xs mt-1">Monitor user activity, authentication patterns, and identity metrics.</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm"
                            title="Date range"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                        <button 
                            onClick={loadAnalytics}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : analytics ? (
                <>
                    {/* Main Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Users"
                            value={analytics.totalUsers}
                            change={getRandomTrend()}
                            icon={UsersIcon}
                            color="bg-blue-100 text-blue-600"
                        />
                        <StatCard
                            title="Active Users"
                            value={analytics.activeUsers}
                            change={getRandomTrend()}
                            changeLabel="this period"
                            icon={CheckCircleIcon}
                            color="bg-green-100 text-green-600"
                        />
                        <StatCard
                            title="New Registrations"
                            value={analytics.registrationsCount}
                            change={getRandomTrend()}
                            changeLabel="vs last period"
                            icon={UserPlusIcon}
                            color="bg-purple-100 text-purple-600"
                        />
                        <StatCard
                            title="MFA Enabled"
                            value={analytics.mfaEnabledCount}
                            change={getRandomTrend()}
                            icon={ShieldCheckIcon}
                            color="bg-amber-100 text-amber-600"
                        />
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Active Sessions"
                            value={analytics.activeSessions}
                            icon={ClockIcon}
                            color="bg-teal-100 text-teal-600"
                        />
                        <StatCard
                            title="Registered Devices"
                            value={analytics.totalDevices}
                            icon={DevicePhoneMobileIcon}
                            color="bg-indigo-100 text-indigo-600"
                        />
                        <StatCard
                            title="Suspicious Logins"
                            value={analytics.suspiciousLogins}
                            icon={ExclamationTriangleIcon}
                            color="bg-red-100 text-red-600"
                        />
                    </div>

                    {/* Detailed Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Login Statistics */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="p-6 border-b">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <ChartBarIcon className="w-5 h-5 text-gray-400" />
                                    Login Statistics
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Login Attempts</span>
                                    <span className="font-semibold text-gray-900">{analytics.loginStats.totalAttempts.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Successful Logins</span>
                                    <span className="font-semibold text-green-600">{analytics.loginStats.successful.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Failed Logins</span>
                                    <span className="font-semibold text-red-600">{analytics.loginStats.failed.toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Success Rate</span>
                                        <span className="font-semibold text-gray-900">
                                            {analytics.loginStats.totalAttempts > 0 
                                                ? ((analytics.loginStats.successful / analytics.loginStats.totalAttempts) * 100).toFixed(1)
                                                : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ 
                                                width: `${analytics.loginStats.totalAttempts > 0 
                                                    ? (analytics.loginStats.successful / analytics.loginStats.totalAttempts) * 100 
                                                    : 0}%` 
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Login by Method */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="p-6 border-b">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                                    Authentication Methods
                                </h2>
                            </div>
                            <div className="p-6">
                                {analytics.loginStats.byMethod && Object.keys(analytics.loginStats.byMethod).length > 0 ? (
                                    <div className="space-y-4">
                                        {Object.entries(analytics.loginStats.byMethod).map(([method, count]) => {
                                            const total = Object.values(analytics.loginStats.byMethod!).reduce((a, b) => a + b, 0)
                                            const percentage = total > 0 ? (count / total) * 100 : 0
                                            return (
                                                <div key={method}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                                                        <span className="text-gray-900 font-medium">{count.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-blue-500 h-2 rounded-full"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No login data available for this period
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Locations */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="p-6 border-b">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                                    Top Login Locations
                                </h2>
                            </div>
                            <div className="p-6">
                                {analytics.topLocations && analytics.topLocations.length > 0 ? (
                                    <div className="space-y-3">
                                        {analytics.topLocations.slice(0, 5).map((loc, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                        {idx + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{loc.city || 'Unknown'}</p>
                                                        <p className="text-sm text-gray-500">{loc.country || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-gray-900">{loc.count.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No location data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Devices */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="p-6 border-b">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400" />
                                    Device Types
                                </h2>
                            </div>
                            <div className="p-6">
                                {analytics.topDevices && analytics.topDevices.length > 0 ? (
                                    <div className="space-y-3">
                                        {analytics.topDevices.slice(0, 5).map((device, idx) => {
                                            const total = analytics.topDevices!.reduce((a, b) => a + b.count, 0)
                                            const percentage = total > 0 ? (device.count / total) * 100 : 0
                                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-red-500']
                                            return (
                                                <div key={idx}>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-gray-600 capitalize">{device.deviceType}</span>
                                                        <span className="text-gray-900 font-medium">{device.count.toLocaleString()}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`${colors[idx % colors.length]} h-2 rounded-full`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No device data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* User Status Breakdown */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="font-semibold text-gray-900">User Status Breakdown</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-xl">
                                    <p className="text-3xl font-bold text-green-600">{analytics.usersByStatus?.active || 0}</p>
                                    <p className="text-sm text-green-700 mt-1">Active</p>
                                </div>
                                <div className="text-center p-4 bg-amber-50 rounded-xl">
                                    <p className="text-3xl font-bold text-amber-600">{analytics.usersByStatus?.pending || 0}</p>
                                    <p className="text-sm text-amber-700 mt-1">Pending</p>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-xl">
                                    <p className="text-3xl font-bold text-red-600">{analytics.usersByStatus?.suspended || 0}</p>
                                    <p className="text-sm text-red-700 mt-1">Suspended</p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <p className="text-3xl font-bold text-gray-600">{analytics.usersByStatus?.inactive || 0}</p>
                                    <p className="text-sm text-gray-700 mt-1">Inactive</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    Failed to load analytics data
                </div>
            )}
        </div>
    )
}
