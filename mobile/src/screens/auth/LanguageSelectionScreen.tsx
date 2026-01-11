import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../contexts/LanguageContext';
import CoolIcon from '../../components/common/CoolIcon';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');

const LanguageSelectionScreen: React.FC = () => {
    const { setLanguage } = useLanguage();

    const handleLanguageSelect = (lang: 'en' | 'th') => {
        setLanguage(lang);
    };

    return (
        <LinearGradient
            colors={['#FA7272', '#FFBBB4', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <CoolIcon name="earth" size={64} color="#FA7272" />
                    </View>
                    <Text style={styles.title}>Welcome / ยินดีต้อนรับ</Text>
                    <Text style={styles.subtitle}>Please select your language / กรุณาเลือกภาษา</Text>
                </View>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.languageButton}
                        onPress={() => handleLanguageSelect('en')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.flagPlaceholder}>
                            <Text style={styles.flagText}>🇺🇸</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.languageTitle}>English</Text>
                            <Text style={styles.languageSubtitle}>English</Text>
                        </View>
                        <CoolIcon name="chevron-right" size={24} color="#C4C4C4" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.languageButton}
                        onPress={() => handleLanguageSelect('th')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.flagPlaceholder}>
                            <Text style={styles.flagText}>🇹🇭</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.languageTitle}>Thai</Text>
                            <Text style={styles.languageSubtitle}>ภาษาไทย</Text>
                        </View>
                        <CoolIcon name="chevron-right" size={24} color="#C4C4C4" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Boundary App v1.0.0</Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginTop: 60,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.regular,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    optionsContainer: {
        gap: 16,
        marginBottom: 40,
    },
    languageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    flagPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    flagText: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    languageTitle: {
        fontSize: 18,
        fontFamily: theme.typography.fontFamily.bold,
        color: '#1F2937',
    },
    languageSubtitle: {
        fontSize: 14,
        fontFamily: theme.typography.fontFamily.regular,
        color: '#6B7280',
        marginTop: 2,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    footerText: {
        color: 'rgba(255,255,255, 0.7)',
        fontSize: 12,
        fontFamily: theme.typography.fontFamily.regular,
    },
});

export default LanguageSelectionScreen;
