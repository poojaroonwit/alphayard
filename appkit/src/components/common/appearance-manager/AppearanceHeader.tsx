
import React from 'react'
import { Button } from '../../ui/Button'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface AppearanceHeaderProps {
    appName?: string
    onReset: () => void
    onSave: () => void
    isSaving: boolean
}

export function AppearanceHeader({ appName, onReset, onSave, isSaving }: AppearanceHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 lg:px-0">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">App Configuration</h1>
                <p className="text-gray-500 mt-2 text-lg">
                    Manage the functional and visual "Brain" of <span className="font-semibold text-gray-900">{appName || 'your app'}</span>
                </p>
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" className="text-gray-500 hover:text-gray-900" onClick={onReset}>
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Reset
                </Button>
                <Button onClick={onSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}
