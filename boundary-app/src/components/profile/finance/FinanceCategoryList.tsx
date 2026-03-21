import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './financeStyles';
import { formatCurrency } from './financeUtils';
import { FinanceCategory } from '../../../services/financeService';

interface FinanceCategoryListProps {
    categories: FinanceCategory[];
    onSelect: (cat: FinanceCategory, tabId?: string) => void;
    onMenu?: (cat: FinanceCategory) => void;
    tabId?: string;
}

const getCatTotal = (cat: FinanceCategory) =>
    cat.subCategories.reduce((a, sc) =>
        a + sc.records.reduce((r, rec) => r + rec.amount, 0), 0);

export const FinanceCategoryList: React.FC<FinanceCategoryListProps> = ({
    categories, onSelect, onMenu, tabId = '',
}) => {
    const total = categories.reduce((sum, cat) => sum + getCatTotal(cat), 0);

    return (
        <View style={styles.categoriesList}>
            {categories.map(cat => {
                const catTotal = getCatTotal(cat);
                const percentage = total > 0 ? (catTotal / total) * 100 : 0;
                return (
                    <TouchableOpacity
                        key={cat.id}
                        style={styles.categoryBarRow}
                        onPress={() => onSelect(cat, tabId)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.categoryMainInfo}>
                            <View style={styles.categoryLabelGroup}>
                                <IconMC name={cat.icon || 'tag'} size={18} color={cat.color} style={{ marginRight: 8 }} />
                                <Text style={styles.catBarLabel} numberOfLines={1}>{cat.name}</Text>
                            </View>
                            <View style={styles.categoryBarDetails}>
                                <Text style={[styles.catBarPercentText, { color: cat.color }]}>{percentage.toFixed(0)}%</Text>
                                <View style={styles.catBarMiniTrack}>
                                    <View style={[styles.catBarFill, { width: `${percentage}%` as any, backgroundColor: cat.color }]} />
                                </View>
                            </View>
                        </View>
                        <View style={styles.categoryAmountGroup}>
                            <Text style={styles.catBarAmount}>{formatCurrency(catTotal)}</Text>
                            {onMenu && (
                                <TouchableOpacity
                                    onPress={(e) => { e.stopPropagation(); onMenu(cat); }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    style={{ marginLeft: 6 }}
                                >
                                    <IconMC name="dots-vertical" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
