import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, TextInput, SafeAreaView, Animated } from 'react-native';
import CoolIcon from '../../components/common/CoolIcon';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect } from '@react-navigation/native';
import { homeStyles } from '../../styles/homeStyles';
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { useHomeBackground } from '../../hooks/useAppConfig';

interface App {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    route: string;
    badge?: number;
    isNew?: boolean;
    isPremium?: boolean;
    category: 'communication' | 'productivity' | 'entertainment' | 'utilities' | 'safety' | 'finance' | 'settings';
    gradient: string[];
}

const { width, height } = Dimensions.get('window');

const getGridConfig = (currentWidth = width) => {
    const containerPadding = 40;
    const gapBetweenApps = 16;
    const availableWidth = currentWidth - containerPadding;
    const minAppWidth = 60;
    const maxAppsPerRow = Math.floor(availableWidth / (minAppWidth + gapBetweenApps));
    const appsPerRow = Math.max(3, Math.min(maxAppsPerRow, 6));
    const totalGaps = appsPerRow - 1;
    const totalGapWidth = totalGaps * gapBetweenApps;
    const appWidth = (availableWidth - totalGapWidth) / appsPerRow;
    return { appsPerRow, appWidth, gapBetweenApps, containerPadding };
};

const AppsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    useHomeBackground();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [screenDimensions, setScreenDimensions] = useState({ width, height });
    const [appFilterType, setAppFilterType] = useState<'work' | 'life'>('life'); // Default to Life

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenDimensions({ width: window.width, height: window.height });
        });
        return () => subscription?.remove();
    }, []);

    const { animateToHome, cardMarginTopAnim } = useNavigationAnimation();

    useFocusEffect(
        React.useCallback(() => {
            animateToHome();
        }, [animateToHome])
    );

    const apps: App[] = [
        { id: 'gallery', name: 'Gallery', description: 'hourse photo sharing', icon: 'image', color: '#FF6B6B', route: 'Gallery', category: 'communication', gradient: ['#FF6B6B', '#FF8E8E'] },
        { id: 'secondhand', name: 'Second Hand Shop', description: 'Buy & sell used items', icon: 'wallet', color: '#F59E0B', route: 'SecondHandShop', category: 'utilities', gradient: ['#F59E0B', '#FBBF24'] },
        { id: 'communication', name: 'Communication', description: 'Chat, calls & voice', icon: 'chatbubbles', color: '#4ECDC4', route: 'Communication', category: 'communication', gradient: ['#4ECDC4', '#6EDDD6'] },
        //    { id: 'social', name: 'Social', description: 'hourse social network', icon: 'people', color: '#FFA07A', route: 'Social', category: 'communication', gradient: ['#FFA07A', '#FFB08C'] }, // Removed Social as it is a main tab now
        { id: 'storage', name: 'Storage', description: 'File management', icon: 'folder', color: '#DDA0DD', route: 'Storage', category: 'productivity', gradient: ['#DDA0DD', '#E5B3E5'] },
        { id: 'notes', name: 'Note & To Do', description: 'Notes and tasks', icon: 'document-text', color: '#98D8C8', route: 'Notes', category: 'productivity', gradient: ['#98D8C8', '#A8E0D0'] },
        { id: 'calendar', name: 'Calendar', description: 'Event planning', icon: 'calendar', color: '#F7DC6F', route: 'Calendar', category: 'productivity', gradient: ['#F7DC6F', '#F8E07F'] },
        { id: 'location', name: 'Location', description: 'hourse tracking', icon: 'location', color: '#3498DB', route: 'Location', category: 'safety', gradient: ['#3498DB', '#44A8EB'] },
        { id: 'health', name: 'Health', description: 'Health records', icon: 'medical', color: '#2ECC71', route: 'Health', category: 'safety', gradient: ['#2ECC71', '#3EDC81'] },
        { id: 'budget', name: 'Budget', description: 'hourse budget', icon: 'wallet', color: '#27AE60', route: 'Budget', category: 'finance', gradient: ['#27AE60', '#37BE70'] },
        { id: 'expenses', name: 'Expenses', description: 'Track spending', icon: 'card', color: '#8E44AD', route: 'Expenses', category: 'finance', gradient: ['#8E44AD', '#9E54BD'] },
        { id: 'savings', name: 'Savings', description: 'Save money', icon: 'trending-up', color: '#16A085', route: 'Savings', category: 'finance', gradient: ['#16A085', '#26B095'] },
        { id: 'investments', name: 'Investments', description: 'Investment tracking', icon: 'analytics', color: '#D68910', route: 'Investments', category: 'finance', gradient: ['#D68910', '#E69920'] },
        { id: 'hourse', name: 'hourse', description: 'hourse settings', icon: 'people-circle', color: '#9B59B6', route: 'hourse', category: 'settings', gradient: ['#9B59B6', '#AB69C6'] },
        { id: 'profile', name: 'Profile', description: 'Your account profile', icon: 'person-circle', color: '#2563EB', route: 'Profile', category: 'settings', gradient: ['#60A5FA', '#2563EB'] },
    ];

    const categories = [
        { id: 'all', name: 'All Apps', icon: 'apps' },
        { id: 'communication', name: 'Communication', icon: 'chatbubbles' },
        { id: 'productivity', name: 'Productivity', icon: 'briefcase' },
        { id: 'safety', name: 'Safety', icon: 'shield-checkmark' },
        { id: 'finance', name: 'Finance', icon: 'wallet' },
        { id: 'utilities', name: 'Utilities', icon: 'apps' },
        { id: 'settings', name: 'Settings', icon: 'settings' },
    ];

    const getFilteredApps = () => {
        let filtered = apps;

        // Filter by Work/Life
        const workCategories = ['productivity', 'finance', 'utilities']; // Define work categories
        // const lifeCategories = ['communication', 'entertainment', 'safety', 'settings', 'communication']; // Unused for now as we use exclusion logic

        if (appFilterType === 'work') {
            filtered = filtered.filter(app => workCategories.includes(app.category));
        } else {
            // Life includes everything else not strictly 'work'? Or specific list?
            // Let's use exclusion or specific inclusion.
            filtered = filtered.filter(app => !workCategories.includes(app.category));
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(app => app.category === selectedCategory);
        }
        if (searchQuery) {
            filtered = filtered.filter(app =>
                app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filtered;
    };

    const handleAppPress = (app: App) => {
        if (app.route === 'hourse') {
            navigation.navigate('FamilySettings');
            return;
        }
        navigation.navigate(app.route as never);
    };

    const renderAppIcon = (app: App) => {
        const { appWidth } = getGridConfig(screenDimensions.width);
        const iconSize = Math.max(20, Math.min(28, appWidth * 0.4));
        return (
            <TouchableOpacity
                key={app.id}
                style={{ alignItems: 'center', width: appWidth }}
                onPress={() => handleAppPress(app)}
            >
                <LinearGradient
                    colors={app.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 8,
                        width: Math.min(56, appWidth * 0.8),
                        height: Math.min(56, appWidth * 0.8),
                        borderRadius: Math.min(28, appWidth * 0.4),
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <CoolIcon name={app.icon as any} size={iconSize} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontWeight: '600', color: '#1a1a1a', textAlign: 'center', marginBottom: 2, fontSize: Math.max(10, Math.min(14, appWidth * 0.25)) }} numberOfLines={1}>{app.name}</Text>
                <Text style={{ color: '#666666', textAlign: 'center', fontSize: Math.max(8, Math.min(12, appWidth * 0.2)) }} numberOfLines={1}>{app.description}</Text>
            </TouchableOpacity>
        );
    };

    const renderAppsGrid = (appsList: App[]) => {
        const { appsPerRow, gapBetweenApps, appWidth } = getGridConfig(screenDimensions.width);

        // Custom logic to group by categories if "All" is selected, or just show grid if filtered
        const sections = [
            { title: 'Store', apps: appsList.filter(app => ['gallery', 'storage', 'notes'].includes(app.id)) },
            { title: 'General', apps: appsList.filter(app => ['communication', 'location', 'health'].includes(app.id)) },
            { title: 'Utilities', apps: appsList.filter(app => ['secondhand'].includes(app.id)) },
            { title: 'Finance', apps: appsList.filter(app => ['budget', 'expenses', 'savings', 'investments'].includes(app.id)) },
            { title: 'Settings', apps: appsList.filter(app => ['hourse', 'profile'].includes(app.id)) },
        ].filter(s => s.apps.length > 0);

        return sections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginRight: 12 }}>{section.title}</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#e9ecef' }} />
                </View>
                {(() => {
                    const rows = [] as App[][];
                    for (let i = 0; i < section.apps.length; i += appsPerRow) {
                        rows.push(section.apps.slice(i, i + appsPerRow));
                    }
                    return rows.map((row, rowIndex) => (
                        <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: gapBetweenApps }}>
                            {row.map(app => renderAppIcon(app))}
                            {Array.from({ length: appsPerRow - row.length }).map((_, index) => (
                                <View key={`empty-${index}`} style={{ width: appWidth }} />
                            ))}
                        </View>
                    ));
                })()}
            </View>
        ));
    };

    const filteredApps = getFilteredApps();

    const BackgroundWrapper = useMemo(() => {
        return ({ children }: { children: React.ReactNode }) => (
            <LinearGradient
                colors={['#FA7272', '#FFBBB4', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                {children}
            </LinearGradient>
        );
    }, []);

    const scrollViewRef = React.useRef<ScrollView>(null);
    const [categoriesY, setCategoriesY] = useState(0);

    const handleCategoryPress = (categoryId: string) => {
        setSelectedCategory(categoryId);
        if (scrollViewRef.current && categoriesY > 0) {
            scrollViewRef.current.scrollTo({ y: categoriesY - 20, animated: true });
        }
    };

    return (
        <BackgroundWrapper>
            <SafeAreaView style={homeStyles.container}>
                <WelcomeSection
                    mode="organize"
                    activeCategoryType={appFilterType}
                    onCategoryTypeChange={setAppFilterType}
                />

                <Animated.View style={[
                    homeStyles.mainContentCard,
                    {
                        transform: [{ translateY: cardMarginTopAnim }],
                        marginTop: -16,
                        backgroundColor: '#FFFFFF',
                        flex: 1,
                        overflow: 'hidden' // Important for rounded corners of the card
                    }
                ]}>
                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Header within Card - simplified */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' }}>Applications</Text>
                                <Text style={{ fontSize: 12, color: '#666666' }}>{filteredApps.length} apps • {getGridConfig(screenDimensions.width).appsPerRow} per row</Text>
                            </View>
                        </View>

                        {/* Search */}
                        <View style={{ paddingHorizontal: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderWidth: 1, borderColor: '#e9ecef' }}>
                                <CoolIcon name="search" size={20} color="#666666" />
                                <TextInput
                                    style={{ flex: 1, fontSize: 16, color: '#1a1a1a', fontWeight: '500' }}
                                    placeholder="Search applications..."
                                    placeholderTextColor="#999999"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                                {!!searchQuery && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <CoolIcon name="close-circle" size={20} color="#666666" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Categories */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginVertical: 16 }}
                            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                            onLayout={(event) => {
                                const layout = event.nativeEvent.layout;
                                setCategoriesY(layout.y);
                            }}
                        >
                            {categories.map(category => (
                                <TouchableOpacity key={category.id} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedCategory === category.id ? '#FF5A5A' : '#f8f9fa', borderWidth: 1, borderColor: selectedCategory === category.id ? '#FF5A5A' : '#e9ecef', gap: 8 }} onPress={() => handleCategoryPress(category.id)}>
                                    <CoolIcon name={category.icon as any} size={20} color={selectedCategory === category.id ? '#FFFFFF' : '#666666'} />
                                    <Text style={{ fontSize: 14, color: selectedCategory === category.id ? '#FFFFFF' : '#666666', fontWeight: selectedCategory === category.id ? '600' : '500' }}>{category.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Grid */}
                        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
                            {renderAppsGrid(filteredApps)}
                        </View>
                    </ScrollView>
                </Animated.View>
            </SafeAreaView>
        </BackgroundWrapper>
    );
};

export default AppsScreen;
