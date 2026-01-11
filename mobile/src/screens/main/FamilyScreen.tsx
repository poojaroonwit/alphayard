import React, { useState, useMemo } from 'react';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { homeStyles } from '../../styles/homeStyles';
import { FamilyTab } from '../../components/home/FamilyTab';
import { useUserData } from '../../contexts/UserDataContext';
import { HouseStatsDrawer } from '../../components/home/HouseStatsDrawer';
import { FamilyDropdown } from '../../components/home/FamilyDropdown';
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { useHomeBackground } from '../../hooks/useAppConfig';

import { FamilyOptionsDrawer } from '../../components/home/FamilyOptionsDrawer';

const FamilyScreen: React.FC = () => {
    useHomeBackground();
    const navigation = useNavigation<any>();
    const {
        familyStatusMembers,
        familyLocations,
        emotionData,
        selectedFamily,
        families,
        setSelectedFamily
    } = useUserData();

    const [showHouseStatsDrawer, setShowHouseStatsDrawer] = useState(false);
    const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
    const [showFamilyOptions, setShowFamilyOptions] = useState(false);

    // Helper to handle family selection from dropdown
    const handleFamilySelect = (family: any) => {
        setSelectedFamily(family.name);
        setShowFamilyDropdown(false);
    };

    // Find the full family object for the drawer
    const currentFamilyObject = (families as any[]).find(f => f.name === selectedFamily) || null;

    const { animateToHome, cardMarginTopAnim } = useNavigationAnimation();

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

    return (
        <BackgroundWrapper>
            <SafeAreaView style={homeStyles.container}>
                <WelcomeSection
                    mode="family"
                    title={selectedFamily || "Select Family"}
                    onTitlePress={() => setShowFamilyOptions(true)}
                />

                <Animated.View style={[
                    homeStyles.mainContentCard,
                    {
                        transform: [{ translateY: cardMarginTopAnim }],
                        marginTop: -16,
                        backgroundColor: '#FFFFFF',
                        flex: 1, // Ensure it expands
                    }
                ]}>
                    <FamilyTab
                        familyStatusMembers={familyStatusMembers}
                        familyLocations={familyLocations}
                        emotionData={emotionData}
                        selectedFamily={selectedFamily}
                        onFamilySelect={() => setShowHouseStatsDrawer(true)}
                    />
                </Animated.View>

                {/* House Stats Drawer */}
                <HouseStatsDrawer
                    visible={showHouseStatsDrawer}
                    onClose={() => setShowHouseStatsDrawer(false)}
                    currentFamily={currentFamilyObject}
                    onSwitchFamily={() => setShowFamilyDropdown(true)}
                />

                {/* Family Selection Dropdown Modal */}
                <FamilyDropdown
                    visible={showFamilyDropdown}
                    onClose={() => setShowFamilyDropdown(false)}
                    selectedFamily={selectedFamily || ''}
                    onFamilySelect={handleFamilySelect}
                    availableFamilies={families as any[]}
                />

                <FamilyOptionsDrawer
                    visible={showFamilyOptions}
                    onClose={() => setShowFamilyOptions(false)}
                    onSettingsPress={() => {
                        setShowFamilyOptions(false);
                        navigation.navigate('FamilySettings');
                    }}
                    onSwitchFamilyPress={() => setShowFamilyDropdown(true)}
                />
            </SafeAreaView>
        </BackgroundWrapper>
    );
};

export default FamilyScreen;
