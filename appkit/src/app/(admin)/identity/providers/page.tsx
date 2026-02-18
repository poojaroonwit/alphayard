'use client'

import React, { useEffect, useState } from 'react'
import {
    identityService,
    OAuthProvider,
} from '../../../../services/identityService'
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    XMarkIcon,
    ArrowPathIcon,
    LinkIcon,
    GlobeAltIcon,
    EyeIcon,
    EyeSlashIcon,
} from '@heroicons/react/24/outline'

// Provider logos/colors configuration
const providerConfig: Record<string, { color: string; icon: string }> = {
    google: { color: '#4285F4', icon: 'G' },
    facebook: { color: '#1877F2', icon: 'f' },
    apple: { color: '#000000', icon: '' },
    twitter: { color: '#1DA1F2', icon: 'X' },
    github: { color: '#24292e', icon: 'GH' },
    microsoft: { color: '#00a4ef', icon: 'M' },
    linkedin: { color: '#0077B5', icon: 'in' },
    discord: { color: '#5865F2', icon: 'D' },
    slack: { color: '#4A154B', icon: 'S' },
    custom: { color: '#6B7280', icon: '?' },
}

const defaultProvider: Partial<OAuthProvider> = {
    providerName: 'google',
    displayName: 'Google',
    isEnabled: true,
    clientId: '',
    authUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    scopes: ['openid', 'email', 'profile'],
    attributeMapping: {
        email: 'email',
        firstName: 'given_name',
        lastName: 'family_name',
        avatar: 'picture'
    }
}

