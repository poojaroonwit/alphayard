'use client'

import React from 'react'
import { ContentTypes } from './ContentTypes'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { ContentPage } from '../../hooks/useContentManagement'

interface ContentStudioProps {
  applicationId?: string
  isContentStudio?: boolean
  initialMode?: string
  selectedContentId?: string
  onContentSelect?: (content: ContentPage) => void
  onContentPublish?: (content: ContentPage) => void
  onContentSchedule?: (content: ContentPage, scheduleDate: Date) => void
}

export const ContentStudio: React.FC<ContentStudioProps> = ({ applicationId = '' }) => {
  return (
    <ErrorBoundary>
      <ContentTypes applicationId={applicationId} />
    </ErrorBoundary>
  )
}
