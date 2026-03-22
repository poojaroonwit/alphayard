/**
 * Devices Screen
 * View and manage trusted devices
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
import { identityApi, UserDevice } from '../../services/api/identity';

const getDeviceIcon = (deviceType?: string): string => {
    switch (deviceType?.toLowerCase()) {
        case 'mobile':
        case 'phone':
            return 'cellphone';
        case 'tablet':
            return 'tablet';
        case 'desktop':
            return 'monitor';
        case 'tv':
            return 'television';
        default:
            return 'devices';
    }
};

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

interface DeviceItemProps {
    device: UserDevice;
    onTrust: (id: string) => void;
    onBlock: (id: string) => void;
    onRemove: (id: string) => void;
}

const DeviceItem: React.FC<DeviceItemProps> = ({ device, onTrust, onBlock, onRemove }) => {
    const location = [device.lastLocationCity, device.lastLocationCountry].filter(Boolean).join(', ');
    
    return (
        <View style={[
            styles.deviceCard, 
            device.isCurrent && styles.currentDevice,
            device.isBlocked && styles.blockedDevice
        ]}>
            <View style={styles.deviceHeader}>
                <View style={[
                    styles.iconContainer, 
                    device.isTrusted && styles.iconContainerTrusted,
                    device.isBlocked && styles.iconContainerBlocked
                ]}>
                    <Icon 
                        name={getDeviceIcon(device.deviceType)} 
                        size={28} 
                        color={device.isBlocked ? '#EF4444' : device.isTrusted ? '#10B981' : '#6B7280'} 
                    />
                </View>
                <View style={styles.deviceInfo}>
                    <View style={styles.deviceTitleRow}>
                        <Text style={styles.deviceName}>
                            {device.deviceName || `${device.brand || ''} ${device.model || ''}`.trim() || device.deviceType || 'Unknown Device'}
                        </Text>
                        {device.isCurrent && (
                            <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>This Device</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.deviceOS}>
                        {[device.osName, device.osVersion].filter(Boolean).join(' ') || 'Unknown OS'}
                    </Text>
                    
                    <View style={styles.statusRow}>
                        {device.isTrusted && !device.isBlocked && (
                            <View style={styles.trustedBadge}>
                                <Icon name="shield-check" size={14} color="#059669" />
                                <Text style={styles.trustedText}>Trusted</Text>
                            </View>
                        )}
                        {device.isBlocked && (
                            <View style={styles.blockedBadge}>
                                <Icon name="block-helper" size={14} color="#DC2626" />
                                <Text style={styles.blockedText}>Blocked</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
            
            <View style={styles.deviceDetails}>
                {location && (
                    <View style={styles.detailRow}>
                        <Icon name="map-marker-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{location}</Text>
                    </View>
                )}
                {device.lastIpAddress && (
                    <View style={styles.detailRow}>
                        <Icon name="ip-network-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{device.lastIpAddress}</Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <Icon name="clock-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                        Last seen: {formatDate(device.lastSeenAt)}
                    </Text>
                </View>
                {device.loginCount !== undefined && (
                    <View style={styles.detailRow}>
                        <Icon name="login" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>
                            {device.loginCount} login{device.loginCount !== 1 ? 's' : ''}
                        </Text>
                    </View>
                )}
            </View>
            
            {/* Actions */}
            {!device.isCurrent && (
                <View style={styles.actionRow}>
                    {!device.isBlocked && (
                        <TouchableOpacity 
                            style={[styles.actionButton, device.isTrusted ? styles.untrustButton : styles.trustButton]}
                            onPress={() => device.isTrusted ? onBlock(device.id) : onTrust(device.id)}
                        >
                            <Icon 
                                name={device.isTrusted ? 'shield-off' : 'shield-check'} 
                                size={18} 
                                color={device.isTrusted ? '#F59E0B' : '#10B981'} 
                            />
                            <Text style={[styles.actionText, device.isTrusted ? styles.untrustText : styles.trustText]}>
                                {device.isTrusted ? 'Remove Trust' : 'Trust Device'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {device.isBlocked ? (
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.unblockButton]}
                            onPress={() => onTrust(device.id)}
                        >
                            <Icon name="check-circle" size={18} color="#10B981" />
                            <Text style={[styles.actionText, styles.trustText]}>Unblock</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.blockButton]}
                            onPress={() => onBlock(device.id)}
                        >
                            <Icon name="block-helper" size={18} color="#EF4444" />
                            <Text style={[styles.actionText, styles.blockText]}>Block</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.removeButton]}
                        onPress={() => onRemove(device.id)}
                    >
                        <Icon name="delete-outline" size={18} color="#6B7280" />
                        <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export const DevicesScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [devices, setDevices] = useState<UserDevice[]>([]);

    const loadDevices = useCallback(async () => {
        try {
            const { devices } = await identityApi.getDevices();
            // Sort: current first, then trusted, then by last seen
            setDevices(devices.sort((a, b) => {
                if (a.isCurrent) return -1;
                if (b.isCurrent) return 1;
                if (a.isTrusted && !b.isTrusted) return -1;
                if (b.isTrusted && !a.isTrusted) return 1;
                return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
            }));
        } catch (error) {
            console.error('Error loading devices:', error);
            Alert.alert('Error', 'Failed to load devices');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDevices();
    }, [loadDevices]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDevices();
    };

    const handleTrustDevice = async (deviceId: string) => {
        try {
            await identityApi.trustDevice(deviceId);
            loadDevices();
        } catch (error) {
            Alert.alert('Error', 'Failed to trust device');
        }
    };

    const handleBlockDevice = (deviceId: string) => {
        Alert.alert(
            'Block Device',
            'This device will not be able to log into your account. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await identityApi.blockDevice(deviceId);
                            loadDevices();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to block device');
                        }
                    }
                }
            ]
        );
    };

    const handleRemoveDevice = (deviceId: string) => {
        Alert.alert(
            'Remove Device',
            'Remove this device from your account? It will need to be re-authenticated to access your account.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await identityApi.removeDevice(deviceId);
                            loadDevices();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove device');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return <SettingsSkeleton />;
    }

    const trustedCount = devices.filter(d => d.isTrusted && !d.isBlocked).length;
    const blockedCount = devices.filter(d => d.isBlocked).length;

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
                <Text style={styles.headerTitle}>Your Devices</Text>
                <View style={styles.headerBadges}>
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>{trustedCount} trusted</Text>
                    </View>
                </View>
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
                        Trusted devices can skip two-factor authentication. 
                        Block suspicious devices to prevent unauthorized access.
                    </Text>
                </View>

                {/* Devices List */}
                {devices.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="devices" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No devices found</Text>
                        <Text style={styles.emptySubtitle}>
                            Devices you use to access your account will appear here
                        </Text>
                    </View>
                ) : (
                    devices.map(device => (
                        <DeviceItem
                            key={device.id}
                            device={device}
                            onTrust={handleTrustDevice}
                            onBlock={handleBlockDevice}
                            onRemove={handleRemoveDevice}
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
    headerBadges: {
        flexDirection: 'row',
    },
    headerBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    headerBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
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
    deviceCard: {
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
    currentDevice: {
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    blockedDevice: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerTrusted: {
        backgroundColor: '#D1FAE5',
    },
    iconContainerBlocked: {
        backgroundColor: '#FEE2E2',
    },
    deviceInfo: {
        flex: 1,
        marginLeft: 14,
    },
    deviceTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    deviceName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
    },
    currentBadge: {
        marginLeft: 8,
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    currentBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#1D4ED8',
    },
    deviceOS: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    trustedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    trustedText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    blockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    blockedText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#DC2626',
    },
    deviceDetails: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
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
    actionRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    trustButton: {
        backgroundColor: '#D1FAE5',
        borderColor: '#A7F3D0',
    },
    untrustButton: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDE68A',
    },
    blockButton: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FECACA',
    },
    unblockButton: {
        backgroundColor: '#D1FAE5',
        borderColor: '#A7F3D0',
    },
    removeButton: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    actionText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
    },
    trustText: {
        color: '#059669',
    },
    untrustText: {
        color: '#D97706',
    },
    blockText: {
        color: '#DC2626',
    },
    removeText: {
        color: '#6B7280',
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
        textAlign: 'center',
    },
});

export default DevicesScreen;
