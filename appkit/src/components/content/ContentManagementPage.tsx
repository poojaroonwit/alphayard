'use client'

import React, { Suspense } from 'react'
import { ContentProvider } from './providers/ContentProvider'
import { ContentLayout } from './layout/ContentLayout'
import { ContentHeader } from './header/ContentHeader'
import { ContentFilters } from './filters/ContentFilters'
import { ContentEditor } from './editor/ContentEditor'
import { ContentTemplates } from './templates/ContentTemplates'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { SEOMetadata } from '../ui/SEOMetadata'
// Temporary: reuse the refactored list view from the refactor folder until list is fully migrated
import { ContentListView } from './list/ContentListView'

export const ContentManagementPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <SEOMetadata
        title="Content Management"
        description="Create and manage dynamic content with our powerful drag-and-drop editor. Build marketing pages, news articles, and interactive content."
        keywords={['content management', 'CMS', 'drag and drop', 'dynamic content', 'marketing', 'editor']}
      />
      
      <ContentProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <ContentLayout>
            <ContentHeader />
            <ContentFilters />
            <ContentListView />
            <ContentEditor />
            <ContentTemplates />
          </ContentLayout>
        </Suspense>
      </ContentProvider>
    </ErrorBoundary>
  )
}

export default ContentManagementPage
