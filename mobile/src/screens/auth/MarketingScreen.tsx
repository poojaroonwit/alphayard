import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { FONT_STYLES } from '../../utils/fontUtils';

const { width, height } = Dimensions.get('window');

interface MarketingScreenProps {
  navigation: any;
}

const MarketingScreen: React.FC<MarketingScreenProps> = () => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonSlideAnim = useRef(new Animated.Value(60)).current;

  // CRITICAL: Navigate away if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.error('[MarketingScreen] ⚠️ BLOCKED: Authenticated user tried to access Marketing screen');
      try {
        const rootNavigation = navigation.getParent() || navigation;
        if (rootNavigation && rootNavigation.reset) {
          rootNavigation.reset({
            index: 0,
            routes: [{ name: 'App' }],
          });
        }
      } catch (error) {
        console.error('[MarketingScreen] Error navigating away:', error);
      }
    }
  }, [isAuthenticated, user, navigation]);

  // Don't render if authenticated
  if (isAuthenticated && user) {
    return null;
  }

  useEffect(() => {
    // Start elegant entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(buttonSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#FA7272', '#F5A8A8', '#FFCDC9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Subtle Background Elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.bgCircle, styles.bgCircle1]} />
          <View style={[styles.bgCircle, styles.bgCircle2]} />
          <View style={[styles.bgCircle, styles.bgCircle3]} />
        </View>

        <SafeAreaView style={styles.safeArea}>
          {/* Main Content - Centered Logo/Brand */}
          <Animated.View
            style={[
              styles.brandContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            {/* Logo Icon */}
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Icon name="home-heart" size={56} color="#FA7272" />
              </View>
            </View>

            {/* Brand Name - Minimal */}
            <Text style={styles.brandName}>Bondarys</Text>
            <View style={styles.taglineContainer}>
              <View style={styles.taglineLine} />
              <Text style={styles.tagline}>Family Village</Text>
              <View style={styles.taglineLine} />
            </View>
          </Animated.View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Action Buttons - Bottom */}
          <Animated.View
            style={[
              styles.buttonsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: buttonSlideAnim }],
              }
            ]}
          >
            {/* Login Button - Primary */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.9}
            >
              <View style={styles.buttonContent}>
                <Icon name="login-variant" size={22} color="#FA7272" />
                <Text style={styles.loginButtonText}>Login</Text>
              </View>
            </TouchableOpacity>

            {/* Signup Button - Secondary */}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              activeOpacity={0.9}
            >
              <View style={styles.buttonContent}>
                <Icon name="account-plus" size={22} color="#FFFFFF" />
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </View>
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
  },
  gradient: {
    flex: 1,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bgCircle1: {
    width: 280,
    height: 280,
    top: -60,
    right: -80,
  },
  bgCircle2: {
    width: 200,
    height: 200,
    bottom: '25%',
    left: -60,
  },
  bgCircle3: {
    width: 140,
    height: 140,
    top: '40%',
    right: -40,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 80,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },
  logoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 44,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 16,
    fontFamily: FONT_STYLES.englishHeading,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taglineLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontFamily: FONT_STYLES.englishMedium,
  },
  spacer: {
    flex: 1,
  },
  buttonsContainer: {
    marginTop: 'auto',
    marginBottom: 40,
    gap: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  loginButtonText: {
    color: '#FA7272',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  signupButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
});

export default MarketingScreen;
