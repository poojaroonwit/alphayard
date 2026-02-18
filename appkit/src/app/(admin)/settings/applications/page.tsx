'use client'

import React, { useState, useEffect } from 'react'
import { useApp } from '../../../../contexts/AppContext'
import axios from 'axios'

interface Application {
    id: string
    name: string
    slug: string
    description?: string
    is_active: boolean
}

export default function ApplicationsPage() {
    const { applications, refreshApplications } = useApp()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState<{
        name: string
        slug: string
        description: string
        settings?: { google_analytics_id?: string }
    }>({ name: '', slug: '', description: '', settings: {} })
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError('')
        try {
            await axios.post('/api/admin/applications', formData)
            await refreshApplications()
            setIsModalOpen(false)
            setFormData({ name: '', slug: '', description: '' })
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save application')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
                    <p className="text-gray-500">Manage mobile applications supported by this platform.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Add Application
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{app.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{app.slug}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500 truncate max-w-xs">{app.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <a href={`/settings/applications/${app.id}`} className="text-blue-600 hover:text-blue-900">
                                        Manage
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold">Add Application</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. My App"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. my-app"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={3}
                                    placeholder="Brief description..."
                                />
                            </div>
                            
                            <div className="pt-2 border-t mt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Integrations</h4>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
                                    <input
                                        type="text"
                                        value={formData.settings?.google_analytics_id || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            settings: { ...formData.settings, google_analytics_id: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="G-XXXXXXXXXX"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Enter your GA4 Measurement ID to enable tracking for this application.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
