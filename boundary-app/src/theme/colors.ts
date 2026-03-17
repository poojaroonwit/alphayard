// Brand Colors - Rose Gold Theme
export const brandColors = {
  primary: '#E8B4A1',
  secondary: '#D4A574',
  tertiary: '#F2D7C7',
  gradient: ['#E8B4A1', '#D4A574', '#F2D7C7'],
};

// Background Colors
export const backgroundColors = {
  primary: '#FFFFFF',
  secondary: '#F5F5F5',
  tertiary: '#F8F8F8',
  gradient: brandColors.gradient,
};

// Text Colors
export const textColors = {
  primary: '#333333',
  secondary: '#666666',
  tertiary: '#999999',
  white: '#FFFFFF',
  light: 'rgba(255, 255, 255, 0.8)',
};

// Status Colors
export const statusColors = {
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  online: '#4CAF50',
  offline: '#999999',
};

// Shadow Colors
export const shadowColors = {
  primary: 'rgba(0, 0, 0, 0.1)',
  secondary: 'rgba(0, 0, 0, 0.2)',
  tertiary: 'rgba(0, 0, 0, 0.3)',
};

// Border Colors
export const borderColors = {
  primary: '#DDDDDD',
  secondary: '#EEEEEE',
  tertiary: '#CCCCCC',
  white: 'rgba(255, 255, 255, 0.3)',
};

// Button Colors
export const buttonColors = {
  primary: brandColors.primary,
  secondary: brandColors.secondary,
  success: statusColors.success,
  danger: statusColors.error,
  warning: statusColors.warning,
  info: statusColors.info,
  disabled: '#CCCCCC',
};

// Main colors object for compatibility with existing components
export const colors = {
  primary: {
    50: '#FDF5F1',
    100: '#FAEAE0',
    200: '#F4D5C1',
    300: '#EDBFA2',
    400: '#E8B4A1',
    500: brandColors.primary,
    600: '#D19A83',
    700: '#BA8065',
    800: '#A36647',
    900: '#8C4C29',
  },
  white: {
    50: '#FFFFFF',
    100: '#FFFFFF',
    200: '#FFFFFF',
    300: '#FFFFFF',
    400: '#FFFFFF',
    500: '#FFFFFF',
    600: '#F5F5F5',
    700: '#E5E5E5',
    800: '#D5D5D5',
    900: '#C5C5C5',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  secondary: {
    50: '#FBF4EF',
    100: '#F6E9DD',
    200: '#EDD3BB',
    300: '#E4BD99',
    400: '#D4A574',
    500: brandColors.secondary,
    600: '#C19660',
    700: '#AE874C',
    800: '#9B7838',
    900: '#886924',
  },
  success: statusColors.success,
  warning: statusColors.warning,
  error: statusColors.error,
  info: statusColors.info,
};

export default {
  brand: brandColors,
  background: backgroundColors,
  text: textColors,
  status: statusColors,
  shadow: shadowColors,
  border: borderColors,
  button: buttonColors,
  colors,
};
