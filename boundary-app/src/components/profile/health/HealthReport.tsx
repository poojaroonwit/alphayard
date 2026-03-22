import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './healthStyles';
import { formatScore } from './healthUtils';

interface HealthReportProps {
    healthScore: number;
    wellnessRate: number;
    healthGoalPercentage: number;
    netActivity: number;
}

export const HealthReport: React.FC<HealthReportProps> = ({
    healthScore, wellnessRate, healthGoalPercentage, netActivity
}) => {
    return (
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
};
