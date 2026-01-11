import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack';
import CoolIcon from '../components/common/CoolIcon';
import { NavigationAnimationProvider } from '../contexts/NavigationAnimationContext';
import { MainContentProvider } from '../contexts/MainContentContext';
import { useLanguage } from '../contexts/LanguageContext';

// Import screens
import YouScreen from '../screens/main/YouScreen';
import FamilyScreen from '../screens/main/FamilyScreen';
import SocialScreen from '../screens/main/SocialScreen';
import AppsScreen from '../screens/main/AppsScreen';

// Secondary screens for Stacks
import ProfileScreen from '../screens/main/ProfileScreen';
import CalendarScreen from '../screens/main/CalendarScreen';
import GalleryScreen from '../screens/main/GalleryScreen';
import NotesScreen from '../screens/main/NotesScreen';
import FamilySettingsScreen from '../screens/settings/FamilySettingsScreen';
import FamilyListScreen from '../screens/family/FamilyListScreen';
import FamilyDetailScreen from '../screens/family/FamilyDetailScreen';
import NewsScreen from '../screens/main/NewsScreen';
import NewsDetailScreen from '../screens/main/NewsDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SecondHandShopScreen from '../screens/main/SecondHandShopScreen';
import StorageScreen from '../screens/storage/StorageScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import IndividualChatScreen from '../screens/chat/IndividualChatScreen';

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

// YouStack: Main "You" tab + profile/settings/personal stuff
const YouStack = createStackNavigator();
const YouStackNavigator: React.FC = () => {
  return (
    <YouStack.Navigator screenOptions={commonStackOptions}>
      <YouStack.Screen name="YouMain" component={YouScreen} />
      <YouStack.Screen name="Profile" component={ProfileScreen} />
      <YouStack.Screen name="Settings" component={SettingsScreen} />
      <YouStack.Screen name="FamilySettings" component={FamilySettingsScreen} />
      {/* Finance could go here */}
    </YouStack.Navigator>
  );
};

// FamilyStack: Main "Family" tab + family details/settings
const FamilyStack = createStackNavigator();
const FamilyStackNavigator: React.FC = () => {
  return (
    <FamilyStack.Navigator screenOptions={commonStackOptions}>
      <FamilyStack.Screen name="FamilyMain" component={FamilyScreen} />
      <FamilyStack.Screen name="FamilyDetail" component={FamilyDetailScreen} />
      <FamilyStack.Screen name="FamilyList" component={FamilyListScreen} />
      <FamilyStack.Screen name="FamilySettings" component={FamilySettingsScreen} />
    </FamilyStack.Navigator>
  );
};

// ChatStack: Main "Chat" tab
const ChatStack = createStackNavigator();
const ChatStackNavigator: React.FC = () => {
  return (
    <ChatStack.Navigator screenOptions={commonStackOptions}>
      <ChatStack.Screen name="ChatListMain" component={ChatListScreen} />
      <ChatStack.Screen name="ChatRoom" component={IndividualChatScreen} />
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
      <AppsStack.Screen name="FamilySettings" component={FamilySettingsScreen} />

      {/* Other apps if they have screens */}
    </AppsStack.Navigator>
  );
};


// Main Tab Navigator
const MainTabNavigatorInner: React.FC = () => {
  const { t: translate } = useLanguage();
  // Safe fallback if t is undefined for any reason (though it shouldn't be if Provider is up)
  const t = (key: string) => (typeof translate === 'function' ? translate(key) : key);

  return (
    <NavigationAnimationProvider>
      <Tab.Navigator
        initialRouteName="You"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#FA7272', // Pink active
          tabBarInactiveTintColor: '#9E9E9E',
          tabBarLabelPosition: 'below-icon',
        }}
      >
        <Tab.Screen
          name="You"
          component={YouStackNavigator}
          options={{
            tabBarLabel: t('nav.you'),
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="account" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Family"
          component={FamilyStackNavigator}
          options={{
            tabBarLabel: t('nav.family'),
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="home-heart" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Chat"
          component={ChatStackNavigator}
          options={{
            tabBarLabel: t('nav.chat'),
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="chat-processing" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Social"
          component={SocialStackNavigator}
          options={{
            tabBarLabel: t('nav.social'),
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="account-multiple" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Apps"
          component={AppsStackNavigator}
          options={{
            tabBarLabel: t('nav.apps'),
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="apps" size={size} color={color} />
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