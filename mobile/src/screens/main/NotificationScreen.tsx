import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../../contexts/NotificationContext';
import { UnderlineTabNavigation } from '../../components/common/UnderlineTabNavigation';
import FocusCardContent from '../../components/card/FocusCardContent';
import OtherCardContent from '../../components/card/OtherCardContent';
import { homeStyles } from '../../styles/homeStyles';
import { theme } from '../../styles/theme';

export const NotificationScreen: React.FC = () => {
    const navigation = useNavigation();
    const {
        notifications,
        unreadCount,
        markAllAsRead,
        clearAllNotifications,
        markAsRead,
        fetchNotifications
    } = useNotification();

    const [activeTab, setActiveTab] = React.useState<'notifications' | 'focus' | 'other'>('notifications');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleNotificationPress = (notification: any) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        // Handle navigation based on type if needed
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'message': return 'message-text';
            case 'hourse': return 'account-group'; // 'hourse' means family/house in this app context
            case 'reminder': return 'bell';
            case 'system': return 'cog';
            default: return 'bell';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'message': return '#3B82F6';
            case 'hourse': return '#FFB6C1';
            case 'reminder': return '#F59E0B';
            case 'system': return '#6B7280';
            default: return '#6B7280';
        }
    };

    // Helper to handle mixed timestamp types (Date object or ISO string)
    const safeGetTime = (timestamp: any): number => {
        if (!timestamp) return Date.now();
        if (timestamp instanceof Date) return timestamp.getTime();
        return new Date(timestamp).getTime();
    };

    const formatTimestamp = (timestamp: any) => {
        const time = safeGetTime(timestamp);
        const now = Date.now();
        const diff = now - time;

        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(time).toLocaleDateString();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'notifications':
                return (
                    <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
                        {notifications.length === 0 ? (
                            <View style={styles.emptyState}>
                                <IconMC name="bell-off" size={48} color="#D1D5DB" />
                                <Text style={styles.emptyStateTitle}>No notifications</Text>
                                <Text style={styles.emptyStateSubtitle}>
                                    You're all caught up! New notifications will appear here.
                                </Text>
                            </View>
                        ) : (
                            notifications.map((notification) => (
                                <TouchableOpacity
                                    key={notification.id}
                                    style={[
                                        styles.notificationItem,
                                        !notification.isRead && styles.notificationItemUnread
                                    ]}
                                    onPress={() => handleNotificationPress(notification)}
                                >
                                    <View style={styles.notificationContent}>
                                        <View style={[
                                            styles.notificationIcon,
                                            { backgroundColor: getNotificationColor(notification.type) }
                                        ]}>
                                            <IconMC
                                                name={getNotificationIcon(notification.type)}
                                                size={20}
                                                color="#FFFFFF"
                                            />
                                        </View>
                                        <View style={styles.notificationText}>
                                            <View style={styles.notificationHeader}>
                                                <Text style={[
                                                    styles.notificationTitle,
                                                    !notification.isRead && styles.notificationTitleUnread
                                                ]}>
                                                    {notification.title}
                                                </Text>
                                                {!notification.isRead && <View style={styles.unreadDot} />}
                                            </View>
                                            <Text style={styles.notificationMessage} numberOfLines={2}>
                                                {notification.message}
                                            </Text>
                                            <View style={styles.notificationFooter}>
                                                <Text style={styles.notificationTimestamp}>
                                                    {formatTimestamp(notification.timestamp)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                );
            case 'focus':
                return <FocusCardContent />;
            case 'other':
                return <OtherCardContent />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <IconMC name="arrow-left" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerActions}>
                    {unreadCount > 0 && (
                        <TouchableOpacity onPress={() => markAllAsRead()} style={styles.headerButton}>
                            <IconMC name="check-all" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => clearAllNotifications()} style={styles.headerButton}>
                        <IconMC name="delete-sweep" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={{ paddingTop: 0 }}>
                <UnderlineTabNavigation
                    activeTab={activeTab}
                    onTabPress={(id) => setActiveTab(id as any)}
                    tabs={[
                        { id: 'notifications', label: 'Notifications' },
                        { id: 'focus', label: 'Focus' },
                        { id: 'other', label: 'Other' }
                    ]}
                />
            </View>

            {/* Content */}
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 12,
        fontFamily: theme.typography.fontFamily.bold,
    },
    backButton: {
        marginRight: 16,
    },
    unreadBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: theme.typography.fontFamily.bold,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    notificationsList: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 8,
        fontFamily: theme.typography.fontFamily.bold,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        fontFamily: theme.typography.fontFamily.regular,
    },
    notificationItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    notificationItemUnread: {
        backgroundColor: '#FEF7F7',
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationText: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        flex: 1,
        fontFamily: theme.typography.fontFamily.medium,
    },
    notificationTitleUnread: {
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: theme.typography.fontFamily.bold,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 8,
        fontFamily: theme.typography.fontFamily.regular,
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationTimestamp: {
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: theme.typography.fontFamily.regular,
    },
});

export default NotificationScreen;
