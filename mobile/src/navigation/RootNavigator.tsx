import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePin } from '../contexts/PinContext';
import { useLanguage } from '../contexts/LanguageContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import PinSetupScreen from '../screens/auth/PinSetupScreen';
import PinUnlockScreen from '../screens/auth/PinUnlockScreen';
import LanguageSelectionScreen from '../screens/auth/LanguageSelectionScreen';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  PinSetup: undefined;
  PinUnlock: undefined;
  Loading: undefined;
  LanguageSelection: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, setNavigationRef, user } = useAuth();
  const { hasPin, isPinLocked, isLoading: isPinLoading } = usePin();
  const { language, isLoading: isLanguageLoading } = useLanguage();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Set navigation reference in AuthContext for programmatic navigation
    if (setNavigationRef && navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, [setNavigationRef, navigationRef.current]);

  // Determine if we should show language selection first
  const showLanguageSelection = !isLanguageLoading && !language;

  // Simple conditional: if authenticated with valid user, show App; otherwise show Auth
  const showApp = isAuthenticated && user && user.id && user.email;

  useEffect(() => {
    console.log('[NAV] RootNavigator - State Update:', {
      isAuthenticated,
      hasUser: !!user,
      isLoading,
      isPinLoading,
      isLanguageLoading,
      language,
      showApp,
      showLanguageSelection,
      hasNavigationRef: !!navigationRef.current
    });
  }, [isAuthenticated, user, isLoading, isPinLoading, isLanguageLoading, language, showApp, showLanguageSelection]);

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
        {isLoading || isPinLoading || isLanguageLoading ? (
          // Show empty or loading screen while deciding
          <Stack.Screen
            name="Loading"
            component={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF5A5A" />
              </View>
            )}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default RootNavigator;