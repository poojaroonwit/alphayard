'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { RichTextEditor } from '../cms/RichTextEditor'
import { adminService } from '../../services/adminService'

export function TeamTab({ app, onSave }: any) {
    const [content, setContent] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const teamInfo = app?.settings?.team_info || ''
        setContent(teamInfo)
    }, [app])

    const handleSave = async () => {
        setSaving(true)
        try {
            const updatedSettings = {
                ...(app.settings || {}),
                team_info: content
            }
            
             await adminService.upsertApplicationSetting({
                setting_key: 'team_info',
                setting_value: content,
                category: 'general'
             })
             
             await onSave({ settings: updatedSettings })
        } catch (error) {
            console.error('Failed to save team info:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Team Information</h2>
                    <p className="text-gray-500">Manage the content for the Team section.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Describe your team..."
                            className="min-h-[400px]"
                        />
                    </div>
                </div>

                 <div className="mt-8 flex justify-end border-t pt-4">
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                 </div>
            </div>
        </div>
    )
}
