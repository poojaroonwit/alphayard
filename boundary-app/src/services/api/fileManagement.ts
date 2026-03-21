import { api } from './index';
import { config } from '../../config/environment';

// =====================================
// TYPES
// =====================================

export interface FileFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  ownerId: string;
  circleId?: string;
  color?: string;
  icon?: string;
  isFavorite: boolean;
  isPinned: boolean;
  sortOrder: number;
  itemCount: number;
  totalSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileItem {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  folderId?: string;
  uploadedBy: string;
  uploaderName?: string;
  circleId?: string;
  description?: string;
  isFavorite: boolean;
  isPinned: boolean;
  viewCount: number;
  downloadCount: number;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  status: string;
  tags?: FileTag[];
  createdAt: string;
  updatedAt: string;
}

export interface FileTag {
  id: string;
  name: string;
  color: string;
}

export interface FileShare {
  id: string;
  fileId?: string;
  folderId?: string;
  sharedBy: string;
  sharedWithUserId?: string;
  sharedWithCircleId?: string;
  shareLink?: string;
  url?: string; // Full share URL
  accessType?: 'view' | 'download';
  permission: 'view' | 'download' | 'edit' | 'admin';
  expiresAt?: string;
  downloadLimit?: number;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface StorageQuota {
  userId: string;
  quotaBytes: number;
  usedBytes: number;
  fileCount: number;
  percentUsed: number;
}

export interface FileActivity {
  id: string;
  fileId?: string;
  folderId?: string;
  userId: string;
  userName?: string;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

// =====================================
// API METHODS
// =====================================

export const fileManagementApi = {
  // =====================================
  // FOLDER OPERATIONS
  // =====================================

  // Get folders for current user (personal files)
  getFolders: async (parentId?: string): Promise<{ success: boolean; folders: FileFolder[] }> => {
    const response = await api.get('/files/folders', { params: { parentId } });
    return response.data;
  },

  // Get folders for a circle
  getCircleFolders: async (circleId: string, parentId?: string): Promise<{ success: boolean; folders: FileFolder[] }> => {
    const response = await api.get(`/files/circles/${circleId}/folders`, { params: { parentId } });
    return response.data;
  },

  // Create folder
  createFolder: async (data: {
    name: string;
    description?: string;
    parentId?: string;
    circleId?: string;
    color?: string;
    icon?: string;
  }): Promise<{ success: boolean; folder: FileFolder }> => {
    const response = await api.post('/files/folders', data);
    return response.data;
  },

  // Get folder by ID
  getFolder: async (folderId: string): Promise<{ success: boolean; folder: FileFolder }> => {
    const response = await api.get(`/files/folders/${folderId}`);
    return response.data;
  },

  // Get folder path (breadcrumb)
  getFolderPath: async (folderId: string): Promise<{ success: boolean; path: FileFolder[] }> => {
    const response = await api.get(`/files/folders/${folderId}/path`);
    return response.data;
  },

  // Update folder
  updateFolder: async (folderId: string, data: Partial<{
    name: string;
    description: string;
    parentId: string;
    color: string;
    icon: string;
    isFavorite: boolean;
    isPinned: boolean;
    sortOrder: number;
  }>): Promise<{ success: boolean; folder: FileFolder }> => {
    const response = await api.put(`/files/folders/${folderId}`, data);
    return response.data;
  },

  // Delete folder
  deleteFolder: async (folderId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/files/folders/${folderId}`);
    return response.data;
  },

  // Move folder
  moveFolder: async (folderId: string, targetParentId: string | null): Promise<{ success: boolean; folder: FileFolder }> => {
    const response = await api.post(`/files/folders/${folderId}/move`, { targetParentId });
    return response.data;
  },

  // =====================================
  // FILE OPERATIONS (PERSONAL)
  // =====================================

  // Get files for current user
  getFiles: async (options?: {
    folderId?: string;
    search?: string;
    fileType?: string;
    isFavorite?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; files: FileItem[]; total: number }> => {
    const response = await api.get('/files/files', { params: options });
    return response.data;
  },

  // Get file by ID
  getFile: async (fileId: string): Promise<{ success: boolean; file: FileItem }> => {
    const response = await api.get(`/files/files/${fileId}`);
    return response.data;
  },

  // Upload file
  uploadFile: async (
    file: { uri: string; name: string; type: string } | File | Blob,
    folderId?: string,
    circleId?: string,
    description?: string
  ): Promise<{ success: boolean; file: FileItem }> => {
    const formData = new FormData();
    
    // Handle different file input formats
    if ('uri' in file) {
      // React Native format with uri
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    } else {
      // Web File/Blob format
      formData.append('file', file);
    }
    
    if (folderId) formData.append('folderId', folderId);
    if (circleId) formData.append('circleId', circleId);
    if (description) formData.append('description', description);

    const response = await api.post('/files/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update file
  updateFile: async (fileId: string, data: Partial<{
    originalName: string;
    description: string;
    folderId: string | null;
    isFavorite: boolean;
    isPinned: boolean;
  }>): Promise<{ success: boolean; file: FileItem }> => {
    const response = await api.put(`/files/files/${fileId}`, data);
    return response.data;
  },

  // Move file to folder
  moveFile: async (fileId: string, targetFolderId: string | null): Promise<{ success: boolean; file: FileItem }> => {
    const response = await api.post(`/files/files/${fileId}/move`, { targetFolderId });
    return response.data;
  },

  // Move multiple files
  moveFiles: async (fileIds: string[], targetFolderId: string | null): Promise<{ success: boolean; movedCount: number }> => {
    const response = await api.post('/files/files/move-batch', { fileIds, targetFolderId });
    return response.data;
  },

  // Copy file
  copyFile: async (fileId: string, targetFolderId: string | null): Promise<{ success: boolean; file: FileItem }> => {
    const response = await api.post(`/files/files/${fileId}/copy`, { targetFolderId });
    return response.data;
  },

  // Delete file (soft delete)
  deleteFile: async (fileId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/files/files/${fileId}`);
    return response.data;
  },

