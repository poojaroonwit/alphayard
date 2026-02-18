import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface MarketingSlideData {
  title: string
  subtitle: string
  description: string
  icon: string
  gradient: string[]
  features: string[]
  slide_order: number
}

export interface MarketingSlide {
  id: string
  title: string
  slug: string
  slideData: MarketingSlideData
  status: 'draft' | 'published' | 'archived'
  priority: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

export const marketingService = {
  async getSlides(): Promise<MarketingSlide[]> {
    try {
      const response = await axios.get(`${API_BASE}/cms/marketing/slides`, {
        headers: getAuthHeaders(),
        timeout: 10000
      })
      return response.data?.slides || []
    } catch (error) {
      console.error('Failed to fetch marketing slides:', error)
      throw error
    }
  },

  async createSlide(payload: { title: string; slug: string; slideData: MarketingSlideData; status?: string; priority?: number }): Promise<MarketingSlide> {
    const response = await axios.post(`${API_BASE}/cms/marketing/slides`, payload, {
      headers: getAuthHeaders()
    })
    return response.data?.slide
  },

  async updateSlide(id: string, payload: Partial<{ title: string; slug: string; slideData: MarketingSlideData; status: string; priority: number }>): Promise<MarketingSlide> {
    const response = await axios.put(`${API_BASE}/cms/marketing/slides/${id}`, payload, {
      headers: getAuthHeaders()
    })
    return response.data?.slide
  },

  async deleteSlide(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/cms/marketing/slides/${id}`, {
      headers: getAuthHeaders()
    })
  }
}
