'use client'

import React, { useEffect, useState } from 'react'
import {
    identityService,
    UserSession,
    UserDevice,
    LoginHistoryEntry,
} from '../../../../services/identityService'
import {
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    DeviceTabletIcon,
    GlobeAltIcon,
    ClockIcon,
    MapPinIcon,
    ShieldCheckIcon,
    ShieldExclamationIcon,
    XCircleIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    LockClosedIcon,
    LockOpenIcon,
    EyeIcon,
    ChevronDownIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'

type TabType = 'sessions' | 'devices' | 'history'

const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <ComputerDesktopIcon className="w-5 h-5" />,
    mobile: <DevicePhoneMobileIcon className="w-5 h-5" />,
    tablet: <DeviceTabletIcon className="w-5 h-5" />,
    unknown: <GlobeAltIcon className="w-5 h-5" />,
}

export default function SessionsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('history')
    const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(0)
    const [limit] = useState(50)
    
    // Filters
    const [filterSuccess, setFilterSuccess] = useState<string>('all')
    const [filterSuspicious, setFilterSuspicious] = useState<string>('all')
    const [searchEmail, setSearchEmail] = useState('')
    
    // Modal states
    const [selectedEntry, setSelectedEntry] = useState<LoginHistoryEntry | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)

    useEffect(() => {
        loadData()
    }, [activeTab, page, filterSuccess, filterSuspicious])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'history') {
                const { entries, total } = await identityService.getLoginHistory({
                    success: filterSuccess === 'all' ? undefined : filterSuccess === 'true',
                    suspicious: filterSuspicious === 'all' ? undefined : filterSuspicious === 'true',
                    email: searchEmail || undefined,
                    limit,
                    offset: page * limit,
                })
                setLoginHistory(entries)
                setTotal(total)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setPage(0)
        loadData()
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleString()
    }

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)
        
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Sessions & Activity</h1>
                        <p className="text-gray-500 text-xs mt-1">Monitor login activity, active sessions, and manage devices across all users.</p>
                    </div>
                    <button 
                        onClick={loadData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 px-4 font-medium transition border-b-2 ${
                            activeTab === 'history'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-600 border-transparent hover:text-gray-900'
                        }`}
                    >
                        Login History
                    </button>
                    <button
                        onClick={() => setActiveTab('sessions')}
                        className={`pb-3 px-4 font-medium transition border-b-2 ${
                            activeTab === 'sessions'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-600 border-transparent hover:text-gray-900'
                        }`}
                    >
                        Active Sessions
                    </button>
                    <button
                        onClick={() => setActiveTab('devices')}
                        className={`pb-3 px-4 font-medium transition border-b-2 ${
                            activeTab === 'devices'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-600 border-transparent hover:text-gray-900'
                        }`}
                    >
                        Devices
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Logins (24h)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {loginHistory.filter(e => {
                            const date = new Date(e.createdAt)
                            return date.getTime() > Date.now() - 86400000
                        }).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Successful</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {loginHistory.filter(e => e.success).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Failed</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        {loginHistory.filter(e => !e.success).length}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Suspicious</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                        {loginHistory.filter(e => e.isSuspicious).length}
                    </p>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Filters */}
                    <div className="p-4 border-b flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px] relative">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by email..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <select
                            value={filterSuccess}
                            onChange={(e) => { setFilterSuccess(e.target.value); setPage(0); }}
                            className="px-4 py-2 border rounded-lg text-sm"
                            title="Filter by result"
                        >
                            <option value="all">All Results</option>
                            <option value="true">Successful</option>
                            <option value="false">Failed</option>
                        </select>
                        <select
                            value={filterSuspicious}
                            onChange={(e) => { setFilterSuspicious(e.target.value); setPage(0); }}
                            className="px-4 py-2 border rounded-lg text-sm"
                            title="Filter by suspicious flag"
                        >
                            <option value="all">All Activity</option>
                            <option value="true">Suspicious Only</option>
                            <option value="false">Normal Only</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium">User</th>
                                    <th className="px-6 py-3 text-left font-medium">Method</th>
                                    <th className="px-6 py-3 text-left font-medium">Status</th>
                                    <th className="px-6 py-3 text-left font-medium">Location</th>
                                    <th className="px-6 py-3 text-left font-medium">Device</th>
                                    <th className="px-6 py-3 text-left font-medium">Time</th>
                                    <th className="px-6 py-3 text-left font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                                            <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
                                            <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                                            <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                                            <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                                            <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-100 rounded" /></td>
                                        </tr>
                                    ))
                                ) : loginHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No login history found.
                                        </td>
                                    </tr>
                                ) : (
                                    loginHistory.map((entry) => (
                                        <tr key={entry.id} className={`hover:bg-gray-50 ${entry.isSuspicious ? 'bg-orange-50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{entry.email || 'Unknown'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-600 capitalize">
                                                    {entry.loginMethod}
                                                    {entry.socialProvider && ` (${entry.socialProvider})`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {entry.success ? (
                                                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                            <CheckCircleIcon className="w-3 h-3" />
                                                            Success
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                                            <XCircleIcon className="w-3 h-3" />
                                                            Failed
                                                        </span>
                                                    )}
                                                    {entry.isSuspicious && (
                                                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                                                            <ExclamationTriangleIcon className="w-3 h-3" />
                                                            Suspicious
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    {entry.city && entry.country ? `${entry.city}, ${entry.country}` : entry.ipAddress || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {deviceIcons[entry.deviceType || 'unknown']}
                                                    <span className="text-gray-600 capitalize">{entry.deviceType || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-600" title={formatDate(entry.createdAt)}>
                                                    {getTimeAgo(entry.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedEntry(entry)
                                                        setShowDetailModal(true)
                                                    }}
                                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                                    title="View details"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
                        <span>Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * limit >= total}
                                className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sessions' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="text-center py-12">
                        <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
                        <p className="text-gray-500 mt-1 mb-4">Search for a user to view and manage their active sessions.</p>
                        <p className="text-sm text-gray-400">Go to Users → Select a user → View Sessions</p>
                    </div>
                </div>
            )}

            {activeTab === 'devices' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="text-center py-12">
                        <DevicePhoneMobileIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Device Management</h3>
                        <p className="text-gray-500 mt-1 mb-4">Search for a user to view and manage their registered devices.</p>
                        <p className="text-sm text-gray-400">Go to Users → Select a user → View Devices</p>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedEntry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Login Details</h2>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false)
                                    setSelectedEntry(null)
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="Close"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                {selectedEntry.success ? (
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="p-3 bg-red-100 rounded-full">
                                        <XCircleIcon className="w-6 h-6 text-red-600" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {selectedEntry.success ? 'Successful Login' : 'Failed Login'}
                                    </p>
                                    <p className="text-sm text-gray-500">{formatDate(selectedEntry.createdAt)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Email</p>
                                    <p className="font-medium">{selectedEntry.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Method</p>
                                    <p className="font-medium capitalize">{selectedEntry.loginMethod}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">IP Address</p>
                                    <p className="font-medium">{selectedEntry.ipAddress || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Location</p>
                                    <p className="font-medium">
                                        {selectedEntry.city && selectedEntry.country 
                                            ? `${selectedEntry.city}, ${selectedEntry.country}` 
                                            : 'Unknown'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Device Type</p>
                                    <p className="font-medium capitalize">{selectedEntry.deviceType || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Risk Score</p>
                                    <p className={`font-medium ${
                                        selectedEntry.riskScore > 50 ? 'text-red-600' : 
                                        selectedEntry.riskScore > 25 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                        {selectedEntry.riskScore}/100
                                    </p>
                                </div>
                            </div>

                            {selectedEntry.mfaRequired && (
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                        <strong>MFA Required:</strong> {selectedEntry.mfaMethod || 'Yes'}
                                        {selectedEntry.mfaSuccess !== undefined && (
                                            <span className={selectedEntry.mfaSuccess ? ' - Verified' : ' - Failed'}></span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {selectedEntry.isSuspicious && (
                                <div className="p-3 bg-orange-50 rounded-lg">
                                    <p className="text-sm text-orange-700">
                                        <strong>Suspicious Activity:</strong> {selectedEntry.suspiciousReason || 'Flagged as suspicious'}
                                    </p>
                                </div>
                            )}

                            {!selectedEntry.success && selectedEntry.failureReason && (
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <p className="text-sm text-red-700">
                                        <strong>Failure Reason:</strong> {selectedEntry.failureReason}
                                    </p>
                                </div>
                            )}

                            {selectedEntry.userAgent && (
                                <div>
                                    <p className="text-gray-500 text-sm">User Agent</p>
                                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded font-mono break-all">
                                        {selectedEntry.userAgent}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false)
                                    setSelectedEntry(null)
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
