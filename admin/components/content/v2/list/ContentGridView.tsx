'use client'

import React, { memo } from 'react'
import { ContentItem } from './ContentItem'
// import { useContentContext } from '../providers/ContentProvider'

interface Props { content: any[] }

export const ContentGridView: React.FC<Props> = memo(({ content }) => {
  // TODO: Implement with proper context
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {content.map((page) => (
        <div key={page.id} className="border rounded-lg overflow-hidden p-4">
          <h3 className="font-semibold">{page.title}</h3>
          <p className="text-sm text-gray-600">{page.slug}</p>
        </div>
      ))}
    </div>
  )
})

ContentGridView.displayName = 'ContentGridView'

export default ContentGridView


