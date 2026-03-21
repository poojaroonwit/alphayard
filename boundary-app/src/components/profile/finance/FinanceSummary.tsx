import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './financeStyles';
import { formatCurrency } from './financeUtils';

interface FinanceSummaryProps {
    totalAssets: number;
    totalDebts: number;
    savingsRate: number;
    fiPercentage: number;
    netCashFlow: number;
}

export const FinanceSummary: React.FC<FinanceSummaryProps> = ({
    totalAssets, totalDebts, savingsRate, fiPercentage, netCashFlow
}) => {
    return (
        <View style={styles.section}>
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={styles.chartLabel}>Current Net Worth</Text>
                        <Text style={styles.chartValue}>{formatCurrency(totalAssets - totalDebts)}</Text>
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
                    <Text style={styles.statLabel}>Savings Rate</Text>
                    <View style={styles.gaugeContainer}>
                        <Text style={styles.statValue}>{(savingsRate * 100).toFixed(0)}%</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>FI Progress</Text>
                    <View style={styles.gaugeContainer}>
                        <Text style={[styles.statValue, { color: '#10B981' }]}>{(fiPercentage * 100).toFixed(0)}%</Text>
                    </View>
                </View>
            </View>
            <View style={[styles.balanceCard, { marginTop: 16 }]}>
                <Text style={styles.balanceLabel}>Disposable Cash</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(netCashFlow)}</Text>
            </View>
        </View>
    );
};
