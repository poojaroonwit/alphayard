import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import MarketingScreen from '../screens/auth/MarketingScreen';
import GetStartScreen from '../screens/auth/GetStartScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import MarketMenuScreen from '../screens/auth/MarketMenuScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

import TwoFactorMethodScreen from '../screens/auth/TwoFactorMethodScreen';
import TwoFactorVerifyScreen from '../screens/auth/TwoFactorVerifyScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SSOLoginScreen from '../screens/auth/SSOLoginScreen';
import PinSetupScreen from '../screens/auth/PinSetupScreen';

export type AuthStackParamList = {
  GetStart: undefined;
  Marketing: undefined;
  MarketMenu: undefined;
  Login: undefined;
  Signup: { email?: string; phone?: string };
  SSOLogin: { provider: string };
  TwoFactorMethod: { identifier: string; mode: 'login' | 'signup' };
  TwoFactorVerify: { identifier: string; mode: 'login' | 'signup'; channel: 'email' | 'sms' | 'authenticator' };
  ForgotPassword: undefined;

  Welcome: undefined;
  SetupPin: { email: string; isNewUser?: boolean };
  WorkplaceInfo: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // CRITICAL: If somehow this navigator is rendered when authenticated, return null immediately
  // Don't even render the error screen - just return null to prevent any rendering
  if (isAuthenticated && user) {
    console.error('[AuthNavigator] ⚠️ CRITICAL ERROR: AuthNavigator rendered when user is authenticated!');
    console.error('[AuthNavigator] User:', user.email);
    console.error('[AuthNavigator] This should NEVER happen - RootNavigator should prevent this');
    console.error('[AuthNavigator] Returning null to prevent rendering');
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName="GetStart"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animationEnabled: false,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="GetStart" component={GetStartScreen} />
      <Stack.Screen name="Marketing" component={MarketingScreen} />
      <Stack.Screen name="MarketMenu" component={MarketMenuScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SSOLogin" component={SSOLoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      <Stack.Screen name="TwoFactorMethod" component={TwoFactorMethodScreen} />
      <Stack.Screen name="TwoFactorVerify" component={TwoFactorVerifyScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SetupPin" component={PinSetupScreen} />
      <Stack.Screen name="WorkplaceInfo" component={require('../screens/auth/WorkplaceInfoScreen').default} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
