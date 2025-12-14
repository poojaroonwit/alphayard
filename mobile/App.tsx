import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { MainContentProvider } from './src/contexts/MainContentContext';
import RootNavigator from './src/navigation/RootNavigator';

/**
 * Main Application Entry Point
 * 
 * Wraps the app with necessary providers:
 * - GestureHandlerRootView for gesture support
 * - SafeAreaProvider for safe area insets
 * - AuthProvider for authentication state
 * - MainContentProvider for main content state
 * - RootNavigator for navigation (shows Auth or App based on auth state)
 */
const App: React.FC = () => {
  console.log('🚀 App Starting...');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <MainContentProvider>
            <RootNavigator />
          </MainContentProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
