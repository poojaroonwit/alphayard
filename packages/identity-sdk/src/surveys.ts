import { HttpClient } from './http';

export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'closed';
  questions: SurveyQuestion[];
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'nps' | 'yes_no' | 'dropdown';
  question: string;
  options?: string[];
  required?: boolean;
}

export interface SurveyResults {
  responses: unknown[];
  summary: Record<string, unknown>;
}

export class SurveysModule {
  constructor(private http: HttpClient) {}

  /** List all surveys */
  async list(): Promise<Survey[]> {
    const res = await this.http.get<{ surveys: Survey[] }>('/api/v1/surveys');
    return res.surveys || [];
  }

  /** Get a specific survey */
  async get(surveyId: string): Promise<Survey> {
    return this.http.get<Survey>(`/api/v1/surveys/${surveyId}`);
  }

  /** Trigger a survey for a specific user */
  async trigger(surveyId: string, options: { userId: string; context?: Record<string, unknown> }): Promise<{ triggerId: string }> {
    return this.http.post<{ triggerId: string }>(`/api/v1/surveys/${surveyId}/trigger`, options);
  }

  /** Submit a survey response */
  async submit(surveyId: string, answers: Record<string, unknown>): Promise<void> {
    await this.http.post(`/api/v1/surveys/${surveyId}/responses`, { answers });
  }

  /** Get survey results and analytics */
  async getResults(surveyId: string): Promise<SurveyResults> {
    return this.http.get<SurveyResults>(`/api/v1/surveys/${surveyId}/results`);
  }
}
