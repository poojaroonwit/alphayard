import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, TextInput, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { Avatar } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

// Mock Data
const CHATS = [
    { id: '1', name: 'Rafael Mante', message: 'Figma ipsum component variant main', time: '19:45', avatar: 'https://i.pravatar.cc/100?img=11', unread: 0, folder: 'family' },
    { id: '2', name: 'Katherine Bernhard', message: '✔ Figma', time: '19:45', avatar: 'https://i.pravatar.cc/100?img=12', unread: 0, folder: 'work' },
    { id: '3', name: 'Terrence Lemke', message: 'Figma ipsum component variant main', time: '19:45', avatar: 'https://i.pravatar.cc/100?img=13', unread: 2, folder: 'family' },
    { id: '4', name: 'Alyssa Wisozk-Kihn', message: 'Figma ipsum component variant main', time: '19:45', avatar: 'https://i.pravatar.cc/100?img=14', unread: 0, folder: 'friends' },
    { id: '5', name: 'Andrew Legros', message: '✔ Figma', time: '19:45', avatar: 'https://i.pravatar.cc/100?img=15', unread: 0, folder: 'work' },
    { id: '6', name: 'Dixie Haag', message: 'Figma ipsum component variant main', time: '19:45', avatar: 'https://i.pravatar.cc/100?img=16', unread: 1, folder: 'friends' },
    { id: '7', name: 'Rafael Mante', message: 'Figma ipsum component variant main', time: '19:45', avatar: 'https://i.pravatar.cc/100?img=11', unread: 0, folder: 'family' },
];

const FOLDER_TABS = [
    { id: 'friends', label: 'Friends', icon: 'account-multiple-outline', isDividerAfter: true },
    { id: 'all', label: 'All', icon: 'message-text-outline', isDividerAfter: false },
    { id: 'family', label: 'Family', icon: 'home-heart', isDividerAfter: false },
    { id: 'work', label: 'Work', icon: 'briefcase-outline', isDividerAfter: false },
];

const ChatListScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFolder, setActiveFolder] = useState('friends');
    const [activeCollection, setActiveCollection] = useState<string | null>(null); // 'birthday', 'favorites', 'all_friends', 'groups'
    const [showNewChatDrawer, setShowNewChatDrawer] = useState(false);

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Saad Shaikh';

    // Header Gradient Colors (Matching Homescreen Default)
    const headerGradient = ['#FA7272', '#FFBBB4'];

    // Filter chats based on search and folder
    const filteredChats = CHATS.filter(chat => {
        const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = activeFolder === 'all' || chat.folder === activeFolder;
        return matchesSearch && matchesFolder;
    });

    const renderFolderTab = (tab: typeof FOLDER_TABS[0]) => {
        const isActive = activeFolder === tab.id;
        return (
            <View key={tab.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                    style={[styles.folderTab, isActive && styles.folderTabActive]}
                    onPress={() => {
                        setActiveFolder(tab.id);
                        setActiveCollection(null);
                    }}
                >
                    <IconMC
                        name={tab.icon}
                        size={18}
                        color={isActive ? '#FFFFFF' : '#6B7280'}
                    />
                    <Text style={[styles.folderTabText, isActive && styles.folderTabTextActive]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
                {tab.isDividerAfter && (
                    <Text style={{ color: '#D1D5DB', fontSize: 18, marginHorizontal: 8 }}>|</Text>
                )}
            </View>
        );
    };

    const renderChat = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('ChatRoom', {
                familyId: 'mock-family-id',
                memberName: item.name,
                memberId: item.id,
                isGroupChat: false
            })}
        >
            <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{item.name}</Text>
                    <Text style={styles.chatTime}>{item.time}</Text>
                </View>
                <View style={styles.chatFooter}>
                    <Text style={[styles.chatMessage, item.unread > 0 && styles.chatMessageUnread]} numberOfLines={1}>
                        {item.message}
                    </Text>
                    {item.unread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unread}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const handleNewChat = (type: 'individual' | 'group') => {
        setShowNewChatDrawer(false);
        // Navigate to new chat screen based on type
        navigation.navigate('NewChat', { type });
    };

    return (
        <LinearGradient
            colors={['#FA7272', '#FFBBB4', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.headerSafeArea}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <View>
                        <View style={styles.backButton}>
                            <Text style={styles.greeting}>Hi {userName}</Text>
                        </View>
                        <Text style={styles.subtitle}>06 unread messages</Text>
                    </View>
                    <TouchableOpacity accessibilityLabel="Profile">
                        <Avatar
                            bg="purple.500"
                            size="44px"
                            source={{ uri: user?.avatar }}
                            style={styles.profileAvatar}
                        >
                            {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                        </Avatar>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.contentContainer}>
                {/* Search Input */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <IconMC name="magnify" size={20} color="#9CA3AF" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search chats..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <IconMC name="close-circle" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Folder Filter Tabs - Friend fixed, others scrollable */}
                <View style={styles.filterTabsRow}>
                    {/* Fixed Friend Tab */}
                    <TouchableOpacity
                        style={[styles.folderTab, activeFolder === 'friends' && styles.folderTabActive]}
                        onPress={() => {
                            setActiveFolder('friends');
                            setActiveCollection(null);
                        }}
                    >
                        <IconMC
                            name="account-group"
                            size={18}
                            color={activeFolder === 'friends' ? '#FFFFFF' : '#6B7280'}
                        />
                        <Text style={[styles.folderTabText, activeFolder === 'friends' && styles.folderTabTextActive]}>
                            Friends
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <Text style={{ color: '#D1D5DB', fontSize: 18, marginHorizontal: 8 }}>|</Text>

                    {/* Scrollable Other Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 10 }}
                    >
                        {FOLDER_TABS.filter(tab => tab.id !== 'friends').map((tab) => {
                            const isActive = activeFolder === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.folderTab, isActive && styles.folderTabActive]}
                                    onPress={() => {
                                        setActiveFolder(tab.id);
                                        setActiveCollection(null);
                                    }}
                                >
                                    <IconMC
                                        name={tab.icon}
                                        size={18}
                                        color={isActive ? '#FFFFFF' : '#6B7280'}
                                    />
                                    <Text style={[styles.folderTabText, isActive && styles.folderTabTextActive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Collections View for Friends Tab */}
                {activeFolder === 'friends' ? (
                    <View style={styles.collectionsContainer}>
                        {!activeCollection ? (
                            <>
                                <View style={styles.collectionsGrid}>
                                    {/* Birthday Reminders */}
                                    <TouchableOpacity style={styles.collectionCard} onPress={() => setActiveCollection('birthday')}>
                                        <View style={[styles.collectionIcon, { backgroundColor: '#FEF3C7' }]}>
                                            <IconMC name="cake-variant" size={24} color="#D97706" />
                                        </View>
                                        <Text style={styles.collectionTitle}>Birthday</Text>
                                        <Text style={styles.collectionCount}>2 Today</Text>
                                        <IconMC name="chevron-right" size={24} color="#D1D5DB" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>

                                    {/* Favorites */}
                                    <TouchableOpacity style={styles.collectionCard} onPress={() => setActiveCollection('favorites')}>
                                        <View style={[styles.collectionIcon, { backgroundColor: '#FEE2E2' }]}>
                                            <IconMC name="star" size={24} color="#EF4444" />
                                        </View>
                                        <Text style={styles.collectionTitle}>Favorites</Text>
                                        <Text style={styles.collectionCount}>12 Friends</Text>
                                        <IconMC name="chevron-right" size={24} color="#D1D5DB" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>

                                    {/* All Friends */}
                                    <TouchableOpacity style={styles.collectionCard} onPress={() => setActiveCollection('all_friends')}>
                                        <View style={[styles.collectionIcon, { backgroundColor: '#DBEAFE' }]}>
                                            <IconMC name="account-group" size={24} color="#3B82F6" />
                                        </View>
                                        <Text style={styles.collectionTitle}>All Friends</Text>
                                        <Text style={styles.collectionCount}>156 Friends</Text>
                                        <IconMC name="chevron-right" size={24} color="#D1D5DB" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>

                                    {/* Groups */}
                                    <TouchableOpacity style={styles.collectionCard} onPress={() => setActiveCollection('groups')}>
                                        <View style={[styles.collectionIcon, { backgroundColor: '#E0E7FF' }]}>
                                            <IconMC name="bullhorn" size={24} color="#4F46E5" />
                                        </View>
                                        <Text style={styles.collectionTitle}>Groups</Text>
                                        <Text style={styles.collectionCount}>5 Groups</Text>
                                        <IconMC name="chevron-right" size={24} color="#D1D5DB" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.sectionHeader}>
                                    <Text style={styles.sectionTitle}>Recent Chats</Text>
                                </View>
                                <FlatList
                                    data={filteredChats}
                                    renderItem={renderChat}
                                    keyExtractor={item => item.id}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.chatsList}
                                    scrollEnabled={false}
                                />
                            </>
                        ) : (
                            /* Filtered List View */
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                                    onPress={() => setActiveCollection(null)}
                                >
                                    <IconMC name="arrow-left" size={24} color="#1F2937" />
                                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 8, color: '#1F2937' }}>
                                        {activeCollection === 'birthday' ? 'Birthday Reminders' :
                                            activeCollection === 'favorites' ? 'Favorites' :
                                                activeCollection === 'groups' ? 'Groups' : 'All Friends'}
                                    </Text>
                                </TouchableOpacity>

                                <FlatList
                                    data={filteredChats} // In real app, filter based on activeCollection
                                    renderItem={renderChat}
                                    keyExtractor={item => item.id}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.chatsList}
                                />
                            </View>
                        )}
                    </View>
                ) : (
                    /* Standard Chats List Section for other tabs */
                    <View style={styles.chatsSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Chats</Text>
                            <TouchableOpacity>
                                <IconMC name="filter-variant" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={filteredChats}
                            renderItem={renderChat}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.chatsList}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <IconMC name="chat-outline" size={48} color="#D1D5DB" />
                                    <Text style={styles.emptyStateText}>No chats found</Text>
                                </View>
                            }
                        />
                    </View>
                )}
            </View>

            {/* Floating 'New' Button */}
            <View style={styles.floatingButtonContainer}>
                <TouchableOpacity
                    style={styles.newChatButton}
                    onPress={() => setShowNewChatDrawer(true)}
                >
                    <IconMC name="plus" size={20} color="white" />
                    <Text style={styles.newChatText}>New</Text>
                </TouchableOpacity>
            </View>

            {/* New Chat Drawer Modal */}
            <Modal
                visible={showNewChatDrawer}
                transparent
                animationType="slide"
                onRequestClose={() => setShowNewChatDrawer(false)}
            >
                <TouchableOpacity
                    style={styles.drawerOverlay}
                    activeOpacity={1}
                    onPress={() => setShowNewChatDrawer(false)}
                >
                    <View style={styles.drawerContainer}>
                        <TouchableOpacity activeOpacity={1}>
                            <View style={styles.drawerHandle} />
                            <Text style={styles.drawerTitle}>Create New Chat</Text>

                            <TouchableOpacity
                                style={styles.drawerOption}
                                onPress={() => handleNewChat('individual')}
                            >
                                <View style={[styles.drawerOptionIcon, { backgroundColor: '#DBEAFE' }]}>
                                    <IconMC name="account-outline" size={24} color="#3B82F6" />
                                </View>
                                <View style={styles.drawerOptionContent}>
                                    <Text style={styles.drawerOptionTitle}>New Chat</Text>
                                    <Text style={styles.drawerOptionSubtitle}>Start a conversation with someone</Text>
                                </View>
                                <IconMC name="chevron-right" size={24} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.drawerOption}
                                onPress={() => handleNewChat('group')}
                            >
                                <View style={[styles.drawerOptionIcon, { backgroundColor: '#FEE2E2' }]}>
                                    <IconMC name="account-group-outline" size={24} color="#EF4444" />
                                </View>
                                <View style={styles.drawerOptionContent}>
                                    <Text style={styles.drawerOptionTitle}>New Group</Text>
                                    <Text style={styles.drawerOptionSubtitle}>Create a group chat with multiple people</Text>
                                </View>
                                <IconMC name="chevron-right" size={24} color="#9CA3AF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.drawerCancelButton}
                                onPress={() => setShowNewChatDrawer(false)}
                            >
                                <Text style={styles.drawerCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientHeader: {
        width: '100%',
        paddingBottom: 20,
    },
    headerSafeArea: {
        paddingBottom: 10,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    greeting: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
        marginLeft: 32,
    },
    profileAvatar: {
        width: 44,
        height: 44,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#FCFCFC',
        marginTop: 0,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 16,
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1F2937',
        padding: 0,
    },
    folderTabsContainer: {
        maxHeight: 44,
        marginBottom: 12,
    },
    folderTabsContent: {
        paddingHorizontal: 24,
        gap: 10,
    },
    folderTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        gap: 6,
    },
    folderTabActive: {
        backgroundColor: '#1F2937',
    },
    folderTabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },
    folderTabTextActive: {
        color: '#FFFFFF',
    },
    filterTabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    friendsSection: {
        marginBottom: 16,
    },
    friendsList: {
        paddingHorizontal: 24,
        gap: 16,
    },
    friendItem: {
        alignItems: 'center',
        width: 70,
    },
    friendAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F3F4F6',
        marginBottom: 6,
    },
    friendName: {
        fontSize: 12,
        color: '#374151',
        textAlign: 'center',
    },
    friendBadge: {
        position: 'absolute',
        top: 0,
        right: 6,
        backgroundColor: '#FA7272',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FCFCFC',
    },
    friendBadgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    chatsSection: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    chatsList: {
        paddingBottom: 100,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    chatAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
    },
    chatContent: {
        flex: 1,
        gap: 4,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    chatTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatMessage: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
        marginRight: 8,
    },
    chatMessageUnread: {
        color: '#1F2937',
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 15,
        color: '#9CA3AF',
        marginTop: 12,
    },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    newChatButton: {
        backgroundColor: '#1F2937',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    newChatText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
    drawerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    drawerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    drawerHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 20,
    },
    drawerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    drawerOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    drawerOptionContent: {
        flex: 1,
    },
    drawerOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    drawerOptionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    drawerCancelButton: {
        marginTop: 20,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    drawerCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    collectionsContainer: {
        flex: 1,
        paddingHorizontal: 0, // Removed padding to allow full-width list items
    },
    collectionsGrid: {
        flexDirection: 'column',
        marginBottom: 24,
        // Removed gap to have continuous list
    },
    collectionCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 24, // Align with screen margins
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        // Removed shadows and radius for list look
    },
    collectionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    collectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
    },
    collectionCount: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});

export default ChatListScreen;

