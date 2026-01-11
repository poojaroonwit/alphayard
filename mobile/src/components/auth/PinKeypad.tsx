import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const KEYPAD_WIDTH = Math.min(width * 0.85, 320);
const BUTTON_SIZE = KEYPAD_WIDTH / 4;

interface PinKeypadProps {
    pin: string;
    maxLength?: number;
    onPinChange: (pin: string) => void;
    error?: string;
    title?: string;
    subtitle?: string;
    children?: React.ReactNode;
    showBiometric?: boolean;
    onBiometricPress?: () => void;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({
    pin,
    maxLength = 6,
    onPinChange,
    error,
    title = 'Enter PIN',
    subtitle,
    children,
    showBiometric = false,
    onBiometricPress,
}) => {
    const handleKeyPress = (key: string) => {
        if (pin.length < maxLength) {
            onPinChange(pin + key);
        }
    };

    const handleDelete = () => {
        if (pin.length > 0) {
            onPinChange(pin.slice(0, -1));
        }
    };

    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < maxLength; i++) {
            dots.push(
                <View
                    key={i}
                    style={[
                        styles.dot,
                        i < pin.length ? styles.dotFilled : styles.dotEmpty,
                        error ? styles.dotError : null,
                    ]}
                />
            );
        }
        return dots;
    };

    const renderKey = (key: string | 'delete' | 'empty' | 'biometric', index: number) => {
        if (key === 'empty') {
            return <View key={index} style={styles.keyEmpty} />;
        }

        if (key === 'biometric') {
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.key}
                    onPress={onBiometricPress}
                    activeOpacity={0.7}
                >
                    <Icon name="fingerprint" size={32} color="#FA7272" />
                </TouchableOpacity>
            );
        }

        if (key === 'delete') {
            return (
                <TouchableOpacity
                    key={index}
                    style={styles.key}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                >
                    <Icon name="backspace-outline" size={28} color="#333" />
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={index}
                style={styles.key}
                onPress={() => handleKeyPress(key)}
                activeOpacity={0.7}
            >
                <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
        );
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', showBiometric ? 'biometric' : 'empty', '0', 'delete'];

    return (
        <View style={styles.container}>
            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            {/* PIN Dots */}
            <View style={styles.dotsContainer}>{renderDots()}</View>

            {/* Custom Content (e.g., Forgot PIN) */}
            {children}

            {/* Error Message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Keypad */}
            <View style={styles.keypad}>
                {keys.map((key, index) => renderKey(key as any, index))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 16,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
    },
    dotEmpty: {
        borderColor: '#CCC',
        backgroundColor: 'transparent',
    },
    dotFilled: {
        borderColor: '#FA7272',
        backgroundColor: '#FA7272',
    },
    dotError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEE2E2',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    keypad: {
        width: KEYPAD_WIDTH,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 20,
    },
    key: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 4,
        borderRadius: BUTTON_SIZE / 2,
        backgroundColor: '#F5F5F5',
    },
    keyEmpty: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        margin: 4,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: '#333',
    },
});

export default PinKeypad;
