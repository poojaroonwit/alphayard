import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { CircleSelectionTabs } from '../common/CircleSelectionTabs';

interface ProfileFinancialTabProps {
    userId?: string;
    useScrollView?: boolean;
}

export const ProfileFinancialTab: React.FC<ProfileFinancialTabProps> = ({
    useScrollView = true,
}) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [showFabMenu, setShowFabMenu] = useState(false);

    const handleTabChange = (tabId: string) => {
        console.log('Switching to financial tab:', tabId);
        setActiveTab(tabId);
        setSelectedCategory(null); // Clear selection when switching tabs
    };

    const handleCategorySelect = (category: any) => {
        setSelectedCategory(category);
    };

    const handleBackFromDetail = () => {
        setSelectedCategory(null);
    };

    // Sub-navigation config
    const subTabs = [
        { id: 'summary', label: 'Summary', icon: 'chart-pie' },
        { id: 'assets', label: 'Assets', icon: 'cash' },
        { id: 'debts', label: 'Debts', icon: 'credit-card-outline' },
        { id: 'cashflow', label: 'Cash Flow', icon: 'swap-vertical' },
    ];

    // Mock financial data
    const financialData = {
        walletBalance: 12500.00,
        currency: 'THB',
        netWorth: 1250000,
        savingsRate: 0.35,
        growthRate: '+12.5%',
        fiPercentage: 0.42,
        transactions: [
            { id: '1', type: 'credit', amount: 5000, description: 'Circle contribution', date: '2024-01-03' },
            { id: '2', type: 'debit', amount: 1200, description: 'Groceries', date: '2024-01-02' },
            { id: '3', type: 'credit', amount: 800, description: 'Allowance', date: '2024-01-01' },
        ],
        assetCategories: [
            { id: 'c1', name: 'Liquid Assets', amount: 120000, color: '#3B82F6', icon: 'wallet' },
            { id: 'c2', name: 'Investment Assets', amount: 450000, color: '#8B5CF6', icon: 'trending-up' },
            { id: 'c3', name: 'Retirement Assets', amount: 320000, color: '#10B981', icon: 'umbrella-beach' },
            { id: 'c4', name: 'Real Assets', amount: 580000, color: '#F59E0B', icon: 'home-city' },
            { id: 'c5', name: 'Business Assets', amount: 250000, color: '#EF4444', icon: 'office-building' },
        ],
        debtCategories: [
            { id: 'd1', name: 'Long-term Debt', amount: 450000, color: '#6366F1', icon: 'home' },
            { id: 'd2', name: 'Short-term Debt', amount: 25000, color: '#EC4899', icon: 'credit-card' },
            { id: 'd3', name: 'Other Obligations', amount: 15000, color: '#94A3B8', icon: 'alert-circle' },
        ],
        cashFlow: {
            income: [
                { id: 'i1', name: 'Salary', amount: 85000, color: '#10B981', items: [{ name: 'Base Salary', amount: 75000 }, { name: 'Bonus', amount: 10000 }] },
                { id: 'i2', name: 'Dividends', amount: 5000, color: '#34D399', items: [{ name: 'Stock Dividends', amount: 5000 }] },
            ],
            expense: [
                { id: 'e1', name: 'Living', amount: 35000, color: '#F87171', items: [{ name: 'Rent', amount: 20000 }, { name: 'Utilities', amount: 5000 }, { name: 'Food', amount: 10000 }] },
                { id: 'e2', name: 'Leisure', amount: 12000, color: '#FB7185', items: [{ name: 'Travel', amount: 8000 }, { name: 'Cinema', amount: 4000 }] },
                { id: 'e3', name: 'Investments', amount: 30000, color: '#FCA5A5', items: [{ name: 'ETF', amount: 30000 }] },
            ]
        }
    };

    // Add mock items to categories
    (financialData.assetCategories[0] as any).items = [{ name: 'Physical Cash', amount: 40000 }, { name: 'Bank Account', amount: 80000 }];
    (financialData.assetCategories[1] as any).items = [{ name: 'Blue Chip Stocks', amount: 300000 }, { name: 'Growth Stocks', amount: 150000 }];
    (financialData.debtCategories[0] as any).items = [{ name: 'Mortgage', amount: 450000 }];

    const formatCurrency = (amount: number) => {
        return `฿${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;
    };

    const CategoryBar = (cat: { id: string, name: string, amount: number, total: number, color: string, icon?: string, items?: any[] }) => {
        const { name, amount, total, color, icon } = cat;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return (
            <TouchableOpacity 
                style={styles.categoryBarRow} 
                onPress={() => handleCategorySelect(cat)}
                activeOpacity={0.7}
            >
                <View style={styles.categoryMainInfo}>
                    <View style={styles.categoryLabelGroup}>
                        {icon && <IconMC name={icon} size={18} color={color} style={{ marginRight: 8 }} />}
                        <Text style={styles.catBarLabel} numberOfLines={1}>{name}</Text>
                    </View>
                    
                    <View style={styles.categoryBarDetails}>
                        <Text style={[styles.catBarPercentText, { color: color }]}>
                            {percentage.toFixed(0)}%
                        </Text>
                        <View style={styles.catBarMiniTrack}>
                            <View style={[styles.catBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
                        </View>
                    </View>
                </View>
                
                <View style={styles.categoryAmountGroup}>
                    <Text style={styles.catBarAmount}>{formatCurrency(amount)}</Text>
                    <IconMC name="chevron-right" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderSummary = () => {
        return (
            <View style={styles.container}>
                {/* Net Worth Chart Mockup */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={styles.chartLabel}>Current Net Worth</Text>
                            <Text style={styles.chartValue}>{formatCurrency(financialData.netWorth)}</Text>
                        </View>
                        <View style={styles.growthBadge}>
                            <Text style={styles.growthText}>{financialData.growthRate}</Text>
                        </View>
                    </View>
                    <View style={styles.chartContainer}>
                        {/* Simulated Area Chart */}
                        <View style={styles.chartMock}>
                            {[40, 60, 45, 80, 75, 95, 100].map((h, i) => (
                                <View key={i} style={[styles.chartBar, { height: `${h}%`, opacity: 0.3 + (i * 0.1) }]} />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Savings Rate & Metrics */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Savings Rate</Text>
                        <View style={styles.gaugeContainer}>
                            <Text style={styles.statValue}>{(financialData.savingsRate * 100).toFixed(0)}%</Text>
                        </View>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>FI Progress</Text>
                        <View style={styles.gaugeContainer}>
                            <Text style={[styles.statValue, { color: '#10B981' }]}>{(financialData.fiPercentage * 100).toFixed(0)}%</Text>
                        </View>
                    </View>
                </View>

                {/* Cash Balance */}
                <View style={[styles.balanceCard, { marginTop: 16 }]}>
                    <Text style={styles.balanceLabel}>Disposable Cash</Text>
                    <Text style={styles.balanceAmount}>{formatCurrency(financialData.walletBalance)}</Text>
                </View>
            </View>
        );
    };

    const renderAssets = () => {
        const totalAssets = financialData.assetCategories.reduce((sum, cat) => sum + cat.amount, 0);
        return (
            <View style={styles.section}>
                <View style={styles.topSummaryCard}>
                    <Text style={styles.topSummaryLabel}>Total Assets</Text>
                    <Text style={[styles.topSummaryValue, { color: '#10B981' }]}>{formatCurrency(totalAssets)}</Text>
                </View>

                <Text style={styles.sectionTitle}>Asset Portfolio</Text>
                <View style={styles.categoriesList}>
                    {financialData.assetCategories.map(cat => (
                        <CategoryBar key={cat.id} {...cat} color="#10B981" total={totalAssets} />
                    ))}
                </View>
            </View>
        );
    };

    const renderDebts = () => {
        const totalDebts = financialData.debtCategories.reduce((sum, cat) => sum + cat.amount, 0);
        return (
            <View style={styles.section}>
                <View style={[styles.topSummaryCard, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
                    <Text style={[styles.topSummaryLabel, { color: '#BE123C' }]}>Total Liabilities</Text>
                    <Text style={[styles.topSummaryValue, { color: '#E11D48' }]}>{formatCurrency(totalDebts)}</Text>
                </View>

                <Text style={styles.sectionTitle}>Total Obligations</Text>
                <View style={styles.categoriesList}>
                    {financialData.debtCategories.map(cat => (
                        <CategoryBar key={cat.id} {...cat} color="#EF4444" total={totalDebts} />
                    ))}
                </View>
            </View>
        );
    };

    const renderCashFlow = () => {
        const totalIncome = financialData.cashFlow.income.reduce((sum, cat) => sum + cat.amount, 0);
        const totalExpense = financialData.cashFlow.expense.reduce((sum, cat) => sum + cat.amount, 0);
        const netCashFlow = totalIncome - totalExpense;
        return (
            <View style={styles.section}>
                <View style={[styles.topSummaryCard, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}>
                    <Text style={[styles.topSummaryLabel, { color: '#134E4A' }]}>Net Cash Flow</Text>
                    <Text style={[styles.topSummaryValue, { color: '#10B981' }]}>
                        {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Monthly Income</Text>
                <View style={styles.categoriesList}>
                    {financialData.cashFlow.income.map(cat => (
                        <CategoryBar key={cat.id} {...cat} color="#10B981" total={totalIncome} />
                    ))}
                </View>
                
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Monthly Expenses</Text>
                <View style={styles.categoriesList}>
                    {financialData.cashFlow.expense.map(cat => (
                        <CategoryBar key={cat.id} {...cat} color="#EF4444" total={totalExpense} />
                    ))}
                </View>
            </View>
        );
    };



    const renderCategoryDetail = () => {
        if (!selectedCategory) return null;
        const { name, amount, color, icon, items = [] } = selectedCategory;

        return (
            <View style={styles.section}>
                <View style={styles.detailHeader}>
                    <TouchableOpacity onPress={handleBackFromDetail} style={styles.backLink}>
                        <IconMC name="arrow-left" size={20} color="#64748B" />
                        <Text style={styles.backLinkText}>Back to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</Text>
                    </TouchableOpacity>
                    <View style={styles.detailTitleRow}>
                        <View style={[styles.detailIcon, { backgroundColor: `${color}15` }]}>
                            <IconMC name={icon || 'tag'} size={24} color={color} />
                        </View>
                        <View>
                            <Text style={styles.detailTitle}>{name}</Text>
                            <Text style={styles.detailAmount}>{formatCurrency(amount)}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.itemsList}>
                    {items.length > 0 ? (
                        items.map((item: any, idx: number) => (
                            <View key={idx} style={styles.itemRow}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyItems}>
                            <Text style={styles.emptyItemsText}>No items added yet</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={[styles.addButton, { backgroundColor: `${color}10` }]}>
                    <IconMC name="plus" size={20} color={color} />
                    <Text style={[styles.addButtonText, { color: color }]}>Add Record</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderActiveView = () => {
        if (selectedCategory) return renderCategoryDetail();
        
        switch (activeTab) {
            case 'assets': return renderAssets();
            case 'debts': return renderDebts();
            case 'cashflow': return renderCashFlow();
            default: return renderSummary();
        }
    };

    const ContentWrapper = useScrollView ? ScrollView : View;

    return (
        <View style={styles.container}>
            <ContentWrapper 
                style={styles.container} 
                {...(useScrollView ? { 
                    showsVerticalScrollIndicator: false,
                    contentContainerStyle: { paddingBottom: 100 } 
                } : {})}
            >


                {/* Sub-Navigation */}
                <View style={styles.subTabsContainer}>
                    <CircleSelectionTabs
                        activeTab={activeTab}
                        onTabPress={handleTabChange}
                        tabs={subTabs}
                        variant="segmented"
                        fit={true}
                        activeColor="#FFFFFF"
                        inactiveColor="#F1F5F9"
                        activeTextColor="#0F172A"
                        inactiveTextColor="#64748B"
                        showIcons={true}
                        iconPosition="left"
                        activeShowShadow={true}
                    />
                </View>

                {renderActiveView()}
            </ContentWrapper>

            {/* FAB Component */}
            <View style={styles.fabWrapper}>
                {showFabMenu && (
                    <View style={styles.popoverMenu}>
                        <TouchableOpacity style={styles.menuItem}>
                            <IconMC name="folder-plus" size={20} color="#0F172A" />
                            <Text style={styles.menuText}>Add categories</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem}>
                            <IconMC name="plus-circle" size={20} color="#0F172A" />
                            <Text style={styles.menuText}>Add item</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity 
                    style={styles.fab} 
                    onPress={() => setShowFabMenu(!showFabMenu)}
                    activeOpacity={0.9}
                >
                    <IconMC name={showFabMenu ? "close" : "plus"} size={24} color="#FFFFFF" />
                    {!showFabMenu && <Text style={styles.fabLabel}>Add</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    subTabsContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    balanceCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    balanceLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    balanceAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 4,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
    },
    categoriesList: {
        marginTop: 8,
    },
    transactionsList: {
        marginTop: 8,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionContent: {
        flex: 1,
    },
    transactionDesc: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    transactionDate: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    summaryInfoCard: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topSummaryCard: {
        marginBottom: 24,
        padding: 24,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    topSummaryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    topSummaryValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 8,
    },
    summaryInfoLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#475569',
    },
    summaryInfoValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    categoryBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    categoryMainInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '40%',
    },
    categoryBarDetails: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    categoryAmountGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 80,
    },
    catBarLabel: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
        flexShrink: 1,
    },
    catBarAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    catBarMiniTrack: {
        flex: 1,
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
        marginLeft: 8,
    },
    catBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    catBarPercentText: {
        fontSize: 11,
        fontWeight: '800',
        minWidth: 32,
        textAlign: 'right',
    },
    // Detail View Styles
    detailHeader: {
        marginBottom: 24,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backLinkText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 4,
    },
    detailTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailTitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    detailAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 2,
    },
    itemsList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 20,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    itemName: {
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
    },
    itemAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    emptyItems: {
        padding: 30,
        alignItems: 'center',
    },
    emptyItemsText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#CCC',
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    // FAB Styles
    fabWrapper: {
        position: 'absolute',
        bottom: 90, // Positioned above main navigation
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1000,
    },
    fab: {
        height: 48,
        paddingHorizontal: 20,
        borderRadius: 24,
        backgroundColor: '#0F172A',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabLabel: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
    },
    popoverMenu: {
        position: 'absolute',
        bottom: 60, // Relative to fabWrapper bottom
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 8,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    menuText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
        marginLeft: 12,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 8,
    },
    chartCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    chartLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    chartValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 4,
    },
    growthBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    growthText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#16A34A',
    },
    chartContainer: {
        marginTop: 24,
        height: 60,
    },
    chartMock: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: '100%',
    },
    chartBar: {
        width: '12%',
        backgroundColor: '#3B82F6',
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 12,
    },
    gaugeContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        borderColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#3B82F6',
    },
    cashFlowSummary: {
        marginTop: 24,
        padding: 20,
        backgroundColor: '#F0FDFA',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    cfItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cfLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#134E4A',
    },
    cfValue: {
        fontSize: 18,
        fontWeight: '800',
    },
});

export default ProfileFinancialTab;

