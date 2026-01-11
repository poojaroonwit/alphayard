import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const chatStyles = StyleSheet.create({
    chatContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chatCycleCard: {
        // plain touchable like notification icon
        padding: 0,
        borderRadius: 20,
    },
    chatBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0,
    },
    chatBadgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
