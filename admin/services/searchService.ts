/**
 * Global Search Service
 * Provides unified search across all admin resources
 */

import { adminService } from './adminService'
import { userService } from './userService'
import { contentService } from './contentService'

export interface SearchResult {
  id: string
  type: 'user' | 'family' | 'content' | 'ticket' | 'audit'
  title: string
  subtitle?: string
  description?: string
  url?: string
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
        const users = await userService.getUsers()
        const userResults = users
          .filter(user => 
            user.firstName.toLowerCase().includes(searchTerm) ||
            user.lastName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
          )
          .slice(0, 5)
          .map(user => ({
            id: user.id,
            type: 'user' as const,
            title: `${user.firstName} ${user.lastName}`,
            subtitle: user.email,
            description: `Role: ${user.role} • Status: ${user.status}`,
            url: `?module=users&id=${user.id}`,
            metadata: { role: user.role, status: user.status }
          }))
        results.push(...userResults)
      } catch (error) {
        console.error('Error searching users:', error)
      }

      // Search families
      try {
        const families = await adminService.getSocialMediaFamilies()
        const familyResults = families
          .filter(family => 
            family.name?.toLowerCase().includes(searchTerm) ||
            family.id?.toLowerCase().includes(searchTerm)
          )
          .slice(0, 5)
          .map(family => ({
            id: family.id || '',
            type: 'family' as const,
            title: family.name || 'Unnamed Family',
            subtitle: `Family ID: ${family.id}`,
            description: `${family.memberCount || 0} members`,
            url: `?module=families&id=${family.id}`,
            metadata: { memberCount: family.memberCount }
          }))
        results.push(...familyResults)
      } catch (error) {
        console.error('Error searching families:', error)
      }

      // Search content
      try {
        const content = await contentService.getContentList({ limit: 50 })
        const contentResults = content
          .filter(item => 
            item.title?.toLowerCase().includes(searchTerm) ||
            item.slug?.toLowerCase().includes(searchTerm)
          )
          .slice(0, 5)
          .map(item => ({
            id: item.id || '',
            type: 'content' as const,
            title: item.title || 'Untitled',
            subtitle: item.slug || '',
            description: `Status: ${item.status || 'draft'}`,
            url: `?module=dynamic-content&studio=edit&id=${item.id}`,
            metadata: { status: item.status, type: item.type }
          }))
        results.push(...contentResults)
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





