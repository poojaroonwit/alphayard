'use client'

import React, { useEffect, useState } from 'react'
import {
    identityService,
    SecurityPolicy,
} from '../../../../services/identityService'
import {
    ShieldCheckIcon,
    LockClosedIcon,
    ClockIcon,
    KeyIcon,
    GlobeAltIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    ArrowPathIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline'

type TabType = 'password' | 'lockout' | 'session' | 'mfa' | 'ip'

const defaultPolicy: Partial<SecurityPolicy> = {
    policyName: '',
    policyType: 'global',
    isActive: true,
    priority: 0,
    passwordMinLength: 8,
    passwordMaxLength: 128,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: false,
    passwordHistoryCount: 5,
    passwordExpiryDays: 0,
    lockoutEnabled: true,
    lockoutThreshold: 5,
    lockoutDurationMinutes: 30,
    lockoutResetAfterMinutes: 60,
    sessionTimeoutMinutes: 60,
    sessionMaxConcurrent: 5,
    mfaRequired: false,
    mfaRequiredForRoles: [],
    mfaRememberDeviceDays: 30,
    mfaAllowedTypes: ['totp', 'sms', 'email'],
    ipWhitelist: [],
    ipBlacklist: [],
    ipGeoWhitelist: [],
    ipGeoBlacklist: [],
}

export default function SecurityPoliciesPage() {
    const [activeTab, setActiveTab] = useState<TabType>('password')
    const [policies, setPolicies] = useState<SecurityPolicy[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [formData, setFormData] = useState<Partial<SecurityPolicy>>(defaultPolicy)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    
    // IP input states
    const [newIpWhitelist, setNewIpWhitelist] = useState('')
    const [newIpBlacklist, setNewIpBlacklist] = useState('')
    const [newGeoWhitelist, setNewGeoWhitelist] = useState('')
    const [newGeoBlacklist, setNewGeoBlacklist] = useState('')

    useEffect(() => {
        loadPolicies()
    }, [])

    const loadPolicies = async () => {
        setLoading(true)
        try {
            const { policies } = await identityService.getSecurityPolicies()
            setPolicies(policies)
            if (policies.length > 0) {
                setSelectedPolicy(policies[0])
                setFormData(policies[0])
            }
        } catch (error) {
            console.error('Error loading policies:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        
        try {
            if (selectedPolicy?.id) {
                await identityService.updateSecurityPolicy(selectedPolicy.id, formData)
                setSuccess('Policy updated successfully')
            } else {
                await identityService.createSecurityPolicy(formData)
                setSuccess('Policy created successfully')
            }
            setShowEditModal(false)
            loadPolicies()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to save policy')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (policyId: string) => {
        if (!confirm('Are you sure you want to delete this policy?')) return
        
        try {
            await identityService.deleteSecurityPolicy(policyId)
            setSuccess('Policy deleted successfully')
            loadPolicies()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to delete policy')
        }
    }

    const addToList = (field: 'ipWhitelist' | 'ipBlacklist' | 'ipGeoWhitelist' | 'ipGeoBlacklist', value: string, setValue: (v: string) => void) => {
        if (!value.trim()) return
        const current = formData[field] || []
        if (!current.includes(value.trim())) {
            setFormData({ ...formData, [field]: [...current, value.trim()] })
        }
        setValue('')
    }

    const removeFromList = (field: 'ipWhitelist' | 'ipBlacklist' | 'ipGeoWhitelist' | 'ipGeoBlacklist', value: string) => {
        const current = formData[field] || []
        setFormData({ ...formData, [field]: current.filter(v => v !== value) })
    }

    const tabs = [
        { id: 'password' as TabType, label: 'Password', icon: KeyIcon },
        { id: 'lockout' as TabType, label: 'Lockout', icon: LockClosedIcon },
        { id: 'session' as TabType, label: 'Session', icon: ClockIcon },
        { id: 'mfa' as TabType, label: 'MFA', icon: ShieldCheckIcon },
        { id: 'ip' as TabType, label: 'IP Rules', icon: GlobeAltIcon },
    ]

    return (
        <div className="space-y-6">
            {/* Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        {success}
                    </div>
                    <button onClick={() => setSuccess(null)} title="Dismiss" aria-label="Dismiss success message"><XMarkIcon className="w-5 h-5" /></button>
                </div>
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <XCircleIcon className="w-5 h-5" />
                        {error}
                    </div>
                    <button onClick={() => setError(null)} title="Dismiss" aria-label="Dismiss error message"><XMarkIcon className="w-5 h-5" /></button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Security Policies</h1>
                        <p className="text-gray-500 text-xs mt-1">Configure password requirements, lockout settings, session policies, MFA, and IP rules.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={loadPolicies}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button 
                            onClick={() => {
                                setSelectedPolicy(null)
                                setFormData(defaultPolicy)
                                setShowEditModal(true)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <PlusIcon className="w-4 h-4" />
                            New Policy
                        </button>
                    </div>
                </div>
            </div>

            {/* Policy Selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Active Policy</label>
                    <div className="flex gap-3">
                        <select
                            value={selectedPolicy?.id || ''}
                            onChange={(e) => {
                                const policy = policies.find(p => p.id === e.target.value)
                                if (policy) {
                                    setSelectedPolicy(policy)
                                    setFormData(policy)
                                }
                            }}
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            title="Select policy"
                        >
                            {policies.map(p => (
                                <option key={p.id} value={p.id}>{p.policyName} {!p.isActive && '(Inactive)'}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => setShowEditModal(true)}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-700"
                            title="Edit policy"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-600 border-transparent hover:text-gray-900'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : !selectedPolicy ? (
                        <div className="text-center py-12 text-gray-500">
                            No security policy configured. Create one to get started.
                        </div>
                    ) : (
                        <>
                            {/* Password Settings */}
                            {activeTab === 'password' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Length</label>
                                            <input
                                                type="number"
                                                value={formData.passwordMinLength}
                                                onChange={(e) => setFormData({ ...formData, passwordMinLength: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                min={1}
                                                max={128}
                                                title="Minimum password length"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Length</label>
                                            <input
                                                type="number"
                                                value={formData.passwordMaxLength}
                                                onChange={(e) => setFormData({ ...formData, passwordMaxLength: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                min={1}
                                                max={256}
                                                title="Maximum password length"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password History (prevent reuse)</label>
                                            <input
                                                type="number"
                                                value={formData.passwordHistoryCount}
                                                onChange={(e) => setFormData({ ...formData, passwordHistoryCount: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                min={0}
                                                max={24}
                                                title="Password history count"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Remember last N passwords</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password Expiry (days)</label>
                                            <input
                                                type="number"
                                                value={formData.passwordExpiryDays}
                                                onChange={(e) => setFormData({ ...formData, passwordExpiryDays: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                min={0}
                                                title="Password expiry days"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">0 = never expires</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 pt-4 border-t">
                                        <p className="font-medium text-gray-900">Password Requirements</p>
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.passwordRequireUppercase}
                                                onChange={(e) => setFormData({ ...formData, passwordRequireUppercase: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span>Require uppercase letter (A-Z)</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.passwordRequireLowercase}
                                                onChange={(e) => setFormData({ ...formData, passwordRequireLowercase: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span>Require lowercase letter (a-z)</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.passwordRequireNumber}
                                                onChange={(e) => setFormData({ ...formData, passwordRequireNumber: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span>Require number (0-9)</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.passwordRequireSpecial}
                                                onChange={(e) => setFormData({ ...formData, passwordRequireSpecial: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span>Require special character (!@#$%^&*)</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Lockout Settings */}
                            {activeTab === 'lockout' && (
                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={formData.lockoutEnabled}
                                            onChange={(e) => setFormData({ ...formData, lockoutEnabled: e.target.checked })}
                                            className="w-5 h-5 rounded"
                                        />
                                        <div>
                                            <p className="font-medium">Enable Account Lockout</p>
                                            <p className="text-sm text-gray-500">Lock accounts after failed login attempts</p>
                                        </div>
                                    </label>
                                    
                                    {formData.lockoutEnabled && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Failed Attempts Threshold</label>
                                                <input
                                                    type="number"
                                                    value={formData.lockoutThreshold}
                                                    onChange={(e) => setFormData({ ...formData, lockoutThreshold: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                    min={1}
                                                    max={100}
                                                    title="Failed attempts threshold"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Lock after N failed attempts</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Lockout Duration (minutes)</label>
                                                <input
                                                    type="number"
                                                    value={formData.lockoutDurationMinutes}
                                                    onChange={(e) => setFormData({ ...formData, lockoutDurationMinutes: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                    min={1}
                                                    title="Lockout duration in minutes"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Counter Reset (minutes)</label>
                                                <input
                                                    type="number"
                                                    value={formData.lockoutResetAfterMinutes}
                                                    onChange={(e) => setFormData({ ...formData, lockoutResetAfterMinutes: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 border rounded-lg"
                                                    min={1}
                                                    title="Counter reset time in minutes"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Reset failed count after inactivity</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Session Settings */}
                            {activeTab === 'session' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                                            <input
                                                type="number"
                                                value={formData.sessionTimeoutMinutes}
                                                onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                min={1}
                                                title="Session timeout in minutes"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Auto-logout after inactivity</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Concurrent Sessions</label>
                                            <input
                                                type="number"
                                                value={formData.sessionMaxConcurrent}
                                                onChange={(e) => setFormData({ ...formData, sessionMaxConcurrent: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border rounded-lg"
                                                min={1}
                                                max={100}
                                                title="Maximum concurrent sessions"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Maximum simultaneous sessions per user</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MFA Settings */}
                            {activeTab === 'mfa' && (
                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={formData.mfaRequired}
                                            onChange={(e) => setFormData({ ...formData, mfaRequired: e.target.checked })}
                                            className="w-5 h-5 rounded"
                                        />
                                        <div>
                                            <p className="font-medium">Require MFA for All Users</p>
                                            <p className="text-sm text-gray-500">Force multi-factor authentication</p>
                                        </div>
                                    </label>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remember Device (days)</label>
                                        <input
                                            type="number"
                                            value={formData.mfaRememberDeviceDays}
                                            onChange={(e) => setFormData({ ...formData, mfaRememberDeviceDays: parseInt(e.target.value) })}
                                            className="w-full max-w-xs px-4 py-2 border rounded-lg"
                                            min={0}
                                            max={365}
                                            title="Remember device for this many days"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Skip MFA on trusted devices for N days (0 = always require)</p>
                                    </div>
                                    
                                    <div>
                                        <p className="font-medium text-gray-900 mb-3">Allowed MFA Methods</p>
                                        <div className="space-y-2">
                                            {['totp', 'sms', 'email'].map(method => (
                                                <label key={method} className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={(formData.mfaAllowedTypes || []).includes(method)}
                                                        onChange={(e) => {
                                                            const current = formData.mfaAllowedTypes || []
                                                            if (e.target.checked) {
                                                                setFormData({ ...formData, mfaAllowedTypes: [...current, method] })
                                                            } else {
                                                                setFormData({ ...formData, mfaAllowedTypes: current.filter(m => m !== method) })
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded"
                                                    />
                                                    <span className="capitalize">{method === 'totp' ? 'Authenticator App (TOTP)' : method === 'sms' ? 'SMS' : 'Email'}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* IP Rules */}
                            {activeTab === 'ip' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* IP Whitelist */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">IP Whitelist (CIDR)</label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={newIpWhitelist}
                                                    onChange={(e) => setNewIpWhitelist(e.target.value)}
                                                    placeholder="192.168.1.0/24"
                                                    className="flex-1 px-4 py-2 border rounded-lg"
                                                    onKeyDown={(e) => e.key === 'Enter' && addToList('ipWhitelist', newIpWhitelist, setNewIpWhitelist)}
                                                />
                                                <button 
                                                    onClick={() => addToList('ipWhitelist', newIpWhitelist, setNewIpWhitelist)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(formData.ipWhitelist || []).map(ip => (
                                                    <span key={ip} className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                                                        {ip}
                                                        <button onClick={() => removeFromList('ipWhitelist', ip)} className="hover:text-green-900" title={`Remove ${ip}`} aria-label={`Remove ${ip} from whitelist`}>
                                                            <XMarkIcon className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* IP Blacklist */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">IP Blacklist (CIDR)</label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={newIpBlacklist}
                                                    onChange={(e) => setNewIpBlacklist(e.target.value)}
                                                    placeholder="10.0.0.0/8"
                                                    className="flex-1 px-4 py-2 border rounded-lg"
                                                    onKeyDown={(e) => e.key === 'Enter' && addToList('ipBlacklist', newIpBlacklist, setNewIpBlacklist)}
                                                />
                                                <button 
                                                    onClick={() => addToList('ipBlacklist', newIpBlacklist, setNewIpBlacklist)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(formData.ipBlacklist || []).map(ip => (
                                                    <span key={ip} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                                                        {ip}
                                                        <button onClick={() => removeFromList('ipBlacklist', ip)} className="hover:text-red-900" title={`Remove ${ip}`} aria-label={`Remove ${ip} from blacklist`}>
                                                            <XMarkIcon className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Geo Whitelist */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Country Whitelist (ISO codes)</label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={newGeoWhitelist}
                                                    onChange={(e) => setNewGeoWhitelist(e.target.value.toUpperCase())}
                                                    placeholder="US"
                                                    maxLength={2}
                                                    className="flex-1 px-4 py-2 border rounded-lg"
                                                    onKeyDown={(e) => e.key === 'Enter' && addToList('ipGeoWhitelist', newGeoWhitelist, setNewGeoWhitelist)}
                                                />
                                                <button 
                                                    onClick={() => addToList('ipGeoWhitelist', newGeoWhitelist, setNewGeoWhitelist)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(formData.ipGeoWhitelist || []).map(code => (
                                                    <span key={code} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                                        {code}
                                                        <button onClick={() => removeFromList('ipGeoWhitelist', code)} className="hover:text-blue-900" title={`Remove ${code}`} aria-label={`Remove ${code} from country whitelist`}>
                                                            <XMarkIcon className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Geo Blacklist */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Country Blacklist (ISO codes)</label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={newGeoBlacklist}
                                                    onChange={(e) => setNewGeoBlacklist(e.target.value.toUpperCase())}
                                                    placeholder="CN"
                                                    maxLength={2}
                                                    className="flex-1 px-4 py-2 border rounded-lg"
                                                    onKeyDown={(e) => e.key === 'Enter' && addToList('ipGeoBlacklist', newGeoBlacklist, setNewGeoBlacklist)}
                                                />
                                                <button 
                                                    onClick={() => addToList('ipGeoBlacklist', newGeoBlacklist, setNewGeoBlacklist)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(formData.ipGeoBlacklist || []).map(code => (
                                                    <span key={code} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                                                        {code}
                                                        <button onClick={() => removeFromList('ipGeoBlacklist', code)} className="hover:text-red-900" title={`Remove ${code}`} aria-label={`Remove ${code} from country blacklist`}>
                                                            <XMarkIcon className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                                        <InformationCircleIcon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div className="text-sm text-blue-700">
                                            <p className="font-medium">IP Rules Priority</p>
                                            <p>Whitelist takes precedence over blacklist. If a whitelist is set, only those IPs/countries are allowed.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="flex justify-end pt-6 border-t mt-6">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit/Create Policy Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full mx-4">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{selectedPolicy ? 'Edit Policy' : 'Create Policy'}</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" title="Close">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name *</label>
                                <input
                                    type="text"
                                    value={formData.policyName || ''}
                                    onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    placeholder="Default Security Policy"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <input
                                    type="number"
                                    value={formData.priority || 0}
                                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                    min={0}
                                    title="Policy priority"
                                    placeholder="0"
                                />
                                <p className="text-xs text-gray-500 mt-1">Higher priority policies take precedence</p>
                            </div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <span>Policy is active</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                            {selectedPolicy && (
                                <button
                                    onClick={() => handleDelete(selectedPolicy.id)}
                                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition mr-auto"
                                >
                                    Delete
                                </button>
                            )}
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
