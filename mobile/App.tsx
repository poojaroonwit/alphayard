import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { PinProvider } from './src/contexts/PinContext';
import { SocketProvider } from './src/contexts/SocketContext';
import { MainContentProvider } from './src/contexts/MainContentContext';
import { UserDataProvider } from './src/contexts/UserDataContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { NativeBaseProvider, extendTheme } from 'native-base';
import RootNavigator from './src/navigation/RootNavigator';
import { useFonts } from 'expo-font';
import {
  IBMPlexSansThai_400Regular,
  IBMPlexSansThai_500Medium,
  IBMPlexSansThai_600SemiBold,
  IBMPlexSansThai_700Bold
} from '@expo-google-fonts/ibm-plex-sans-thai';
import { theme } from './src/styles/theme'; // Import custom theme

// Extend NativeBase theme to use our font
const nativeBaseTheme = extendTheme({
  fontConfig: {
    IBMPlexSansThai: {
      400: {
        normal: 'IBMPlexSansThai_400Regular',
      },
      500: {
        normal: 'IBMPlexSansThai_500Medium',
      },
      600: {
        normal: 'IBMPlexSansThai_600SemiBold',
      },
      700: {
        normal: 'IBMPlexSansThai_700Bold',
      },
    },
  },
  fonts: {
    heading: 'IBMPlexSansThai',
    body: 'IBMPlexSansThai',
    mono: 'Courier',
  },
  // Merge other custom theme values if compatible, or just use typography for now
  colors: theme.colors,
});

const App = () => {
  const [fontsLoaded] = useFonts({
    IBMPlexSansThai_400Regular,
    IBMPlexSansThai_500Medium,
    IBMPlexSansThai_600SemiBold,
    IBMPlexSansThai_700Bold,
  });

  console.log('🚀 App Starting...');

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <NativeBaseProvider theme={nativeBaseTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LanguageProvider>
            <NotificationProvider>
              <AuthProvider>
                <PinProvider>
                  <SocketProvider>
                    <MainContentProvider>
                      <UserDataProvider>
                        <RootNavigator />
                      </UserDataProvider>
                    </MainContentProvider>
                  </SocketProvider>
                </PinProvider>
              </AuthProvider>
            </NotificationProvider>
          </LanguageProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </NativeBaseProvider>
  );
};

export default App;
