export interface ThemeColors {
    // Primary Brand
    primary: string;
    secondary: string;
    
    // Nested structures for mobile compatibility
    pink: {
        primary: string;
        secondary: string;
        light?: string;
        dark?: string;
    };
    text: {
        white: string;
        primary?: string;
        secondary?: string;
    };
    
    // Backgrounds
    background: string;
    cardBackground: string;
    
    // Text (flat)
    textPrimary: string;
    textSecondary: string;
    
    // UI Elements
    border: string;
    inputBackground: string;
    tabBarBackground: string;
    tabBarActive: string;
    tabBarInactive: string;
    
    // Status
    success: string;
    error: string;
    warning: string;
    info: string;
}

export interface ThemeRadius {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    button: number;
    input: number;
    card: number;
    full: number;
}

export interface ThemeTypography {
    fontFamily: string;
    scale: number; // For scaling font sizes globaly
}

export interface MobileTheme {
    id?: string;
    name: string;
    isDefault?: boolean;
    colors: ThemeColors;
    radius: ThemeRadius;
    typography: ThemeTypography;
}

export const DEFAULT_MOBILE_THEME: MobileTheme = {
    name: "Default Pastel",
    colors: {
        primary: '#FFB6C1',     // Light Pink
        secondary: '#FFC0CB',   // Pink
        pink: {
            primary: '#FFB6C1',
            secondary: '#FFC0CB',
            light: '#FFE4E1',
            dark: '#FF69B4'
        },
        text: {
            white: '#FFFFFF',
            primary: '#374151',
            secondary: '#6B7280'
        },
        background: '#FFB6C1',  // Main Bg (often gradient in app, but solid fallback)
        cardBackground: 'rgba(255, 255, 255, 0.8)',
        textPrimary: '#374151',
        textSecondary: '#6B7280',
        border: 'rgba(255, 182, 193, 0.2)',
        inputBackground: 'rgba(255, 182, 193, 0.1)',
        tabBarBackground: 'rgba(255, 182, 193, 0.1)',
        tabBarActive: '#FFB6C1',
        tabBarInactive: '#9CA3AF',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
    },
    radius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        button: 12,
        input: 12,
        card: 16,
        full: 9999,
    },
    typography: {
        fontFamily: 'IBMPlexSansThai_400Regular',
        scale: 1.0
    }
}

