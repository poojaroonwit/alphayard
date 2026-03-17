import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import IconIon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { brandColors, textColors } from '../../theme/colors';
import PopupModal from '../../components/common/PopupModal';

interface AssetDetailScreenProps {
  route: {
    params: {
      asset: {
        id: string;
        name: string;
        type: string;
        currentValue: number;
        targetValue: number;
        icon: string;
        color: string;
        description: string;
      };
    };
  };
}

const AssetDetailScreen: React.FC<AssetDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { asset } = route.params;
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [walletName, setWalletName] = useState(asset.name);
  const [walletDescription, setWalletDescription] = useState(asset.description);
  const [selectedIcon, setSelectedIcon] = useState(asset.icon);
  const [targetValue, setTargetValue] = useState(asset.targetValue.toString());
  
  // Bank account information
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);
  const [bankName, setBankName] = useState('Chase Bank');
  const [accountName, setAccountName] = useState('John Doe');
  const [accountNumber, setAccountNumber] = useState('1234567890');
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Mock transaction history with new balance
  const transactionHistory = [
    {
      id: '1',
      type: 'add',
      amount: 2500,
      date: '2024-01-15',
      time: '14:30',
      description: 'Monthly deposit',
      updatedBy: 'John Doe',
      newBalance: 24580,
    },
    {
      id: '2',
      type: 'withdraw',
      amount: 500,
      date: '2024-01-10',
      time: '09:15',
      description: 'Emergency fund',
      updatedBy: 'Jane Smith',
      newBalance: 22100,
    },
    {
      id: '3',
      type: 'add',
      amount: 1800,
      date: '2024-01-05',
      time: '16:45',
      description: 'Investment return',
      updatedBy: 'John Doe',
      newBalance: 22500,
    },
    {
      id: '4',
      type: 'withdraw',
      amount: 300,
      date: '2024-01-01',
      time: '11:20',
      description: 'Monthly expenses',
      updatedBy: 'Jane Smith',
      newBalance: 22000,
    },
  ];



  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleExportPDF = () => {
    Alert.alert(
      'Export to PDF',
      'Would you like to export this asset wallet to PDF?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Export',
          onPress: () => {
            // TODO: Implement PDF export functionality
            Alert.alert('Success', 'Asset wallet exported to PDF successfully!');
          },
        },
      ]
    );
  };

  const handleEditWallet = () => {
    setShowEditModal(true);
  };

  const handleSaveWallet = () => {
    // TODO: Implement save functionality
    Alert.alert('Success', 'Wallet updated successfully!');
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setWalletName(asset.name);
    setWalletDescription(asset.description);
    setSelectedIcon(asset.icon);
    setTargetValue(asset.targetValue.toString());
    setShowEditModal(false);
  };

  const getTransactionIcon = (type: string) => {
    return type === 'add' ? 'plus-circle' : 'minus-circle';
  };

  const getTransactionColor = (type: string) => {
    return type === 'add' ? '#4CAF50' : '#F44336';
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    const masked = '*'.repeat(accountNumber.length - 4);
    return `${masked}${lastFour}`;
  };

  const toggleAccountNumberVisibility = () => {
    setShowAccountNumber(!showAccountNumber);
  };

  const calculateProgress = () => {
    return (asset.currentValue / asset.targetValue) * 100;
  };

  const walletIcons = [
    'wallet',
    'piggy-bank',
    'bank',
    'credit-card',
    'cash',
    'currency-usd',
    'chart-line',
    'trending-up',
    'shield-check',
    'home',
    'car',
    'airplane',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
             {/* Header */}
       <View style={styles.header}>
         <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
           <IconIon name="arrow-back" size={24} color="#333333" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>Asset Details</Text>
         <View style={styles.headerRight}>
           <TouchableOpacity style={styles.headerButton} onPress={handleEditWallet}>
             <IconMC name="pencil" size={20} color="#4F46E5" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.headerButton} onPress={handleExportPDF}>
             <IconMC name="file-pdf-box" size={20} color="#FF8C8C" />
           </TouchableOpacity>
         </View>
       </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Asset Card */}
        <View style={styles.assetCard}>
          <LinearGradient
            colors={[asset.color, '#FFB7B7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.assetGradient}
          >
            <View style={styles.assetContent}>
              <View style={styles.assetLeft}>
                <View style={styles.coinIcon}>
                  <IconMC name={asset.icon} size={32} color="#FFF" />
                </View>
              </View>
              <View style={styles.assetRight}>
                <Text style={styles.assetLabel}>{asset.name}</Text>
                <Text style={styles.assetValue}>{formatCurrency(asset.currentValue)}</Text>
                <Text style={styles.assetTarget}>Target: {formatCurrency(asset.targetValue)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress to Target</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(calculateProgress(), 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {calculateProgress().toFixed(1)}% Complete
            </Text>
          </View>
        </View>

        {/* Bank Account Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bank Account Information</Text>
            <TouchableOpacity 
              style={styles.advancedToggleButton}
              onPress={() => setShowAdvancedSection(!showAdvancedSection)}
            >
              <IconMC 
                name={showAdvancedSection ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#4F46E5" 
              />
              <Text style={styles.advancedToggleText}>
                {showAdvancedSection ? "Hide" : "Advanced"}
              </Text>
            </TouchableOpacity>
          </View>
          
          {showAdvancedSection && (
            <View style={styles.bankAccountInfo}>
              <View style={styles.bankInfoRow}>
                <View style={styles.bankInfoLabel}>
                  <IconMC name="bank" size={16} color="#666666" />
                  <Text style={styles.bankInfoLabelText}>Bank Name</Text>
                </View>
                <Text style={styles.bankInfoValue}>{bankName}</Text>
              </View>
              
              <View style={styles.bankInfoRow}>
                <View style={styles.bankInfoLabel}>
                  <IconMC name="account" size={16} color="#666666" />
                  <Text style={styles.bankInfoLabelText}>Account Name</Text>
                </View>
                <Text style={styles.bankInfoValue}>{accountName}</Text>
              </View>
              
              <View style={styles.bankInfoRow}>
                <View style={styles.bankInfoLabel}>
                  <IconMC name="credit-card" size={16} color="#666666" />
                  <Text style={styles.bankInfoLabelText}>Account Number</Text>
                </View>
                <View style={styles.accountNumberContainer}>
                  <Text style={styles.bankInfoValue}>
                    {showAccountNumber ? accountNumber : maskAccountNumber(accountNumber)}
                  </Text>
                  <TouchableOpacity 
                    style={styles.toggleVisibilityButton}
                    onPress={toggleAccountNumberVisibility}
                  >
                    <IconMC 
                      name={showAccountNumber ? "eye-off" : "eye"} 
                      size={16} 
                      color="#4F46E5" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Transaction History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.transactionList}>
            {transactionHistory.map((transaction) => (
              <View key={transaction.id} style={styles.transactionListItem}>
                <View style={styles.transactionListIcon}>
                  <IconMC 
                    name={getTransactionIcon(transaction.type)} 
                    size={16} 
                    color={getTransactionColor(transaction.type)} 
                  />
                </View>
                <View style={styles.transactionListContent}>
                  <View style={styles.transactionListHeader}>
                    <Text style={styles.transactionListDescription}>{transaction.description}</Text>
                    <View style={styles.transactionListRight}>
                      <Text style={[
                        styles.transactionListAmount,
                        { color: getTransactionColor(transaction.type) }
                      ]}>
                        {transaction.type === 'add' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionListMeta}>
                    <View style={styles.transactionListMetaLeft}>
                      <Text style={styles.transactionListDate}>{formatDate(transaction.date)}</Text>
                      <Text style={styles.transactionListTime}>{transaction.time}</Text>
                      <Text style={styles.transactionListUser}>{transaction.updatedBy}</Text>
                    </View>
                    <View style={styles.transactionListBalanceRight}>
                      <IconMC name="wallet" size={12} color="#999999" />
                      <Text style={styles.transactionListBalanceText}>
                        {formatCurrency(transaction.newBalance)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        
      </ScrollView>

      {/* Edit Wallet Modal */}
      <PopupModal
        visible={showEditModal}
        onClose={handleCancelEdit}
        title="Edit Wallet"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Wallet Basic Info Section */}
          <View style={styles.addWalletModalSection}>
            <Text style={styles.addWalletModalSectionTitle}>Basic Information</Text>
            
            <TextInput
              style={styles.addWalletModalInput}
              placeholder="Wallet Name"
              value={walletName}
              onChangeText={setWalletName}
            />
            
            <TextInput
              style={styles.addWalletModalInput}
              placeholder="Description (optional)"
              value={walletDescription}
              onChangeText={setWalletDescription}
              multiline
            />
          </View>

          {/* Wallet Icon Selection */}
          <View style={styles.addWalletModalSection}>
            <Text style={styles.addWalletModalSectionTitle}>Choose Icon</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.addWalletModalIconScrollContainer}
            >
              {['wallet', 'credit-card', 'bank', 'piggy-bank', 'cash', 'diamond'].map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.addWalletModalIconOption,
                    selectedIcon === icon && styles.addWalletModalIconOptionActive
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <IconMC 
                    name={icon} 
                    size={24} 
                    color={selectedIcon === icon ? '#FFFFFF' : '#666666'} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Target Value Section */}
          <View style={styles.addWalletModalSection}>
            <Text style={styles.addWalletModalSectionTitle}>Target Value (optional)</Text>
            <TextInput
              style={styles.addWalletModalInput}
              placeholder="Enter target amount"
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="numeric"
            />
          </View>

          {/* Bank Account Section */}
          <View style={styles.addWalletModalSection}>
            <Text style={styles.addWalletModalSectionTitle}>Bank Account Details</Text>
            
            <TextInput
              style={styles.addWalletModalInput}
              placeholder="Bank Name"
              value={bankName}
              onChangeText={setBankName}
            />
            
            <TextInput
              style={styles.addWalletModalInput}
              placeholder="Account Name"
              value={accountName}
              onChangeText={setAccountName}
            />
            
            <View style={styles.addWalletModalInput}>
              <TextInput
                style={styles.addWalletModalAccountInput}
                placeholder="Account Number"
                value={showAccountNumber ? accountNumber : maskAccountNumber(accountNumber)}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
                secureTextEntry={!showAccountNumber}
              />
              <TouchableOpacity
                style={styles.addWalletModalVisibilityButton}
                onPress={toggleAccountNumberVisibility}
              >
                <IconIon 
                  name={showAccountNumber ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.addWalletModalButtons}>
            <TouchableOpacity
              style={styles.addWalletModalCancelButton}
              onPress={handleCancelEdit}
            >
              <Text style={styles.addWalletModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.addWalletModalCreateButton,
                { opacity: walletName.trim() ? 1 : 0.5 }
              ]}
              onPress={handleSaveWallet}
              disabled={!walletName.trim()}
            >
              <Text style={styles.addWalletModalCreateText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </PopupModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  assetCard: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  assetGradient: {
    padding: 20,
  },
  assetContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetLeft: {
    marginRight: 16,
  },
  coinIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetRight: {
    flex: 1,
  },
  assetLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  assetValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  assetTarget: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
  },
  historySummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  priceSummary: {
    gap: 8,
  },
  priceSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  priceSummaryDate: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  priceSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  priceSummaryChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  priceSummaryChangeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyTransactions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  transactionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  transactionMeta: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceRangeText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  priceCurrentText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
     transactionTime: {
     fontSize: 11,
     color: '#999999',
   },
  // Transaction List Styles
  transactionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  transactionListIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transactionListDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },
  transactionListAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionListRight: {
    alignItems: 'flex-end',
  },
  transactionListMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionListDate: {
    fontSize: 13,
    color: '#666666',
  },
  transactionListTime: {
    fontSize: 13,
    color: '#666666',
  },
  transactionListUser: {
    fontSize: 13,
    color: '#666666',
  },
  transactionListNewBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  transactionListBalanceText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '400',
  },
  transactionListMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionListBalanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transactionListBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    backgroundColor: '#4F46E5',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    marginLeft: 8,
  },
  saveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Edit Wallet Modal Styles
  editWalletModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1000,
  },
  editWalletModalContainer: {
    width: '100%',
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  editWalletModalHeader: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  editWalletModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  editWalletCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  editWalletModalHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  editWalletModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  editWalletModalSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  editWalletModalHeaderRight: {
    width: 40,
  },
  editWalletModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  editWalletInputSection: {
    marginBottom: 20,
  },
  editWalletInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  editWalletTextInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  editWalletTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editWalletIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  editWalletIconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editWalletSelectedIcon: {
    backgroundColor: '#4F46E5',
  },
  editWalletModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  editWalletCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  editWalletCancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666666',
  },
  editWalletSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    marginLeft: 8,
  },
  editWalletSaveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Add Wallet Modal Styles (for Edit Wallet)
  addWalletModalSection: {
    marginBottom: 24,
  },
  addWalletModalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  addWalletModalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addWalletModalAccountInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  addWalletModalVisibilityButton: {
    padding: 8,
  },
  addWalletModalIconScrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  addWalletModalIconOption: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addWalletModalIconOptionActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  addWalletModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  addWalletModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  addWalletModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  addWalletModalCreateButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
  },
  addWalletModalCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Bank Account Information Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  advancedToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F8FF',
  },
  advancedToggleText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginLeft: 4,
  },
  bankAccountInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  bankInfoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankInfoLabelText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  bankInfoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleVisibilityButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  toggleEditVisibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  toggleEditVisibilityText: {
    fontSize: 12,
    color: '#4F46E5',
    marginLeft: 4,
  },
});

export default AssetDetailScreen; 
