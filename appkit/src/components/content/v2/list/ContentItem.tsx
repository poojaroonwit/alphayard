'use client'

import React, { memo } from 'react'
import { ContentItem as LegacyContentItem } from '../../list/ContentItem'

interface ContentItemProps {
  page: any
  viewMode: 'grid' | 'list'
  isSelected: boolean
  onSelect: (page: any) => void
  onEdit: (page: any) => void
  onDelete: (pageId: string) => void
  onDuplicate: (page: any) => void
  onPublish: (page: any) => void
  onPreview: (page: any) => void
}

export const ContentItem: React.FC<ContentItemProps> = memo((props) => {
  return <LegacyContentItem {...props} />
})

ContentItem.displayName = 'ContentItem'

export default ContentItem


