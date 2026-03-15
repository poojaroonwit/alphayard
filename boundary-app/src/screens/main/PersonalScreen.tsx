import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, RefreshControl, Animated, View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';
import { useBranding } from '../../contexts/BrandingContext';
// Components

// Components
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { CircleSelectionTabs } from '../../components/common/CircleSelectionTabs';
import CoolIcon from '../../components/common/CoolIcon';
import CalendarCardContent from '../../components/card/CalendarCardContent';
import NotesCardContent from '../../components/card/NotesCardContent';
import { PersonalFilesTab } from '../../components/files';
import { PersonalTab } from '../../components/home/PersonalTab';
import { ProfileFinancialTab as FinancialTab } from '../../components/profile/ProfileFinancialTab';
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

interface AITask {
    id: string;
    title: string;
    status: 'pending' | 'done';
    category: string;
}

const INITIAL_TASKS: AITask[] = [
    { id: '1', title: 'Review your schedule for today',     status: 'done',    category: 'Schedule' },
    { id: '2', title: 'Check finance summary',              status: 'done',    category: 'Finance'  },
    { id: '3', title: 'Update health goals',                status: 'pending', category: 'Health'   },
    { id: '4', title: 'Review pending notes',               status: 'pending', category: 'Organize' },
    { id: '5', title: 'Set calendar reminders',             status: 'pending', category: 'Calendar' },
    { id: '6', title: 'Summarize weekly progress',          status: 'pending', category: 'AI'       },
];

