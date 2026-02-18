import { useState, useCallback, useRef } from 'react'
import { ContentPage, ContentComponent } from '../types/content'

export interface UseContentEditorReturn {
  // State
  currentPage: ContentPage
  selectedComponent: ContentComponent | null
  previewMode: boolean
  previewDevice: 'web' | 'mobile'
  hasUnsavedChanges: boolean
  lastSavedVersion: ContentPage | null
  
  // Actions
  updatePage: (updates: Partial<ContentPage>) => void
  selectComponent: (component: ContentComponent | null) => void
  updateComponent: (componentId: string, updates: Partial<ContentComponent>) => void
  addComponent: (component: ContentComponent) => void
  removeComponent: (componentId: string) => void
  moveComponent: (fromIndex: number, toIndex: number) => void
  togglePreviewMode: () => void
  setPreviewDevice: (device: 'web' | 'mobile') => void
  saveVersion: (description: string) => void
  restoreVersion: (version: ContentPage) => void
  markAsSaved: () => void
  reset: () => void
}

export const useContentEditor = (initialPage?: ContentPage): UseContentEditorReturn => {
  const [currentPage, setCurrentPage] = useState<ContentPage>(
    initialPage || {
      id: '',
      title: '',
      slug: '',
      type: 'marketing',
      status: 'draft',
      components: [],
      mobileDisplay: {
        showOnLogin: false,
        showOnHome: false,
        showOnNews: false,
        showAsPopup: false,
        popupTrigger: 'immediate',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  )

  const [selectedComponent, setSelectedComponent] = useState<ContentComponent | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [previewDevice, setPreviewDeviceState] = useState<'web' | 'mobile'>('web')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSavedVersion, setLastSavedVersion] = useState<ContentPage | null>(null)
  
  const versionHistoryRef = useRef<ContentPage[]>([])

  const updatePage = useCallback((updates: Partial<ContentPage>) => {
    setCurrentPage(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }))
    setHasUnsavedChanges(true)
  }, [])

  const selectComponent = useCallback((component: ContentComponent | null) => {
    setSelectedComponent(component)
  }, [])

  const updateComponent = useCallback((componentId: string, updates: Partial<ContentComponent>) => {
    setCurrentPage(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === componentId ? { ...comp, ...updates } : comp
      ),
      updatedAt: new Date().toISOString()
    }))
    setHasUnsavedChanges(true)
  }, [])

  const addComponent = useCallback((component: ContentComponent) => {
    setCurrentPage(prev => ({
      ...prev,
      components: [...prev.components, component],
      updatedAt: new Date().toISOString()
    }))
    setHasUnsavedChanges(true)
  }, [])

  const removeComponent = useCallback((componentId: string) => {
    setCurrentPage(prev => ({
      ...prev,
      components: prev.components.filter(comp => comp.id !== componentId),
      updatedAt: new Date().toISOString()
    }))
    setHasUnsavedChanges(true)
    
    // Clear selection if the selected component was removed
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null)
    }
  }, [selectedComponent])

  const moveComponent = useCallback((fromIndex: number, toIndex: number) => {
    setCurrentPage(prev => {
      const newComponents = [...prev.components]
      const [movedComponent] = newComponents.splice(fromIndex, 1)
      newComponents.splice(toIndex, 0, movedComponent)
      
      return {
        ...prev,
        components: newComponents,
        updatedAt: new Date().toISOString()
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  const togglePreviewMode = useCallback(() => {
    setPreviewMode(prev => !prev)
  }, [])

  const setPreviewDevice = useCallback((device: 'web' | 'mobile') => {
    setPreviewDeviceState(device)
  }, [])

  const saveVersion = useCallback((description: string) => {
    const version = {
      ...currentPage,
      id: `${currentPage.id}-v${Date.now()}`,
      title: `${currentPage.title} - ${description}`
    }
    
    versionHistoryRef.current.push(version)
    setLastSavedVersion(currentPage)
    setHasUnsavedChanges(false)
  }, [currentPage])

  const restoreVersion = useCallback((version: ContentPage) => {
    setCurrentPage(version)
    setLastSavedVersion(version)
    setHasUnsavedChanges(false)
    setSelectedComponent(null)
  }, [])

  const markAsSaved = useCallback(() => {
    setLastSavedVersion(currentPage)
    setHasUnsavedChanges(false)
  }, [currentPage])

  const reset = useCallback(() => {
    setCurrentPage(initialPage || {
      id: '',
      title: '',
      slug: '',
      type: 'marketing',
      status: 'draft',
      components: [],
      mobileDisplay: {
        showOnLogin: false,
        showOnHome: false,
        showOnNews: false,
        showAsPopup: false,
        popupTrigger: 'immediate',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setSelectedComponent(null)
    setPreviewMode(false)
    setPreviewDeviceState('web')
    setHasUnsavedChanges(false)
    setLastSavedVersion(null)
  }, [initialPage])

  return {
    currentPage,
    selectedComponent,
    previewMode,
    previewDevice,
    hasUnsavedChanges,
    lastSavedVersion,
    updatePage,
    selectComponent,
    updateComponent,
    addComponent,
    removeComponent,
    moveComponent,
    togglePreviewMode,
    setPreviewDevice,
    saveVersion,
    restoreVersion,
    markAsSaved,
    reset
  }
}
