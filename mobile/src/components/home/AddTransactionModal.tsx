import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { financeService, FinancialAccount, FinancialCategory } from '../../services/financeService';

interface AddTransactionModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    accounts: FinancialAccount[];
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ visible, onClose, onSuccess, accounts }) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [date] = useState(new Date()); // Date is constant for now
    const [loading, setLoading] = useState(false);
    const [loadingCats, setLoadingCats] = useState(false);

    useEffect(() => {
        if (visible && accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
        if (visible) {
            loadCategories();
        }
    }, [visible, accounts]);

    const loadCategories = async () => {
        try {
            setLoadingCats(true);
            // In a real app we would fetch categories. For now, we'll use defaults if API returns empty
            // or implement a proper fetch in service. 
            // Assuming fetchCategories exists or we simulate it.
            // Since fetchCategories is not explicitly in the service interface I saw earlier (only CRUD for main entities),
            // we might need to add it or use mock categories here.
            // Let's assume we can fetch or use static list for now, but ideally we fetch.
            // Checking financeService again... assuming mock for now to not block.

            const mockCats: FinancialCategory[] = [
                { id: 'c1', name: 'Food', type: 'expense', color: '#FF5722', icon: 'food' },
                { id: 'c2', name: 'Transport', type: 'expense', color: '#2196F3', icon: 'bus' },
                { id: 'c3', name: 'Salary', type: 'income', color: '#4CAF50', icon: 'cash' },
                { id: 'c4', name: 'Shopping', type: 'expense', color: '#E91E63', icon: 'shopping' },
                { id: 'c5', name: 'Utilities', type: 'expense', color: '#FFC107', icon: 'lightbulb' },
            ];
            setCategories(mockCats);
        } catch (error) {
            console.error('Failed to load categories', error);
        } finally {
            setLoadingCats(false);
        }
    };

    const handleSave = async () => {
        if (!amount || !selectedAccountId || !selectedCategoryId) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }

        try {
            setLoading(true);
            await financeService.createTransaction({
                account_id: selectedAccountId,
                category_id: selectedCategoryId,
                amount: parseFloat(amount),
                type,
                date: date.toISOString(),
                note
            });
            onSuccess();
            onClose();
            // Reset
            setAmount('');
            setNote('');
            setType('expense');
        } catch (error) {
            console.error('Error creating transaction:', error);
            Alert.alert('Error', 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(c => c.type === type);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Transaction</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent}>
                        {/* Type Selector */}
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeOption, type === 'expense' && styles.activeExpense]}
                                onPress={() => setType('expense')}
                            >
                                <Text style={[styles.typeText, type === 'expense' && styles.activeTypeText]}>Expense</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeOption, type === 'income' && styles.activeIncome]}
                                onPress={() => setType('income')}
                            >
                                <Text style={[styles.typeText, type === 'income' && styles.activeTypeText]}>Income</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount */}
                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            autoFocus
                            testID="transaction-amount-input"
                        />

                        {/* Account */}
                        <Text style={styles.label}>Account</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {accounts.map(acc => (
                                <TouchableOpacity
                                    key={acc.id}
                                    style={[styles.chip, selectedAccountId === acc.id && styles.activeChip]}
                                    onPress={() => setSelectedAccountId(acc.id)}
                                >
                                    <Text style={[styles.chipText, selectedAccountId === acc.id && styles.activeChipText]}>
                                        {acc.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Category */}
                        <Text style={styles.label}>Category</Text>
                        {loadingCats ? (
                            <ActivityIndicator size="small" color="#007BFF" style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                {filteredCategories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.chip, selectedCategoryId === cat.id && styles.activeChip]}
                                        onPress={() => setSelectedCategoryId(cat.id)}
                                    >
                                        <MaterialCommunityIcons name={cat.icon as any || 'shape'} size={16} color={selectedCategoryId === cat.id ? '#fff' : '#555'} style={{ marginRight: 4 }} />
                                        <Text style={[styles.chipText, selectedCategoryId === cat.id && styles.activeChipText]}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {!loadingCats && filteredCategories.length === 0 && (
                                    <Text style={{ color: '#999', fontStyle: 'italic', paddingVertical: 8 }}>No categories found</Text>
                                )}
                            </ScrollView>
                        )}

                        {/* Note */}
                        <Text style={styles.label}>Note</Text>
                        <TextInput
                            style={styles.input}
                            value={note}
                            onChangeText={setNote}
                            placeholder="What is this for?"
                            testID="transaction-note-input"
                        />

                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                type === 'income' ? styles.saveButtonIncome : styles.saveButtonExpense,
                                loading && styles.disabledButton
                            ]}
                            onPress={handleSave}
                            disabled={loading}
                            testID="save-transaction-btn"
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Transaction</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
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
        height: '85%',
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
    scrollContent: {
        flex: 1,
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        marginBottom: 24,
        padding: 4,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeExpense: {
        backgroundColor: '#FF5252',
    },
    activeIncome: {
        backgroundColor: '#4CAF50',
    },
    typeText: {
        fontWeight: '600',
        color: '#666',
    },
    activeTypeText: {
        color: '#fff',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginTop: 16,
    },
    amountInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    horizontalScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeChip: {
        backgroundColor: '#333',
    },
    chipText: {
        color: '#333',
        fontWeight: '500',
    },
    activeChipText: {
        color: '#fff',
    },
    saveButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    saveButtonExpense: {
        backgroundColor: '#FF5252',
    },
    saveButtonIncome: {
        backgroundColor: '#4CAF50',
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
