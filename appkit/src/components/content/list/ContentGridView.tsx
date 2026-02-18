'use client'

import React, { memo } from 'react'
import { ContentItem } from './ContentItem'
import { useContentContext } from '../providers/ContentProvider'

interface Props { content: any[] }

export const ContentGridView: React.FC<Props> = memo(({ content }) => {
  const { state, actions } = useContentContext()
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {content.map((page) => (
        <div key={page.id} className="border rounded-lg overflow-hidden">
          <ContentItem
            page={page}
            viewMode="grid"
            isSelected={state.selectedPages.has(page.id)}
            onSelect={actions.handleSelectPage}
            onEdit={actions.handleEdit}
            onDelete={(id) => actions.setShowDeleteConfirm(id)}
            onDuplicate={actions.handleDuplicate}
            onPublish={actions.handlePublish}
            onPreview={(p) => console.log('Preview page:', p)}
          />
        </div>
      ))}
    </div>
  )
})

ContentGridView.displayName = 'ContentGridView'

export default ContentGridView


