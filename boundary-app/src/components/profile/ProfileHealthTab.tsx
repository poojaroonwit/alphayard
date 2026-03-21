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

const formatScore = (amount: number) =>
    `${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;

const SUB_TABS = [
    { id: 'summary', label: 'Summary', icon: 'chart-pie' },
    { id: 'positives', label: 'Positives', icon: 'heart-plus-outline' },
    { id: 'negatives', label: 'Negatives', icon: 'heart-minus-outline' },
    { id: 'activity', label: 'Activity', icon: 'swap-vertical' },
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
                    <Text style={styles.catBarAmount}>{formatScore(catTotal)}</Text>
                    <IconMC name="chevron-right" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
                </View>
            </TouchableOpacity>
        );
    };

    // ── Tab renderers ──────────────────────────────────────────────────────────
    const renderSummary = () => (
        <View style={styles.section}>
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={styles.chartLabel}>Current Health Score</Text>
                        <Text style={styles.chartValue}>{formatScore(healthScore)}</Text>
                    </View>
                </View>
                <View style={styles.chartContainer}>
                    <View style={styles.chartMock}>
                        {[40, 60, 45, 80, 75, 95, 100].map((h, i) => (
                            <View key={i} style={[styles.chartBar, { height: `${h}%`, opacity: 0.3 + i * 0.1 }]} />
                        ))}
                    </View>
                </View>
            </View>
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Wellness Rate</Text>
                    <View style={styles.gaugeContainer}>
                        <Text style={styles.statValue}>{(wellnessRate * 100).toFixed(0)}%</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Health Goal Progress</Text>
                    <View style={styles.gaugeContainer}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{(healthGoalPercentage * 100).toFixed(0)}%</Text>
                    </View>
                </View>
            </View>
            <View style={[styles.balanceCard, { marginTop: 16 }]}>
                <Text style={styles.balanceLabel}>Net Activity</Text>
                <Text style={styles.balanceAmount}>{formatScore(netActivity)}</Text>
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

    const renderPositives = () => (
        <View style={styles.section}>
            <View style={styles.topSummaryHeader}>
                <Text style={styles.topSummaryLabel}>Total Positives</Text>
                <Text style={[styles.topSummaryValue, { color: '#10B981' }]}>{formatScore(totalPositives)}</Text>
            </View>
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Healthy Habits & Strengths</Text>
                <TouchableOpacity onPress={() => openAddCategory('assets', 'asset')} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {positiveCategories.length === 0
                    ? renderEmptyCats('positive category', 'heart-plus-outline', 'assets', 'asset', '#10B981')
                    : positiveCategories.map(cat => (
                        <CategoryBar key={cat.id} {...cat} total={totalPositives} tabId="positives" />
                    ))
                }
            </View>
        </View>
    );

    const renderNegatives = () => (
        <View style={styles.section}>
            <View style={styles.topSummaryHeader}>
                <Text style={[styles.topSummaryLabel, { color: '#BE123C' }]}>Total Negatives</Text>
                <Text style={[styles.topSummaryValue, { color: '#E11D48' }]}>{formatScore(totalNegatives)}</Text>
            </View>
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Health Risks & Stressors</Text>
                <TouchableOpacity onPress={() => openAddCategory('liabilities', 'liability')} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {negativeCategories.length === 0
                    ? renderEmptyCats('negative category', 'heart-minus-outline', 'liabilities', 'liability', '#E11D48')
                    : negativeCategories.map(cat => (
                        <CategoryBar key={cat.id} {...cat} total={totalNegatives} tabId="negatives" />
                    ))
                }
            </View>
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
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Daily Exercises Done</Text>
                <TouchableOpacity onPress={() => openAddCategory('flow', 'input')} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {inputCats.length === 0
                    ? renderEmptyCats('activity input', 'arrow-down-circle-outline', 'flow', 'input', '#10B981')
                    : inputCats.map(cat => (
                        <CategoryBar key={cat.id} {...cat} total={totalInput} tabId="activity" />
                    ))
                }
            </View>
            <View style={[styles.sectionTitleRow, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>Health Burnout & Risks</Text>
                <TouchableOpacity onPress={() => openAddCategory('flow', 'output')} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {outputCats.length === 0
                    ? renderEmptyCats('activity output', 'arrow-up-circle-outline', 'flow', 'output', '#EF4444')
                    : outputCats.map(cat => (
                        <CategoryBar key={cat.id} {...cat} total={totalOutput} tabId="activity" />
                    ))
                }
            </View>
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
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
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
                <View style={styles.modalOverlay}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
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
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    categoriesList: {
        marginTop: 4,
    },
    topSummaryHeader: {
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    topSummaryLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    topSummaryValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        marginTop: 4,
        letterSpacing: -0.5,
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        width: 80,
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
        height: 4,
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
    // Accordion
    accordionContainer: {
        flex: 1,
    },
    accordionSection: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    accordionSectionExpanded: {
        flex: 1,
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 9,
        paddingHorizontal: 14,
        backgroundColor: '#FFFFFF',
    },
    accordionHeaderActive: {
        backgroundColor: '#0F172A',
    },
    accordionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accordionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    accordionIconContainer: {
        width: 26,
        height: 26,
        borderRadius: 6,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    accordionIconActive: {
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    accordionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    accordionLabelActive: {
        color: '#FFFFFF',
    },
    accordionTotal: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
    accordionTotalActive: {
        color: 'rgba(255,255,255,0.7)',
    },
    accordionContent: {
        flex: 1,
    },
    // Summary chart
    chartCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
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
        backgroundColor: '#10B981',
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
        color: '#10B981',
    },
    // Detail view
    detailTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backLinkText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 4,
    },
    manageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    manageBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    detailHero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingLeft: 12,
        borderLeftWidth: 3,
    },
    detailIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    detailTitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    detailAmount: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 2,
    },
    detailStatsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    detailStatCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
    },
    detailStatLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '500',
        marginBottom: 4,
    },
    detailStatValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
    },
    detailSectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    // Sub-category cards
    subCatsList: {
        gap: 8,
    },
    subCatCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    subCatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
    },
    subCatDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    subCatName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    subCatMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    subCatCount: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    subCatTotal: {
        fontSize: 13,
        fontWeight: '700',
    },
    subCatContent: {
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
        paddingHorizontal: 4,
        paddingBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    itemRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    itemDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    itemName: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    itemDate: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    itemAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    deleteRecordBtn: {
        padding: 2,
    },
    emptyItems: {
        padding: 16,
        alignItems: 'center',
    },
    emptyItemsText: {
        color: '#94A3B8',
        fontSize: 13,
    },
    addRecordInline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderStyle: 'dashed',
        borderWidth: 1,
        gap: 4,
    },
    addRecordInlineText: {
        fontSize: 13,
        fontWeight: '600',
    },
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
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 32,
    },
    modalHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    modalBody: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 6,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 15,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    dateInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        backgroundColor: '#F8FAFC',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#0F172A',
        alignItems: 'center',
    },
    confirmBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Badges
    subCatBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    catBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    catBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    subCatBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    // Manage sub-cats drawer
    manageSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 36,
        maxHeight: '75%',
    },
    manageSubCatList: {
        maxHeight: 280,
        paddingHorizontal: 20,
    },
    manageSubCatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        gap: 10,
    },
    manageSubCatName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#1E293B',
    },
    manageSubCatCount: {
        fontSize: 12,
        color: '#94A3B8',
    },
    deleteSubCatBtn: {
        padding: 4,
    },
    addSubCatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 4,
    },
    addSubCatInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    addSubCatBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addSubCatBtnDisabled: {
        backgroundColor: '#E2E8F0',
    },
    // Section title row with add button
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    addCatInlineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    addCatInlineBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    // Empty category row
    emptyCatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
        backgroundColor: '#FAFAFA',
    },
    emptyCatIcon: {
        width: 34,
        height: 34,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCatText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
    },
    // Empty record state with add button
    emptyItemsAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    emptyItemsAddBtnText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Add Category modal
    modalFieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 6,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 15,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    modalSaveBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#0F172A',
        alignItems: 'center',
    },
    modalSaveBtnDisabled: {
        backgroundColor: '#CBD5E1',
    },
    modalSaveText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    catTypeRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    catTypeChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    catTypeChipActive: {
        backgroundColor: '#0F172A',
        borderColor: '#0F172A',
    },
    catTypeChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    // Detail top bar actions
    detailTopActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteCatBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Move-before-delete drawer
    moveSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 36,
    },
    moveSheetHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    moveSheetSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 3,
        fontWeight: '500',
    },
    movePanels: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 12,
        paddingTop: 16,
        gap: 4,
        minHeight: 200,
    },
    movePanel: {
        flex: 1,
    },
    movePanelLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    movePanelCard: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F8FAFC',
    },
    movePanelDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginTop: 3,
    },
    movePanelName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    movePanelSub: {
        fontSize: 11,
        color: '#94A3B8',
        marginBottom: 4,
    },
    movePanelMeta: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    movePanelAmount: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 4,
    },
    moveArrowCol: {
        width: 28,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 52,
    },
    moveDestList: {
        maxHeight: 220,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
    },
    moveDestEmpty: {
        padding: 20,
        alignItems: 'center',
    },
    moveDestEmptyText: {
        fontSize: 13,
        color: '#94A3B8',
    },
    moveDestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 8,
    },
    moveDestItemSelected: {
        backgroundColor: '#F0F9FF',
    },
    moveDestItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
    },
    moveDestItemNameSelected: {
        color: '#0F172A',
        fontWeight: '700',
    },
    moveDestItemSub: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 1,
    },
    moveActions: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    moveTransferBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#0F172A',
    },
    moveTransferBtnDisabled: {
        backgroundColor: '#F1F5F9',
    },
    moveTransferBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    moveDeleteBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    moveDeleteBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EF4444',
    },
});

export default ProfileHealthTab;
