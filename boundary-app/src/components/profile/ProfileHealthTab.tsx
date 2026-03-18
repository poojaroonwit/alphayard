import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    healthService,
    HealthCategory,
    HealthSubCategory,
    HealthRecord,
} from '../../services/health/HealthService';

interface ProfileHealthTabProps {
    userId?: string;
    useScrollView?: boolean;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso: string) => {
    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatValue = (amount: number) =>
    `${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;

const SUB_TABS = [
    { id: 'summary', label: 'Summary', icon: 'chart-pie' },
    { id: 'assets', label: 'Assets', icon: 'heart-plus-outline' },
    { id: 'liabilities', label: 'Liabilities', icon: 'heart-minus-outline' },
    { id: 'flow', label: 'Flow', icon: 'swap-vertical' },
];

export const ProfileHealthTab: React.FC<ProfileHealthTabProps> = () => {
    // ── Data state ─────────────────────────────────────────────────────────────
    const [categories, setCategories] = useState<HealthCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCategories = useCallback(async () => {
        const data = await healthService.getCategories();
        setCategories(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadCategories(); }, [loadCategories]);

    // ── Derived from API data ──────────────────────────────────────────────────
    const assetCategories = categories.filter(c => c.section === 'assets');
    const liabilityCategories = categories.filter(c => c.section === 'liabilities');
    const inputCats = categories.filter(c => c.type === 'input');
    const outputCats = categories.filter(c => c.type === 'output');

    const subCatsByCategory: Record<string, HealthSubCategory[]> = {};
    const recordsBySubCat: Record<string, HealthRecord[]> = {};
    categories.forEach(cat => {
        subCatsByCategory[cat.id] = cat.subCategories;
        cat.subCategories.forEach(sc => {
            recordsBySubCat[sc.id] = sc.records;
        });
    });

    // ── UI state ───────────────────────────────────────────────────────────────
    const [expandedTab, setExpandedTab] = useState<string | null>('summary');
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

    // ── Derived totals from records ────────────────────────────────────────────
    const getCatTotal = (catId: string) => {
        const subCats = subCatsByCategory[catId] || [];
        return subCats.reduce((sum, sc) => {
            const recs = recordsBySubCat[sc.id] || [];
            return sum + recs.reduce((s, r) => s + Number(r.amount), 0);
        }, 0);
    };

    const totalAssets = assetCategories.reduce((s, c) => s + getCatTotal(c.id), 0);
    const totalLiabilities = liabilityCategories.reduce((s, c) => s + getCatTotal(c.id), 0);
    const totalInput = inputCats.reduce((s, c) => s + getCatTotal(c.id), 0);
    const totalOutput = outputCats.reduce((s, c) => s + getCatTotal(c.id), 0);
    const netFlow = totalInput - totalOutput;
    const healthScore = Math.max(0, totalAssets - totalLiabilities);
    
    // Performance score could be a ratio of assets to liabilities or something similar
    const performanceRatio = totalLiabilities > 0 ? totalAssets / totalLiabilities : totalAssets;

    const tabTotals: Record<string, string> = {
        summary: formatValue(healthScore),
        assets: formatValue(totalAssets),
        liabilities: formatValue(totalLiabilities),
        flow: (netFlow >= 0 ? '+' : '') + formatValue(netFlow),
    };

    // ── Handlers ───────────────────────────────────────────────────────────────
    const toggleSection = (tabId: string) => {
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

    // Safe delete logic
    const moveSourceAmount = moveType === 'subcategory' && moveSourceId
        ? (recordsBySubCat[moveSourceId] || []).reduce((s, r) => s + Number(r.amount), 0)
        : moveSourceId
            ? categories.find(c => c.id === moveSourceId)?.subCategories.reduce((s, sc) => s + (recordsBySubCat[sc.id] || []).reduce((ss, rr) => ss + Number(rr.amount), 0), 0) || 0
            : 0;

    const moveSourceRecordCount = moveType === 'subcategory' && moveSourceId
        ? (recordsBySubCat[moveSourceId] || []).length
        : moveSourceId
            ? categories.find(c => c.id === moveSourceId)?.subCategories.reduce((s, sc) => s + (recordsBySubCat[sc.id] || []).length, 0) || 0
            : 0;

    const moveSourceCat = moveType === 'category' ? categories.find(c => c.id === moveSourceId) : null;
    const moveSourceSubCat = moveType === 'subcategory' ? (() => {
        for (const cat of categories) {
            const sc = cat.subCategories.find(s => s.id === moveSourceId);
            if (sc) return { sc, cat };
        }
        return null;
    })() : null;

    const moveDestOptions = moveType === 'subcategory' && moveSourceSubCat
        ? subCatsByCategory[moveSourceSubCat.cat.id]?.filter(sc => sc.id !== moveSourceId).map(sc => ({
            id: sc.id,
            label: sc.name,
            sublabel: moveSourceSubCat.cat.name,
            color: moveSourceSubCat.cat.color
        })) || []
        : moveType === 'category'
            ? categories.filter(c => c.id !== moveSourceId && c.section === moveSourceCat?.section).map(c => ({
                id: c.id,
                label: c.name,
                sublabel: c.section,
                color: c.color
            }))
            : [];

    const openAddRecord = (subCatId: string) => {
        setAddRecordSubCatId(subCatId);
        setNewRecordName('');
        setNewRecordAmount('');
        setNewRecordDate(todayStr());
        setShowAddRecord(true);
    };

    const handleAddRecord = async () => {
        if (!newRecordName.trim() || !newRecordAmount.trim() || !addRecordSubCatId) return;
        await healthService.createRecord(addRecordSubCatId, {
            name: newRecordName.trim(),
            amount: parseFloat(newRecordAmount) || 0,
            date: newRecordDate || todayStr(),
        });
        setShowAddRecord(false);
        await loadCategories();
    };

    const handleAddSubCat = async () => {
        if (!newSubCatName.trim() || !selectedCategory) return;
        await healthService.createSubCategory(selectedCategory.id, newSubCatName.trim());
        setNewSubCatName('');
        await loadCategories();
    };

    const openAddCategory = (section: string, type: string) => {
        setAddCatSection(section);
        setAddCatType(type);
        setAddCatName('');
        setShowAddCategory(true);
    };

    const handleAddCategory = async () => {
        if (!addCatName.trim() || addCatSaving) return;
        setAddCatSaving(true);
        try {
            await healthService.createCategory({
                name: addCatName.trim(),
                section: addCatSection,
                type: addCatType,
                color: addCatSection === 'assets' ? '#10B981' : (addCatSection === 'liabilities' ? '#EF4444' : '#6366F1'),
                icon: addCatType === 'input' ? 'plus-circle-outline' : 'heart-pulse',
            });
            setShowAddCategory(false);
            setAddCatName('');
            await loadCategories();
        } catch (error) {
            console.error('Failed to add category:', error);
        } finally {
            setAddCatSaving(false);
        }
    };

    const handleDeleteRecord = async (id: string) => {
        try {
            await healthService.deleteRecord(id);
            await loadCategories();
        } catch (error) {
            console.error('Failed to delete record:', error);
        }
    };

    const handleDeleteCategorySafe = async () => {
        if (!selectedCategory) return;
        const total = getCatTotal(selectedCategory.id);
        if (total > 0) {
            setMoveType('category');
            setMoveSourceId(selectedCategory.id);
            setMoveDestId(null);
            setShowMoveDrawer(true);
        } else {
            try {
                await healthService.deleteCategory(selectedCategory.id);
                setSelectedCategory(null);
                await loadCategories();
            } catch (error) {
                console.error('Failed to delete category:', error);
            }
        }
    };

    const handleDeleteSubCatSafe = async (id: string) => {
        const recs = recordsBySubCat[id] || [];
        if (recs.length > 0) {
            setMoveType('subcategory');
            setMoveSourceId(id);
            setMoveDestId(null);
            setShowMoveDrawer(true);
        } else {
            try {
                await healthService.deleteSubCategory(id);
                await loadCategories();
            } catch (error) {
                console.error('Failed to delete subcategory:', error);
            }
        }
    };

    const handleMoveTransfer = async () => {
        if (!moveSourceId || !moveDestId || moveWorking) return;
        setMoveWorking(true);
        try {
            // Implementation depends on backend capabilities, assuming bulk move if possible
            // Placeholder: currently just reloading after a simulated wait if API is missing
            // Ideally call: await healthService.transfer(moveType, moveSourceId, moveDestId);
            setShowMoveDrawer(false);
            await loadCategories();
        } finally {
            setMoveWorking(false);
        }
    };

    const handleMoveDeleteAll = async () => {
        if (!moveSourceId || moveWorking) return;
        setMoveWorking(true);
        try {
            if (moveType === 'category') {
                await healthService.deleteCategory(moveSourceId);
                setSelectedCategory(null);
            } else {
                await healthService.deleteSubCategory(moveSourceId);
            }
            setShowMoveDrawer(false);
            await loadCategories();
        } finally {
            setMoveWorking(false);
        }
    };



    // ── Components ─────────────────────────────────────────────────────────────
    const AccordionHeader = ({ id, label, icon, isExpanded }: { id: string; label: string; icon: string; isExpanded: boolean }) => (
        <TouchableOpacity
            style={[styles.accordionHeader, isExpanded && styles.accordionHeaderActive]}
            onPress={() => toggleSection(id)}
            activeOpacity={0.7}
        >
            <View style={styles.accordionHeaderLeft}>
                <View style={[styles.accordionIconContainer, isExpanded && styles.accordionIconActive]}>
                    <IconMC name={icon} size={16} color={isExpanded ? '#FFFFFF' : '#64748B'} />
                </View>
                <Text style={[styles.accordionLabel, isExpanded && styles.accordionLabelActive]}>{label}</Text>
            </View>
            <View style={styles.accordionHeaderRight}>
                {tabTotals[id] && (
                    <Text style={[styles.accordionTotal, isExpanded && styles.accordionTotalActive]}>
                        {tabTotals[id]}
                    </Text>
                )}
                <IconMC name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={isExpanded ? '#FFFFFF' : '#94A3B8'} />
            </View>
        </TouchableOpacity>
    );

    const CategoryBar = (cat: { id: string; name: string; color: string; icon: string; total: number; tabId: string }) => {
        const { id, name, color, icon, total, tabId } = cat;
        const catTotal = getCatTotal(id);
        const percentage = total > 0 ? (catTotal / total) * 100 : 0;
        return (
            <TouchableOpacity style={styles.categoryBarRow} onPress={() => handleCategorySelect(cat, tabId)} activeOpacity={0.7}>
                <View style={styles.categoryMainInfo}>
                    <View style={styles.categoryLabelGroup}>
                        <IconMC name={icon} size={18} color={color} style={{ marginRight: 8 }} />
                        <Text style={styles.catBarLabel} numberOfLines={1}>{name}</Text>
                    </View>
                    <View style={styles.categoryBarDetails}>
                        <Text style={[styles.catBarPercentText, { color }]}>{percentage.toFixed(0)}%</Text>
                        <View style={styles.catBarMiniTrack}>
                            <View style={[styles.catBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
                        </View>
                    </View>
                </View>
                <View style={styles.categoryAmountGroup}>
                    <Text style={styles.catBarAmount}>{formatValue(catTotal)}</Text>
                    <IconMC name="chevron-right" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
                </View>
            </TouchableOpacity>
        );
    };

    // ── Render functions ───────────────────────────────────────────────────────
    const renderSummary = () => (
        <View style={styles.section}>
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={styles.chartLabel}>Personal Health Score</Text>
                        <Text style={styles.chartValue}>{healthScore}</Text>
                    </View>
                </View>
                <View style={styles.chartContainer}>
                    <View style={styles.chartMock}>
                        {[60, 65, 55, 70, 85, 80, 90].map((h, i) => (
                            <View key={i} style={[styles.chartBar, { height: `${h}%`, opacity: 0.3 + i * 0.1, backgroundColor: '#10B981' }]} />
                        ))}
                    </View>
                </View>
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Health Ratio</Text>
                    <View style={styles.gaugeContainer}>
                        <Text style={styles.statValue}>{performanceRatio.toFixed(1)}x</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Health Score</Text>
                    <View style={styles.gaugeContainer}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{healthScore}</Text>
                    </View>
                </View>
            </View>
            <View style={[styles.balanceCard, { marginTop: 16 }]}>
                <Text style={styles.balanceLabel}>Net Health Flow</Text>
                <Text style={[styles.balanceAmount, { color: netFlow >= 0 ? '#10B981' : '#EF4444' }]}>
                    {netFlow >= 0 ? '+' : ''}{netFlow}
                </Text>
            </View>
        </View>
    );

    const renderEmptyCats = (label: string, icon: string, section: string, type: string, color: string) => (
        <TouchableOpacity style={styles.emptyCatRow} onPress={() => openAddCategory(section, type)} activeOpacity={0.7}>
            <View style={[styles.emptyCatIcon, { backgroundColor: `${color}12` }]}>
                <IconMC name={icon} size={18} color={color} />
            </View>
            <Text style={styles.emptyCatText}>Add {label}</Text>
            <IconMC name="plus-circle-outline" size={18} color={color} />
        </TouchableOpacity>
    );

    const renderAssets = () => (
        <View style={styles.section}>
            <View style={styles.topSummaryHeader}>
                <Text style={styles.topSummaryLabel}>Health Assets</Text>
                <Text style={[styles.topSummaryValue, { color: '#10B981' }]}>{totalAssets}</Text>
            </View>
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Physical & Mental Assets</Text>
                <TouchableOpacity onPress={() => openAddCategory('assets', 'asset')} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {assetCategories.length === 0
                    ? renderEmptyCats('health asset', 'heart-plus', 'assets', 'asset', '#10B981')
                    : assetCategories.map(cat => (
                        <CategoryBar key={cat.id} {...cat} total={totalAssets} tabId="assets" />
                    ))
                }
            </View>
        </View>
    );

    const renderLiabilities = () => (
        <View style={styles.section}>
            <View style={styles.topSummaryHeader}>
                <Text style={[styles.topSummaryLabel, { color: '#BE123C' }]}>Health Liabilities</Text>
                <Text style={[styles.topSummaryValue, { color: '#E11D48' }]}>{totalLiabilities}</Text>
            </View>
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Risks & Stressors</Text>
                <TouchableOpacity onPress={() => openAddCategory('liabilities', 'liability')} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {liabilityCategories.length === 0
                    ? renderEmptyCats('health liability', 'heart-minus', 'liabilities', 'liability', '#E11D48')
                    : liabilityCategories.map(cat => (
                        <CategoryBar key={cat.id} {...cat} total={totalLiabilities} tabId="liabilities" />
                    ))
                }
            </View>
        </View>
    );

    const renderFlow = () => (
        <View style={styles.section}>
            <View style={styles.topSummaryHeader}>
                <Text style={[styles.topSummaryLabel, { color: '#134E4A' }]}>Net Flow</Text>
                <Text style={[styles.topSummaryValue, { color: netFlow >= 0 ? '#10B981' : '#EF4444' }]}>
                    {netFlow >= 0 ? '+' : ''}{netFlow}
                </Text>
            </View>
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Health Input (Effort)</Text>
                <TouchableOpacity onPress={() => openAddCategory('flow', 'input')} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {inputCats.length === 0
                    ? renderEmptyCats('input category', 'plus-circle-outline', 'flow', 'input', '#10B981')
                    : inputCats.map(cat => (
                        <CategoryBar key={cat.id} {...cat} total={totalInput} tabId="flow" />
                    ))
                }
            </View>
            <View style={[styles.sectionTitleRow, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Health Output (Burn/Risk)</Text>
                <TouchableOpacity onPress={() => openAddCategory('flow', 'output')} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {outputCats.length === 0
                    ? renderEmptyCats('output category', 'minus-circle-outline', 'flow', 'output', '#EF4444')
                    : outputCats.map(cat => (
                        <CategoryBar key={cat.id} {...cat} total={totalOutput} tabId="flow" />
                    ))
                }
            </View>
        </View>
    );

    const renderCategoryDetail = () => {
        if (!selectedCategory) return null;
        const { id, name, color, icon } = selectedCategory;
        const subCats = subCatsByCategory[id] || [];

        let totalRecords = 0;
        let totalAmount = 0;
        let largest: HealthRecord | null = null;

        subCats.forEach(sc => {
            const recs = recordsBySubCat[sc.id] || [];
            totalRecords += recs.length;
            recs.forEach(r => {
                totalAmount += Number(r.amount);
                if (!largest || Number(r.amount) > Number(largest.amount)) largest = r;
            });
        });

        return (
            <View style={styles.section}>
                {/* Top bar */}
                <View style={styles.detailTopBar}>
                    <TouchableOpacity onPress={handleBackFromDetail} style={styles.backLink}>
                        <IconMC name="arrow-left" size={18} color="#64748B" />
                        <Text style={styles.backLinkText}>
                            {detailSourceTab ? detailSourceTab.charAt(0).toUpperCase() + detailSourceTab.slice(1) : 'Health'}
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.detailTopActions}>
                        <TouchableOpacity style={styles.manageBtn} onPress={() => setShowManageSubCats(true)}>
                            <IconMC name="tag-multiple-outline" size={16} color="#475569" />
                            <Text style={styles.manageBtnText}>Sub-cats</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteCatBtn} onPress={handleDeleteCategorySafe}>
                            <IconMC name="delete-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hero */}
                <View style={[styles.detailHero, { borderLeftColor: color }]}>
                    <View style={[styles.detailIcon, { backgroundColor: `${color}15` }]}>
                        <IconMC name={icon || 'tag'} size={26} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailTitle}>{name}</Text>
                        <Text style={[styles.detailAmount, { color }]}>{formatValue(totalAmount)}</Text>
                    </View>
                </View>

                {/* Sub-category sections */}
                <Text style={styles.detailSectionLabel}>Health Indicators</Text>

                {subCats.length === 0 ? (
                    <View style={styles.emptySubCats}>
                        <IconMC name="tag-multiple-outline" size={28} color="#CBD5E1" />
                        <Text style={styles.emptySubCatsText}>No indicators yet</Text>
                        <TouchableOpacity style={styles.emptySubCatsAction} onPress={() => setShowManageSubCats(true)}>
                            <Text style={[styles.emptySubCatsActionText, { color }]}>Add indicator</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.subCatsList}>
                        {subCats.map(sc => {
                            const recs = recordsBySubCat[sc.id] || [];
                            const scTotal = recs.reduce((s, r) => s + Number(r.amount), 0);
                            const isOpen = expandedSubCat === sc.id;
                            return (
                                <View key={sc.id} style={styles.subCatCard}>
                                    <TouchableOpacity
                                        style={styles.subCatHeader}
                                        onPress={() => setExpandedSubCat(isOpen ? null : sc.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.subCatDot, { backgroundColor: color }]} />
                                        <Text style={styles.subCatName}>{sc.name}</Text>
                                        <View style={styles.subCatMeta}>
                                            {recs.length > 0 && (
                                                <Text style={styles.subCatCount}>{recs.length} records</Text>
                                            )}
                                            <Text style={[styles.subCatTotal, { color }]}>{formatValue(scTotal)}</Text>
                                        </View>
                                        <IconMC name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                                    </TouchableOpacity>

                                    {isOpen && (
                                        <View style={styles.subCatContent}>
                                            {recs.length > 0 ? (
                                                recs.map(r => (
                                                    <View key={r.id} style={styles.itemRow}>
                                                        <View style={styles.itemRowLeft}>
                                                            <View style={[styles.itemDot, { backgroundColor: color }]} />
                                                            <View>
                                                                <Text style={styles.itemName}>{r.name}</Text>
                                                                <Text style={styles.itemDate}>{formatDate(r.recordDate)}</Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.itemRight}>
                                                            <Text style={styles.itemAmount}>{formatValue(Number(r.amount))}</Text>
                                                            <TouchableOpacity
                                                                onPress={() => handleDeleteRecord(r.id)}
                                                                style={styles.deleteRecordBtn}
                                                            >
                                                                <IconMC name="close" size={14} color="#CBD5E1" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))
                                            ) : (
                                                <TouchableOpacity style={styles.emptyItems} onPress={() => openAddRecord(sc.id)} activeOpacity={0.7}>
                                                    <Text style={styles.emptyItemsText}>No data yet</Text>
                                                    <View style={styles.emptyItemsAddBtn}>
                                                        <IconMC name="plus" size={12} color={color} />
                                                        <Text style={[styles.emptyItemsAddBtnText, { color }]}>Add data</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                style={[styles.addRecordInline, { borderColor: color }]}
                                                onPress={() => openAddRecord(sc.id)}
                                            >
                                                <IconMC name="plus" size={14} color={color} />
                                                <Text style={[styles.addRecordInlineText, { color }]}>Add Entry</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    const renderTabContent = (tabId: string) => {
        if (selectedCategory && detailSourceTab === tabId) return renderCategoryDetail();
        switch (tabId) {
            case 'assets': return renderAssets();
            case 'liabilities': return renderLiabilities();
            case 'flow': return renderFlow();
            default: return renderSummary();
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#64748B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.accordionContainer}>
                {SUB_TABS.map(tab => {
                    const isExpanded = expandedTab === tab.id;
                    return (
                        <View key={tab.id} style={[styles.accordionSection, isExpanded && styles.accordionSectionExpanded]}>
                            <AccordionHeader id={tab.id} label={tab.label} icon={tab.icon} isExpanded={isExpanded} />
                            {isExpanded && (
                                <ScrollView
                                    style={styles.accordionContent}
                                    contentContainerStyle={{ paddingBottom: 16 }}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {renderTabContent(tab.id)}
                                </ScrollView>
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Add Record Modal */}
            <Modal visible={showAddRecord} transparent animationType="slide" onRequestClose={() => setShowAddRecord(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Record</Text>
                            {addRecordSubCatId && selectedCategory && (
                                <View style={styles.subCatBadgeRow}>
                                    <View style={[styles.catBadge, { backgroundColor: `${selectedCategory.color}15` }]}>
                                        <IconMC name={selectedCategory.icon || 'tag'} size={12} color={selectedCategory.color} />
                                        <Text style={[styles.catBadgeText, { color: selectedCategory.color }]}>{selectedCategory.name}</Text>
                                    </View>
                                    <IconMC name="chevron-right" size={12} color="#94A3B8" />
                                    <View style={[styles.catBadge, { backgroundColor: '#F1F5F9' }]}>
                                        <Text style={styles.subCatBadgeText}>
                                            {(subCatsByCategory[selectedCategory.id] || []).find(sc => sc.id === addRecordSubCatId)?.name}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newRecordName}
                                onChangeText={setNewRecordName}
                                placeholder="e.g. Morning workout"
                                placeholderTextColor="#94A3B8"
                            />
                            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Value</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newRecordAmount}
                                onChangeText={setNewRecordAmount}
                                placeholder="0"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                            />
                            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Date</Text>
                            <View style={styles.dateInputRow}>
                                <IconMC name="calendar-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={[styles.textInput, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', paddingHorizontal: 0 }]}
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
                                <Text style={styles.confirmBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Manage Sub-categories Drawer */}
            <Modal visible={showManageSubCats} transparent animationType="slide" onRequestClose={() => setShowManageSubCats(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <View style={styles.manageSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage Indicators</Text>
                            {selectedCategory && (
                                <View style={[styles.catBadge, { backgroundColor: `${selectedCategory.color}15` }]}>
                                    <IconMC name={selectedCategory.icon || 'tag'} size={12} color={selectedCategory.color} />
                                    <Text style={[styles.catBadgeText, { color: selectedCategory.color }]}>{selectedCategory.name}</Text>
                                </View>
                            )}
                        </View>

                        <ScrollView style={styles.manageSubCatList} showsVerticalScrollIndicator={false}>
                            {selectedCategory && (subCatsByCategory[selectedCategory.id] || []).map(sc => (
                                <View key={sc.id} style={styles.manageSubCatRow}>
                                    <View style={[styles.subCatDot, { backgroundColor: selectedCategory.color }]} />
                                    <Text style={styles.manageSubCatName}>{sc.name}</Text>
                                    <TouchableOpacity onPress={() => handleDeleteSubCatSafe(sc.id)} style={styles.deleteSubCatBtn}>
                                        <IconMC name="delete-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.addSubCatRow}>
                            <TextInput
                                style={styles.addSubCatInput}
                                value={newSubCatName}
                                onChangeText={setNewSubCatName}
                                placeholder="New indicator name"
                                placeholderTextColor="#94A3B8"
                                onSubmitEditing={handleAddSubCat}
                            />
                            <TouchableOpacity
                                style={[styles.addSubCatBtn, !newSubCatName.trim() && styles.addSubCatBtnDisabled]}
                                onPress={handleAddSubCat}
                                disabled={!newSubCatName.trim()}
                            >
                                <IconMC name="plus" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.confirmBtn} onPress={() => setShowManageSubCats(false)}>
                                <Text style={styles.confirmBtnText}>Done</Text>
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
                            <Text style={styles.modalTitle}>New Health Category</Text>
                            <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                                <IconMC name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                           <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={addCatName}
                                onChangeText={setAddCatName}
                                placeholder="e.g. Cardio, Sleep, Stress"
                                placeholderTextColor="#94A3B8"
                                autoFocus
                            />
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddCategory(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, (!addCatName.trim() || addCatSaving) && styles.confirmBtnDisabled]}
                                onPress={handleAddCategory}
                                disabled={!addCatName.trim() || addCatSaving}
                            >
                                {addCatSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.confirmBtnText}>Create</Text>}
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
                                    {moveType === 'subcategory' ? 'Delete Indicator' : 'Delete Category'}
                                </Text>
                                <Text style={styles.moveSheetSubtitle}>
                                    {moveSourceRecordCount} record{moveSourceRecordCount !== 1 ? 's' : ''} · {formatValue(moveSourceAmount)}
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
                                        <Text style={styles.movePanelAmount}>{formatValue(moveSourceAmount)}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Arrow */}
                            <View style={styles.moveArrowCol}>
                                <IconMC
                                    name="arrow-right-bold"
                                    size={22}
                                    color={moveDestId ? '#0F172A' : '#CBD5E1'}
                                />
                            </View>

                            {/* Right: TO */}
                            <View style={styles.movePanel}>
                                <Text style={styles.movePanelLabel}>TO</Text>
                                <ScrollView style={styles.moveDestList} showsVerticalScrollIndicator={false}>
                                    {moveDestOptions.length === 0 ? (
                                        <View style={styles.moveDestEmpty}>
                                            <Text style={styles.moveDestEmptyText}>No other options</Text>
                                        </View>
                                    ) : (
                                        moveDestOptions.map(opt => {
                                            const selected = moveDestId === opt.id;
                                            return (
                                                <TouchableOpacity
                                                    key={opt.id}
                                                    style={[styles.moveDestItem, selected && styles.moveDestItemSelected]}
                                                    onPress={() => setMoveDestId(opt.id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[styles.movePanelDot, { backgroundColor: opt.color, width: 7, height: 7 }]} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.moveDestItemName, selected && styles.moveDestItemNameSelected]} numberOfLines={1}>
                                                            {opt.label}
                                                        </Text>
                                                        <Text style={styles.moveDestItemSub} numberOfLines={1}>{opt.sublabel}</Text>
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
                        <View style={styles.moveActions}>
                            <TouchableOpacity
                                style={[styles.moveTransferBtn, (!moveDestId || moveWorking) && styles.moveTransferBtnDisabled]}
                                onPress={handleMoveTransfer}
                                disabled={!moveDestId || moveWorking}
                            >
                                <IconMC name="swap-horizontal" size={15} color={moveDestId && !moveWorking ? '#FFFFFF' : '#94A3B8'} />
                                <Text style={[styles.moveTransferBtnText, (!moveDestId || moveWorking) && { color: '#94A3B8' }]}>
                                    Transfer
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.moveDeleteBtn, moveWorking && { opacity: 0.5 }]}
                                onPress={handleMoveDeleteAll}
                                disabled={moveWorking}
                            >
                                <IconMC name="delete-outline" size={15} color="#EF4444" />
                                <Text style={styles.moveDeleteBtnText}>Delete All</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    loadingContainer: { padding: 40, alignItems: 'center' },
    accordionContainer: { padding: 16 },
    accordionSection: { marginBottom: 12, borderRadius: 16, backgroundColor: '#F8FAFC', overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    accordionSectionExpanded: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, borderColor: '#E2E8F0' },
    accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F8FAFC' },
    accordionHeaderActive: { backgroundColor: '#10B981' },
    accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    accordionIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    accordionIconActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    accordionLabel: { fontSize: 16, fontWeight: '600', color: '#475569' },
    accordionLabelActive: { color: '#FFFFFF' },
    accordionHeaderRight: { flexDirection: 'row', alignItems: 'center' },
    accordionTotal: { fontSize: 14, fontWeight: '700', color: '#64748B', marginRight: 12 },
    accordionTotalActive: { color: '#FFFFFF' },
    accordionContent: { maxHeight: 500 },
    categoriesList: {
        marginTop: 4,
    },
    section: { padding: 16 },
    chartCard: { padding: 20, backgroundColor: '#F8FAFC', borderRadius: 20, marginBottom: 16 },
    chartHeader: { marginBottom: 20 },
    chartLabel: { fontSize: 13, color: '#64748B', marginBottom: 4 },
    chartValue: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
    chartContainer: { height: 60, justifyContent: 'flex-end' },
    chartMock: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' },
    chartBar: { width: '10%', backgroundColor: '#CBD5E1', borderRadius: 4 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statCard: { width: '48%', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16 },
    statLabel: { fontSize: 12, color: '#64748B', marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    gaugeContainer: { flexDirection: 'row', alignItems: 'baseline' },
    balanceCard: { padding: 16, backgroundColor: '#F0FDF4', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    balanceLabel: { fontSize: 14, fontWeight: '600', color: '#166534' },
    balanceAmount: { fontSize: 18, fontWeight: '800', color: '#10B981' },
    topSummaryHeader: { alignItems: 'center', marginBottom: 24, paddingVertical: 10 },
    topSummaryLabel: { fontSize: 14, color: '#64748B', marginBottom: 4 },
    topSummaryValue: { fontSize: 32, fontWeight: '800' },
    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    addCatInlineBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#F1F5F9' },
    addCatInlineBtnText: { fontSize: 12, fontWeight: '600', color: '#64748B', marginLeft: 4 },
    categoryBarRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    categoryMainInfo: { flex: 1, paddingRight: 10 },
    categoryLabelGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    catBarLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
    categoryBarDetails: { flexDirection: 'row', alignItems: 'center' },
    catBarPercentText: { fontSize: 11, fontWeight: '700', width: 35 },
    catBarMiniTrack: { flex: 1, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
    catBarFill: { height: '100%', borderRadius: 2 },
    categoryAmountGroup: { flexDirection: 'row', alignItems: 'center' },
    catBarAmount: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    emptyCatRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', marginBottom: 8 },
    emptyCatIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    emptyCatText: { flex: 1, fontSize: 14, color: '#64748B', fontWeight: '500' },
    detailTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backLink: { flexDirection: 'row', alignItems: 'center' },
    backLinkText: { fontSize: 14, fontWeight: '600', color: '#64748B', marginLeft: 4 },
    detailTopActions: { flexDirection: 'row', alignItems: 'center' },
    manageBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginRight: 8 },
    manageBtnText: { fontSize: 12, fontWeight: '600', color: '#475569', marginLeft: 6 },
    deleteCatBtn: { padding: 6 },
    detailHero: { padding: 20, backgroundColor: '#F8FAFC', borderRadius: 20, borderLeftWidth: 6, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    detailIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    detailTitle: { fontSize: 16, color: '#64748B', marginBottom: 2 },
    detailAmount: { fontSize: 28, fontWeight: '800' },
    detailSectionLabel: { fontSize: 14, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    subCatsList: { marginBottom: 20 },
    subCatCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8, overflow: 'hidden' },
    subCatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    subCatDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    subCatName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#334155' },
    subCatMeta: { alignItems: 'flex-end', marginRight: 12 },
    subCatCount: { fontSize: 11, color: '#94A3B8', marginBottom: 2 },
    subCatTotal: { fontSize: 15, fontWeight: '700' },
    subCatContent: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    itemRowLeft: { flexDirection: 'row', alignItems: 'center' },
    itemDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10, opacity: 0.5 },
    itemName: { fontSize: 14, color: '#475569', fontWeight: '500' },
    itemDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    itemRight: { flexDirection: 'row', alignItems: 'center' },
    itemAmount: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginRight: 8 },
    deleteRecordBtn: { padding: 4 },
    emptyItems: { padding: 20, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, marginTop: 8 },
    emptyItemsText: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
    emptyItemsAddBtn: { flexDirection: 'row', alignItems: 'center' },
    emptyItemsAddBtnText: { fontSize: 12, fontWeight: '700' },
    addRecordInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderRadius: 12, marginTop: 12 },
    addRecordInlineText: { fontSize: 13, fontWeight: '700', marginLeft: 6 },
    emptySubCats: {
        padding: 28,
        alignItems: 'center',
        gap: 6,
    },
    emptySubCatsText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    emptySubCatsAction: {
        marginTop: 4,
    },
    emptySubCatsActionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    manageSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, height: '80%' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    modalBody: { marginBottom: 24 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8 },
    textInput: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 16, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    dateInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
    cancelBtnText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
    confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center' },
    confirmBtnDisabled: { backgroundColor: '#CBD5E1' },
    confirmBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    subCatBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    catBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    catBadgeText: { fontSize: 12, fontWeight: '600' },
    subCatBadgeText: { fontSize: 12, fontWeight: '600', color: '#475569' },
    manageSubCatList: { flex: 1, marginBottom: 20 },
    manageSubCatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    manageSubCatName: { flex: 1, fontSize: 15, color: '#334155', fontWeight: '500' },
    deleteSubCatBtn: { padding: 4 },
    addSubCatRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    addSubCatInput: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E2E8F0' },
    addSubCatBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    addSubCatBtnDisabled: { backgroundColor: '#CBD5E1' },
    moveSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36, height: '80%' },
    moveSheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    moveSheetSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 3, fontWeight: '500' },
    movePanels: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 16, gap: 4, minHeight: 200 },
    movePanel: { flex: 1 },
    movePanelLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 },
    movePanelCard: { borderWidth: 1.5, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F8FAFC' },
    movePanelDot: { width: 9, height: 9, borderRadius: 5, marginTop: 3 },
    movePanelName: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
    movePanelSub: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
    movePanelMeta: { fontSize: 11, color: '#64748B', fontWeight: '500' },
    movePanelAmount: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 4 },
    moveArrowCol: { width: 28, justifyContent: 'center', alignItems: 'center', paddingTop: 52 },
    moveDestList: { maxHeight: 220, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#F8FAFC' },
    moveDestEmpty: { padding: 20, alignItems: 'center' },
    moveDestEmptyText: { fontSize: 13, color: '#94A3B8' },
    moveDestItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 8 },
    moveDestItemSelected: { backgroundColor: '#F0F9FF' },
    moveDestItemName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
    moveDestItemNameSelected: { color: '#0F172A', fontWeight: '700' },
    moveDestItemSub: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
    moveActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
    moveTransferBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: '#0F172A' },
    moveTransferBtnDisabled: { backgroundColor: '#F1F5F9' },
    moveTransferBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    moveDeleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
    moveDeleteBtnText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
});
