// Legal Content Service for Admin
import { API_BASE_URL } from './apiConfig';

export interface LegalDocument {
  id: string;
  type: string;
  slug: string;
  title: string;
  content: string;
  contentFormat: string;
  summary?: string;
  version: string;
  versionDate: string;
  effectiveDate: string;
  lastUpdated: string;
  language: string;
  country?: string;
  status: 'draft' | 'published' | 'archived';
  isRequiredAcceptance: boolean;
  requiresReacceptance: boolean;
  displayOrder: number;
  showInApp: boolean;
  showInFooter: boolean;
}

export interface DeveloperDoc {
  id: string;
  category: string;
  slug: string;
  title: string;
  content: string;
  contentFormat: string;
  excerpt?: string;
  parentId?: string;
  sortOrder: number;
  tags?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime?: number;
  status: 'draft' | 'published' | 'archived' | 'deprecated';
  isFeatured: boolean;
  version: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// =====================================================
// LEGAL DOCUMENTS
// =====================================================

export async function getLegalDocuments(): Promise<LegalDocument[]> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/documents`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch legal documents');
  }
  
  const data = await response.json();
  return data.documents || [];
}

export async function getLegalDocument(id: string): Promise<LegalDocument> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/documents/${id}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch legal document');
  }
  
  const data = await response.json();
  return data.document;
}

export async function createLegalDocument(document: Partial<LegalDocument>): Promise<LegalDocument> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/documents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(document),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create legal document');
  }
  
  const data = await response.json();
  return data.document;
}

export async function updateLegalDocument(id: string, updates: Partial<LegalDocument>): Promise<LegalDocument> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/documents/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update legal document');
  }
  
  const data = await response.json();
  return data.document;
}

export async function deleteLegalDocument(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/documents/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete legal document');
  }
}

export async function publishLegalDocument(id: string): Promise<LegalDocument> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/documents/${id}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to publish legal document');
  }
  
  const data = await response.json();
  return data.document;
}

export async function archiveLegalDocument(id: string): Promise<LegalDocument> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/documents/${id}/archive`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to archive legal document');
  }
  
  const data = await response.json();
  return data.document;
}

// =====================================================
// DEVELOPER DOCUMENTATION
// =====================================================

export async function getDeveloperDocs(): Promise<DeveloperDoc[]> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/developer-docs`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch developer documentation');
  }
  
  const data = await response.json();
  return data.documents || [];
}

export async function getDeveloperDoc(id: string): Promise<DeveloperDoc> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/developer-docs/${id}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch developer document');
  }
  
  const data = await response.json();
  return data.document;
}

export async function createDeveloperDoc(document: Partial<DeveloperDoc>): Promise<DeveloperDoc> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/developer-docs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(document),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create developer document');
  }
  
  const data = await response.json();
  return data.document;
}

export async function updateDeveloperDoc(id: string, updates: Partial<DeveloperDoc>): Promise<DeveloperDoc> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/developer-docs/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update developer document');
  }
  
  const data = await response.json();
  return data.document;
}

export async function deleteDeveloperDoc(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/legal/developer-docs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete developer document');
  }
}

// Export all functions
export const legalService = {
  // Legal Documents
  getLegalDocuments,
  getLegalDocument,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  publishLegalDocument,
  archiveLegalDocument,
  
  // Developer Docs
  getDeveloperDocs,
  getDeveloperDoc,
  createDeveloperDoc,
  updateDeveloperDoc,
  deleteDeveloperDoc,
};

export default legalService;
