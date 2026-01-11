import { StyleSheet, Dimensions } from 'react-native';
import { typography } from '../typography';

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;
// Calculate width for 4 columns: (Screen - Padding*2 - Gap*3) / 4
const ITEM_SIZE = (width - (PADDING * 2) - (GAP * 3)) / 4;

export const miniAppsStyles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: typography.heading,
        color: '#1F2937',
    },
    seeAllButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    seeAllText: {
        fontSize: 14,
        fontFamily: typography.bodyMedium,
        color: '#3B82F6',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 12, // Reduced from 24
        gap: 12,
    },
    // A column containing 2 items
    column: {
        gap: 12,
    },
    appItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        backgroundColor: '#FFFFFF', // Solid white as requested
        borderRadius: 20, // More rounded like the reference
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
        borderWidth: 0,
        shadowColor: '#000000',
    },
    iconContainer: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    appLabel: {
        fontSize: 10,
        fontFamily: typography.bodyMedium,
        color: '#4B5563',
        textAlign: 'center',
    },
});
