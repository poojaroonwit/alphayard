import { apiClient } from '../api/apiClient';

export interface AIAgentRequest {
  message: string;
  context?: any;
  attachments?: Array<{ type: string; media_type: string; data: string; name?: string }>;
}

export interface AIAgentResponse {
  message: string;
  actions: any[];
  suggestions: string[];
  confidence: number;
}

export interface AIAgentConversation {
  id: string;
  messages: any[];
}

class AIAgentService {
  async getCapabilities(): Promise<any[]> {
    try {
      const response = await apiClient.get('/ai/capabilities');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get capabilities:', error);
      return [];
    }
  }

  async getConversationHistory(userId: string, circleId: string): Promise<AIAgentConversation> {
    try {
      const response = await apiClient.get(`/ai/history?userId=${userId}&circleId=${circleId}`);
      return response.data || { messages: [] };
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return { id: '', messages: [] };
    }
  }

  async processRequest(request: AIAgentRequest): Promise<AIAgentResponse> {
    try {
      const response = await apiClient.post('/ai/process', request);
      return response.data;
    } catch (error) {
      console.error('Failed to process AI request:', error);
      throw error;
    }
  }

  async clearConversationHistory(userId: string, circleId: string): Promise<void> {
    try {
      await apiClient.delete(`/ai/history?userId=${userId}&circleId=${circleId}`);
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
    }
  }
}

export const aiAgentService = new AIAgentService();
