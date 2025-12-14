// Content Management Types

export interface ContentComponent {
  id: string
  type: 'text' | 'heading' | 'paragraph' | 'list' | 'image' | 'video' | 'audio' | 'container' | 'button' | 'spacer' | 'divider' | 'quote' | 'code' | 'table' | 'form' | 'gallery' | 'carousel' | 'accordion' | 'tabs' | 'progress'
  props: Record<string, any>
  children?: ContentComponent[]
  order: number
  style?: Record<string, any>
  responsive?: {
    mobile?: Record<string, any>
    tablet?: Record<string, any>
    desktop?: Record<string, any>
  }
}

export interface ContentPage {
  id: string
  title: string
  slug: string
  type: 'marketing' | 'news' | 'inspiration' | 'popup'
  status: 'draft' | 'published' | 'archived'
  components: ContentComponent[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
  views?: number
  analytics?: ContentAnalytics
  mobileDisplay?: MobileDisplaySettings
  seo?: SEOSettings
  metadata?: Record<string, any>
}

export interface ContentTemplate {
  id: string
  name: string
  description: string
  type: string
  preview: string
  components: ContentComponent[]
  category?: string
  tags?: string[]
  isPublic?: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentAnalytics {
  views: number
  uniqueViews: number
  timeOnPage: number
  bounceRate: number
  conversionRate?: number
  lastViewed?: string
}

export interface MobileDisplaySettings {
  showOnLogin: boolean
  showOnHome: boolean
  showOnNews: boolean
  showAsPopup: boolean
  popupTrigger: 'immediate' | 'scroll' | 'time' | 'exit'
  popupDelay?: number
  popupConditions?: string[]
}

export interface SEOSettings {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  twitterCard?: string
  canonicalUrl?: string
  robots?: string
}

export interface ContentFilters {
  type: string
  status: string
  search: string
  dateFrom?: string
  dateTo?: string
  author?: string
  tags?: string[]
}

export interface ContentPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ContentListResponse {
  pages: ContentPage[]
  pagination: ContentPagination
  filters: ContentFilters
}

// Component Props Types
export interface TextComponentProps {
  content: string
  fontSize: number
  color: string
  alignment: 'left' | 'center' | 'right' | 'justify'
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline' | 'line-through'
  lineHeight?: number
  letterSpacing?: number
}

export interface HeadingComponentProps extends TextComponentProps {
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export interface ImageComponentProps {
  src: string
  alt: string
  width?: number
  height?: number
  alignment: 'left' | 'center' | 'right'
  borderRadius?: number
  shadow?: boolean
  caption?: string
  link?: string
  target?: '_blank' | '_self'
}

export interface ButtonComponentProps {
  text: string
  variant: 'primary' | 'secondary' | 'outline' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  alignment: 'left' | 'center' | 'right'
  link?: string
  target?: '_blank' | '_self'
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
}

export interface VideoComponentProps {
  src: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  width?: number
  height?: number
  alignment: 'left' | 'center' | 'right'
}

export interface ContainerComponentProps {
  backgroundColor?: string
  padding?: number
  margin?: number
  borderRadius?: number
  shadow?: boolean
  border?: {
    width: number
    style: 'solid' | 'dashed' | 'dotted'
    color: string
  }
  maxWidth?: number
  alignment: 'left' | 'center' | 'right'
}

export interface SpacerComponentProps {
  height: number
  backgroundColor?: string
  showBorder?: boolean
}

// Form Types
export interface ContentFormData {
  title: string
  slug: string
  type: ContentPage['type']
  status: ContentPage['status']
  components: ContentComponent[]
  mobileDisplay?: MobileDisplaySettings
  seo?: SEOSettings
}

// Validation Types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: ContentPagination
  success: boolean
}

// Event Types
export interface ContentEvent {
  type: 'created' | 'updated' | 'deleted' | 'published' | 'archived'
  contentId: string
  timestamp: string
  userId?: string
  metadata?: Record<string, any>
}

// Search Types
export interface SearchOptions {
  query: string
  filters?: ContentFilters
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'views'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface SearchResult {
  content: ContentPage
  score: number
  highlights: string[]
}
