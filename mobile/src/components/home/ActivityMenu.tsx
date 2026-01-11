import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

const activities = [
    { id: '1', name: 'Cooking', icon: 'chef-hat', colors: ['#FFB74D', '#FFA726', '#EF6C00'] },
    { id: '2', name: 'Sports', icon: 'dumbbell', colors: ['#E57373', '#EF5350', '#C62828'] },
    { id: '3', name: 'Learning', icon: 'book-open-variant', colors: ['#64B5F6', '#42A5F5', '#1565C0'] },
    { id: '4', name: 'Music', icon: 'music', colors: ['#BA68C8', '#AB47BC', '#6A1B9A'] },
    { id: '5', name: 'Art', icon: 'palette', colors: ['#F06292', '#EC407A', '#AD1457'] },
    { id: '6', name: 'Gaming', icon: 'gamepad-variant', colors: ['#9575CD', '#7E57C2', '#4527A0'] },
    { id: '7', name: 'Gardening', icon: 'flower', colors: ['#81C784', '#66BB6A', '#2E7D32'] },
    { id: '8', name: 'Movie', icon: 'movie-open', colors: ['#FF8A65', '#FF7043', '#D84315'] },
    { id: '9', name: 'Photo', icon: 'camera', colors: ['#90CAF9', '#64B5F6', '#1565C0'] },
    { id: '10', name: 'Hiking', icon: 'hiking', colors: ['#AED581', '#8BC34A', '#33691E'] },
    { id: '11', name: 'Yoga', icon: 'yoga', colors: ['#F8BBD0', '#F48FB1', '#AD1457'] },
    { id: '12', name: 'Coding', icon: 'laptop', colors: ['#78909C', '#546E7A', '#263238'] },
];

export const ActivityMenu: React.FC = () => {
    // Split into 2 rows
    const mid = Math.ceil(activities.length / 2);
    const row1 = activities.slice(0, mid);
    const row2 = activities.slice(mid);

    const renderItem = (activity: any) => (
        <TouchableOpacity key={activity.id} style={styles.itemContainer}>
            {/* White Glass Background as requested */}
            <View style={[
                styles.iconContainer,
                {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000000', // Visible black shadow
                }
            ]}>
                <IconMC name={activity.icon} size={28} color={activity.colors[2]} />
            </View>
            <Text style={styles.label} numberOfLines={1}>{activity.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Activities</Text>
                <TouchableOpacity>
                    <Text style={styles.moreButtonText}>More</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View>
                    <View style={styles.row}>
                        {row1.map(renderItem)}
                    </View>
                    <View style={styles.row}>
                        {row2.map(renderItem)}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    moreButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 12, // Reduced from 24
    },
    row: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    itemContainer: {
        width: 60,
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#FFFFFF', // Solid white
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
        borderWidth: 0,
        shadowColor: '#000000',
    },
    label: {
        fontSize: 11,
        color: '#4B5563',
        fontWeight: '600',
        textAlign: 'center',
    }
});
