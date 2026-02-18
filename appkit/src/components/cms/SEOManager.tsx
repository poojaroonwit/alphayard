'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { 
  GlobeAltIcon,
  EyeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LinkIcon,
  TagIcon,
  PhotoIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { SEOSettings } from '../../services/productionCmsService'

interface SEOManagerProps {
  seo: SEOSettings
  onUpdate: (seo: SEOSettings) => void
  contentTitle?: string
  contentSlug?: string
  className?: string
}

interface SEOAnalysis {
  score: number
  issues: SEOIssue[]
  suggestions: SEOSuggestion[]
  preview: {
    title: string
    description: string
    url: string
  }
}

interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  field: string
  message: string
  fix?: string
}

interface SEOSuggestion {
  field: string
  message: string
  impact: 'high' | 'medium' | 'low'
}

export const SEOManager: React.FC<SEOManagerProps> = ({
  seo,
  onUpdate,
  contentTitle = '',
  contentSlug = '',
  className = ''
}) => {
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'analysis'>('basic')

  // Analyze SEO settings
  const analyzeSEO = useCallback(() => {
    setLoading(true)
    
    // Simulate analysis (in production, this would call an API)
    setTimeout(() => {
      const issues: SEOIssue[] = []
      const suggestions: SEOSuggestion[] = []
      let score = 100

      // Title analysis
      const title = seo.title || contentTitle
      if (!title) {
        issues.push({
          type: 'error',
          field: 'title',
          message: 'Title is required for SEO',
          fix: 'Add a descriptive title'
        })
        score -= 30
      } else if (title.length < 30) {
        issues.push({
          type: 'warning',
          field: 'title',
          message: 'Title is too short (recommended: 30-60 characters)',
          fix: 'Make the title more descriptive'
        })
        score -= 10
      } else if (title.length > 60) {
        issues.push({
          type: 'warning',
          field: 'title',
          message: 'Title is too long (recommended: 30-60 characters)',
          fix: 'Shorten the title'
        })
        score -= 5
      }

      // Description analysis
      const description = seo.description
      if (!description) {
        issues.push({
          type: 'error',
          field: 'description',
          message: 'Meta description is required',
          fix: 'Add a compelling meta description'
        })
        score -= 25
      } else if (description.length < 120) {
        issues.push({
          type: 'warning',
          field: 'description',
          message: 'Meta description is too short (recommended: 120-160 characters)',
          fix: 'Expand the description'
        })
        score -= 10
      } else if (description.length > 160) {
        issues.push({
          type: 'warning',
          field: 'description',
          message: 'Meta description is too long (recommended: 120-160 characters)',
          fix: 'Shorten the description'
        })
        score -= 5
      }

      // Keywords analysis
      if (!seo.keywords || seo.keywords.length === 0) {
        suggestions.push({
          field: 'keywords',
          message: 'Add relevant keywords to improve search visibility',
          impact: 'medium'
        })
        score -= 10
      } else if (seo.keywords.length > 10) {
        suggestions.push({
          field: 'keywords',
          message: 'Too many keywords (recommended: 3-10)',
          impact: 'low'
        })
        score -= 5
      }

      // Open Graph image
      if (!seo.ogImage) {
        suggestions.push({
          field: 'ogImage',
          message: 'Add an Open Graph image for better social media sharing',
          impact: 'high'
        })
        score -= 15
      }

      // Canonical URL
      if (!seo.canonicalUrl) {
        suggestions.push({
          field: 'canonicalUrl',
          message: 'Set a canonical URL to avoid duplicate content issues',
          impact: 'medium'
        })
        score -= 5
      }

      setAnalysis({
        score: Math.max(0, score),
        issues,
        suggestions,
        preview: {
          title: title || 'Untitled',
          description: description || 'No description provided',
          url: seo.canonicalUrl || `https://example.com/${contentSlug}`
        }
      })
      setLoading(false)
    }, 1000)
  }, [seo, contentTitle, contentSlug])

  useEffect(() => {
    analyzeSEO()
  }, [analyzeSEO])

  const handleFieldChange = useCallback((field: keyof SEOSettings, value: any) => {
    onUpdate({
      ...seo,
      [field]: value
    })
  }, [seo, onUpdate])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getIssueIcon = (type: SEOIssue['type']) => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div className={`seo-manager ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <GlobeAltIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">SEO Management</h2>
        </div>
        
        {analysis && (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getScoreBgColor(analysis.score)}`}>
            <span className={`text-sm font-medium ${getScoreColor(analysis.score)}`}>
              SEO Score: {analysis.score}/100
            </span>
            <button
              onClick={analyzeSEO}
              disabled={loading}
              className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'basic', label: 'Basic SEO', icon: GlobeAltIcon },
            { id: 'advanced', label: 'Advanced', icon: CodeBracketIcon },
            { id: 'analysis', label: 'Analysis', icon: ChartBarIcon }
          ].map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Title
            </label>
            <input
              type="text"
              value={seo.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="SEO optimized title (30-60 characters)"
              maxLength={60}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {seo.title ? seo.title.length : 0}/60 characters
              </p>
              {seo.title && seo.title.length >= 30 && seo.title.length <= 60 && (
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={seo.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Compelling description for search results (120-160 characters)"
              maxLength={160}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                {seo.description ? seo.description.length : 0}/160 characters
              </p>
              {seo.description && seo.description.length >= 120 && seo.description.length <= 160 && (
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={seo.keywords?.join(', ') || ''}
              onChange={(e) => handleFieldChange('keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Relevant keywords (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add 3-10 relevant keywords separated by commas
            </p>
          </div>

          {/* Open Graph Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Graph Image
            </label>
            <div className="flex space-x-3">
              <input
                type="url"
                value={seo.ogImage || ''}
                onChange={(e) => handleFieldChange('ogImage', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <PhotoIcon className="h-4 w-4" />
              </button>
            </div>
            {seo.ogImage && (
              <div className="mt-2">
                <img
                  src={seo.ogImage}
                  alt="OG Preview"
                  className="w-32 h-32 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          {/* Open Graph Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Graph Title
            </label>
            <input
              type="text"
              value={seo.ogTitle || ''}
              onChange={(e) => handleFieldChange('ogTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Custom title for social media sharing"
            />
          </div>

          {/* Open Graph Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Open Graph Description
            </label>
            <textarea
              value={seo.ogDescription || ''}
              onChange={(e) => handleFieldChange('ogDescription', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Custom description for social media sharing"
            />
          </div>

          {/* Twitter Card */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter Card Type
            </label>
            <select
              value={seo.twitterCard || 'summary'}
              onChange={(e) => handleFieldChange('twitterCard', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
              <option value="app">App</option>
              <option value="player">Player</option>
            </select>
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canonical URL
            </label>
            <input
              type="url"
              value={seo.canonicalUrl || ''}
              onChange={(e) => handleFieldChange('canonicalUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/canonical-url"
            />
          </div>

          {/* Robots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Robots Meta Tag
            </label>
            <select
              value={seo.robots || 'index, follow'}
              onChange={(e) => handleFieldChange('robots', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="index, follow">Index, Follow</option>
              <option value="index, nofollow">Index, No Follow</option>
              <option value="noindex, follow">No Index, Follow</option>
              <option value="noindex, nofollow">No Index, No Follow</option>
            </select>
          </div>

          {/* Structured Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Structured Data (JSON-LD)
            </label>
            <textarea
              value={seo.structuredData ? JSON.stringify(seo.structuredData, null, 2) : ''}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  handleFieldChange('structuredData', parsed)
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={8}
              placeholder='{"@context": "https://schema.org", "@type": "Article", ...}'
            />
            <p className="text-xs text-gray-500 mt-1">
              Add JSON-LD structured data for rich snippets
            </p>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Analyzing SEO...</span>
            </div>
          ) : analysis ? (
            <>
              {/* Score Overview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">SEO Score</h3>
                  <div className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}/100
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      analysis.score >= 80 ? 'bg-green-500' :
                      analysis.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.score}%` }}
                  ></div>
                </div>
              </div>

              {/* Issues */}
              {analysis.issues.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues to Fix</h3>
                  <div className="space-y-3">
                    {analysis.issues.map((issue, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                          {issue.fix && (
                            <p className="text-xs text-gray-600 mt-1">Fix: {issue.fix}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions</h3>
                  <div className="space-y-3">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{suggestion.message}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            suggestion.impact === 'high' ? 'bg-red-100 text-red-800' :
                            suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {suggestion.impact} impact
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Preview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Preview</h3>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="text-blue-600 text-sm mb-1">{analysis.preview.url}</div>
                  <div className="text-xl text-blue-600 font-medium mb-1 hover:underline cursor-pointer">
                    {analysis.preview.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {analysis.preview.description}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis available</h3>
              <p className="text-gray-600">Click the refresh button to analyze your SEO settings.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Styles
export const seoManagerStyles = `
.seo-manager {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.seo-manager input,
.seo-manager textarea,
.seo-manager select {
  transition: border-color 0.2s, box-shadow 0.2s;
}

.seo-manager input:focus,
.seo-manager textarea:focus,
.seo-manager select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
`
