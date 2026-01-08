import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import CoolIcon from '../components/common/CoolIcon';

import { ApplicationsDrawer } from '../components/home/ApplicationsDrawer';
import { NavigationAnimationProvider } from '../contexts/NavigationAnimationContext';
import { MainContentProvider, useMainContent } from '../contexts/MainContentContext';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import MarketingScreen from '../screens/auth/MarketingScreen';
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
// import LogicScreen from '../screens/main/LogicScreen'; // removed per request
// Applications moved to drawer, not a page
import ChatListScreen from '../screens/main/ChatListScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

// Simple Home Stack
const HomeStackNavigator: React.FC = () => {
  // console.log('🏠 HomeStackNavigator rendering...');
  // console.log('🏠 HomeStackNavigator - About to render HomeMain screen');
  return (
    <HomeStack.Navigator
      initialRouteName="HomeMain"
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="FamilyList" component={FamilyListScreen} />
      <HomeStack.Screen name="FamilyDetail" component={FamilyDetailScreen} />
      <HomeStack.Screen name="FamilySettings" component={FamilySettingsScreen} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} />
      <HomeStack.Screen name="Marketing" component={MarketingScreen} />
      <HomeStack.Screen name="News" component={NewsScreen} />
      <HomeStack.Screen name="NewsDetail" component={NewsDetailScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
      <HomeStack.Screen name="SecondHandShop" component={SecondHandShopScreen} />
      <HomeStack.Screen name="Storage" component={StorageScreen} />
      <HomeStack.Screen name="ChatList" component={ChatListScreen} />
    </HomeStack.Navigator>
  );
};

// Wrapper to set active section when a tab is focused
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
const withSection = (section: 'home' | 'gallery' | 'calendar' | 'notes' | 'chat') => {
  return function SectionSetter() {
    const { setActiveSection } = useMainContent();
    useFocusEffect(
      useCallback(() => {
        setActiveSection(section);
      }, [section, setActiveSection])
    );
    return <HomeStackNavigator />;
  };
};

// Define stable components outside render logic to prevent remounting
const HomeTab = withSection('home');
const GalleryTab = withSection('gallery');
const CalendarTab = withSection('calendar');
const NotesTab = withSection('notes');

// Main Tab Navigator
const MainTabNavigatorInner: React.FC = () => {

  const { showAppsDrawer, setShowAppsDrawer } = useMainContent();

  return (
    <NavigationAnimationProvider>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#E8B4A1',
          tabBarInactiveTintColor: '#9E9E9E',
          tabBarLabelPosition: 'below-icon', // Explicitly ensure label is below icon
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeTab}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="house-03" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Gallery"
          component={GalleryTab}
          options={{
            tabBarLabel: 'Gallery',
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="image" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Calendar"
          component={CalendarTab}
          options={{
            tabBarLabel: 'Calendar',
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Notes"
          component={NotesTab}
          options={{
            tabBarLabel: 'Organizer',
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="doc-text" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Applications"
          component={HomeScreen}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
              setShowAppsDrawer(true);
            },
          })}
          options={{
            tabBarLabel: 'Apps',
            tabBarIcon: ({ color, size }) => (
              <CoolIcon name="apps" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <ApplicationsDrawer visible={showAppsDrawer} onClose={() => setShowAppsDrawer(false)} />
    </NavigationAnimationProvider>
  );
};

const MainTabNavigator: React.FC = () => (
  <MainContentProvider>
    <MainTabNavigatorInner />
  </MainContentProvider>
);

export default MainTabNavigator;