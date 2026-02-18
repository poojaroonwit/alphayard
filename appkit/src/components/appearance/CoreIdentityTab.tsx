'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { PencilSquareIcon, GlobeAltIcon, IdentificationIcon } from '@heroicons/react/24/outline'

interface CoreIdentityTabProps {
    app: any
    onSave: (updatedData: any) => Promise<void>
}

export function CoreIdentityTab({ app, onSave }: CoreIdentityTabProps) {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (app) {
            setFormData({
                name: app.name || '',
                slug: app.slug || '',
                description: app.description || ''
            })
        }
    }, [app])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave({
                ...app,
                name: formData.name,
                description: formData.description
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">App Identity</h2>
                    <p className="text-gray-500 font-medium">Define your application's public profile and technical slug.</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-2xl">
                    <IdentificationIcon className="w-6 h-6 text-blue-600" />
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <PencilSquareIcon className="w-3 h-3" />
                            Application Name
                        </label>
                        <input 
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-semibold text-gray-900 shadow-sm"
                            placeholder="e.g. Acme Admin Pro"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                            <GlobeAltIcon className="w-3 h-3" />
                            URL Slug (Immutable)
                        </label>
                        <div className="relative">
                            <input 
                                value={formData.slug}
                                readOnly
                                className="w-full h-12 px-4 rounded-xl border border-gray-100 bg-gray-50/50 text-gray-400 font-mono text-sm outline-none cursor-not-allowed"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-bold text-gray-400 uppercase">System ID</div>
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description</label>
                        <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 shadow-sm resize-none"
                            placeholder="Provide a brief overview of what this application does..."
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <Button 
                        type="submit" 
                        disabled={isSaving}
                        className="h-12 px-10 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-xl shadow-gray-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSaving ? 'Synchronizing...' : 'Save Identity'}
                    </Button>
                </div>
            </form>

            {/* Dev Insight Card */}
            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100/50 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-xl">💡</span>
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-900">Technical Tip</h4>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                        The application name is used for SEO, push notification headers, and cross-platform branding. Changes reflect instantly across all connected mobile clients.
                    </p>
                </div>
            </div>
        </div>
    )
}
