import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, ImageBackground, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { themeConfigService, ColorValue } from '../../services/themeConfigService';

const { width } = Dimensions.get('window');

const PulseSpinner: React.FC<{ color: string }> = ({ color }) => {
    const scale = useRef(new Animated.Value(0.5)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.parallel([
                Animated.timing(scale, {
                    toValue: 1.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: color,
                    opacity: opacity,
                    transform: [{ scale: scale }],
                }
            ]}
        />
    );
};

const DotsSpinner: React.FC<{ color: string }> = ({ color }) => {
    const anim1 = useRef(new Animated.Value(0)).current;
    const anim2 = useRef(new Animated.Value(0)).current;
    const anim3 = useRef(new Animated.Value(0)).current;

    const animateDot = (anim: Animated.Value, delay: number) => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: -10,
                    duration: 400,
                    delay: delay,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }

    useEffect(() => {
        animateDot(anim1, 0);
        animateDot(anim2, 200);
        animateDot(anim3, 400);
    }, []);

    const dotStyle = {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        marginHorizontal: 4,
    };

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 20 }}>
            <Animated.View style={[dotStyle, { transform: [{ translateY: anim1 }] }]} />
            <Animated.View style={[dotStyle, { transform: [{ translateY: anim2 }] }]} />
            <Animated.View style={[dotStyle, { transform: [{ translateY: anim3 }] }]} />
        </View>
    );
};

export const SplashBranding: React.FC = () => {
  const { branding } = useTheme();
  
  // Default values
  const config = branding?.splash || {
    backgroundColor: '#FFFFFF',
    spinnerColor: '#000000',
    spinnerType: 'circle',
    showAppName: true,
    showLogo: true,
    logoAnimation: 'none'
  } as any;

  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[SplashBranding] Current Branding Config:', JSON.stringify(branding, null, 2));
    if (branding?.splash) {
        console.log('[SplashBranding] Splash object found:', JSON.stringify(branding.splash, null, 2));
    } else {
        console.warn('[SplashBranding] Splash object is MISSING in branding data');
    }
  }, [branding]);

  useEffect(() => {
    if (config.logoAnimation === 'none') {
        animValue.setValue(0);
        return;
    }

    const startAnimation = () => {
      if (config.logoAnimation === 'rotate') {
        // Reset value to 0 to ensure smooth looping
        animValue.setValue(0);
        Animated.loop(
          Animated.timing(animValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          })
        ).start();
      } else if (config.logoAnimation === 'bounce') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            })
          ])
        ).start();
      } else if (config.logoAnimation === 'pulse' || config.logoAnimation === 'zoom') {
        Animated.loop(
          Animated.sequence([
             Animated.timing(animValue, {
               toValue: 1,
               duration: 1000,
               useNativeDriver: true,
             }),
             Animated.timing(animValue, {
               toValue: 0,
               duration: 1000,
               useNativeDriver: true,
             })
           ])
        ).start();
      }
    };

    startAnimation();
  }, [config.logoAnimation]); // Re-run if animation type changes

  const getLogoTransform = () => {
    switch (config.logoAnimation) {
      case 'rotate':
        const rotate = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        });
        return { transform: [{ rotate }] };
      case 'bounce':
        const translateY = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20]
        });
        return { transform: [{ translateY }] };
      case 'pulse':
        const scalePulse = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1]
        });
        return { transform: [{ scale: scalePulse }] };
      case 'zoom':
          const scaleZoom = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.3] 
          });
          return { transform: [{ scale: scaleZoom }] };
      default:
        return {};
    }
  };

  const renderInner = () => {
      // Resolve spinner color
      const spinnerColor = typeof config.spinnerColor === 'string' 
          ? config.spinnerColor 
          : themeConfigService.colorToString(config.spinnerColor);

      return (
        <>
            {config.showLogo && (
                branding?.logoUrl ? (
                <Animated.Image 
                    source={{ uri: branding.logoUrl }} 
                    style={[styles.logo, getLogoTransform()]} 
                    resizeMode="contain"
                />
                ) : (
                <Animated.View style={[styles.placeholderLogo, getLogoTransform()]}>
                    <Text style={{ fontSize: 40 }}>🏷️</Text>
                </Animated.View>
                )
            )}
            
            {config.showAppName && (
                <Text style={[styles.appName, { color: spinnerColor }]}>
                {branding?.appName || 'Boundary'}
                </Text>
            )}

            {config.spinnerType !== 'none' && (
                <View style={styles.spinner}>
                    {config.spinnerType === 'dots' && <DotsSpinner color={spinnerColor} />}
                    {config.spinnerType === 'pulse' && <PulseSpinner color={spinnerColor} />}
                    {config.spinnerType === 'circle' && (
                        <ActivityIndicator 
                            size="large" 
                            color={spinnerColor} 
                        />
                    )}
                </View>
            )}
        </>
      );
  };

  // Helper to determine background type
  const renderContent = () => {
    const bg = config.backgroundColor as ColorValue | string;
    let containerStyle: any = { flex: 1, alignItems: 'center', justifyContent: 'center' };
    
    // Handle string (legacy/solid)
    if (typeof bg === 'string') {
        containerStyle.backgroundColor = bg;
        return (
            <View style={containerStyle}>
                {renderInner()}
            </View>
        );
    }

    // Handle ColorValue object
    const colorBg = bg as ColorValue;
    if (colorBg.mode === 'image' && colorBg.image) {
        return (
            <ImageBackground source={{ uri: colorBg.image }} style={containerStyle} resizeMode={config.resizeMode || 'cover'}>
                {renderInner()}
            </ImageBackground>
        );
    } else if (colorBg.mode === 'gradient') {
        const colors = themeConfigService.getGradientColors(colorBg);
        const locations = themeConfigService.getGradientLocations(colorBg);
        return (
            <LinearGradient
                colors={colors}
                locations={locations}
                start={colorBg.gradient?.angle ? undefined : { x: 0, y: 0 }} // Simple defaults
                end={colorBg.gradient?.angle ? undefined : { x: 1, y: 1 }}
                style={containerStyle}
            >
                {renderInner()}
            </LinearGradient>
        );
    } else {
        // Solid fallback
        containerStyle.backgroundColor = themeConfigService.colorToString(colorBg);
        return (
            <View style={containerStyle}>
                {renderInner()}
            </View>
        );
    }
  };

  return renderContent();
};

const styles = StyleSheet.create({
  logo: {
    width: width * 0.3,
    height: width * 0.3,
    marginBottom: 32,
  },
  placeholderLogo: {
    width: 96, 
    height: 96, 
    borderRadius: 24, 
    marginBottom: 32, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F3F4F6'
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  spinner: {
    position: 'absolute',
    bottom: 64,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default SplashBranding;


