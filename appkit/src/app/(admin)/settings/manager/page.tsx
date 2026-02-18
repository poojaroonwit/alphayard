'use client'

import { useState, useEffect } from 'react'
import { configService } from '../../../../services/configService'

export default function ManagerSignupSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState<any>({
        allowSignup: false,
        requireApproval: true,
        domainsAllowed: []
    })

    useEffect(() => {
        loadConfig()
    }, [])

    const loadConfig = async () => {
        try {
            const data = await configService.getManagerSignupConfig()
            if (data) setConfig(data)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await configService.updateManagerSignupConfig(config)
            alert('Settings saved successfully')
        } catch (e) {
            alert('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const handleDomainChange = (val: string) => {
        const domains = val.split(',').map(d => d.trim()).filter(d => d);
        setConfig({ ...config, domainsAllowed: domains });
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Manager Signup Settings</h1>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Signup Controls</h2>

                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="allowSignup"
                            checked={config.allowSignup}
                            onChange={(e) => setConfig({ ...config, allowSignup: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allowSignup" className="ml-2 block text-sm text-gray-900">
                            Allow Public Manager Registration
                        </label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="requireApproval"
                            checked={config.requireApproval}
                            onChange={(e) => setConfig({ ...config, requireApproval: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="requireApproval" className="ml-2 block text-sm text-gray-900">
                            Require Admin Approval for New Accounts
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Allowed Email Domains (Optional)</label>
                        <p className="text-xs text-gray-500 mb-1">Comma separated (e.g. company.com, partner.org). Leave empty for all.</p>
                        <input
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            value={config.domainsAllowed?.join(', ') || ''}
                            onChange={(e) => handleDomainChange(e.target.value)}
                            placeholder="example.com"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    )
}
