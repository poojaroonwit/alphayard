import { apiClient } from './apiClient';

export interface CircleType {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  sort_order: number;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  circleTypeId?: string;
  circleType?: CircleType;
  settings: any;
  createdAt: string;
  updatedAt: string;
  members?: CircleMember[];
}

export interface CircleMember {
  id: string;
  circleId: string;
  userId: string;
  role: 'admin' | 'member';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  invitedBy?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    phoneNumber?: string;
  };
}

export interface CircleInvitation {
  id: string;
  circleId: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCircleRequest {
  name: string;
  description?: string;
  circleTypeId?: string;
  type?: string;
  settings?: any;
}

export interface UpdateCircleRequest {
  name?: string;
  description?: string;
  settings?: any;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member';
}

export const circleApi = {
  createCircle: async (data: CreateCircleRequest): Promise<{ success: boolean; circle: Circle }> => {
    return apiClient.post('/circles', data);
  },

  getCircles: async (): Promise<{ success: boolean; circles: Circle[] }> => {
    const res = await apiClient.get<any>('/circles');
    // bondary-backend returns circles array directly or wrapped
    const circles = Array.isArray(res) ? res : (res.circles || res.data || []);
    return { success: true, circles };
  },

  getCircle: async (circleId: string): Promise<{ success: boolean; circle: Circle }> => {
    const res = await apiClient.get<any>(`/circles/${circleId}`);
    return { success: true, circle: res.circle || res };
  },

  updateCircle: async (circleId: string, data: UpdateCircleRequest): Promise<{ success: boolean; circle: Circle }> => {
    const res = await apiClient.put<any>(`/circles/${circleId}`, data);
    return { success: true, circle: res.circle || res };
  },

  deleteCircle: async (circleId: string): Promise<{ success: boolean; message: string }> => {
    await apiClient.delete(`/circles/${circleId}`);
    return { success: true, message: 'Circle deleted' };
  },

  getCircleMembers: async (circleId: string): Promise<{ success: boolean; members: CircleMember[] }> => {
    const res = await apiClient.get<any>(`/circles/${circleId}/members`);
    const members = Array.isArray(res) ? res : (res.members || res.data || []);
    return { success: true, members };
  },

  addCircleMember: async (circleId: string, data: InviteMemberRequest): Promise<{ success: boolean; invitation: CircleInvitation }> => {
    const res = await apiClient.post<any>(`/circles/${circleId}/members`, data);
    return { success: true, invitation: res.invitation || res };
  },

  removeCircleMember: async (circleId: string, userId: string): Promise<{ success: boolean; message: string }> => {
    await apiClient.delete(`/circles/${circleId}/members/${userId}`);
    return { success: true, message: 'Member removed' };
  },

  updateCircleMemberRole: async (circleId: string, userId: string, role: 'admin' | 'member'): Promise<{ success: boolean; member: CircleMember }> => {
    const res = await apiClient.patch<any>(`/circles/${circleId}/members/${userId}`, { role });
    return { success: true, member: res.member || res };
  },

  joinCircleByCode: async (invitationCode: string): Promise<{ success: boolean; circle: Circle }> => {
    const res = await apiClient.post<any>('/circles/join', { inviteCode: invitationCode });
    return { success: res.success !== false, circle: res.circle || res };
  },

  leaveCircle: async (circleId: string): Promise<{ success: boolean; message: string }> => {
    await apiClient.post(`/circles/leave`, { circleId });
    return { success: true, message: 'Left circle successfully' };
  },

  getCircleTypes: async (): Promise<{ success: boolean; data: CircleType[] }> => {
    const res = await apiClient.get<any>('/circle-types');
    return { success: true, data: Array.isArray(res) ? res : (res.data || []) };
  },

  inviteMember: async (circleId: string, email: string, message?: string): Promise<{ success: boolean; message: string }> => {
    await apiClient.post(`/circles/invite`, { circleId, email, message });
    return { success: true, message: 'Invite sent' };
  },
};

export const CircleApi = circleApi;
export const createCircle = circleApi.createCircle;
export const getFamilies = circleApi.getCircles;
