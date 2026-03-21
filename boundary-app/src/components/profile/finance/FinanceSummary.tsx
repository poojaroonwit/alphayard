import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './financeStyles';
import { formatCurrency } from './financeUtils';
import { FinanceCategory } from '../../../services/financeService';

interface FinanceSummaryProps {
    totalAssets: number;
    totalDebts: number;
    netWorth: number;
    incomeCats: FinanceCategory[];
    expenseCats: FinanceCategory[];
}

const sumCats = (cats: FinanceCategory[]) =>
    cats.reduce((acc, cat) =>
        acc + cat.subCategories.reduce((a, sc) =>
            a + sc.records.reduce((r, rec) => r + rec.amount, 0), 0), 0);

export const FinanceSummary: React.FC<FinanceSummaryProps> = ({
    totalAssets, totalDebts, netWorth, incomeCats, expenseCats
}) => {
    const totalIncome = sumCats(incomeCats);
    const totalExpenses = sumCats(expenseCats);
    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
    const fiTarget = totalExpenses * 25; // 25x annual expenses rule
    const fiPercentage = fiTarget > 0 ? Math.min(netWorth / fiTarget, 1) : 0;

    return (
        <View style={styles.section}>
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <View>
                        <Text style={styles.chartLabel}>Current Net Worth</Text>
                        <Text style={styles.chartValue}>{formatCurrency(netWorth)}</Text>
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
