/**
 * Active Sessions Screen
 * View and manage active login sessions
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    RefreshControl,
} from 'react-native';
import { SettingsSkeleton } from '../../components/common/SkeletonLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { identityApi, UserSession } from '../../services/api/identity';

const getDeviceIcon = (deviceType?: string): string => {
    switch (deviceType?.toLowerCase()) {
        case 'mobile':
        case 'phone':
            return 'cellphone';
        case 'tablet':
            return 'tablet';
        case 'desktop':
            return 'monitor';
        default:
            return 'devices';
    }
};

const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

interface SessionItemProps {
    session: UserSession;
    onRevoke: (id: string) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, onRevoke }) => {
    const location = [session.city, session.country].filter(Boolean).join(', ');
    
    return (
        <View style={[styles.sessionCard, session.isCurrent && styles.currentSession]}>
            <View style={styles.sessionHeader}>
                <View style={[styles.iconContainer, session.isCurrent && styles.iconContainerCurrent]}>
                    <Icon 
                        name={getDeviceIcon(session.deviceType)} 
                        size={24} 
                        color={session.isCurrent ? '#10B981' : '#3B82F6'} 
                    />
                </View>
                <View style={styles.sessionInfo}>
                    <View style={styles.sessionTitleRow}>
                        <Text style={styles.sessionDevice}>
                            {session.deviceName || session.deviceType || 'Unknown Device'}
                        </Text>
                        {session.isCurrent && (
                            <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>Current</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.sessionBrowser}>
                        {[session.browser, session.os].filter(Boolean).join(' • ') || 'Unknown'}
                    </Text>
                </View>
            </View>
            
            <View style={styles.sessionDetails}>
                <View style={styles.detailRow}>
                    <Icon name="map-marker-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                        {location || 'Unknown location'}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="ip-network-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                        {session.ipAddress || 'Unknown IP'}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Icon name="clock-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                        Last active: {formatTimeAgo(session.lastActivityAt || session.createdAt)}
                    </Text>
                </View>
            </View>
            
            {!session.isCurrent && (
                <TouchableOpacity 
                    style={styles.revokeButton}
                    onPress={() => onRevoke(session.id)}
                >
                    <Icon name="logout" size={18} color="#EF4444" />
                    <Text style={styles.revokeText}>End Session</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export const ActiveSessionsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sessions, setSessions] = useState<UserSession[]>([]);

    const loadSessions = useCallback(async () => {
        try {
            const { sessions } = await identityApi.getSessions(false);
            // Sort to put current session first
            setSessions(sessions.sort((a, b) => {
                if (a.isCurrent) return -1;
                if (b.isCurrent) return 1;
                return new Date(b.lastActivityAt || b.createdAt).getTime() - 
                       new Date(a.lastActivityAt || a.createdAt).getTime();
            }));
        } catch (error) {
            console.error('Error loading sessions:', error);
            Alert.alert('Error', 'Failed to load sessions');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSessions();
    };

    const handleRevokeSession = (sessionId: string) => {
        Alert.alert(
            'End Session',
            'This will log out the device. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End Session',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await identityApi.revokeSession(sessionId);
                            loadSessions();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to end session');
                        }
                    }
                }
            ]
        );
    };

    const handleRevokeAll = () => {
        Alert.alert(
            'End All Sessions',
            'This will log you out from all other devices. You will remain logged in on this device.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End All Sessions',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { revokedCount } = await identityApi.revokeAllSessions();
                            Alert.alert('Success', `Ended ${revokedCount} session(s)`);
                            loadSessions();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to end sessions');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return <SettingsSkeleton />;
    }

    const otherSessions = sessions.filter(s => !s.isCurrent);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Active Sessions</Text>
                {otherSessions.length > 0 && (
                    <TouchableOpacity 
                        style={styles.revokeAllButton}
                        onPress={handleRevokeAll}
                    >
                        <Text style={styles.revokeAllText}>End All</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Icon name="information-outline" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        These are all the devices currently logged into your account. 
                        If you see something suspicious, end that session immediately.
                    </Text>
                </View>

                {/* Sessions List */}
                {sessions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="devices" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No active sessions</Text>
                        <Text style={styles.emptySubtitle}>
                            Your active sessions will appear here
                        </Text>
                    </View>
                ) : (
                    sessions.map(session => (
                        <SessionItem
                            key={session.id}
                            session={session}
                            onRevoke={handleRevokeSession}
                        />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    revokeAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
    revokeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
    },
    sessionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    currentSession: {
        borderWidth: 2,
        borderColor: '#10B981',
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerCurrent: {
        backgroundColor: '#D1FAE5',
    },
    sessionInfo: {
        flex: 1,
        marginLeft: 12,
    },
    sessionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionDevice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    currentBadge: {
        marginLeft: 8,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    currentBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    sessionBrowser: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    sessionDetails: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#6B7280',
    },
    revokeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
    revokeText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
});

export default ActiveSessionsScreen;
