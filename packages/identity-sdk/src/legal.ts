import { HttpClient } from './http';

export interface LegalDocument {
  id: string;
  title: string;
  type: 'terms' | 'privacy' | 'cookie' | 'custom';
  url?: string;
  content?: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
  lastUpdated: string;
}

export interface ConsentStatus {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  cookiePreferences: Record<string, boolean>;
  acceptedAt?: string;
}

export class LegalModule {
  constructor(private http: HttpClient) {}

  /** Get all legal documents */
  async getDocuments(): Promise<LegalDocument[]> {
    const res = await this.http.get<{ documents: LegalDocument[] }>('/api/v1/legal/documents');
    return res.documents || [];
  }

  /** Get a specific legal document */
  async getDocument(id: string): Promise<LegalDocument> {
    return this.http.get<LegalDocument>(`/api/v1/legal/documents/${id}`);
  }

  /** Get consent status for a user */
  async getConsent(userId: string): Promise<ConsentStatus> {
    return this.http.get<ConsentStatus>(`/api/v1/legal/consent/${userId}`);
  }

  /** Record user consent */
  async recordConsent(userId: string, consent: Partial<ConsentStatus>): Promise<ConsentStatus> {
    return this.http.post<ConsentStatus>(`/api/v1/legal/consent/${userId}`, consent);
  }

  /** Request data export (GDPR right to portability) */
  async requestDataExport(userId: string): Promise<{ requestId: string }> {
    return this.http.post<{ requestId: string }>(`/api/v1/legal/data-export/${userId}`);
  }

  /** Request data deletion (GDPR right to erasure) */
  async requestDataDeletion(userId: string): Promise<{ requestId: string }> {
    return this.http.post<{ requestId: string }>(`/api/v1/legal/data-deletion/${userId}`);
  }
}
