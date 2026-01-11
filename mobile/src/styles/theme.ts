import { StyleSheet } from 'react-native';

// Pastel Pink & Grey Gradient Theme with Glass Effects
export const theme = {
  // Color Palette
  colors: {
    // Pastel Pink Shades
    pink: {
      primary: '#FFB6C1',      // Light Pink
      secondary: '#FFC0CB',    // Pink
      light: '#FFE4E1',        // Misty Rose
      dark: '#FF69B4',         // Hot Pink
      pastel: '#F8BBD9',       // Pastel Pink
      soft: '#FFE4E6',         // Soft Pink
    },

    // Grey Gradient Shades
    grey: {
      primary: '#6B7280',      // Cool Grey
      secondary: '#9CA3AF',    // Light Grey
      light: '#F3F4F6',        // Light Grey
      dark: '#374151',         // Dark Grey
      soft: '#E5E7EB',         // Soft Grey
      gradient: {
        start: '#F9FAFB',      // Very Light Grey
        end: '#E5E7EB',        // Soft Grey
      }
    },

    // Glass Effect Colors
    glass: {
      background: 'rgba(255, 182, 193, 0.1)',    // Light Pink Glass
      border: 'rgba(255, 182, 193, 0.2)',        // Pink Border
      shadow: 'rgba(107, 114, 128, 0.1)',        // Grey Shadow
      backdrop: 'rgba(255, 255, 255, 0.8)',      // White Backdrop
    },

    // Text Colors
    text: {
      primary: '#374151',      // Dark Grey
      secondary: '#6B7280',    // Medium Grey
      light: '#9CA3AF',        // Light Grey
      white: '#FFFFFF',        // White
      pink: '#FF69B4',         // Hot Pink for accents
    },

    // Status Colors
    status: {
      success: '#10B981',      // Emerald
      warning: '#F59E0B',      // Amber
      error: '#EF4444',        // Red
      info: '#3B82F6',         // Blue
    }
  },

  // Typography
  typography: {
    fontFamily: {
      regular: 'IBMPlexSansThai_400Regular',
      medium: 'IBMPlexSansThai_500Medium',
      bold: 'IBMPlexSansThai_700Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  // Border Radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  // Shadows
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    glass: {
      shadowColor: '#FFB6C1',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }
  }
};

// Glass Morphism Styles
export const glassStyles = StyleSheet.create({
  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 16,
    shadowColor: '#FFB6C1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Glass Button
  glassButton: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Glass Modal
  glassModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  // Glass Input
  glassInput: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Glass Tab
  glassTab: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Glass Tab Active
  glassTabActive: {
    backgroundColor: '#FFB6C1',
    borderColor: '#FF69B4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
});

// Gradient Styles
export const gradientStyles = StyleSheet.create({
  // Pink Gradient
  pinkGradient: {
    backgroundColor: '#FFB6C1',
  },

  // Grey Gradient
  greyGradient: {
    backgroundColor: '#F9FAFB',
  },

  // Glass Gradient
  glassGradient: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
  }
});

// Common Component Styles
export const commonStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#FFB6C1',
  },

  // Card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
  },

  // Button Primary
  buttonPrimary: {
    backgroundColor: '#FFB6C1',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Button Secondary
  buttonSecondary: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Text Primary
  textPrimary: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'IBMPlexSansThai_500Medium',
  },

  // Text Secondary
  textSecondary: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'IBMPlexSansThai_400Regular',
  },

  // Input
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#374151',
    fontFamily: 'IBMPlexSansThai_400Regular',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  }
});

export default theme;
