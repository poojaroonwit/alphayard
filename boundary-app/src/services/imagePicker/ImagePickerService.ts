import { Platform, Alert } from 'react-native';

// Platform-specific imports
let NativeImagePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    NativeImagePicker = require('expo-image-picker');
  } catch (error) {
    console.warn('expo-image-picker not available, using fallback');
  }
}

export interface ImagePickerOptions {
  mediaTypes?: 'Images' | 'Videos' | 'All';
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

export interface ImagePickerResult {
  canceled: boolean;
  assets?: Array<{
    uri: string;
    width?: number;
    height?: number;
    type?: string;
  }>;
}

export interface PermissionResult {
  status: 'granted' | 'denied' | 'undetermined';
}

class ImagePickerService {
  // Request camera permissions
  async requestCameraPermissionsAsync(): Promise<PermissionResult> {
    if (Platform.OS === 'web') {
      // Web doesn't need explicit camera permissions for getUserMedia
      return { status: 'granted' };
    }

    if (!NativeImagePicker) {
      return { status: 'denied' };
    }

    try {
      const result = await NativeImagePicker.requestCameraPermissionsAsync();
      return result;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return { status: 'denied' };
    }
  }

  // Request media library permissions
  async requestMediaLibraryPermissionsAsync(): Promise<PermissionResult> {
    if (Platform.OS === 'web') {
      // Web doesn't need explicit media library permissions
      return { status: 'granted' };
    }

    if (!NativeImagePicker) {
      return { status: 'denied' };
    }

    try {
      const result = await NativeImagePicker.requestMediaLibraryPermissionsAsync();
      return result;
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return { status: 'denied' };
    }
  }

  // Launch camera
  async launchCameraAsync(options: ImagePickerOptions = {}): Promise<ImagePickerResult> {
    if (Platform.OS === 'web') {
      return this.webCameraCapture(options);
    }

    if (!NativeImagePicker) {
      throw new Error('Camera not available on this platform');
    }

    try {
      const nativeOptions = this.convertToNativeOptions(options);
      const result = await NativeImagePicker.launchCameraAsync(nativeOptions);
      return result;
    } catch (error) {
      console.error('Error launching camera:', error);
      throw error;
    }
  }

  // Launch image library
  async launchImageLibraryAsync(options: ImagePickerOptions = {}): Promise<ImagePickerResult> {
    if (Platform.OS === 'web') {
      return this.webFileSelect(options);
    }

    if (!NativeImagePicker) {
      throw new Error('Image library not available on this platform');
    }

    try {
      const nativeOptions = this.convertToNativeOptions(options);
      const result = await NativeImagePicker.launchImageLibraryAsync(nativeOptions);
      return result;
    } catch (error) {
      console.error('Error launching image library:', error);
      throw error;
    }
  }

  // Web-specific camera capture using getUserMedia
  private async webCameraCapture(options: ImagePickerOptions): Promise<ImagePickerResult> {
    return new Promise((resolve) => {
      try {
        // Create a hidden file input for camera
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use rear camera by default
        input.style.display = 'none';

        input.onchange = (event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const uri = e.target?.result as string;
              resolve({
                canceled: false,
                assets: [{
                  uri,
                  type: file.type,
                }]
              });
            };
            reader.readAsDataURL(file);
          } else {
            resolve({ canceled: true });
          }
          
          // Clean up
          document.body.removeChild(input);
        };

        input.oncancel = () => {
          resolve({ canceled: true });
          document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
      } catch (error) {
        console.error('Web camera capture error:', error);
        resolve({ canceled: true });
      }
    });
  }

  // Web-specific file selection
  private async webFileSelect(options: ImagePickerOptions): Promise<ImagePickerResult> {
    return new Promise((resolve) => {
      try {
        // Create a hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = this.getWebAcceptType(options.mediaTypes);
        input.style.display = 'none';

        input.onchange = (event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const uri = e.target?.result as string;
              resolve({
                canceled: false,
                assets: [{
                  uri,
                  type: file.type,
                }]
              });
            };
            reader.readAsDataURL(file);
          } else {
            resolve({ canceled: true });
          }
          
          // Clean up
          document.body.removeChild(input);
        };

        input.oncancel = () => {
          resolve({ canceled: true });
          document.body.removeChild(input);
        };

        document.body.appendChild(input);
        input.click();
      } catch (error) {
        console.error('Web file select error:', error);
        resolve({ canceled: true });
      }
    });
  }

  // Convert our options to native expo-image-picker options
  private convertToNativeOptions(options: ImagePickerOptions) {
    if (!NativeImagePicker) return options;

    return {
      mediaTypes: options.mediaTypes === 'Images' 
        ? NativeImagePicker.MediaTypeOptions.Images 
        : options.mediaTypes === 'Videos'
        ? NativeImagePicker.MediaTypeOptions.Videos
        : NativeImagePicker.MediaTypeOptions.All,
      allowsEditing: options.allowsEditing,
      aspect: options.aspect,
      quality: options.quality,
    };
  }

  // Get web accept type from media types
  private getWebAcceptType(mediaTypes?: string): string {
    switch (mediaTypes) {
      case 'Images':
        return 'image/*';
      case 'Videos':
        return 'video/*';
      case 'All':
        return 'image/*,video/*';
      default:
        return 'image/*';
    }
  }
}

// Export singleton instance
export const imagePickerService = new ImagePickerService();

// Export constants for backward compatibility
export const MediaTypeOptions = {
  Images: 'Images' as const,
  Videos: 'Videos' as const,
  All: 'All' as const,
};

export default imagePickerService;
