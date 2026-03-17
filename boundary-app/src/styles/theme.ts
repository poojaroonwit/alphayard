import { StyleSheet } from 'react-native';

// Rose Pink Theme Defaults (Matches Admin Panel Defaults)
export const theme = {
  // Color Palette
  colors: {
    // Pink Shades (Primary)
    pink: {
      primary: '#FFB6C1',      // Light Pink - Main Brand Color
      secondary: '#FFC0CB',    // Pink - Secondary
      light: '#FFE4E1',        // Misty Rose
      dark: '#FF69B4',         // Hot Pink - Accents
      pastel: 'rgba(255, 182, 193, 0.2)', // Pastel/washed out
    },

    // Grey/Neutral Shades
    grey: {
      primary: '#374151',      // Dark Grey - Text
      secondary: '#6B7280',    // Medium Grey - Secondary Text
      light: '#F3F4F6',        // Light Grey - Backgrounds
      dark: '#1F2937',         // Very Dark Grey
      border: '#E5E7EB',
    },

    // UI Colors
    background: '#FAF9F6',     // Off-white / Cream
    card: 'rgba(255, 255, 255, 0.8)',
    text: {
      primary: '#374151',
      secondary: '#6B7280',
      light: '#9CA3AF',
      white: '#FFFFFF',
      pink: '#FF69B4',
    },

    // Status Colors
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },

    // Legacy/NativeBase Mapping
    primary: '#FFB6C1',
    secondary: '#FFC0CB',
    white: '#FFFFFF',
    black: '#000000',
  },

  // Typography
  typography: {
    fontFamily: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      bold: 'Inter_700Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
    },
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
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
  }
};

// Glass Morphism Styles (Preserved)
export const glassStyles = StyleSheet.create({
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
  glassButton: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  glassInput: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 182, 193, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.md,
  },
  textPrimary: {
    color: theme.colors.text.primary,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
  textSecondary: {
    color: theme.colors.text.secondary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});

export default theme;

