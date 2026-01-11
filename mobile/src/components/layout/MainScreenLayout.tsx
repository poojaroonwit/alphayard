import React, { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, StyleSheet } from 'react-native';
import { WelcomeSection } from '../home/WelcomeSection';
import { homeStyles } from '../../styles/homeStyles';

interface MainScreenLayoutProps {
  cardMarginTopAnim?: Animated.AnimatedInterpolation<string | number> | Animated.Value;
  cardOpacityAnim?: Animated.Value;
  children: ReactNode;
}

export const MainScreenLayout: React.FC<MainScreenLayoutProps> = ({
  cardMarginTopAnim,
  cardOpacityAnim,
  children,
}) => {
  return (
    <LinearGradient
      colors={['#FA7272', '#FFBBB4', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <WelcomeSection />

        <Animated.View
          style={[
            homeStyles.mainContentCard,
            {
              // Override or combine styles
              transform: [{ translateY: cardMarginTopAnim || 0 }],
              opacity: cardOpacityAnim || 1,
              marginTop: -16, // Explicitly enforce the negative margin

              // Ensure shadow/elevation matches desired look if homeStyles differs
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
              backgroundColor: '#FFFFFF', // Ensure white
            }
          ]}
        >
          {children}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Force rebuild comment
export default MainScreenLayout;


