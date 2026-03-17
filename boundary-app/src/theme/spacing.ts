export const spacing = {
  // Base spacing units
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,

  // Semantic spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,

  // Component-specific spacing
  component: {
    // Button spacing
    button: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 8,
      marginVertical: 4,
    },

    // Card spacing
    card: {
      padding: 16,
      margin: 8,
      borderRadius: 12,
    },

    // Input spacing
    input: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 4,
    },

    // List item spacing
    listItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginVertical: 1,
    },

    // Modal spacing
    modal: {
      padding: 24,
      margin: 16,
    },

    // Screen spacing
    screen: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },

    // Section spacing
    section: {
      paddingHorizontal: 16,
      paddingVertical: 24,
      marginVertical: 16,
    },

    // Header spacing
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    // Footer spacing
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    // Navigation spacing
    navigation: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

    // Tab spacing
    tab: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    // Chip spacing
    chip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginHorizontal: 4,
      marginVertical: 2,
    },

    // Badge spacing
    badge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginHorizontal: 4,
    },

    // Avatar spacing
    avatar: {
      marginHorizontal: 8,
      marginVertical: 4,
    },

    // Icon spacing
    icon: {
      marginHorizontal: 4,
      marginVertical: 2,
    },

    // Divider spacing
    divider: {
      marginVertical: 16,
    },

    // Spacer spacing
    spacer: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      '2xl': 48,
    },
  },

  // Layout spacing
  layout: {
    // Container spacing
    container: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },

    // Grid spacing
    grid: {
      gap: 16,
      columnGap: 16,
      rowGap: 16,
    },

    // Stack spacing
    stack: {
      gap: 8,
    },

    // Flex spacing
    flex: {
      gap: 8,
    },

    // Absolute positioning
    absolute: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },

    // Safe area
    safeArea: {
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    },
  },

  // Responsive spacing
  responsive: {
    // Small screens
    sm: {
      container: {
        paddingHorizontal: 12,
        paddingVertical: 16,
      },
      component: {
        card: {
          padding: 12,
          margin: 6,
        },
        screen: {
          paddingHorizontal: 12,
          paddingVertical: 16,
        },
      },
    },

    // Medium screens
    md: {
      container: {
        paddingHorizontal: 16,
        paddingVertical: 20,
      },
      component: {
        card: {
          padding: 16,
          margin: 8,
        },
        screen: {
          paddingHorizontal: 16,
          paddingVertical: 20,
        },
      },
    },

    // Large screens
    lg: {
      container: {
        paddingHorizontal: 24,
        paddingVertical: 24,
      },
      component: {
        card: {
          padding: 20,
          margin: 12,
        },
        screen: {
          paddingHorizontal: 24,
          paddingVertical: 24,
        },
      },
    },
  },
}; 
