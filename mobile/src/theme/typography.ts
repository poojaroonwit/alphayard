export const typography = {
  // Font families
  fontFamily: {
    regular: 'IBMPlexSansThai_400Regular',
    medium: 'IBMPlexSansThai_500Medium',
    semibold: 'IBMPlexSansThai_600SemiBold',
    bold: 'IBMPlexSansThai_700Bold',
    monospace: 'Courier',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },

  // Text styles
  textStyles: {
    // Display styles
    display1: {
      fontSize: 48,
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.02,
      fontFamily: 'IBMPlexSansThai_700Bold',
    },
    display2: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 1.25,
      letterSpacing: -0.01,
      fontFamily: 'IBMPlexSansThai_700Bold',
    },
    display3: {
      fontSize: 30,
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },

    // Heading styles
    h1: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 1.3,
      letterSpacing: -0.01,
      fontFamily: 'IBMPlexSansThai_700Bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.35,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },
    h5: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.5,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },
    h6: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 1.5,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },

    // Body styles
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.6,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_400Regular',
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.6,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_400Regular',
    },
    body3: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
      fontFamily: 'IBMPlexSansThai_400Regular',
    },

    // Caption styles
    caption1: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.4,
      letterSpacing: 0.01,
      fontFamily: 'IBMPlexSansThai_400Regular',
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 1.4,
      letterSpacing: 0.01,
      fontFamily: 'IBMPlexSansThai_400Regular',
    },

    // Button styles
    button1: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.5,
      letterSpacing: 0.01,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },
    button2: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 1.5,
      letterSpacing: 0.01,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },
    button3: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 1.5,
      letterSpacing: 0.01,
      fontFamily: 'IBMPlexSansThai_600SemiBold',
    },

    // Label styles
    label1: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.01,
      fontFamily: 'IBMPlexSansThai_500Medium',
    },
    label2: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.01,
      fontFamily: 'IBMPlexSansThai_500Medium',
    },
    label3: {
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.01,
      fontFamily: 'IBMPlexSansThai_500Medium',
    },

    // Overline styles
    overline1: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.1,
      textTransform: 'uppercase',
      fontFamily: 'IBMPlexSansThai_500Medium',
    },
    overline2: {
      fontSize: 10,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 0.1,
      textTransform: 'uppercase',
      fontFamily: 'IBMPlexSansThai_500Medium',
    },
  },
};

// Export textStyles for compatibility with existing components
export const textStyles = typography.textStyles; 