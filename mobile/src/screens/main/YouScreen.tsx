import React, { useState, useMemo, useEffect } from 'react';
import { ScrollView, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';

// Components
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { TabNavigation } from '../../components/home/TabNavigation';
import CalendarCardContent from '../../components/card/CalendarCardContent';
import NotesCardContent from '../../components/card/NotesCardContent';
import { YouTab } from '../../components/home/YouTab';
import { HouseStatsDrawer } from '../../components/home/HouseStatsDrawer';
import { AttentionDrawer } from '../../components/home/AttentionDrawer';
import { EmotionCheckInModal } from '../../components/home/EmotionCheckInModal';
// import { useMainContent } from '../../contexts/MainContentContext';

// Hooks and Utils
import { useNavigation } from '@react-navigation/native';
import { useHomeBackground } from '../../hooks/useAppConfig';
import { emotionService } from '../../services/emotionService';

// Constants and Styles
import { ATTENTION_APPS } from '../../constants/home';
import { homeStyles } from '../../styles/homeStyles';

const YouScreen: React.FC = () => {
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    useHomeBackground();

    const {
        familyStatusMembers,
        familyLocations,
        selectedFamily,
        loading,
        refreshing,
        onRefresh: refreshUserData,
        loadData: loadUserData, // Added for Emotion Modal check
    } = useUserData();

    const [activeTab, setActiveTab] = useState<'you' | 'calendar' | 'organize'>('you');

    // Animation for tabs
    const tabContentOpacityAnim = useState(new Animated.Value(1))[0];
    const tabContentTranslateXAnim = useState(new Animated.Value(0))[0];

    const [showEmotionModal, setShowEmotionModal] = useState(false);
    const [showHouseStatsDrawer, setShowHouseStatsDrawer] = useState(false);
    const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
    const [showAttentionDrawer, setShowAttentionDrawer] = useState(false);

    // Tab switch logic with animation
    const onTabPress = (tabId: string) => {
        const newTab = tabId as 'you' | 'calendar' | 'organize';
        if (newTab === activeTab) return;

        const tabOrder = ['you', 'calendar', 'organize'];
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

    const renderContent = () => {
        switch (activeTab) {
            case 'you':
                return (
                    <YouTab
                        familyStatusMembers={familyStatusMembers}
                        familyLocations={familyLocations}
                        selectedFamily={selectedFamily}
                        isFamilyLoading={loading}
                        onOpenApps={() => {
                            navigation.navigate('Apps', { screen: 'AppsMain' });
                        }}
                        onGoToFinance={() => {
                            console.log('Go to finance');
                        }}
                    />
                );
            case 'calendar':
                return <CalendarCardContent />;
            case 'organize':
                return <NotesCardContent />;
            default:
                return null;
        }
    };

    return (
        <BackgroundWrapper>
            <SafeAreaView style={homeStyles.container}>
                <WelcomeSection mode="you" />

                <Animated.View style={[
                    homeStyles.mainContentCard,
                    {
                        transform: [{ translateY: cardMarginTopAnim }],
                        marginTop: -16,
                        backgroundColor: '#FFFFFF',
                    }
                ]}>
                    <TabNavigation
                        activeTab={activeTab}
                        onTabPress={onTabPress}
                        tabs={[
                            { id: 'you', label: 'You', icon: 'account' },
                            { id: 'calendar', label: 'Calendar', icon: 'calendar' },
                            { id: 'organize', label: 'Organize', icon: 'text-box-outline' }
                        ]}
                    />

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

                {/* House Stats Drawer - Maybe accessible from YouTab? */}
                <HouseStatsDrawer
                    visible={showHouseStatsDrawer}
                    onClose={() => setShowHouseStatsDrawer(false)}
                    currentFamily={null} // We might need to pass the full family object if we want to support switching here
                    onSwitchFamily={() => setShowFamilyDropdown(true)}
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

                {/* FamilyDropdown needed for HouseStatsDrawer switching */}
                {/* We need to import FamilyDropdown first if we want to use it here, 
                    or remove the switch capability. For now, let's comment out the usage 
                    to fix lint if we aren't importing it yet. */}
                {/* 
                <FamilyDropdown
                    visible={showFamilyDropdown}
                    ...
                /> 
                */}

            </SafeAreaView>
        </BackgroundWrapper>
    );
};

export default YouScreen;
