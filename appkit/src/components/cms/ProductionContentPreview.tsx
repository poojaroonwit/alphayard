'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  EyeIcon,
  XMarkIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  ShareIcon,
  QrCodeIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  LinkIcon,
  ArrowDownTrayIcon as DownloadIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'
import { ContentPage, ContentComponent } from '../../services/productionCmsService'

interface ProductionContentPreviewProps {
  page: ContentPage
  onClose: () => void
  onEdit?: () => void
  onPublish?: () => void
  onShare?: (url: string) => void
  className?: string
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop'

export const ProductionContentPreview: React.FC<ProductionContentPreviewProps> = ({
  page,
  onClose,
  onEdit,
  onPublish,
  onShare,
  className = ''
}) => {
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Viewport configurations
  const viewportConfigs = {
    mobile: { width: 375, height: 667, name: 'Mobile' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    desktop: { width: 1200, height: 800, name: 'Desktop' }
  }

  const currentViewport = viewportConfigs[viewportSize]

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!page.id) return

    setLoading(true)
    try {
      // TODO: Implement analytics loading
      // const analyticsData = await productionCmsService.getContentAnalytics(page.id)
      // setAnalytics(analyticsData)
      
      // Mock data for now
      setAnalytics({
        views: 1234,
        uniqueViews: 987,
        avgTimeOnPage: 145,
        bounceRate: 0.23,
        conversionRate: 0.05,
        lastViewed: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [page.id])

  useEffect(() => {
    if (showAnalytics) {
      loadAnalytics()
    }
  }, [showAnalytics, loadAnalytics])

  // Component renderer for preview
  const renderComponent = (component: ContentComponent): React.ReactNode => {
    switch (component.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <p>{component.props.content}</p>
          </div>
        )

      case 'heading':
        const HeadingTag = component.props.level || 'h2'
        return (
          <HeadingTag className="font-bold text-gray-900 mb-4">
            {component.props.content}
          </HeadingTag>
        )

      case 'image':
        return (
          <div className="my-4">
            <img
              src={component.props.src}
              alt={component.props.alt || ''}
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
            {component.props.caption && (
              <p className="text-sm text-gray-600 mt-2 text-center">
                {component.props.caption}
              </p>
            )}
          </div>
        )

      case 'video':
        return (
          <div className="my-4">
            <video
              src={component.props.src}
              controls
              className="max-w-full h-auto rounded-lg shadow-sm"
            >
              Your browser does not support the video tag.
            </video>
            {component.props.title && (
              <p className="text-sm text-gray-600 mt-2">
                {component.props.title}
              </p>
            )}
          </div>
        )

      case 'audio':
        return (
          <div className="my-4">
            <audio
              src={component.props.src}
              controls
              className="w-full"
            >
              Your browser does not support the audio tag.
            </audio>
            {component.props.title && (
              <p className="text-sm text-gray-600 mt-2">
                {component.props.title}
              </p>
            )}
          </div>
        )

      case 'button':
        return (
          <div className="my-4">
            <a
              href={component.props.href}
              target={component.props.target || '_self'}
              className={`inline-block px-6 py-3 rounded-lg font-medium transition-colors ${
                component.props.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                component.props.variant === 'secondary' ? 'bg-gray-600 text-white hover:bg-gray-700' :
                'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {component.props.text}
            </a>
          </div>
        )

      case 'spacer':
        return (
          <div style={{ height: `${component.props.height || 20}px` }}></div>
        )

      case 'divider':
        return (
          <hr className="my-8 border-gray-300" />
        )

      case 'quote':
        return (
          <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4">
            <p className="text-lg italic text-gray-700">
              {component.props.content}
            </p>
            {component.props.author && (
              <footer className="text-sm text-gray-600 mt-2">
                — {component.props.author}
              </footer>
            )}
          </blockquote>
        )

      case 'list':
        const ListTag = component.props.ordered ? 'ol' : 'ul'
        return (
          <ListTag className={`my-4 ${component.props.ordered ? 'list-decimal' : 'list-disc'} list-inside`}>
            {component.props.items?.map((item: string, index: number) => (
              <li key={index} className="mb-1">{item}</li>
            ))}
          </ListTag>
        )

      case 'table':
        return (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-gray-300">
              {component.props.headers && (
                <thead className="bg-gray-50">
                  <tr>
                    {component.props.headers.map((header: string, index: number) => (
                      <th key={index} className="border border-gray-300 px-4 py-2 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
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
          </div>
        )

      case 'code':
        return (
          <div className="my-4">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code className={`language-${component.props.language || 'javascript'}`}>
                {component.props.code}
              </code>
            </pre>
          </div>
        )

      case 'link':
        return (
          <div className="my-4">
            <a
              href={component.props.href}
              target={component.props.target || '_blank'}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {component.props.text}
            </a>
          </div>
        )

      default:
        return (
          <div className="my-4 p-4 border border-gray-300 rounded bg-gray-50">
            <p className="text-gray-600">Unsupported component: {component.type}</p>
          </div>
        )
    }
  }

  const generateShareUrl = useCallback(() => {
    const baseUrl = window.location.origin
    return `${baseUrl}/content/${page.slug}`
  }, [page.slug])

  const handleShare = useCallback(() => {
    const url = generateShareUrl()
    if (onShare) {
      onShare(url)
    } else {
      navigator.clipboard.writeText(url)
      // TODO: Show success notification
    }
  }, [generateShareUrl, onShare])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownload = useCallback(() => {
    // TODO: Implement PDF download
    console.log('Download as PDF')
  }, [])

  return (
    <div className={`production-content-preview ${className} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="preview-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Content Preview</h1>
              <p className="text-sm text-gray-600">{page.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Viewport Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {(['mobile', 'tablet', 'desktop'] as ViewportSize[]).map((size) => {
                const IconComponent = size === 'mobile' ? DevicePhoneMobileIcon :
                                   size === 'tablet' ? DeviceTabletIcon : ComputerDesktopIcon
                return (
                  <button
                    key={size}
                    onClick={() => setViewportSize(size)}
                    className={`p-2 rounded transition-colors ${
                      viewportSize === size
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    title={viewportConfigs[size].name}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                )
              })}
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Analytics"
            >
              <ChartBarIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleShare}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share"
            >
              <ShareIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download PDF"
            >
              <DownloadIcon className="h-5 w-5" />
            </button>

            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Print"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>

            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}

            {onPublish && page.status !== 'published' && (
              <button
                onClick={onPublish}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Publish
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Preview Container */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div className="flex justify-center">
              <div
                className="preview-container bg-white rounded-lg shadow-lg overflow-hidden"
                style={{
                  width: `${currentViewport.width}px`,
                  height: `${currentViewport.height}px`,
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                {/* Preview Content */}
                <div className="preview-content p-6 h-full overflow-y-auto">
                  {/* Page Header */}
                  <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{page.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <UserIcon className="h-4 w-4" />
                        <span>Admin</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.status === 'published' ? 'bg-green-100 text-green-800' :
                        page.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {page.status}
                      </span>
                    </div>
                  </header>

                  {/* Components */}
                  <div className="space-y-6">
                    {page.components
                      .sort((a, b) => a.order - b.order)
                      .map((component) => (
                        <div key={component.id}>
                          {renderComponent(component)}
                        </div>
                      ))}
                  </div>

                  {/* Empty State */}
                  {page.components.length === 0 && (
                    <div className="text-center py-12">
                      <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                      <p className="text-gray-600">Add components to see them in the preview.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Sidebar */}
        {showAnalytics && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading analytics...</span>
                </div>
              ) : analytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{analytics.views}</div>
                      <div className="text-sm text-blue-800">Total Views</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analytics.uniqueViews}</div>
                      <div className="text-sm text-green-800">Unique Views</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg. Time on Page</span>
                        <span className="font-medium">{analytics.avgTimeOnPage}s</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bounce Rate</span>
                        <span className="font-medium">{(analytics.bounceRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-medium">{(analytics.conversionRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {analytics.lastViewed && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Last viewed: {new Date(analytics.lastViewed).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
                  <p className="text-gray-600">Analytics will appear once the content is published and viewed.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Styles
export const productionContentPreviewStyles = `
.production-content-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.production-content-preview.fullscreen {
  z-index: 60;
}

.preview-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
}

.preview-container {
  transition: all 0.3s ease;
}

.preview-content {
  font-Circle: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #374151;
}

.preview-content h1 {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.preview-content h2 {
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 0.75rem;
}

.preview-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.preview-content h4 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.preview-content h5 {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.preview-content h6 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.preview-content p {
  margin-bottom: 1rem;
}

.preview-content ul, .preview-content ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.preview-content li {
  margin-bottom: 0.25rem;
}

.preview-content blockquote {
  margin: 1.5rem 0;
  padding-left: 1rem;
  border-left: 4px solid #3b82f6;
  font-style: italic;
  color: #6b7280;
}

.preview-content code {
  background: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-Circle: 'Courier New', monospace;
  font-size: 0.875rem;
}

.preview-content pre {
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.preview-content pre code {
  background: transparent;
  padding: 0;
  color: inherit;
}

.preview-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.preview-content table th,
.preview-content table td {
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  text-align: left;
}

.preview-content table th {
  background: #f9fafb;
  font-weight: 600;
}

@media (max-width: 768px) {
  .production-content-preview {
    position: relative;
    height: auto;
  }
  
  .preview-container {
    width: 100% !important;
    height: auto !important;
  }
}
`

