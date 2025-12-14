'use client'

import React, { memo, useMemo } from 'react'
import { useContentContext } from '../providers/ContentProviderV2'
import { ContentItem } from './ContentItem'
import { ContentGridView } from './ContentGridView'
import { ContentKanbanView } from './ContentKanbanView'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { Pagination } from './Pagination'

/**
 * Enhanced content list view component
 * Features:
 * - Multiple view modes (grid, list, kanban)
 * - Pagination
 * - Loading and error states
 * - Empty state handling
 * - Performance optimizations
 */
export const ContentListView: React.FC = memo(() => {
  const { state, actions, contentData, filteredContent, paginatedContent } = useContentContext()

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
  if (filteredContent.length === 0) {
    return (
      <EmptyState
        title="No content found"
        description={
          state.searchTerm || state.filterType !== 'all' || state.filterStatus !== 'all'
            ? "No content matches your current filters. Try adjusting your search criteria."
            : "Your content library is empty. Create your first content page to get started."
        }
        action={{
          label: "Create Content",
          onClick: actions.handleCreateNew
        }}
        onClearFilters={
          state.searchTerm || state.filterType !== 'all' || state.filterStatus !== 'all'
            ? actions.clearFilters
            : undefined
        }
      />
    )
  }

  // Render based on view mode
  const renderView = () => {
    switch (state.viewMode) {
      case 'grid':
        return <ContentGridView content={paginatedContent} />
      case 'kanban':
        return <ContentKanbanView content={paginatedContent} />
      case 'list':
      default:
        return <List content={paginatedContent} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Content View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {renderView()}
      </div>

      {/* Pagination */}
      {filteredContent.length > state.pageSize && (
        <Pagination
          currentPage={state.currentPage}
          totalPages={Math.ceil(filteredContent.length / state.pageSize)}
          onPageChange={actions.setCurrentPage}
          totalItems={filteredContent.length}
          itemsPerPage={state.pageSize}
        />
      )}
    </div>
  )
})

// List View Component
const List: React.FC<{ content: any[] }> = memo(({ content }) => {
  const { state, actions } = useContentContext()

  return (
    <div className="divide-y divide-gray-200">
      {content.map((page) => (
        <ContentItem
          key={page.id}
          page={page}
          viewMode="list"
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
      ))}
    </div>
  )
})

ContentListView.displayName = 'ContentListView'
