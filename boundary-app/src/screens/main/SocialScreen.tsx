import React, { useState } from 'react';
import { View, Animated, Alert, ScrollView, Text, TouchableOpacity, Modal, Pressable, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect } from '@react-navigation/native';
import { homeStyles } from '../../styles/homeStyles';
import { SocialTab } from '../../components/home/SocialTab';
import { useUserData } from '../../contexts/UserDataContext';
import { useLegacyHomeScreen } from '../../hooks/home/useLegacyHomeScreen';
import { FloatingCreatePostButton } from '../../components/home/FloatingCreatePostButton';
import { CreatePostModal } from '../../components/home/CreatePostModal';
import { CommentDrawer } from '../../components/home/CommentDrawer';
import { WelcomeSection } from '../../components/home/WelcomeSection';
import { ScreenBackground } from '../../components/ScreenBackground';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { socialService } from '../../services/dataServices';
import { SortOrder, GeoScope, DistanceUnit, CustomCoordinates } from '../../components/social/PostFilterHeader';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

type SocialScope = 'worldwide' | 'following' | 'school_workplace' | 'nearby' | 'custom';

const SCOPE_OPTIONS: Array<{ value: SocialScope; label: string; icon: string }> = [
    { value: 'worldwide', label: 'Worldwide', icon: 'earth' },
    { value: 'following', label: 'Following', icon: 'account-group-outline' },
    { value: 'school_workplace', label: 'School/Work', icon: 'school-outline' },
    { value: 'nearby', label: 'Nearby', icon: 'map-marker-radius-outline' },
    { value: 'custom', label: 'Custom', icon: 'crosshairs-gps' },
];

const DISTANCE_OPTIONS = [1, 5, 10, 25, 50];

