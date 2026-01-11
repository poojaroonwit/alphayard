import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { miniAppsStyles as styles } from '../../styles/home/miniApps';
import IconIon from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { ScalePressable } from '../common/ScalePressable';

interface MiniApp {
    id: string;
    label: string;
    icon: string;
    color: string;
    iconType: 'ion' | 'mc';
}

const MINI_APPS: MiniApp[] = [
    { id: '1', label: 'Garden', icon: 'flower', color: '#10B981', iconType: 'mc' },
    { id: '2', label: 'Cooking', icon: 'chef-hat', color: '#F59E0B', iconType: 'mc' },
    { id: '3', label: 'News', icon: 'newspaper', color: '#3B82F6', iconType: 'ion' },
    { id: '4', label: 'Crypto', icon: 'bitcoin', color: '#F59E0B', iconType: 'mc' },
    { id: '5', label: 'Health', icon: 'heart', color: '#EF4444', iconType: 'ion' },
    { id: '6', label: 'Games', icon: 'game-controller', color: '#8B5CF6', iconType: 'ion' },
    { id: '7', label: 'Travel', icon: 'airplane', color: '#06B6D4', iconType: 'ion' },
    { id: '8', label: 'Music', icon: 'musical-notes', color: '#EC4899', iconType: 'ion' },
    { id: '9', label: 'Finance', icon: 'cash', color: '#10B981', iconType: 'ion' }, // Extra for scrolling
    { id: '10', label: 'Shop', icon: 'cart', color: '#F472B6', iconType: 'ion' }, // Extra for scrolling
];

interface MiniAppsGridProps {
    onSeeAllPress?: () => void;
    hideTitle?: boolean;
}

export const MiniAppsGrid: React.FC<MiniAppsGridProps> = ({ onSeeAllPress, hideTitle }) => {
    // Prepare display apps: Take first 7 items
    const displayApps = MINI_APPS.slice(0, 7);

    // Add "See More" as the 8th item if we have more apps or just to ensure layout
    const seeMoreItem: MiniApp = {
        id: 'see-more',
        label: 'See More',
        icon: 'apps', // Ionicons 'apps' or similar
        color: '#6B7280',
        iconType: 'ion'
    };

    const finalApps = [...displayApps, seeMoreItem];

    // Chunk into pairs for 2-row layout (4 columns)
    const chunkedApps = [];
    for (let i = 0; i < finalApps.length; i += 2) {
        chunkedApps.push(finalApps.slice(i, i + 2));
    }

    return (
        <View style={styles.container}>
            <View style={[styles.sectionHeader, hideTitle && { justifyContent: 'flex-end', paddingTop: 0, marginTop: -8 }]}>
                {!hideTitle && <Text style={styles.sectionTitle}>Activities</Text>}
                {/* Header See All button removed as requested */}
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {chunkedApps.map((pair, index) => (
                    <View key={index} style={styles.column}>
                        {pair.map((app) => {
                            const isSeeMore = app.id === 'see-more';
                            return (
                                <ScalePressable
                                    key={app.id}
                                    style={styles.appItem}
                                    onPress={isSeeMore ? onSeeAllPress : () => console.log('Open', app.label)}
                                >
                                    <View style={[styles.iconContainer, isSeeMore && { backgroundColor: '#F3F4F6' }]}>
                                        {app.iconType === 'mc' ? (
                                            <IconMC
                                                name={app.icon}
                                                size={24}
                                                color={isSeeMore ? '#6B7280' : app.color}
                                            />
                                        ) : (
                                            <IconIon
                                                name={app.icon}
                                                size={24}
                                                color={isSeeMore ? '#6B7280' : app.color}
                                            />
                                        )}
                                    </View>
                                    <Text style={[styles.appLabel, isSeeMore && { color: '#6B7280' }]}>{app.label}</Text>
                                </ScalePressable>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};
