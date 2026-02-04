import { api } from '.';

export interface TodoItem {
  id: string;
  title: string;
  description?: string | null;
  isCompleted: boolean;
  position: number;
  category: 'work' | 'personal' | 'circle' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  circleId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoPayload {
  title: string;
  description?: string | null;
  category?: 'work' | 'personal' | 'circle' | 'urgent';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null;
}

export interface UpdateTodoPayload {
  title?: string;
  description?: string | null;
  isCompleted?: boolean;
  category?: 'work' | 'personal' | 'circle' | 'urgent';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | null;
}

export const todosApi = {
  async list() {
    const res = await api.get('/todos');
    return res;
  },
  async create(payload: CreateTodoPayload) {
    const res = await api.post('/todos', payload);
    return res.data;
  },
  async update(id: string, payload: UpdateTodoPayload) {
    const res = await api.put(`/todos/${id}`, payload);
    return res.data;
  },
  async remove(id: string) {
    const res = await api.delete(`/todos/${id}`);
    return res.data;
  },
  async reorder(orderedIds: string[]) {
    const res = await api.post('/todos/reorder', { orderedIds });
    return res.data;
  },
};