const PERSONAL_TABS = [
    { id: 'personal',  label: 'AI',        icon: 'robot-outline' },
    { id: 'finance',   label: 'Finance',   icon: 'wallet' },
    { id: 'health',    label: 'Health',    icon: 'heart-pulse' },
    { id: 'calendar',  label: 'Calendar',  icon: 'calendar' },
    { id: 'organize',  label: 'Organize',  icon: 'text-box-outline' },
];

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
    

    // Find tab-navigation (Mobile Tabbar) config for Organize tabs
    const tabNavigationConfig = React.useMemo(() => {
        if (!categories) return null;
        for (const cat of categories) {
            const comp = cat.components.find((c: any) => c.id === 'tab-navigation');
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
    const [activeOrganizeTab, setActiveOrganizeTab] = useState<'note' | 'files' | 'email'>('note');

    // Animation for tabs
    const tabContentOpacityAnim = useState(new Animated.Value(1))[0];
    const tabContentTranslateXAnim = useState(new Animated.Value(0))[0];

    const [showEmotionModal, setShowEmotionModal] = useState(false);
    const [showCircleStatsDrawer, setShowCircleStatsDrawer] = useState(false);
    const [showAttentionDrawer, setShowAttentionDrawer] = useState(false);
    const [showTaskList, setShowTaskList] = useState(false);
    const [tasks, setTasks] = useState<AITask[]>(INITIAL_TASKS);
    const insets = useSafeAreaInsets();

    const doneTasks = useMemo(() => tasks.filter(t => t.status === 'done').length, [tasks]);
    const remainTasks = useMemo(() => tasks.filter(t => t.status === 'pending').length, [tasks]);

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t
        ));
    };

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

    const { animateToHome } = useNavigationAnimation();

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
            case 'calendar':
                return <CalendarCardContent />;
            case 'organize':
                return (
                    <View style={{ flex: 1 }}>
                        {/* Sub-tabs for Organize */}
                        <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 }}>
                            <CircleSelectionTabs
                                activeTab={activeOrganizeTab}
                                onTabPress={(id) => setActiveOrganizeTab(id as any)}
                                tabs={[
                                    { id: 'note', label: 'Note', icon: 'note-text-outline' },
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
                                itemSpacing={4}
                                fit={true}
                                variant="segmented"
                                showIcons={true}
                                iconPosition="left"
                            />
                        </View>

                        {/* Content Switching */}
                        {activeOrganizeTab === 'note' && <NotesCardContent />}
                        {activeOrganizeTab === 'files' && (
                             <PersonalFilesTab />
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
                        <FinancialTab 
                            useScrollView={false} 
                        />
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
            <SafeAreaView style={[homeStyles.container, { backgroundColor: '#FFFFFF' }]}>
                <WelcomeSection mode="personal" />

                <Animated.View style={[homeStyles.mainContentCard]}>
                    {/* Top horizontal tab menu */}
                    <View style={psStyles.topTabMenu}>
                        {PERSONAL_TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[psStyles.tabItem, isActive && psStyles.tabItemActive]}
                                    onPress={() => onTabPress(tab.id)}
                                    activeOpacity={0.75}
                                >
                                    <CoolIcon
                                        name={tab.icon}
                                        size={20}
                                        color={isActive ? '#FA7272' : '#94A3B8'}
                                    />
                                    <Text style={[psStyles.tabLabel, isActive && psStyles.tabLabelActive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Main content area */}
                    <Animated.View style={[
                        { flex: 1 },
                        {
                            opacity: contentOpacityAnim,
                            transform: [{ scale: contentScaleAnim }],
                        }
                    ]}>
                        {activeTab === 'personal' ? (
                            <Animated.View style={{
                                flex: 1,
                                opacity: tabContentOpacityAnim,
                                transform: [{ translateX: tabContentTranslateXAnim }],
                            }}>
                                <PersonalTab
                                    circleStatusMembers={circleStatusMembers}
                                    circleLocations={circleLocations}
                                    selectedCircle={selectedCircle}
                                    isCircleLoading={loading}
                                    onOpenApps={() => navigation.navigate('Apps', { screen: 'AppsMain' })}
                                    onGoToFinance={() => onTabPress('finance')}
                                />
                            </Animated.View>
                        ) : (
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
                        )}
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

                {/* AI Task Bar — shown only on AI tab, floats above bottom nav and chat input */}
                {activeTab === 'personal' && (
                    <TouchableOpacity
                        style={[psStyles.taskBar, { bottom: 82 }]}
                        onPress={() => setShowTaskList(true)}
                        activeOpacity={0.88}
                    >
                        <View style={psStyles.taskBarLeft}>
                            <CoolIcon name="robot-outline" size={15} color="#FA7272" />
                            <Text style={psStyles.taskBarTitle}>AI Tasks</Text>
                        </View>
                        <View style={psStyles.taskBarRight}>
                            <View style={psStyles.taskBadgeDone}>
                                <Text style={psStyles.taskBadgeDoneText}>{doneTasks} done</Text>
                            </View>
                            <View style={psStyles.taskBadgePending}>
                                <Text style={psStyles.taskBadgePendingText}>{remainTasks} left</Text>
                            </View>
                            <CoolIcon name="chevron-up" size={15} color="#9CA3AF" />
                        </View>
                    </TouchableOpacity>
                )}

                {/* AI Task List Modal */}
                <Modal
                    visible={showTaskList}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowTaskList(false)}
                >
                    <Pressable style={psStyles.modalBackdrop} onPress={() => setShowTaskList(false)} />
                    <View style={[psStyles.taskSheet, { paddingBottom: insets.bottom + 16 }]}>
                        {/* Handle */}
                        <View style={psStyles.sheetHandle} />
                        {/* Header */}
                        <View style={psStyles.sheetHeader}>
                            <View style={psStyles.sheetHeaderLeft}>
                                <CoolIcon name="robot-outline" size={18} color="#FA7272" />
                                <Text style={psStyles.sheetTitle}>AI Tasks</Text>
                            </View>
                            <View style={psStyles.sheetProgress}>
                                <Text style={psStyles.sheetProgressText}>{doneTasks}/{tasks.length} done</Text>
                            </View>
                        </View>
                        {/* Progress bar */}
                        <View style={psStyles.progressBar}>
                            <View style={[psStyles.progressFill, { width: `${(doneTasks / tasks.length) * 100}%` as any }]} />
                        </View>
                        {/* Task list */}
                        <FlatList
                            data={tasks}
                            keyExtractor={t => t.id}
                            style={{ marginTop: 12 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={psStyles.taskItem}
                                    onPress={() => toggleTask(item.id)}
                                    activeOpacity={0.75}
                                >
                                    <CoolIcon
                                        name={item.status === 'done' ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                        size={20}
                                        color={item.status === 'done' ? '#FA7272' : '#D1D5DB'}
                                    />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[psStyles.taskTitle, item.status === 'done' && psStyles.taskTitleDone]}>
                                            {item.title}
                                        </Text>
                                        <Text style={psStyles.taskCategory}>{item.category}</Text>
                                    </View>
                                    {item.status === 'done' && (
                                        <View style={psStyles.taskDoneBadge}>
                                            <Text style={psStyles.taskDoneBadgeText}>Done</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 16 }} />}
                        />
                    </View>
                </Modal>

            </SafeAreaView>
        </ScreenBackground>
    );
};

const psStyles = StyleSheet.create({
    topTabMenu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 100,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
    },
    tabItemActive: {
        backgroundColor: '#FFF1F2',
    },
    tabLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        textAlign: 'center',
    },
    tabLabelActive: {
        color: '#FA7272',
    },

    // Task bar
    taskBar: {
        position: 'absolute',
        left: 12,
        right: 12,
        height: 44,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        zIndex: 200,
    },
    taskBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    taskBarTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
    },
    taskBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    taskBadgeDone: {
        backgroundColor: '#DCFCE7',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    taskBadgeDoneText: {
        fontSize: 11,
        color: '#16A34A',
        fontWeight: '600',
    },
    taskBadgePending: {
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    taskBadgePendingText: {
        fontSize: 11,
        color: '#D97706',
        fontWeight: '600',
    },

    // Task list modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    taskSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '70%',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    sheetHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sheetTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
    },
    sheetProgress: {
        backgroundColor: '#FFF0F0',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    sheetProgressText: {
        fontSize: 12,
        color: '#FA7272',
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 20,
        borderRadius: 2,
    },
    progressFill: {
        height: 4,
        backgroundColor: '#FA7272',
        borderRadius: 2,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    taskTitle: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    taskTitleDone: {
        textDecorationLine: 'line-through',
        color: '#9CA3AF',
    },
    taskCategory: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },
    taskDoneBadge: {
        backgroundColor: '#DCFCE7',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    taskDoneBadgeText: {
        fontSize: 11,
        color: '#16A34A',
        fontWeight: '600',
    },
});

export default PersonalScreen;


