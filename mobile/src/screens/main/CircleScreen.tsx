import React, { useState } from 'react';
import { Animated, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { homeStyles } from '../../styles/homeStyles';
import { CircleTab } from '../../components/home/CircleTab';
import { useUserData } from '../../contexts/UserDataContext';
import { CircleStatsDrawer } from '../../components/home/CircleStatsDrawer';
import { CircleDropdown } from '../../components/home/CircleDropdown';
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { ScreenBackground } from '../../components/ScreenBackground';
import { CircleSelectionTabs } from '../../components/common/CircleSelectionTabs';
import { CircleOptionsDrawer } from '../../components/home/CircleOptionsDrawer';
import { useBranding } from '../../contexts/BrandingContext';

const CircleScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const {
        circleStatusMembers,
        circleLocations,
        emotionData,
        selectedCircle,
        families: circles,
        setSelectedCircle
    } = useUserData();
    
    const { categories } = useBranding();
    const selectionTabsConfig = React.useMemo(() => {
        if (!categories) return null;
        for (const cat of categories) {
            // Updated to use specific 'circle-selection-tabs' instead of generic 'selection-tabs'
            const comp = cat.components.find(c => c.id === 'circle-selection-tabs');
            if (comp) return comp;
        }
        // Fallback to generic if specific not found (backward compatibility)
        for (const cat of categories) {
            const comp = cat.components.find(c => c.id === 'selection-tabs');
            if (comp) return comp;
        }
        return null;
    }, [categories]);
    const tabsConfig = selectionTabsConfig?.config || {};

    const [showCircleStatsDrawer, setShowCircleStatsDrawer] = useState(false);
    const [showCircleDropdown, setShowCircleDropdown] = useState(false);
    const [showCircleOptions, setShowCircleOptions] = useState(false);
    const [activeTab, setActiveTab] = useState('location');

    // Find the full circle object for the drawer
    const currentCircleObject = (circles as any[]).find(c => c.name === selectedCircle) || null;

    // Filter tabs based on settings
    const currentCircleSettings = currentCircleObject?.settings || {};
    
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
        
        // Financial - defaulted to false usually
        if (currentCircleSettings.allowCircleExpenses === true && tabsConfig.showFinancialTab !== false) {
             t.push({ id: 'financial', label: 'Financial', icon: 'wallet' });
        }
        
        // Health - defaulted to false usually
        if (currentCircleSettings.allowCircleHealth === true && tabsConfig.showHealthTab !== false) {
             t.push({ id: 'health', label: 'Health', icon: 'heart-pulse' });
        }
        
        // Fallback: if somehow empty, show location (unless specifically hidden)
        if (t.length === 0 && tabsConfig.showLocationTab !== false) {
             t.push({ id: 'location', label: 'Location', icon: 'map-marker' });
        }
        return t;
    }, [currentCircleSettings, tabsConfig]);

    // Helper to handle circle selection from dropdown
    const handleCircleSelect = (circle: any) => {
        setSelectedCircle(circle.name);
        setShowCircleDropdown(false);
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
                    onTitlePress={() => setShowCircleOptions(true)}
                >
                    <View style={{ paddingTop: 15, paddingBottom: 0, paddingHorizontal: 0, marginHorizontal: -8 }}>
                        <CircleSelectionTabs
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabPress={(id: string) => setActiveTab(id)}
                            activeColor={tabsConfig.activeColor || "#1d1515ff"}
                            inactiveColor={tabsConfig.inactiveColor || "#F3F4F6"}
                            activeTextColor={tabsConfig.activeTextColor || "#fcfcfcff"}
                            inactiveTextColor={tabsConfig.inactiveTextColor || "#6B7280"}
                            menuBackgroundColor={tabsConfig.menuBackgroundColor || 'transparent'}
                            fit={true}
                            variant="underline"
                            activeIconColor={tabsConfig.activeTextColor || "#FA7272"}
                            inactiveIconColor={tabsConfig.inactiveTextColor || "#6B7280"}
                            menuShowShadow={false}
                            activeShowShadow={false}
                            inactiveShowShadow={false}
                        />
                    </View>
                </WelcomeSection>

                <Animated.View style={[
                    homeStyles.mainContentCard,
                    {
                        transform: [{ translateY: cardMarginTopAnim }],
                        marginTop: 0,
                        backgroundColor: '#FFFFFF',
                        flex: 1,
                    }
                ]}>
                    <CircleTab
                        circleStatusMembers={circleStatusMembers}
                        circleLocations={circleLocations}
                        emotionData={emotionData}
                        selectedCircle={selectedCircle}
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
                    onSettingsPress={() => {
                        setShowCircleOptions(false);
                        navigation.navigate('CircleSettings');
                    }}
                    onSwitchCirclePress={() => setShowCircleDropdown(true)}
                />
            </SafeAreaView>
        </ScreenBackground>
    );
};

export default CircleScreen;
