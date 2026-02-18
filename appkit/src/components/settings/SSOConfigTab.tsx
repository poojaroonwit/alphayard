
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { adminService } from '../../services/adminService'

// Brand Icons (Inline SVGs for reliability)
const ICONS = {
    google: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
    facebook: <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    microsoft: <svg className="w-5 h-5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>,
    apple: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 384 512"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/></svg>,
    whatsapp: <svg className="w-5 h-5" fill="#25D366" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>,
    twitter: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zl-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    line: <svg className="w-5 h-5" fill="#06C755" viewBox="0 0 24 24"><path d="M21.503 9.4c-1.492-5.69-12.783-6.495-17.514-1.265C.61 12.006 3.655 19.349 9.8 19.349c1.9 0 3.395-.453 3.395-.453.301-.093.551-.013.626.353.111.551.402 2.147.402 2.147.16.892.836.52 1.154.296 4.706-3.327 7.09-8.736 6.126-12.292zm-5.64 5.32H8.381c-.482 0-.874-.392-.874-.874V9c0-.482.392-.874.874-.874s.874.392.874.874v4.062h5.734c.482 0 .874.392.874.874 0 .481-.392.874-.874.874z"/></svg>
}

const PROVIDERS = [
    { id: 'google', name: 'Google', icon: ICONS.google },
    { id: 'facebook', name: 'Facebook', icon: ICONS.facebook },
    { id: 'microsoft', name: 'Microsoft', icon: ICONS.microsoft },
    { id: 'apple', name: 'Apple', icon: ICONS.apple },
    { id: 'whatsapp', name: 'WhatsApp', icon: ICONS.whatsapp },
    { id: 'twitter', name: 'X (Twitter)', icon: ICONS.twitter },
    { id: 'line', name: 'LINE', icon: ICONS.line },
]

export function SSOConfigTab({ app, onSave }: any) {
    const [config, setConfig] = useState<any>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const ssoConfig = app?.settings?.auth?.sso || {}
        setConfig(ssoConfig)
    }, [app])

    const handleToggle = (providerId: string, enabled: boolean) => {
        setConfig((prev: any) => ({
            ...prev,
            [providerId]: {
                ...prev[providerId],
                enabled
            }
        }))
    }

    const handleChange = (providerId: string, field: string, value: string) => {
        setConfig((prev: any) => ({
            ...prev,
            [providerId]: {
                ...prev[providerId],
                [field]: value
            }
        }))
    }

    const handleSaveConfig = async () => {
        setSaving(true)
        try {
            const updatedSettings = {
                ...(app.settings || {}),
                auth: {
                    ...(app.settings?.auth || {}),
                    sso: config
                }
            }
            await onSave({ settings: updatedSettings })
        } catch (error) {
            console.error('Failed to save SSO config:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Social Sign-On</h2>
                        <p className="text-sm text-gray-500 mt-1">Configure external identity providers for user authentication.</p>
                    </div>
                </div>
                 
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {PROVIDERS.map(provider => {
                        const providerConfig = config[provider.id] || { enabled: false, clientId: '', clientSecret: '' }
                        return (
                            <div 
                                key={provider.id} 
                                className={`
                                    relative border rounded-xl p-5 transition-all duration-200
                                    ${providerConfig.enabled 
                                        ? 'border-blue-200 bg-blue-50/20 shadow-sm ring-1 ring-blue-100' 
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                                    }
                                `}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 flex items-center justify-center">
                                            {React.cloneElement(provider.icon as React.ReactElement, { className: "w-6 h-6" })}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">{provider.name}</h3>
                                            <p className="text-xs text-gray-500">
                                                {providerConfig.enabled ? 'Enabled' : 'Disabled'}
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={providerConfig.enabled}
                                            onChange={(e) => handleToggle(provider.id, e.target.checked)}
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                    </label>
                                </div>

                                {providerConfig.enabled && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 pt-4 border-t border-gray-100 mt-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Client ID</label>
                                            <input 
                                                type="text" 
                                                value={providerConfig.clientId || ''}
                                                onChange={(e) => handleChange(provider.id, 'clientId', e.target.value)}
                                                className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                                                placeholder={`Enter ${provider.name} Client ID`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Client Secret</label>
                                            <input 
                                                type="password" 
                                                value={providerConfig.clientSecret || ''}
                                                onChange={(e) => handleChange(provider.id, 'clientSecret', e.target.value)}
                                                className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none transition-all font-mono"
                                                placeholder="••••••••••••••••"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                 </div>

                 <div className="mt-8 flex justify-end">
                    <Button 
                        type="button"
                        onClick={handleSaveConfig} 
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow transition-all px-4 py-2 text-sm font-medium rounded-md"
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                 </div>
            </div>
        </div>
    )
}
