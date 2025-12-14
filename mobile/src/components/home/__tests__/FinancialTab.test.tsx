import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FinancialTab } from '../FinancialTab';
import { financeService } from '../../../services/financeService';

// Mock the financeService
jest.mock('../../../services/financeService', () => ({
    financeService: {
        getAccounts: jest.fn(),
        getTransactions: jest.fn(),
        createAccount: jest.fn(),
        createTransaction: jest.fn(),
        getCategories: jest.fn(),
        getGoals: jest.fn(),
    },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ navigate: jest.fn() }),
}));

// Mock icons
jest.mock('@expo/vector-icons', () => ({
    MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock gradient
jest.mock('expo-linear-gradient', () => ({
    LinearGradient: 'LinearGradient',
}));

describe('FinancialTab Integration (Renderer)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (financeService.getAccounts as jest.Mock).mockResolvedValue([]);
        (financeService.getTransactions as jest.Mock).mockResolvedValue([]);
        (financeService.getCategories as jest.Mock).mockResolvedValue([{ id: 'c1', name: 'Food', type: 'expense' }]);
        (financeService.getGoals as jest.Mock).mockResolvedValue([]);
    });

    it('allows adding a new account', async () => {
        (financeService.createAccount as jest.Mock).mockResolvedValue({
            id: 'acc_123', name: 'Test Bank', balance: 1000, type: 'bank'
        });

        let component: renderer.ReactTestRenderer;
        await act(async () => {
            component = renderer.create(<FinancialTab />);
        });

        const root = component!.root;

        // Open Add Account Modal
        // Find by testID="add-account-btn"
        const addBtn = root.findByProps({ testID: 'add-account-btn' });
        await act(async () => {
            addBtn.props.onPress();
        });

        // Find inputs (assuming Modal is rendered and visible)
        // AddAccountModal needs to be imported or we find by testID on TextInput
        // Since Modal implementation varies (RN Modal might render outside hierarchy in some tests environments, 
        // but react-test-renderer usually renders it if not mocked out).
        // If Modal is mocked, we need to inspect children.
        // Assuming Modal renders content.

        const nameInput = root.findByProps({ testID: 'account-name-input' });
        const balanceInput = root.findByProps({ testID: 'account-balance-input' });

        await act(async () => {
            nameInput.props.onChangeText('Test Bank');
            balanceInput.props.onChangeText('1000');
        });

        const saveBtn = root.findByProps({ testID: 'save-account-btn' });
        await act(async () => {
            saveBtn.props.onPress();
        });

        expect(financeService.createAccount).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Bank',
            balance: 1000
        }));
    });

    it('allows adding a new transaction', async () => {
        const mockAccounts = [{ id: 'acc_1', name: 'Main', balance: 5000, type: 'bank' }];
        (financeService.getAccounts as jest.Mock).mockResolvedValue(mockAccounts);

        let component: renderer.ReactTestRenderer;
        await act(async () => {
            component = renderer.create(<FinancialTab />);
        });
        const root = component!.root;

        // Wait for effect?
        // We need to re-render or wait for any Promises.
        // financeService.getAccounts called on mount.

        // Open Add Transaction
        const addTxBtn = root.findByProps({ testID: 'add-transaction-btn' });
        await act(async () => {
            addTxBtn.props.onPress();
        });

        const amountInput = root.findByProps({ testID: 'transaction-amount-input' });
        const noteInput = root.findByProps({ testID: 'transaction-note-input' });

        await act(async () => {
            amountInput.props.onChangeText('500');
            noteInput.props.onChangeText('Lunch');
        });

        // Select Category: "Food"
        // We verify that the chip exists.
        // AddTransactionModal renders categories.
        // We need to find the text element "Food" or the Touchable with that label.
        // Since we didn't add testID to category chips, valid strategy is finding text instance.
        const foodText = root.findAll(n => n.type === 'Text' && n.props.children === 'Food')[0];
        // The parent of text is the Touchable.
        // Or we iterate to find the Touchable that contains this text.
        // Easier: Just find by type TouchableOpacity and filter by child text.
        // Assuming the structure is Touchable -> [Icon, Text].
        // Let's just assume first category is selected or try to click it if we can find it.
        // Actually, AddTransactionModal logic: `const filteredCategories = categories.filter(...)`.
        // If we click the one with "Food".

        // Hack: find parent of foodText.
        // react-test-renderer nodes have `parent`.
        const foodChip = foodText.parent;
        await act(async () => {
            foodChip.props.onPress();
        });

        const saveBtn = root.findByProps({ testID: 'save-transaction-btn' });
        await act(async () => {
            saveBtn.props.onPress();
        });

        expect(financeService.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
            amount: 500,
            note: 'Lunch',
            account_id: 'acc_1'
        }));
    });
});