// Provider setup guides
const getProviderGuide = (providerName: string) => {
    const guides: Record<string, JSX.Element> = {
        google: (
            <div>
                <p className="font-medium mb-2">1. Create Google OAuth App</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener" className="underline">Google Cloud Console</a></li>
                    <li>Create a new project or select existing one</li>
                    <li>Enable "Google+ API" and "OAuth2 API"</li>
                    <li>Go to "Credentials" → "Create Credentials" → "OAuth client ID"</li>
                    <li>Select "Web application" type</li>
                    <li>Add authorized redirect URI: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/auth/callback/google</code></li>
                </ol>
                <p className="font-medium mt-3 mb-2">2. Configure Settings</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Copy Client ID and Client Secret from Google Console</li>
                    <li>Default scopes are pre-configured for basic profile info</li>
                    <li>Test with your Google account after saving</li>
                </ul>
            </div>
        ),
        facebook: (
            <div>
                <p className="font-medium mb-2">1. Create Facebook App</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener" className="underline">Facebook Developers</a></li>
                    <li>Create new app → "Business" or "App for Everything Else"</li>
                    <li>Add "Facebook Login" product</li>
                    <li>Configure Web OAuth settings</li>
                    <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/auth/callback/facebook</code></li>
                </ol>
                <p className="font-medium mt-3 mb-2">2. App Review</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Submit app for review if using beyond testing</li>
                    <li>Add test users in App Dashboard during development</li>
                    <li>Ensure "email" and "public_profile" permissions are approved</li>
                </ul>
            </div>
        ),
        microsoft: (
            <div>
                <p className="font-medium mb-2">1. Register Azure AD App</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go to <a href="https://portal.azure.com/" target="_blank" rel="noopener" className="underline">Azure Portal</a></li>
                    <li>Navigate to "Azure Active Directory" → "App registrations"</li>
                    <li>Click "New registration"</li>
                    <li>Select "Accounts in any organizational directory"</li>
                    <li>Add redirect URI: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/auth/callback/microsoft</code></li>
                </ol>
                <p className="font-medium mt-3 mb-2">2. API Permissions</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Add "Microsoft Graph" permissions</li>
                    <li>Include "email", "profile", "User.Read" scopes</li>
                    <li>Grant admin consent for your organization</li>
                </ul>
            </div>
        ),
        apple: (
            <div>
                <p className="font-medium mb-2">1. Configure Apple Sign In</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go to <a href="https://developer.apple.com/" target="_blank" rel="noopener" className="underline">Apple Developer Portal</a></li>
                    <li>Create new App ID with "Sign In with Apple" capability</li>
                    <li>Go to "Services" → "Sign In with Apple"</li>
                    <li>Configure your website redirect URLs</li>
                    <li>Add Service ID and download private key</li>
                </ol>
                <p className="font-medium mt-3 mb-2">2. Important Notes</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Apple requires paid developer account ($99/year)</li>
                    <li>Must implement Sign In with Apple if you offer other social logins</li>
                    <li>Private key is valid for 6 months and must be rotated</li>
                </ul>
            </div>
        ),
        github: (
            <div>
                <p className="font-medium mb-2">1. Create GitHub OAuth App</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go to <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener" className="underline">GitHub Settings</a></li>
                    <li>Fill in application name and homepage URL</li>
                    <li>Set callback URL: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/auth/callback/github</code></li>
                    <li>Uncheck "Enable Device Flow" for web applications</li>
                </ol>
                <p className="font-medium mt-3 mb-2">2. Permissions</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Default scopes request public email and profile</li>
                    <li>Users can see what data your app requests</li>
                    <li>GitHub OAuth is popular with developers</li>
                </ul>
            </div>
        ),
        twitter: (
            <div>
                <p className="font-medium mb-2">1. Create Twitter/X App</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go to <a href="https://developer.twitter.com/" target="_blank" rel="noopener" className="underline">Twitter Developer Portal</a></li>
                    <li>Create new project and app</li>
                    <li>Select "OAuth 2.0" authentication type</li>
                    <li>Add callback URL: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/auth/callback/twitter</code></li>
                    <li>Set app permissions to "Read" for basic profile access</li>
                </ol>
                <p className="font-medium mt-3 mb-2">2. API Access</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Twitter requires app approval for production use</li>
                    <li>Essential access is free with rate limits</li>
                    <li>Users must have Twitter/X accounts to authenticate</li>
                </ul>
            </div>
        ),
        linkedin: (
            <div>
                <p className="font-medium mb-2">1. Create LinkedIn App</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Go to <a href="https://www.linkedin.com/developers/apps/new" target="_blank" rel="noopener" className="underline">LinkedIn Developer Portal</a></li>
                    <li>Create new app with company page</li>
                    <li>Add "Sign In with LinkedIn" product</li>
                    <li>Configure OAuth 2.0 redirect URLs</li>
                    <li>Add: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/auth/callback/linkedin</code></li>
                </ol>
                <p className="font-medium mt-3 mb-2">2. Permissions</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Request "r_liteprofile" and "r_emailaddress"</li>
                    <li>LinkedIn requires business verification for some features</li>
                    <li>Professional users prefer LinkedIn authentication</li>
                </ul>
            </div>
        ),
        custom: (
            <div>
                <p className="font-medium mb-2">1. Configure Custom OAuth Provider</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Obtain OAuth 2.0 credentials from your identity provider</li>
                    <li>Configure authorization, token, and userinfo endpoints</li>
                    <li>Set appropriate scopes for your use case</li>
                    <li>Map provider attributes to your user fields</li>
                </ol>
                <p className="font-medium mt-3 mb-2">2. Common Providers</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Auth0:</strong> Use your Auth0 domain endpoints</li>
                    <li><strong>Okta:</strong> Configure with your Okta instance</li>
                    <li><strong>Keycloak:</strong> Use realm-specific endpoints</li>
                    <li><strong>ADFS:</strong> Configure with your ADFS server</li>
                </ul>
            </div>
        )
    }
    
    return guides[providerName] || guides.custom
}

