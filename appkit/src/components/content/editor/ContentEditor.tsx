'use client'

import React from 'react'
import { useContentContext } from '../providers/ContentProvider'
import { LookerStudioEditor } from '../../cms/LookerStudioEditor'

/**
 * Content editor component
 * Handles the content editing interface
 */
export const ContentEditor: React.FC = () => {
  const { state, actions, contentData } = useContentContext()

  if (!state.showEditor) {
    return null
  }

  const handleSave = async (page: any) => {
    try {
      if (page.id) {
        await contentData.updateContent(page.id, page)
        actions.showNotification('success', 'Content updated successfully')
      } else {
        await contentData.createContent(page)
        actions.showNotification('success', 'Content created successfully')
      }
      actions.setShowEditor(false)
      actions.setEditingPage(null)
    } catch (error) {
      actions.showNotification('error', 'Failed to save content')
    }
  }

  const handleCancel = () => {
    actions.setShowEditor(false)
    actions.setEditingPage(null)
  }

  const handlePublish = async (page: any) => {
    try {
      await contentData.publishContent(page.id)
      actions.showNotification('success', 'Content published successfully')
      actions.setShowEditor(false)
      actions.setEditingPage(null)
    } catch (error) {
      actions.showNotification('error', 'Failed to publish content')
    }
  }

  const handlePreview = (page: any) => {
    console.log('Previewing content:', page.title)
    // TODO: Implement preview logic
  }

  const handleDuplicate = async (page: any) => {
    try {
      await contentData.duplicateContent(page.id)
      actions.showNotification('success', 'Content duplicated successfully')
    } catch (error) {
      actions.showNotification('error', 'Failed to duplicate content')
    }
  }

  return (
    <LookerStudioEditor
      page={state.editingPage || undefined}
      onSave={handleSave}
      onCancel={handleCancel}
      onPublish={handlePublish}
      onPreview={handlePreview}
      onDuplicate={handleDuplicate}
    />
  )
}
