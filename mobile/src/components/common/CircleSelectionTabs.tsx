import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import CoolIcon from './CoolIcon';

interface TabItem {
  id: string;
  label: string;
  icon: string;
}

interface CircleSelectionTabsProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
  tabs: TabItem[];
  // Configuration props
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  activeIconColor?: string;
  inactiveIconColor?: string;
  activeShowShadow?: string | boolean;
  inactiveShowShadow?: string | boolean;
  containerStyle?: object;
  fit?: boolean; // New prop to make tabs fit the screen width
  variant?: 'box' | 'underline';
  menuBackgroundColor?: string;
  menuShowShadow?: string | boolean;
  itemSpacing?: number;
  itemBorderRadius?: number;
  activeBorderColor?: string;
  inactiveBorderColor?: string;
  activeBorderWidth?: number;
  inactiveBorderWidth?: number;
  activeOpacity?: number;
  inactiveOpacity?: number;
  pinnedFirstTab?: boolean;
  showPinnedSeparator?: boolean;
  pinnedSeparatorColor?: string;
}

export const CircleSelectionTabs: React.FC<CircleSelectionTabsProps> = ({
  activeTab,
  onTabPress,
  tabs,
  activeColor = '#FA7272',
  inactiveColor = '#F3F4F6',
  activeTextColor = '#FA7272',
  inactiveTextColor = '#6B7280',
  activeIconColor = '#FFFFFF',
  inactiveIconColor = '#6B7280',
  menuBackgroundColor = 'transparent',
  containerStyle = {},
  fit = false,
  menuShowShadow = 'none',
  activeShowShadow = 'none',
  inactiveShowShadow = 'none',
  variant = 'box',
  // New props
  itemSpacing = 8,
  itemBorderRadius = 12,
  activeBorderColor = 'transparent',
  inactiveBorderColor = 'transparent',
  activeBorderWidth = 0,
  inactiveBorderWidth = 0,
  activeOpacity = 1,
  inactiveOpacity = 1,
  pinnedFirstTab = false,
  showPinnedSeparator = false,
  pinnedSeparatorColor = '#E5E7EB',
}) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [tabPositions, setTabPositions] = React.useState<{ [key: string]: number }>({});

  /* Helper to get shadow style */
  const getShadowStyle = (shadow: string | boolean | undefined) => {
    if (shadow === true) return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        zIndex: 10,
    };
    
    switch (shadow) {
        case 'sm':
            return {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                zIndex: 10,
            };
        case 'md':
            return {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                zIndex: 10,
            };
        case 'lg':
            return {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
                zIndex: 10,
            };
        default:
            return {
                shadowColor: 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0,
                shadowRadius: 0,
                elevation: 0,
                zIndex: 0,
            };
    }
  };

  const shadowStyle = getShadowStyle(menuShowShadow);

  React.useEffect(() => {
    if (!fit && activeTab && tabPositions[activeTab] !== undefined && scrollViewRef.current) {
      setTimeout(() => {
        const targetX = Math.max(0, tabPositions[activeTab] - 20);
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
      }, 50);
    }
  }, [activeTab, tabPositions, fit]);

  const renderTabItem = (tab: TabItem) => {
    const isActive = activeTab === tab.id;
    return (
      <TouchableOpacity
        key={tab.id}
        style={[styles.tabWrapper, fit && { flex: 1 }]}
        onPress={() => onTabPress(tab.id)}
        activeOpacity={0.8}
        onLayout={(event) => {
          if (!fit && !pinnedFirstTab) {
            const layout = event.nativeEvent.layout;
            if (tabPositions[tab.id] !== layout.x) {
                setTabPositions(prev => ({ ...prev, [tab.id]: layout.x }));
            }
          }
        }}
      >
        <View style={styles.tabContent}>
          <View style={[
            styles.iconBox,
            { 
                backgroundColor: variant === 'underline' ? 'transparent' : (isActive ? activeColor : inactiveColor),
                borderRadius: itemBorderRadius,
                borderWidth: isActive && variant !== 'underline' ? activeBorderWidth : inactiveBorderWidth,
                borderColor: isActive && variant !== 'underline' ? activeBorderColor : inactiveBorderColor,
                opacity: isActive ? activeOpacity : inactiveOpacity
            },
            // apply item shadows
            isActive && variant !== 'underline' ? getShadowStyle(activeShowShadow) : getShadowStyle(inactiveShowShadow)
          ]}>
            <CoolIcon
              name={tab.icon as any}
              size={variant === 'underline' ? 24 : 22}
              color={isActive ? activeIconColor : inactiveIconColor}
            />
          </View>
          <Text style={[
            styles.tabText,
            { 
                color: isActive ? activeTextColor : inactiveTextColor,
                marginTop: variant === 'underline' ? -4 : 0
            }
          ]}>
            {tab.label}
          </Text>
          {variant === 'underline' && isActive && (
              <View style={[styles.underline, { backgroundColor: activeTextColor }]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => {
    if (fit) {
        return (
            <View style={styles.fitContent}>
              {tabs.map(renderTabItem)}
            </View>
        );
    }

    if (pinnedFirstTab && tabs.length > 0) {
        const firstTab = tabs[0];
        const otherTabs = tabs.slice(1);
        
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ paddingRight: itemSpacing }}>
                     {renderTabItem(firstTab)}
                </View>
                
                {showPinnedSeparator && (
                     <View style={{ 
                        width: 1, 
                        height: 32, 
                        backgroundColor: pinnedSeparatorColor,
                        marginRight: itemSpacing 
                     }} />
                )}

                <ScrollView 
                  ref={scrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.scrollContent, { gap: itemSpacing }]}
                >
                  {otherTabs.map(renderTabItem)}
                </ScrollView>
            </View>
        );
    }

    return (
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { gap: itemSpacing }]}
        >
          {tabs.map(renderTabItem)}
        </ScrollView>
    );
  };

  return (
    <View style={[styles.container, containerStyle, { backgroundColor: menuBackgroundColor }, shadowStyle]}>
      {renderTabs()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
    marginTop: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
    // Removed default zIndex/elevation to be controlled by prop
  },
  scrollContent: {
    paddingHorizontal: 0,
    gap: 24,
  },
  fitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  tabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12, // Reduced radius to match appearance config
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  underline: {
    position: 'absolute',
    bottom: -15,
    height: 3,
    width: 24,
    borderRadius: 2,
  },
});
