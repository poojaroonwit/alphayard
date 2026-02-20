export interface CircleLocation {
  id: string;
  userName: string;
  latitude: number;
  longitude: number;
  lastUpdated: Date;
  isOnline: boolean;
}

export interface CircleMember {
  id: string;
  name: string;
  notifications: number;
  isComposite: boolean;
  type: string;
  circleId: string;
  avatarUrl?: string;
  isOnline?: boolean;
  role?: string;
}

export interface CircleStatusMember {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastActive: Date;
  heartRate: number;
  heartRateHistory: number[];
  steps: number;
  sleepHours: number;
  location: string;
  batteryLevel: number;
  isEmergency: boolean;
}
