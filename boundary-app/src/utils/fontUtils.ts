/**
 * Font utility for Thai/English text handling
 * Uses system fonts that support both Thai and English text
 */

import { Platform } from 'react-native';

/**
 * Check if text contains Thai characters
 * @param text - The text to check
 * @returns boolean indicating if text contains Thai characters
 */
export const hasThaiCharacters = (text: string): boolean => {
  // Thai Unicode range: U+0E00–U+0E7F
  const thaiRegex = /[\u0E00-\u0E7F]/;
  return thaiRegex.test(text);
};

/**
 * Get the appropriate Font Family based on text content
 * @param text - The text to analyze
 * @param weight - Font weight (default: 'Regular')
 * @returns Font Family name
 */
export const getfontFamily = (text: string, _weight: string = 'Regular'): string => {
  // Use system fonts that are available on both platforms
  if (hasThaiCharacters(text)) {
    // For Thai text, use system fonts that support Thai
    return Platform.select({ 
      ios: 'System', 
      android: 'sans-serif' 
    }) || 'System';
  }
  // For English text, use system fonts
  return Platform.select({ 
    ios: 'System', 
    android: 'sans-serif' 
  }) || 'System';
};

/**
 * Get Font Family for headings
 * @param text - The text to analyze
 * @returns Font Family name for headings
 */
export const getHeadingFont = (text: string): string => {
  return getfontFamily(text, 'Bold');
};

/**
 * Get Font Family for body text
 * @param text - The text to analyze
 * @returns Font Family name for body text
 */
export const getBodyFont = (text: string): string => {
  return getfontFamily(text, 'Regular');
};

/**
 * Get Font Family for medium weight text
 * @param text - The text to analyze
 * @returns Font Family name for medium weight
 */
export const getMediumFont = (text: string): string => {
  return getfontFamily(text, 'Medium');
};

/**
 * Get Font Family for semi-bold text
 * @param text - The text to analyze
 * @returns Font Family name for semi-bold
 */
export const getSemiBoldFont = (text: string): string => {
  return getfontFamily(text, 'SemiBold');
};

/**
 * Font weight mappings for both fonts
 */
export const FONT_WEIGHTS = {
  THIN: 'Thin',
  EXTRA_LIGHT: 'ExtraLight',
  LIGHT: 'Light',
  REGULAR: 'Regular',
  MEDIUM: 'Medium',
  SEMI_BOLD: 'SemiBold',
  BOLD: 'Bold',
  EXTRA_BOLD: 'ExtraBold',
  BLACK: 'Black',
} as const;

/**
 * Get Font Family with specific weight
 * @param text - The text to analyze
 * @param weight - Font weight from FONT_WEIGHTS
 * @returns Font Family name with specified weight
 */
export const getFontWithWeight = (text: string, weight: keyof typeof FONT_WEIGHTS): string => {
  return getfontFamily(text, FONT_WEIGHTS[weight]);
};

/**
 * Common font styles for the app using system fonts
 */
export const FONT_STYLES = {
  // English fonts - using system fonts
  englishHeading: Platform.select({ 
    ios: 'System', 
    android: 'sans-serif' 
  }) || 'System',
  englishBody: Platform.select({ 
    ios: 'System', 
    android: 'sans-serif' 
  }) || 'System',
  englishMedium: Platform.select({ 
    ios: 'System', 
    android: 'sans-serif-medium' 
  }) || 'System',
  englishSemiBold: Platform.select({ 
    ios: 'System', 
    android: 'sans-serif-medium' 
  }) || 'System',
  
  // Thai fonts - using system fonts that support Thai
  thaiHeading: Platform.select({ 
    ios: 'System', 
    android: 'sans-serif' 
  }) || 'System',
  thaiBody: Platform.select({ 
    ios: 'System', 
    android: 'sans-serif' 
  }) || 'System',
  thaiMedium: Platform.select({ 
    ios: 'System', 
    android: 'sans-serif-medium' 
  }) || 'System',
  thaiSemiBold: Platform.select({ 
    ios: 'System', 
    android: 'sans-serif-medium' 
  }) || 'System',
} as const;

