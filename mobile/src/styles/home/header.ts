import { StyleSheet } from 'react-native';

export const headerStyles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 28,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerLeft: {
        flex: 1,
    },
    headerLogo: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    assignedTaskButton: {
        position: 'relative',
        padding: 8,
        borderRadius: 20,
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
        borderRadius: 20,
    },
    phoneButton: {
        padding: 8,
        borderRadius: 20,
    },
    notificationBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationText: {
        color: '#FF5A5A',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
