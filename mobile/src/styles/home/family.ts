import { StyleSheet } from 'react-native';

export const familyStyles = StyleSheet.create({
    // Header / Top Bar Elements
    familyNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        paddingVertical: 4,
    },
    chatContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 0,
    },
    familyNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: -8, // Reduced margin left (was 8)
    },
    familySelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent', // Transparent as requested
        paddingHorizontal: 20, // Increased padding (was 16)
        paddingVertical: 12,   // Increased padding (was 8)
        borderRadius: 28,      // Increased radius (was 24)
        // No border
    },
    familyLogoBox: {
        marginRight: 12, // Increased margin (was 10)
        padding: 8,      // Increased padding (was 6)
        backgroundColor: 'rgba(255,255,255,0.15)', // Reduced opacity but kept distinct
        borderRadius: 10,
    },
    familyTextColumn: {
        flexDirection: 'column',
    },
    familyLabelText: {
        fontSize: 11, // Increased from 10
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginBottom: -2,
    },
    notificationIconContainer: {
        marginRight: 4,
        marginTop: 0,
        paddingRight: 8,
        zIndex: 10,
    },
    notificationIcon: {
        width: 44, // Slightly larger touch target
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadgeSmall: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0,
    },
    familyNameText: {
        fontSize: 20, // Increased from 18
        fontWeight: '700',
        color: '#FFFFFF', // White font
        marginRight: 4,
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    settingsButtonIcon: {
        opacity: 0.8,
    },

    // Family Members Scroll Area
    familyMembersScrollView: {
        marginBottom: 8,
        marginTop: 4,
    },
    membersContentContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        alignItems: 'center',
        gap: 16,
    },
    addMemberCard: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#D1FAE5',
        borderWidth: 1,
        borderColor: '#34D399',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        paddingHorizontal: 8,
        marginHorizontal: 8,
        marginBottom: 24,
        flexDirection: 'row',
        gap: 12,
    },
    groupAvatarCard: {
        width: 70,
        height: 70,
        backgroundColor: '#FFFFFF',
        borderRadius: 35,
        paddingVertical: 4,
        paddingHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    individualMembersCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
        paddingVertical: 8,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    individualMembersScroll: {
        paddingHorizontal: 0,
    },
    memberContainer: {
        marginRight: 4,
        alignItems: 'center',
    },
    memberAvatar: {
        position: 'relative',
        borderRadius: 30,
        overflow: 'hidden',
        zIndex: 1,
    },
    compositeAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#007AFF',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 1,
    },
    avatarGrid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    avatarQuarter: {
        width: '50%',
        height: '50%',
        backgroundColor: '#DDD',
    },
    avatarTopLeft: { backgroundColor: '#FFB7B7' },
    avatarTopRight: { backgroundColor: '#FF8C8C' },
    avatarBottomLeft: { backgroundColor: '#FF5A5A' },
    avatarBottomRight: { backgroundColor: '#FFB7B7' },
    singleAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
        zIndex: 1,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    memberBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FF5A5A',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    memberBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 16,
    },
    moreMembers: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Enhanced Family Members (Duplicates/Alts)
    familyMembersScrollContent: {
        paddingVertical: 8,
    },
    familyMemberCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginRight: 12,
        width: 120,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    familyMemberCardSelected: {
        borderColor: '#FFB6C1',
        backgroundColor: '#FEF7F7',
    },
    familyMemberCardContent: {
        padding: 12,
        alignItems: 'center',
    },
    familyMemberAvatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    familyMemberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    familyMemberAvatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        overflow: 'hidden',
    },
    familyMemberAvatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    familyMemberStatusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },

    // Family Status Cards
    familyStatusCardsContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    emergencyStatusCard: {
        borderWidth: 2,
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    statusCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusCardMember: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusCardAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    statusCardMemberInfo: {
        flex: 1,
    },
    statusCardMemberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    statusCardStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusCardStatus: {
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'capitalize',
    },
    statusCardContent: {
        gap: 8,
    },
    statusCardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusCardInfoText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
    },
    heartRateChart: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    heartRateChartTitle: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 8,
    },
    heartRateChartContainer: {
        height: 40,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        justifyContent: 'center',
    },
    heartRateChartLine: {
        height: 2,
        backgroundColor: '#EF4444',
        marginHorizontal: 8,
        borderRadius: 1,
    },

    // New Family Status Row Styles
    familyStatusTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    familyStatusInfo: {
        flex: 1,
    },
    familyStatusStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    familyStatusStatusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    familyStatusBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    familyStatusMetricIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 90, 90, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    areaChartContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    areaChartBackground: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    areaChartFill: {
        position: 'absolute',
        bottom: 0,
        left: 0,
    },
    areaChartLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
    },

    // Widget Options
    widgetOptionActive: {
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#4F46E5',
    },
    widgetOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    widgetOptionName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginLeft: 12,
    },

    // Family Type Grid (Legacy)
    familyTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    familyTypeOption: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    familyTypeOptionActive: {
        backgroundColor: '#4F46E5',
        borderColor: '#4F46E5',
    },
    familyTypeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4F46E5',
        marginTop: 8,
        textAlign: 'center',
    },
    familyTypeTextActive: {
        color: '#FFFFFF',
    },

    // Map and Location
    mapContainer: {
        height: 200,
        backgroundColor: '#F5F5F5',
        marginTop: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    mapPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapPlaceholderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginTop: 8,
    },
    mapPlaceholderSubtext: {
        fontSize: 12,
        color: '#666666',
        marginTop: 4,
    },
    familyAvatarsOnMap: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    familyAvatarOnMap: {
        position: 'absolute',
        alignItems: 'center',
    },
    familyAvatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#D32F2F',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    familyAvatarText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    familyAvatarName: {
        fontSize: 10,
        color: '#333333',
        marginTop: 2,
        textAlign: 'center',
    },

    // Family Dropdown
    familyDropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    familyDropdownContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        margin: 20,
        maxHeight: '70%',
        minWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    familyDropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    familyDropdownTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
    },
    familyDropdownList: {
        maxHeight: 300,
    },
    familyDropdownItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    familyDropdownItemSelected: {
        backgroundColor: '#FEF7F7',
    },
    familyDropdownItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    familyDropdownItemLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF8DC',
        borderWidth: 2,
        borderColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    familyDropdownItemInfo: {
        flex: 1,
    },
    familyDropdownItemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 2,
    },
    familyDropdownItemNameSelected: {
        color: '#FFB6C1',
        fontWeight: '600',
    },
    familyDropdownItemMembers: {
        fontSize: 14,
        color: '#6B7280',
    },

    // Overview Header
    familyOverviewHeader: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    familyOverviewStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    familyStatItem: {
        alignItems: 'center',
        flex: 1,
    },
    familyStatNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    familyStatLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    familyStatDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },

    // Family Status Card Styles (Restored)
    familyStatusCard: {
        marginBottom: 12,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        overflow: 'hidden',
    },
    familyStatusCardExpanded: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFB6C1',
        borderWidth: 1,
    },
    familyStatusCardGradient: {
        padding: 16,
    },
    familyStatusCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    familyStatusAvatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    familyStatusAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    familyStatusAvatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    familyStatusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    familyStatusName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    familyStatusLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    familyStatusLocation: {
        fontSize: 12,
        color: '#6B7280',
        maxWidth: 120,
    },
    familyStatusTime: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    familyStatusHeaderInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    familyStatusStatsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    familyStatusStatItem: {
        alignItems: 'center',
        gap: 4,
    },
    familyStatusStatIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    familyStatusStatValue: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
    },
    familyStatusExpandedContent: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 16,
        gap: 16,
    },
    familyStatusAdditionalMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
    },
    familyStatusAdditionalMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        flex: 1,
        minWidth: '45%',
    },
    familyStatusAdditionalMetricText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4B5563',
    },
    familyStatusActivity: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 12,
    },
    familyStatusActivityLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '600',
    },
    familyStatusActivityText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    familyStatusQuickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    familyStatusActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    familyStatusActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    familyStatusVerticalContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
});
// End of file
