'use client'

import React from 'react'
import { OrganizationManagement } from '@/components/settings/OrganizationManagement'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'

export default function OrganizationPage() {
    return (
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                        <BuildingOfficeIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Organization Management
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 mt-1">
                        Configure your company profile, domain, and global support settings.
                    </p>
                </div>
            </div>

            <OrganizationManagement />
        </div>
    )
}
