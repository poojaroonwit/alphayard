import { StyleSheet } from 'react-native';

// const { width } = Dimensions.get('window');

export const galleryStyles = StyleSheet.create({
    galleryContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },

    // Category Section (Story-like)
    categorySection: {
        paddingVertical: 16,
        paddingHorizontal: 0,
    },
    categoryScrollContent: {
        paddingHorizontal: 16,
        gap: 16,
    },
    categoryItem: {
        alignItems: 'center',
        gap: 6,
    },
    categoryAvatarContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        padding: 3,
        borderWidth: 2,
        borderColor: '#E5E7EB', // Default border
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryAvatarContainerSelected: {
        borderColor: '#FFB6C1', // Selected color
    },
    categoryAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        backgroundColor: '#F3F4F6',
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4B5563',
    },
    categoryLabelSelected: {
        color: '#1F2937',
        fontWeight: '700',
    },

    // Albums Section
    albumSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 24,
    },
    sectionTab: {
        fontSize: 16,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    sectionTabActive: {
        color: '#1F2937', // Darker active color
        fontWeight: '700',
    },
    sectionTabIndicator: {
        height: 3,
        width: '80%', // Make it span most of the text width
        borderRadius: 1.5,
        backgroundColor: '#FFB6C1',
        alignSelf: 'center',
        marginTop: 4,
    },
    seeAllText: {
        fontSize: 14,
        color: '#FFB6C1',
        fontWeight: '600',
        marginLeft: 'auto', // Push to right if needed
    },
    albumScrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    albumCard: {
        width: 140,
        marginRight: 4,
    },
    albumCover: {
        width: 140,
        height: 140,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#F3F4F6',
    },
    albumTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    albumCount: {
        fontSize: 12,
        color: '#6B7280',
    },

    // Discovery Grid Section
    discoverySection: {
        flex: 1,
        paddingHorizontal: 20,
    },
    discoveryHeader: {
        marginBottom: 12,
    },
});
