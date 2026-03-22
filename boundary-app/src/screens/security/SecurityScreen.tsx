/**
 * Security Settings Hub Screen
 * Main entry point for all security-related features
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
import { identityApi, SecuritySettings } from '../../services/api/identity';

interface SecurityItemProps {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    badge?: string | number;
    badgeColor?: string;
    isWarning?: boolean;
}

const SecurityItem: React.FC<SecurityItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    badge,
    badgeColor = '#3B82F6',
    isWarning = false,
}) => (
    <TouchableOpacity style={styles.securityItem} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.iconContainer, isWarning && styles.iconContainerWarning]}>
            <Icon name={icon} size={24} color={isWarning ? '#F59E0B' : '#3B82F6'} />
        </View>
        <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{title}</Text>
            <Text style={styles.itemSubtitle}>{subtitle}</Text>
        </View>
        {badge !== undefined && (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text style={styles.badgeText}>{badge}</Text>
            </View>
        )}
        <Icon name="chevron-right" size={24} color="#9CA3AF" />
    </TouchableOpacity>
);

export const SecurityScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [security, setSecurity] = useState<SecuritySettings | null>(null);

    const loadSecuritySettings = useCallback(async () => {
        try {
            const data = await identityApi.getSecuritySettings();
            setSecurity(data);
        } catch (error) {
            console.error('Error loading security settings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadSecuritySettings();
    }, [loadSecuritySettings]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSecuritySettings();
    };

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    if (loading) {
        return <SettingsSkeleton />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Security</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Security Overview Card */}
                <View style={styles.overviewCard}>
                    <View style={styles.overviewHeader}>
                        <Icon 
                            name={security?.mfaEnabled ? 'shield-check' : 'shield-alert'} 
                            size={32} 
                            color={security?.mfaEnabled ? '#10B981' : '#F59E0B'} 
                        />
                        <View style={styles.overviewText}>
                            <Text style={styles.overviewTitle}>
                                {security?.mfaEnabled ? 'Account Protected' : 'Enhance Security'}
                            </Text>
                            <Text style={styles.overviewSubtitle}>
                                {security?.mfaEnabled 
                                    ? 'Two-factor authentication is enabled'
                                    : 'Enable 2FA to protect your account'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.overviewStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{security?.activeSessionsCount || 0}</Text>
                            <Text style={styles.statLabel}>Active Sessions</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{security?.trustedDevicesCount || 0}</Text>
                            <Text style={styles.statLabel}>Trusted Devices</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{security?.mfaMethods?.length || 0}</Text>
                            <Text style={styles.statLabel}>MFA Methods</Text>
                        </View>
                    </View>
                </View>

                {/* Authentication Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Authentication</Text>
                    
                    <SecurityItem
                        icon="lock-outline"
                        title="Change Password"
                        subtitle={`Last changed ${formatTimeAgo(security?.passwordLastChanged)}`}
                        onPress={() => navigation.navigate('ChangePassword')}
                    />
                    
                    <SecurityItem
                        icon="shield-key-outline"
                        title="Two-Factor Authentication"
                        subtitle={security?.mfaEnabled 
                            ? `${security.mfaMethods.length} method(s) enabled` 
                            : 'Not enabled - Recommended'}
                        onPress={() => navigation.navigate('MFASetup')}
                        badge={security?.mfaEnabled ? 'ON' : 'OFF'}
                        badgeColor={security?.mfaEnabled ? '#10B981' : '#EF4444'}
                        isWarning={!security?.mfaEnabled}
                    />

                    <SecurityItem
                        icon="numeric-6-box-outline"
                        title="App Security PIN"
                        subtitle="Secure your app with a 6-digit PIN"
                        onPress={() => navigation.navigate('SetPin')}
                    />
                </View>

                {/* Sessions & Devices Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sessions & Devices</Text>
                    
                    <SecurityItem
                        icon="monitor-cellphone"
                        title="Active Sessions"
                        subtitle="View and manage where you're logged in"
                        onPress={() => navigation.navigate('ActiveSessions')}
                        badge={security?.activeSessionsCount}
                    />
                    
                    <SecurityItem
                        icon="devices"
                        title="Trusted Devices"
                        subtitle="Manage your trusted devices"
                        onPress={() => navigation.navigate('Devices')}
                        badge={security?.trustedDevicesCount}
                    />
                    
                    <SecurityItem
                        icon="history"
                        title="Login History"
                        subtitle={security?.lastLoginAt 
                            ? `Last login: ${formatTimeAgo(security.lastLoginAt)}${security.lastLoginLocation ? ` • ${security.lastLoginLocation}` : ''}`
                            : 'View your recent login activity'}
                        onPress={() => navigation.navigate('LoginHistory')}
                    />
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    
                    <SecurityItem
                        icon="download-outline"
                        title="Export Your Data"
                        subtitle="Download a copy of your data"
                        onPress={() => {
                            Alert.alert(
                                'Export Data',
                                'Would you like to request a copy of your data? You will receive an email with a download link within 48 hours.',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { 
                                        text: 'Request Export',
                                        onPress: async () => {
                                            try {
                                                await identityApi.requestDataExport();
                                                Alert.alert('Success', 'Data export requested. Check your email within 48 hours.');
                                            } catch (error) {
                                                Alert.alert('Error', 'Failed to request data export');
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                    />
                    
                    <SecurityItem
                        icon="delete-outline"
                        title="Delete Account"
                        subtitle="Permanently delete your account and data"
                        onPress={() => navigation.navigate('DeleteAccount')}
                        isWarning
                    />
                </View>
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
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
        fontSize: 14,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    placeholder: {
        width: 40,
    },
    overviewCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    overviewText: {
        marginLeft: 16,
        flex: 1,
    },
    overviewTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    overviewSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    overviewStats: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerWarning: {
        backgroundColor: '#FEF3C7',
    },
    itemContent: {
        flex: 1,
        marginLeft: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    itemSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default SecurityScreen;
