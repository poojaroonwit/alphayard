'use client'

import { useState, useEffect } from 'react'
import { configService } from '../../../../services/configService'

export default function OtpSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState<any>({
        emailProvider: 'mock',
        smsProvider: 'mock',
        emailTemplate: { subject: '', body: '' },
        smsTemplate: '',
        emailProviderSettings: {},
        smsProviderSettings: {}
    })

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            const data = await configService.getOtpConfig()
            if (data) setConfig(data)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await configService.updateOtpConfig(config)
            alert('OTP Settings saved successfully')
        } catch (e) {
            alert('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">OTP & Notification Settings</h1>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Provider</label>
                        <select
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={config.emailProvider}
                            onChange={(e) => setConfig({ ...config, emailProvider: e.target.value })}
                        >
                            <option value="mock">Mock (Development)</option>
                            <option value="sendgrid">SendGrid</option>
                            <option value="smtp">SMTP</option>
                        </select>
                    </div>

                    {/* Template Section */}
                    <div className="border-t pt-4 mt-2">
                        <h3 className="font-medium mb-2">OTP Email Template</h3>
                        <div className="gap-4 grid">
                            <div>
                                <label className="block text-sm text-gray-600">Subject</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={config.emailTemplate?.subject || ''}
                                    onChange={(e) => setConfig({ ...config, emailTemplate: { ...config.emailTemplate, subject: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600">Body (Support HTML)</label>
                                <textarea
                                    className="w-full border p-2 rounded h-32"
                                    value={config.emailTemplate?.body || ''}
                                    onChange={(e) => setConfig({ ...config, emailTemplate: { ...config.emailTemplate, body: e.target.value } })}
                                    placeholder="Your verification code is {{otp}}"
                                />
                                <p className="text-xs text-gray-500 mt-1">Available variables: {'{{otp}}'}, {'{{name}}'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">SMS Configuration</h2>
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">SMS Provider</label>
                        <select
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={config.smsProvider}
                            onChange={(e) => setConfig({ ...config, smsProvider: e.target.value })}
                        >
                            <option value="mock">Mock</option>
                            <option value="twilio">Twilio</option>
                        </select>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h3 className="font-medium mb-2">OTP SMS Message</h3>
                        <div>
                            <label className="block text-sm text-gray-600">Message Body</label>
                            <textarea
                                className="w-full border p-2 rounded h-24"
                                value={config.smsTemplate || ''}
                                onChange={(e) => setConfig({ ...config, smsTemplate: e.target.value })}
                                placeholder="Your code is {{otp}}"
                            />
                            <p className="text-xs text-gray-500 mt-1">Available variables: {'{{otp}}'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Configuration'}
                </button>
            </div>
        </div>
    )
}
