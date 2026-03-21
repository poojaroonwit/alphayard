import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './financeStyles';
import { formatCurrency } from './financeUtils';
import { FinanceCategory } from '../../../services/financeService';

interface FinanceCategoryBarProps {
    cat: FinanceCategory;
    total: number;
    tabId: string;
    catTotal: number;
    onSelect: (cat: FinanceCategory, tabId: string) => void;
    onMenu: (cat: FinanceCategory) => void;
}

export const FinanceCategoryBar: React.FC<FinanceCategoryBarProps> = ({
    cat, total, tabId, catTotal, onSelect, onMenu
}) => {
    const { id, name, color, icon } = cat;
    const percentage = total > 0 ? (catTotal / total) * 100 : 0;
    return (
        <TouchableOpacity style={styles.categoryBarRow} onPress={() => onSelect(cat, tabId)} activeOpacity={0.7}>
            <View style={styles.categoryMainInfo}>
                <View style={styles.categoryLabelGroup}>
                    <IconMC name={icon || 'tag'} size={18} color={color} style={{ marginRight: 8 }} />
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
                <Text style={styles.catBarAmount}>{formatCurrency(catTotal)}</Text>
                <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); onMenu(cat); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: 6 }}
                >
                    <IconMC name="dots-vertical" size={18} color="#94A3B8" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};
