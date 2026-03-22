import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
    Animated,
} from 'react-native';

import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './finance/financeStyles';
import { todayStr, formatDate, formatCurrency } from './finance/financeUtils';
import { FinanceCategoryList } from './finance/FinanceCategoryList';
import { FinanceReport } from './finance/FinanceReport';
import { CircleSelectionTabs } from '../common/CircleSelectionTabs';
import { FinanceTabSkeleton } from '../common/SkeletonLoader';
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
    { id: 'cashflow', label: 'CashFlow', icon: 'swap-vertical' },
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
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [detailSourceTab, setDetailSourceTab] = useState<string | null>(null);
    const [expandedSubCat, setExpandedSubCat] = useState<string | null>(null);

    // Add Record modal
    const [showAddRecord, setShowAddRecord] = useState(false);
    const [addRecordSubCatId, setAddRecordSubCatId] = useState<string | null>(null);
    const [newRecordName, setNewRecordName] = useState('');
    const [newRecordAmount, setNewRecordAmount] = useState('');
    const [newRecordDate, setNewRecordDate] = useState(todayStr());
    const [targetAssetSubCatId, setTargetAssetSubCatId] = useState<string | null>(null);
    const [isCashFlowAdding, setIsCashFlowAdding] = useState(false);

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

    // Edit Sub-category state
    const [editingSubCatId, setEditingSubCatId] = useState<string | null>(null);
    const [editingSubCatName, setEditingSubCatName] = useState('');

    // Edit Category state
    const [showEditCategory, setShowEditCategory] = useState(false);
    const [editCatName, setEditCatName] = useState('');
    const [editCatIcon, setEditCatIcon] = useState('folder');
    const [editCatSaving, setEditCatSaving] = useState(false);

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
        // Find if this is a cashflow category
        let isCF = false;
        for (const cat of categories) {
            if (cat.subCategories.some(sc => sc.id === subCatId)) {
                if (cat.section === 'cashflow') isCF = true;
                break;
            }
        }
        setIsCashFlowAdding(isCF);
        setAddRecordSubCatId(subCatId);
        setNewRecordName('');
        setNewRecordAmount('');
        setNewRecordDate(todayStr());
        setTargetAssetSubCatId(null);
        setShowAddRecord(true);
    };

    const handleAddRecord = async () => {
        if (!newRecordName.trim() || !newRecordAmount.trim() || !addRecordSubCatId) return;
        const amount = parseFloat(newRecordAmount);
        
        // 1. Create primary record
        await financeService.createRecord(addRecordSubCatId, {
            name: newRecordName,
            amount: amount,
            date: newRecordDate,
        });

        // 2. Sync with Asset if selected
        if (isCashFlowAdding && targetAssetSubCatId) {
            // Find parent category of the cashflow sub-category to determine type (income/expense)
            let type: 'income' | 'expense' = 'expense';
            let catName = '';
            for (const cat of categories) {
                if (cat.subCategories.some(sc => sc.id === addRecordSubCatId)) {
                    type = cat.type as any;
                    catName = cat.name;
                    break;
                }
            }
            
            // For Expense, we subtract from asset. For Income, we add.
            const syncAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
            
            await financeService.createRecord(targetAssetSubCatId, {
                name: `${newRecordName} (${catName})`,
                amount: syncAmount,
                date: newRecordDate,
                note: `Synced from CashFlow: ${catName}`,
            });
        }

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

    const handleUpdateSubCat = async (subCatId: string) => {
        if (!editingSubCatName.trim()) return;
        await financeService.updateSubCategory(subCatId, editingSubCatName);
        setEditingSubCatId(null);
        setEditingSubCatName('');
        loadCategories();
    };

    const openEditCategory = () => {
        if (!selectedCategory) return;
        setEditCatName(selectedCategory.name);
        setEditCatIcon(selectedCategory.icon || 'folder');
        setShowEditCategory(true);
    };

    const handleUpdateCategory = async () => {
        if (!editCatName.trim() || !selectedCategory) return;
        setEditCatSaving(true);
        try {
            await financeService.updateCategory(selectedCategory.id, {
                name: editCatName,
                icon: editCatIcon,
            });
            setShowEditCategory(false);
            // Update selected category locally to reflect changes immediately
            setSelectedCategory({ ...selectedCategory, name: editCatName, icon: editCatIcon });
            loadCategories();
        } finally {
            setEditCatSaving(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return <FinanceTabSkeleton />;
    }

    const totalAssets = assetCategories.reduce((acc, cat) => acc + cat.subCategories.reduce((a, sc) => a + sc.records.reduce((rAcc, r) => rAcc + r.amount, 0), 0), 0);
    const totalDebts = debtCategories.reduce((acc, cat) => acc + cat.subCategories.reduce((a, sc) => a + sc.records.reduce((rAcc, r) => rAcc + r.amount, 0), 0), 0);
    const netWorthValue = totalAssets - totalDebts;

    return (
        <View style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingHorizontal: 16, paddingVertical: 6, marginBottom: 6 }}>
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
                                onPress={() => setExpandedTab('summary')}
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
                                    style={[styles.manageBtn, { backgroundColor: '#F1F5F9' }]}
                                    onPress={openEditCategory}
                                >
                                    <IconMC name="pencil-outline" size={14} color="#475569" />
                                    <Text style={styles.manageBtnText}>Edit</Text>
                                </TouchableOpacity>

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
                                                    </View>
                                                )}

                                                <TouchableOpacity
                                                    style={[styles.addRecordInline, { borderColor: (selectedCategory.color || '#64748B') + '30' }]}
                                                    onPress={() => openAddRecord(sc.id)}
                                                >
                                                    <IconMC name="plus" size={16} color={selectedCategory.color || '#64748B'} />
                                                    <Text style={[styles.addRecordInlineText, { color: selectedCategory.color || '#64748B' }]}>Add Item</Text>
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
                            <FinanceReport
                                netWorth={netWorthValue}
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
                                <TouchableOpacity
                                    style={[styles.emptyCatRow, { marginTop: 8, borderStyle: 'solid', backgroundColor: '#F8FAFC' }]}
                                    onPress={() => {
                                        setAddCatSection('assets');
                                        setAddCatType('asset');
                                        setShowAddCategory(true);
                                    }}
                                >
                                    <View style={[styles.emptyCatIcon, { backgroundColor: '#E2E8F0' }]}>
                                        <IconMC name="plus" size={20} color="#64748B" />
                                    </View>
                                    <Text style={[styles.emptyCatText, { color: '#64748B' }]}>Add New Asset Category</Text>
                                </TouchableOpacity>
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
                                <TouchableOpacity
                                    style={[styles.emptyCatRow, { marginTop: 8, borderStyle: 'solid', backgroundColor: '#F8FAFC' }]}
                                    onPress={() => {
                                        setAddCatSection('debts');
                                        setAddCatType('debt');
                                        setShowAddCategory(true);
                                    }}
                                >
                                    <View style={[styles.emptyCatIcon, { backgroundColor: '#E2E8F0' }]}>
                                        <IconMC name="plus" size={20} color="#64748B" />
                                    </View>
                                    <Text style={[styles.emptyCatText, { color: '#64748B' }]}>Add New Debt Category</Text>
                                </TouchableOpacity>
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
                                    <TouchableOpacity
                                        style={[styles.emptyCatRow, { marginTop: 8, borderStyle: 'solid', backgroundColor: '#F8FAFC' }]}
                                        onPress={() => {
                                            setAddCatSection('cashflow');
                                            setAddCatType(catType);
                                            setShowAddCategory(true);
                                        }}
                                    >
                                        <View style={[styles.emptyCatIcon, { backgroundColor: '#E2E8F0' }]}>
                                            <IconMC name="plus" size={20} color="#64748B" />
                                        </View>
                                        <Text style={[styles.emptyCatText, { color: '#64748B' }]}>Add New {label} Category</Text>
                                    </TouchableOpacity>
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

                            {isCashFlowAdding && (
                                <>
                                    <View style={{ height: 20 }} />
                                    <Text style={styles.inputLabel}>Link to Asset account (Optional)</Text>
                                    <View style={{ maxHeight: 180, marginTop: 8 }}>
                                        <ScrollView nestedScrollEnabled style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 4 }}>
                                            <TouchableOpacity 
                                                style={{ 
                                                    padding: 10, 
                                                    borderRadius: 6, 
                                                    backgroundColor: !targetAssetSubCatId ? '#F1F5F9' : 'transparent',
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 8
                                                }}
                                                onPress={() => setTargetAssetSubCatId(null)}
                                            >
                                                <IconMC name={!targetAssetSubCatId ? "radiobox-marked" : "radiobox-blank"} size={18} color={!targetAssetSubCatId ? "#0EA5E9" : "#64748B"} />
                                                <Text style={{ color: !targetAssetSubCatId ? "#0F172A" : "#64748B", fontWeight: !targetAssetSubCatId ? '600' : '400' }}>No sync</Text>
                                            </TouchableOpacity>
                                            
                                            {assetCategories.map(cat => (
                                                <React.Fragment key={cat.id}>
                                                    <View style={{ paddingHorizontal: 10, paddingTop: 10, paddingBottom: 4 }}>
                                                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>{cat.name}</Text>
                                                    </View>
                                                    {cat.subCategories.map(sc => (
                                                        <TouchableOpacity 
                                                            key={sc.id}
                                                            style={{ 
                                                                padding: 10, 
                                                                borderRadius: 6, 
                                                                backgroundColor: targetAssetSubCatId === sc.id ? (cat.color + '15') : 'transparent',
                                                                flexDirection: 'row',
                                                                alignItems: 'center',
                                                                gap: 8,
                                                                marginLeft: 8
                                                            }}
                                                            onPress={() => setTargetAssetSubCatId(sc.id)}
                                                        >
                                                            <IconMC 
                                                                name={targetAssetSubCatId === sc.id ? "radiobox-marked" : "radiobox-blank"} 
                                                                size={18} 
                                                                color={targetAssetSubCatId === sc.id ? cat.color : "#64748B"} 
                                                            />
                                                            <Text style={{ 
                                                                color: targetAssetSubCatId === sc.id ? "#0F172A" : "#475569",
                                                                fontWeight: targetAssetSubCatId === sc.id ? '600' : '400'
                                                            }}>{sc.name}</Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </>
                            )}
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
                            {selectedCategory?.subCategories.map((sc: any) => {
                                const isEditing = editingSubCatId === sc.id;
                                return (
                                    <View key={sc.id} style={styles.manageSubCatRow}>
                                        <View style={{ flex: 1, gap: 2 }}>
                                            {isEditing ? (
                                                <TextInput
                                                    style={[styles.textInput, { paddingVertical: 4, height: 36 }]}
                                                    value={editingSubCatName}
                                                    onChangeText={setEditingSubCatName}
                                                    autoFocus
                                                    onBlur={() => handleUpdateSubCat(sc.id)}
                                                    onSubmitEditing={() => handleUpdateSubCat(sc.id)}
                                                />
                                            ) : (
                                                <>
                                                    <Text style={styles.manageSubCatName}>{sc.name}</Text>
                                                    <Text style={styles.manageSubCatCount}>{sc.records.length} records</Text>
                                                </>
                                            )}
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 4 }}>
                                            <TouchableOpacity
                                                style={[styles.manageBtn, { backgroundColor: isEditing ? '#0F172A' : '#F1F5F9', paddingHorizontal: 8 }]}
                                                onPress={() => {
                                                    if (isEditing) {
                                                        handleUpdateSubCat(sc.id);
                                                    } else {
                                                        setEditingSubCatId(sc.id);
                                                        setEditingSubCatName(sc.name);
                                                    }
                                                }}
                                            >
                                                <IconMC name={isEditing ? "check" : "pencil-outline"} size={16} color={isEditing ? "#FFFFFF" : "#475569"} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.deleteSubCatBtn}
                                                onPress={() => handleDeleteSubCat(sc.id)}
                                            >
                                                <IconMC name="trash-can-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#F8FAFC' }}>
                            <Text style={styles.inputLabel}>New Sub-category</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TextInput
                                    style={[styles.textInput, { flex: 1 }]}
                                    placeholder="Sub-category name..."
                                    value={newSubCatName}
                                    onChangeText={setNewSubCatName}
                                    placeholderTextColor="#94A3B8"
                                />
                                <TouchableOpacity 
                                    style={[styles.confirmBtn, { flex: 0, paddingHorizontal: 16, height: 46, justifyContent: 'center' }, !newSubCatName.trim() && styles.confirmBtnDisabled]} 
                                    onPress={handleAddSubCat}
                                    disabled={!newSubCatName.trim()}
                                >
                                    <IconMC name="plus" size={24} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

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
                            <Text style={styles.modalFieldLabel}>Category Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={addCatName}
                                onChangeText={setAddCatName}
                                placeholder="e.g. Monthly Savings"
                                placeholderTextColor="#94A3B8"
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddCategory(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, !addCatName.trim() && styles.confirmBtnDisabled]}
                                onPress={handleAddCategory}
                                disabled={!addCatName.trim() || addCatSaving}
                            >
                                {addCatSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.confirmBtnText}>Create Category</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Edit Category Modal */}
            <Modal visible={showEditCategory} transparent animationType="slide" onRequestClose={() => setShowEditCategory(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Category</Text>
                            <TouchableOpacity onPress={() => setShowEditCategory(false)}>
                                <IconMC name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Category Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={editCatName}
                                onChangeText={setEditCatName}
                                placeholder="Category name..."
                                placeholderTextColor="#94A3B8"
                            />

                            <View style={{ height: 20 }} />
                            <Text style={styles.inputLabel}>Icon</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                                {['folder', 'cash', 'credit-card', 'bank', 'wallet', 'chart-line', 'home', 'car', 'shopping', 'food', 'medical-bag', 'cog'].map((iconName) => (
                                    <TouchableOpacity
                                        key={iconName}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 8,
                                            backgroundColor: editCatIcon === iconName ? (selectedCategory?.color || '#0EA5E9') : '#F1F5F9',
                                            justifyContent: 'center',
                                            alignSelf: 'center',
                                            alignItems: 'center'
                                        }}
                                        onPress={() => setEditCatIcon(iconName)}
                                    >
                                        <IconMC name={iconName} size={22} color={editCatIcon === iconName ? '#FFFFFF' : '#64748B'} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditCategory(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, !editCatName.trim() && styles.confirmBtnDisabled]}
                                onPress={handleUpdateCategory}
                                disabled={!editCatName.trim() || editCatSaving}
                            >
                                {editCatSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.confirmBtnText}>Save Changes</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};
