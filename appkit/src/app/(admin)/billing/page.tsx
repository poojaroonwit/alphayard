'use client'

import React from 'react'
import { PaymentMethodsTab } from '../../../components/settings/PaymentMethodsTab'
import { useApp } from '../../../contexts/AppContext'
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

export default function BillingPage() {
    const { currentApp, refreshApplications } = useApp()

    if (!currentApp) {
        return (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                    <DevicePhoneMobileIcon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">No App Selected</h2>
                <p className="text-gray-500 mt-2">Please select an application to manage billing.</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
             <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
                     <p className="text-gray-500">Configure monetization and payment gateways.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1">
                 <PaymentMethodsTab app={currentApp} onSave={refreshApplications} />
            </div>
        </div>
    )
}
