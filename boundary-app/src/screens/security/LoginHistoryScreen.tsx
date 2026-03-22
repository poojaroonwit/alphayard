/**
 * Login History Screen
 * View recent login attempts and activity
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SettingsSkeleton } from '../../components/common/SkeletonLoader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { identityApi, LoginHistoryEntry } from '../../services/api/identity';

const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }) + ` at ${timeStr}`;
};

const getDeviceIcon = (deviceType?: string): string => {
    switch (deviceType?.toLowerCase()) {
        case 'mobile':
        case 'phone':
            return 'cellphone';
        case 'tablet':
            return 'tablet';
        default:
            return 'monitor';
    }
};

const getMethodIcon = (method?: string): string => {
    switch (method?.toLowerCase()) {
        case 'password':
            return 'form-textbox-password';
        case 'google':
            return 'google';
        case 'facebook':
            return 'facebook';
        case 'apple':
            return 'apple';
        case 'biometric':
            return 'fingerprint';
        case 'sso':
            return 'account-key';
        default:
            return 'login';
    }
};

interface LoginItemProps {
    entry: LoginHistoryEntry;
}

const LoginItem: React.FC<LoginItemProps> = ({ entry }) => {
    const location = [entry.city, entry.country].filter(Boolean).join(', ');
    
    return (
        <View style={[
            styles.loginCard,
            !entry.success && styles.failedCard,
            entry.isSuspicious && styles.suspiciousCard,
        ]}>
            <View style={styles.loginHeader}>
                <View style={[
                    styles.statusIcon,
                    entry.success ? styles.successIcon : styles.failIcon,
                    entry.isSuspicious && styles.suspiciousIcon,
                ]}>
                    <Icon 
                        name={entry.isSuspicious ? 'alert' : entry.success ? 'check' : 'close'} 
                        size={16} 
                        color="#FFFFFF" 
                    />
                </View>
                <View style={styles.loginInfo}>
                    <View style={styles.loginTitleRow}>
                        <Text style={styles.loginTitle}>
                            {entry.success ? 'Successful login' : 'Failed attempt'}
                        </Text>
                        {entry.isSuspicious && (
                            <View style={styles.suspiciousBadge}>
                                <Icon name="alert-circle" size={12} color="#DC2626" />
                                <Text style={styles.suspiciousText}>Suspicious</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.loginTime}>{formatDateTime(entry.createdAt)}</Text>
                </View>
            </View>

            <View style={styles.loginDetails}>
                <View style={styles.detailRow}>
                    <Icon name={getMethodIcon(entry.method)} size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                        {entry.method?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Password'}
                    </Text>
                </View>
                
                {entry.deviceName || entry.deviceType ? (
                    <View style={styles.detailRow}>
                        <Icon name={getDeviceIcon(entry.deviceType)} size={16} color="#6B7280" />
                        <Text style={styles.detailText}>
                            {entry.deviceName || entry.deviceType || 'Unknown device'}
                        </Text>
                    </View>
                ) : null}
                
                {(entry.browser || entry.os) && (
                    <View style={styles.detailRow}>
                        <Icon name="application" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>
                            {[entry.browser, entry.os].filter(Boolean).join(' on ')}
                        </Text>
                    </View>
                )}
                
                {location && (
                    <View style={styles.detailRow}>
                        <Icon name="map-marker-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{location}</Text>
                    </View>
                )}
                
                {entry.ipAddress && (
                    <View style={styles.detailRow}>
                        <Icon name="ip-network-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{entry.ipAddress}</Text>
                    </View>
                )}
                
                {!entry.success && entry.failureReason && (
                    <View style={styles.failureRow}>
                        <Icon name="information-outline" size={16} color="#DC2626" />
                        <Text style={styles.failureText}>{entry.failureReason}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export const LoginHistoryScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

    const loadHistory = useCallback(async (pageNum = 1, append = false) => {
        try {
            const params: any = { page: pageNum, limit: 20 };
            if (filter === 'success') params.success = true;
            if (filter === 'failed') params.success = false;
            
            const { history: newHistory, totalPages: pages } = await identityApi.getLoginHistory(params);
            
            if (append) {
                setHistory(prev => [...prev, ...newHistory]);
            } else {
                setHistory(newHistory);
            }
            setTotalPages(pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [filter]);

    useEffect(() => {
        setLoading(true);
        loadHistory(1, false);
    }, [filter]);

    const onRefresh = () => {
        setRefreshing(true);
        loadHistory(1, false);
    };

    const onLoadMore = () => {
        if (page < totalPages && !loadingMore) {
            setLoadingMore(true);
            loadHistory(page + 1, true);
        }
    };

    const FilterButton: React.FC<{ type: 'all' | 'success' | 'failed'; label: string }> = ({ type, label }) => (
        <TouchableOpacity 
            style={[styles.filterButton, filter === type && styles.filterButtonActive]}
            onPress={() => setFilter(type)}
        >
            <Text style={[styles.filterText, filter === type && styles.filterTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    const successCount = history.filter(h => h.success).length;
    const failedCount = history.filter(h => !h.success).length;
    const suspiciousCount = history.filter(h => h.isSuspicious).length;

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
                <Text style={styles.headerTitle}>Login History</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Stats */}
            {!loading && history.length > 0 && (
                <View style={styles.statsRow}>
                    <View style={[styles.statItem, styles.successStat]}>
                        <Icon name="check-circle" size={16} color="#10B981" />
                        <Text style={styles.statText}>{successCount} successful</Text>
                    </View>
                    {failedCount > 0 && (
                        <View style={[styles.statItem, styles.failedStat]}>
                            <Icon name="close-circle" size={16} color="#EF4444" />
                            <Text style={styles.statText}>{failedCount} failed</Text>
                        </View>
                    )}
                    {suspiciousCount > 0 && (
                        <View style={[styles.statItem, styles.suspiciousStat]}>
                            <Icon name="alert-circle" size={16} color="#F59E0B" />
                            <Text style={styles.statText}>{suspiciousCount} suspicious</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Filter */}
            <View style={styles.filterRow}>
                <FilterButton type="all" label="All" />
                <FilterButton type="success" label="Successful" />
                <FilterButton type="failed" label="Failed" />
            </View>

            {loading ? (
                <SettingsSkeleton />
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <LoginItem entry={item} />}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMore ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color="#3B82F6" />
                        </View>
                    ) : null}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="history" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>No login history</Text>
                            <Text style={styles.emptySubtitle}>
                                Your login activity will appear here
                            </Text>
                        </View>
                    }
                />
            )}
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
    placeholder: {
        width: 40,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    successStat: {
        backgroundColor: '#D1FAE5',
    },
    failedStat: {
        backgroundColor: '#FEE2E2',
    },
    suspiciousStat: {
        backgroundColor: '#FEF3C7',
    },
    statText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    filterButtonActive: {
        backgroundColor: '#3B82F6',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    loginCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    failedCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    suspiciousCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
        backgroundColor: '#FFFBEB',
    },
    loginHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successIcon: {
        backgroundColor: '#10B981',
    },
    failIcon: {
        backgroundColor: '#EF4444',
    },
    suspiciousIcon: {
        backgroundColor: '#F59E0B',
    },
    loginInfo: {
        flex: 1,
        marginLeft: 12,
    },
    loginTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    suspiciousBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    suspiciousText: {
        marginLeft: 4,
        fontSize: 11,
        fontWeight: '600',
        color: '#DC2626',
    },
    loginTime: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    loginDetails: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#6B7280',
    },
    failureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#FECACA',
    },
    failureText: {
        marginLeft: 8,
        fontSize: 13,
        color: '#DC2626',
    },
    footerLoader: {
        paddingVertical: 20,
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

export default LoginHistoryScreen;
