import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Animated,
    FlatList,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SearchDrawerProps {
    visible: boolean;
    onClose: () => void;
}

// Mock recent searches
const RECENT_SEARCHES = [
    { id: '1', query: 'Family photos', type: 'gallery' },
    { id: '2', query: 'Mom', type: 'contact' },
    { id: '3', query: 'Birthday party', type: 'event' },
    { id: '4', query: 'Grocery list', type: 'note' },
];

// Mock search categories
const CATEGORIES = [
    { id: 'all', label: 'All', icon: 'magnify' },
    { id: 'photos', label: 'Photos', icon: 'image-multiple' },
    { id: 'contacts', label: 'Contacts', icon: 'account-group' },
    { id: 'events', label: 'Events', icon: 'calendar' },
    { id: 'notes', label: 'Notes', icon: 'note-text' },
];

// Mock recent items (like the cat images in the reference)
const RECENT_ITEMS = [
    { id: '1', title: 'Family Dinner', image: 'https://i.pravatar.cc/200?img=1', category: 'photos' },
    { id: '2', title: 'Mom', image: 'https://i.pravatar.cc/200?img=2', category: 'contacts' },
    { id: '3', title: 'Dad', image: 'https://i.pravatar.cc/200?img=3', category: 'contacts' },
    { id: '4', title: 'Birthday', image: 'https://i.pravatar.cc/200?img=4', category: 'events' },
    { id: '5', title: 'Trip Photos', image: 'https://i.pravatar.cc/200?img=5', category: 'photos' },
    { id: '6', title: 'Notes', image: 'https://i.pravatar.cc/200?img=6', category: 'notes' },
];

export const SearchDrawer: React.FC<SearchDrawerProps> = ({ visible, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 65,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, slideAnim, fadeAnim]);

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleRecentSearchPress = (query: string) => {
        setSearchQuery(query);
    };

    const handleClearRecentSearch = (id: string) => {
        // In real app, remove from storage
        console.log('Clear recent search:', id);
    };

    const filteredItems = RECENT_ITEMS.filter(item =>
        activeCategory === 'all' || item.category === activeCategory
    );

    const renderRecentSearch = ({ item }: { item: typeof RECENT_SEARCHES[0] }) => (
        <TouchableOpacity
            style={styles.recentSearchItem}
            onPress={() => handleRecentSearchPress(item.query)}
        >
            <View style={styles.recentSearchIcon}>
                <IconMC name="history" size={18} color="#6B7280" />
            </View>
            <Text style={styles.recentSearchText}>{item.query}</Text>
            <TouchableOpacity
                onPress={() => handleClearRecentSearch(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <IconMC name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderCategory = (category: typeof CATEGORIES[0]) => (
        <TouchableOpacity
            key={category.id}
            style={[
                styles.categoryTab,
                activeCategory === category.id && styles.categoryTabActive,
            ]}
            onPress={() => setActiveCategory(category.id)}
        >
            <IconMC
                name={category.icon}
                size={16}
                color={activeCategory === category.id ? '#FFFFFF' : '#6B7280'}
            />
            <Text
                style={[
                    styles.categoryTabText,
                    activeCategory === category.id && styles.categoryTabTextActive,
                ]}
            >
                {category.label}
            </Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item }: { item: typeof RECENT_ITEMS[0] }) => (
        <TouchableOpacity style={styles.gridItem}>
            <Image source={{ uri: item.image }} style={styles.gridItemImage} />
            <View style={styles.gridItemOverlay}>
                <Text style={styles.gridItemTitle} numberOfLines={1}>{item.title}</Text>
            </View>
        </TouchableOpacity>
    );

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.container,
                    { transform: [{ translateY: slideAnim }] },
                ]}
            >
                <LinearGradient
                    colors={['#FA7272', '#FFBBB4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    <SafeAreaView edges={['top']}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.backButton}>
                                <IconMC name="arrow-left" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Search</Text>
                            <View style={{ width: 40 }} />
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.content}
                >
                    {/* Search Input */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputWrapper}>
                            <IconMC name="magnify" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search anything..."
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={handleClearSearch}>
                                    <IconMC name="close-circle" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Category Tabs */}
                    <View style={styles.categoriesContainer}>
                        <FlatList
                            horizontal
                            data={CATEGORIES}
                            renderItem={({ item }) => renderCategory(item)}
                            keyExtractor={(item) => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesList}
                        />
                    </View>

                    {/* Recent Searches */}
                    {searchQuery.length === 0 && (
                        <View style={styles.recentSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Recent Searches</Text>
                                <TouchableOpacity>
                                    <Text style={styles.clearAllText}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={RECENT_SEARCHES}
                                renderItem={renderRecentSearch}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    )}

                    {/* Results Grid (like the cat images in reference) */}
                    <View style={styles.resultsSection}>
                        <Text style={styles.sectionTitle}>
                            {searchQuery ? 'Results' : 'Recent'}
                        </Text>
                        <FlatList
                            data={filteredItems}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.gridContainer}
                            columnWrapperStyle={styles.gridRow}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlayTouchable: {
        flex: 1,
    },
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFFFFF',
    },
    headerGradient: {
        paddingBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        backgroundColor: '#FAF9F6',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    categoriesContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    categoriesList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        gap: 6,
    },
    categoryTabActive: {
        backgroundColor: '#FA7272',
    },
    categoryTabText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    categoryTabTextActive: {
        color: '#FFFFFF',
    },
    recentSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    clearAllText: {
        fontSize: 14,
        color: '#FA7272',
        fontWeight: '500',
    },
    recentSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    recentSearchIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentSearchText: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
    },
    resultsSection: {
        flex: 1,
        paddingTop: 16,
    },
    gridContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    gridRow: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gridItem: {
        width: (SCREEN_WIDTH - 48) / 2,
        height: (SCREEN_WIDTH - 48) / 2,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    gridItemImage: {
        width: '100%',
        height: '100%',
    },
    gridItemOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    gridItemTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#FFFFFF',
    },
});

export default SearchDrawer;
