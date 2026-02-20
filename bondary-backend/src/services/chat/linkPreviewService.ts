import { prisma } from '../../lib/prisma';

export interface LinkPreview {
  id: string;
  messageId: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  faviconUrl?: string;
  contentType?: string;
  metadata: any;
  fetchedAt: Date;
  expiresAt: Date;
}

export class LinkPreviewService {
  // Extract URLs from text
  extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
    const matches = text.match(urlRegex);
    return matches || [];
  }

  // Get or fetch link preview
  async getOrFetchPreview(messageId: string, url: string): Promise<LinkPreview | null> {
    // Check for existing non-expired preview
    const existing = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_link_previews 
      WHERE message_id = ${messageId}::uuid AND url = ${url} AND expires_at > NOW()
    `;

    if (existing.length > 0) {
      return this.mapLinkPreview(existing[0]);
    }

    // Fetch preview data
    const previewData = await this.fetchPreview(url);
    
    if (!previewData) return null;

    // Store the preview
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO bondarys.chat_link_previews 
      (message_id, url, title, description, image_url, site_name, favicon_url, content_type, metadata)
      VALUES (${messageId}::uuid, ${url}, ${previewData.title}, ${previewData.description}, 
              ${previewData.imageUrl}, ${previewData.siteName}, ${previewData.faviconUrl}, 
              ${previewData.contentType}, ${JSON.stringify(previewData.metadata || {})}::jsonb)
      ON CONFLICT (message_id) WHERE url = ${url}
      DO UPDATE SET title = ${previewData.title}, description = ${previewData.description}, 
                    image_url = ${previewData.imageUrl}, site_name = ${previewData.siteName}, 
                    favicon_url = ${previewData.faviconUrl}, content_type = ${previewData.contentType},
                    metadata = ${JSON.stringify(previewData.metadata || {})}::jsonb, 
                    fetched_at = NOW(), expires_at = NOW() + INTERVAL '7 days'
      RETURNING *
    `;

    return this.mapLinkPreview(result[0]);
  }

  // Fetch preview data from URL with actual HTML parsing
  private async fetchPreview(url: string): Promise<Partial<LinkPreview> | null> {
    try {
      const urlObj = new URL(url);
      
      // Fetch the page with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BondaryBot/1.0; +https://bondarys.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      // Handle non-HTML content (images, videos, etc.)
      if (!contentType.includes('text/html')) {
        return this.handleNonHtmlContent(url, urlObj, contentType);
      }

      const html = await response.text();
      
      // Parse OpenGraph and meta tags
      const preview = this.parseHtmlMetadata(html, urlObj);
      
      return {
        url,
        title: preview.title,
        description: preview.description,
        imageUrl: preview.imageUrl,
        siteName: preview.siteName || urlObj.hostname,
        faviconUrl: preview.faviconUrl || `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
        contentType: 'link',
        metadata: preview.metadata,
      };
    } catch (error: any) {
      console.error('Error fetching link preview:', error.message);
      
      // Return basic preview on error
      try {
        const urlObj = new URL(url);
        return {
          url,
          siteName: urlObj.hostname,
          faviconUrl: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
          contentType: 'link',
          metadata: { error: error.message },
        };
      } catch {
        return null;
      }
    }
  }

  // Handle non-HTML content types (images, videos, PDFs)
  private handleNonHtmlContent(url: string, urlObj: URL, contentType: string): Partial<LinkPreview> {
    const filename = urlObj.pathname.split('/').pop() || url;
    
    if (contentType.startsWith('image/')) {
      return {
        url,
        title: filename,
        imageUrl: url,
        siteName: urlObj.hostname,
        faviconUrl: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
        contentType: 'image',
        metadata: { mimeType: contentType },
      };
    }
    
    if (contentType.startsWith('video/')) {
      return {
        url,
        title: filename,
        siteName: urlObj.hostname,
        faviconUrl: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
        contentType: 'video',
        metadata: { mimeType: contentType },
      };
    }
    
    if (contentType === 'application/pdf') {
      return {
        url,
        title: filename,
        siteName: urlObj.hostname,
        faviconUrl: `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`,
        contentType: 'pdf',
        metadata: { mimeType: contentType },
      };
    }
    
    return {
      url,
      title: filename,
      siteName: urlObj.hostname,
      contentType: 'file',
      metadata: { mimeType: contentType },
    };
  }

  // Parse HTML for OpenGraph and standard meta tags
  private parseHtmlMetadata(html: string, urlObj: URL): {
    title?: string;
    description?: string;
    imageUrl?: string;
    siteName?: string;
    faviconUrl?: string;
    metadata: any;
  } {
    const metadata: any = {};
    
    // Helper to extract meta content
    const getMeta = (property: string): string | undefined => {
      // OpenGraph
      const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
      if (ogMatch) return ogMatch[1];
      
      // Standard meta name
      const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'));
      if (nameMatch) return nameMatch[1];
      
      // Reverse order (content before property/name)
      const reverseOgMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'));
      if (reverseOgMatch) return reverseOgMatch[1];
      
      const reverseNameMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i'));
      if (reverseNameMatch) return reverseNameMatch[1];
      
      return undefined;
    };

    // Get title
    let title = getMeta('og:title') || getMeta('twitter:title');
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : undefined;
    }

    // Get description
    const description = getMeta('og:description') || getMeta('twitter:description') || getMeta('description');

    // Get image
    let imageUrl = getMeta('og:image') || getMeta('twitter:image') || getMeta('twitter:image:src');
    if (imageUrl && !imageUrl.startsWith('http')) {
      // Convert relative URL to absolute
      imageUrl = new URL(imageUrl, urlObj.origin).href;
    }

    // Get site name
    const siteName = getMeta('og:site_name') || getMeta('application-name');

    // Get favicon
    let faviconUrl: string | undefined;
    const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i);
    if (iconMatch) {
      faviconUrl = iconMatch[1];
      if (!faviconUrl.startsWith('http')) {
        faviconUrl = new URL(faviconUrl, urlObj.origin).href;
      }
    }

    // Collect additional metadata
    metadata.type = getMeta('og:type');
    metadata.author = getMeta('author') || getMeta('article:author');
    metadata.publishedTime = getMeta('article:published_time');
    metadata.twitterCard = getMeta('twitter:card');
    metadata.twitterSite = getMeta('twitter:site');
    
    // Get video URL if present
    const videoUrl = getMeta('og:video') || getMeta('og:video:url');
    if (videoUrl) {
      metadata.videoUrl = videoUrl;
    }

    return {
      title: title ? this.decodeHtmlEntities(title) : undefined,
      description: description ? this.decodeHtmlEntities(description.substring(0, 300)) : undefined,
      imageUrl,
      siteName,
      faviconUrl,
      metadata,
    };
  }

  // Decode HTML entities
  private decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' ',
      '&#x27;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '=',
    };
    
    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
  }

  // Get previews for a message
  async getMessagePreviews(messageId: string): Promise<LinkPreview[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_link_previews 
      WHERE message_id = ${messageId}::uuid AND expires_at > NOW()
      ORDER BY fetched_at
    `;
    return result.map(row => this.mapLinkPreview(row));
  }

  // Process message and generate previews
  async processMessage(messageId: string, content: string): Promise<LinkPreview[]> {
    const urls = this.extractUrls(content);
    const previews: LinkPreview[] = [];

    for (const url of urls.slice(0, 5)) { // Limit to 5 URLs
      const preview = await this.getOrFetchPreview(messageId, url);
      if (preview) previews.push(preview);
    }

    return previews;
  }

  // Delete expired previews (cleanup job)
  async deleteExpiredPreviews(): Promise<number> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_link_previews WHERE expires_at < NOW()
    `;
    return result;
  }

  // Refresh preview for a URL
  async refreshPreview(messageId: string, url: string): Promise<LinkPreview | null> {
    // Delete existing
    await prisma.$executeRaw`
      DELETE FROM bondarys.chat_link_previews WHERE message_id = ${messageId}::uuid AND url = ${url}
    `;

    // Fetch fresh
    return this.getOrFetchPreview(messageId, url);
  }

  private mapLinkPreview(row: any): LinkPreview {
    return {
      id: row.id,
      messageId: row.message_id,
      url: row.url,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      siteName: row.site_name,
      faviconUrl: row.favicon_url,
      contentType: row.content_type,
      metadata: row.metadata || {},
      fetchedAt: row.fetched_at,
      expiresAt: row.expires_at,
    };
  }
}

export const linkPreviewService = new LinkPreviewService();
