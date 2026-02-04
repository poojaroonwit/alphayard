import apiClient from '../api/apiClient';
import { unwrapEntity } from '../collectionService';

export interface SafetyCheckRequest {
  message?: string;
  recipients: string[];
  expiresIn?: number; // in minutes
  requireResponse: boolean;
}

export interface SafetyCheckResponse {
  status: 'safe' | 'unsafe' | 'need_help';
  message?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface EmergencyAlertRequest {
  type: 'medical' | 'fire' | 'police' | 'accident' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  recipients: string[];
  autoCallEmergency: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  isActive: boolean;
  notificationPreferences: {
    emergency: boolean;
    safety: boolean;
    daily: boolean;
  };
}

export class SafetyService {
  // Send safety check
  static async sendSafetyCheck(data: SafetyCheckRequest): Promise<any> {
    const response = await apiClient.post('/safety/check', data);
    return unwrapEntity(response.data);
  }

  // Respond to safety check
  static async respondToSafetyCheck(checkId: string, response: SafetyCheckResponse): Promise<void> {
    await apiClient.post(`/safety/check/${checkId}/respond`, response);
  }

  // Get safety check status
  static async getSafetyCheckStatus(checkId: string): Promise<any> {
    const response = await apiClient.get(`/safety/check/${checkId}`);
    return unwrapEntity(response.data);
  }

  // Cancel safety check
  static async cancelSafetyCheck(checkId: string): Promise<void> {
    await apiClient.post(`/safety/check/${checkId}/cancel`);
  }

  // Get safety check history
  static async getSafetyCheckHistory(): Promise<any[]> {
    const response = await apiClient.get('/safety/check/history');
    return (response.data as any[] || []).map(unwrapEntity);
  }

  // Send emergency alert
  static async sendEmergencyAlert(data: EmergencyAlertRequest): Promise<any> {
    const response = await apiClient.post('/safety/alert', data);
    return unwrapEntity(response.data);
  }

  // Cancel emergency alert
  static async cancelEmergencyAlert(alertId: string): Promise<void> {
    await apiClient.post(`/safety/alert/${alertId}/cancel`);
  }

  // Get emergency alert status
  static async getEmergencyAlertStatus(alertId: string): Promise<any> {
    const response = await apiClient.get(`/safety/alert/${alertId}`);
    return unwrapEntity(response.data);
  }

  // Get emergency alert history
  static async getEmergencyAlertHistory(): Promise<any[]> {
    const response = await apiClient.get('/safety/alert/history');
    return (response.data as any[] || []).map(unwrapEntity);
  }

  // Get emergency contacts
  static async getEmergencyContacts(): Promise<{ data: EmergencyContact[] }> {
    return apiClient.get('/safety/emergency-contacts');
  }

  // Add emergency contact
  static async addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<{ data: EmergencyContact }> {
    return apiClient.post('/safety/emergency-contacts', contact);
  }

  // Update emergency contact
  static async updateEmergencyContact(contactId: string, contact: Partial<EmergencyContact>): Promise<{ data: EmergencyContact }> {
    return apiClient.put(`/safety/emergency-contacts/${contactId}`, contact);
  }

  // Remove emergency contact
  static async removeEmergencyContact(contactId: string): Promise<void> {
    await apiClient.delete(`/safety/emergency-contacts/${contactId}`);
  }

  // Set primary emergency contact
  static async setPrimaryEmergencyContact(contactId: string): Promise<{ data: EmergencyContact }> {
    return apiClient.post(`/safety/emergency-contacts/${contactId}/primary`);
  }

  // Test emergency contact
  static async testEmergencyContact(contactId: string): Promise<void> {
    await apiClient.post(`/safety/emergency-contacts/${contactId}/test`);
  }

  // Get crisis mode status
  static async getCrisisModeStatus(): Promise<{ data: { isActive: boolean; activatedAt?: string; reason?: string } }> {
    return apiClient.get('/safety/crisis-mode');
  }

  // Activate crisis mode
  static async activateCrisisMode(reason: string): Promise<{ data: { isActive: boolean; activatedAt: string } }> {
    return apiClient.post('/safety/crisis-mode/activate', { reason });
  }

  // Deactivate crisis mode
  static async deactivateCrisisMode(): Promise<{ data: { isActive: boolean } }> {
    return apiClient.post('/safety/crisis-mode/deactivate');
  }

  // Get crisis mode history
  static async getCrisisModeHistory(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/crisis-mode/history');
  }

  // Get safety statistics
  static async getSafetyStatistics(): Promise<any> {
    const response = await apiClient.get('/safety/statistics');
    return response.data; // Mostly summary data, not usually entities that need unwrapping, but we keep it flexible
  }

  // Get safety settings
  static async getSafetySettings(): Promise<{ data: any }> {
    return apiClient.get('/safety/settings');
  }

  // Update safety settings
  static async updateSafetySettings(settings: any): Promise<{ data: any }> {
    return apiClient.put('/safety/settings', settings);
  }

