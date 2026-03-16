import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack';
import CoolIcon from '../components/common/CoolIcon';
import { NavigationAnimationProvider } from '../contexts/NavigationAnimationContext';
import { MainContentProvider } from '../contexts/MainContentContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../i18n/translations';

// Import screens
import PersonalScreen from '../screens/main/PersonalScreen';
import CircleScreen from '../screens/main/CircleScreen';
import SocialScreen from '../screens/main/SocialScreen';
import AppsScreen from '../screens/main/AppsScreen';

// Secondary screens for Stacks
import ProfileScreen from '../screens/main/ProfileScreen';
import CalendarScreen from '../screens/main/CalendarScreen';
import GalleryScreen from '../screens/main/GalleryScreen';
import NotesScreen from '../screens/main/NotesScreen';
import CircleSettingsScreen from '../screens/settings/CircleSettingsScreen';
import CircleListScreen from '../screens/circle/CircleListScreen';
import CircleDetailScreen from '../screens/circle/CircleDetailScreen';
import NewsScreen from '../screens/main/NewsScreen';
import NewsDetailScreen from '../screens/main/NewsDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SetPinScreen from '../screens/settings/SetPinScreen';
import SecondHandShopScreen from '../screens/main/SecondHandShopScreen';
import StorageScreen from '../screens/storage/StorageScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';
import NewChatScreen from '../screens/chat/NewChatScreen';
import VoiceCallScreen from '../screens/call/VoiceCallScreen';
import VideoCallScreen from '../screens/call/VideoCallScreen';
import IncomingCallScreen from '../screens/call/IncomingCallScreen';
import CallApplicationScreen from '../screens/call/CallApplicationScreen';

// Security screens
import {
  SecurityScreen,
  ActiveSessionsScreen,
  DevicesScreen,
  LoginHistoryScreen,
  MFASetupScreen,
} from '../screens/security';

// Legal screens
import AboutScreen from '../screens/legal/AboutScreen';

const Tab = createBottomTabNavigator();

const commonStackOptions = {
  headerShown: false,
  ...TransitionPresets.SlideFromRightIOS,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, // Force horizontal slide
  transitionSpec: {
    open: TransitionPresets.SlideFromRightIOS.transitionSpec.open,
    close: TransitionPresets.SlideFromRightIOS.transitionSpec.close,
  },
};

// --- Stack Navigators ---

// PersonalStack: Main "Personal" tab + profile/settings/personal stuff
const PersonalStack = createStackNavigator();
const PersonalStackNavigator: React.FC = () => {
  return (
    <PersonalStack.Navigator screenOptions={commonStackOptions}>
      <PersonalStack.Screen name="PersonalMain" component={PersonalScreen} />
      <PersonalStack.Screen name="Profile" component={ProfileScreen} />
      <PersonalStack.Screen name="Settings" component={SettingsScreen} />
      <PersonalStack.Screen name="CircleSettings" component={CircleSettingsScreen} />
      <PersonalStack.Screen name="About" component={AboutScreen} />
      {/* Security screens */}
      <PersonalStack.Screen name="Security" component={SecurityScreen} />
      <PersonalStack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
      <PersonalStack.Screen name="Devices" component={DevicesScreen} />
      <PersonalStack.Screen name="LoginHistory" component={LoginHistoryScreen} />
      <PersonalStack.Screen name="MFASetup" component={MFASetupScreen} />
      <PersonalStack.Screen name="SetPin" component={SetPinScreen} />
      {/* Finance could go here */}
    </PersonalStack.Navigator>
  );
};

// CircleStack: Main "Circle" tab + circle details/settings
const CircleStack = createStackNavigator();
const CircleStackNavigator: React.FC = () => {
  return (
    <CircleStack.Navigator screenOptions={commonStackOptions}>
      <CircleStack.Screen name="CircleMain" component={CircleScreen} />
      <CircleStack.Screen name="CircleDetail" component={CircleDetailScreen} />
      <CircleStack.Screen name="CircleList" component={CircleListScreen} />
      <CircleStack.Screen name="CircleSettings" component={CircleSettingsScreen} />
    </CircleStack.Navigator>
  );
};