export default function OAuthProvidersPage() {
    const [providers, setProviders] = useState<OAuthProvider[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null)
    const [formData, setFormData] = useState<Partial<OAuthProvider>>(defaultProvider)
    const [clientSecret, setClientSecret] = useState('')
    const [showClientSecret, setShowClientSecret] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [scopeInput, setScopeInput] = useState('')

    useEffect(() => {
        loadProviders()
    }, [])

    const loadProviders = async () => {
        setLoading(true)
        try {
            const { providers } = await identityService.getOAuthProviders()
            setProviders(providers)
        } catch (error) {
            console.error('Error loading providers:', error)
        } finally {
            setLoading(false)
        }
    }

    const openCreateModal = () => {
        setSelectedProvider(null)
        setFormData(defaultProvider)
        setClientSecret('')
        setScopeInput('')
        setShowModal(true)
    }

    const openEditModal = (provider: OAuthProvider) => {
        setSelectedProvider(provider)
        setFormData(provider)
        setClientSecret('')
        setScopeInput('')
        setShowModal(true)
    }

    const handleProviderSelect = (providerName: string) => {
        const config: Record<string, Partial<OAuthProvider>> = {
            google: {
                providerName: 'google',
                displayName: 'Google',
                authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
                scopes: ['openid', 'email', 'profile'],
                attributeMapping: { email: 'email', firstName: 'given_name', lastName: 'family_name', avatar: 'picture' }
            },
            facebook: {
                providerName: 'facebook',
                displayName: 'Facebook',
                authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
                tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
                userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture',
                scopes: ['email', 'public_profile'],
                attributeMapping: { email: 'email', firstName: 'first_name', lastName: 'last_name', avatar: 'picture.data.url' }
            },
            apple: {
                providerName: 'apple',
                displayName: 'Apple',
                authUrl: 'https://appleid.apple.com/auth/authorize',
                tokenUrl: 'https://appleid.apple.com/auth/token',
                userInfoUrl: '',
                scopes: ['name', 'email'],
                attributeMapping: { email: 'email', firstName: 'name.firstName', lastName: 'name.lastName' }
            },
            github: {
                providerName: 'github',
                displayName: 'GitHub',
                authUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                userInfoUrl: 'https://api.github.com/user',
                scopes: ['user:email', 'read:user'],
                attributeMapping: { email: 'email', firstName: 'name', avatar: 'avatar_url' }
            },
            microsoft: {
                providerName: 'microsoft',
                displayName: 'Microsoft',
                authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
                tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
                userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
                scopes: ['openid', 'email', 'profile', 'User.Read'],
                attributeMapping: { email: 'mail', firstName: 'givenName', lastName: 'surname' }
            },
            twitter: {
                providerName: 'twitter',
                displayName: 'Twitter / X',
                authUrl: 'https://twitter.com/i/oauth2/authorize',
                tokenUrl: 'https://api.twitter.com/2/oauth2/token',
                userInfoUrl: 'https://api.twitter.com/2/users/me',
                scopes: ['tweet.read', 'users.read'],
                attributeMapping: { email: 'email', firstName: 'name', avatar: 'profile_image_url' }
            },
            linkedin: {
                providerName: 'linkedin',
                displayName: 'LinkedIn',
                authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
                tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
                userInfoUrl: 'https://api.linkedin.com/v2/me',
                scopes: ['r_liteprofile', 'r_emailaddress'],
                attributeMapping: { email: 'email', firstName: 'firstName', lastName: 'lastName' }
            },
            custom: {
                providerName: 'custom',
                displayName: 'Custom Provider',
                authUrl: '',
                tokenUrl: '',
                userInfoUrl: '',
                scopes: [],
                attributeMapping: {}
            }
        }
        
        setFormData({ ...formData, ...config[providerName] || config.custom })
    }

    const handleSave = async () => {
        if (!formData.clientId) {
            setError('Client ID is required')
            return
        }
        
        setSaving(true)
        setError(null)
        
        try {
            const data: any = { ...formData }
            if (clientSecret) {
                data.clientSecret = clientSecret
            }
            
            if (selectedProvider?.id) {
                await identityService.updateOAuthProvider(selectedProvider.id, data)
                setSuccess('Provider updated successfully')
            } else {
                if (!clientSecret) {
                    setError('Client Secret is required for new providers')
                    setSaving(false)
                    return
                }
                await identityService.createOAuthProvider(data)
                setSuccess('Provider created successfully')
            }
            setShowModal(false)
            loadProviders()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to save provider')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (providerId: string) => {
        if (!confirm('Are you sure you want to delete this provider? Users signed up with this provider will need to use another method.')) return
        
        try {
            await identityService.deleteOAuthProvider(providerId)
            setSuccess('Provider deleted successfully')
            loadProviders()
            setTimeout(() => setSuccess(null), 3000)
        } catch (err: any) {
            setError(err.message || 'Failed to delete provider')
        }
    }

    const toggleProvider = async (provider: OAuthProvider) => {
        try {
            await identityService.updateOAuthProvider(provider.id, { isEnabled: !provider.isEnabled })
            loadProviders()
        } catch (err: any) {
            setError(err.message || 'Failed to toggle provider')
        }
    }

    const addScope = () => {
        if (!scopeInput.trim()) return
        const currentScopes = formData.scopes || []
        if (!currentScopes.includes(scopeInput.trim())) {
            setFormData({ ...formData, scopes: [...currentScopes, scopeInput.trim()] })
        }
        setScopeInput('')
    }

    const removeScope = (scope: string) => {
        setFormData({ ...formData, scopes: (formData.scopes || []).filter(s => s !== scope) })
    }

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
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">OAuth Providers</h1>
                        <p className="text-gray-500 text-xs mt-1">Configure social login providers for user authentication.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={loadProviders}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button 
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Provider
                        </button>
                    </div>
                </div>
            </div>

            {/* Providers Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <ArrowPathIcon className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : providers.length === 0 ? (
                    <div className="text-center py-12">
                        <GlobeAltIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">No OAuth providers configured</p>
                        <button onClick={openCreateModal} className="text-blue-600 hover:text-blue-700 font-medium">
                            Add your first provider
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {providers.map(provider => {
                            const config = providerConfig[provider.providerName] || providerConfig.custom
                            return (
                                <div
                                    key={provider.id}
                                    className={`border rounded-xl p-4 ${provider.isEnabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: provider.isEnabled ? config.color : '#9CA3AF' }}
                                            >
                                                {config.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-gray-900">{provider.displayName}</h3>
                                                <p className="text-xs text-gray-500">{provider.providerName}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleProvider(provider)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                provider.isEnabled ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                            title={provider.isEnabled ? 'Disable provider' : 'Enable provider'}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    provider.isEnabled ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <LinkIcon className="w-4 h-4" />
                                            <span className="truncate">{provider.clientId.slice(0, 20)}...</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {(provider.scopes || []).slice(0, 3).map(scope => (
                                                <span key={scope} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                    {scope}
                                                </span>
                                            ))}
                                            {(provider.scopes || []).length > 3 && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                    +{provider.scopes!.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                                        <button
                                            onClick={() => openEditModal(provider)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                            title="Edit provider"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(provider.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Delete provider"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Add/Edit Provider Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{selectedProvider ? 'Edit Provider' : 'Add OAuth Provider'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" title="Close">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Provider Type Selection (only for new) */}
                            {!selectedProvider && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.keys(providerConfig).filter(p => p !== 'custom').map(pName => {
                                            const pConfig = providerConfig[pName]
                                            return (
                                                <button
                                                    key={pName}
                                                    onClick={() => handleProviderSelect(pName)}
                                                    className={`p-3 rounded-lg border text-center transition ${
                                                        formData.providerName === pName 
                                                            ? 'border-blue-500 bg-blue-50' 
                                                            : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div 
                                                        className="w-8 h-8 mx-auto rounded flex items-center justify-center text-white text-sm font-bold mb-1"
                                                        style={{ backgroundColor: pConfig.color }}
                                                    >
                                                        {pConfig.icon}
                                                    </div>
                                                    <span className="text-xs capitalize">{pName}</span>
                                                </button>
                                            )
                                        })}
                                        <button
                                            onClick={() => handleProviderSelect('custom')}
                                            className={`p-3 rounded-lg border text-center transition ${
                                                formData.providerName === 'custom' 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="w-8 h-8 mx-auto rounded bg-gray-400 flex items-center justify-center text-white text-sm font-bold mb-1">
                                                ?
                                            </div>
                                            <span className="text-xs">Custom</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Setup Guide */}
                            {formData.providerName && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                        <GlobeAltIcon className="w-5 h-5" />
                                        Setup Guide: {formData.displayName || formData.providerName}
                                    </h3>
                                    <div className="text-sm text-blue-800 space-y-2">
                                        {getProviderGuide(formData.providerName)}
                                    </div>
                                </div>
                            )}
                            
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                                    <input
                                        type="text"
                                        value={formData.displayName || ''}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="Google"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name *</label>
                                    <input
                                        type="text"
                                        value={formData.providerName || ''}
                                        onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="google"
                                    />
                                </div>
                            </div>
                            
                            {/* Credentials */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 border-b pb-2">Credentials</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Client ID *</label>
                                    <input
                                        type="text"
                                        value={formData.clientId || ''}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                                        placeholder="your-client-id.apps.example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Client Secret {selectedProvider ? '(leave blank to keep current)' : '*'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showClientSecret ? 'text' : 'password'}
                                            value={clientSecret}
                                            onChange={(e) => setClientSecret(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg font-mono text-sm pr-10"
                                            placeholder="your-client-secret"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowClientSecret(!showClientSecret)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            title={showClientSecret ? 'Hide secret' : 'Show secret'}
                                        >
                                            {showClientSecret ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Endpoints */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 border-b pb-2">OAuth Endpoints</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Authorization URL</label>
                                    <input
                                        type="url"
                                        value={formData.authUrl || ''}
                                        onChange={(e) => setFormData({ ...formData, authUrl: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg text-sm"
                                        placeholder="https://accounts.google.com/o/oauth2/v2/auth"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Token URL</label>
                                    <input
                                        type="url"
                                        value={formData.tokenUrl || ''}
                                        onChange={(e) => setFormData({ ...formData, tokenUrl: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg text-sm"
                                        placeholder="https://oauth2.googleapis.com/token"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User Info URL</label>
                                    <input
                                        type="url"
                                        value={formData.userInfoUrl || ''}
                                        onChange={(e) => setFormData({ ...formData, userInfoUrl: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg text-sm"
                                        placeholder="https://www.googleapis.com/oauth2/v3/userinfo"
                                    />
                                </div>
                            </div>
                            
                            {/* Scopes */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 border-b pb-2">Scopes</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={scopeInput}
                                        onChange={(e) => setScopeInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addScope())}
                                        className="flex-1 px-4 py-2 border rounded-lg"
                                        placeholder="openid"
                                    />
                                    <button onClick={addScope} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(formData.scopes || []).map(scope => (
                                        <span key={scope} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                            {scope}
                                            <button onClick={() => removeScope(scope)} className="hover:text-blue-900" title={`Remove ${scope}`} aria-label={`Remove ${scope} scope`}>
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Attribute Mapping */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900 border-b pb-2">Attribute Mapping</h3>
                                <p className="text-sm text-gray-500">Map provider fields to user profile fields</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="text"
                                            value={(formData.attributeMapping as any)?.email || ''}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                attributeMapping: { ...(formData.attributeMapping || {}), email: e.target.value } 
                                            })}
                                            className="w-full px-4 py-2 border rounded-lg text-sm"
                                            placeholder="email"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={(formData.attributeMapping as any)?.firstName || ''}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                attributeMapping: { ...(formData.attributeMapping || {}), firstName: e.target.value } 
                                            })}
                                            className="w-full px-4 py-2 border rounded-lg text-sm"
                                            placeholder="given_name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={(formData.attributeMapping as any)?.lastName || ''}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                attributeMapping: { ...(formData.attributeMapping || {}), lastName: e.target.value } 
                                            })}
                                            className="w-full px-4 py-2 border rounded-lg text-sm"
                                            placeholder="family_name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                                        <input
                                            type="text"
                                            value={(formData.attributeMapping as any)?.avatar || ''}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                attributeMapping: { ...(formData.attributeMapping || {}), avatar: e.target.value } 
                                            })}
                                            className="w-full px-4 py-2 border rounded-lg text-sm"
                                            placeholder="picture"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Status */}
                            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    checked={formData.isEnabled}
                                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                                <div>
                                    <p className="font-medium">Enable Provider</p>
                                    <p className="text-sm text-gray-500">Allow users to sign in with this provider</p>
                                </div>
                            </label>
                        </div>
                        
                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Provider'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
