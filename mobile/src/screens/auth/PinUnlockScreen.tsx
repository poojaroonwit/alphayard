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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PinKeypad } from '../../components/auth/PinKeypad';
import { usePin } from '../../contexts/PinContext';
import { useAuth } from '../../contexts/AuthContext';

const MAX_ATTEMPTS = 5;

import * as LocalAuthentication from 'expo-local-authentication';

export const PinUnlockScreen: React.FC = () => {
    const { verifyPin, resetPin, unlockApp } = usePin();
    const { logout } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

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
            const shouldEnable = (hasHardware && isEnrolled) || (__DEV__ && Platform.OS !== 'ios'); // Force enabled on non-iOS dev for testing UI if needed

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

    const handleForgotPin = async () => {
        Alert.alert(
            'Forgot PIN?',
            'This will log you out and you will need to sign in again with your email and password.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await resetPin();
                        await logout();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#FA7272', '#FFBBB4']}
                style={styles.gradient}
            >
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
                            title="Enter Your PIN"
                            subtitle="Enter your 6-digit PIN to unlock"
                            error={error}
                            showBiometric={isBiometricSupported}
                            onBiometricPress={authenticateBiometric}
                        >
                            <View style={styles.forgotPinWrapper}>
                                <TouchableOpacity onPress={handleForgotPin}>
                                    <Text style={styles.forgotTextInside}>Forgot PIN?</Text>
                                </TouchableOpacity>
                            </View>
                        </PinKeypad>

                        {isVerifying && (
                            <Text style={styles.verifyingText}>Verifying...</Text>
                        )}
                    </View>
                </View>
            </LinearGradient>
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
});

export default PinUnlockScreen;