// ChatStack: Main "Chat" tab
const ChatStack = createStackNavigator();
const ChatStackNavigator: React.FC = () => {
  return (
    <ChatStack.Navigator screenOptions={commonStackOptions}>
      <ChatStack.Screen name="ChatListMain" component={ChatListScreen} />
      <ChatStack.Screen name="ChatRoom" component={IndividualChatScreen} />
      <ChatStack.Screen name="NewChat" component={NewChatScreen} />
      <ChatStack.Screen name="VoiceCall" component={VoiceCallScreen} options={{ gestureEnabled: false }} />
      <ChatStack.Screen name="VideoCall" component={VideoCallScreen} options={{ gestureEnabled: false }} />
      <ChatStack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ gestureEnabled: false }} />
      <ChatStack.Screen name="CallApplication" component={CallApplicationScreen} />
    </ChatStack.Navigator>
  );
};

// SocialStack: Main "Social" tab + posts
const SocialStack = createStackNavigator();
const SocialStackNavigator: React.FC = () => {
  return (
    <SocialStack.Navigator screenOptions={commonStackOptions}>
      <SocialStack.Screen name="SocialMain" component={SocialScreen} />
      <SocialStack.Screen name="News" component={NewsScreen} />
      <SocialStack.Screen name="NewsDetail" component={NewsDetailScreen} />
    </SocialStack.Navigator>
  );
};

// AppsStack: Main "Apps" tab + all the apps
const AppsStack = createStackNavigator();
const AppsStackNavigator: React.FC = () => {
  return (
    <AppsStack.Navigator screenOptions={commonStackOptions}>
      <AppsStack.Screen name="AppsMain" component={AppsScreen} />

      {/* App Routes */}
      <AppsStack.Screen name="Gallery" component={GalleryScreen} />
      <AppsStack.Screen name="Calendar" component={CalendarScreen} />
      <AppsStack.Screen name="Notes" component={NotesScreen} />
      <AppsStack.Screen name="SecondHandShop" component={SecondHandShopScreen} />
      <AppsStack.Screen name="Storage" component={StorageScreen} />

      {/* Duplicated here just in case accessed from Apps */}
      <AppsStack.Screen name="Profile" component={ProfileScreen} />
      <AppsStack.Screen name="Settings" component={SettingsScreen} />
      <AppsStack.Screen name="CircleSettings" component={CircleSettingsScreen} />

      {/* Security screens (duplicated for access from Apps) */}
      <AppsStack.Screen name="Security" component={SecurityScreen} />
      <AppsStack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
      <AppsStack.Screen name="Devices" component={DevicesScreen} />
      <AppsStack.Screen name="LoginHistory" component={LoginHistoryScreen} />
      <AppsStack.Screen name="MFASetup" component={MFASetupScreen} />

      {/* Other apps if they have screens */}
    </AppsStack.Navigator>
  );
};


// Main Tab Navigator
const MainTabNavigatorInner: React.FC = () => {
  const { t: translate } = useLanguage();

  const t = (key: TranslationKey) => (typeof translate === 'function' ? translate(key) : key);

  return (
    <NavigationAnimationProvider>
      <Tab.Navigator
        initialRouteName="Personal"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            borderTopWidth: 0,
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
            shadowColor: 'transparent',
          },
          tabBarBackground: () => (
            <View style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E8E8E8',
            }} />
          ),
          tabBarActiveTintColor: '#FA7272',
          tabBarInactiveTintColor: '#9E9E9E',
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen
          name="Personal"
          component={PersonalStackNavigator}
          options={{
            tabBarLabel: t('nav.personal'),
            tabBarIcon: ({ color }) => (
              <CoolIcon name="account" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Circle"
          component={CircleStackNavigator}
          options={{
            tabBarLabel: t('nav.circle'),
            tabBarIcon: ({ color }) => (
              <CoolIcon name="home-heart" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Social"
          component={SocialStackNavigator}
          options={{
            tabBarLabel: t('nav.social'),
            tabBarIcon: ({ color }) => (
              <CoolIcon name="account-multiple" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatStackNavigator}
          options={{
            tabBarLabel: t('nav.chat'),
            tabBarIcon: ({ color }) => (
              <CoolIcon name="chat-processing" size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Apps"
          component={AppsStackNavigator}
          options={{
            tabBarLabel: t('nav.apps'),
            tabBarIcon: ({ color }) => (
              <CoolIcon name="apps" size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationAnimationProvider>
  );
};

const MainTabNavigator: React.FC = () => (
  <MainContentProvider>
    <MainTabNavigatorInner />
  </MainContentProvider>
);

export default MainTabNavigator;
