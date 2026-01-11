import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles } from '../../styles/homeStyles';

interface FamilyOptionsDrawerProps {
    visible: boolean;
    onClose: () => void;
    onSettingsPress: () => void;
    onSwitchFamilyPress: () => void;
}

export const FamilyOptionsDrawer: React.FC<FamilyOptionsDrawerProps> = ({
    visible,
    onClose,
    onSettingsPress,
    onSwitchFamilyPress,
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={homeStyles.calendarDrawerOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[homeStyles.calendarDrawerContainer, { height: 'auto', paddingBottom: 40 }]}>
                    <View style={homeStyles.familyDropdownHeader}>
                        <Text style={homeStyles.familyDropdownTitle}>Family Options</Text>
                        <TouchableOpacity onPress={onClose}>
                            <IconMC name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ paddingHorizontal: 16 }}>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                onClose();
                                onSettingsPress();
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                                <IconMC name="cog" size={24} color="#4F46E5" />
                            </View>
                            <Text style={styles.optionText}>Family Settings</Text>
                            <IconMC name="chevron-right" size={24} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                onClose();
                                setTimeout(onSwitchFamilyPress, 300); // Small delay for modal transition
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                                <IconMC name="account-switch" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.optionText}>Switch Family</Text>
                            <IconMC name="chevron-right" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
    }
});
