import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './healthStyles';
import { HealthCategoryBar } from './HealthCategoryBar';
import { HealthCategory } from '../../../services/health/HealthService';

interface HealthCategoryListProps {
    title: string;
    categories: HealthCategory[];
    total: number;
    tabId: string;
    emptyLabel: string;
    emptyIcon: string;
    emptySection: string;
    emptyType: string;
    emptyColor: string;
    getCatTotal: (id: string) => number;
    onSelect: (cat: HealthCategory, tabId: string) => void;
    onAddCategory: (section: string, type: string) => void;
}

export const HealthCategoryList: React.FC<HealthCategoryListProps> = ({
    title, categories, total, tabId,
    emptyLabel, emptyIcon, emptySection, emptyType, emptyColor,
    getCatTotal, onSelect, onAddCategory
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
                        <Text style={styles.emptyCatText}>Add {emptyLabel}</Text>
                        <IconMC name="plus-circle-outline" size={18} color={emptyColor} />
                    </TouchableOpacity>
                ) : (
                    categories.map(cat => (
                        <HealthCategoryBar
                            key={cat.id}
                            cat={cat}
                            total={total}
                            tabId={tabId}
                            catTotal={getCatTotal(cat.id)}
                            onSelect={onSelect}
                        />
                    ))
                )}
            </View>
        </>
    );
};
