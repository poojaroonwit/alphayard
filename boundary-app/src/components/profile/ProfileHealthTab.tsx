import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
    Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './health/healthStyles';
import { todayStr, formatDate, formatScore, SUB_TABS } from './health/healthUtils';
import { HealthCategoryList } from './health/HealthCategoryList';
import { HealthSummary } from './health/HealthSummary';
import { CircleSelectionTabs } from '../common/CircleSelectionTabs';
import {
    healthService,
    HealthCategory,
    HealthSubCategory,
    HealthRecord,
} from '../../services/health/HealthService';

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

interface ProfileHealthTabProps {
    userId?: string;
    useScrollView?: boolean;
    tabsConfig?: TabsConfig;
}

export const ProfileHealthTab: React.FC<ProfileHealthTabProps> = ({ tabsConfig }) => {
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
    // "assets" section → Positives (healthy habits, exercises, nutrition, sleep)
    const positiveCategories = categories.filter(c => c.section === 'assets');
    // "liabilities" section → Negatives (health risks, bad habits, stressors)
    const negativeCategories = categories.filter(c => c.section === 'liabilities');
    // "flow" section inputs → Activity inputs (exercises done)
    const inputCats = categories.filter(c => c.type === 'input');
    // "flow" section outputs → Activity outputs (burnout/risk activity)
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

    const totalPositives = positiveCategories.reduce((s, c) => s + getCatTotal(c.id), 0);
    const totalNegatives = negativeCategories.reduce((s, c) => s + getCatTotal(c.id), 0);
    const totalInput = inputCats.reduce((s, c) => s + getCatTotal(c.id), 0);
    const totalOutput = outputCats.reduce((s, c) => s + getCatTotal(c.id), 0);
    const netActivity = totalInput - totalOutput;
    // Wellness Rate: ratio of input effort to total activity
    const wellnessRate = totalInput > 0 ? (totalInput - totalOutput) / totalInput : 0;
    // Health Score = positives - negatives (Health Goal Progress)
    const healthScore = Math.max(0, totalPositives - totalNegatives);
    // Health Goal Progress: assume goal is 2x current negatives as target
    const healthGoalTarget = totalNegatives > 0 ? totalNegatives * 2 : totalPositives;
    const healthGoalPercentage = healthGoalTarget > 0 ? Math.min(1, totalPositives / healthGoalTarget) : 0;

    const tabTotals: Record<string, string> = {
        summary: formatScore(healthScore),
        positives: formatScore(totalPositives),
        negatives: formatScore(totalNegatives),
        activity: (netActivity >= 0 ? '+' : '') + formatScore(netActivity),
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

    const handleDeleteRecord = async (recordId: string) => {
        await healthService.deleteRecord(recordId);
        await loadCategories();
    };

    const openAddCategory = (section: string, type: string) => {
        setAddCatSection(section);
        setAddCatType(type);
        setAddCatName('');
        setShowAddCategory(true);
    };

    const handleAddCategory = async () => {
        if (!addCatName.trim()) return;
        setAddCatSaving(true);
        const defaultsByType: Record<string, { color: string; icon: string }> = {
            asset: { color: '#10B981', icon: 'heart-plus-outline' },
            liability: { color: '#EF4444', icon: 'heart-minus-outline' },
            input: { color: '#3B82F6', icon: 'arrow-down-circle-outline' },
            output: { color: '#F59E0B', icon: 'arrow-up-circle-outline' },
        };
        const defaults = defaultsByType[addCatType] || { color: '#64748B', icon: 'tag' };
        await healthService.createCategory({
            name: addCatName.trim(),
            section: addCatSection,
            type: addCatType,
            color: defaults.color,
            icon: defaults.icon,
        });
        setAddCatSaving(false);
        setShowAddCategory(false);
        await loadCategories();
    };

    // ── Safe delete: checks for records before deleting ────────────────────────
    const openMoveDrawer = (type: 'subcategory' | 'category', sourceId: string) => {
        setMoveType(type);
        setMoveSourceId(sourceId);
        setMoveDestId(null);
        setMoveWorking(false);
        setShowMoveDrawer(true);
    };

    const handleDeleteSubCatSafe = (subCatId: string) => {
        const recs = recordsBySubCat[subCatId] || [];
        if (recs.length === 0) {
            healthService.deleteSubCategory(subCatId).then(loadCategories);
        } else {
            openMoveDrawer('subcategory', subCatId);
        }
    };

    const handleDeleteCategorySafe = () => {
        if (!selectedCategory) return;
        const total = getCatTotal(selectedCategory.id);
        if (total === 0 && (subCatsByCategory[selectedCategory.id] || []).length === 0) {
            healthService.deleteCategory(selectedCategory.id).then(() => {
                handleBackFromDetail();
                loadCategories();
            });
        } else {
            openMoveDrawer('category', selectedCategory.id);
        }
    };

    // Transfer records/sub-cats to destination, then delete source
    const handleMoveTransfer = async () => {
        if (!moveSourceId || !moveDestId) return;
        setMoveWorking(true);
        try {
            if (moveType === 'subcategory') {
                const recs = recordsBySubCat[moveSourceId] || [];
                for (const r of recs) {
                    await healthService.createRecord(moveDestId, {
                        name: r.name,
                        amount: Number(r.amount),
                        date: r.recordDate.slice(0, 10),
                        note: r.note,
                    });
                }
                await healthService.deleteSubCategory(moveSourceId);
            } else {
                // category: create sub-cats in dest category, move records
                const srcSubCats = subCatsByCategory[moveSourceId] || [];
                for (const sc of srcSubCats) {
                    const newSc = await healthService.createSubCategory(moveDestId, sc.name);
                    const recs = recordsBySubCat[sc.id] || [];
                    for (const r of recs) {
                        await healthService.createRecord(newSc.id, {
                            name: r.name,
                            amount: Number(r.amount),
                            date: r.recordDate.slice(0, 10),
                            note: r.note,
                        });
                    }
                }
                await healthService.deleteCategory(moveSourceId);
                handleBackFromDetail();
            }
        } finally {
            setShowMoveDrawer(false);
            setMoveSourceId(null);
            setMoveWorking(false);
            await loadCategories();
        }
    };

    // Delete source (and all its records) without moving
    const handleMoveDeleteAll = async () => {
        if (!moveSourceId) return;
        setMoveWorking(true);
        try {
            if (moveType === 'subcategory') {
                await healthService.deleteSubCategory(moveSourceId);
            } else {
                await healthService.deleteCategory(moveSourceId);
                handleBackFromDetail();
            }
        } finally {
            setShowMoveDrawer(false);
            setMoveSourceId(null);
            setMoveWorking(false);
            await loadCategories();
        }
    };

    // ── Move drawer derived data ────────────────────────────────────────────────
    const moveSourceSubCat = moveType === 'subcategory' && moveSourceId
        ? (() => {
            for (const cat of categories) {
                const sc = cat.subCategories.find(s => s.id === moveSourceId);
                if (sc) return { sc, cat };
            }
            return null;
        })()
        : null;

    const moveSourceCat = moveType === 'category' && moveSourceId
        ? categories.find(c => c.id === moveSourceId) ?? null
        : null;

    const moveSourceRecordCount = moveType === 'subcategory'
        ? (recordsBySubCat[moveSourceId!] || []).length
        : moveSourceCat
            ? (subCatsByCategory[moveSourceCat.id] || []).reduce((s, sc) => s + (recordsBySubCat[sc.id] || []).length, 0)
            : 0;

    const moveSourceAmount = moveType === 'subcategory'
        ? (recordsBySubCat[moveSourceId!] || []).reduce((s, r) => s + Number(r.amount), 0)
        : moveSourceCat ? getCatTotal(moveSourceCat.id) : 0;

    // Flat list of destination options
    const moveDestOptions = moveType === 'subcategory'
        ? categories.flatMap(cat =>
            cat.subCategories
                .filter(sc => sc.id !== moveSourceId)
                .map(sc => ({ id: sc.id, label: sc.name, sublabel: cat.name, color: cat.color }))
        )
        : categories
            .filter(c => c.id !== moveSourceId)
            .map(c => ({ id: c.id, label: c.name, sublabel: c.section, color: c.color }));

    // ── Sub-components ─────────────────────────────────────────────────────────
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

    // ── Tab renderers ──────────────────────────────────────────────────────────
    const renderSummary = () => (
        <HealthSummary
            healthScore={healthScore}
            wellnessRate={wellnessRate}
            healthGoalPercentage={healthGoalPercentage}
            netActivity={netActivity}
        />
    );

    const renderPositives = () => (
        <View style={styles.section}>
            <View style={styles.topSummaryHeader}>
                <Text style={styles.topSummaryLabel}>Total Positives</Text>
                <Text style={[styles.topSummaryValue, { color: '#10B981' }]}>{formatScore(totalPositives)}</Text>
            </View>
            <HealthCategoryList
                title="Healthy Habits & Strengths"
                categories={positiveCategories}
                total={totalPositives}
                tabId="positives"
                emptyLabel="positive category"
                emptyIcon="heart-plus-outline"
                emptySection="assets"
                emptyType="asset"
                emptyColor="#10B981"
                getCatTotal={getCatTotal}
                onSelect={handleCategorySelect}
                onAddCategory={openAddCategory}
            />
        </View>
    );

    const renderNegatives = () => (
        <View style={styles.section}>
            <View style={styles.topSummaryHeader}>
                <Text style={[styles.topSummaryLabel, { color: '#BE123C' }]}>Total Negatives</Text>
                <Text style={[styles.topSummaryValue, { color: '#E11D48' }]}>{formatScore(totalNegatives)}</Text>
            </View>
            <HealthCategoryList
                title="Health Risks & Stressors"
                categories={negativeCategories}
                total={totalNegatives}
                tabId="negatives"
                emptyLabel="negative category"
                emptyIcon="heart-minus-outline"
                emptySection="liabilities"
                emptyType="liability"
                emptyColor="#E11D48"
                getCatTotal={getCatTotal}
                onSelect={handleCategorySelect}
                onAddCategory={openAddCategory}
            />
        </View>
    );

    const renderActivity = () => (
        <View style={styles.section}>
            <View style={styles.topSummaryHeader}>
                <Text style={[styles.topSummaryLabel, { color: '#134E4A' }]}>Net Activity</Text>
                <Text style={[styles.topSummaryValue, { color: netActivity >= 0 ? '#10B981' : '#EF4444' }]}>
                    {netActivity >= 0 ? '+' : ''}{formatScore(netActivity)}
                </Text>
            </View>
            <HealthCategoryList
                title="Daily Exercises Done"
                categories={inputCats}
                total={totalInput}
                tabId="activity"
                emptyLabel="activity input"
                emptyIcon="arrow-down-circle-outline"
                emptySection="flow"
                emptyType="input"
                emptyColor="#10B981"
                getCatTotal={getCatTotal}
                onSelect={handleCategorySelect}
                onAddCategory={openAddCategory}
            />
            <View style={{ marginTop: 24 }} />
            <HealthCategoryList
                title="Health Burnout & Risks"
                categories={outputCats}
                total={totalOutput}
                tabId="activity"
                emptyLabel="activity output"
                emptyIcon="arrow-up-circle-outline"
                emptySection="flow"
                emptyType="output"
                emptyColor="#EF4444"
                getCatTotal={getCatTotal}
                onSelect={handleCategorySelect}
                onAddCategory={openAddCategory}
            />
        </View>
    );

    // ── Category detail ────────────────────────────────────────────────────────
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
                        <Text style={[styles.detailAmount, { color }]}>{formatScore(totalAmount)}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.detailStatsRow}>
                    <View style={styles.detailStatCard}>
                        <Text style={styles.detailStatLabel}>Sub-cats</Text>
                        <Text style={styles.detailStatValue}>{subCats.length}</Text>
                    </View>
                    <View style={styles.detailStatCard}>
                        <Text style={styles.detailStatLabel}>Records</Text>
                        <Text style={styles.detailStatValue}>{totalRecords}</Text>
                    </View>
                    <View style={styles.detailStatCard}>
                        <Text style={styles.detailStatLabel}>Avg. Value</Text>
                        <Text style={styles.detailStatValue}>
                            {totalRecords > 0 ? formatScore(Math.round(totalAmount / totalRecords)) : '—'}
                        </Text>
                    </View>
                    <View style={styles.detailStatCard}>
                        <Text style={styles.detailStatLabel}>Largest</Text>
                        <Text style={styles.detailStatValue}>{largest ? formatScore(Number((largest as HealthRecord).amount)) : '—'}</Text>
                    </View>
                </View>

                {/* Sub-category sections */}
                <Text style={styles.detailSectionLabel}>Sub-categories</Text>

                {subCats.length === 0 ? (
                    <View style={styles.emptySubCats}>
                        <IconMC name="tag-multiple-outline" size={28} color="#CBD5E1" />
                        <Text style={styles.emptySubCatsText}>No sub-categories yet</Text>
                        <TouchableOpacity style={styles.emptySubCatsAction} onPress={() => setShowManageSubCats(true)}>
                            <Text style={[styles.emptySubCatsActionText, { color }]}>Add sub-category</Text>
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
                                            <Text style={[styles.subCatTotal, { color }]}>{formatScore(scTotal)}</Text>
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
                                                            <Text style={styles.itemAmount}>{formatScore(Number(r.amount))}</Text>
                                                            <TouchableOpacity
                                                                onPress={() => handleDeleteRecord(r.id)}
                                                                style={styles.deleteRecordBtn}
                                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                            >
                                                                <IconMC name="close" size={14} color="#CBD5E1" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))
                                            ) : (
                                                <TouchableOpacity style={styles.emptyItems} onPress={() => openAddRecord(sc.id)} activeOpacity={0.7}>
                                                    <Text style={styles.emptyItemsText}>No records yet</Text>
                                                    <View style={styles.emptyItemsAddBtn}>
                                                        <IconMC name="plus" size={12} color={color} />
                                                        <Text style={[styles.emptyItemsAddBtnText, { color }]}>Add record</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                style={[styles.addRecordInline, { borderColor: color }]}
                                                onPress={() => openAddRecord(sc.id)}
                                            >
                                                <IconMC name="plus" size={14} color={color} />
                                                <Text style={[styles.addRecordInlineText, { color }]}>Add Record</Text>
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
            case 'positives': return renderPositives();
            case 'negatives': return renderNegatives();
            case 'activity': return renderActivity();
            default: return renderSummary();
        }
    };

    // ── Add Record modal sub-cat label ─────────────────────────────────────────
    const addRecordSubCat = addRecordSubCatId && selectedCategory
        ? (subCatsByCategory[selectedCategory.id] || []).find(sc => sc.id === addRecordSubCatId)
        : null;

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#64748B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            
            {/* Sub-tabs for Health */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 }}>
                <CircleSelectionTabs
                    activeTab={expandedTab || 'summary'}
                    onTabPress={(id) => setExpandedTab(id)}
                    tabs={SUB_TABS}
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

            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
            >
                {renderTabContent(expandedTab || 'summary')}
            </ScrollView>
        {/* Add Record Modal */}
            <Modal visible={showAddRecord} transparent animationType="slide" onRequestClose={() => setShowAddRecord(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setShowAddRecord(false)} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay} pointerEvents="box-none">
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Record</Text>
                            {addRecordSubCat && selectedCategory && (
                                <View style={styles.subCatBadgeRow}>
                                    <View style={[styles.catBadge, { backgroundColor: `${selectedCategory.color}15` }]}>
                                        <IconMC name={selectedCategory.icon || 'tag'} size={12} color={selectedCategory.color} />
                                        <Text style={[styles.catBadgeText, { color: selectedCategory.color }]}>{selectedCategory.name}</Text>
                                    </View>
                                    <IconMC name="chevron-right" size={12} color="#94A3B8" />
                                    <View style={[styles.catBadge, { backgroundColor: '#F1F5F9' }]}>
                                        <Text style={styles.subCatBadgeText}>{addRecordSubCat.name}</Text>
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
                <Pressable style={styles.modalBackdrop} onPress={() => setShowManageSubCats(false)} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay} pointerEvents="box-none">
                    <View style={styles.manageSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Manage Sub-categories</Text>
                            {selectedCategory && (
                                <View style={[styles.catBadge, { backgroundColor: `${selectedCategory.color}15` }]}>
                                    <IconMC name={selectedCategory.icon || 'tag'} size={12} color={selectedCategory.color} />
                                    <Text style={[styles.catBadgeText, { color: selectedCategory.color }]}>{selectedCategory.name}</Text>
                                </View>
                            )}
                        </View>

                        <ScrollView style={styles.manageSubCatList} showsVerticalScrollIndicator={false}>
                            {selectedCategory && (subCatsByCategory[selectedCategory.id] || []).length === 0 && (
                                <View style={styles.emptySubCats}>
                                    <Text style={styles.emptySubCatsText}>No sub-categories yet</Text>
                                </View>
                            )}
                            {selectedCategory && (subCatsByCategory[selectedCategory.id] || []).map(sc => (
                                <View key={sc.id} style={styles.manageSubCatRow}>
                                    <View style={[styles.subCatDot, { backgroundColor: selectedCategory.color, width: 8, height: 8 }]} />
                                    <Text style={styles.manageSubCatName}>{sc.name}</Text>
                                    <Text style={styles.manageSubCatCount}>
                                        {(recordsBySubCat[sc.id] || []).length} records
                                    </Text>
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
                                placeholder="New sub-category name"
                                placeholderTextColor="#94A3B8"
                                returnKeyType="done"
                                onSubmitEditing={handleAddSubCat}
                            />
                            <TouchableOpacity
                                style={[styles.addSubCatBtn, !newSubCatName.trim() && styles.addSubCatBtnDisabled]}
                                onPress={handleAddSubCat}
                                disabled={!newSubCatName.trim()}
                            >
                                <IconMC name="plus" size={20} color={!newSubCatName.trim() ? '#94A3B8' : '#FFFFFF'} />
                            </TouchableOpacity>
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
                <Pressable style={styles.modalBackdrop} onPress={() => setShowAddCategory(false)} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay} pointerEvents="box-none">
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
                                {addCatSection === 'flow' ? (
                                    <>
                                        {[{ v: 'input', label: 'Input', color: '#10B981' }, { v: 'output', label: 'Output', color: '#EF4444' }].map(opt => (
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
                                            {addCatSection === 'assets' ? 'Positive' : 'Negative'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.modalFieldLabel, { marginTop: 16 }]}>Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={addCatName}
                                onChangeText={setAddCatName}
                                placeholder={
                                    addCatSection === 'assets' ? 'e.g. Exercise' :
                                    addCatSection === 'liabilities' ? 'e.g. Bad Habits' :
                                    addCatType === 'input' ? 'e.g. Cardio' : 'e.g. Stress'
                                }
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
                <Pressable style={styles.modalBackdrop} onPress={() => !moveWorking && setShowMoveDrawer(false)} />
                <View style={styles.modalOverlay} pointerEvents="box-none">
                    <View style={styles.moveSheet}>
                        <View style={styles.modalHandle} />
                        <View style={styles.moveSheetHeader}>
                            <View>
                                <Text style={styles.modalTitle}>
                                    {moveType === 'subcategory' ? 'Delete Sub-category' : 'Delete Category'}
                                </Text>
                                <Text style={styles.moveSheetSubtitle}>
                                    {moveSourceRecordCount} record{moveSourceRecordCount !== 1 ? 's' : ''} · {formatScore(moveSourceAmount)}
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
                                        <Text style={styles.movePanelAmount}>{formatScore(moveSourceAmount)}</Text>
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


export default ProfileHealthTab;
