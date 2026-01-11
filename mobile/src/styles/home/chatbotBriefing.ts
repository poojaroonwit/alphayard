import { StyleSheet } from 'react-native';

export const chatbotBriefingStyles = StyleSheet.create({
    container: {
        paddingHorizontal: 0, // Removed to allow full-width scrolling content to align better
        marginBottom: 0,
        flexDirection: 'column', // Stack vertically
        gap: 8,
    },
    botContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 0,
        paddingHorizontal: 16, // Align with the grid patterns
        gap: 8,
    },
    botAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'transparent', // No background
        justifyContent: 'center',
        alignItems: 'center',
        // No border, no shadow
    },
    botName: {
        fontSize: 16, // Larger label
        fontWeight: '700',
        color: '#1F2937',
    },
    customizeButton: {
        padding: 8,
        marginRight: -8, // Offset padding for better edge alignment
    },
    speechBubbleContainer: {
        flex: 1,
        // Removed bubble styles from container
        overflow: 'visible', // Allow shadows to show
        marginLeft: 0,
        width: '100%', // Full width
    },
    scrollContent: {
        paddingHorizontal: 16, // Match Activity section padding
        gap: 12, // Space between bubbles
        paddingVertical: 12, // Reduced from 24
    },
    briefingItem: {
        width: 220, // Reduced width
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        // Removed artificial "tail" for cleaner card look if requested, 
        // but user says "make it the same", so I'll keep the premium radii 
        // while matching the Activity card shadow specs.
        padding: 16,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.05, // Reduced from 0.12 to 0.05
        shadowRadius: 20,
        elevation: 2,
        borderWidth: 0,
        shadowColor: '#000000', // Standard black for visibility
        minHeight: 120,
        marginLeft: 0,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    itemIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    itemDescription: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 20,
        marginBottom: 4,
    },
    itemSubtext: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    newsTag: {
        marginTop: 8,
        backgroundColor: '#EFF6FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newsTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#3B82F6',
    },
    // Pagination Dots
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        gap: 6,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#E5E7EB',
    },
    paginationDotActive: {
        width: 18, // Elongated active dot
        backgroundColor: '#4F46E5',
    },
});
