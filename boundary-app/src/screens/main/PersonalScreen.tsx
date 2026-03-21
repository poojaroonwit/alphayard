import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, RefreshControl, Animated, View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';
import { useBranding } from '../../contexts/BrandingContext';
// Components
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { CircleSelectionTabs } from '../../components/common/CircleSelectionTabs';
import CoolIcon from '../../components/common/CoolIcon';
import CalendarCardContent from '../../components/card/CalendarCardContent';
import NotesCardContent from '../../components/card/NotesCardContent';
import { PersonalFilesTab } from '../../components/files';
import { PersonalTab } from '../../components/home/PersonalTab';
import { ProfileFinancialTab as FinancialTab } from '../../components/profile/ProfileFinancialTab';
import { ProfileHealthTab as HealthTab } from '../../components/profile/ProfileHealthTab';
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
    { id: 'organize',  label: 'Organize',  icon: 'text-box-outline' },
    { id: 'work',      label: 'Work',      icon: 'briefcase-outline' },
    { id: 'finance',   label: 'Finance',   icon: 'wallet' },
    { id: 'health',    label: 'Health',    icon: 'heart-pulse' },
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

    const [activeTab, setActiveTab] = useState<'personal' | 'organize' | 'work' | 'finance' | 'health'>('personal');
    const [activeOrganizeTab, setActiveOrganizeTab] = useState<'note' | 'calendar' | 'files' | 'email'>('note');
    const [activeWorkTab, setActiveWorkTab] = useState<'learning' | 'career' | 'personality'>('learning');
    
    // Personality States
    const [isSurveying, setIsSurveying] = useState(false);
    const [actualMBTI, setActualMBTI] = useState<string | null>(null);
    const [expectedMBTI, setExpectedMBTI] = useState<string | null>(null);
    const [currentSurveyStep, setCurrentSurveyStep] = useState(0);
    const [showExpectationDrawer, setShowExpectationDrawer] = useState(false);

    const surveyQuestions = [
        { id: 1, text: "You enjoy vibrant social events with lots of people.", dimension: "E" },
        { id: 2, text: "You often spend time exploring unrealistic yet intriguing ideas.", dimension: "N" },
        { id: 3, text: "Your travel plans are usually well thought out.", dimension: "J" },
        { id: 4, text: "You become touched by the stories of others.", dimension: "F" },
        { id: 5, text: "You prefer to have a detailed daily routine.", dimension: "J" },
    ];

    const handleSurveyAnswer = (weight: number) => {
        console.log('Survey weight selected:', weight); // Use weight to avoid lint warning
        if (currentSurveyStep < surveyQuestions.length - 1) {
            setCurrentSurveyStep(currentSurveyStep + 1);
        } else {
            setActualMBTI('INTJ'); // Mock result
            setIsSurveying(false);
        }
    };

    const getMBTITitle = (type: string) => {
        const titles: Record<string, string> = {
            'INTJ': 'The Architect',
            'ENTJ': 'The Commander',
            'INFP': 'The Mediator',
            'ENFJ': 'The Protagonist',
        };
        return titles[type] || 'Personality Type';
    };

    const getMBTIBridgeTraits = (actual: string, expect: string) => {
        if (actual === expect) return "your core strengths";
        return "extraverted communication and emotional intelligence";
    };

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
        const newTab = tabId as 'personal' | 'organize' | 'work' | 'finance' | 'health';
        if (newTab === activeTab) return;

        const tabOrder = ['personal', 'organize', 'work', 'finance', 'health'];
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

    const renderLearningSection = (title: string, items: any[]) => (
        <View style={psStyles.learningSection}>
            <View style={psStyles.sectionHeader}>
                <Text style={psStyles.sectionTitle}>{title}</Text>
                <TouchableOpacity><Text style={psStyles.seeAllText}>See all</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
                {items.map((item, idx) => (
                    <TouchableOpacity key={idx} style={psStyles.learningCard}>
                        <View style={[psStyles.cardImage, { backgroundColor: item.color }]}>
                            <CoolIcon name={item.icon || "book-open-variant"} size={32} color="rgba(0,0,0,0.3)" />
                        </View>
                        <View style={psStyles.cardContent}>
                            <Text style={psStyles.courseTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={psStyles.courseAuthor}>{item.author}</Text>
                            {item.progress > 0 && (
                                <View style={psStyles.courseProgressContainer}>
                                    <View style={[psStyles.courseProgressFill, { width: `${item.progress * 100}%` as any }]} />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    // Animate to home when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            animateToHome();
        }, [animateToHome])
    );


    const renderContent = () => {
        switch (activeTab) {
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
                                    { id: 'calendar', label: 'Calendar', icon: 'calendar-month-outline' },
                                    { id: 'files', label: 'File', icon: 'folder-outline' },
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
                        {activeOrganizeTab === 'calendar' && <CalendarCardContent />}
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
            case 'work':
                return (
                    <View style={{ flex: 1 }}>
                        {/* Sub-tabs for Work */}
                        <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 }}>
                            <CircleSelectionTabs
                                activeTab={activeWorkTab}
                                onTabPress={(id) => setActiveWorkTab(id as any)}
                                tabs={[
                                    { id: 'learning', label: 'Learning', icon: 'school-outline' },
                                    { id: 'career', label: 'Career Path', icon: 'trending-up' },
                                    { id: 'personality', label: 'Personality', icon: 'brain' }
                                ]}
                                activeColor={organizeTabsConfig?.activeColor || "#FFFFFF"}
                                inactiveColor={organizeTabsConfig?.inactiveColor || "rgba(255,255,255,0.5)"}
                                activeTextColor={organizeTabsConfig?.activeTextColor || "#0EA5E9"}
                                inactiveTextColor={organizeTabsConfig?.inactiveTextColor || "#64748B"}
                                activeIconColor={organizeTabsConfig?.activeIconColor || "#0EA5E9"}
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
                        {activeWorkTab === 'learning' && (
                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                                {/* Certificate Bar */}
                                <TouchableOpacity 
                                    style={psStyles.certBar}
                                    activeOpacity={0.7}
                                >
                                    <View style={psStyles.certBarLeft}>
                                        <View style={psStyles.certIconCircle}>
                                            <CoolIcon name="certificate" size={24} color="#F59E0B" />
                                        </View>
                                        <View>
                                            <Text style={psStyles.certBarTitle}>My Certificates</Text>
                                            <Text style={psStyles.certBarSub}>12 achieved • 3 in progress</Text>
                                        </View>
                                    </View>
                                    <CoolIcon name="chevron-right" size={20} color="#94A3B8" />
                                </TouchableOpacity>

                                {/* Category Filters */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={psStyles.tagFilterContainer}>
                                    {['All topics', 'Design', 'Development', 'Business', 'Marketing', 'AI'].map((tag, i) => (
                                        <TouchableOpacity key={tag} style={[psStyles.tagItem, i === 0 && psStyles.tagItemActive]}>
                                            <Text style={[psStyles.tagText, i === 0 && psStyles.tagTextActive]}>{tag}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Sections */}
                                {renderLearningSection("Recently Viewed", [
                                    { title: "Advanced UI Patterns", author: "Design Academy", progress: 0.6, color: "#FEE2E2", icon: "palette" },
                                    { title: "React Native Mastery", author: "Code Master", progress: 0.2, color: "#E0F2FE", icon: "react" }
                                ])}

                                {renderLearningSection("Recommended for You", [
                                    { title: "Business Strategy 101", author: "Growth Hub", progress: 0, color: "#ECFDF5", icon: "briefcase" },
                                    { title: "AI for Product Managers", author: "Future Lab", progress: 0, color: "#F5F3FF", icon: "robot" },
                                    { title: "Data Viz with D3", author: "Visual Arts", progress: 0, color: "#FFFBEB", icon: "chart-bar" }
                                ])}

                                {renderLearningSection("Popular Choice", [
                                    { title: "English for Business", author: "Global Lang", progress: 0, color: "#FDF2F8", icon: "translate" },
                                    { title: "Python for Data Science", author: "PySchool", progress: 0, color: "#F0F9FF", icon: "language-python" }
                                ])}

                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                        {activeWorkTab === 'career' && (
                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                                {/* Work Timeline */}
                                <View style={psStyles.careerSection}>
                                    <View style={psStyles.sectionHeader}>
                                        <Text style={psStyles.sectionTitle}>Work Timeline</Text>
                                        <TouchableOpacity style={psStyles.addButtonSmall}>
                                            <CoolIcon name="plus" size={16} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={psStyles.timelineList}>
                                        {[
                                            { role: 'Senior Product Designer', company: 'TechFlow Inc.', date: '2022 - Present', current: true },
                                            { role: 'UI/UX Designer', company: 'Creative Studio', date: '2020 - 2022', current: false },
                                            { role: 'Junior Designer', company: 'StartUp Hub', date: '2018 - 2020', current: false }
                                        ].map((item, idx, arr) => (
                                            <View key={idx} style={psStyles.timelineItem}>
                                                <View style={psStyles.timelineLeft}>
                                                    <View style={[psStyles.timelineDot, item.current && psStyles.timelineDotActive]} />
                                                    {idx < arr.length - 1 && <View style={psStyles.timelineLine} />}
                                                </View>
                                                <View style={psStyles.timelineRight}>
                                                    <Text style={[psStyles.timelineRole, item.current && { color: '#059669' }]}>{item.role}</Text>
                                                    <Text style={psStyles.timelineCompany}>{item.company}</Text>
                                                    <Text style={psStyles.timelineDate}>{item.date}</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>

                                {/* Next Job Possibilities */}
                                <View style={psStyles.careerSection}>
                                    <View style={psStyles.sectionHeader}>
                                        <Text style={psStyles.sectionTitle}>Next Possibilities (AI Guide)</Text>
                                    </View>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 10 }}>
                                        {[
                                            { title: 'Lead Product Designer', salary: '$140k - $185k', advice: 'Focus on strategic design systems and cross-functional leadership.', color: '#F0FDFA', icon: 'star-outline' },
                                            { title: 'Design Manager', salary: '$160k - $210k', advice: 'Transition into people operations and design team scaling.', color: '#F5F3FF', icon: 'account-group-outline' },
                                            { title: 'Principal Designer', salary: '$175k - $230k', advice: 'Deep dive into specialized architecture and R&D.', color: '#FFFBEB', icon: 'flask-outline' }
                                        ].map((job, idx) => (
                                            <TouchableOpacity key={idx} style={psStyles.jobCard}>
                                                <View style={psStyles.jobCardHeader}>
                                                    <View style={[psStyles.jobIconBox, { backgroundColor: job.color }]}>
                                                        <CoolIcon name={job.icon} size={20} color="#1F2937" />
                                                    </View>
                                                    <View style={psStyles.aiBadge}>
                                                        <Text style={psStyles.aiBadgeText}>AI GUIDE</Text>
                                                    </View>
                                                </View>
                                                <Text style={psStyles.jobCardTitle}>{job.title}</Text>
                                                <Text style={psStyles.jobSalary}>{job.salary}</Text>
                                                <Text style={psStyles.jobAdvice} numberOfLines={2}>{job.advice}</Text>
                                                <TouchableOpacity style={psStyles.roadmapButton}>
                                                    <Text style={psStyles.roadmapButtonText}>View AI Roadmap</Text>
                                                    <CoolIcon name="arrow-right" size={14} color="#FFFFFF" />
                                                </TouchableOpacity>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}

                        {activeWorkTab === 'personality' && (
                            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                                {!isSurveying ? (
                                    <>
                                        {/* Personality Dual View */}
                                        <View style={psStyles.personalityHeader}>
                                            <View style={psStyles.personalityComparisonContainer}>
                                                {/* Actual (from Survey) */}
                                                <View style={psStyles.personalityCard}>
                                                    <Text style={psStyles.mbtiLabel}>ACTUAL</Text>
                                                    {actualMBTI ? (
                                                        <View style={psStyles.mbtiTypeBox}>
                                                            <Text style={psStyles.mbtiTypeText}>{actualMBTI}</Text>
                                                            <Text style={psStyles.mbtiSubLabel}>{getMBTITitle(actualMBTI)}</Text>
                                                        </View>
                                                    ) : (
                                                        <TouchableOpacity style={psStyles.surveyTrigger} onPress={() => setIsSurveying(true)}>
                                                            <CoolIcon name="pencil-outline" size={24} color="#6366F1" />
                                                            <Text style={psStyles.surveyTriggerText}>Take Survey</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>

                                                <CoolIcon name="swap-horizontal" size={24} color="#CBD5E1" style={{ marginTop: 40 }} />

                                                {/* Expected (from Drawer) */}
                                                <View style={psStyles.personalityCard}>
                                                    <Text style={psStyles.mbtiLabel}>EXPECTED</Text>
                                                    <TouchableOpacity style={psStyles.mbtiTypeBox} onPress={() => setShowExpectationDrawer(true)}>
                                                        {expectedMBTI ? (
                                                            <>
                                                                <Text style={[psStyles.mbtiTypeText, { color: '#8B5CF6' }]}>{expectedMBTI}</Text>
                                                                <Text style={psStyles.mbtiSubLabel}>{getMBTITitle(expectedMBTI)}</Text>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CoolIcon name="plus-circle-outline" size={24} color="#8B5CF6" />
                                                                <Text style={psStyles.surveyTriggerText}>Select Type</Text>
                                                            </>
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>

                                        {/* AI Bridge Guidance */}
                                        {actualMBTI && expectedMBTI && (
                                            <View style={psStyles.guidanceSection}>
                                                <View style={psStyles.guidanceHeader}>
                                                    <CoolIcon name="auto-fix" size={20} color="#6366F1" />
                                                    <Text style={psStyles.guidanceTitle}>AI Persona Bridge</Text>
                                                </View>
                                                <View style={psStyles.guidanceContent}>
                                                    <Text style={psStyles.guidanceText}>
                                                        To transition from <Text style={{fontWeight: '700'}}>{actualMBTI}</Text> to <Text style={{fontWeight: '700', color: '#8B5CF6'}}>{expectedMBTI}</Text>, focus on developing your <Text style={{fontStyle: 'italic'}}>{getMBTIBridgeTraits(actualMBTI, expectedMBTI)}</Text>.
                                                    </Text>
                                                    <TouchableOpacity style={psStyles.guidanceAction}>
                                                        <Text style={psStyles.guidanceActionText}>View Full Growth Plan</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}

                                        {/* Traits Breakdown (Placeholder) */}
                                        <View style={psStyles.traitsBreakdown}>
                                            <Text style={psStyles.sectionTitle}>Trait Dimensions</Text>
                                            {[
                                                { label: 'Energy', actual: 'Introvert', expected: 'Extrovert', progress: 0.4 },
                                                { label: 'Information', actual: 'Intuition', expected: 'Intuition', progress: 0.9 },
                                                { label: 'Decisions', actual: 'Thinking', expected: 'Feeling', progress: 0.3 },
                                                { label: 'Lifestyle', actual: 'Judging', expected: 'Judging', progress: 0.8 },
                                            ].map((trait, idx) => (
                                                <View key={idx} style={psStyles.traitRow}>
                                                    <View style={psStyles.traitInfo}>
                                                        <Text style={psStyles.traitName}>{trait.label}</Text>
                                                        <Text style={psStyles.traitValues}>{trait.actual} → {trait.expected}</Text>
                                                    </View>
                                                    <View style={psStyles.persProgressBar}>
                                                        <View style={[psStyles.persProgressFill, { width: `${trait.progress * 100}%` }]} />
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </>
                                ) : (
                                    /* MBTI Survey UI */
                                    <View style={psStyles.surveyContainer}>
                                        <TouchableOpacity style={psStyles.closeSurvey} onPress={() => setIsSurveying(false)}>
                                            <CoolIcon name="close" size={24} color="#64748B" />
                                        </TouchableOpacity>
                                        <Text style={psStyles.surveyTitle}>MBTI Assessment</Text>
                                        <Text style={psStyles.surveyStep}>Question {currentSurveyStep + 1} of {surveyQuestions.length}</Text>
                                        
                                        <View style={psStyles.questionCard}>
                                            <Text style={psStyles.questionText}>{surveyQuestions[currentSurveyStep]?.text}</Text>
                                            <View style={psStyles.optionsContainer}>
                                                {['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'].map((opt, idx) => (
                                                    <TouchableOpacity 
                                                        key={idx} 
                                                        style={psStyles.optionButton}
                                                        onPress={() => handleSurveyAnswer(idx)}
                                                    >
                                                        <Text style={psStyles.optionText}>{opt}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                )}
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <ScreenBackground screenId="personal">
            <SafeAreaView style={homeStyles.container}>
                <WelcomeSection mode="personal" />

                <Animated.View style={[
                    homeStyles.mainContentCard,
                    {
                        transform: [{ translateY: cardMarginTopAnim }],
                        marginTop: -24,
                        backgroundColor: '#FFFFFF',
                        flex: 1,
                        zIndex: 10,
                    }
                ]}>
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
                        ) : activeTab === 'finance' ? (
                            <Animated.View style={{
                                flex: 1,
                                opacity: tabContentOpacityAnim,
                                transform: [{ translateX: tabContentTranslateXAnim }],
                            }}>
                                <FinancialTab
                                    useScrollView={true}
                                    tabsConfig={organizeTabsConfig}
                                />
                            </Animated.View>
                        ) : activeTab === 'health' ? (
                            <Animated.View style={{
                                flex: 1,
                                opacity: tabContentOpacityAnim,
                                transform: [{ translateX: tabContentTranslateXAnim }],
                            }}>
                                <HealthTab tabsConfig={organizeTabsConfig} />
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

                {/* MBTI Expectation Drawer */}
            <Modal
                visible={showExpectationDrawer}
                transparent
                animationType="slide"
            >
                <View style={psStyles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowExpectationDrawer(false)} />
                    <View style={psStyles.bottomDrawer}>
                        <View style={psStyles.drawerHandle} />
                        <Text style={psStyles.drawerTitle}>Select Expected Result</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={psStyles.mbtiGrid}>
                                {['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'].map((type) => (
                                    <TouchableOpacity 
                                        key={type} 
                                        style={[psStyles.mbtiSelectItem, expectedMBTI === type && psStyles.mbtiSelectItemActive]}
                                        onPress={() => {
                                            setExpectedMBTI(type);
                                            setShowExpectationDrawer(false);
                                        }}
                                    >
                                        <Text style={[psStyles.mbtiSelectType, expectedMBTI === type && { color: '#6366F1' }]}>{type}</Text>
                                        <Text style={psStyles.mbtiSelectLabel}>{getMBTITitle(type)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
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

    // Learning UI Styles
    certBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFBEB',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        marginBottom: 20,
    },
    certBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    certIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    certBarTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#92400E',
    },
    certBarSub: {
        fontSize: 12,
        color: '#B45309',
        marginTop: 2,
    },
    tagFilterContainer: {
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 24,
    },
    tagItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    tagItemActive: {
        backgroundColor: '#FA7272',
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    tagTextActive: {
        color: '#FFFFFF',
    },
    learningSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
    },
    seeAllText: {
        fontSize: 13,
        color: '#FA7272',
        fontWeight: '600',
    },
    learningCard: {
        width: 180,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    cardImage: {
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        padding: 12,
    },
    courseTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 4,
    },
    courseAuthor: {
        fontSize: 11,
        color: '#94A3B8',
        marginBottom: 8,
    },
    courseProgressContainer: {
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        overflow: 'hidden',
    },
    courseProgressFill: {
        height: '100%',
        backgroundColor: '#FA7272',
    },

    // Career Path Styles
    careerSection: {
        marginBottom: 24,
    },
    addButtonSmall: {
        backgroundColor: '#10B981',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineList: {
        paddingHorizontal: 24,
        marginTop: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 80,
    },
    timelineLeft: {
        width: 20,
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E2E8F0',
        zIndex: 2,
        marginTop: 6,
    },
    timelineDotActive: {
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#D1FAE5',
    },
    timelineLine: {
        position: 'absolute',
        top: 15,
        bottom: -5,
        width: 2,
        backgroundColor: '#F1F5F9',
    },
    timelineRight: {
        flex: 1,
        paddingLeft: 16,
        paddingBottom: 20,
    },
    timelineRole: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    timelineCompany: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    timelineDate: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4,
    },
    jobCard: {
        width: 240,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    jobCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    jobIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiBadge: {
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    aiBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#7C3AED',
    },
    jobCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    jobSalary: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
        marginBottom: 8,
    },
    jobAdvice: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 16,
    },
    roadmapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7C3AED',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    roadmapButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Personality Styles
    personalityHeader: {
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        marginHorizontal: 16,
        marginBottom: 20,
    },
    personalityComparisonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    personalityCard: {
        flex: 1,
        alignItems: 'center',
    },
    mbtiLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 12,
    },
    mbtiTypeBox: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    mbtiTypeText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#6366F1',
    },
    mbtiSubLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 4,
    },
    surveyTrigger: {
        alignItems: 'center',
        paddingVertical: 16,
        width: '100%',
    },
    surveyTriggerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6366F1',
        marginTop: 8,
    },
    guidanceSection: {
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2FF',
        marginBottom: 20,
    },
    guidanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    guidanceTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    guidanceContent: {
        backgroundColor: '#F5F7FF',
        padding: 12,
        borderRadius: 12,
    },
    guidanceText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
    },
    guidanceAction: {
        marginTop: 12,
        alignItems: 'center',
    },
    guidanceActionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6366F1',
        textDecorationLine: 'underline',
    },
    traitsBreakdown: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    traitRow: {
        marginBottom: 16,
    },
    traitInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 6,
    },
    traitName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    traitValues: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    persProgressBar: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    persProgressFill: {
        height: '100%',
        backgroundColor: '#6366F1',
        borderRadius: 3,
    },
    surveyContainer: {
        padding: 24,
        flex: 1,
    },
    closeSurvey: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    surveyTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 8,
    },
    surveyStep: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 4,
        marginBottom: 32,
    },
    questionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
        lineHeight: 26,
        marginBottom: 32,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        paddingVertical: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomDrawer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 8,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    drawerHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 20,
    },
    mbtiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    mbtiSelectItem: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
    },
    mbtiSelectItemActive: {
        backgroundColor: '#EEF2FF',
        borderColor: '#C7D2FE',
    },
    mbtiSelectType: {
        fontSize: 16,
        fontWeight: '800',
        color: '#475569',
    },
    mbtiSelectLabel: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 4,
    },
});

export default PersonalScreen;