const SocialScreen: React.FC = () => {
    const { families, selectedCircle } = useUserData();
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
    } = useLegacyHomeScreen();

    const [postMedia, setPostMedia] = useState<{ type: 'image' | 'video'; uri: string } | null>(null);
    const [postLocationLabel, setPostLocationLabel] = useState<string | null>(null);
    const [postCoordinates, setPostCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

    // Scope filter state
    const [scope, setScope] = useState<SocialScope>('nearby');
    const [distanceKm, setDistanceKm] = useState<number>(5);
    const [showDistancePicker, setShowDistancePicker] = useState(false);
    const [customCoordinates, setCustomCoordinates] = useState<CustomCoordinates | undefined>();
    const [customCoordsVisible, setCustomCoordsVisible] = useState(false);
    const [customLatInput, setCustomLatInput] = useState('');
    const [customLngInput, setCustomLngInput] = useState('');
    const [customNameInput, setCustomNameInput] = useState('');

    const handleScopePress = (value: SocialScope) => {
        if (value === 'nearby') {
            if (scope === 'nearby') {
                // Toggle distance picker
                setShowDistancePicker(prev => !prev);
            } else {
                setScope('nearby');
                setShowDistancePicker(true);
            }
        } else if (value === 'custom') {
            setScope('custom');
            setShowDistancePicker(false);
            setCustomCoordsVisible(true);
        } else {
            setScope(value);
            setShowDistancePicker(false);
        }
    };

    const handleCustomCoordsSubmit = () => {
        const lat = parseFloat(customLatInput);
        const lng = parseFloat(customLngInput);
        if (!isNaN(lat) && !isNaN(lng)) {
            setCustomCoordinates({
                latitude: lat,
                longitude: lng,
                name: customNameInput || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            });
            setCustomCoordsVisible(false);
            setCustomLatInput('');
            setCustomLngInput('');
            setCustomNameInput('');
        }
    };

    // Map SocialScope → GeoScope for SocialTab
    const toGeoScope = (s: SocialScope): GeoScope => {
        if (s === 'school_workplace') return 'worldwide'; // backend placeholder
        return s as GeoScope;
    };

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
            setPostCoordinates({ latitude: coords.coords.latitude, longitude: coords.coords.longitude });
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
                Alert.alert('No Circle Found', 'You need to join a circle to post.');
                setIsPosting(false);
                return;
            }
            const matchingCircle = (families as any[]).find(f => f.name === selectedCircle);
            const targetCircleId = matchingCircle?.id || (families as any[])[0]?.id;
            if (!targetCircleId) {
                Alert.alert('Error', 'Could not determine which circle to post to.');
                setIsPosting(false);
                return;
            }
            await socialService.createPost({
                content: newPostContent,
                circleId: targetCircleId,
                media: postMedia ? { type: postMedia.type, url: postMedia.uri } : undefined,
                location: postLocationLabel || undefined,
                latitude: postCoordinates?.latitude,
                longitude: postCoordinates?.longitude,
                tags: [],
            });
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

    const currentCircleId = (families as any[]).find(f => f.name === selectedCircle)?.id;
    const { animateToHome, cardMarginTopAnim } = useNavigationAnimation();

    useFocusEffect(
        React.useCallback(() => {
            animateToHome();
        }, [animateToHome])
    );

    const { theme } = useTheme();

    const renderScopeFilterBar = () => (
        <View style={{ paddingTop: 12, paddingBottom: 4 }}>
            {/* Scope chips row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                    {SCOPE_OPTIONS.map((opt) => {
                        const isActive = scope === opt.value;
                        return (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => handleScopePress(opt.value)}
                                style={[
                                    scopeStyles.chip,
                                    isActive ? scopeStyles.chipActive : scopeStyles.chipInactive,
                                ]}
                                activeOpacity={0.75}
                            >
                                <IconMC
                                    name={opt.icon}
                                    size={16}
                                    color={isActive ? '#FFFFFF' : '#6B7280'}
                                />
                                <Text style={[scopeStyles.chipText, isActive && scopeStyles.chipTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Distance badge — top right under chips when nearby is set */}
                {scope === 'nearby' && !showDistancePicker && (
                    <View style={{ paddingRight: 16 }}>
                        <TouchableOpacity
                            onPress={() => setShowDistancePicker(true)}
                            style={scopeStyles.distanceBadge}
                        >
                            <IconMC name="map-marker-distance" size={12} color="#FFFFFF" />
                            <Text style={scopeStyles.distanceBadgeText}>{distanceKm}km</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Custom location badge */}
                {scope === 'custom' && customCoordinates && (
                    <View style={{ paddingRight: 16 }}>
                        <TouchableOpacity
                            onPress={() => setCustomCoordsVisible(true)}
                            style={scopeStyles.distanceBadge}
                        >
                            <IconMC name="crosshairs-gps" size={12} color="#FFFFFF" />
                            <Text style={scopeStyles.distanceBadgeText} numberOfLines={1}>
                                {customCoordinates.name
                                    ? customCoordinates.name.length > 10
                                        ? customCoordinates.name.substring(0, 10) + '…'
                                        : customCoordinates.name
                                    : `${customCoordinates.latitude.toFixed(2)},${customCoordinates.longitude.toFixed(2)}`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Distance picker */}
            {scope === 'nearby' && showDistancePicker && (
                <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                    <Text style={scopeStyles.pickerLabel}>Select distance</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {DISTANCE_OPTIONS.map((km) => (
                            <TouchableOpacity
                                key={km}
                                onPress={() => {
                                    setDistanceKm(km);
                                    setShowDistancePicker(false);
                                }}
                                style={[
                                    scopeStyles.distanceChip,
                                    distanceKm === km && scopeStyles.distanceChipSelected,
                                ]}
                            >
                                <Text style={[scopeStyles.distanceChipText, distanceKm === km && scopeStyles.distanceChipTextSelected]}>
                                    {km}km
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    return (
        <ScreenBackground screenId="social">
            <SafeAreaView style={homeStyles.container}>
                <WelcomeSection
                    mode="social"
                    title="Social Feed"
                    labelAbove="Discover"
                    leftIcon="earth"
                >
                    <View style={{ height: 16 }} />
                </WelcomeSection>

                <Animated.View style={[
                    homeStyles.mainContentCard,
                    {
                        transform: [{ translateY: cardMarginTopAnim }],
                        backgroundColor: '#FFFFFF',
                        flex: 1,
                    }
                ]}>
                    {renderScopeFilterBar()}
                    <View style={scopeStyles.divider} />
                    <View style={{ flex: 1 }}>
                        <SocialTab
                            onCommentPress={handleCommentPress}
                            circleId={currentCircleId}
                            refreshKey={socialRefreshKey}
                            geoScope={toGeoScope(scope)}
                            distanceKm={scope === 'nearby' ? distanceKm : null}
                            customCoordinates={scope === 'custom' ? customCoordinates : undefined}
                            sortOrder="recent"
                        />
                    </View>
                </Animated.View>

                {/* Custom Coordinates Modal */}
                <Modal
                    visible={customCoordsVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setCustomCoordsVisible(false)}
                >
                    <Pressable style={modalStyles.overlay} onPress={() => setCustomCoordsVisible(false)}>
                        <Pressable style={modalStyles.sheet} onPress={e => e.stopPropagation()}>
                            <View style={modalStyles.handle} />
                            <Text style={modalStyles.title}>Custom Location</Text>

                            <Text style={modalStyles.inputLabel}>Name (optional)</Text>
                            <TextInput
                                style={modalStyles.input}
                                value={customNameInput}
                                onChangeText={setCustomNameInput}
                                placeholder="e.g., Beach Resort"
                                placeholderTextColor="#9CA3AF"
                            />

                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={modalStyles.inputLabel}>Latitude</Text>
                                    <TextInput
                                        style={modalStyles.input}
                                        value={customLatInput}
                                        onChangeText={setCustomLatInput}
                                        placeholder="e.g., 13.7563"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={modalStyles.inputLabel}>Longitude</Text>
                                    <TextInput
                                        style={modalStyles.input}
                                        value={customLngInput}
                                        onChangeText={setCustomLngInput}
                                        placeholder="e.g., 100.5018"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                <TouchableOpacity
                                    style={[modalStyles.btn, { backgroundColor: '#F3F4F6' }]}
                                    onPress={() => setCustomCoordsVisible(false)}
                                >
                                    <Text style={{ color: '#6B7280', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[modalStyles.btn, { backgroundColor: '#EF4444' }]}
                                    onPress={handleCustomCoordsSubmit}
                                >
                                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>

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
        </ScreenBackground>
    );
};

const scopeStyles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 0,
    },
    chipActive: {
        backgroundColor: '#1F2937',
    },
    chipInactive: {},
    chipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#1F2937',
        borderRadius: 14,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    distanceBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    pickerLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    distanceChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 0,
    },
    distanceChipSelected: {
        backgroundColor: '#1F2937',
    },
    distanceChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
    },
    distanceChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
    },
});

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4B5563',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
    },
    btn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 10,
        alignItems: 'center',
    },
});

export default SocialScreen;
