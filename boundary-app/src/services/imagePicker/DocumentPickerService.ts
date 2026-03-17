import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export interface DocumentPickerResult {
  canceled: boolean;
  assets: Array<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
    base64?: string;
  }> | null;
}

class DocumentPickerService {
  async getDocumentAsync(): Promise<DocumentPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { canceled: true, assets: null };
      }

      const assets = await Promise.all(result.assets.map(async (asset) => {
        let base64 = '';
        
        // On web, uri is often already base64 or a blob URL
        if (Platform.OS === 'web') {
          if (asset.uri.startsWith('data:')) {
            base64 = asset.uri.split(',')[1];
          } else {
            // Fetch blob and convert to base64 if needed
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            base64 = await this.blobToBase64(blob);
          }
        } else {
          // On native, we might need a file system access to get base64
          // For now, we'll assume the same fetch pattern which often works for local URIs
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            base64 = await this.blobToBase64(blob);
          } catch (e) {
            console.warn('Failed to get base64 for document:', e);
          }
        }

        return {
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
          base64,
        };
      }));

      return {
        canceled: false,
        assets,
      };
    } catch (error) {
      console.error('Document picker error:', error);
      throw error;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const documentPickerService = new DocumentPickerService();
