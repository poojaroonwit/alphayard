
import axios from 'axios';

// Create configured axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  updatedAt: string;
  components?: any[]; // Added for Page Editor
  author?: {
    firstName: string;
    lastName: string;
  };
}

export const pageService = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const { data } = await api.get('/api/page-builder/pages', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/page-builder/pages/${id}`);
    return data.page;
  },

  create: async (pageData: Partial<Page>) => {
    const { data } = await api.post('/api/page-builder/pages', pageData);
    return data.page;
  },

  update: async (id: string, pageData: Partial<Page>) => {
    const { data } = await api.put(`/api/page-builder/pages/${id}`, pageData);
    return data.page;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/page-builder/pages/${id}`);
    return data;
  },

  duplicate: async (id: string, newSlug: string) => {
    const { data } = await api.post(`/api/page-builder/pages/${id}/duplicate`, { newSlug });
    return data.page;
  },

  publish: async (id: string) => {
    const { data } = await api.post(`/api/page-builder/pages/${id}/publish`);
    return data.page;
  }
};
