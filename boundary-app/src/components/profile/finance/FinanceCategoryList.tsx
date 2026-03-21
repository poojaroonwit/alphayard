import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './financeStyles';
import { FinanceCategoryBar } from './FinanceCategoryBar';
import { FinanceCategory } from '../../../services/financeService';

interface FinanceCategoryListProps {
    title: string;
    categories: FinanceCategory[];
    total: number;
    tabId: string;
    emptyIcon: string;
    emptySection: string;
    emptyType: string;
    emptyColor: string;
    getCatTotal: (id: string) => number;
    onSelect: (cat: FinanceCategory, tabId: string) => void;
    onMenu: (cat: FinanceCategory) => void;
    onAddCategory: (section: string, type: string) => void;
}

export const FinanceCategoryList: React.FC<FinanceCategoryListProps> = ({
    title, categories, total, tabId,
    emptyIcon, emptySection, emptyType, emptyColor,
    getCatTotal, onSelect, onMenu, onAddCategory
}) => {
    return (
        <>
            <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <TouchableOpacity onPress={() => onAddCategory(emptySection, emptyType)} style={styles.addCatInlineBtn}>
                    <IconMC name="plus" size={14} color="#64748B" />
                    <Text style={styles.addCatInlineBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.categoriesList}>
                {categories.length === 0 ? (
                    <TouchableOpacity style={styles.emptyCatRow} onPress={() => onAddCategory(emptySection, emptyType)} activeOpacity={0.7}>
                        <View style={[styles.emptyCatIcon, { backgroundColor: `${emptyColor}12` }]}>
                            <IconMC name={emptyIcon} size={18} color={emptyColor} />
                        </View>
                        <Text style={styles.emptyCatText}>Add {emptyType} category</Text>
                        <IconMC name="plus-circle-outline" size={18} color={emptyColor} />
                    </TouchableOpacity>
                ) : (
                    categories.map(cat => (
                        <FinanceCategoryBar
                            key={cat.id}
                            cat={cat}
                            total={total}
                            tabId={tabId}
                            catTotal={getCatTotal(cat.id)}
                            onSelect={onSelect}
                            onMenu={onMenu}
                        />
                    ))
                )}
            </View>
        </>
    );
};
