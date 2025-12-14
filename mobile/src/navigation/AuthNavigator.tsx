import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import MarketingScreen from '../screens/auth/MarketingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import MarketMenuScreen from '../screens/auth/MarketMenuScreen';
import Step1UsernameScreen from '../screens/auth/signup/Step1UsernameScreen';
import Step2PasswordScreen from '../screens/auth/signup/Step2PasswordScreen';
import Step3FamilyScreen from '../screens/auth/signup/Step3FamilyScreen';
import Step3CreateFamilyScreen from '../screens/auth/signup/Step3CreateFamilyScreen';
import Step3JoinFamilyScreen from '../screens/auth/signup/Step3JoinFamilyScreen';
import Step4InviteFamilyScreen from '../screens/auth/signup/Step4InviteFamilyScreen';
import Step4NameScreen from '../screens/auth/signup/Step4NameScreen';
import Step5PersonalInfoScreen from '../screens/auth/signup/Step5PersonalInfoScreen';
import Step6SurveyScreen from '../screens/auth/signup/Step6SurveyScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';

export type AuthStackParamList = {
  Marketing: undefined;
  MarketMenu: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  Step1Username: { email?: string };
  Step2Password: { email: string };
  Step3Family: { email: string; password: string };
  Step3CreateFamily: { email: string; password: string };
  Step3JoinFamily: { email: string; password: string; familyOption: 'join' };
  Step4InviteFamily: { email: string; password: string; familyOption: 'create'; familyName: string; familyDescription?: string };
  Step4Name: { 
    email: string; 
    password: string; 
    familyOption: 'create' | 'join';
    familyCode?: string;
    familyName?: string;
    familyDescription?: string;
    inviteEmails?: string[];
  };
  Step5PersonalInfo: { 
    email: string; 
    password: string; 
    familyOption: 'create' | 'join';
    familyCode?: string;
    familyName?: string;
    familyDescription?: string;
    inviteEmails?: string[];
    firstName: string;
    lastName: string;
  };
  Step6Survey: {
    email: string;
    password: string;
    familyOption: 'create' | 'join';
    familyCode?: string;
    familyName?: string;
    familyDescription?: string;
    inviteEmails?: string[];
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    userType?: string;
  };
  Welcome: undefined;
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
      initialRouteName="Marketing"
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
      <Stack.Screen name="Marketing" component={MarketingScreen} />
      <Stack.Screen name="MarketMenu" component={MarketMenuScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Step1Username" component={Step1UsernameScreen} />
      <Stack.Screen name="Step2Password" component={Step2PasswordScreen} />
      <Stack.Screen name="Step3Family" component={Step3FamilyScreen} />
      <Stack.Screen name="Step3CreateFamily" component={Step3CreateFamilyScreen} />
      <Stack.Screen name="Step3JoinFamily" component={Step3JoinFamilyScreen} />
      <Stack.Screen name="Step4InviteFamily" component={Step4InviteFamilyScreen} />
      <Stack.Screen name="Step4Name" component={Step4NameScreen} />
      <Stack.Screen name="Step5PersonalInfo" component={Step5PersonalInfoScreen} />
      <Stack.Screen name="Step6Survey" component={Step6SurveyScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
