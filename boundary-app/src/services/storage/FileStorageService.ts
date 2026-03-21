export class FileStorageService {
  private static instance: FileStorageService;

  private constructor() {}

  static getInstance(): FileStorageService {
    if (!FileStorageService.instance) {
      FileStorageService.instance = new FileStorageService();
    }
    return FileStorageService.instance;
  }

  async initialize(): Promise<void> {
    console.log('File Storage Service initialized');
  }

  isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  }

  isVideo(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['mp4', 'm4v', 'avi', 'mov'].includes(ext || '');
  }

  isDocument(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['pdf', 'doc', 'docx', 'txt', 'csv'].includes(ext || '');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getCacheSize(): Promise<number> {
    return 0; // Simplified for now
  }
}

export const fileStorageService = FileStorageService.getInstance();
export default fileStorageService;
