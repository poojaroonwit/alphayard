import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { financeService } from '../../services/financeService';

interface AddAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ visible, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState('bank'); // bank, cash, wallet, investment
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name || !balance) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            await financeService.createAccount({
                name,
                balance: parseFloat(balance),
                type,
                currency: 'THB'
            });
            onSuccess();
            onClose();
            // Reset form
            setName('');
            setBalance('');
            setType('bank');
        } catch (error) {
            console.error('Error creating account:', error);
            Alert.alert('Error', 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const accountTypes = [
        { id: 'bank', label: 'Bank Account', icon: 'bank' },
        { id: 'wallet', label: 'Cash/Wallet', icon: 'wallet' },
        { id: 'investment', label: 'Investment', icon: 'chart-line' },
        { id: 'credit_card', label: 'Credit Card', icon: 'credit-card' },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Account</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.label}>Account Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. KBank Savings"
                            testID="account-name-input"
                        />

                        <Text style={styles.label}>Current Balance</Text>
                        <TextInput
                            style={styles.input}
                            value={balance}
                            onChangeText={setBalance}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            testID="account-balance-input"
                        />

                        <Text style={styles.label}>Account Type</Text>
                        <View style={styles.typeContainer}>
                            {accountTypes.map((t) => (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.typeButton, type === t.id && styles.typeButtonActive]}
                                    onPress={() => setType(t.id)}
                                >
                                    <MaterialCommunityIcons
                                        name={t.icon as any}
                                        size={24}
                                        color={type === t.id ? '#fff' : '#555'}
                                    />
                                    <Text style={[styles.typeLabel, type === t.id && styles.typeLabelActive]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, loading && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={loading}
                            testID="save-account-btn"
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 500,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    form: {
        gap: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    typeButton: {
        width: '48%',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
        gap: 8,
    },
    typeButtonActive: {
        backgroundColor: '#007BFF',
        borderColor: '#007BFF',
    },
    typeLabel: {
        fontSize: 14,
        color: '#555',
    },
    typeLabelActive: {
        color: '#fff',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#007BFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