  // Permanently delete file
  permanentlyDeleteFile: async (fileId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/files/files/${fileId}/permanent`);
    return response.data;
  },

  // Track download
  trackDownload: async (fileId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/files/files/${fileId}/download`);
    return response.data;
  },

  // =====================================
  // CIRCLE FILE OPERATIONS
  // =====================================

  // Get files for a circle
  getCircleFiles: async (circleId: string, options?: {
    folderId?: string;
    search?: string;
    fileType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; files: FileItem[]; total: number }> => {
    const response = await api.get(`/files/circles/${circleId}/files`, { params: options });
    return response.data;
  },

  // Upload file to circle
  uploadCircleFile: async (
    circleId: string,
    file: { uri: string; name: string; type: string } | File | Blob,
    folderId?: string,
    description?: string
  ): Promise<{ success: boolean; file: FileItem }> => {
    const formData = new FormData();
    
    if ('uri' in file) {
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    } else {
      formData.append('file', file);
    }
    
    if (folderId) formData.append('folderId', folderId);
    if (description) formData.append('description', description);

    const response = await api.post(`/files/circles/${circleId}/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Create folder in circle
  createCircleFolder: async (circleId: string, data: {
    name: string;
    description?: string;
    parentId?: string;
    color?: string;
    icon?: string;
  }): Promise<{ success: boolean; folder: FileFolder }> => {
    const response = await api.post(`/files/circles/${circleId}/folders`, data);
    return response.data;
  },

  // =====================================
  // TAG OPERATIONS
  // =====================================

  // Get tags
  getTags: async (circleId?: string): Promise<{ success: boolean; tags: FileTag[] }> => {
    const response = await api.get('/files/tags', { params: { circleId } });
    return response.data;
  },

  // Create tag
  createTag: async (name: string, color?: string, circleId?: string): Promise<{ success: boolean; tag: FileTag }> => {
    const response = await api.post('/files/tags', { name, color, circleId });
    return response.data;
  },

  // Assign tag to file
  assignTag: async (fileId: string, tagId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/files/files/${fileId}/tags/${tagId}`);
    return response.data;
  },

  // Remove tag from file
  removeTag: async (fileId: string, tagId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/files/files/${fileId}/tags/${tagId}`);
    return response.data;
  },

  // =====================================
  // SHARING OPERATIONS
  // =====================================

  // Share file with user or circle
  shareFile: async (fileId: string, data: {
    sharedWithUserId?: string;
    sharedWithCircleId?: string;
    permission?: 'view' | 'download' | 'edit' | 'admin';
    expiresAt?: string;
    downloadLimit?: number;
  }): Promise<{ success: boolean; share: FileShare }> => {
    const response = await api.post(`/files/files/${fileId}/share`, data);
    return response.data;
  },

  // Create share link
  createShareLink: async (fileId: string, data?: {
    permission?: 'view' | 'download';
    expiresAt?: string;
    downloadLimit?: number;
    password?: string;
  }): Promise<{ success: boolean; share: FileShare }> => {
    const response = await api.post(`/files/files/${fileId}/share-link`, data || {});
    return response.data;
  },

  // Get file shares
  getFileShares: async (fileId: string): Promise<{ success: boolean; shares: FileShare[] }> => {
    const response = await api.get(`/files/files/${fileId}/shares`);
    return response.data;
  },

  // Get files shared with me
  getSharedWithMe: async (): Promise<{ success: boolean; files: FileItem[] }> => {
    const response = await api.get('/files/shared-with-me');
    return response.data;
  },

  // Remove share
  removeShare: async (shareId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/files/shares/${shareId}`);
    return response.data;
  },

