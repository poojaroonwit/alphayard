'use client'

import React, { memo, useMemo } from 'react'
import { useContentContext } from '../providers/ContentProvider'
import { ContentItem } from './ContentItem'
import { ContentGrid } from './ContentGrid'
import { ContentListView } from './ContentListView'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { LoadingState } from '../../ui/LoadingState'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

/**
 * Main content list component
 * Handles rendering of content items in different view modes
 */
export const ContentList: React.FC = memo(() => {
  const { state, actions, contentData } = useContentContext()

  // Memoized content items
  const contentItems = useMemo(() => {
    return contentData.contentPages.map((page) => (
      <ContentItem
        key={page.id}
        page={page}
        viewMode={state.viewMode}
        isSelected={state.selectedPages.has(page.id)}
        onSelect={actions.handleSelectPage}
        onEdit={actions.handleEdit}
        onDelete={(id) => actions.setShowDeleteConfirm(id)}
        onDuplicate={actions.handleDuplicate}
        onPublish={actions.handlePublish}
        onPreview={(page) => {
          // TODO: Implement preview functionality
          console.log('Preview page:', page)
        }}
      />
    ))
  }, [contentData.contentPages, state.viewMode, state.selectedPages, actions])

  // Loading state
  if (contentData.loading) {
    return <LoadingState />
  }

  // Error state
  if (contentData.error) {
    return (
      <ErrorState
        title="Failed to load content"
        description="We couldn't load your content pages. Please try again."
        error={contentData.error}
        onRetry={contentData.refreshContent}
      />
    )
  }

  // Empty state
  if (contentData.contentPages.length === 0) {
    return (
      <EmptyState
        icon={<DocumentTextIcon className="h-12 w-12" />}
        title="No content found"
        description="Create your first content page to get started!"
        action={{
          label: "Create Content",
          onClick: actions.handleCreateNew
        }}
      />
    )
  }

  // Render based on view mode
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Bulk Actions */}
      {state.selectedPages.size > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {state.selectedPages.size} item{state.selectedPages.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => actions.setSelectedPages(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
              <button
                onClick={actions.handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {state.selectedPages.size === contentData.contentPages.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Items */}
      <div className="p-6">
        {state.viewMode === 'grid' ? (
          <ContentGrid>
            {contentItems}
          </ContentGrid>
        ) : (
          <div className="divide-y divide-gray-200">
            {contentItems}
          </div>
        )}
      </div>
    </div>
  )
})

ContentList.displayName = 'ContentList'
