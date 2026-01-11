import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomizationOptionDrawerProps {
    visible: boolean;
    onClose: () => void;
    onCustomizeBound: () => void;
    onCustomizeYouTab: () => void;
}

export const CustomizationOptionDrawer: React.FC<CustomizationOptionDrawerProps> = ({
    visible,
    onClose,
    onCustomizeBound,
    onCustomizeYouTab,
}) => {
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
                <View style={styles.drawer}>
                    <View style={styles.handle} />
                    <View style={styles.header}>
                        <Text style={styles.title}>Customization Options</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <IconMC name="close" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                onCustomizeBound();
                                onClose();
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                                <IconMC name="robot-happy" size={24} color="#4F46E5" />
                            </View>
                            <Text style={styles.optionText}>Customise Bound Assistant</Text>
                            <IconMC name="chevron-right" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={() => {
                                onCustomizeYouTab();
                                onClose();
                            }}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                                <IconMC name="view-grid-outline" size={24} color="#10B981" />
                            </View>
                            <Text style={styles.optionText}>Customise YouTab Content Section</Text>
                            <IconMC name="chevron-right" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    drawer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    optionsContainer: {
        padding: 16,
        gap: 12,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
});