  // =====================================
  // RECENT & FAVORITES
  // =====================================

  // Get recent files
  getRecentFiles: async (limit?: number): Promise<{ success: boolean; files: FileItem[] }> => {
    const response = await api.get('/files/recent', { params: { limit } });
    return response.data;
  },

  // Get favorite files
  getFavoriteFiles: async (): Promise<{ success: boolean; files: FileItem[] }> => {
    const response = await api.get('/files/favorites/files');
    return response.data;
  },

  // Get favorite folders
  getFavoriteFolders: async (): Promise<{ success: boolean; folders: FileFolder[] }> => {
    const response = await api.get('/files/favorites/folders');
    return response.data;
  },

  // Toggle file favorite
  toggleFileFavorite: async (fileId: string, isFavorite: boolean): Promise<{ success: boolean; file: FileItem }> => {
    const response = await api.put(`/files/files/${fileId}`, { isFavorite });
    return response.data;
  },

  // Toggle folder favorite
  toggleFolderFavorite: async (folderId: string, isFavorite: boolean): Promise<{ success: boolean; folder: FileFolder }> => {
    const response = await api.put(`/files/folders/${folderId}`, { isFavorite });
    return response.data;
  },

  // =====================================
  // STORAGE QUOTA
  // =====================================

  // Get storage quota for current user
  getStorageQuota: async (): Promise<{ success: boolean; quota: StorageQuota }> => {
    const response = await api.get('/files/quota');
    return response.data;
  },

  // Get storage quota for circle
  getCircleStorageQuota: async (circleId: string): Promise<{ success: boolean; quota: StorageQuota }> => {
    const response = await api.get(`/files/circles/${circleId}/quota`);
    return response.data;
  },

  // =====================================
  // ACTIVITY LOG
  // =====================================

  // Get file activity
  getFileActivity: async (fileId: string, limit?: number): Promise<{ success: boolean; activity: FileActivity[] }> => {
    const response = await api.get(`/files/files/${fileId}/activity`, { params: { limit } });
    return response.data;
  },

  // =====================================
  // TRASH / RECYCLE BIN
  // =====================================

