import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
  duration?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onLoadingComplete,
  duration = 3000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Initial fade in and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-complete loading after duration
    const timer = setTimeout(() => {
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [fadeAnim, scaleAnim, onLoadingComplete, duration]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E67E5F" />
      
      {/* Blue border */}
      <View style={styles.border}>
        {/* Gradient background */}
        <LinearGradient
          colors={['#FF5A5A', '#FF8C8C', '#FFB7B7']} // Custom gradient colors
          locations={[0.03, 0.55, 1.0]} // 3%, 55%, 100%
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Logo Text */}
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>LO</Text>
              <Text style={styles.logoText}>GO</Text>
            </View>

            {/* Copyright Text */}
            <View style={styles.copyrightContainer}>
              <Text style={styles.copyrightText}>
                Copyright © 2025. All rights reserved.
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  border: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#007AFF', // Blue border
    margin: 0,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '500',
    color: 'transparent',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
        fontWeight: '500',
        textShadowColor: '#FFFFFF',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
      },
      android: {
        fontFamily: 'sans-serif-medium',
        elevation: 0,
        textShadowColor: '#FFFFFF',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
      },
    }),
  },
  copyrightContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  copyrightText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
  },
});

export default LoadingScreen;
