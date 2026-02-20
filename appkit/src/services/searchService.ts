/**
 * Global Search Service
 * Provides unified search across all admin resources
 */

import { userService } from './userService'
import { listContent } from './contentService'

export interface SearchResult {
  id: string
  type: 'user' | 'content' | 'ticket' | 'audit'
  title: string
  subtitle?: string
  description?: string
  url: string
  metadata?: Record<string, any>
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

class SearchService {
  /**
   * Perform global search across all resources
   */
  async search(query: string, limit: number = 20): Promise<SearchResponse> {
    if (!query || query.trim().length < 2) {
      return { results: [], total: 0, query }
    }

    const searchTerm = query.trim().toLowerCase()
    const results: SearchResult[] = []

    try {
      // Search users
      try {
        const { users } = await userService.getUsers()
        const userResults = users
          .filter(user => 
            (user.firstName?.toLowerCase().includes(searchTerm) || false) ||
            (user.lastName?.toLowerCase().includes(searchTerm) || false) ||
            user.email.toLowerCase().includes(searchTerm)
          )
          .slice(0, 5)
          .map((user: any) => ({
            id: user.id || '',
            type: 'user' as const,
            title: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
            subtitle: user.email,
            description: `Status: ${user.status} • Source: ${user.source}`,
            url: `?module=users&id=${user.id}`,
            metadata: { status: user.status, source: user.source }
          }))
        results.push(...userResults)
      } catch (error) {
        console.error('Error searching users:', error)
      }

      // Search content
      try {
        const contentResults = await listContent()
        const filteredContent = contentResults
          .filter((content: any) => 
            content.title?.toLowerCase().includes(searchTerm) ||
            content.description?.toLowerCase().includes(searchTerm)
          )
          .slice(0, 5)
          .map((content: any) => ({
            id: content.id || '',
            type: 'content' as const,
            title: content.title || 'Untitled Content',
            subtitle: `Type: ${content.type}`,
            description: content.description || '',
            url: `?module=cms&id=${content.id}`,
            metadata: { type: content.type }
          }))
        results.push(...filteredContent)
      } catch (error) {
        console.error('Error searching content:', error)
      }

      // Limit total results
      const limitedResults = results.slice(0, limit)

      return {
        results: limitedResults,
        total: results.length,
        query
      }
    } catch (error) {
      console.error('Global search error:', error)
      return { results: [], total: 0, query }
    }
  }

  /**
   * Quick search - returns top 5 results
   */
  async quickSearch(query: string): Promise<SearchResult[]> {
    const response = await this.search(query, 5)
    return response.results
  }
}

export const searchService = new SearchService()






