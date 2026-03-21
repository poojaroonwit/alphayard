import { api } from '../api';
import { Appointment } from '../../types/home';

export interface AppointmentFilters {
  circleId?: string;
  userId?: string;
  type?: Appointment['type'];
  dateFrom?: string;
  dateTo?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
  limit?: number;
  offset?: number;
}

export interface CreateAppointmentRequest {
  title: string;
  time: string;
  location: string;
  type: Appointment['type'];
  attendees: string[];
  circleId: string;
  description?: string;
  duration?: number; // in minutes
  reminders?: {
    type: 'push' | 'email' | 'sms';
    minutesBefore: number;
  }[];
}

export interface UpdateAppointmentRequest {
  title?: string;
  time?: string;
  location?: string;
  type?: Appointment['type'];
  attendees?: string[];
  description?: string;
  duration?: number;
  status?: 'upcoming' | 'completed' | 'cancelled';
}

export interface AppointmentResponse {
  id: string;
  title: string;
  time: string;
  location: string;
  type: Appointment['type'];
  attendees: string[];
  circleId: string;
  description?: string;
  duration?: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reminders: {
    id: string;
    type: 'push' | 'email' | 'sms';
    minutesBefore: number;
    sent: boolean;
    sentAt?: string;
  }[];
}

class AppointmentService {
  private baseUrl = '/appointments';

  async getAppointments(filters?: AppointmentFilters): Promise<AppointmentResponse[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.circleId) params.append('circleId', filters.circleId);
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response.data.appointments || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentResponse | null> {
    try {
      const response = await api.get(`${this.baseUrl}/${appointmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return null;
    }
  }

  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<AppointmentResponse> {
    try {
      const response = await api.post(`${this.baseUrl}`, appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentId: string, appointmentData: UpdateAppointmentRequest): Promise<AppointmentResponse> {
    try {
      const response = await api.put(`${this.baseUrl}/${appointmentId}`, appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${appointmentId}`);
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async getTodaysAppointments(circleId?: string): Promise<AppointmentResponse[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const params = new URLSearchParams();
      params.append('dateFrom', today);
      params.append('dateTo', today);
      if (circleId) params.append('circleId', circleId);

      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response.data.appointments || [];
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      return [];
    }
  }

  async getUpcomingAppointments(circleId?: string, days: number = 7): Promise<AppointmentResponse[]> {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const params = new URLSearchParams();
      params.append('dateFrom', today.toISOString().split('T')[0]);
      params.append('dateTo', futureDate.toISOString().split('T')[0]);
      params.append('status', 'upcoming');
      if (circleId) params.append('circleId', circleId);

      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response.data.appointments || [];
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      return [];
    }
  }

  async markAppointmentCompleted(appointmentId: string): Promise<AppointmentResponse> {
    try {
      const response = await api.patch(`${this.baseUrl}/${appointmentId}/complete`);
      return response.data;
    } catch (error) {
      console.error('Error marking appointment as completed:', error);
      throw error;
    }
  }

  async addReminder(appointmentId: string, reminder: {
    type: 'push' | 'email' | 'sms';
    minutesBefore: number;
  }): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/${appointmentId}/reminders`, reminder);
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  async removeReminder(appointmentId: string, reminderId: string): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${appointmentId}/reminders/${reminderId}`);
    } catch (error) {
      console.error('Error removing reminder:', error);
      throw error;
    }
  }

  async getAppointmentTypes(): Promise<string[]> {
    try {
      const response = await api.get(`${this.baseUrl}/types`);
      return response.data.types || [];
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      return ['medical', 'education', 'Circle', 'work', 'other'];
    }
  }

  async getAppointmentStats(circleId?: string, dateFrom?: string, dateTo?: string): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    cancelled: number;
    byType: Record<string, number>;
  }> {
    try {
      const params = new URLSearchParams();
      if (circleId) params.append('circleId', circleId);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await api.get(`${this.baseUrl}/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      return {
        total: 0,
        upcoming: 0,
        completed: 0,
        cancelled: 0,
        byType: {}
      };
    }
  }
}

export const appointmentService = new AppointmentService();

