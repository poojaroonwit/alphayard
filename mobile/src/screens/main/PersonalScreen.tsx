import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, Animated, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';
import { useBranding } from '../../contexts/BrandingContext';
// Components

// Components
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { CircleSelectionTabs } from '../../components/common/CircleSelectionTabs';
import CalendarCardContent from '../../components/card/CalendarCardContent';
import NotesCardContent from '../../components/card/NotesCardContent';
import { PersonalTab } from '../../components/home/PersonalTab';
import { FinancialTab } from '../../components/home/FinancialTab';
import { HealthSummary } from '../../components/home/HealthSummary';
import { CircleStatsDrawer } from '../../components/home/CircleStatsDrawer';
import { AttentionDrawer } from '../../components/home/AttentionDrawer';
import { EmotionCheckInModal } from '../../components/home/EmotionCheckInModal';
// import { useMainContent } from '../../contexts/MainContentContext';

// Hooks and Utils
import { useNavigation } from '@react-navigation/native';
import { ScreenBackground } from '../../components/ScreenBackground';
import { emotionService } from '../../services/emotionService';

// Constants and Styles
import { ATTENTION_APPS } from '../../constants/home';
import { homeStyles } from '../../styles/homeStyles';



const PersonalScreen: React.FC = () => {
    const { user } = useAuth();
    const navigation = useNavigation<any>();


    const {
        circleStatusMembers,
        circleLocations,
        selectedCircle,
        loading,
        refreshing,
        onRefresh: refreshUserData,
        loadData: loadUserData, // Added for Emotion Modal check
    } = useUserData();

    const { categories } = useBranding();
    
    // Find selection-tabs config
    const selectionTabsConfig = React.useMemo(() => {
        if (!categories) return null;
        for (const cat of categories) {
            const comp = cat.components.find(c => c.id === 'selection-tabs');
            if (comp) return comp;
        }
        return null;
    }, [categories]);

    const tabsConfig = selectionTabsConfig?.config || {};

    // Find tab-navigation (Mobile Tabbar) config for Organize tabs
    const tabNavigationConfig = React.useMemo(() => {
        if (!categories) return null;
        for (const cat of categories) {
            const comp = cat.components.find(c => c.id === 'tab-navigation');
            if (comp) return comp;
        }
        return null;
    }, [categories]);

    // Map `tab-navigation` styles to CircleSelectionTabs props
    // Mobile Tabbar usually has light background.
    // If we want it to look like "Mobile Tabbar", we extract styles.
    // For CircleSelectionTabs:
    // activeColor: The highlight color for the selected tab.
    // inactiveColor: background for unselected.
    const organizeTabsConfig = React.useMemo(() => {
        const styles = (tabNavigationConfig?.styles || {}) as any;
        const config = tabNavigationConfig?.config || {};
        
        const bgColor = styles.backgroundColor?.solid || 'transparent';
        const txtColor = styles.textColor?.solid || '#64748B';

        // Default fallbacks using styles from 'Mobile Tabbar'
        return {
            activeColor: config.activeColor || '#FFFFFF', 
            inactiveColor: config.inactiveColor || bgColor,
            activeTextColor: config.activeTextColor || '#FA7272',
            inactiveTextColor: config.inactiveTextColor || txtColor,
            activeIconColor: config.activeIconColor || '#FA7272',
            inactiveIconColor: config.inactiveIconColor || txtColor,
            menuBackgroundColor: config.menuBackgroundColor || 'transparent',
            menuShowShadow: config.menuShowShadow || 'none',
            activeShowShadow: config.activeShowShadow || 'sm',
            inactiveShowShadow: config.inactiveShowShadow || 'none',
            ...config
        };
    }, [tabNavigationConfig]);

    const [activeTab, setActiveTab] = useState<'personal' | 'calendar' | 'organize' | 'finance' | 'health'>('personal');
    const [activeOrganizeTab, setActiveOrganizeTab] = useState<'note' | 'todo' | 'shopping' | 'files' | 'email'>('note');

    // Animation for tabs
    const tabContentOpacityAnim = useState(new Animated.Value(1))[0];
    const tabContentTranslateXAnim = useState(new Animated.Value(0))[0];

    const [showEmotionModal, setShowEmotionModal] = useState(false);
    const [showCircleStatsDrawer, setShowCircleStatsDrawer] = useState(false);
    const [showAttentionDrawer, setShowAttentionDrawer] = useState(false);

    // Tab switch logic with animation
    const onTabPress = (tabId: string) => {
        const newTab = tabId as 'personal' | 'calendar' | 'organize' | 'finance' | 'health';
        if (newTab === activeTab) return;

        const tabOrder = ['personal', 'calendar', 'organize', 'finance', 'health'];
        const currentIndex = tabOrder.indexOf(activeTab);
        const newIndex = tabOrder.indexOf(newTab);
        const direction = newIndex > currentIndex ? 1 : -1;

        Animated.parallel([
            Animated.timing(tabContentOpacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(tabContentTranslateXAnim, {
                toValue: -30 * direction,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setActiveTab(newTab);
            tabContentTranslateXAnim.setValue(30 * direction);

            Animated.parallel([
                Animated.timing(tabContentOpacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(tabContentTranslateXAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const { animateToHome, cardMarginTopAnim } = useNavigationAnimation();

    // Local animation for content appearance (scale/fade) - simplified from MainContentContext
    // We can just keep it static or use a simple entry animation
    const contentOpacityAnim = useState(new Animated.Value(1))[0];
    const contentScaleAnim = useState(new Animated.Value(1))[0];


    // Check for emotion check-in (1 PM - Midnight)
    useEffect(() => {
        const checkEmotionStatus = async () => {
            if (!user) return;
            const now = new Date();
            const hour = now.getHours();
            // Show between 1 PM (13:00) and Midnight
            if (hour >= 13 && hour <= 23) {
                const hasChecked = await emotionService.hasCheckedToday();
                if (!hasChecked) {
                    setShowEmotionModal(true);
                }
            }
        };
        checkEmotionStatus();
    }, [user]);

    // Animate to home when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            animateToHome();
        }, [animateToHome])
    );


    const renderContent = () => {
        switch (activeTab) {
            case 'personal':
                return (
                    <PersonalTab
                        circleStatusMembers={circleStatusMembers}
                        circleLocations={circleLocations}
                        selectedCircle={selectedCircle}
                        isCircleLoading={loading}
                        onOpenApps={() => {
                            navigation.navigate('Apps', { screen: 'AppsMain' });
                        }}
                        onGoToFinance={() => {
                            onTabPress('finance');
                        }}
                    />
                );
            case 'calendar':
                return <CalendarCardContent />;
            case 'organize':
                return (
                    <View style={{ flex: 1 }}>
                        {/* Sub-tabs for Organize */}
                        <View style={{ paddingHorizontal: 0, marginBottom: 16 }}>
                            <CircleSelectionTabs
                                activeTab={activeOrganizeTab}
                                onTabPress={(id) => setActiveOrganizeTab(id as any)}
                                tabs={[
                                    { id: 'note', label: 'Note', icon: 'note-text-outline' },
                                    { id: 'todo', label: 'Todo list', icon: 'checkbox-marked-circle-outline' },
                                    { id: 'shopping', label: 'Shopping list', icon: 'cart-outline' },
                                    { id: 'files', label: 'My file', icon: 'folder-outline' },
                                    { id: 'email', label: 'Email', icon: 'email-outline' }
                                ]}
                                activeColor={organizeTabsConfig?.activeColor || "#FFFFFF"}
                                inactiveColor={organizeTabsConfig?.inactiveColor || "rgba(255,255,255,0.5)"}
                                activeTextColor={organizeTabsConfig?.activeTextColor || "#FA7272"}
                                inactiveTextColor={organizeTabsConfig?.inactiveTextColor || "#64748B"}
                                activeIconColor={organizeTabsConfig?.activeIconColor || "#FA7272"}
                                inactiveIconColor={organizeTabsConfig?.inactiveIconColor || "#64748B"}
                                menuBackgroundColor={organizeTabsConfig?.menuBackgroundColor || 'transparent'}
                                activeShowShadow={organizeTabsConfig?.activeShowShadow || 'sm'}
                                inactiveShowShadow={organizeTabsConfig?.inactiveShowShadow || 'none'}
                                itemSpacing={8}
                                fit={true}
                            />
                        </View>

                        {/* Content Switching */}
                        {activeOrganizeTab === 'note' && <NotesCardContent />}
                        {activeOrganizeTab === 'todo' && (
                             <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16 }}>
                                 <Text style={{ color: '#9CA3AF' }}>Todo List Content</Text>
                             </View>
                        )}
                        {activeOrganizeTab === 'shopping' && (
                             <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16 }}>
                                 <Text style={{ color: '#9CA3AF' }}>Shopping List Content</Text>
                             </View>
                        )}
                        {activeOrganizeTab === 'files' && (
                             <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16 }}>
                                 <Text style={{ color: '#9CA3AF' }}>My Files Content</Text>
                             </View>
                        )}
                        {activeOrganizeTab === 'email' && (
                             <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16 }}>
                                 <Text style={{ color: '#9CA3AF' }}>Email Content</Text>
                             </View>
                        )}
                    </View>
                );
            case 'finance':
                return (
                    <View style={{ paddingBottom: 0 }}>
                        <FinancialTab onBack={() => onTabPress('personal')} />
                    </View>
                );
            case 'health':
                return (
                    <View style={{ paddingTop: 0 }}>
                        <HealthSummary />
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <ScreenBackground screenId="personal">
            <SafeAreaView style={homeStyles.container}>
                <WelcomeSection mode="personal">
                    <View style={{ paddingTop: 15, paddingBottom: 0, paddingHorizontal: 0, marginHorizontal: -8 }}>
                        <CircleSelectionTabs
                            activeTab={activeTab}
                            onTabPress={onTabPress}
                            tabs={[
                                { id: 'personal', label: 'My Space', icon: 'account' },
                                { id: 'finance', label: 'Finance', icon: 'wallet' },
                                { id: 'health', label: 'Health', icon: 'heart-pulse' },
                                { id: 'calendar', label: 'Calendar', icon: 'calendar' },
                                { id: 'organize', label: 'Organize', icon: 'text-box-outline' }
                            ]}
                            activeColor={tabsConfig.activeColor || "#1d1515ff"}
                            inactiveColor={tabsConfig.inactiveColor || "#F3F4F6"}
                            activeTextColor={tabsConfig.activeTextColor || "#171616ff"}
                            inactiveTextColor={tabsConfig.inactiveTextColor || "#6B7280"}
                            activeIconColor={tabsConfig.activeIconColor || "#FFFFFF"}
                            inactiveIconColor={tabsConfig.inactiveIconColor || "#6B7280"}
                            menuBackgroundColor={tabsConfig.menuBackgroundColor || 'transparent'}
                            fit={tabsConfig.fit === 'fit' || tabsConfig.fit === true}
                            menuShowShadow={tabsConfig.menuShowShadow}
                            activeShowShadow={tabsConfig.activeShowShadow}
                            inactiveShowShadow={tabsConfig.inactiveShowShadow}
                        />
                    </View>
                </WelcomeSection>

                <Animated.View style={[
                    homeStyles.mainContentCard,
                    {
                        transform: [{ translateY: cardMarginTopAnim }],
                        marginTop: 0,
                        backgroundColor: '#FFFFFF',
                    }
                ]}>
                    <Animated.View style={[
                        { flex: 1 },
                        {
                            opacity: contentOpacityAnim,
                            transform: [{ scale: contentScaleAnim }],
                        }
                    ]}>
                        <ScrollView
                            style={homeStyles.cardScrollView}
                            contentContainerStyle={homeStyles.cardScrollContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={refreshUserData}
                                    colors={['#D32F2F']}
                                    tintColor="#D32F2F"
                                />
                            }
                        >

                            <Animated.View style={{
                                opacity: tabContentOpacityAnim,
                                transform: [{ translateX: tabContentTranslateXAnim }],
                            }}>
                                {renderContent()}
                            </Animated.View>
                        </ScrollView>
                    </Animated.View>
                </Animated.View>



                {/* Circle Stats Drawer - Maybe accessible from YouTab? */}
                <CircleStatsDrawer
                    visible={showCircleStatsDrawer}
                    onClose={() => setShowCircleStatsDrawer(false)}
                    currentCircle={null} // We might need to pass the full circle object if we want to support switching here
                    onSwitchCircle={() => {}}
                />

                {/* Attention List Drawer Modal */}
                <AttentionDrawer
                    visible={showAttentionDrawer}
                    onClose={() => setShowAttentionDrawer(false)}
                    attentionApps={ATTENTION_APPS as any}
                />

                <EmotionCheckInModal
                    visible={showEmotionModal}
                    onClose={() => setShowEmotionModal(false)}
                    onSuccess={() => {
                        loadUserData();
                    }}
                />



            </SafeAreaView>
        </ScreenBackground>
    );
};

export default PersonalScreen;


