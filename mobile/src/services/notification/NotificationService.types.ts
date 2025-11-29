export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'system' 
  | 'hourse' 
  | 'finance' 
  | 'health';

export interface Notification {
  id: string;
  userId?: string;
  familyId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  status: 'read' | 'unread';
  timestamp: Date | string;
  scheduledAt?: Date | string;
  senderId?: string;
  senderName?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  types: {
    [key in NotificationType]: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

