import React from 'react';
import { Platform, View, ViewStyle, StyleSheet } from 'react-native';

// Platform-specific imports
let NativeBlurView: any = View;
if (Platform.OS !== 'web') {
  try {
    const { BlurView } = require('expo-blur');
    NativeBlurView = BlurView;
  } catch (error) {
    // Fallback to View if expo-blur is not available
    console.warn('expo-blur not available, using fallback');
  }
}

interface BlurViewProps {
  intensity?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
  tint?: 'light' | 'dark' | 'default';
}

export const BlurView: React.FC<BlurViewProps> = ({
  intensity = 50,
  style,
  children,
  tint = 'default',
}) => {
  if (Platform.OS === 'web') {
    // Web fallback using CSS backdrop-filter
    const flatStyle = StyleSheet.flatten(style);
    const webStyle: ViewStyle = {
      ...flatStyle,
      // @ts-ignore - backdrop-filter is not in React Native types but works on web
      backdropFilter: `blur(${intensity / 5}px)`,
      backgroundColor: flatStyle?.backgroundColor || (tint === 'dark' 
        ? `rgba(0, 0, 0, ${intensity / 200})` 
        : tint === 'light'
        ? `rgba(255, 255, 255, ${intensity / 200})`
        : `rgba(128, 128, 128, ${intensity / 200})`),
    };

    return (
      <View style={webStyle}>
        {children}
      </View>
    );
  }

  // Native platforms use expo-blur
  return (
    <NativeBlurView intensity={intensity} style={style} tint={tint}>
      {children}
    </NativeBlurView>
  );
};

export default BlurView;
