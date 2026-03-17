import axios from 'axios'

// Prefer relative API base to route through Next.js rewrites, avoiding localhost mismatches
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export const cmsService = {
  // Localization: languages
  async getLanguages(applicationId?: string) {
    try {
      const response = await axios.get(`${API_BASE}/cms/localization/languages`, {
        timeout: 5000,
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
      })
      return response.data?.languages || []
    } catch (error) {
      console.error('Failed to fetch languages:', error)
      throw error
    }
  },

  // Localization: categories
  async getCategories(applicationId?: string) {
    try {
      const response = await axios.get(`${API_BASE}/cms/localization/categories`, {
        timeout: 5000,
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      throw error
    }
  },

  // Localization: translation keys (for fallback display)
  async getTranslationKeys(params?: { category?: string; search?: string; activeOnly?: boolean }, applicationId?: string) {
    try {
      const query = new URLSearchParams()
      if (params?.category && params.category !== 'all') query.set('category', params.category)
      if (params?.search) query.set('search', params.search)
      if (params?.activeOnly) query.set('active_only', 'true')

      const response = await axios.get(`${API_BASE}/cms/localization/keys?${query.toString()}`, {
        timeout: 5000,
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
      })
      return response.data?.keys || []
    } catch (error) {
      console.error('Failed to fetch translation keys:', error)
      throw error
    }
  },

  // Localization: paginated translations list (optional query params)
  async getTranslations(params?: { languageCode?: string; category?: string; approvedOnly?: boolean; page?: number; pageSize?: number; search?: string; sort?: string; direction?: 'asc' | 'desc' }, applicationId?: string) {
    try {
      const query = new URLSearchParams()
      // map languageCode -> language_id expected by backend list endpoint
      if (params?.languageCode && params.languageCode !== 'all') {
        try {
          const langs = await cmsService.getLanguages(applicationId)
          const match = langs.find((l: any) => l.code === params.languageCode)
          if (match?.id) {
            query.set('language_id', match.id)
          }
        } catch (_) {
          // ignore lookup errors; fall back to no language filter
        }
      }
      if (params?.category && params.category !== 'all') query.set('category', params.category)
      if (params?.approvedOnly) query.set('approved_only', 'true')
      if (params?.page) query.set('page', String(params.page))
      if (params?.pageSize) query.set('page_size', String(params.pageSize))
      if (params?.search) query.set('search', params.search)
      if (params?.sort) query.set('sort', params.sort)
      if (params?.direction) query.set('direction', params.direction)

      const response = await axios.get(`${API_BASE}/cms/localization/translations?${query.toString()}`, {
        timeout: 10000,
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
      })
      let list = response.data?.translations || []

      // Fallback: if empty, try per-language endpoint and adapt to list format
      const desiredCode = params?.languageCode && params.languageCode !== 'all' ? params.languageCode : 'en'
      if ((!list || list.length === 0) && desiredCode) {
        try {
          const byLang = await axios.get(`${API_BASE}/cms/localization/translations/${desiredCode}`, {
            timeout: 5000,
            headers: applicationId ? { 'X-Application-ID': applicationId } : {}
          })
          const map = byLang.data?.translations || {}
          list = Object.keys(map).map((k) => ({
            id: `${k}-${desiredCode}`,
            value: map[k],
            translation_keys: { key: k },
            languages: { code: desiredCode },
          }))
        } catch (_) {
          // ignore fallback error
        }
      }

      // Final fallback: show keys with empty value so admin can enter translations
      if (!list || list.length === 0) {
        try {
          const keys = await cmsService.getTranslationKeys({ category: params?.category, activeOnly: true }, applicationId)
          list = keys.map((k: any) => ({
            id: `${k.id}-${desiredCode}`,
            value: '',
            translation_keys: { key: k.key, category: k.category, description: k.description },
            languages: { code: desiredCode },
          }))
        } catch (_) {}
      }

      return list
    } catch (error) {
      console.error('Failed to fetch translations:', error)
      throw error
    }
  },

  // Localization: create/update/delete
  async createTranslation(payload: { key: string; value: string; language: string; category: string; description?: string; isActive?: boolean }, applicationId?: string) {
    const response = await axios.post(`${API_BASE}/cms/localization/translations`, payload, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  async updateTranslation(id: string, payload: { key?: string; value?: string; language?: string; category?: string; description?: string; isActive?: boolean; isApproved?: boolean }, applicationId?: string) {
    const response = await axios.put(`${API_BASE}/cms/localization/translations/${id}`, payload, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  async deleteTranslation(id: string, applicationId?: string) {
    const response = await axios.delete(`${API_BASE}/cms/localization/translations/${id}`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  // Language management
  async createLanguage(payload: { code: string; name: string; native_name?: string; direction?: string; flag_emoji?: string; is_active?: boolean; is_default?: boolean }, applicationId?: string) {
    const response = await axios.post(`${API_BASE}/cms/localization/languages`, payload, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  async updateLanguage(id: string, payload: { code?: string; name?: string; native_name?: string; direction?: string; flag_emoji?: string; is_active?: boolean; is_default?: boolean }, applicationId?: string) {
    const response = await axios.put(`${API_BASE}/cms/localization/languages/${id}`, payload, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  async deleteLanguage(id: string, applicationId?: string) {
    const response = await axios.delete(`${API_BASE}/cms/localization/languages/${id}`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  // Timezone management
  async getTimezones(applicationId?: string) {
    try {
      const response = await axios.get(`${API_BASE}/cms/localization/timezones`, {
        timeout: 5000,
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
      })
      return response.data?.timezones || []
    } catch (error) {
      console.error('Failed to fetch timezones:', error)
      throw error
    }
  },

  // Dynamic Content Management
  async getContentPages(params?: { type?: string; status?: string; page?: number; pageSize?: number; search?: string }, applicationId?: string) {
    const query = new URLSearchParams()
    if (params?.type && params.type !== 'all') query.set('type', params.type)
    if (params?.status && params.status !== 'all') query.set('status', params.status)
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('page_size', String(params.pageSize))
    if (params?.search) query.set('search', params.search)

    try {
      const response = await axios.get(`${API_BASE}/cms/content/admin/content?${query.toString()}`, {
          headers: applicationId ? { 'X-Application-ID': applicationId } : {}
      })
      return response.data?.pages || []
    } catch (error) {
      console.error('Error fetching content pages:', error)
      // Return empty array when no data is available
      return []
    }
  },

  async getContentPage(id: string, applicationId?: string) {
    const response = await axios.get(`${API_BASE}/cms/content/pages/${id}`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.page
  },

  async createContentPage(payload: {
    title: string
    slug: string
    type: 'marketing' | 'news' | 'inspiration' | 'popup'
    status: 'draft' | 'published' | 'archived'
    components: any[]
  }, applicationId?: string) {
    const response = await axios.post(`${API_BASE}/cms/content/pages`, payload, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.page
  },

  async updateContentPage(id: string, payload: any, applicationId?: string) {
    const response = await axios.put(`${API_BASE}/cms/content/pages/${id}`, payload, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.page
  },

  async deleteContentPage(id: string, applicationId?: string) {
    const response = await axios.delete(`${API_BASE}/cms/content/pages/${id}`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },


  // Content Analytics
  async getContentAnalytics(pageId: string, applicationId?: string) {
    const response = await axios.get(`${API_BASE}/cms/content/pages/${pageId}/analytics`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.analytics
  },

  async trackContentView(pageId: string, userId?: string, applicationId?: string) {
    const response = await axios.post(`${API_BASE}/cms/content/pages/${pageId}/view`, {
      userId,
      timestamp: new Date().toISOString()
    }, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  // Content Templates
  async getContentTemplates(applicationId?: string) {
    const response = await axios.get(`${API_BASE}/cms/content/templates`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.templates || []
  },

  async createContentFromTemplate(templateId: string, customizations: any, applicationId?: string) {
    const response = await axios.post(`${API_BASE}/cms/content/templates/${templateId}/create`, customizations, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.page
  },

  // Version Control
  async getContentVersions(pageId: string, params?: { page?: number; pageSize?: number }, applicationId?: string) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('page_size', String(params.pageSize))

    const response = await axios.get(`${API_BASE}/cms/versions/pages/${pageId}/versions?${query.toString()}`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.versions || []
  },

  async getContentVersion(pageId: string, versionId: string, applicationId?: string) {
    const response = await axios.get(`${API_BASE}/cms/versions/pages/${pageId}/versions/${versionId}`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.version
  },

  async createContentVersion(pageId: string, payload: {
    title: string
    content: any
    changeDescription?: string
    isAutoSave?: boolean
  }, applicationId?: string) {
    const response = await axios.post(`${API_BASE}/cms/versions/pages/${pageId}/versions`, payload, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.version
  },

  async restoreContentVersion(pageId: string, versionId: string, restoreDescription?: string, applicationId?: string) {
    const response = await axios.post(`${API_BASE}/cms/versions/pages/${pageId}/versions/${versionId}/restore`, {
      restore_description: restoreDescription
    }, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  async deleteContentVersion(pageId: string, versionId: string, applicationId?: string) {
    const response = await axios.delete(`${API_BASE}/cms/versions/pages/${pageId}/versions/${versionId}`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  },

  async compareContentVersions(pageId: string, versionId1: string, versionId2: string, applicationId?: string) {
    const response = await axios.get(`${API_BASE}/cms/versions/pages/${pageId}/versions/${versionId1}/compare/${versionId2}`, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data?.diff
  },

  async autoSaveContent(pageId: string, content: any, applicationId?: string) {
    const response = await axios.post(`${API_BASE}/cms/versions/pages/${pageId}/auto-save`, { content }, {
        headers: applicationId ? { 'X-Application-ID': applicationId } : {}
    })
    return response.data
  }
}