  // Get deleted files (trash)
  getTrash: async (limit?: number, offset?: number): Promise<{ success: boolean; files: FileItem[]; total: number }> => {
    const response = await api.get('/files/trash', { params: { limit, offset } });
    return response.data;
  },

  // Restore file from trash
  restoreFile: async (fileId: string): Promise<{ success: boolean; file: FileItem }> => {
    const response = await api.post(`/files/trash/${fileId}/restore`);
    return response.data;
  },

  // Empty trash
  emptyTrash: async (): Promise<{ success: boolean; deletedCount: number }> => {
    const response = await api.delete('/files/trash');
    return response.data;
  },

  // Batch restore from trash
  batchRestoreFiles: async (fileIds: string[]): Promise<{ success: boolean; restoredCount: number }> => {
    const response = await api.post('/files/trash/batch/restore', { fileIds });
    return response.data;
  },

  // =====================================
  // GLOBAL SEARCH
  // =====================================

  // Search files and folders
  searchFiles: async (query: string, options?: {
    fileType?: string;
    dateFrom?: string;
    dateTo?: string;
    minSize?: number;
    maxSize?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; files: FileItem[]; folders: FileFolder[]; total: number }> => {
    const response = await api.get('/files/search', { params: { query, ...options } });
    return response.data;
  },

  // =====================================
  // BATCH OPERATIONS
  // =====================================

  // Batch delete files
  batchDeleteFiles: async (fileIds: string[], permanent?: boolean): Promise<{ success: boolean; deletedCount: number }> => {
    const response = await api.post('/files/files/batch/delete', { fileIds, permanent });
    return response.data;
  },

  // Batch toggle favorite
  batchToggleFavorite: async (fileIds: string[], isFavorite: boolean): Promise<{ success: boolean; updatedCount: number }> => {
    const response = await api.post('/files/files/batch/favorite', { fileIds, isFavorite });
    return response.data;
  },

  // Batch assign/remove tag
  batchTagFiles: async (fileIds: string[], tagId: string, action: 'assign' | 'remove'): Promise<{ success: boolean; updatedCount: number }> => {
    const response = await api.post('/files/files/batch/tag', { fileIds, tagId, action });
    return response.data;
  },

  // =====================================
  // STORAGE ANALYTICS
  // =====================================

  // Get storage analytics
  getStorageAnalytics: async (): Promise<{ 
    success: boolean; 
    analytics: {
      totalSize: number;
      totalFiles: number;
      byFileType: { fileType: string; size: number; count: number }[];
      byMonth: { month: string; size: number; count: number }[];
      largestFiles: FileItem[];
      recentUploads: number;
    }
  }> => {
    const response = await api.get('/files/analytics');
    return response.data;
  },

  // Get circle storage analytics
  getCircleStorageAnalytics: async (circleId: string): Promise<{ 
    success: boolean; 
    analytics: {
      totalSize: number;
      totalFiles: number;
      byFileType: { fileType: string; size: number; count: number }[];
      byMember: { userId: string; userName: string; size: number; count: number }[];
      largestFiles: FileItem[];
    }
  }> => {
    const response = await api.get(`/files/circles/${circleId}/analytics`);
    return response.data;
  },

  // =====================================
  // PUBLIC SHARE LINK ACCESS
  // =====================================

  // Access file via share link (public, no auth)
  getFileByShareLink: async (shareLink: string, password?: string): Promise<{ 
    success: boolean; 
    file?: FileItem; 
    share?: FileShare;
    error?: string;
  }> => {
    const response = await api.get(`/files/shared/${shareLink}`, { params: { password } });
    return response.data;
  },

  // Get download URL via share link
  getShareLinkDownloadUrl: (shareLink: string, password?: string): string => {
    const baseUrl = config.apiUrl || '';
    let url = `${baseUrl}/files/shared/${shareLink}/download`;
    if (password) {
      url += `?password=${encodeURIComponent(password)}`;
    }
    return url;
  },
};

export default fileManagementApi;
