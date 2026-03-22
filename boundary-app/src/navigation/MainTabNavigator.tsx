import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
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


const TAB_ITEMS = [
  { name: 'Personal', icon: 'account',          labelKey: 'nav.personal' as TranslationKey },
  { name: 'Circle',   icon: 'home-heart',        labelKey: 'nav.circle'   as TranslationKey },
  { name: 'Social',   icon: 'account-multiple',  labelKey: 'nav.social'   as TranslationKey },
  { name: 'Chat',     icon: 'chat-processing',   labelKey: 'nav.chat'     as TranslationKey },
  { name: 'Apps',     icon: 'apps',              labelKey: 'nav.apps'     as TranslationKey },
];

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { t: translate } = useLanguage();
  const t = (key: TranslationKey) => (typeof translate === 'function' ? translate(key) : key);

  return (
    <View style={tabStyles.wrapper}>
      <View style={tabStyles.container}>
        {TAB_ITEMS.map((item, index) => {
          const isActive = state.index === index;
          const isFirst = index === 0;
          const isLast = index === TAB_ITEMS.length - 1;

          return (
            <TouchableOpacity
              key={item.name}
              style={[
                tabStyles.tab,
                isFirst && tabStyles.tabFirst,
                isLast && tabStyles.tabLast,
                isActive && tabStyles.tabActive,
              ]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.75}
            >
              <CoolIcon
                name={item.icon}
                size={22}
                color={isActive ? '#FA7272' : '#9E9E9E'}
              />
              <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 3,
  },
  tabFirst: {
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  tabLast: {
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  tabActive: {
    backgroundColor: '#FFF5F5',
  },
  label: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  labelActive: {
    color: '#FA7272',
    fontWeight: '700',
  },
});

// Main Tab Navigator
const MainTabNavigatorInner: React.FC = () => {
  return (
    <NavigationAnimationProvider>
      <Tab.Navigator
        initialRouteName="Personal"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen name="Personal" component={PersonalStackNavigator} />
        <Tab.Screen name="Circle"   component={CircleStackNavigator} />
        <Tab.Screen name="Social"   component={SocialStackNavigator} />
        <Tab.Screen name="Chat"     component={ChatStackNavigator} />
        <Tab.Screen name="Apps"     component={AppsStackNavigator} />
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
