import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../../styles/typography';

interface HealthSummaryProps {
    onGoToHealth?: () => void;
}

export const HealthSummary: React.FC<HealthSummaryProps> = ({ onGoToHealth }) => {

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconMC name="heart-pulse" size={24} color="#EC4899" />
                    <Text style={styles.title}>Health</Text>
                </View>
                <TouchableOpacity onPress={onGoToHealth}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {/* Metrics Grid Style - 2x2 Layout */}
            <View style={styles.gridContainer}>

                {/* 1. Steps (Orange/Red) */}
                <LinearGradient
                    colors={['#F97316', '#EA580C']}
                    style={styles.gridItem}
                >
                    <View style={styles.iconCircle}>
                        <IconMC name="shoe-print" size={16} color="#EA580C" />
                    </View>
                    <View>
                        <Text style={styles.gridValue}>8,432</Text>
                        <Text style={styles.gridLabel}>Steps</Text>
                    </View>
                </LinearGradient>

                {/* 2. Heart Rate (Pink/Rose) */}
                <LinearGradient
                    colors={['#EC4899', '#DB2777']}
                    style={styles.gridItem}
                >
                    <View style={styles.iconCircle}>
                        <IconMC name="heart" size={16} color="#DB2777" />
                    </View>
                    <View>
                        <Text style={styles.gridValue}>72</Text>
                        <Text style={styles.gridLabel}>BPM</Text>
                    </View>
                </LinearGradient>

                {/* 3. Sleep (Indigo/Blue) */}
                <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    style={styles.gridItem}
                >
                    <View style={styles.iconCircle}>
                        <IconMC name="bed" size={16} color="#4F46E5" />
                    </View>
                    <View>
                        <Text style={styles.gridValue}>7h 20m</Text>
                        <Text style={styles.gridLabel}>Sleep</Text>
                    </View>
                </LinearGradient>

                {/* 4. Activity (Teal/Emerald) */}
                <LinearGradient
                    colors={['#14B8A6', '#0D9488']}
                    style={styles.gridItem}
                >
                    <View style={styles.iconCircle}>
                        <IconMC name="fire" size={16} color="#0D9488" />
                    </View>
                    <View>
                        <Text style={styles.gridValue}>480</Text>
                        <Text style={styles.gridLabel}>Kcal</Text>
                    </View>
                </LinearGradient>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontFamily: typography.heading,
        color: '#1F2937',
    },
    seeAll: {
        fontSize: 14,
        color: '#EC4899',
        fontWeight: '600',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridItem: {
        flex: 1, // Grow to fill half width
        minWidth: '45%', // Ensure 2 items per row
        borderRadius: 20,
        padding: 16,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: typography.heading,
    },
    gridLabel: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '500',
    }
});