  // Get safety notifications
  static async getSafetyNotifications(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/notifications');
  }

  // Mark safety notification as read
  static async markSafetyNotificationAsRead(notificationId: string): Promise<void> {
    await apiClient.post(`/safety/notifications/${notificationId}/read`);
  }

  // Get safety alerts
  static async getSafetyAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/alerts');
  }

  // Create safety alert
  static async createSafetyAlert(alert: any): Promise<{ data: any }> {
    return apiClient.post('/safety/alerts', alert);
  }

  // Update safety alert
  static async updateSafetyAlert(alertId: string, alert: any): Promise<{ data: any }> {
    return apiClient.put(`/safety/alerts/${alertId}`, alert);
  }

  // Delete safety alert
  static async deleteSafetyAlert(alertId: string): Promise<void> {
    await apiClient.delete(`/safety/alerts/${alertId}`);
  }

  // Get safety zones
  static async getSafetyZones(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/zones');
  }

  // Create safety zone
  static async createSafetyZone(zone: any): Promise<{ data: any }> {
    return apiClient.post('/safety/zones', zone);
  }

  // Update safety zone
  static async updateSafetyZone(zoneId: string, zone: any): Promise<{ data: any }> {
    return apiClient.put(`/safety/zones/${zoneId}`, zone);
  }

  // Delete safety zone
  static async deleteSafetyZone(zoneId: string): Promise<void> {
    await apiClient.delete(`/safety/zones/${zoneId}`);
  }

  // Get safety check templates
  static async getSafetyCheckTemplates(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/check-templates');
  }

  // Create safety check template
  static async createSafetyCheckTemplate(template: any): Promise<{ data: any }> {
    return apiClient.post('/safety/check-templates', template);
  }

  // Update safety check template
  static async updateSafetyCheckTemplate(templateId: string, template: any): Promise<{ data: any }> {
    return apiClient.put(`/safety/check-templates/${templateId}`, template);
  }

  // Delete safety check template
  static async deleteSafetyCheckTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`/safety/check-templates/${templateId}`);
  }

  // Get emergency protocols
  static async getEmergencyProtocols(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/emergency-protocols');
  }

  // Create emergency protocol
  static async createEmergencyProtocol(protocol: any): Promise<{ data: any }> {
    return apiClient.post('/safety/emergency-protocols', protocol);
  }

  // Update emergency protocol
  static async updateEmergencyProtocol(protocolId: string, protocol: any): Promise<{ data: any }> {
    return apiClient.put(`/safety/emergency-protocols/${protocolId}`, protocol);
  }

  // Delete emergency protocol
  static async deleteEmergencyProtocol(protocolId: string): Promise<void> {
    await apiClient.delete(`/safety/emergency-protocols/${protocolId}`);
  }

  // Get safety training
  static async getSafetyTraining(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/training');
  }

  // Complete safety training
  static async completeSafetyTraining(trainingId: string): Promise<{ data: any }> {
    return apiClient.post(`/safety/training/${trainingId}/complete`);
  }

  // Get safety certifications
  static async getSafetyCertifications(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/certifications');
  }

  // Get safety resources
  static async getSafetyResources(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/resources');
  }

  // Get safety tips
  static async getSafetyTips(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/tips');
  }

  // Get safety news
  static async getSafetyNews(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/news');
  }

  // Get safety weather alerts
  static async getSafetyWeatherAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/weather-alerts');
  }

  // Get safety traffic alerts
  static async getSafetyTrafficAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/traffic-alerts');
  }

  // Get safety crime alerts
  static async getSafetyCrimeAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/crime-alerts');
  }

  // Get safety natural disaster alerts
  static async getSafetyNaturalDisasterAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/natural-disaster-alerts');
  }

  // Get safety health alerts
  static async getSafetyHealthAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/health-alerts');
  }

  // Get safety travel alerts
  static async getSafetyTravelAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/travel-alerts');
  }

  // Get safety school alerts
  static async getSafetySchoolAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/school-alerts');
  }

  // Get safety work alerts
  static async getSafetyWorkAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/work-alerts');
  }

  // Get safety home alerts
  static async getSafetyHomeAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/home-alerts');
  }

  // Get safety community alerts
  static async getSafetyCommunityAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/community-alerts');
  }

  // Get safety government alerts
  static async getSafetyGovernmentAlerts(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/government-alerts');
  }

  // Get safety emergency services
  static async getSafetyEmergencyServices(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/emergency-services');
  }

  // Get safety hospitals
  static async getSafetyHospitals(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/hospitals');
  }

  // Get safety police stations
  static async getSafetyPoliceStations(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/police-stations');
  }

  // Get safety fire stations
  static async getSafetyFireStations(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/fire-stations');
  }

  // Get safety pharmacies
  static async getSafetyPharmacies(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/pharmacies');
  }

  // Get safety shelters
  static async getSafetyShelters(): Promise<{ data: any[] }> {
    return apiClient.get('/safety/shelters');
  }
} 