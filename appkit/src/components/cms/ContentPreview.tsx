'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { 
  EyeIcon,
  ShareIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  LinkIcon,
  QrCodeIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  TagIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  CodeBracketIcon,
  TableCellsIcon,
  ListBulletIcon,
  ChatBubbleLeftRightIcon,
  LinkSlashIcon,
  ArrowPathIcon,
  XMarkIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { ContentPage, ContentComponent } from '../../types/content'

// Content Preview Component
interface ContentPreviewProps {
  content: ContentPage
  onPublish?: (content: ContentPage) => void
  onSchedule?: (content: ContentPage, date: Date) => void
  onEdit?: () => void
  onClose?: () => void
  showControls?: boolean
  className?: string
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  onPublish,
  onSchedule,
  onEdit,
  onClose,
  showControls = true,
  className = ''
}) => {
  // State management
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date())
  const [publishOptions, setPublishOptions] = useState({
    platforms: ['web'],
    socialMedia: {
      twitter: false,
      facebook: false,
      linkedin: false,
      instagram: false
    },
    autoPromote: false,
    notifySubscribers: false
  })
  const [previewUrl, setPreviewUrl] = useState('')
  const [analytics, setAnalytics] = useState({
    loadTime: 0,
    accessibilityScore: 0,
    seoScore: 0,
    performanceScore: 0
  })

  // Refs
  const previewRef = useRef<HTMLDivElement>(null)
  const mediaRefs = useRef<Map<string, HTMLMediaElement>>(new Map())

  // Generate preview URL
  useEffect(() => {
    const baseUrl = window.location.origin
    setPreviewUrl(`${baseUrl}/preview/${content.id}`)
  }, [content.id])

  // Simulate analytics calculation
  useEffect(() => {
    const calculateAnalytics = () => {
      const loadTime = Math.random() * 2000 + 500 // 500-2500ms
      const accessibilityScore = Math.random() * 20 + 80 // 80-100
      const seoScore = Math.random() * 30 + 70 // 70-100
      const performanceScore = Math.random() * 25 + 75 // 75-100
      
      setAnalytics({
        loadTime: Math.round(loadTime),
        accessibilityScore: Math.round(accessibilityScore),
        seoScore: Math.round(seoScore),
        performanceScore: Math.round(performanceScore)
      })
    }

    calculateAnalytics()
  }, [content])

  // Handle media controls
  const handleMediaPlay = useCallback(() => {
    setIsPlaying(true)
    mediaRefs.current.forEach(media => {
      if (media) {
        media.play()
      }
    })
  }, [])

  const handleMediaPause = useCallback(() => {
    setIsPlaying(false)
    mediaRefs.current.forEach(media => {
      if (media) {
        media.pause()
      }
    })
  }, [])

  const handleMediaMute = useCallback(() => {
    setIsMuted(!isMuted)
    mediaRefs.current.forEach(media => {
      if (media) {
        media.muted = !isMuted
      }
    })
  }, [isMuted])

  // Handle fullscreen
  const handleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (previewRef.current?.requestFullscreen) {
        previewRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Handle publish
  const handlePublish = useCallback(async () => {
    try {
      await onPublish?.(content)
      setShowPublishModal(false)
    } catch (error) {
      console.error('Failed to publish:', error)
    }
  }, [content, onPublish])

  // Handle schedule
  const handleSchedule = useCallback(async () => {
    try {
      await onSchedule?.(content, scheduleDate)
      setShowScheduleModal(false)
    } catch (error) {
      console.error('Failed to schedule:', error)
    }
  }, [content, scheduleDate, onSchedule])

  // Handle share
  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: (content as any).description || content.title,
          url: previewUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      setShowShareModal(true)
    }
  }, [content, previewUrl])

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [])

  // Render component based on type
  const renderComponent = useCallback((component: ContentComponent) => {
    const commonProps = {
      key: component.id,
      style: component.style,
      className: 'component'
    }

    switch (component.type) {
      case 'heading':
        const HeadingTag = component.props.level || 'h2'
        return (
          <HeadingTag {...commonProps}>
            {component.props.content || 'Heading'}
          </HeadingTag>
        )

      case 'text':
        return (
          <p {...commonProps}>
            {component.props.content || 'Text content'}
          </p>
        )

      case 'image':
        return (
          <img
            {...commonProps}
            src={component.props.src || '/placeholder-image.jpg'}
            alt={component.props.alt || 'Image'}
            className="max-w-full h-auto rounded-lg"
          />
        )

      case 'video':
        return (
          <video
            {...commonProps}
            ref={(el) => {
              if (el) mediaRefs.current.set(component.id, el)
            }}
            controls
            muted={isMuted}
            className="max-w-full h-auto rounded-lg"
          >
            <source src={component.props.src || '/placeholder-video.mp4'} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )

      case 'audio':
        return (
          <audio
            {...commonProps}
            ref={(el) => {
              if (el) mediaRefs.current.set(component.id, el)
            }}
            controls
            muted={isMuted}
            className="w-full"
          >
            <source src={component.props.src || '/placeholder-audio.mp3'} type="audio/mpeg" />
            Your browser does not support the audio tag.
          </audio>
        )

      case 'button':
        return (
          <button
            {...commonProps}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              component.props.variant === 'primary' 
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : component.props.variant === 'secondary'
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            } ${
              component.props.size === 'sm' ? 'text-sm px-3 py-1' :
              component.props.size === 'lg' ? 'text-lg px-6 py-3' : ''
            }`}
          >
            {component.props.text || 'Button'}
          </button>
        )

      case 'container':
        return (
          <div
            {...commonProps}
            className="container"
            style={{
              backgroundColor: component.props.backgroundColor,
              padding: component.props.padding ? `${component.props.padding}px` : undefined,
              margin: component.props.margin ? `${component.props.margin}px` : undefined,
              borderRadius: component.props.borderRadius ? `${component.props.borderRadius}px` : undefined,
              ...component.style
            }}
          >
            {component.children?.map(child => renderComponent(child))}
          </div>
        )

      case 'spacer':
        return (
          <div
            {...commonProps}
            style={{
              height: `${component.props.height || 20}px`,
              backgroundColor: component.props.backgroundColor,
              ...component.style
            }}
          />
        )

      case 'divider':
        return (
          <hr
            {...commonProps}
            className="border-gray-300"
            style={component.style}
          />
        )

      case 'quote':
        return (
          <blockquote
            {...commonProps}
            className="border-l-4 border-blue-500 pl-4 italic text-gray-700"
            style={component.style}
          >
            {component.props.content || 'Quote content'}
          </blockquote>
        )

      case 'code':
        return (
          <pre
            {...commonProps}
            className="bg-gray-100 p-4 rounded-lg overflow-x-auto"
            style={component.style}
          >
            <code>{component.props.content || 'Code content'}</code>
          </pre>
        )

      case 'table':
        return (
          <table
            {...commonProps}
            className="w-full border-collapse border border-gray-300"
            style={component.style}
          >
            <thead>
              <tr>
                {component.props.headers?.map((header: string, index: number) => (
                  <th key={index} className="border border-gray-300 px-4 py-2 bg-gray-100">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {component.props.rows?.map((row: string[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell: string, cellIndex: number) => (
                    <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'list':
        const ListTag = component.props.ordered ? 'ol' : 'ul'
        return (
          <ListTag
            {...commonProps}
            className={component.props.ordered ? 'list-decimal list-inside' : 'list-disc list-inside'}
            style={component.style}
          >
            {component.props.items?.map((item: string, index: number) => (
              <li key={index} className="mb-1">
                {item}
              </li>
            ))}
          </ListTag>
        )

      default:
        return (
          <div
            {...commonProps}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500"
          >
            {component.type} component
          </div>
        )
    }
  }, [isMuted])

  return (
    <div className={`content-preview ${className} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header Controls */}
      {showControls && (
        <div className="preview-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
                <p className="text-sm text-gray-500">
                  {content.type} • {content.status} • {content.components.length} components
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Preview Mode Toggle */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Desktop view"
                  aria-label="Desktop view"
                >
                  <ComputerDesktopIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('tablet')}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === 'tablet' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Tablet view"
                  aria-label="Tablet view"
                >
                  <DeviceTabletIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`p-2 rounded-md transition-colors ${
                    previewMode === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Mobile view"
                  aria-label="Mobile view"
                >
                  <DevicePhoneMobileIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Media Controls */}
              <div className="flex space-x-1">
                <button
                  onClick={isPlaying ? handleMediaPause : handleMediaPlay}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isPlaying ? 'Pause media' : 'Play media'}
                  aria-label={isPlaying ? 'Pause media' : 'Play media'}
                >
                  {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleMediaMute}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isMuted ? 'Unmute media' : 'Mute media'}
                  aria-label={isMuted ? 'Unmute media' : 'Mute media'}
                >
                  {isMuted ? <SpeakerXMarkIcon className="h-4 w-4" /> : <SpeakerWaveIcon className="h-4 w-4" />}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-1">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share preview"
                  aria-label="Share preview"
                >
                  <ShareIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowQRModal(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Show QR code"
                  aria-label="Show QR code"
                >
                  <QrCodeIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleFullscreen}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Settings"
                  aria-label="Settings"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Close preview"
                    aria-label="Close preview"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="settings-panel">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Performance</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Load Time</span>
                      <span>{analytics.loadTime}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (2000 - analytics.loadTime) / 20)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Accessibility</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Score</span>
                      <span>{analytics.accessibilityScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${analytics.accessibilityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">SEO</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Score</span>
                      <span>{analytics.seoScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${analytics.seoScore}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Performance</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Score</span>
                      <span>{analytics.performanceScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full" 
                        style={{ width: `${analytics.performanceScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Content */}
      <div 
        ref={previewRef}
        className={`preview-container preview-${previewMode}`}
      >
        <div className="preview-content">
          {content.components.length === 0 ? (
            <div className="empty-preview">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content to preview</h3>
              <p className="text-gray-500">Add components to see the preview</p>
            </div>
          ) : (
            <div className="space-y-4">
              {content.components
                .sort((a, b) => a.order - b.order)
                .map(component => renderComponent(component))}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      {showControls && (
        <div className="preview-actions">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Preview URL: <span className="font-mono text-xs">{previewUrl}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(previewUrl)}
                className="content-button content-button-secondary"
                title="Copy preview URL"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Copy URL
              </button>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="content-button content-button-secondary"
                title="Schedule content"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule
              </button>
              <button
                onClick={() => setShowPublishModal(true)}
                className="content-button content-button-primary"
                title="Publish content"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Publish
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="content-button content-button-secondary"
                  title="Edit content"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center space-x-3 mb-4">
              <ShareIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Share Preview</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={previewUrl}
                    readOnly
                    className="content-input flex-1"
                  />
                  <button
                    onClick={() => copyToClipboard(previewUrl)}
                    className="content-button content-button-secondary"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Embed Code
                </label>
                <div className="flex space-x-2">
                  <textarea
                    value={`<iframe src="${previewUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                    readOnly
                    className="content-input flex-1"
                    rows={3}
                  />
                  <button
                    onClick={() => copyToClipboard(`<iframe src="${previewUrl}" width="100%" height="600" frameborder="0"></iframe>`)}
                    className="content-button content-button-secondary"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="content-button content-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center space-x-3 mb-4">
              <QrCodeIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
            </div>
            <div className="text-center">
              <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <QrCodeIcon className="h-24 w-24 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Scan this QR code to view the preview on your mobile device
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="content-button content-button-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <ShareIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Publish Content</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platforms
                </label>
                <div className="flex space-x-4">
                  {[
                    { key: 'web', label: 'Web', icon: ComputerDesktopIcon },
                    { key: 'mobile', label: 'Mobile', icon: DevicePhoneMobileIcon },
                    { key: 'tablet', label: 'Tablet', icon: DeviceTabletIcon }
                  ].map((platform) => (
                    <label key={platform.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={publishOptions.platforms.includes(platform.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPublishOptions(prev => ({
                              ...prev,
                              platforms: [...prev.platforms, platform.key]
                            }))
                          } else {
                            setPublishOptions(prev => ({
                              ...prev,
                              platforms: prev.platforms.filter(p => p !== platform.key)
                            }))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <platform.icon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{platform.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(publishOptions.socialMedia).map(([platform, enabled]) => (
                    <label key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setPublishOptions(prev => ({
                          ...prev,
                          socialMedia: {
                            ...prev.socialMedia,
                            [platform]: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={publishOptions.autoPromote}
                    onChange={(e) => setPublishOptions(prev => ({
                      ...prev,
                      autoPromote: e.target.checked
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Auto-promote on social media</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={publishOptions.notifySubscribers}
                    onChange={(e) => setPublishOptions(prev => ({
                      ...prev,
                      notifySubscribers: e.target.checked
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Notify subscribers</span>
                </label>
              </div>
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowPublishModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="content-button content-button-primary"
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center space-x-3 mb-4">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Schedule Content</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate.toISOString().slice(0, 16)}
                  onChange={(e) => setScheduleDate(new Date(e.target.value))}
                  className="content-input w-full"
                />
              </div>
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="content-button content-button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                className="content-button content-button-primary"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Preview Styles
export const previewStyles = `
.content-preview {
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.content-preview.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  border-radius: 0;
}

.preview-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.settings-panel {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.preview-container {
  padding: 2rem;
  background: white;
  min-height: 400px;
  transition: all 0.3s ease;
}

.preview-desktop {
  max-width: 1200px;
  margin: 0 auto;
}

.preview-tablet {
  max-width: 768px;
  margin: 0 auto;
}

.preview-mobile {
  max-width: 375px;
  margin: 0 auto;
}

.preview-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  padding: 2rem;
  min-height: 300px;
}

.empty-preview {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.preview-actions {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.component {
  margin-bottom: 1rem;
}

.component:last-child {
  margin-bottom: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.content-button {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.content-button-primary {
  background: #3b82f6;
  color: white;
}

.content-button-primary:hover {
  background: #2563eb;
}

.content-button-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.content-button-secondary:hover {
  background: #e5e7eb;
}

.content-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.content-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`
