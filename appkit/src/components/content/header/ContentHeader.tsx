'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  RectangleStackIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { useContentContext } from '../providers/ContentProvider'
import { Card, CardBody } from '../../ui/Card'
import { Button } from '../../ui/Button'

/**
 * Header component for content management
 * Contains the main title, description, and primary actions
 */
export const ContentHeader: React.FC = () => {
  const { state, actions, contentData } = useContentContext()

  return (
    <Card variant="frosted">
      <CardBody>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Title and Description */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <DocumentTextIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Content Management <span className="text-green-600 text-sm font-normal">✨ REFACTORED</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Create and manage dynamic content with our powerful drag-and-drop editor
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              onClick={() => actions.setShowTemplates(true)}
            >
              <RectangleStackIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Templates
            </Button>
            <Button
              variant="primary"
              onClick={actions.handleCreateNew}
            >
              <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Create Content
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="default" hoverable>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Content</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {contentData?.contentPages?.length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-md">
                  <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="default" hoverable>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Published</p>
                  <p className="text-3xl font-bold text-green-600">
                    {contentData?.contentPages?.filter(p => p.status === 'published').length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                  <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </div>
            </CardBody>
          </Card>
          <Card variant="default" hoverable>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Drafts</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {contentData?.contentPages?.filter(p => p.status === 'draft').length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-md">
                  <DocumentTextIcon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </CardBody>
    </Card>
  )
}
