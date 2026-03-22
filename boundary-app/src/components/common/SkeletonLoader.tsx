import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from './Skeleton';

const { width } = Dimensions.get('window');

// Generic Card Skeleton
export const CardSkeleton: React.FC = () => (
    <View style={styles.cardContainer}>
        <Skeleton width="60%" height={24} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={16} style={{ marginBottom: 16 }} />
        <View style={styles.rowBetween}>
            <Skeleton width={80} height={24} borderRadius={12} />
            <Skeleton width={60} height={16} />
        </View>
    </View>
);

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => (
    <View style={styles.listItemContainer}>
        <View style={styles.row}>
            <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
                <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={12} />
            </View>
        </View>
    </View>
);

// Event/Calendar List Skeleton
export const EventListSkeleton: React.FC = () => (
    <View style={{ gap: 12 }}>
        {[1, 2, 3].map((i) => (
            <View key={i} style={styles.cardContainer}>
                <View style={styles.row}>
                    <Skeleton width={40} height={40} borderRadius={8} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Skeleton width="80%" height={18} style={{ marginBottom: 6 }} />
                        <Skeleton width="50%" height={14} />
                    </View>
                </View>
            </View>
        ))}
    </View>
);

// Gallery Grid Skeleton
export const GalleryGridSkeleton: React.FC = () => {
    const itemSize = (width - 40 - 12) / 3; // 3 columns, padding 20*2, gap 6*2
    return (
        <View style={styles.gridContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <Skeleton
                    key={i}
                    width={itemSize}
                    height={itemSize}
                    borderRadius={8}
                />
            ))}
        </View>
    );
};

// Calendar Month Skeleton
export const CalendarMonthSkeleton: React.FC = () => (
    <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <Skeleton width={120} height={24} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <Skeleton width={32} height={32} borderRadius={16} />
            </View>
        </View>
        <View style={styles.gridContainer}>
            {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton
                    key={i}
                    width={(width - 40 - 24) / 7}
                    height={40}
                    borderRadius={20}
                />
            ))}
        </View>
    </View>
);

// Status/Avatars Skeleton
export const AvatarRowSkeleton: React.FC = () => (
    <View style={styles.row}>
        {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ alignItems: 'center', marginRight: 16 }}>
                <Skeleton width={56} height={56} borderRadius={28} style={{ marginBottom: 4 }} />
                <Skeleton width={40} height={12} />
            </View>
        ))}
    </View>
);

// Finance Tab Skeleton
export const FinanceTabSkeleton: React.FC = () => (
    <View style={{ flex: 1, padding: 20 }}>
        {/* Subheader tabs skeleton */}
        <View style={[styles.row, { marginBottom: 24, gap: 12 }]}>
            {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} width={80} height={32} borderRadius={16} />
            ))}
        </View>

        {/* Chart/Summary area */}
        <View style={[styles.cardContainer, { alignItems: 'center', paddingVertical: 32 }]}>
            <Skeleton width={180} height={180} borderRadius={90} />
            <Skeleton width="60%" height={24} style={{ marginTop: 24, marginBottom: 8 }} />
            <Skeleton width="40%" height={16} />
        </View>

        {/* Category list skeleton */}
        <View style={{ marginTop: 12 }}>
            {[1, 2, 3].map(i => (
                <ListItemSkeleton key={i} />
            ))}
        </View>
    </View>
);

// Health Tab Skeleton
export const HealthTabSkeleton: React.FC = () => (
    <View style={{ flex: 1, padding: 20 }}>
        {/* Subheader tabs skeleton */}
        <View style={[styles.row, { marginBottom: 24, gap: 12 }]}>
            {[1, 2, 3].map(i => (
                <Skeleton key={i} width={100} height={32} borderRadius={16} />
            ))}
        </View>

        {/* Score circular area */}
        <View style={[styles.cardContainer, { alignItems: 'center', paddingVertical: 40 }]}>
            <Skeleton width={150} height={150} borderRadius={75} />
            <Skeleton width="50%" height={28} style={{ marginTop: 24, marginBottom: 8 }} />
            <Skeleton width="30%" height={16} />
        </View>

        {/* Metrics list skeleton */}
        <View style={{ marginTop: 12, gap: 12 }}>
            {[1, 2, 3].map(i => (
                <View key={i} style={styles.rowBetween}>
                    <View style={[styles.row, { flex: 1 }]}>
                        <Skeleton width={40} height={40} borderRadius={8} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Skeleton width="80%" height={16} style={{ marginBottom: 6 }} />
                            <Skeleton width="40%" height={12} />
                        </View>
                    </View>
                    <Skeleton width={40} height={24} borderRadius={4} />
                </View>
            ))}
        </View>
    </View>
);

// Generic Page Skeleton (Header + Content blocks)
export const PageSkeleton: React.FC = () => (
    <View style={{ flex: 1, padding: 20 }}>
        <Skeleton width="40%" height={32} style={{ marginBottom: 24 }} />
        {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{ marginBottom: 20 }}>
                <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton width="60%" height={16} />
            </View>
        ))}
    </View>
);

// Settings/List Page Skeleton
export const SettingsSkeleton: React.FC = () => (
    <View style={{ flex: 1, padding: 20 }}>
        <Skeleton width={150} height={28} style={{ marginBottom: 32 }} />
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <View key={i} style={[styles.rowBetween, { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }]}>
                <View style={[styles.row, { flex: 1 }]}>
                    <Skeleton width={24} height={24} borderRadius={6} style={{ marginRight: 12 }} />
                    <Skeleton width="50%" height={18} />
                </View>
                <Skeleton width={16} height={16} borderRadius={8} />
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    listItemContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
});
