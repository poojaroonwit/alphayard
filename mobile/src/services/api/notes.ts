import { api } from '.';

export interface Note {
  id: string;
  title: string | null;
  content: string;
  circleId: string;
  userId: string;
  category: 'personal' | 'work' | 'circle' | 'ideas';
  isPinned: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  title?: string;
  content?: string;
  category?: 'personal' | 'work' | 'circle' | 'ideas';
  isPinned?: boolean;
  color?: string;
}

export interface UpdateNotePayload {
  title?: string | null;
  content?: string;
  category?: 'personal' | 'work' | 'circle' | 'ideas';
  isPinned?: boolean;
  color?: string;
}

export const notesApi = {
  async list() {
    const res = await api.get('/notes');
    return res;
  },
  async create(payload: CreateNotePayload) {
    const res = await api.post('/notes', payload);
    return res.data;
  },
  async update(id: string, payload: UpdateNotePayload) {
    const res = await api.put(`/notes/${id}`, payload);
    return res.data;
  },
  async remove(id: string) {
    const res = await api.delete(`/notes/${id}`);
    return res.data;
  },
};

