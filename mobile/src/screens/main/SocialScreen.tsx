import React, { useState, useMemo } from 'react';
import { View, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect } from '@react-navigation/native';
import { homeStyles } from '../../styles/homeStyles';
import { SocialTab } from '../../components/home/SocialTab';
import { useUserData } from '../../contexts/UserDataContext';
import { useHomeScreen } from '../../hooks/home/useHomeScreen';
import { FloatingCreatePostButton } from '../../components/home/FloatingCreatePostButton';
import { CreatePostModal } from '../../components/home/CreatePostModal';
import { CommentDrawer } from '../../components/home/CommentDrawer';
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { useHomeBackground } from '../../hooks/useAppConfig';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { socialService } from '../../services/dataServices';
import { SortOrder, GeoScope, DistanceUnit, CustomCoordinates } from '../../components/social/PostFilterHeader';
import { LocationFilterDrawer } from '../../components/social/LocationFilterDrawer';

const SocialScreen: React.FC = () => {
    useHomeBackground();
    const { families, selectedFamily } = useUserData();
    const [socialRefreshKey, setSocialRefreshKey] = useState(0);
    const [isPosting, setIsPosting] = useState(false);

    const {
        showCreatePostModal,
        setShowCreatePostModal,
        newPostContent,
        setNewPostContent,
        showCommentDrawer,
        handleCommentPress,
        handleCloseCommentDrawer,
        comments,
        loadingComments,
        newComment,
        setNewComment,
        commentAttachments,
        handleAddAttachment,
        handleRemoveAttachment,
        handleAddComment,
        handleLikeComment,
        handleLinkPress,
    } = useHomeScreen();

    const [postMedia, setPostMedia] = useState<{ type: 'image' | 'video'; uri: string } | null>(null);
    const [postLocationLabel, setPostLocationLabel] = useState<string | null>(null);
    const [postCoordinates, setPostCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

    const handlePickMedia = async (type: 'image' | 'video') => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'We need media permissions to attach media.');
                return;
            }
            const mediaType = type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos;
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: mediaType, quality: 0.8 });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setPostMedia({ type, uri: result.assets[0].uri });
            }
        } catch (e) {
            console.error('pick media error', e);
        }
    };

    const handleClearMedia = () => setPostMedia(null);

    const handlePickLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'We need location permission to attach your location.');
                return;
            }
            const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setPostCoordinates({
                latitude: coords.coords.latitude,
                longitude: coords.coords.longitude
            });
            let label = `${coords.coords.latitude.toFixed(5)}, ${coords.coords.longitude.toFixed(5)}`;
            try {
                const geocode = await Location.reverseGeocodeAsync({ latitude: coords.coords.latitude, longitude: coords.coords.longitude });
                if (geocode && geocode[0]) {
                    const a = geocode[0];
                    const parts = [a.street, a.city, a.region].filter(Boolean);
                    if (parts.length) label = parts.join(', ');
                }
            } catch { }
            setPostLocationLabel(label);
        } catch (e) {
            console.error('pick location error', e);
        }
    };

    const handleClearLocation = () => {
        setPostLocationLabel(null);
        setPostCoordinates(null);
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) {
            Alert.alert('Empty Post', 'Please write something to post.');
            return;
        }

        try {
            setIsPosting(true);
            if (!families || families.length === 0) {
                Alert.alert('No Family Found', 'You need to join a family to post.');
                setIsPosting(false);
                return;
            }

            const matchingFamily = (families as any[]).find(f => f.name === selectedFamily);
            const targetFamilyId = matchingFamily?.id || (families as any[])[0]?.id;

            if (!targetFamilyId) {
                Alert.alert('Error', 'Could not determine which family to post to.');
                setIsPosting(false);
                return;
            }

            const created = {
                content: newPostContent,
                familyId: targetFamilyId,
                media: postMedia ? { type: postMedia.type, url: postMedia.uri } : undefined,
                location: postLocationLabel || undefined,
                latitude: postCoordinates?.latitude,
                longitude: postCoordinates?.longitude,
                tags: [],
            };

            await socialService.createPost(created);

            setSocialRefreshKey(prev => prev + 1);
            setShowCreatePostModal(false);
            setNewPostContent('');
            setPostMedia(null);
            setPostLocationLabel(null);
        } catch (error) {
            console.error('Failed to create post:', error);
            Alert.alert('Error', 'Failed to create post. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    const currentFamilyId = (families as any[]).find(f => f.name === selectedFamily)?.id;

    const { animateToHome, cardMarginTopAnim } = useNavigationAnimation();

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

    // Filter state lifted from SocialTab
    const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
    const [geoScope, setGeoScope] = useState<GeoScope>('nearby');
    const [distanceKm, setDistanceKm] = useState<number | null>(5);
    const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km');
    const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
    const [customCoordinates, setCustomCoordinates] = useState<CustomCoordinates | undefined>();
    const [locationFilterVisible, setLocationFilterVisible] = useState(false);

    const getHeaderTitle = () => {
        if (geoScope === 'worldwide') return 'Worldwide';
        if (geoScope === 'country') return selectedCountry || 'Country';
        if (geoScope === 'custom') return customCoordinates?.name || 'Custom';
        // Nearby
        const dist = distanceUnit === 'mile' ? (distanceKm || 0) * 0.621371 : (distanceKm || 0);
        return `Nearby ${dist.toFixed(0)}${distanceUnit === 'mile' ? 'mi' : 'km'}`;
    };

    return (
        <BackgroundWrapper>
            <SafeAreaView style={homeStyles.container}>
                <WelcomeSection
                    mode="social"
                    title={getHeaderTitle()}
                    onTitlePress={() => setLocationFilterVisible(true)}
                // Removed onLocationFilterPress logic as it's now title based
                />

                <Animated.View style={[
                    homeStyles.mainContentCard,
                    {
                        transform: [{ translateY: cardMarginTopAnim }],
                        marginTop: -16,
                        backgroundColor: '#FFFFFF',
                        flex: 1,
                    }
                ]}>
                    <View style={{ flex: 1, paddingTop: 10 }}>
                        <SocialTab
                            onCommentPress={handleCommentPress}
                            familyId={currentFamilyId}
                            refreshKey={socialRefreshKey}
                            // Pass Filter Props
                            geoScope={geoScope}
                            distanceKm={distanceKm}
                            selectedCountry={selectedCountry}
                            customCoordinates={customCoordinates}
                            sortOrder={sortOrder}
                        />
                    </View>
                </Animated.View>

                {/* Drawers and Modals */}
                <LocationFilterDrawer
                    visible={locationFilterVisible}
                    onClose={() => setLocationFilterVisible(false)}
                    geoScope={geoScope}
                    onGeoScopeChange={setGeoScope}
                    distanceKm={distanceKm}
                    onDistanceChange={setDistanceKm}
                    distanceUnit={distanceUnit}
                    onDistanceUnitChange={setDistanceUnit}
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    customCoordinates={customCoordinates}
                    onCustomCoordinatesChange={setCustomCoordinates}
                />

                <FloatingCreatePostButton
                    visible={true}
                    onPress={() => setShowCreatePostModal(true)}
                />

                <CreatePostModal
                    visible={showCreatePostModal}
                    onClose={() => setShowCreatePostModal(false)}
                    newPostContent={newPostContent}
                    setNewPostContent={setNewPostContent}
                    onPost={handleCreatePost}
                    media={postMedia}
                    onPickMedia={handlePickMedia}
                    onClearMedia={handleClearMedia}
                    locationLabel={postLocationLabel}
                    onPickLocation={handlePickLocation}
                    onClearLocation={handleClearLocation}
                    loading={isPosting}
                />

                <CommentDrawer
                    visible={showCommentDrawer}
                    onClose={handleCloseCommentDrawer}
                    comments={comments}
                    loading={loadingComments}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    commentAttachments={commentAttachments}
                    onAddAttachment={handleAddAttachment}
                    onRemoveAttachment={handleRemoveAttachment}
                    onAddComment={handleAddComment}
                    onLikeComment={handleLikeComment}
                    onLinkPress={handleLinkPress}
                />
            </SafeAreaView>
        </BackgroundWrapper>
    );
};

export default SocialScreen;
