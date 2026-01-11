import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import CoolIcon from '../common/CoolIcon';
import { homeStyles } from '../../styles/homeStyles';

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
  tabs: TabItem[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabPress,
  tabs,
}) => {

  return (
    <View style={homeStyles.tabsContainer}>
      {tabs.map((tab) =>
        activeTab === tab.id ? (
          <LinearGradient
            key={tab.id}
            colors={['#FA7272', '#FFBBB4']} // Match HomeScreen header/background gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: 115, // Restore width for pill shape
              borderRadius: 30, // Restore pill radius
              padding: 1,
              shadowColor: '#FF69B4',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: 'row', // Restore Horizontal layout
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingHorizontal: 10,
                width: '100%',
                paddingVertical: 6,
                borderRadius: 29,
                gap: 8, // Restore gap
              }}
              onPress={() => onTabPress(tab.id)}
            >
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.5)', // Cycle background
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <CoolIcon
                  name={tab.icon as any}
                  size={18}
                  color="#FFFFFF" // White icon for better contrast on pink gradient
                />
              </View>
              <Text style={{
                fontWeight: '600',
                fontSize: 13,
                color: '#FFFFFF'
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <TouchableOpacity
            key={tab.id}
            style={[homeStyles.tab, {
              backgroundColor: 'rgba(255, 182, 193, 0.25)',
              borderWidth: 0,
              borderRadius: 30,
            }]}
            onPress={() => onTabPress(tab.id)}
          >
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.5)', // Cycle background
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <CoolIcon
                name={tab.icon as any}
                size={18}
                color="#C2185B" // Dark pink icon for visibility on light bg
              />
            </View>
            <Text style={[homeStyles.tabText, { color: '#C2185B' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      )}
    </View>
  );
};
