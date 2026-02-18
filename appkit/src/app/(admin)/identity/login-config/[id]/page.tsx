'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { LoginConfigManager } from '../../../../../components/settings/LoginConfigManager'

export default function AppLoginConfigPage() {
    const params = useParams()
    const appId = params?.id as string

    if (!appId) {
        return <div>Invalid Application ID</div>
    }

    return (
        <div className="space-y-6">
            <LoginConfigManager appId={appId} />
        </div>
    )
}
