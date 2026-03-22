import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
    Animated, Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './finance/financeStyles';
import { todayStr, formatDate, formatCurrency } from './finance/financeUtils';
import { FinanceCategoryList } from './finance/FinanceCategoryList';
import { FinanceSummary } from './finance/FinanceSummary';
import { CircleSelectionTabs } from '../common/CircleSelectionTabs';
import {
    financeService,
    FinanceCategory,
    FinanceSubCategory,
    FinanceRecord,
} from '../../services/financeService';

interface TabsConfig {
    activeColor?: string;
    inactiveColor?: string;
    activeTextColor?: string;
    inactiveTextColor?: string;
    activeIconColor?: string;
    inactiveIconColor?: string;
    menuBackgroundColor?: string;
    activeShowShadow?: string;
    inactiveShowShadow?: string;
}

interface ProfileFinancialTabProps {
    userId?: string;
    useScrollView?: boolean;
    tabsConfig?: TabsConfig;
}

const SUB_TABS = [
    { id: 'summary', label: 'Report', icon: 'chart-pie' },
    { id: 'assets', label: 'Assets', icon: 'cash' },
    { id: 'debts', label: 'Debts', icon: 'credit-card-outline' },
    { id: 'cashflow', label: 'Cash Flow', icon: 'swap-vertical' },
];

const CASHFLOW_SUB_TABS = [
    { id: 'income', label: 'Income', icon: 'arrow-down-circle-outline' },
    { id: 'expenses', label: 'Expenses', icon: 'arrow-up-circle-outline' },
];

