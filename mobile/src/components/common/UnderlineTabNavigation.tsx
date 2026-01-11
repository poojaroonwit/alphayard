import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../styles/theme';

import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

interface TabItem {
    id: string;
    label: string;
    icon?: string;
}

interface UnderlineTabNavigationProps {
    activeTab: string;
    onTabPress: (tabId: string) => void;
    tabs: TabItem[];
}

export const UnderlineTabNavigation: React.FC<UnderlineTabNavigationProps> = ({
    activeTab,
    onTabPress,
    tabs,
}) => {
    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={[styles.tab, isActive && styles.activeTab]}
                        onPress={() => onTabPress(tab.id)}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            {tab.icon && (
                                <IconMC
                                    name={tab.icon}
                                    size={18}
                                    color={isActive ? '#1F2937' : '#6B7280'}
                                />
                            )}
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                {tab.label}
                            </Text>
                        </View>
                        {isActive && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 0,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        position: 'relative',
    },
    activeTab: {
        // No specific style needed for container, handled by indicator
    },
    tabText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        fontFamily: theme.typography.fontFamily.medium,
    },
    activeTabText: {
        color: '#1F2937', // Darker active color
        fontWeight: '600',
        fontFamily: theme.typography.fontFamily.bold,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -1, // Overlap the container border
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#3B82F6', // Blue accent for notifications? Or Pink? Let's stick to theme.pink.dark or blue since notifications implies info.
        // Let's use theme.colors.text.primary (dark grey) or theme.colors.pink.primary?
        // User likes premium. Let's use a nice accent color.
        // Notification screen used blue icons for messages.
        // Let's use a standard dark indicator or theme pink.
        // Given the rest of the app is pink-heavy, let's use the Pink Dark #FF69B4 or just Black.
        // Let's go with theme.colors.pink.dark based on other tabs.
        backgroundColor: theme.colors.pink.dark,
        marginHorizontal: 16, // Indent indicator slightly
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
});
