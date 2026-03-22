import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import CoolIcon from '../common/CoolIcon';

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
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [tabPositions, setTabPositions] = React.useState<{ [key: string]: number }>({});

  React.useEffect(() => {
    if (activeTab && tabPositions[activeTab] !== undefined && scrollViewRef.current) {
      setTimeout(() => {
        const targetX = Math.max(0, tabPositions[activeTab] - 20);
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
      }, 50);
    }
  }, [activeTab, tabPositions]);

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabWrapper}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.8}
              onLayout={(event) => {
                const layout = event.nativeEvent.layout;
                if (tabPositions[tab.id] !== layout.x) {
                    setTabPositions(prev => ({ ...prev, [tab.id]: layout.x }));
                }
              }}
            >
              <View style={styles.tabContent}>
                <View style={[
                  styles.iconBox,
                  isActive ? styles.iconBoxActive : styles.iconBoxInactive
                ]}>
                  <CoolIcon
                    name={tab.icon as any}
                    size={22} // Increased from 16
                    color={isActive ? '#FFFFFF' : '#6B7280'}
                  />
                </View>
                <Text style={[
                  styles.tabText,
                  isActive ? styles.tabTextActive : styles.tabTextInactive
                ]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0, // Removed padding
    marginTop: 0, // Ensure no top margin
    marginBottom: 0, // Reduced from 4
    // Removed border and background for seamless header look
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 0, // Rely on WelcomeSection (32px) for equal left/right space
    gap: 24, // Increased margin between each menu item
  },
  tabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4, // Reduced from 6
  },
  iconBox: {
    width: 44, // Increased from 32
    height: 44, // Increased from 32
    borderRadius: 0, // Removed rounding
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: '#FA7272',
    shadowColor: '#FA7272',
    shadowOffset: { width: 0, height: 2 }, // Reduced shadow
    shadowOpacity: 0.2, // Reduced opacity
    shadowRadius: 4, // Reduced radius
    elevation: 2,
  },
  iconBoxInactive: {
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 12, // Increased from 9
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FA7272',
  },
  tabTextInactive: {
    color: '#6B7280',
  },
});
