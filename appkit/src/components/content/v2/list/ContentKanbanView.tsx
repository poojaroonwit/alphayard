'use client'

import React, { memo } from 'react'
import { ContentItem } from './ContentItem'
// import { useContentContext } from '../providers/ContentProvider'

interface Props { content: any[] }

export const ContentKanbanView: React.FC<Props> = memo(({ content }) => {
  // TODO: Implement with proper context
  const columns = [
    { key: 'draft', title: 'Draft' },
    { key: 'published', title: 'Published' },
    { key: 'archived', title: 'Archived' }
  ] as const
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => (
        <div key={col.key} className="bg-gray-50 border rounded-lg">
          <div className="px-4 py-2 border-b font-medium text-gray-700">{col.title}</div>
          <div className="p-2 space-y-2">
            {content.filter((p) => p.status === col.key).map((page) => (
              <div key={page.id} className="bg-white border rounded-lg p-4">
                <h3 className="font-semibold">{page.title}</h3>
                <p className="text-sm text-gray-600">{page.slug}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})

ContentKanbanView.displayName = 'ContentKanbanView'

export default ContentKanbanView


