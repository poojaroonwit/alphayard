import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { usePin } from '../contexts/PinContext';
import { useLanguage } from '../contexts/LanguageContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import PinSetupScreen from '../screens/auth/PinSetupScreen';
import PinUnlockScreen from '../screens/auth/PinUnlockScreen';
import LanguageSelectionScreen from '../screens/auth/LanguageSelectionScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  PinSetup: undefined;
  PinUnlock: undefined;
  Loading: undefined;
  LanguageSelection: undefined;
  Onboarding: undefined;
  CircleTypeSelection: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

import SplashBranding from '../components/branding/SplashBranding';

const LoadingScreen = () => (
  <SplashBranding />
);

import { useTheme } from '../contexts/ThemeContext';

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, setNavigationRef, user, isOnboardingComplete } = useAuth();
  const { hasPin, isPinLocked, isLoading: isPinLoading } = usePin();
  const { language, isLoading: isLanguageLoading } = useLanguage();
  const { loading: isThemeLoading } = useTheme();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Set navigation reference in AuthContext for programmatic navigation
    if (setNavigationRef && navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, [setNavigationRef, navigationRef.current]);

  // Determine if we should show language selection first
  const showLanguageSelection = !isLanguageLoading && !language;

  // Relaxed condition: if we have a user ID and authenticated, we show the app stack
  const showApp = isAuthenticated && !!user?.id;

  useEffect(() => {
    console.log('[NAV] RootNavigator - State Update:', {
      isAuthenticated,
      userId: user?.id,
      isLoading,
      isPinLoading,
      isThemeLoading,
      isOnboardingComplete,
      showApp,
      showLanguageSelection
    });
  }, [isAuthenticated, user, isLoading, isPinLoading, isThemeLoading, isOnboardingComplete, showApp, showLanguageSelection]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (setNavigationRef && navigationRef.current) {
          setNavigationRef(navigationRef.current);
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
        }}
      >
        {isLoading || isPinLoading || isLanguageLoading || isThemeLoading ? (
          // Show empty or loading screen while deciding
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
          />
        ) : showLanguageSelection ? (
          <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        ) : showApp ? (
          // User is authenticated - show app screens
          <>
            {hasPin && isPinLocked ? (
              // PIN is locked - show unlock screen
              <Stack.Screen name="PinUnlock" component={PinUnlockScreen} />
            ) : !hasPin ? (
              // No PIN set up yet - show PIN setup
              <Stack.Screen name="PinSetup" component={PinSetupScreen} />
            ) : !isOnboardingComplete ? (
              // Onboarding not complete - show onboarding flow
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
              // All good - show the main app
              <Stack.Screen name="App" component={AppNavigator} />
            )}
          </>
        ) : (
          // Not authenticated - show auth flow
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
