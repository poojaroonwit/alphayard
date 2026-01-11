import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

const FocusCardContent: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Focus Mode</Text>
            <Text style={styles.subtitle}>Stay productive and minimize distractions.</Text>
            {/* Placeholder for future focus features */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    title: {
        fontSize: 24,
        fontFamily: theme.typography.fontFamily.bold,
        color: theme.colors.text.primary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamily.regular,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
});

export default FocusCardContent;
