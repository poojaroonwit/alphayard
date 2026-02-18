export type BackgroundType = 'solid' | 'gradient' | 'texture' | 'image' | 'video';

export interface GradientStop {
    id: string;
    color: string;
    position: number; // 0-100
}

export interface BackgroundConfig {
    type: BackgroundType;
    // For solid: hex color
    // For texture: texture ID or class
    // For image/video: URL
    value: string;
    
    // Gradient specific
    gradientStops?: GradientStop[];
    gradientDirection?: string; // 'to-t', 'to-tr', 'to-r', 'to-br', 'to-b', 'to-bl', 'to-l', 'to-tl'
    
    // Optional overlay/opacity for background media
    overlayColor?: string;
    overlayOpacity?: number;
}
