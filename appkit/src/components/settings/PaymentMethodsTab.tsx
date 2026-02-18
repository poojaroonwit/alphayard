'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { adminService } from '../../services/adminService'

const GATEWAYS = [
    { id: 'stripe', name: 'Stripe', icon: 'S' },
    { id: 'paypal', name: 'PayPal', icon: 'P' },
    { id: 'apple_pay', name: 'Apple Pay', icon: '' },
    { id: 'google_pay', name: 'Google Pay', icon: 'G' },
    { id: 'razorpay', name: 'Razorpay', icon: 'R' },
]

export function PaymentMethodsTab({ app, onSave }: any) {
    const [config, setConfig] = useState<any>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const paymentConfig = app?.settings?.payment || {}
        setConfig(paymentConfig)
    }, [app])

    const handleToggle = (gatewayId: string, enabled: boolean) => {
        setConfig((prev: any) => ({
            ...prev,
            [gatewayId]: {
                ...prev[gatewayId],
                enabled
            }
        }))
    }

    const handleChange = (gatewayId: string, field: string, value: string) => {
        setConfig((prev: any) => ({
            ...prev,
            [gatewayId]: {
                ...prev[gatewayId],
                [field]: value
            }
        }))
    }

    const handleSaveConfig = async () => {
        setSaving(true)
        try {
            const updatedSettings = {
                ...(app.settings || {}),
                payment: config
            }
            
             await adminService.upsertApplicationSetting({
                setting_key: 'payment_methods',
                setting_value: config,
                category: 'payment'
             })
             
             await onSave({ settings: updatedSettings })
        } catch (error) {
            console.error('Failed to save payment config:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                         <h2 className="text-xl font-semibold text-white">Payment Methods</h2>
                         <p className="text-gray-400">Enable and configure payment gateways for your app.</p>
                    </div>
                     <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium border border-yellow-200">
                        Mockup Mode
                    </span>
                </div>
                 
                 <div className="grid grid-cols-1 gap-4">
                    {GATEWAYS.map(gateway => {
                        const gatewayConfig = config[gateway.id] || { enabled: false, apiKey: '', secretKey: '' }
                        return (
                            <div key={gateway.id} className={`border rounded-xl p-4 transition-all ${gatewayConfig.enabled ? 'border-indigo-200 bg-indigo-50/10 shadow-sm' : 'border-gray-200 opacity-80'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                            {gateway.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{gateway.name}</h3>
                                            <p className="text-xs text-gray-500">Process payments via {gateway.name}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={gatewayConfig.enabled}
                                            onChange={(e) => handleToggle(gateway.id, e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {gatewayConfig.enabled && (
                                    <div className="mt-4 pl-14 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Public / Publishable Key</label>
                                            <input 
                                                type="text" 
                                                value={gatewayConfig.apiKey || ''}
                                                onChange={(e) => handleChange(gateway.id, 'apiKey', e.target.value)}
                                                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                                placeholder={`pk_live_...`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Secret Key</label>
                                            <input 
                                                type="password" 
                                                value={gatewayConfig.secretKey || ''}
                                                onChange={(e) => handleChange(gateway.id, 'secretKey', e.target.value)}
                                                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                                placeholder="sk_live_..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                 </div>

                 <div className="mt-8 flex justify-end border-t pt-4">
                    <Button variant="primary" onClick={handleSaveConfig} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                 </div>
            </div>
        </div>
    )
}
