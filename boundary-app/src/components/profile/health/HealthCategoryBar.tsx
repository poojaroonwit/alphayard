import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './healthStyles';
import { formatScore } from './healthUtils';
import { HealthCategory } from '../../../services/health/HealthService';

interface HealthCategoryBarProps {
    cat: HealthCategory;
    total: number;
    tabId: string;
    catTotal: number;
    onSelect: (cat: HealthCategory, tabId: string) => void;
}

export const HealthCategoryBar: React.FC<HealthCategoryBarProps> = ({
    cat, total, tabId, catTotal, onSelect
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
                <Text style={styles.catBarAmount}>{formatScore(catTotal)}</Text>
                <IconMC name="chevron-right" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
            </View>
        </TouchableOpacity>
    );
};
