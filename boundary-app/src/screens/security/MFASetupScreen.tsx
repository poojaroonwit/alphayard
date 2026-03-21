/**
 * MFA Setup Screen
 * Setup and manage two-factor authentication
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    RefreshControl,
    Platform,
    Linking,
    Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { identityApi, UserMFA, MFASetupResponse } from '../../services/api/identity';

interface MFAMethodCardProps {
    title: string;
    description: string;
    icon: string;
    enabled: boolean;
    isLoading?: boolean;
    onEnable: () => void;
    onDisable: () => void;
}

const MFAMethodCard: React.FC<MFAMethodCardProps> = ({
    title,
    description,
    icon,
    enabled,
    isLoading,
    onEnable,
    onDisable,
}) => (
    <View style={[styles.methodCard, enabled && styles.methodCardEnabled]}>
        <View style={styles.methodHeader}>
            <View style={[styles.methodIcon, enabled && styles.methodIconEnabled]}>
                <Icon name={icon} size={24} color={enabled ? '#10B981' : '#6B7280'} />
            </View>
            <View style={styles.methodInfo}>
                <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>{title}</Text>
                    {enabled && (
                        <View style={styles.enabledBadge}>
                            <Icon name="check-circle" size={14} color="#10B981" />
                            <Text style={styles.enabledText}>Enabled</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.methodDescription}>{description}</Text>
            </View>
        </View>
        
        <TouchableOpacity
            style={[styles.methodButton, enabled ? styles.disableButton : styles.enableButton]}
            onPress={enabled ? onDisable : onEnable}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={enabled ? '#EF4444' : '#3B82F6'} />
            ) : (
                <>
                    <Icon 
                        name={enabled ? 'shield-off' : 'shield-check'} 
                        size={18} 
                        color={enabled ? '#EF4444' : '#3B82F6'} 
                    />
                    <Text style={[styles.methodButtonText, enabled ? styles.disableText : styles.enableText]}>
                        {enabled ? 'Disable' : 'Enable'}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    </View>
);

export const MFASetupScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [mfaSettings, setMfaSettings] = useState<UserMFA[]>([]);
    const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
    
    // Setup modal state
    const [setupModalVisible, setSetupModalVisible] = useState(false);
    const [setupType, setSetupType] = useState<'totp' | 'sms' | 'email'>('totp');
    const [setupData, setSetupData] = useState<MFASetupResponse | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    
    // Backup codes modal
    const [backupCodesModal, setBackupCodesModal] = useState(false);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    
    // Disable modal
    const [disableModalVisible, setDisableModalVisible] = useState(false);
    const [disableType, setDisableType] = useState<string>('');
    const [disablePassword, setDisablePassword] = useState('');
    const [isDisabling, setIsDisabling] = useState(false);

    const loadMfaSettings = useCallback(async () => {
        try {
            const data = await identityApi.getMFASettings();
            setMfaSettings(data.mfaSettings);
            setBackupCodesRemaining(data.backupCodesRemaining || 0);
        } catch (error) {
            console.error('Error loading MFA settings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadMfaSettings();
    }, [loadMfaSettings]);

    const onRefresh = () => {
        setRefreshing(true);
        loadMfaSettings();
    };

    const isMfaEnabled = (type: string) => {
        return mfaSettings.some(m => m.mfaType === type && m.isEnabled);
    };

    const handleStartSetup = async (type: 'totp' | 'sms' | 'email') => {
        setSetupType(type);
        setVerificationCode('');
        setIsSettingUp(true);
        setSetupModalVisible(true);
        
        try {
            const data = await identityApi.setupMFA(type);
            setSetupData(data);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to start MFA setup');
            setSetupModalVisible(false);
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleVerifySetup = async () => {
        if (!verificationCode || verificationCode.length < 6) {
            Alert.alert('Error', 'Please enter a valid verification code');
            return;
        }
        
        setIsVerifying(true);
        try {
            const result = await identityApi.verifyMFASetup(setupType, verificationCode);
            setSetupModalVisible(false);
            
            if (result.backupCodes && result.backupCodes.length > 0) {
                setBackupCodes(result.backupCodes);
                setBackupCodesModal(true);
            } else {
                Alert.alert('Success', 'Two-factor authentication enabled');
            }
            
            loadMfaSettings();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Invalid verification code');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleStartDisable = (type: string) => {
        setDisableType(type);
        setDisablePassword('');
        setDisableModalVisible(true);
    };

    const handleDisableMFA = async () => {
        if (!disablePassword) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }
        
        setIsDisabling(true);
        try {
            await identityApi.disableMFA(disableType, disablePassword);
            setDisableModalVisible(false);
            Alert.alert('Success', 'Two-factor authentication disabled');
            loadMfaSettings();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to disable MFA');
        } finally {
            setIsDisabling(false);
        }
    };

    const handleRegenerateBackupCodes = () => {
        Alert.prompt(
            'Regenerate Backup Codes',
            'Enter your password to generate new backup codes. This will invalidate all existing codes.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate',
                    onPress: async () => {
                        try {
                            const { backupCodes } = await identityApi.regenerateBackupCodes();
                            setBackupCodes(backupCodes);
                            setBackupCodesModal(true);
                            loadMfaSettings();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to generate backup codes');
                        }
                    }
                }
            ],
            'secure-text'
        );
    };

    const copyToClipboard = (text: string) => {
        Clipboard.setString(text);
        Alert.alert('Copied', 'Backup codes copied to clipboard');
    };

    const openAuthenticatorApp = () => {
        const appStoreUrl = Platform.select({
            ios: 'itms-apps://apps.apple.com/app/google-authenticator/id388497605',
            android: 'market://details?id=com.google.android.apps.authenticator2',
        });
        if (appStoreUrl) {
            Linking.openURL(appStoreUrl).catch(() => {
                Linking.openURL('https://support.google.com/accounts/answer/1066447');
            });
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            </SafeAreaView>
        );
    }

    const anyMfaEnabled = mfaSettings.some(m => m.isEnabled);

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
                <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
                <View style={styles.placeholder} />
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
                    <Icon name="shield-lock" size={24} color="#3B82F6" />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>
                            {anyMfaEnabled ? 'Your account is protected' : 'Protect your account'}
                        </Text>
                        <Text style={styles.infoText}>
                            Two-factor authentication adds an extra layer of security by requiring 
                            a second verification step when signing in.
                        </Text>
                    </View>
                </View>

                {/* MFA Methods */}
                <Text style={styles.sectionTitle}>Authentication Methods</Text>
                
                <MFAMethodCard
                    title="Authenticator App"
                    description="Use an app like Google Authenticator or Authy to generate codes"
                    icon="cellphone-key"
                    enabled={isMfaEnabled('totp')}
                    onEnable={() => handleStartSetup('totp')}
                    onDisable={() => handleStartDisable('totp')}
                />
                
                <MFAMethodCard
                    title="SMS Text Message"
                    description="Receive a verification code via SMS"
                    icon="message-text-lock"
                    enabled={isMfaEnabled('sms')}
                    onEnable={() => handleStartSetup('sms')}
                    onDisable={() => handleStartDisable('sms')}
                />
                
                <MFAMethodCard
                    title="Email"
                    description="Receive a verification code via email"
                    icon="email-lock"
                    enabled={isMfaEnabled('email')}
                    onEnable={() => handleStartSetup('email')}
                    onDisable={() => handleStartDisable('email')}
                />

                {/* Backup Codes Section */}
                {anyMfaEnabled && (
                    <View style={styles.backupSection}>
                        <Text style={styles.sectionTitle}>Backup Codes</Text>
                        <View style={styles.backupCard}>
                            <View style={styles.backupHeader}>
                                <Icon name="key-variant" size={24} color="#6B7280" />
                                <View style={styles.backupInfo}>
                                    <Text style={styles.backupTitle}>Recovery Codes</Text>
                                    <Text style={styles.backupDescription}>
                                        {backupCodesRemaining > 0
                                            ? `${backupCodesRemaining} codes remaining`
                                            : 'No backup codes generated'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.regenerateButton}
                                onPress={handleRegenerateBackupCodes}
                            >
                                <Icon name="refresh" size={18} color="#3B82F6" />
                                <Text style={styles.regenerateText}>Generate New Codes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Setup Modal */}
            <Modal
                visible={setupModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => !isSettingUp && setSetupModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {setupType === 'totp' ? 'Set up Authenticator' : 
                             setupType === 'sms' ? 'Set up SMS' : 'Set up Email'} Authentication
                        </Text>
                        <TouchableOpacity 
                            onPress={() => setSetupModalVisible(false)}
                            disabled={isSettingUp || isVerifying}
                        >
                            <Icon name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {isSettingUp ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3B82F6" />
                                <Text style={styles.loadingText}>Setting up...</Text>
                            </View>
                        ) : setupType === 'totp' && setupData ? (
                            <>
                                <View style={styles.stepCard}>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>1</Text>
                                    </View>
                                    <View style={styles.stepContent}>
                                        <Text style={styles.stepTitle}>Download an authenticator app</Text>
                                        <Text style={styles.stepDescription}>
                                            Install Google Authenticator, Authy, or similar app on your phone.
                                        </Text>
                                        <TouchableOpacity 
                                            style={styles.downloadButton}
                                            onPress={openAuthenticatorApp}
                                        >
                                            <Icon name="download" size={18} color="#3B82F6" />
                                            <Text style={styles.downloadText}>Get Authenticator App</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.stepCard}>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>2</Text>
                                    </View>
                                    <View style={styles.stepContent}>
                                        <Text style={styles.stepTitle}>Scan QR code or enter key</Text>
                                        <Text style={styles.stepDescription}>
                                            Open your authenticator app and scan the QR code or manually enter the key below.
                                        </Text>
                                        {(setupData as any).qrCode && (
                                            <View style={styles.qrContainer}>
                                                {/* QR code would be rendered here */}
                                                <Text style={styles.qrPlaceholder}>QR Code Here</Text>
                                            </View>
                                        )}
                                        {setupData.secret && (
                                            <View style={styles.secretContainer}>
                                                <Text style={styles.secretLabel}>Manual entry key:</Text>
                                                <Text style={styles.secretCode}>{setupData.secret}</Text>
                                                <TouchableOpacity 
                                                    style={styles.copyButton}
                                                    onPress={() => copyToClipboard(setupData.secret!)}
                                                >
                                                    <Icon name="content-copy" size={16} color="#3B82F6" />
                                                    <Text style={styles.copyText}>Copy</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.stepCard}>
                                    <View style={styles.stepNumber}>
                                        <Text style={styles.stepNumberText}>3</Text>
                                    </View>
                                    <View style={styles.stepContent}>
                                        <Text style={styles.stepTitle}>Enter verification code</Text>
                                        <Text style={styles.stepDescription}>
                                            Enter the 6-digit code from your authenticator app.
                                        </Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.stepCard}>
                                <View style={styles.stepContent}>
                                    <Text style={styles.stepTitle}>Enter verification code</Text>
                                    <Text style={styles.stepDescription}>
                                        {setupType === 'sms' 
                                            ? 'We sent a verification code to your phone.'
                                            : 'We sent a verification code to your email.'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.verificationSection}>
                            <TextInput
                                style={styles.codeInput}
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                placeholder="Enter 6-digit code"
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus={!isSettingUp}
                            />
                            <TouchableOpacity
                                style={[styles.verifyButton, (!verificationCode || isVerifying) && styles.verifyButtonDisabled]}
                                onPress={handleVerifySetup}
                                disabled={!verificationCode || isVerifying}
                            >
                                {isVerifying ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.verifyButtonText}>Verify & Enable</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Backup Codes Modal */}
            <Modal
                visible={backupCodesModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setBackupCodesModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Save Your Backup Codes</Text>
                        <TouchableOpacity onPress={() => setBackupCodesModal(false)}>
                            <Icon name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.warningCard}>
                            <Icon name="alert" size={24} color="#F59E0B" />
                            <Text style={styles.warningText}>
                                Save these codes in a secure place. Each code can only be used once. 
                                Without these codes, you may lose access to your account if you lose your phone.
                            </Text>
                        </View>

                        <View style={styles.codesContainer}>
                            {backupCodes.map((code, index) => (
                                <View key={index} style={styles.codeItem}>
                                    <Text style={styles.codeNumber}>{index + 1}.</Text>
                                    <Text style={styles.codeText}>{code}</Text>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.copyAllButton}
                            onPress={() => copyToClipboard(backupCodes.join('\n'))}
                        >
                            <Icon name="content-copy" size={20} color="#3B82F6" />
                            <Text style={styles.copyAllText}>Copy All Codes</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => setBackupCodesModal(false)}
                        >
                            <Text style={styles.doneButtonText}>I've Saved These Codes</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* Disable Modal */}
            <Modal
                visible={disableModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setDisableModalVisible(false)}
            >
                <View style={styles.disableModalOverlay}>
                    <View style={styles.disableModalContent}>
                        <Text style={styles.disableModalTitle}>Disable Two-Factor Authentication</Text>
                        <Text style={styles.disableModalDescription}>
                            Enter your password to disable {disableType} authentication. 
                            This will make your account less secure.
                        </Text>
                        
                        <TextInput
                            style={styles.passwordInput}
                            value={disablePassword}
                            onChangeText={setDisablePassword}
                            placeholder="Enter your password"
                            secureTextEntry
                            autoFocus
                        />
                        
                        <View style={styles.disableModalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setDisableModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmDisableButton, isDisabling && styles.disabledButton]}
                                onPress={handleDisableMFA}
                                disabled={isDisabling}
                            >
                                {isDisabling ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.confirmDisableText}>Disable</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginBottom: 24,
    },
    infoContent: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#1E40AF',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginTop: 8,
    },
    methodCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    methodCardEnabled: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    methodHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodIconEnabled: {
        backgroundColor: '#D1FAE5',
    },
    methodInfo: {
        flex: 1,
        marginLeft: 12,
    },
    methodTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    methodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    enabledBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    enabledText: {
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    methodDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    methodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    enableButton: {
        backgroundColor: '#EFF6FF',
    },
    disableButton: {
        backgroundColor: '#FEE2E2',
    },
    methodButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    enableText: {
        color: '#3B82F6',
    },
    disableText: {
        color: '#EF4444',
    },
    backupSection: {
        marginTop: 16,
    },
    backupCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    backupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backupInfo: {
        flex: 1,
        marginLeft: 12,
    },
    backupTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    backupDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    regenerateText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    stepCard: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    stepContent: {
        flex: 1,
        marginLeft: 12,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    downloadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    downloadText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    qrContainer: {
        alignItems: 'center',
        marginTop: 16,
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    qrPlaceholder: {
        fontSize: 14,
        color: '#6B7280',
    },
    secretContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    secretLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    secretCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    copyText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#3B82F6',
    },
    verificationSection: {
        marginTop: 24,
    },
    codeInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 8,
    },
    verifyButton: {
        marginTop: 16,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    verifyButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Backup codes modal
    warningCard: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    warningText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: '#92400E',
        lineHeight: 20,
    },
    codesContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
    },
    codeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    codeNumber: {
        width: 24,
        fontSize: 14,
        color: '#6B7280',
    },
    codeText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    copyAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    copyAllText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    doneButton: {
        marginTop: 24,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    // Disable modal
    disableModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    disableModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    disableModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    disableModalDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        lineHeight: 20,
    },
    passwordInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    disableModalActions: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    confirmDisableButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#EF4444',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
    },
    confirmDisableText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default MFASetupScreen;
