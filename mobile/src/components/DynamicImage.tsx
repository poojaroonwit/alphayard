import React from 'react';
import { Image, ImageStyle, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAppAsset } from '../hooks/useAppConfig';

interface DynamicImageProps {
  assetKey?: string;
  source?: { uri: string } | number;
  style?: ImageStyle | ImageStyle[];
  width?: number;
  height?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  fallbackSource?: { uri: string } | number;
  showLoading?: boolean;
}

/**
 * Dynamic Image Component
 * Loads images from CMS by asset key or directly from source
 * Supports: logos, icons, backgrounds, and any other images
 */
export const DynamicImage: React.FC<DynamicImageProps> = ({
  assetKey,
  source,
  style,
  width,
  height,
  resizeMode = 'contain',
  fallbackSource,
  showLoading = true,
}) => {
  const { asset, loading, error } = useAppAsset(assetKey || '');

  // If assetKey is provided but still loading
  if (assetKey && loading && showLoading) {
    return (
      <View style={[styles.loadingContainer, { width, height }, style]}>
        <ActivityIndicator size="small" color="#FA7272" />
      </View>
    );
  }

  // If assetKey provided and loaded, use asset URL
  if (assetKey && asset && asset.url) {
    return (
      <Image
        source={{ uri: asset.url }}
        style={[
          style,
          width && { width },
          height && { height },
        ]}
        resizeMode={resizeMode}
      />
    );
  }

  // If error and fallback is provided
  if (assetKey && error && fallbackSource) {
    return (
      <Image
        source={fallbackSource}
        style={[
          style,
          width && { width },
          height && { height },
        ]}
        resizeMode={resizeMode}
      />
    );
  }

  // If source is directly provided (no CMS)
  if (source) {
    return (
      <Image
        source={source}
        style={[
          style,
          width && { width },
          height && { height },
        ]}
        resizeMode={resizeMode}
      />
    );
  }

  // No valid source
  return null;
};

interface DynamicLogoProps {
  logoType?: 'primary' | 'white' | 'small';
  width?: number;
  height?: number;
  style?: ImageStyle | ImageStyle[];
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

/**
 * Dynamic Logo Component
 * Shortcut for loading logos from CMS
 */
export const DynamicLogo: React.FC<DynamicLogoProps> = ({
  logoType = 'primary',
  width = 120,
  height = 120,
  style,
  resizeMode = 'contain',
}) => {
  return (
    <DynamicImage
      assetKey={`logo_${logoType}`}
      width={width}
      height={height}
      style={style}
      resizeMode={resizeMode}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

