import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import IconIon from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../../styles/typography';
import { ScalePressable } from '../common/ScalePressable';

interface ApplicationListDrawerProps {
    visible: boolean;
    onClose: () => void;
    apps?: any[]; // Allow passing extended list if needed
}

// Extended Mock Data for the full list
const ALL_APPS = [
    { id: '1', label: 'Garden', icon: 'flower', color: '#10B981', iconType: 'mc' },
    { id: '2', label: 'Cooking', icon: 'chef-hat', color: '#F59E0B', iconType: 'mc' },
    { id: '3', label: 'News', icon: 'newspaper', color: '#3B82F6', iconType: 'ion' },
    { id: '4', label: 'Crypto', icon: 'bitcoin', color: '#F59E0B', iconType: 'mc' },
    { id: '5', label: 'Health', icon: 'heart', color: '#EF4444', iconType: 'ion' },
    { id: '6', label: 'Games', icon: 'game-controller', color: '#8B5CF6', iconType: 'ion' },
    { id: '7', label: 'Travel', icon: 'airplane', color: '#06B6D4', iconType: 'ion' },
    { id: '8', label: 'Music', icon: 'musical-notes', color: '#EC4899', iconType: 'ion' },
    { id: '9', label: 'Shopping', icon: 'cart', color: '#F472B6', iconType: 'ion' },
    { id: '10', label: 'Finance', icon: 'cash', color: '#10B981', iconType: 'ion' },
    { id: '11', label: 'Education', icon: 'school', color: '#6366F1', iconType: 'ion' },
    { id: '12', label: 'Fitness', icon: 'barbell', color: '#EC4899', iconType: 'ion' },
];

const { width, height } = Dimensions.get('window');

export const ApplicationListDrawer: React.FC<ApplicationListDrawerProps> = ({
    visible,
    onClose,
    apps = ALL_APPS
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>All Applications</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <IconIon name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.gridContainer}>
                        <View style={styles.grid}>
                            {apps.map((app) => (
                                <ScalePressable key={app.id} style={styles.appItem} onPress={() => console.log('Open', app.label)}>
                                    <View style={[styles.iconContainer, { backgroundColor: `${app.color}10` }]}>
                                        {app.iconType === 'mc' ? (
                                            <IconMC name={app.icon} size={28} color={app.color} />
                                        ) : (
                                            <IconIon name={app.icon} size={28} color={app.color} />
                                        )}
                                    </View>
                                    <Text style={styles.appLabel}>{app.label}</Text>
                                </ScalePressable>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        backgroundColor: 'white',
        height: height * 0.7,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 20,
        fontFamily: typography.heading,
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
    },
    gridContainer: {
        padding: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between', // Basic distribution
    },
    appItem: {
        width: '30%', // Approx 3 cols
        aspectRatio: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    appLabel: {
        fontSize: 12,
        fontFamily: typography.bodyMedium,
        color: '#4B5563',
        textAlign: 'center',
    },
});

