'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { RichTextEditor } from '../cms/RichTextEditor'
import { adminService } from '../../services/adminService'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { DocumentTextIcon, LinkIcon, EnvelopeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export function TermsPolicyTab({ app, onSave }: any) {
    const [config, setConfig] = useState({
        terms: '',
        privacy: '',
        version: '1.0',
        privacyPolicyUrl: '',
        termsOfServiceUrl: '',
        cookiePolicyUrl: '',
        dataDeletionUrl: '',
        dataRequestEmail: ''
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const legalConfig = app?.settings?.legal || {}
        setConfig(prev => ({ ...prev, ...legalConfig }))
    }, [app])

    const updateConfig = (field: string, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }))
    }

    const handleSaveConfig = async () => {
        setSaving(true)
        try {
            const updatedSettings = {
                ...(app.settings || {}),
                legal: config
            }
            
             await adminService.upsertApplicationSetting({
                setting_key: 'legal_docs',
                setting_value: config,
                category: 'legal'
             })
             
             await onSave({ settings: updatedSettings })
        } catch (error) {
            console.error('Failed to save legal docs:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Header / Version */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Legal & Compliance Hub</h2>
                    <p className="text-sm text-gray-500">Manage your legal documents and compliance URLs here.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                    <Label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Policy Version</Label>
                    <input
                        type="text"
                        value={config.version}
                        onChange={(e) => updateConfig('version', e.target.value)}
                        className="w-20 px-3 py-1 bg-gray-50 border-none rounded-lg text-sm text-center font-mono focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* External Links Section */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-xl">
                <CardHeader className="border-b border-gray-100/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                            <LinkIcon className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-base">External Policy URLs</CardTitle>
                    </div>
                </CardHeader>
                <CardBody className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-500">Privacy Policy URL</Label>
                            <Input 
                                value={config.privacyPolicyUrl}
                                onChange={(e) => updateConfig('privacyPolicyUrl', e.target.value)}
                                placeholder="https://example.com/privacy"
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-500">Terms of Service URL</Label>
                            <Input 
                                value={config.termsOfServiceUrl}
                                onChange={(e) => updateConfig('termsOfServiceUrl', e.target.value)}
                                placeholder="https://example.com/terms"
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-500">Cookie Policy URL</Label>
                            <Input 
                                value={config.cookiePolicyUrl}
                                onChange={(e) => updateConfig('cookiePolicyUrl', e.target.value)}
                                placeholder="https://example.com/cookies"
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-500">Data Deletion Instructions URL</Label>
                            <Input 
                                value={config.dataDeletionUrl}
                                onChange={(e) => updateConfig('dataDeletionUrl', e.target.value)}
                                placeholder="https://example.com/delete-account"
                                className="text-sm"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-xs font-semibold text-gray-500 flex items-center gap-2">
                                <EnvelopeIcon className="w-3.5 h-3.5" />
                                Data Subject Request Email (GDPR/CCPA)
                            </Label>
                            <Input 
                                value={config.dataRequestEmail}
                                onChange={(e) => updateConfig('dataRequestEmail', e.target.value)}
                                placeholder="privacy@yourcompany.com"
                                className="text-sm"
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Embedded Content Section */}
            <div className="space-y-6">
                <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                                <DocumentTextIcon className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-base font-bold">In-App Terms Content</CardTitle>
                        </div>
                    </CardHeader>
                    <CardBody className="p-6">
                        <RichTextEditor
                            content={config.terms || ''}
                            onChange={(content) => updateConfig('terms', content)}
                            placeholder="# Terms of Service\n\n1. Acceptance of Terms..."
                            className="min-h-[250px]"
                        />
                    </CardBody>
                </Card>

                <Card className="border-0 shadow-sm ring-1 ring-gray-200/50 bg-white">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            <CardTitle className="text-base font-bold">In-App Privacy Policy Content</CardTitle>
                        </div>
                    </CardHeader>
                    <CardBody className="p-6">
                        <RichTextEditor
                            content={config.privacy || ''}
                            onChange={(content) => updateConfig('privacy', content)}
                            placeholder="# Privacy Policy\n\nWe collect..."
                            className="min-h-[250px]"
                        />
                    </CardBody>
                </Card>
            </div>

             <div className="flex justify-end pt-4">
                <Button 
                    variant="primary" 
                    onClick={handleSaveConfig} 
                    disabled={saving}
                    className="bg-black hover:bg-gray-800 text-white h-11 px-10 shadow-lg shadow-black/20"
                >
                    {saving ? 'Saving...' : 'Publish Legal Updates'}
                </Button>
             </div>
        </div>
    )
}
