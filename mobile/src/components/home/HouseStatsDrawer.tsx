import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, TouchableWithoutFeedback } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
// import { SafeAreaView } from 'react-native-safe-area-context';

interface hourse {
    id: string;
    name: string;
    members: number;
    avatar?: string;
}

interface HouseStatsDrawerProps {
    visible: boolean;
    onClose: () => void;
    currentFamily: hourse | null;
    onSwitchFamily: () => void;
}

export const HouseStatsDrawer: React.FC<HouseStatsDrawerProps> = ({
    visible,
    onClose,
    currentFamily,
    onSwitchFamily,
}) => {
    const navigation = useNavigation<any>();
    const { height: screenHeight } = Dimensions.get('screen');
    const slideAnim = useRef(new Animated.Value(screenHeight)).current; // Start hidden below

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 0,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: screenHeight,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    return (
        <Modal
            animationType="fade" // Fade the overlay
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <Animated.View style={[styles.drawerContainer, { transform: [{ translateY: slideAnim }] }]}>
                            {/* Removed redundant SafeAreaView that enforced top padding */}
                            <View style={styles.contentContainer}>
                                {/* Header / Family Summary */}
                                <View style={styles.header}>
                                    <View style={styles.familyInfo}>
                                        <Text style={styles.familyName}>{currentFamily?.name || 'My Family'}</Text>
                                        <Text style={styles.memberCount}>{currentFamily?.members || 0} Members</Text>
                                    </View>
                                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                        <IconMC name="chevron-up" size={28} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.divider} />

                                {/* Mood Summary Card */}
                                <TouchableOpacity
                                    style={styles.moodCard}
                                    onPress={() => {
                                        onClose();
                                        navigation.navigate('MoodAnalysis');
                                    }}
                                >
                                    <View style={styles.moodHeader}>
                                        <IconMC name="emoticon-happy-outline" size={24} color="#10B981" />
                                        <Text style={styles.moodTitle}>Today's Mood</Text>
                                    </View>
                                    <Text style={styles.moodSummary}>
                                        The family seems generally <Text style={{ fontWeight: 'bold', color: '#10B981' }}>Happy</Text> today.
                                    </Text>
                                    <View style={styles.viewAnalysisRow}>
                                        <Text style={styles.viewAnalysisText}>View Analysis</Text>
                                        <IconMC name="chevron-right" size={20} color="#3B82F6" />
                                    </View>
                                </TouchableOpacity>

                                {/* Switch Family Button */}
                                <TouchableOpacity
                                    style={styles.switchButton}
                                    onPress={() => {
                                        onClose();
                                        setTimeout(() => onSwitchFamily(), 300);
                                    }}
                                >
                                    <IconMC name="swap-horizontal" size={20} color="white" />
                                    <Text style={styles.switchButtonText}>Switch Family</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'flex-end', // Align to bottom
    },
    drawerContainer: {
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        // Removed bottom radii
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        paddingBottom: 20,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40, // Add bottom padding for safe area
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    familyInfo: {
        flex: 1,
    },
    familyName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    memberCount: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    closeBtn: {
        padding: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginBottom: 15,
    },
    moodCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    moodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    moodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
    moodSummary: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    viewAnalysisRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    viewAnalysisText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
        marginRight: 4,
    },
    switchButton: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 30, // Pill shape
        marginTop: 5,
    },
    switchButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    }
});
