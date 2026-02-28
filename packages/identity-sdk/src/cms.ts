import type { CMSContent } from './types';
import { HttpClient } from './http';

export class CMSModule {
  constructor(private http: HttpClient) {}

  /** Get a content page by slug */
  async getContent(slug: string): Promise<CMSContent> {
    return this.http.get<CMSContent>(`/api/v1/cms/content/pages/${slug}`);
  }

  /** List all published content pages */
  async listContent(params?: { type?: string; status?: string; limit?: number; offset?: number }): Promise<{ pages: CMSContent[]; total: number }> {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return this.http.get<{ pages: CMSContent[]; total: number }>(`/api/v1/cms/content/pages${qs}`);
  }

  /** Get content by ID */
  async getContentById(id: string): Promise<CMSContent> {
    return this.http.get<CMSContent>(`/api/v1/cms/content/${id}`);
  }
}