export const ProfileFinancialTab: React.FC<ProfileFinancialTabProps> = ({ tabsConfig }) => {
    // ── Data state ─────────────────────────────────────────────────────────────
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCategories = useCallback(async () => {
        const data = await financeService.getCategories();
        setCategories(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    // ── Derived from API data ──────────────────────────────────────────────────
    const assetCategories = categories.filter(c => c.section === 'assets');
    const debtCategories = categories.filter(c => c.section === 'debts');
    const incomeCats = categories.filter(c => c.type === 'income');
    const expenseCats = categories.filter(c => c.type === 'expense');

    const subCatsByCategory: Record<string, FinanceSubCategory[]> = {};
    const recordsBySubCat: Record<string, FinanceRecord[]> = {};
    categories.forEach(cat => {
        subCatsByCategory[cat.id] = cat.subCategories;
        cat.subCategories.forEach(sc => {
            recordsBySubCat[sc.id] = sc.records;
        });
    });

    // ── UI state ───────────────────────────────────────────────────────────────
    const [expandedTab, setExpandedTab] = useState<string | null>('summary');
    const [cashflowSubTab, setCashflowSubTab] = useState<'income' | 'expenses'>('income');

    // ── Animations ─────────────────────────────────────────────────────────────
    const cashflowTransition = React.useRef(new Animated.Value(0)).current;
    const cashflowSlide = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(cashflowTransition, {
            toValue: expandedTab === 'cashflow' ? 1 : 0,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [expandedTab]);

    React.useEffect(() => {
        Animated.spring(cashflowSlide, {
            toValue: cashflowSubTab === 'income' ? 0 : 1,
            useNativeDriver: true,
            tension: 120,
            friction: 12,
        }).start();
    }, [cashflowSubTab]);

    const mainTabsOpacity = cashflowTransition.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const mainTabsX = cashflowTransition.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
    const cashflowTabsOpacity = cashflowTransition.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    const cashflowTabsX = cashflowTransition.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
    const contentSlideX = cashflowSlide.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_WIDTH] });
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [detailSourceTab, setDetailSourceTab] = useState<string | null>(null);
    const [expandedSubCat, setExpandedSubCat] = useState<string | null>(null);

    // Add Record modal
    const [showAddRecord, setShowAddRecord] = useState(false);
    const [addRecordSubCatId, setAddRecordSubCatId] = useState<string | null>(null);
    const [newRecordName, setNewRecordName] = useState('');
    const [newRecordAmount, setNewRecordAmount] = useState('');
    const [newRecordDate, setNewRecordDate] = useState(todayStr());

    // Manage Sub-categories drawer
    const [showManageSubCats, setShowManageSubCats] = useState(false);
    const [newSubCatName, setNewSubCatName] = useState('');

    // Add Category modal
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [addCatSection, setAddCatSection] = useState<string>('assets');
    const [addCatType, setAddCatType] = useState<string>('asset');
    const [addCatName, setAddCatName] = useState('');
    const [addCatSaving, setAddCatSaving] = useState(false);

    // Move-before-delete drawer
    const [showMoveDrawer, setShowMoveDrawer] = useState(false);
    const [moveType, setMoveType] = useState<'subcategory' | 'category'>('subcategory');
    const [moveSourceId, setMoveSourceId] = useState<string | null>(null);
    const [moveDestId, setMoveDestId] = useState<string | null>(null);
    const [moveWorking, setMoveWorking] = useState(false);

    // ── Handlers ────────────────────────────────────────────────────────────────
    const handleTabPress = (tabId: string) => {
        if (selectedCategory) {
            setSelectedCategory(null);
            setDetailSourceTab(null);
            setExpandedSubCat(null);
        }
        setExpandedTab(prev => (prev === tabId ? null : tabId));
    };

    const handleCategorySelect = (category: any, tabId: string) => {
        setDetailSourceTab(tabId);
        setSelectedCategory(category);
        setExpandedSubCat(null);
    };

    const handleBackFromDetail = () => {
        setSelectedCategory(null);
        setDetailSourceTab(null);
        setExpandedSubCat(null);
    };

    const openCatMenu = (category: any) => {
        setMoveType('category');
        setMoveSourceId(category.id);
        setMoveDestId(null);
        setMoveWorking(false);
        setShowMoveDrawer(true);
    };

    const openAddRecord = (subCatId: string) => {
        setAddRecordSubCatId(subCatId);
        setNewRecordName('');
        setNewRecordAmount('');
        setNewRecordDate(todayStr());
        setShowAddRecord(true);
    };

    const handleAddRecord = async () => {
        if (!newRecordName.trim() || !newRecordAmount.trim() || !addRecordSubCatId) return;
        await financeService.createRecord(addRecordSubCatId, {
            name: newRecordName,
            amount: parseFloat(newRecordAmount),
            date: newRecordDate,
        });
        loadCategories();
        setShowAddRecord(false);
    };

    const handleDeleteRecord = async (_subCatId: string, recordId: string) => {
        await financeService.deleteRecord(recordId);
        loadCategories();
    };

    const handleAddSubCat = async () => {
        if (!newSubCatName.trim() || !selectedCategory) return;
        await financeService.createSubCategory(selectedCategory.id, newSubCatName);
        setNewSubCatName('');
        loadCategories();
    };

    const handleDeleteSubCat = (subCatId: string) => {
        setMoveType('subcategory');
        setMoveSourceId(subCatId);
        setMoveDestId(null);
        setMoveWorking(false);
        setShowMoveDrawer(true);
    };

    const handleAddCategory = async () => {
        if (!addCatName.trim()) return;
        setAddCatSaving(true);
        try {
            await financeService.createCategory({
                name: addCatName,
                section: addCatSection as any,
                type: addCatSection === 'cashflow' ? (addCatType as any) : (addCatSection === 'assets' ? 'asset' : 'debt'),
                icon: 'folder',
                color: '#64748B',
            });
            setAddCatName('');
            setShowAddCategory(false);
            loadCategories();
        } finally {
            setAddCatSaving(false);
        }
    };

    // ── Move logic ─────────────────────────────────────────────────────────────
    const moveSourceSubCat = moveType === 'subcategory' && moveSourceId
        ? (() => {
            for (const cat of categories) {
                const sc = cat.subCategories.find(s => s.id === moveSourceId);
                if (sc) return { cat, sc };
            }
            return null;
        })()
        : null;

    const moveSourceCat = moveType === 'category' && moveSourceId
        ? categories.find(c => c.id === moveSourceId)
        : null;

    const moveSourceRecordCount = moveType === 'subcategory'
        ? (moveSourceSubCat?.sc.records.length || 0)
        : (moveSourceCat?.subCategories.reduce((acc, sc) => acc + sc.records.length, 0) || 0);

    const moveSourceAmount = moveType === 'subcategory'
        ? (moveSourceSubCat?.sc.records.reduce((acc, r) => acc + r.amount, 0) || 0)
        : (moveSourceCat?.subCategories.reduce((acc, sc) => acc + sc.records.reduce((a, r) => a + r.amount, 0), 0) || 0);

    const moveDestOptions = moveType === 'subcategory'
        ? categories.flatMap(cat =>
            cat.subCategories
                .filter(sc => sc.id !== moveSourceId)
                .map(sc => ({
                    id: sc.id,
                    label: sc.name,
                    sublabel: cat.name,
                    color: cat.color,
                }))
        )
        : categories
            .filter(c => c.id !== moveSourceId && c.section === moveSourceCat?.section)
            .map(c => ({
                id: c.id,
                label: c.name,
                sublabel: c.section.toUpperCase(),
                color: c.color,
            }));

    const handleMoveTransfer = async () => {
        if (!moveSourceId || !moveDestId) return;
        setMoveWorking(true);
        try {
            if (moveType === 'subcategory') {
                await financeService.moveSubCategoryRecords(moveSourceId, moveDestId);
                await financeService.deleteSubCategory(moveSourceId);
            } else {
                await financeService.moveCategorySubCategories(moveSourceId, moveDestId);
                await financeService.deleteCategory(moveSourceId);
            }
            setShowMoveDrawer(false);
            setSelectedCategory(null);
            loadCategories();
        } finally {
            setMoveWorking(false);
        }
    };

    const handleMoveDeleteAll = async () => {
        if (!moveSourceId) return;
        setMoveWorking(true);
        try {
            if (moveType === 'subcategory') {
                await financeService.deleteSubCategory(moveSourceId);
            } else {
                await financeService.deleteCategory(moveSourceId);
            }
            setShowMoveDrawer(false);
            setSelectedCategory(null);
            loadCategories();
        } finally {
            setMoveWorking(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0F172A" />
            </View>
        );
    }

    const totalAssets = assetCategories.reduce((acc, cat) => acc + cat.subCategories.reduce((a, sc) => a + sc.records.reduce((rAcc, r) => rAcc + r.amount, 0), 0), 0);
    const totalDebts = debtCategories.reduce((acc, cat) => acc + cat.subCategories.reduce((a, sc) => a + sc.records.reduce((rAcc, r) => rAcc + r.amount, 0), 0), 0);
    const netWorth = totalAssets - totalDebts;

    return (
        <View style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 }}>
                    <View style={{ position: 'relative' }}>
                        {/* Main 4-tab bar — slides out left when cashflow is active */}
                        <Animated.View
                            style={{ opacity: mainTabsOpacity, transform: [{ translateX: mainTabsX }] }}
                            pointerEvents={expandedTab === 'cashflow' ? 'none' : 'auto'}
                        >
                            <CircleSelectionTabs
                                tabs={SUB_TABS}
                                activeTab={expandedTab || ''}
                                onTabPress={handleTabPress}
                                activeColor={tabsConfig?.activeColor || "#FFFFFF"}
                                inactiveColor={tabsConfig?.inactiveColor || "rgba(255,255,255,0.5)"}
                                activeTextColor={tabsConfig?.activeTextColor || "#0EA5E9"}
                                inactiveTextColor={tabsConfig?.inactiveTextColor || "#64748B"}
                                activeIconColor={tabsConfig?.activeIconColor || "#0EA5E9"}
                                inactiveIconColor={tabsConfig?.inactiveIconColor || "#64748B"}
                                menuBackgroundColor={tabsConfig?.menuBackgroundColor || 'transparent'}
                                activeShowShadow={tabsConfig?.activeShowShadow || 'sm'}
                                inactiveShowShadow={tabsConfig?.inactiveShowShadow || 'none'}
                                itemSpacing={4}
                                fit={true}
                                variant="segmented"
                                showIcons={true}
                                iconPosition="left"
                            />
                        </Animated.View>

                        {/* Cashflow sub-tab row — slides in from right, overlays on top */}
                        <Animated.View
                            style={{
                                position: 'absolute', top: 0, left: 0, right: 0,
                                flexDirection: 'row', alignItems: 'center', gap: 8,
                                opacity: cashflowTabsOpacity,
                                transform: [{ translateX: cashflowTabsX }],
                            }}
                            pointerEvents={expandedTab === 'cashflow' ? 'auto' : 'none'}
                        >
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 }}
                                onPress={() => setExpandedTab(null)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <IconMC name="chevron-left" size={22} color="#64748B" />
                                <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>Back</Text>
                            </TouchableOpacity>

                            <View style={{ flex: 1 }}>
                                <CircleSelectionTabs
                                    tabs={CASHFLOW_SUB_TABS}
                                    activeTab={cashflowSubTab}
                                    onTabPress={(id) => setCashflowSubTab(id as 'income' | 'expenses')}
                                    activeColor={tabsConfig?.activeColor || "#FFFFFF"}
                                    inactiveColor={tabsConfig?.inactiveColor || "rgba(255,255,255,0.5)"}
                                    activeTextColor={tabsConfig?.activeTextColor || "#0EA5E9"}
                                    inactiveTextColor={tabsConfig?.inactiveTextColor || "#64748B"}
                                    activeIconColor={tabsConfig?.activeIconColor || "#0EA5E9"}
                                    inactiveIconColor={tabsConfig?.inactiveIconColor || "#64748B"}
                                    menuBackgroundColor={tabsConfig?.menuBackgroundColor || 'transparent'}
                                    activeShowShadow={tabsConfig?.activeShowShadow || 'sm'}
                                    inactiveShowShadow={tabsConfig?.inactiveShowShadow || 'none'}
                                    itemSpacing={4}
                                    fit={true}
                                    variant="segmented"
                                    showIcons={true}
                                    iconPosition="left"
                                />
                            </View>
                        </Animated.View>
                    </View>
                </View>

                {selectedCategory ? (
                    <View style={styles.section}>
                        <View style={styles.detailTopBar}>
                            <TouchableOpacity style={styles.backLink} onPress={handleBackFromDetail}>
                                <IconMC name="chevron-left" size={24} color="#64748B" />
                                <Text style={styles.backLinkText}>Back</Text>
                            </TouchableOpacity>

                            <View style={styles.detailTopActions}>
                                <TouchableOpacity
                                    style={styles.manageBtn}
                                    onPress={() => setShowManageSubCats(true)}
                                >
                                    <IconMC name="cog-outline" size={14} color="#475569" />
                                    <Text style={styles.manageBtnText}>Manage</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteCatBtn}
                                    onPress={() => openCatMenu(selectedCategory)}
                                >
                                    <IconMC name="delete-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={[styles.detailHero, { borderLeftColor: selectedCategory.color || '#CBD5E1' }]}>
                            <View style={[styles.detailIcon, { backgroundColor: (selectedCategory.color || '#64748B') + '15' }]}>
                                <IconMC name={selectedCategory.icon || 'folder'} size={28} color={selectedCategory.color || '#64748B'} />
                            </View>
                            <View>
                                <Text style={styles.detailTitle}>{selectedCategory.name}</Text>
                                <Text style={[styles.detailAmount, { color: selectedCategory.color || '#0F172A' }]}>
                                    {formatCurrency(selectedCategory.subCategories.reduce((acc: number, sc: any) => acc + sc.records.reduce((a: number, r: any) => a + r.amount, 0), 0))}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.detailSectionLabel}>Sub-categories</Text>
                        <View style={styles.subCatsList}>
                            {selectedCategory.subCategories.map((sc: any) => {
                                const isExpanded = expandedSubCat === sc.id;
                                const subTotal = sc.records.reduce((acc: number, r: any) => acc + r.amount, 0);

                                return (
                                    <View key={sc.id} style={styles.subCatCard}>
                                        <TouchableOpacity
                                            style={styles.subCatHeader}
                                            onPress={() => setExpandedSubCat(isExpanded ? null : sc.id)}
                                        >
                                            <View style={[styles.subCatDot, { backgroundColor: selectedCategory.color || '#CBD5E1' }]} />
                                            <Text style={styles.subCatName}>{sc.name}</Text>
                                            <View style={styles.subCatMeta}>
                                                <Text style={styles.subCatCount}>{sc.records.length} items</Text>
                                                <Text style={[styles.subCatTotal, { color: selectedCategory.color || '#0F172A' }]}>
                                                    {formatCurrency(subTotal)}
                                                </Text>
                                                <IconMC name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                                            </View>
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View style={styles.subCatContent}>
                                                {sc.records.length > 0 ? (
                                                    sc.records.map((r: any) => (
                                                        <View key={r.id} style={styles.itemRow}>
                                                            <View style={styles.itemRowLeft}>
                                                                <View style={[styles.itemDot, { backgroundColor: selectedCategory.color + '40' }]} />
                                                                <View>
                                                                    <Text style={styles.itemName}>{r.name}</Text>
                                                                    <Text style={styles.itemDate}>{formatDate(r.date)}</Text>
                                                                </View>
                                                            </View>
                                                            <View style={styles.itemRight}>
                                                                <Text style={styles.itemAmount}>{formatCurrency(r.amount)}</Text>
                                                                <TouchableOpacity
                                                                    style={styles.deleteRecordBtn}
                                                                    onPress={() => handleDeleteRecord(sc.id, r.id)}
                                                                >
                                                                    <IconMC name="close-circle-outline" size={16} color="#CBD5E1" />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    ))
                                                ) : (
                                                    <View style={styles.emptyItems}>
                                                        <Text style={styles.emptyItemsText}>No records yet</Text>
                                                        <TouchableOpacity
                                                            style={styles.emptyItemsAddBtn}
                                                            onPress={() => openAddRecord(sc.id)}
                                                        >
                                                            <IconMC name="plus" size={14} color={selectedCategory.color} />
                                                            <Text style={[styles.emptyItemsAddBtnText, { color: selectedCategory.color }]}>Add First</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}

                                                <TouchableOpacity
                                                    style={[styles.addRecordInline, { borderColor: (selectedCategory.color || '#64748B') + '30' }]}
                                                    onPress={() => openAddRecord(sc.id)}
                                                >
                                                    <IconMC name="plus" size={16} color={selectedCategory.color || '#64748B'} />
                                                    <Text style={[styles.addRecordInlineText, { color: selectedCategory.color || '#64748B' }]}>Add Record</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}

                            <View style={styles.addSubCatRow}>
                                <TextInput
                                    style={styles.addSubCatInput}
                                    placeholder="Add sub-category..."
                                    value={newSubCatName}
                                    onChangeText={setNewSubCatName}
                                    placeholderTextColor="#94A3B8"
                                />
                                <TouchableOpacity
                                    style={[styles.addSubCatBtn, !newSubCatName.trim() && styles.addSubCatBtnDisabled]}
                                    onPress={handleAddSubCat}
                                    disabled={!newSubCatName.trim()}
                                >
                                    <IconMC name="plus" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : (
                    <>
                        {expandedTab === 'summary' && (
                            <FinanceSummary
                                totalAssets={totalAssets}
                                totalDebts={totalDebts}
                                netWorth={netWorth}
                                incomeCats={incomeCats}
                                expenseCats={expenseCats}
                            />
                        )}

                        {expandedTab === 'assets' && (
                            <View style={styles.section}>
                                <View style={styles.sectionTitleRow}>
                                    <Text style={styles.sectionTitle}>Assets categories</Text>
                                    <TouchableOpacity
                                        style={styles.addCatInlineBtn}
                                        onPress={() => {
                                            setAddCatSection('assets');
                                            setAddCatType('asset');
                                            setShowAddCategory(true);
                                        }}
                                    >
                                        <IconMC name="plus" size={14} color="#64748B" />
                                        <Text style={styles.addCatInlineBtnText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                                <FinanceCategoryList
                                    categories={assetCategories}
                                    onSelect={(cat) => handleCategorySelect(cat, 'assets')}
                                    onMenu={openCatMenu}
                                    tabId="assets"
                                />
                                {assetCategories.length === 0 && (
                                    <TouchableOpacity
                                        style={styles.emptyCatRow}
                                        onPress={() => {
                                            setAddCatSection('assets');
                                            setAddCatType('asset');
                                            setShowAddCategory(true);
                                        }}
                                    >
                                        <View style={[styles.emptyCatIcon, { backgroundColor: '#F1F5F9' }]}>
                                            <IconMC name="plus" size={20} color="#94A3B8" />
                                        </View>
                                        <Text style={styles.emptyCatText}>Add your first asset category</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {expandedTab === 'debts' && (
                            <View style={styles.section}>
                                <View style={styles.sectionTitleRow}>
                                    <Text style={styles.sectionTitle}>Debts categories</Text>
                                    <TouchableOpacity
                                        style={styles.addCatInlineBtn}
                                        onPress={() => {
                                            setAddCatSection('debts');
                                            setAddCatType('debt');
                                            setShowAddCategory(true);
                                        }}
                                    >
                                        <IconMC name="plus" size={14} color="#64748B" />
                                        <Text style={styles.addCatInlineBtnText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                                <FinanceCategoryList
                                    categories={debtCategories}
                                    onSelect={(cat) => handleCategorySelect(cat, 'debts')}
                                    onMenu={openCatMenu}
                                    tabId="debts"
                                />
                                {debtCategories.length === 0 && (
                                    <TouchableOpacity
                                        style={styles.emptyCatRow}
                                        onPress={() => {
                                            setAddCatSection('debts');
                                            setAddCatType('debt');
                                            setShowAddCategory(true);
                                        }}
                                    >
                                        <View style={[styles.emptyCatIcon, { backgroundColor: '#F1F5F9' }]}>
                                            <IconMC name="plus" size={20} color="#94A3B8" />
                                        </View>
                                        <Text style={styles.emptyCatText}>Add your first debt category</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {expandedTab === 'cashflow' && (() => {
                            const isIncome = cashflowSubTab === 'income';
                            const cats = isIncome ? incomeCats : expenseCats;
                            const catType = isIncome ? 'income' : 'expense';
                            const label = isIncome ? 'Income' : 'Expense';
                            return (
                                <View style={styles.section}>
                                    <View style={styles.sectionTitleRow}>
                                        <Text style={styles.sectionTitle}>{label} categories</Text>
                                        <TouchableOpacity
                                            style={styles.addCatInlineBtn}
                                            onPress={() => {
                                                setAddCatSection('cashflow');
                                                setAddCatType(catType);
                                                setShowAddCategory(true);
                                            }}
                                        >
                                            <IconMC name="plus" size={14} color="#64748B" />
                                            <Text style={styles.addCatInlineBtnText}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <FinanceCategoryList
                                        categories={cats}
                                        onSelect={(cat) => handleCategorySelect(cat, 'cashflow')}
                                        onMenu={openCatMenu}
                                        tabId="cashflow"
                                    />
                                    {cats.length === 0 && (
                                        <TouchableOpacity
                                            style={styles.emptyCatRow}
                                            onPress={() => {
                                                setAddCatSection('cashflow');
                                                setAddCatType(catType);
                                                setShowAddCategory(true);
                                            }}
                                        >
                                            <View style={[styles.emptyCatIcon, { backgroundColor: '#F1F5F9' }]}>
                                                <IconMC name="plus" size={20} color="#94A3B8" />
                                            </View>
                                            <Text style={styles.emptyCatText}>Add your first {label.toLowerCase()} category</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })()}
                    </>
                )}
            </ScrollView>

            {/* Add Record Modal */}
            <Modal visible={showAddRecord} transparent animationType="slide" onRequestClose={() => setShowAddRecord(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Record</Text>
                            <TouchableOpacity onPress={() => setShowAddRecord(false)}>
                                <IconMC name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Record Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newRecordName}
                                onChangeText={setNewRecordName}
                                placeholder="e.g. Monthly Rent"
                                placeholderTextColor="#94A3B8"
                            />

                            <View style={{ height: 16 }} />

                            <Text style={styles.inputLabel}>Amount (฿)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newRecordAmount}
                                onChangeText={setNewRecordAmount}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                placeholderTextColor="#94A3B8"
                            />

                            <View style={{ height: 16 }} />

                            <Text style={styles.inputLabel}>Date</Text>
                            <View style={styles.dateInputRow}>
                                <IconMC name="calendar-range" size={20} color="#64748B" />
                                <TextInput
                                    style={[styles.textInput, { borderWidth: 0, flex: 1, backgroundColor: 'transparent' }]}
                                    value={newRecordDate}
                                    onChangeText={setNewRecordDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddRecord(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, (!newRecordName.trim() || !newRecordAmount.trim()) && styles.confirmBtnDisabled]}
                                onPress={handleAddRecord}
                                disabled={!newRecordName.trim() || !newRecordAmount.trim()}
                            >
                                <Text style={styles.confirmBtnText}>Add Record</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Manage Sub-categories Drawer */}
            <Modal visible={showManageSubCats} transparent animationType="slide" onRequestClose={() => setShowManageSubCats(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, styles.manageSheet]}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage Sub-categories</Text>
                            <TouchableOpacity onPress={() => setShowManageSubCats(false)}>
                                <IconMC name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.manageSubCatList}>
                            {selectedCategory?.subCategories.map((sc: any) => (
                                <View key={sc.id} style={styles.manageSubCatRow}>
                                    <Text style={styles.manageSubCatName}>{sc.name}</Text>
                                    <Text style={styles.manageSubCatCount}>{sc.records.length} records</Text>
                                    <TouchableOpacity
                                        style={styles.deleteSubCatBtn}
                                        onPress={() => handleDeleteSubCat(sc.id)}
                                    >
                                        <IconMC name="trash-can-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { flex: 0, paddingHorizontal: 32 }]}
                                onPress={() => setShowManageSubCats(false)}
                            >
                                <Text style={styles.cancelBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            {/* Add Category Modal */}
            <Modal visible={showAddCategory} transparent animationType="slide" onRequestClose={() => setShowAddCategory(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Category</Text>
                            <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                                <IconMC name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.modalFieldLabel}>Type</Text>
                            <View style={styles.catTypeRow}>
                                {addCatSection === 'cashflow' ? (
                                    <>
                                        {[{ v: 'income', label: 'Income', color: '#10B981' }, { v: 'expense', label: 'Expense', color: '#EF4444' }].map(opt => (
                                            <TouchableOpacity
                                                key={opt.v}
                                                style={[styles.catTypeChip, addCatType === opt.v && { backgroundColor: opt.color, borderColor: opt.color }]}
                                                onPress={() => setAddCatType(opt.v)}
                                            >
                                                <Text style={[styles.catTypeChipText, addCatType === opt.v && { color: '#FFFFFF' }]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </>
                                ) : (
                                    <View style={[styles.catTypeChip, styles.catTypeChipActive]}>
                                        <Text style={[styles.catTypeChipText, { color: '#FFFFFF' }]}>
                                            {addCatSection === 'assets' ? 'Asset' : 'Debt'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.modalFieldLabel, { marginTop: 16 }]}>Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={addCatName}
                                onChangeText={setAddCatName}
                                placeholder={addCatSection === 'assets' ? 'e.g. Stocks' : addCatSection === 'debts' ? 'e.g. Car Loan' : addCatType === 'income' ? 'e.g. Salary' : 'e.g. Rent'}
                                placeholderTextColor="#94A3B8"
                                autoFocus
                            />
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddCategory(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSaveBtn, (!addCatName.trim() || addCatSaving) && styles.modalSaveBtnDisabled]}
                                onPress={handleAddCategory}
                                disabled={!addCatName.trim() || addCatSaving}
                            >
                                {addCatSaving
                                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                                    : <Text style={styles.modalSaveText}>Create</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Move-before-delete Drawer */}
            <Modal visible={showMoveDrawer} transparent animationType="slide" onRequestClose={() => !moveWorking && setShowMoveDrawer(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.moveSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.moveSheetHeader}>
                            <View>
                                <Text style={styles.modalTitle}>
                                    {moveType === 'subcategory' ? 'Delete Sub-category' : 'Delete Category'}
                                </Text>
                                <Text style={styles.moveSheetSubtitle}>
                                    {moveSourceRecordCount} record{moveSourceRecordCount !== 1 ? 's' : ''} · {formatCurrency(moveSourceAmount)}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowMoveDrawer(false)} disabled={moveWorking}>
                                <IconMC name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.movePanels}>
                            {/* Left: FROM */}
                            <View style={styles.movePanel}>
                                <Text style={styles.movePanelLabel}>FROM</Text>
                                <View style={[styles.movePanelCard, { borderColor: moveType === 'subcategory' ? moveSourceSubCat?.cat.color || '#E2E8F0' : moveSourceCat?.color || '#E2E8F0' }]}>
                                    <View style={[styles.movePanelDot, { backgroundColor: moveType === 'subcategory' ? moveSourceSubCat?.cat.color || '#64748B' : moveSourceCat?.color || '#64748B' }]} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.movePanelName} numberOfLines={2}>
                                            {moveType === 'subcategory' ? moveSourceSubCat?.sc.name : moveSourceCat?.name}
                                        </Text>
                                        {moveType === 'subcategory' && moveSourceSubCat && (
                                            <Text style={styles.movePanelSub} numberOfLines={1}>{moveSourceSubCat.cat.name}</Text>
                                        )}
                                        <Text style={styles.movePanelMeta}>{moveSourceRecordCount} records</Text>
                                        <Text style={styles.movePanelAmount}>{formatCurrency(moveSourceAmount)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Arrow */}
                            <View style={{ width: 40, justifyContent: 'center', alignItems: 'center' }}>
                                <IconMC
                                    name="arrow-right-bold"
                                    size={22}
                                    color={moveDestId ? '#0F172A' : '#CBD5E1'}
                                />
                            </View>

                            {/* Right: TO */}
                            <View style={styles.movePanel}>
                                <Text style={styles.movePanelLabel}>TO</Text>
                                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                                    {moveDestOptions.length === 0 ? (
                                        <View style={{ padding: 20, alignItems: 'center' }}>
                                            <Text style={{ color: '#94A3B8', fontSize: 12 }}>No other options</Text>
                                        </View>
                                    ) : (
                                        moveDestOptions.map(opt => {
                                            const selected = moveDestId === opt.id;
                                            return (
                                                <TouchableOpacity
                                                    key={opt.id}
                                                    style={[{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 4 }, selected && { backgroundColor: '#F1F5F9' }]}
                                                    onPress={() => setMoveDestId(opt.id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[styles.movePanelDot, { backgroundColor: opt.color, width: 7, height: 7 }]} />
                                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                                        <Text style={[{ fontSize: 13, fontWeight: '500' }, selected && { fontWeight: '700' }]} numberOfLines={1}>
                                                            {opt.label}
                                                        </Text>
                                                        <Text style={{ fontSize: 10, color: '#94A3B8' }} numberOfLines={1}>{opt.sublabel}</Text>
                                                    </View>
                                                    {selected && <IconMC name="check-circle" size={15} color="#0F172A" />}
                                                </TouchableOpacity>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={{ flexDirection: 'row', gap: 10, padding: 20 }}>
                            <TouchableOpacity
                                style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: '#0F172A' }, (!moveDestId || moveWorking) && { backgroundColor: '#F1F5F9' }]}
                                onPress={handleMoveTransfer}
                                disabled={!moveDestId || moveWorking}
                            >
                                <IconMC name="swap-horizontal" size={15} color={moveDestId && !moveWorking ? '#FFFFFF' : '#94A3B8'} />
                                <Text style={[{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }, (!moveDestId || moveWorking) && { color: '#94A3B8' }]}>
                                    Transfer
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }, moveWorking && { opacity: 0.5 }]}
                                onPress={handleMoveDeleteAll}
                                disabled={moveWorking}
                            >
                                <IconMC name="delete-outline" size={15} color="#EF4444" />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>Delete All</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


export default ProfileFinancialTab;
