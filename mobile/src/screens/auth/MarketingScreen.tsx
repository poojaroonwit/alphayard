import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { FONT_STYLES } from '../../utils/fontUtils';
import marketingService, { MarketingSlide } from '../../services/marketingService';

const { width, height } = Dimensions.get('window');

interface MarketingScreenProps {
  navigation: any;
}

const MarketingScreen: React.FC<MarketingScreenProps> = () => {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
  
  // CRITICAL: Try to navigate away if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.error('[MarketingScreen] ⚠️ BLOCKED: Authenticated user tried to access Marketing screen');
      console.error('[MarketingScreen] User:', user.email);
      console.error('[MarketingScreen] This should NEVER happen - RootNavigator should prevent this');
      
      try {
        // Try to get to the root navigator and reset
        const rootNavigation = navigation.getParent() || navigation;
        if (rootNavigation && rootNavigation.reset) {
          console.log('[MarketingScreen] Attempting to navigate away from Marketing screen');
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
  
  // CRITICAL: Don't render if authenticated - this is a safety measure
  // Check this FIRST before any other logic
  if (isAuthenticated && user) {
    // Return null immediately - don't render anything
    return null;
  }
  const [currentSlide, setCurrentSlide] = useState(0);
  const [marketingSlides, setMarketingSlides] = useState<MarketingSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadMarketingSlides();
  }, []);

  useEffect(() => {
    if (marketingSlides.length > 0) {
      // Start animations when slides are loaded
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [marketingSlides]);

  const loadMarketingSlides = async () => {
    try {
      setLoading(true);
      const slides = await marketingService.getMarketingSlides();
      setMarketingSlides(slides);
    } catch (error) {
      console.error('Error loading marketing slides:', error);
      // Fallback to default slides if API fails
      setMarketingSlides([
        {
          id: '1',
          title: 'Stay Connected',
          subtitle: 'With Your Family',
          description: 'Keep your loved ones close with real-time location sharing, instant messaging, and family updates.',
          icon: 'home-heart',
          gradient: ['#FA7272', '#FFBBB4'],
          features: [
            'Real-time location tracking',
            'Instant family messaging',
            'Safety alerts & notifications'
          ],
          slide_order: 1
        },
        {
          id: '2',
          title: 'Safety First',
          subtitle: 'Always Protected',
          description: 'Emergency alerts, geofencing, and safety features to ensure your family\'s security and peace of mind.',
          icon: 'shield-check',
          gradient: ['#FA7272', '#FFBBB4'],
          features: [
            'Emergency panic button',
            'Geofence alerts',
            'Inactivity monitoring'
          ],
          slide_order: 2
        },
        {
          id: '3',
          title: 'Share Moments',
          subtitle: 'Create Memories',
          description: 'Share photos, videos, and memories with your family in a secure, private environment.',
          icon: 'camera-plus',
          gradient: ['#FA7272', '#FFBBB4'],
          features: [
            'Family photo gallery',
            'Secure file sharing',
            'Memory timeline'
          ],
          slide_order: 3
        },
        {
          id: '4',
          title: 'Organize Life',
          subtitle: 'Together',
          description: 'Manage family schedules, tasks, and events with shared calendars and to-do lists.',
          icon: 'calendar-check',
          gradient: ['#FA7272', '#FFBBB4'],
          features: [
            'Shared family calendar',
            'Task management',
            'Event planning'
          ],
          slide_order: 4
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentSlide(roundIndex);
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  };

  const renderSlide = (slide: MarketingSlide, index: number) => (
    <View key={slide.id} style={styles.slide}>
      <LinearGradient
        colors={slide.gradient}
        style={styles.slideGradient}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        <SafeAreaView style={styles.slideContent}>
          {/* Main Content */}
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Icon name={slide.icon} size={60} color="#FFFFFF" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>

            {/* Description */}
            <Text style={styles.description}>{slide.description}</Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {slide.features.map((feature: string, featureIndex: number) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <Icon name="check-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Bottom Section - Login and Signup Buttons */}
          <View style={styles.bottomSection}>
            {/* Pagination Dots */}
            <View style={styles.pagination}>
              {marketingSlides.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentSlide === index && styles.activeDot
                  ]}
                />
              ))}
            </View>

            {/* Login and Signup Buttons - Always visible */}
            <Animated.View
              style={[
                styles.buttonsContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color="#FF5A5A" />
        <Text style={styles.loadingText}>Loading marketing content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {marketingSlides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    height: height,
  },
  slideGradient: {
    flex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    top: -100,
    right: -100,
    width: 300,
    height: 300,
  },
  circle2: {
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
  },
  circle3: {
    top: '30%',
    right: -50,
    width: 200,
    height: 200,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: FONT_STYLES.englishHeading,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
    fontFamily: FONT_STYLES.englishBody,
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
    flex: 1,
    fontFamily: FONT_STYLES.englishBody,
  },
  bottomSection: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 24,
    height: 8,
    borderRadius: 4,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 16,
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FA7272',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  signupButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FA7272',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontFamily: FONT_STYLES.englishBody,
  },
});

export default MarketingScreen;
