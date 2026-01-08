import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Abstract Shape Components for "3D" feel
const Torus = ({ style }: { style: any }) => (
  <View style={[styles.torus, style]}>
    <LinearGradient
      colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.torusGradient}
    />
  </View>
);

const Capsule = ({ style }: { style: any }) => (
  <View style={[styles.capsule, style]}>
    <LinearGradient
      colors={['#FFF5E1', '#FFE4B5']}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1, borderRadius: 60 }}
    />
  </View>
);

const TwistedTube = ({ style }: { style: any }) => (
  <View style={[style, { width: 150, height: 150 }]}>
    {/* Simulate a twisted shape with overlapping circles */}
    <View style={[styles.tubeSegment, { top: 0, left: 0, zIndex: 3, backgroundColor: 'rgba(255,255,255,0.95)' }]} />
    <View style={[styles.tubeSegment, { top: 20, left: 30, zIndex: 2, backgroundColor: 'rgba(255,230,230,0.9)' }]} />
    <View style={[styles.tubeSegment, { top: 50, left: 40, zIndex: 1, backgroundColor: 'rgba(255,200,200,0.85)' }]} />
  </View>
);

interface MarketingScreenProps {
  navigation: any;
}

const MarketingScreen: React.FC<MarketingScreenProps> = () => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();

  // Animations
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(40)).current;
  const shapeAnim1 = useRef(new Animated.Value(0)).current;
  const shapeAnim2 = useRef(new Animated.Value(0)).current;

  // CRITICAL: Navigate away if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      try {
        const rootNavigation = navigation.getParent() || navigation;
        if (rootNavigation && rootNavigation.reset) {
          rootNavigation.reset({
            index: 0,
            routes: [{ name: 'App' } as any],
          });
        }
      } catch (error) {
        console.error('[MarketingScreen] Error navigating away:', error);
      }
    }
  }, [isAuthenticated, user, navigation]);

  if (isAuthenticated && user) return null;

  useEffect(() => {
    // Entrance animations
    // We separate the loops from the entrance parallel block because loops run forever
    // and we don't want to block the completion of the entrance (though .start() on parallel with loops just runs them)
    // However, putting .start() INSIDE parallel array was the bug.

    // 1. One-off entrance animations
    Animated.parallel([
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Loop animations (start independently)
    Animated.loop(
      Animated.sequence([
        Animated.timing(shapeAnim1, { toValue: 10, duration: 3000, useNativeDriver: true }),
        Animated.timing(shapeAnim1, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shapeAnim2, { toValue: -15, duration: 4000, useNativeDriver: true }),
        Animated.timing(shapeAnim2, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

  }, []);

  const handleGetStarted = () => {
    navigation.navigate('Signup' as never);
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background Gradient - Darker modern pink */}
      <LinearGradient
        colors={['#992525', '#4A0808']} // Dark red/wine gradient
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>

          {/* Abstract background shapes */}
          <View style={styles.shapesContainer}>
            <Animated.View style={{ transform: [{ translateY: shapeAnim1 }] }}>
              <Torus style={styles.shapeTorus} />
            </Animated.View>

            <Animated.View style={{ transform: [{ translateY: shapeAnim2 }] }}>
              <Capsule style={styles.shapeCapsule} />
            </Animated.View>

            <Animated.View style={{ transform: [{ rotate: '45deg' }] }}>
              <TwistedTube style={styles.shapeTwisted} />
            </Animated.View>
          </View>

          {/* Main Text Content */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: contentFadeAnim,
                transform: [{ translateY: contentSlideAnim }],
              },
            ]}
          >
            <Text style={styles.heroTitle}>
              It's easy talking to{'\n'}your friends with{'\n'}Bondarys
            </Text>

            <Text style={styles.subtitle}>
              Call Your Friend Simply and Simple{'\n'}With Bondarys
            </Text>
          </Animated.View>

          {/* Bottom Action */}
          <Animated.View
            style={[
              styles.actionContainer,
              {
                opacity: contentFadeAnim,
                transform: [{ translateY: contentSlideAnim }],
              }
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetStarted}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} style={{ padding: 12 }}>
              <Text style={styles.loginLink}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </Animated.View>

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  shapesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  // Shapes
  torus: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  torusGradient: {
    flex: 1,
    borderRadius: 100,
    borderWidth: 40,
    borderColor: 'rgba(255,255,255,0.85)', // Fallback if border gradient not supported perfectly
    // Note: Border gradient is tricky in RN without specific libs. 
    // We'll simulate a torus with a smaller inner circle masking it? 
    // Or just a thick white ring with opacity.
    opacity: 0.9,
  },
  shapeTorus: {
    top: height * 0.05,
    right: -width * 0.1,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 50,
    borderColor: '#E3F2FD', // Light blueish white from ref
    opacity: 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  shapeCapsule: {
    position: 'absolute',
    top: height * 0.3,
    right: -20,
    width: 140,
    height: 220, // Vertical capsule? Ref has a tilted pill.
    borderRadius: 70,
    transform: [{ rotate: '-30deg' }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  capsule: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shapeTwisted: {
    position: 'absolute',
    top: height * 0.15,
    left: -40,
  },
  tubeSegment: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: height * 0.1, // Push text down a bit
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '700', // Bold
    color: '#FFFFFF',
    lineHeight: 48,
    marginBottom: 16,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium' }),
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
  },

  actionContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#FFF5E1', // Beige/Cream color from ref
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F0A0A', // Dark text for contrast
  },
  loginLink: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default MarketingScreen;
