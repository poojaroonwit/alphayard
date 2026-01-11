import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../../styles/typography';
import { ProgressChart } from 'react-native-chart-kit';

interface FinanceSummaryProps {
    onGoToFinance: () => void;
}

export const FinanceSummary: React.FC<FinanceSummaryProps> = ({ onGoToFinance }) => {
    const cardWidth = 280;


    // Mock Data for Progress Chart (Budget)
    const progressData = {
        labels: ["Spend"], // optional
        data: [0.7]
    };

    const progressConfig = {
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 2,
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconMC name="wallet" size={24} color="#4F46E5" />
                    <Text style={styles.title}>My Wallet</Text>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                pagingEnabled={false}
                decelerationRate="fast"
                snapToInterval={300}
            >

                {/* Card 1: Balance Card (Digital Style) */}
                <TouchableOpacity onPress={onGoToFinance} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#1e1b4b', '#312e81', '#4338ca']} // Deep Indigo
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.balanceCard, { width: cardWidth, height: 160 }]}
                    >
                        <View style={styles.cardHeaderRow}>
                            <View>
                                <Text style={styles.labelMetadata}>Total Balance</Text>
                                <Text style={styles.accountName}>Main Wallet</Text>
                            </View>
                            <View style={styles.trendBadge}>
                                <IconMC name="trending-up" size={16} color="#34D399" />
                                <Text style={styles.trendText}>+12%</Text>
                            </View>
                        </View>

                        <View style={styles.balanceContainer}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <Text style={styles.balanceAmount}>124,592</Text>
                        </View>

                        <View style={styles.cardFooterRow}>
                            <Text style={styles.centsText}>.00</Text>
                            <IconMC name="contactless-payment" size={24} color="rgba(255,255,255,0.4)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Card 2: Monthly Budget (Analysis Card) */}
                <TouchableOpacity onPress={onGoToFinance} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['#111827', '#374151']} // Gray/Black
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.balanceCard, { width: cardWidth, height: 160 }]}
                    >
                        <View style={styles.cardHeaderRow}>
                            <View>
                                <Text style={styles.labelMetadata}>Monthly Budget</Text>
                                <Text style={styles.accountName}>October</Text>
                            </View>
                            <IconMC name="chart-pie" size={24} color="#10B981" />
                        </View>

                        <View style={[styles.balanceContainer, { flexDirection: 'row', alignItems: 'center', gap: 20 }]}>
                            <ProgressChart
                                data={progressData}
                                width={80}
                                height={80}
                                strokeWidth={8}
                                radius={32}
                                chartConfig={{ ...progressConfig, color: (o = 1) => `rgba(16, 185, 129, ${o})` }}
                                hideLegend={true}
                            />
                            <View>
                                <Text style={styles.balanceAmountSmall}>$1,200</Text>
                                <Text style={styles.labelMetadata}>Remaining</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontFamily: typography.heading,
        color: '#1F2937',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4F46E5',
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 16,
        paddingBottom: 4,
    },
    balanceCard: {
        borderRadius: 24,
        padding: 24,
        justifyContent: 'space-between',
        elevation: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    labelMetadata: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    accountName: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    trendText: {
        color: '#34D399',
        fontSize: 14,
        fontWeight: '700',
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currencySymbol: {
        fontSize: 24,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginRight: 4,
        transform: [{ translateY: -8 }]
    },
    balanceAmount: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: typography.heading,
        letterSpacing: -1,
    },
    balanceAmountSmall: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: typography.heading,
    },
    cardFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    centsText: {
        fontSize: 24,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        transform: [{ translateY: -6 }]
    },
});
