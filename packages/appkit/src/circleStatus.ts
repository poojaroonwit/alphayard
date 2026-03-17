import type { 
  CircleStatusMember, 
  CircleStatusUpdate, 
  CircleLocationUpdate 
} from './types';
import { HttpClient } from './http';

export class CircleStatusModule {
  constructor(private http: HttpClient) {}

  /** Get circle members status */
  async getCircleMembers(circleId: string): Promise<CircleStatusMember[]> {
    const res = await this.http.get<{ members: CircleStatusMember[] }>(`/api/v1/circles/status/circles/${circleId}/members`);
    return res.members || [];
  }

  /** Get specific member status */
  async getMemberStatus(memberId: string): Promise<CircleStatusMember> {
    const res = await this.http.get<{ member: CircleStatusMember }>(`/api/v1/circles/status/members/${memberId}`);
    return res.member;
  }

  /** Update member status (online, offline, etc.) */
  async updateMemberStatus(update: CircleStatusUpdate): Promise<CircleStatusMember> {
    const res = await this.http.put<{ member: CircleStatusMember }>(`/api/v1/circles/status/members/${update.memberId}`, update);
    return res.member;
  }

  /** Update member location */
  async updateMemberLocation(locationUpdate: CircleLocationUpdate): Promise<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `/api/v1/circles/status/members/${locationUpdate.memberId}/location`, 
      locationUpdate
    );
  }

  /** Get all locations within a circle */
  async getCircleLocations(circleId: string): Promise<CircleLocationUpdate[]> {
    const res = await this.http.get<{ locations: CircleLocationUpdate[] }>(`/api/v1/circles/status/circles/${circleId}/locations`);
    return res.locations || [];
  }

  /** Get members currently in emergency status within a circle */
  async getEmergencyStatus(circleId: string): Promise<CircleStatusMember[]> {
    const res = await this.http.get<{ members: CircleStatusMember[] }>(`/api/v1/circles/status/circles/${circleId}/emergency`);
    return res.members || [];
  }

  /** Send an emergency alert for a member */
  async sendEmergencyAlert(memberId: string, message?: string): Promise<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`/api/v1/circles/status/members/${memberId}/emergency`, { message });
  }

  /** Get health metrics for a member */
  async getHealthMetrics(memberId: string, dateFrom?: string, dateTo?: string): Promise<any> {
    const q = new URLSearchParams();
    if (dateFrom) q.append('dateFrom', dateFrom);
    if (dateTo) q.append('dateTo', dateTo);

    return this.http.get<any>(`/api/v1/circles/status/members/${memberId}/health?${q.toString()}`);
  }

  /** Update health metrics for a member */
  async updateHealthMetrics(memberId: string, metrics: {
    heartRate?: number;
    steps?: number;
    sleepHours?: number;
    timestamp?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`/api/v1/circles/status/members/${memberId}/health`, metrics);
  }

  /** Get activity history for a member */
  async getActivityHistory(memberId: string, days: number = 7): Promise<any[]> {
    const res = await this.http.get<{ activities: any[] }>(`/api/v1/circles/status/members/${memberId}/activity?days=${days}`);
    return res.activities || [];
  }
}
