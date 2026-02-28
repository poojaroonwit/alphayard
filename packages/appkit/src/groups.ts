import type { Circle, CircleMember } from './types';
import { HttpClient } from './http';

export class GroupsModule {
  constructor(private http: HttpClient) {}

  /** Get all circles the current user belongs to */
  async getUserCircles(): Promise<Circle[]> {
    const result = await this.http.get<{ circles: Circle[] }>('/api/v1/circles');
    return result.circles || [];
  }

  /** Get a specific circle by ID */
  async getCircle(circleId: string): Promise<Circle> {
    return this.http.get<Circle>(`/api/v1/circles/${circleId}`);
  }

  /** Get members of a circle */
  async getMembers(circleId: string): Promise<CircleMember[]> {
    const result = await this.http.get<{ members: CircleMember[] }>(
      `/api/v1/circles/${circleId}/members`,
    );
    return result.members || [];
  }

  /** Add a member to a circle (requires management scope) */
  async addMember(circleId: string, userId: string, role: string): Promise<CircleMember> {
    return this.http.post<CircleMember>(`/api/v1/circles/${circleId}/members`, {
      userId,
      role,
    });
  }

  /** Remove a member from a circle */
  async removeMember(circleId: string, userId: string): Promise<void> {
    await this.http.delete(`/api/v1/circles/${circleId}/members/${userId}`);
  }

  /** Update a member's role in a circle */
  async updateMemberRole(circleId: string, userId: string, role: string): Promise<CircleMember> {
    return this.http.patch<CircleMember>(
      `/api/v1/circles/${circleId}/members/${userId}`,
      { role },
    );
  }
}
