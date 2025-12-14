import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { EmotionCheckProvider } from '../contexts/EmotionCheckContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, setNavigationRef, user, forceUpdate } = useAuth();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Set navigation reference in AuthContext for programmatic navigation
    if (setNavigationRef && navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, [setNavigationRef, navigationRef.current]);

  // Simple conditional: if authenticated with valid user, show App; otherwise show Auth
  const showApp = isAuthenticated && user && user.id && user.email;

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5A5A" />
      </View>
    );
  }

  // Render completely separate navigation trees based on auth state
  if (showApp) {
    return (
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          if (setNavigationRef && navigationRef.current) {
            setNavigationRef(navigationRef.current);
          }
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (setNavigationRef && navigationRef.current) {
          setNavigationRef(navigationRef.current);
        }
      }}
    >
      <AuthNavigator />
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