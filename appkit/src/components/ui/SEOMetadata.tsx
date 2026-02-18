'use client'

import React from 'react'
import Head from 'next/head'

interface SEOMetadataProps {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  canonicalUrl?: string
  robots?: 'index,follow' | 'noindex,nofollow' | 'index,nofollow' | 'noindex,follow'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  noindex?: boolean
}

export const SEOMetadata: React.FC<SEOMetadataProps> = ({
  title = 'Dynamic Content Management - AppKit',
  description = 'Create and manage dynamic content with our powerful drag-and-drop editor. Build marketing pages, news articles, and interactive content.',
  keywords = ['content management', 'CMS', 'drag and drop', 'dynamic content', 'marketing', 'editor'],
  ogImage = '/images/og-content-management.jpg',
  ogTitle,
  ogDescription,
  twitterCard = 'summary_large_image',
  canonicalUrl,
  robots = 'index,follow',
  author = 'AppKit Team',
  publishedTime,
  modifiedTime,
  section = 'Content Management',
  tags = [],
  noindex = false
}) => {
  const fullTitle = title.includes('AppKit') ? title : `${title} | AppKit`
  const finalOgTitle = ogTitle || fullTitle
  const finalOgDescription = ogDescription || description
  const finalRobots = noindex ? 'noindex,nofollow' : robots

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      <meta name="robots" content={finalRobots} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="AppKit" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Article Meta Tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {section && <meta property="article:section" content={section} />}
      {author && <meta property="article:author" content={author} />}
      {tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#dc2626" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  )
}

// Structured Data for Content Management
interface StructuredDataProps {
  type: 'WebApplication' | 'SoftwareApplication' | 'WebPage'
  name: string
  description: string
  url?: string
  applicationCategory?: string
  operatingSystem?: string
  offers?: {
    price: string
    priceCurrency: string
  }
  author?: {
    name: string
    url?: string
  }
  publisher?: {
    name: string
    url?: string
  }
  datePublished?: string
  dateModified?: string
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  type,
  name,
  description,
  url,
  applicationCategory = 'ContentManagementApplication',
  operatingSystem = 'Web',
  offers,
  author,
  publisher,
  datePublished,
  dateModified
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    description,
    url,
    applicationCategory,
    operatingSystem,
    ...(offers && { offers }),
    ...(author && { author }),
    ...(publisher && { publisher }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified })
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

// Content-specific SEO component
interface ContentSEOMetadataProps {
  content: {
    title: string
    description?: string
    slug: string
    type: 'marketing' | 'news' | 'inspiration' | 'popup'
    status: 'draft' | 'published' | 'archived'
    createdAt: string
    updatedAt: string
    views?: number
  }
  baseUrl?: string
}

export const ContentSEOMetadata: React.FC<ContentSEOMetadataProps> = ({
  content,
  baseUrl = 'https://appkit.com'
}) => {
  const isPublished = content.status === 'published'
  const contentUrl = `${baseUrl}/content/${content.slug}`
  
  const getContentTypeKeywords = (type: string) => {
    switch (type) {
      case 'marketing':
        return ['marketing', 'promotion', 'campaign', 'advertising']
      case 'news':
        return ['news', 'article', 'blog', 'information']
      case 'inspiration':
        return ['inspiration', 'creative', 'design', 'ideas']
      case 'popup':
        return ['popup', 'modal', 'notification', 'alert']
      default:
        return []
    }
  }

  const keywords = [
    'appkit',
    'content management',
    'dynamic content',
    ...getContentTypeKeywords(content.type)
  ]

  return (
    <>
      <SEOMetadata
        title={content.title}
        description={content.description || `Dynamic ${content.type} content created with AppKit content management system.`}
        keywords={keywords}
        canonicalUrl={isPublished ? contentUrl : undefined}
        robots={isPublished ? 'index,follow' : 'noindex,nofollow'}
        publishedTime={content.createdAt}
        modifiedTime={content.updatedAt}
        section={content.type}
        tags={getContentTypeKeywords(content.type)}
        noindex={!isPublished}
      />
      
      {isPublished && (
        <StructuredData
          type="WebPage"
          name={content.title}
          description={content.description || `Dynamic ${content.type} content`}
          url={contentUrl}
          datePublished={content.createdAt}
          dateModified={content.updatedAt}
          author={{
            name: 'AppKit Team',
            url: baseUrl
          }}
          publisher={{
            name: 'AppKit',
            url: baseUrl
          }}
        />
      )}
    </>
  )
}
