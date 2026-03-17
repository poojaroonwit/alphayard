import { Platform } from 'react-native';
import { AccessibilityInfo } from 'react-native';

interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableLargeText: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  enableVoiceControl: boolean;
  enableSwitchControl: boolean;
  enableAssistiveTouch: boolean;
}

interface AccessibilityFeatures {
  screenReader: boolean;
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  voiceControl: boolean;
  switchControl: boolean;
  assistiveTouch: boolean;
}

interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  contrast: 'normal' | 'high';
  motion: 'normal' | 'reduced';
  sound: 'normal' | 'enhanced';
  hapticFeedback: boolean;
  voiceOverEnabled: boolean;
  talkBackEnabled: boolean;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private config: AccessibilityConfig;
  private features: AccessibilityFeatures;
  private settings: AccessibilitySettings;
  private listeners: Map<string, () => void>;

  private constructor() {
    this.config = {
      enableScreenReader: true,
      enableLargeText: true,
      enableHighContrast: true,
      enableReducedMotion: true,
      enableVoiceControl: true,
      enableSwitchControl: true,
      enableAssistiveTouch: true,
    };

    this.features = {
      screenReader: false,
      largeText: false,
      highContrast: false,
      reducedMotion: false,
      voiceControl: false,
      switchControl: false,
      assistiveTouch: false,
    };

    this.settings = {
      fontSize: 'medium',
      contrast: 'normal',
      motion: 'normal',
      sound: 'normal',
      hapticFeedback: true,
      voiceOverEnabled: false,
      talkBackEnabled: false,
    };

    this.listeners = new Map();
  }

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  // Initialize accessibility service
  async initialize(): Promise<void> {
    try {
      // Check current accessibility features
      await this.checkAccessibilityFeatures();
      
      // Set up accessibility listeners
      this.setupAccessibilityListeners();
      
      console.log('Accessibility service initialized');
    } catch (error) {
      console.error('Failed to initialize accessibility service:', error);
      throw error;
    }
  }

  // Check current accessibility features
  private async checkAccessibilityFeatures(): Promise<void> {
    try {
      // Check screen reader status
      if (Platform.OS === 'ios') {
        this.features.screenReader = await AccessibilityInfo.isScreenReaderEnabled();
      } else if (Platform.OS === 'android') {
        this.features.screenReader = await AccessibilityInfo.isScreenReaderEnabled();
      }

      // Check other accessibility features
      this.features.largeText = await this.isLargeTextEnabled();
      this.features.highContrast = await this.isHighContrastEnabled();
      this.features.reducedMotion = await this.isReducedMotionEnabled();
      this.features.voiceControl = await this.isVoiceControlEnabled();
      this.features.switchControl = await this.isSwitchControlEnabled();
      this.features.assistiveTouch = await this.isAssistiveTouchEnabled();

      console.log('Accessibility features checked:', this.features);
    } catch (error) {
      console.error('Failed to check accessibility features:', error);
    }
  }

  // Set up accessibility listeners
  private setupAccessibilityListeners(): void {
    // Screen reader status change
    const screenReaderListener = (isEnabled: boolean) => {
      this.features.screenReader = isEnabled;
      this.onAccessibilityFeatureChange('screenReader', isEnabled);
    };

    AccessibilityInfo.addEventListener('screenReaderChanged', screenReaderListener);
    this.listeners.set('screenReader', () => {
      AccessibilityInfo.removeEventListener('screenReaderChanged', screenReaderListener);
    });

    // Other accessibility listeners can be added here
    console.log('Accessibility listeners set up');
  }

  // Check if large text is enabled
  private async isLargeTextEnabled(): Promise<boolean> {
    try {
      // This would typically check system settings
      // For now, return false as default
      return false;
    } catch (error) {
      console.error('Failed to check large text status:', error);
      return false;
    }
  }

  // Check if high contrast is enabled
  private async isHighContrastEnabled(): Promise<boolean> {
    try {
      // This would typically check system settings
      // For now, return false as default
      return false;
    } catch (error) {
      console.error('Failed to check high contrast status:', error);
      return false;
    }
  }

  // Check if reduced motion is enabled
  private async isReducedMotionEnabled(): Promise<boolean> {
    try {
      // This would typically check system settings
      // For now, return false as default
      return false;
    } catch (error) {
      console.error('Failed to check reduced motion status:', error);
      return false;
    }
  }

  // Check if voice control is enabled
  private async isVoiceControlEnabled(): Promise<boolean> {
    try {
      // This would typically check system settings
      // For now, return false as default
      return false;
    } catch (error) {
      console.error('Failed to check voice control status:', error);
      return false;
    }
  }

  // Check if switch control is enabled
  private async isSwitchControlEnabled(): Promise<boolean> {
    try {
      // This would typically check system settings
      // For now, return false as default
      return false;
    } catch (error) {
      console.error('Failed to check switch control status:', error);
      return false;
    }
  }

  // Check if assistive touch is enabled
  private async isAssistiveTouchEnabled(): Promise<boolean> {
    try {
      // This would typically check system settings
      // For now, return false as default
      return false;
    } catch (error) {
      console.error('Failed to check assistive touch status:', error);
      return false;
    }
  }

  // Handle accessibility feature changes
  private onAccessibilityFeatureChange(feature: string, enabled: boolean): void {
    console.log(`Accessibility feature ${feature} changed: ${enabled}`);
    
    // Update app settings based on accessibility features
    this.updateAppSettingsForAccessibility();
    
    // Notify other parts of the app
    this.notifyAccessibilityChange(feature, enabled);
  }

  // Update app settings for accessibility
  private updateAppSettingsForAccessibility(): void {
    if (this.features.largeText) {
      this.settings.fontSize = 'large';
    }

    if (this.features.highContrast) {
      this.settings.contrast = 'high';
    }

    if (this.features.reducedMotion) {
      this.settings.motion = 'reduced';
    }

    if (this.features.screenReader) {
      this.settings.voiceOverEnabled = Platform.OS === 'ios';
      this.settings.talkBackEnabled = Platform.OS === 'android';
    }
  }

  // Notify accessibility change
  private notifyAccessibilityChange(feature: string, enabled: boolean): void {
    // This would typically emit an event or call a callback
    console.log(`Accessibility change: ${feature} = ${enabled}`);
  }

  // Get current accessibility features
  getAccessibilityFeatures(): AccessibilityFeatures {
    return { ...this.features };
  }

  // Get current accessibility settings
  getAccessibilitySettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  // Update accessibility settings
  updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...settings };
    console.log('Accessibility settings updated:', this.settings);
  }

  // Check if screen reader is enabled
  isScreenReaderEnabled(): boolean {
    return this.features.screenReader;
  }

  // Check if large text is enabled
  isLargeTextEnabled(): boolean {
    return this.features.largeText;
  }

  // Check if high contrast is enabled
  isHighContrastEnabled(): boolean {
    return this.features.highContrast;
  }

  // Check if reduced motion is enabled
  isReducedMotionEnabled(): boolean {
    return this.features.reducedMotion;
  }

  // Get font size for accessibility
  getAccessibleFontSize(): number {
    const fontSizeMap = {
      small: 14,
      medium: 16,
      large: 18,
      'extra-large': 20,
    };

    return fontSizeMap[this.settings.fontSize];
  }

  // Get color scheme for accessibility
  getAccessibleColorScheme(): 'light' | 'dark' | 'high-contrast' {
    if (this.settings.contrast === 'high') {
      return 'high-contrast';
    }
    
    // This would typically check system theme
    return 'light';
  }

  // Get animation settings for accessibility
  getAccessibleAnimationSettings(): {
    duration: number;
    easing: string;
    enabled: boolean;
  } {
    return {
      duration: this.settings.motion === 'reduced' ? 0 : 300,
      easing: this.settings.motion === 'reduced' ? 'linear' : 'ease-in-out',
      enabled: this.settings.motion === 'normal',
    };
  }

  // Announce to screen reader
  announceToScreenReader(message: string): void {
    if (this.features.screenReader) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  // Set accessibility focus
  setAccessibilityFocus(reactTag: number): void {
    if (this.features.screenReader) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }

  // Get accessibility props for components
  getAccessibilityProps(props: any = {}): any {
    const accessibilityProps: any = {
      accessible: true,
      accessibilityRole: props.accessibilityRole || 'none',
      accessibilityLabel: props.accessibilityLabel || '',
      accessibilityHint: props.accessibilityHint || '',
      accessibilityState: props.accessibilityState || {},
      accessibilityActions: props.accessibilityActions || [],
    };

    // Add platform-specific props
    if (Platform.OS === 'ios') {
      accessibilityProps.accessibilityTraits = props.accessibilityTraits || [];
      accessibilityProps.accessibilityViewIsModal = props.accessibilityViewIsModal || false;
    } else if (Platform.OS === 'android') {
      accessibilityProps.accessibilityLiveRegion = props.accessibilityLiveRegion || 'none';
      accessibilityProps.importantForAccessibility = props.importantForAccessibility || 'auto';
    }

    return accessibilityProps;
  }

  // Get accessibility props for buttons
  getButtonAccessibilityProps(label: string, hint?: string): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'button',
      accessibilityLabel: label,
      accessibilityHint: hint || `Double tap to ${label.toLowerCase()}`,
    });
  }

  // Get accessibility props for images
  getImageAccessibilityProps(alt: string, decorative: boolean = false): any {
    return this.getAccessibilityProps({
      accessibilityRole: decorative ? 'none' : 'image',
      accessibilityLabel: decorative ? '' : alt,
      accessibilityHint: decorative ? '' : `Image: ${alt}`,
    });
  }

  // Get accessibility props for text inputs
  getTextInputAccessibilityProps(label: string, hint?: string): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'text',
      accessibilityLabel: label,
      accessibilityHint: hint || `Enter ${label.toLowerCase()}`,
    });
  }

  // Get accessibility props for links
  getLinkAccessibilityProps(label: string, url?: string): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'link',
      accessibilityLabel: label,
      accessibilityHint: url ? `Link to ${url}` : `Navigate to ${label.toLowerCase()}`,
    });
  }

  // Get accessibility props for headings
  getHeadingAccessibilityProps(text: string, level: number = 1): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'header',
      accessibilityLabel: text,
      accessibilityHint: `Heading level ${level}: ${text}`,
    });
  }

  // Get accessibility props for lists
  getListAccessibilityProps(itemCount: number, label?: string): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'list',
      accessibilityLabel: label || 'List',
      accessibilityHint: `List with ${itemCount} items`,
    });
  }

  // Get accessibility props for list items
  getListItemAccessibilityProps(text: string, index: number, total: number): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'listitem',
      accessibilityLabel: text,
      accessibilityHint: `Item ${index + 1} of ${total}`,
    });
  }

  // Get accessibility props for switches
  getSwitchAccessibilityProps(label: string, value: boolean): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'switch',
      accessibilityLabel: label,
      accessibilityHint: value ? `${label} is enabled` : `${label} is disabled`,
      accessibilityState: { checked: value },
    });
  }

  // Get accessibility props for sliders
  getSliderAccessibilityProps(label: string, value: number, min: number, max: number): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'adjustable',
      accessibilityLabel: label,
      accessibilityHint: `Adjust ${label.toLowerCase()}. Current value: ${value}`,
      accessibilityState: { value, min, max },
    });
  }

  // Get accessibility props for search
  getSearchAccessibilityProps(placeholder?: string): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'search',
      accessibilityLabel: 'Search',
      accessibilityHint: placeholder || 'Search for content',
    });
  }

  // Get accessibility props for navigation
  getNavigationAccessibilityProps(screenName: string): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'navigation',
      accessibilityLabel: `${screenName} screen`,
      accessibilityHint: `Navigate to ${screenName} screen`,
    });
  }

  // Get accessibility props for tabs
  getTabAccessibilityProps(label: string, selected: boolean, index: number, total: number): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'tab',
      accessibilityLabel: label,
      accessibilityHint: selected ? `Selected ${label} tab` : `${label} tab, ${index + 1} of ${total}`,
      accessibilityState: { selected },
    });
  }

  // Get accessibility props for modals
  getModalAccessibilityProps(title: string): any {
    return this.getAccessibilityProps({
      accessibilityRole: 'dialog',
      accessibilityLabel: title,
      accessibilityHint: `Modal dialog: ${title}`,
    });
  }

  // Clean up accessibility service
  cleanup(): void {
    // Remove all listeners
    this.listeners.forEach((cleanup) => cleanup());
    this.listeners.clear();
    
    console.log('Accessibility service cleaned up');
  }

  // Get accessibility configuration
  getAccessibilityConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  // Update accessibility configuration
  updateAccessibilityConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('Accessibility configuration updated:', this.config);
  }
}

export const accessibilityService = AccessibilityService.getInstance();
export default accessibilityService; 
