'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { CollectionSchemaBuilder, CollectionSchemaData } from '../../../../../components/collections/CollectionSchemaBuilder'
import { adminService } from '../../../../../services/adminService'
import { useApp } from '../../../../../contexts/AppContext'

export default function NewCollectionPage() {
    const router = useRouter()
    const { currentApp } = useApp()

    const handleSave = async (data: CollectionSchemaData) => {
        await adminService.createEntityType({
            name: data.name,
            displayName: data.displayName,
            description: data.description,
            applicationId: currentApp?.id,
            schema: { fields: data.fields },
            icon: data.icon,
            category: data.category // Pass category
        })

        // Navigate back to collections list
        router.push('/collections')
    }

    const handleCancel = () => {
        router.push('/collections')
    }

    return (
        <CollectionSchemaBuilder
            onSave={handleSave}
            onCancel={handleCancel}
        />
    )
}
