import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import CoolIcon from './CoolIcon';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

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
  variant?: 'box' | 'underline' | 'badge' | 'segmented';
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
  activeShadowColor?: string;
  pinnedFirstTab?: boolean;
  showPinnedSeparator?: boolean;
  pinnedSeparatorColor?: string;
  showIcons?: boolean; // New prop to control icon visibility
  iconPosition?: 'left' | 'top'; // Position of icon relative to label
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
  activeShadowColor,
  pinnedFirstTab = false,
  showPinnedSeparator = false,
  pinnedSeparatorColor = '#E5E7EB',
  showIcons = false, // Default to false - icons only shown when explicitly enabled
  iconPosition = 'top', // Default to top for backward compatibility
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [tabPositions, setTabPositions] = useState<{ [key: string]: number }>({});

  /* Helper to get shadow style */
  const getShadowStyle = (shadow: string | boolean | undefined, color?: string) => {
    const shadowColor = color || '#000';
    if (shadow === true) return {
        shadowColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        zIndex: 10,
    };
    
    switch (shadow) {
        case 'sm':
            return {
                shadowColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: color ? 0.3 : 0.05,
                shadowRadius: 4,
                elevation: 2,
                zIndex: 10,
            };
        case 'md':
            return {
                shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: color ? 0.35 : 0.1,
                shadowRadius: 8,
                elevation: 4,
                zIndex: 10,
            };
        case 'lg':
            return {
                shadowColor,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: color ? 0.4 : 0.15,
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

  useEffect(() => {
    if (!fit && activeTab && tabPositions[activeTab] !== undefined && scrollViewRef.current) {
      setTimeout(() => {
        const targetX = Math.max(0, tabPositions[activeTab] - 20);
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
      }, 50);
    }
  }, [activeTab, tabPositions, fit]);

  const renderTabItem = (tab: TabItem) => {
    const isActive = activeTab === tab.id;
    
    // Badge variant styling
    if (variant === 'badge') {
      return (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.badgeWrapper,
            fit && { flex: 1 },
            {
              backgroundColor: isActive ? '#1F2937' : '#F3F4F6',
              borderColor: isActive ? '#1F2937' : '#E5E7EB',
            }
          ]}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.8}
        >
          {showIcons && tab.icon && (
            <IconMC 
              name={tab.icon} 
              size={16} 
              color={isActive ? '#FFFFFF' : '#6B7280'} 
              style={{ marginRight: 3 }}
            />
          )}
          <Text style={[
            styles.badgeText,
            { color: isActive ? '#FFFFFF' : '#6B7280' }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Segmented control variant styling (common iOS/Android style)
    if (variant === 'segmented') {
      return (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.segmentedWrapper,
            fit && { flex: 1 },
            isActive && {
              backgroundColor: activeColor || '#FFFFFF',
              ...getShadowStyle(activeShowShadow, activeShadowColor),
            },
          ]}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          {showIcons && tab.icon && (
            <IconMC 
              name={tab.icon} 
              size={16} 
              color={isActive ? activeTextColor : inactiveTextColor} 
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={[
            styles.segmentedText,
            { 
              color: isActive ? activeTextColor : inactiveTextColor,
              fontWeight: isActive ? '600' : '400',
            }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    }
    
    // Default variant styling
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
        <View style={[
          styles.tabContent,
          iconPosition === 'left' && styles.tabContentHorizontal,
          variant === 'underline' && { position: 'relative', paddingBottom: 12 }
        ]}>
          {/* Icon display - only show if showIcons prop is true */}
          {showIcons && tab.icon && iconPosition === 'left' && (
            variant === 'underline' ? (
              <IconMC 
                name={tab.icon} 
                size={18} 
                color={isActive ? activeIconColor : inactiveIconColor}
                style={{ marginRight: 4, position: 'relative', zIndex: 2 }}
              />
            ) : (
              <View style={[
                styles.iconBoxHorizontal,
                {
                  backgroundColor: isActive ? activeColor : inactiveColor,
                },
                isActive && getShadowStyle(activeShowShadow, activeShadowColor),
                !isActive && getShadowStyle(inactiveShowShadow),
              ]}>
                <IconMC 
                  name={tab.icon} 
                  size={18} 
                  color={isActive ? activeIconColor : inactiveIconColor} 
                />
              </View>
            )
          )}
          {showIcons && tab.icon && iconPosition === 'top' && (
            <View style={[
              styles.iconBox,
              isActive && styles.iconBoxActive,
              {
                backgroundColor: isActive ? activeColor : inactiveColor,
              },
              isActive && getShadowStyle(activeShowShadow),
              !isActive && getShadowStyle(inactiveShowShadow),
            ]}>
              <IconMC 
                name={tab.icon} 
                size={20} 
                color={isActive ? activeIconColor : inactiveIconColor} 
              />
            </View>
          )}
          <Text style={[
            styles.tabText,
            { 
                color: isActive ? activeTextColor : inactiveTextColor,
                fontWeight: isActive ? 'bold' : 'normal',
                marginTop: variant === 'underline' ? -4 : (showIcons && tab.icon && iconPosition === 'top' ? 4 : 0),
                  marginLeft: iconPosition === 'left' && showIcons && tab.icon ? 4 : 0,
                position: 'relative',
                zIndex: 2,
            }
          ]}>
            {tab.label}
          </Text>
          {variant === 'underline' && isActive && (
              <View style={[
                styles.underline, 
                { 
                  backgroundColor: activeTextColor,
                  width: iconPosition === 'left' && showIcons && tab.icon ? '100%' : 30,
                  left: iconPosition === 'left' && showIcons && tab.icon ? 0 : '50%',
                  marginLeft: iconPosition === 'left' && showIcons && tab.icon ? 0 : -15,
                }
              ]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabs = () => {
    if (fit) {
        if (variant === 'segmented') {
          return (
            <View style={[styles.segmentedContainer, { backgroundColor: inactiveColor || '#F3F4F6' }]}>
              {tabs.map(renderTabItem)}
            </View>
          );
        }
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
    justifyContent: 'flex-start',
  },
  fitContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  tabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12, // Add padding for underline visibility
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabContentHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12, // Reduced radius to match appearance config
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxHorizontal: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
    fontWeight: 'normal', // Default weight, will be overridden by inline style for active tab
  },
  underline: {
    position: 'absolute',
    bottom: -10,
    height: 3,
    borderRadius: 2,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  segmentedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  segmentedText: {
    fontSize: 14,
    fontWeight: '400',
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
});
