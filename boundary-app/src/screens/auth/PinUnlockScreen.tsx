import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    Vibration,
    Platform,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PinKeypad } from '../../components/auth/PinKeypad';
import { useTheme } from '../../contexts/ThemeContext';
import { ImageBackground } from 'react-native';
import { usePin } from '../../contexts/PinContext';
import { useAuth } from '../../contexts/AuthContext';
import { isDev } from '../../utils/isDev';

const MAX_ATTEMPTS = 5;

import * as LocalAuthentication from 'expo-local-authentication';

export const PinUnlockScreen: React.FC = () => {
    const { verifyPin, setupPin, unlockApp } = usePin();
    const { user, login } = useAuth();
    const { theme } = useTheme();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetStep, setResetStep] = useState<'NONE' | 'VERIFY_PASSWORD' | 'VERIFY_OTP' | 'SET_NEW' | 'CONFIRM_NEW'>('NONE');
    const [password, setPassword] = useState('');
    const [tempPin, setTempPin] = useState('');
    const [isPasswordVerifying, setIsPasswordVerifying] = useState(false);
    const [isOtpRequesting, setIsOtpRequesting] = useState(false);

    // Check for biometric support on mount
    React.useEffect(() => {
        checkBiometricSupport();
    }, []);

    const checkBiometricSupport = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            console.log('[Biometric] hasHardware:', hasHardware, 'isEnrolled:', isEnrolled);

            // DEV OVERRIDE: Allow forcing visual test in dev if hardware check fails
            // This is useful for simulators or web where hardware might report false
            const shouldEnable = (hasHardware && isEnrolled) || (isDev && Platform.OS !== 'ios'); // Force enabled on non-iOS dev for testing UI if needed

            if (shouldEnable) {
                setIsBiometricSupported(true);
                // Only auto-authenticate if genuinely supported to avoid errors
                if (hasHardware && isEnrolled) {
                    authenticateBiometric();
                }
            }
        } catch (error) {
            console.log('Biometric check failed:', error);
        }
    };

    const authenticateBiometric = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to unlock',
                fallbackLabel: 'Use PIN',
                disableDeviceFallback: false,
                cancelLabel: 'Cancel',
            });

            if (result.success) {
                unlockApp();
            }
        } catch (error) {
            console.log('Biometric auth failed:', error);
        }
    };

    const handlePinChange = async (newPin: string) => {
        setError('');
        setPin(newPin);

        // Auto-verify when 6 digits entered
        if (newPin.length === 6) {
            await handleVerifyPin(newPin);
        }
    };

    const handleVerifyPin = async (enteredPin: string) => {
        if (resetStep === 'VERIFY_OTP') {
            await handleVerifyOtp(enteredPin);
            return;
        }

        if (resetStep === 'SET_NEW') {
            setTempPin(enteredPin);
            setPin('');
            setResetStep('CONFIRM_NEW');
            return;
        }

        if (resetStep === 'CONFIRM_NEW') {
            if (enteredPin === tempPin) {
                setIsVerifying(true);
                const success = await setupPin(enteredPin);
                setIsVerifying(false);
                if (success) {
                    unlockApp();
                } else {
                    setError('Failed to update PIN. Please try again.');
                    setPin('');
                    setResetStep('SET_NEW');
                }
            } else {
                setError('PINs do not match. Try again.');
                setPin('');
                setResetStep('SET_NEW');
                if (Platform.OS !== 'web') Vibration.vibrate(200);
            }
            return;
        }

        setIsVerifying(true);
        const isValid = await verifyPin(enteredPin);
        setIsVerifying(false);

        if (isValid) {
            unlockApp();
            // Navigation will happen automatically via RootNavigator
        } else {
            // Vibrate on error
            if (Platform.OS !== 'web') {
                Vibration.vibrate(200);
            }

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                Alert.alert(
                    'Too Many Attempts',
                    'You have exceeded the maximum number of PIN attempts. Please log in again.',
                    [
                        {
                            text: 'Log Out',
                            onPress: handleForgotPin,
                            style: 'destructive',
                        },
                    ],
                    { cancelable: false }
                );
            } else {
                setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
                setPin('');
            }
        }
    };

    const handleForgotPin = () => {
        setResetStep('VERIFY_PASSWORD');
        setShowForgotModal(true);
    };

    const confirmPasswordVerify = async () => {
        if (!password || !user?.email) return;

        try {
            setIsPasswordVerifying(true);
            setError('');
            
            // Challenge identity with password
            await login(user.email, password);
            
            setIsPasswordVerifying(false);
            setShowForgotModal(false);
            setPassword('');
            setResetStep('SET_NEW');
            setPin('');
            setError('');
            setAttempts(0);
        } catch (err: any) {
            setIsPasswordVerifying(false);
            setError('Incorrect account password.');
        }
    };

    const handleRequestOtp = async () => {
        if (!user?.email) return;
        
        try {
            setIsOtpRequesting(true);
            setError('');
            const { requestOtp } = useAuth(); // Refresh ref just in case
            await requestOtp(user.email);
            
            setIsOtpRequesting(false);
            setShowForgotModal(false);
            setResetStep('VERIFY_OTP');
            setPin('');
        } catch (err: any) {
            setIsOtpRequesting(false);
            setError('Failed to send verification code.');
        }
    };

    const handleVerifyOtp = async (code: string) => {
        if (!user?.email) return;
        
        try {
            setIsVerifying(true);
            const { loginWithOtp } = useAuth();
            await loginWithOtp(user.email, code);
            
            setIsVerifying(false);
            setResetStep('SET_NEW');
            setPin('');
            setError('');
            setAttempts(0);
        } catch (err: any) {
            setIsVerifying(false);
            setError('Invalid verification code.');
            setPin('');
            if (Platform.OS !== 'web') Vibration.vibrate(200);
        }
    };

    const cancelReset = () => {
        setResetStep('NONE');
        setPin('');
        setError('');
        setTempPin('');
        setAttempts(0);
    };

    const renderContent = () => (
        <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Icon name="lock" size={48} color="#FFF" />
                </View>
                <Text style={styles.welcomeText}>Welcome Back!</Text>
            </View>

            {/* PIN Card */}
            <View style={styles.card}>
                <PinKeypad
                    pin={pin}
                    onPinChange={handlePinChange}
                    title={
                        resetStep === 'VERIFY_OTP' ? "Verification Code" :
                        resetStep === 'SET_NEW' ? "Set New PIN" :
                        resetStep === 'CONFIRM_NEW' ? "Confirm New PIN" :
                        "Enter Your PIN"
                    }
                    subtitle={
                        isVerifying ? "Verifying..." : 
                        resetStep === 'VERIFY_OTP' ? `Enter the 6-digit code sent to ${user?.email}` :
                        resetStep === 'SET_NEW' ? "Create a new 6-digit security PIN" :
                        resetStep === 'CONFIRM_NEW' ? "Enter the new PIN again to confirm" :
                        error ? error : 
                        "Please enter your PIN to continue"
                    }
                    error={error ? error : undefined}
                    showBiometric={isBiometricSupported && resetStep === 'NONE'}
                    onBiometricPress={authenticateBiometric}
                    showValues={resetStep === 'VERIFY_OTP'}
                >
                    {resetStep === 'NONE' ? (
                        <TouchableOpacity 
                            style={styles.forgotButton}
                            onPress={handleForgotPin}
                        >
                            <Text style={styles.forgotButtonText}>Forgot PIN?</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={styles.forgotButton}
                            onPress={cancelReset}
                        >
                            <Text style={styles.forgotButtonText}>Cancel Reset</Text>
                        </TouchableOpacity>
                    )}
                </PinKeypad>

                {isVerifying && (
                    <Text style={styles.submittingText}>Verifying...</Text>
                )}
            </View>
        </View>
    );

    const renderForgotModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showForgotModal && resetStep === 'VERIFY_PASSWORD'}
            onRequestClose={() => {
                setShowForgotModal(false);
                setResetStep('NONE');
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalIconContainer}>
                         <Icon name="shield-lock" size={32} color="#FA7272" />
                    </View>
                    <Text style={styles.modalTitle}>Verify Identity</Text>
                    <Text style={styles.modalText}>
                        Please enter your account password to reset your security PIN.
                    </Text>

                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        placeholderTextColor="#9CA3AF"
                    />

                    {error && resetStep === 'VERIFY_PASSWORD' ? (
                        <Text style={styles.errorLabel}>{error}</Text>
                    ) : null}

                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.modalButtonCancel]} 
                            onPress={() => {
                                setShowForgotModal(false);
                                setResetStep('NONE');
                                setPassword('');
                            }}
                        >
                            <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.modalButtonConfirm]} 
                            onPress={confirmPasswordVerify}
                            disabled={isPasswordVerifying || !password}
                        >
                            {isPasswordVerifying ? (
                                <ActivityIndicator color="#FFF" size="small" />
                            ) : (
                                <Text style={styles.modalButtonTextConfirm}>Verify & Reset</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity 
                        style={styles.otpLink}
                        onPress={handleRequestOtp}
                        disabled={isOtpRequesting}
                    >
                        {isOtpRequesting ? (
                            <ActivityIndicator color="#FA7272" size="small" />
                        ) : (
                            <Text style={styles.otpLinkText}>Email me a verification code instead</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Helper to get background from screens array or legacy fields
    const getBackgroundConfig = () => {
        // First check screens array (new dynamic approach)
        if (theme.branding?.screens && Array.isArray(theme.branding.screens)) {
            const pinScreen = theme.branding.screens.find((s: any) => s.id === 'pin' || s.id === 'pin-unlock');
            if (pinScreen?.background) {
                const bg = pinScreen.background;
                if (typeof bg === 'object' && bg.image) {
                    return { imageUrl: bg.image, resizeMode: pinScreen.resizeMode || 'cover' };
                } else if (typeof bg === 'string' && bg) {
                    return { imageUrl: bg, resizeMode: pinScreen.resizeMode || 'cover' };
                }
            }
            // Also check 'login' screen as fallback for PIN pages
            const loginScreen = theme.branding.screens.find((s: any) => s.id === 'login');
            if (loginScreen?.background) {
                const bg = loginScreen.background;
                if (typeof bg === 'object' && bg.image) {
                    return { imageUrl: bg.image, resizeMode: loginScreen.resizeMode || 'cover' };
                } else if (typeof bg === 'string' && bg) {
                    return { imageUrl: bg, resizeMode: loginScreen.resizeMode || 'cover' };
                }
            }
        }
        // Fall back to legacy pinBackgroundImage
        if (theme.branding?.pinBackgroundImage) {
            return { imageUrl: theme.branding.pinBackgroundImage, resizeMode: theme.branding.pinBackgroundResizeMode || 'cover' };
        }
        return null;
    };

    const bgConfig = getBackgroundConfig();

    return (
        <SafeAreaView style={styles.container}>
            {(() => {
                if (bgConfig?.imageUrl) {
                    console.log('[PinUnlockScreen] Using Background:', bgConfig.imageUrl);
                    return (
                        <ImageBackground
                            source={{ uri: bgConfig.imageUrl }}
                            style={styles.container}
                            resizeMode={bgConfig.resizeMode}
                            onError={(e) => console.log('[PinUnlockScreen] Image Load Error:', e.nativeEvent.error)}
                        >
                            <View style={styles.gradient}>
                                {renderContent()}
                            </View>
                        </ImageBackground>
                    );
                }

                console.log('[PinUnlockScreen] Falling back to LinearGradient');
                return (
                    <LinearGradient
                        colors={['#FA7272', '#FFBBB4']}
                        style={styles.gradient}
                    >
                        {renderContent()}
                    </LinearGradient>
                );
            })()}
            {renderForgotModal()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 0, // Full width
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFF',
    },
    card: {
        flex: 1,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingVertical: 32,
        paddingHorizontal: 16,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    forgotPinWrapper: {
        alignItems: 'center',
        marginBottom: 20,
    },
    forgotButton: {
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    forgotButtonText: {
        color: '#FA7272',
        fontSize: 15,
        fontWeight: '600',
    },
    submittingText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 12,
        fontSize: 14,
    },
    forgotTextInside: {
        color: '#FA7272',
        fontSize: 16,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    verifyingText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(250, 114, 114, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#F3F4F6',
    },
    modalButtonConfirm: {
        backgroundColor: '#FA7272',
    },
    modalButtonTextCancel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    modalButtonTextConfirm: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    passwordInput: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        marginBottom: 16,
    },
    errorLabel: {
        color: '#EF4444',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        paddingHorizontal: 12,
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    otpLink: {
        paddingVertical: 4,
    },
    otpLinkText: {
        color: '#FA7272',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default PinUnlockScreen;
