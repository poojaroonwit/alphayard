import React, { useState } from 'react';
import { Animated, View, Alert, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { homeStyles } from '../../styles/homeStyles';
import { CircleTab } from '../../components/home/CircleTab';
import { useCircle } from '../../hooks/useCircle';
import { useUserData } from '../../contexts/UserDataContext'; // Keep for emotionData
import { CircleStatsDrawer } from '../../components/home/CircleStatsDrawer';
import { CircleDropdown } from '../../components/home/CircleDropdown';
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { ScreenBackground } from '../../components/ScreenBackground';
import CoolIcon from '../../components/common/CoolIcon';
import { CircleOptionsDrawer } from '../../components/home/CircleOptionsDrawer';
import { CircleHeaderDrawer } from '../../components/home/CircleHeaderDrawer';
import { useBranding } from '../../contexts/BrandingContext';

const CircleScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    
    // Use the new useCircle hook
    const { 
        circles, 
        currentCircle, 
        selectCircle, 
        members: circleMembers,
        leaveCircle 
    } = useCircle();
    
    // Keep emotionData from useUserData as it might be global or derived differently
    // circleLocations is also in useUserData
    const { emotionData, circleLocations } = useUserData();

    const { categories } = useBranding();
    const selectionTabsConfig = React.useMemo(() => {
        if (!categories) return null;
        for (const cat of categories) {
            const comp = cat.components.find((c: any) => c.id === 'circle-selection-tabs');
            if (comp) return comp;
        }
        for (const cat of categories) {
            const comp = cat.components.find((c: any) => c.id === 'selection-tabs');
            if (comp) return comp;
        }
        return null;
    }, [categories]);
    const tabsConfig = selectionTabsConfig?.config || {};

    const [showCircleStatsDrawer, setShowCircleStatsDrawer] = useState(false);
    const [showCircleDropdown, setShowCircleDropdown] = useState(false);
    const [showCircleOptions, setShowCircleOptions] = useState(false);
    const [showCircleHeaderDrawer, setShowCircleHeaderDrawer] = useState(false);
    const [activeTab, setActiveTab] = useState('location');

    // Use currentCircle from hook (which uses useUserData internally)
    // Cast to any for now if types conflict, effectively "currentCircleObject"
    const currentCircleObject = currentCircle;
    const selectedCircle = currentCircle?.name;

    // Filter tabs based on settings
    // Ensure settings exist (fallback to empty object if undefined)
    const currentCircleSettings = (currentCircleObject as any)?.settings || {};
    
    const tabs = React.useMemo(() => {
        const t = [];
        // Location is generally always available or controlled by allowLocationSharing
        if (currentCircleSettings.allowLocationSharing !== false && tabsConfig.showLocationTab !== false) {
             t.push({ id: 'location', label: 'Location', icon: 'map-marker' });
        }
        
        // Gallery - defaulted to true if not set
        if (currentCircleSettings.allowGallery !== false && tabsConfig.showGalleryTab !== false) {
             t.push({ id: 'gallery', label: 'Gallery', icon: 'image-multiple' });
        }
        
        // Financial - show by default unless explicitly disabled
        if (currentCircleSettings.allowCircleExpenses !== false && tabsConfig.showFinancialTab !== false) {
             t.push({ id: 'financial', label: 'Financial', icon: 'wallet' });
        }
        
        // Health - show by default unless explicitly disabled
        if (currentCircleSettings.allowCircleHealth !== false && tabsConfig.showHealthTab !== false) {
             t.push({ id: 'health', label: 'Health', icon: 'heart-pulse' });
        }
        
        // Files - show by default unless explicitly disabled
        if (currentCircleSettings.allowCircleFiles !== false && tabsConfig.showFilesTab !== false) {
             t.push({ id: 'files', label: 'Files', icon: 'folder-outline' });
        }

        // Pets - show by default unless explicitly disabled
        if (currentCircleSettings.allowCirclePets !== false && tabsConfig.showPetsTab !== false) {
             t.push({ id: 'pets', label: 'Pets', icon: 'paw' });
        }
        
        // Fallback: if somehow empty, show location (unless specifically hidden)
        if (t.length === 0 && tabsConfig.showLocationTab !== false) {
             t.push({ id: 'location', label: 'Location', icon: 'map-marker' });
        }
        return t;
    }, [currentCircleSettings, tabsConfig]);

    // Helper to handle circle selection from dropdown
    const handleCircleSelect = (circle: any) => {
        selectCircle(circle.name);
        setShowCircleDropdown(false);
    };

    const handleViewProfile = () => {
        setShowCircleHeaderDrawer(false);
        navigation.navigate('CircleDetail');
    };

    const handleOpenSwitchCircle = () => {
        setShowCircleHeaderDrawer(false);
        setTimeout(() => setShowCircleDropdown(true), 150);
    };

    const handleInviteMember = () => {
        setShowCircleOptions(false);
        navigation.navigate('CircleSettings', { initialTab: 'members' });
    };

    const handleLeaveCircle = async () => {
        if (!currentCircleObject?.id) {
            Alert.alert('Error', 'No circle selected');
            return;
        }

        Alert.alert(
            'Leave Circle',
            `Are you sure you want to leave "${currentCircleObject.name}"? You will need to be invited again to rejoin.`,
            [
                { text: 'Cancel', style: 'cancel', onPress: () => setShowCircleOptions(false) },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (leaveCircle) {
                                await leaveCircle();
                            }
                            setShowCircleOptions(false);
                            Alert.alert('Success', 'You have left the circle');
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to leave circle');
                        }
                    }
                }
            ]
        );
    };

    const handleChangeVisibility = () => {
        setShowCircleOptions(false);
        // Navigate to settings or show visibility modal
        // For now, navigate to settings - can be enhanced with a dedicated visibility modal later
        navigation.navigate('CircleSettings', { initialTab: 'settings' });
    };

    const { animateToHome, cardMarginTopAnim } = useNavigationAnimation();

    // Animate to home when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            animateToHome();
        }, [animateToHome])
    );

    return (
        <ScreenBackground screenId="circle">
            <SafeAreaView style={homeStyles.container}>
                <WelcomeSection
                    mode="circle"
                    title={selectedCircle || (circles && circles.length > 0 ? circles[0].name : "Select Circle")}
                    onTitlePress={() => setShowCircleHeaderDrawer(true)}
                    onMenuPress={() => setShowCircleOptions(true)}
                />

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
                    <View style={cStyles.topTabMenu}>
                        {tabs.map(tab => {
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[cStyles.tabItem, isActive && cStyles.tabItemActive]}
                                    onPress={() => setActiveTab(tab.id)}
                                    activeOpacity={0.75}
                                >
                                    <CoolIcon
                                        name={tab.icon as any}
                                        size={20}
                                        color={isActive ? '#FA7272' : '#94A3B8'}
                                    />
                                    <Text style={[cStyles.tabLabel, isActive && cStyles.tabLabelActive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <CircleTab
                        circleStatusMembers={circleMembers || []}
                        circleLocations={circleLocations}
                        emotionData={emotionData}
                        selectedCircle={selectedCircle || null}
                        currentCircle={currentCircleObject}
                        onCircleSelect={() => setShowCircleStatsDrawer(true)}
                        activeTab={activeTab}
                        onAddMember={() => navigation.navigate('CircleSettings', { initialTab: 'members' })}
                    />
                </Animated.View>

                {/* Circle Stats Drawer */}
                <CircleStatsDrawer
                    visible={showCircleStatsDrawer}
                    onClose={() => setShowCircleStatsDrawer(false)}
                    currentCircle={currentCircleObject}
                    onSwitchCircle={() => setShowCircleDropdown(true)}
                />

                {/* Circle Selection Dropdown Modal */}
                <CircleDropdown
                    visible={showCircleDropdown}
                    onClose={() => setShowCircleDropdown(false)}
                    selectedCircle={selectedCircle || ''}
                    onCircleSelect={handleCircleSelect}
                    availableFamilies={circles as any[]}
                />

                <CircleOptionsDrawer
                    visible={showCircleOptions}
                    onClose={() => setShowCircleOptions(false)}
                    onInviteMember={handleInviteMember}
                    onLeaveCircle={handleLeaveCircle}
                    onChangeVisibility={handleChangeVisibility}
                />

                <CircleHeaderDrawer
                    visible={showCircleHeaderDrawer}
                    onClose={() => setShowCircleHeaderDrawer(false)}
                    onSwitchCircle={handleOpenSwitchCircle}
                    onViewProfile={handleViewProfile}
                />
            </SafeAreaView>
        </ScreenBackground>
    );
};

const cStyles = StyleSheet.create({
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
});

export default CircleScreen;
