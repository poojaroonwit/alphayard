'use client'

import React, { memo } from 'react'
import { useContentContext } from '../providers/ContentProvider'
import { ContentItem } from './ContentItem'
import { ContentGridView } from './ContentGridView'
import { ContentKanbanView } from './ContentKanbanView'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { Pagination } from './Pagination'
import { Card, CardBody } from '../../ui/Card'

export const ContentListView: React.FC = memo(() => {
  const { state, actions, contentData, filteredContent, paginatedContent } = useContentContext()

  if (contentData.loading) {
    return <LoadingState />
  }

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

  if (filteredContent.length === 0) {
    return (
      <EmptyState
        title="No content found"
        description={
          state.searchTerm || state.filterType !== 'all' || state.filterStatus !== 'all'
            ? 'No content matches your current filters. Try adjusting your search criteria.'
            : 'Your content library is empty. Create your first content page to get started.'
        }
        action={{ label: 'Create Content', onClick: actions.handleCreateNew }}
        onClearFilters={
          state.searchTerm || state.filterType !== 'all' || state.filterStatus !== 'all'
            ? () => {
                // Clear filters
                actions.setSearchTerm?.('')
              }
            : undefined
        }
      />
    )
  }

  const renderView = () => {
    switch (state.viewMode) {
      case 'grid':
        return <ContentGridView content={paginatedContent} />
      case 'list':
      default:
        return <List content={paginatedContent} />
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="frosted">
        <CardBody className="p-0">
          {renderView()}
        </CardBody>
      </Card>

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
          onPreview={(p) => console.log('Preview page:', p)}
        />
      ))}
    </div>
  )
})

ContentListView.displayName = 'ContentListView'

export default ContentListView
