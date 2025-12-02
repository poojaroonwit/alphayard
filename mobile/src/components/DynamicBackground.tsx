import React from 'react';
import { View, ImageBackground, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BackgroundConfig {
  type?: 'gradient' | 'image' | 'color';
  gradient?: string[];
  image_url?: string;
  color?: string;
  overlay_opacity?: number;
}

interface DynamicBackgroundProps {
  background?: BackgroundConfig;
  loading?: boolean;
  children?: React.ReactNode;
  style?: any;
}

/**
 * Dynamic Background Component
 * Renders background based on CMS configuration
 * Supports: gradient, image, solid color
 */
export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  background,
  loading = false,
  children,
  style
}) => {
  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#FA7272" />
      </View>
    );
  }

  // Default background if none provided
  if (!background) {
    return (
      <View style={[styles.container, { backgroundColor: '#FFFFFF' }, style]}>
        {children}
      </View>
    );
  }

  // Render based on background type
  switch (background.type) {
    case 'image':
      return (
        <ImageBackground
          source={{ uri: background.image_url }}
          style={[styles.container, style]}
          resizeMode="cover"
        >
          {background.overlay_opacity && background.overlay_opacity > 0 && (
            <View
              style={[
                styles.overlay,
                { backgroundColor: `rgba(0, 0, 0, ${background.overlay_opacity})` }
              ]}
            />
          )}
          {children}
        </ImageBackground>
      );

    case 'gradient':
      return (
        <LinearGradient
          colors={background.gradient || ['#FA7272', '#FFBBB4']}
          style={[styles.container, style]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {children}
        </LinearGradient>
      );

    case 'color':
      return (
        <View style={[styles.container, { backgroundColor: background.color || '#FFFFFF' }, style]}>
          {children}
        </View>
      );

    default:
      // If type is not specified but we have gradient
      if (background.gradient && background.gradient.length > 0) {
        return (
          <LinearGradient
            colors={background.gradient}
            style={[styles.container, style]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {children}
          </LinearGradient>
        );
      }

      // If type is not specified but we have image_url
      if (background.image_url) {
        return (
          <ImageBackground
            source={{ uri: background.image_url }}
            style={[styles.container, style]}
            resizeMode="cover"
          >
            {background.overlay_opacity && background.overlay_opacity > 0 && (
              <View
                style={[
                  styles.overlay,
                  { backgroundColor: `rgba(0, 0, 0, ${background.overlay_opacity})` }
                ]}
              />
            )}
            {children}
          </ImageBackground>
        );
      }

      // Fallback to white background
      return (
        <View style={[styles.container, { backgroundColor: '#FFFFFF' }, style]}>
          {children}
        </View>
      );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

