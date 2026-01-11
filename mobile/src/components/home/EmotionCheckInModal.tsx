import React, { useState } from 'react';
import { Modal, Text as NBText, Box, Center, ScrollView } from 'native-base';
import { Dimensions, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Ellipse, Path, G, Line, Text as SvgText } from 'react-native-svg';
import { emotionService } from '../../services/emotionService';
import { ScalePressable } from '../common/ScalePressable';

interface EmotionCheckInModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    date?: Date;
}

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 80) / 4;

// Custom SVG Emoji Components
const HappyFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#F4B8A5" />
        <Circle cx="35" cy="40" r="5" fill="#333" />
        <Circle cx="65" cy="40" r="5" fill="#333" />
        <Path d="M 30 60 Q 50 80 70 60" stroke="#333" strokeWidth="3" fill="none" />
    </Svg>
);

const CalmFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#C65D3B" />
        <Path d="M 28 40 Q 35 35 42 40" stroke="#333" strokeWidth="3" fill="none" />
        <Path d="M 58 40 Q 65 35 72 40" stroke="#333" strokeWidth="3" fill="none" />
        <Path d="M 35 65 Q 50 75 65 65" stroke="#333" strokeWidth="3" fill="none" />
    </Svg>
);

const WorriedFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#E8C490" />
        <Circle cx="35" cy="42" r="4" fill="#333" />
        <Circle cx="65" cy="42" r="4" fill="#333" />
        <Ellipse cx="35" cy="35" rx="8" ry="3" fill="none" stroke="#333" strokeWidth="2" />
        <Ellipse cx="65" cy="35" rx="8" ry="3" fill="none" stroke="#333" strokeWidth="2" />
        <Path d="M 40 68 Q 50 62 60 68" stroke="#333" strokeWidth="3" fill="none" />
    </Svg>
);

const ExcitedFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#F7D794" />
        <Circle cx="35" cy="40" r="4" fill="#333" />
        <Circle cx="65" cy="40" r="4" fill="#333" />
        <Ellipse cx="35" cy="35" rx="6" ry="2" fill="none" stroke="#333" strokeWidth="2" />
        <Ellipse cx="65" cy="35" rx="6" ry="2" fill="none" stroke="#333" strokeWidth="2" />
        <Ellipse cx="50" cy="65" rx="15" ry="10" fill="#333" />
        <Circle cx="25" cy="55" r="8" fill="#F8B4B4" opacity={0.5} />
        <Circle cx="75" cy="55" r="8" fill="#F8B4B4" opacity={0.5} />
    </Svg>
);

const FrustratedFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#A8D5BA" />
        <G>
            <Line x1="28" y1="35" x2="42" y2="45" stroke="#333" strokeWidth="3" />
            <Line x1="42" y1="35" x2="28" y2="45" stroke="#333" strokeWidth="3" />
        </G>
        <G>
            <Line x1="58" y1="35" x2="72" y2="45" stroke="#333" strokeWidth="3" />
            <Line x1="72" y1="35" x2="58" y2="45" stroke="#333" strokeWidth="3" />
        </G>
        <Path d="M 35 70 L 65 70" stroke="#333" strokeWidth="3" />
    </Svg>
);

const AngryFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#9ABDC7" />
        <G>
            <Line x1="28" y1="35" x2="42" y2="45" stroke="#333" strokeWidth="3" />
            <Line x1="42" y1="35" x2="28" y2="45" stroke="#333" strokeWidth="3" />
        </G>
        <G>
            <Line x1="58" y1="35" x2="72" y2="45" stroke="#333" strokeWidth="3" />
            <Line x1="72" y1="35" x2="58" y2="45" stroke="#333" strokeWidth="3" />
        </G>
        <Path d="M 35 70 Q 50 60 65 70" stroke="#333" strokeWidth="3" fill="none" />
    </Svg>
);

const SadFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#E8C490" />
        <Path d="M 30 38 Q 35 42 40 38" stroke="#333" strokeWidth="2" fill="none" />
        <Path d="M 60 38 Q 65 42 70 38" stroke="#333" strokeWidth="2" fill="none" />
        <Path d="M 35 70 Q 50 58 65 70" stroke="#333" strokeWidth="3" fill="none" />
        <Ellipse cx="70" cy="55" rx="3" ry="6" fill="#87CEEB" />
    </Svg>
);

const ShyFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#F4A896" />
        <Circle cx="35" cy="40" r="4" fill="#333" />
        <Circle cx="65" cy="40" r="4" fill="#333" />
        <Path d="M 40 65 Q 50 70 60 65" stroke="#333" strokeWidth="2" fill="none" />
        <Circle cx="25" cy="55" r="10" fill="#F8B4B4" opacity={0.6} />
        <Circle cx="75" cy="55" r="10" fill="#F8B4B4" opacity={0.6} />
    </Svg>
);

const ScaredFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#F4C4C4" />
        <Circle cx="35" cy="40" r="8" fill="white" stroke="#333" strokeWidth="2" />
        <Circle cx="35" cy="40" r="4" fill="#333" />
        <Circle cx="65" cy="40" r="8" fill="white" stroke="#333" strokeWidth="2" />
        <Circle cx="65" cy="40" r="4" fill="#333" />
        <Ellipse cx="50" cy="70" rx="10" ry="12" fill="#333" />
    </Svg>
);

const NervousFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#E8A87C" />
        <Circle cx="35" cy="40" r="5" fill="#333" />
        <Circle cx="65" cy="40" r="5" fill="#333" />
        <Path d="M 30 65 L 40 70 L 50 65 L 60 70 L 70 65" stroke="#333" strokeWidth="3" fill="none" />
    </Svg>
);

const TiredFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#F7D794" />
        <Path d="M 28 40 Q 35 45 42 40" stroke="#333" strokeWidth="3" fill="none" />
        <Path d="M 58 40 Q 65 45 72 40" stroke="#333" strokeWidth="3" fill="none" />
        <SvgText x="60" y="35" fontSize="12" fill="#333">z z</SvgText>
        <Path d="M 40 65 Q 50 70 60 65" stroke="#333" strokeWidth="2" fill="none" />
    </Svg>
);

const SillyFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#A8D5BA" />
        <Circle cx="35" cy="40" r="4" fill="#333" />
        <Circle cx="70" cy="40" r="6" fill="white" stroke="#333" strokeWidth="2" />
        <Circle cx="72" cy="40" r="3" fill="#333" />
        <Path d="M 35 60 Q 50 75 65 60" stroke="#333" strokeWidth="2" fill="none" />
        <Ellipse cx="55" cy="72" rx="8" ry="4" fill="#F8B4B4" />
    </Svg>
);

const DisappointedFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#B8C5D6" />
        <Circle cx="35" cy="42" r="5" fill="#333" />
        <Circle cx="65" cy="42" r="5" fill="#333" />
        <Path d="M 35 68 Q 50 60 65 68" stroke="#333" strokeWidth="3" fill="none" />
    </Svg>
);

const LovedFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#D5D5D5" />
        <Path d="M 28 40 Q 35 45 42 40" stroke="#333" strokeWidth="3" fill="none" />
        <Path d="M 58 40 Q 65 45 72 40" stroke="#333" strokeWidth="3" fill="none" />
        <Path d="M 35 65 Q 50 75 65 65" stroke="#333" strokeWidth="3" fill="none" />
        <G transform="translate(75, 25)">
            <Path d="M 0 5 C 0 0, 5 0, 5 5 C 5 0, 10 0, 10 5 C 10 10, 5 15, 5 15 C 5 15, 0 10, 0 5" fill="#F8B4B4" />
        </G>
        <G transform="translate(15, 20)">
            <Path d="M 0 4 C 0 0, 4 0, 4 4 C 4 0, 8 0, 8 4 C 8 8, 4 12, 4 12 C 4 12, 0 8, 0 4" fill="#F8B4B4" />
        </G>
    </Svg>
);

const ProudFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#E8A87C" />
        <Path d="M 28 40 Q 35 45 42 40" stroke="#333" strokeWidth="3" fill="none" />
        <Path d="M 58 40 Q 65 45 72 40" stroke="#333" strokeWidth="3" fill="none" />
        <Path d="M 35 65 Q 50 75 65 65" stroke="#333" strokeWidth="3" fill="none" />
        <Circle cx="25" cy="55" r="8" fill="#F8B4B4" opacity={0.5} />
        <Circle cx="75" cy="55" r="8" fill="#F8B4B4" opacity={0.5} />
    </Svg>
);

const ConfusedFace = () => (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="45" fill="#F4C4B8" />
        <Circle cx="35" cy="40" r="4" fill="#333" />
        <Circle cx="65" cy="40" r="4" fill="#333" />
        <Path d="M 40 65 L 60 68" stroke="#333" strokeWidth="3" />
        <SvgText x="70" y="25" fontSize="16" fill="#333">?</SvgText>
        <SvgText x="20" y="30" fontSize="14" fill="#333">?</SvgText>
    </Svg>
);

const emotions = [
    { id: 1, label: 'HAPPY', Component: HappyFace },
    { id: 2, label: 'CALM', Component: CalmFace },
    { id: 3, label: 'WORRIED', Component: WorriedFace },
    { id: 4, label: 'EXCITED', Component: ExcitedFace },
    { id: 5, label: 'FRUSTRATED', Component: FrustratedFace },
    { id: 6, label: 'ANGRY', Component: AngryFace },
    { id: 7, label: 'SAD', Component: SadFace },
    { id: 8, label: 'SHY', Component: ShyFace },
    { id: 9, label: 'SCARED', Component: ScaredFace },
    { id: 10, label: 'NERVOUS', Component: NervousFace },
    { id: 11, label: 'TIRED', Component: TiredFace },
    { id: 12, label: 'SILLY', Component: SillyFace },
    { id: 13, label: 'DISAPPOINTED', Component: DisappointedFace },
    { id: 14, label: 'LOVED', Component: LovedFace },
    { id: 15, label: 'PROUD', Component: ProudFace },
    { id: 16, label: 'CONFUSED', Component: ConfusedFace },
];

export const EmotionCheckInModal: React.FC<EmotionCheckInModalProps> = ({
    visible,
    onClose,
    onSuccess,
    date,
}) => {
    const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    // Animation values
    const fadeAnim = React.useRef(new Animated.Value(1)).current;
    const slideAnim = React.useRef(new Animated.Value(0)).current;

    // Staggered animation values for grid items
    const gridAnims = React.useRef(emotions.map(() => new Animated.Value(0))).current;
    const gridScaleAnims = React.useRef(emotions.map(() => new Animated.Value(0.5))).current;

    React.useEffect(() => {
        if (visible && !showCalendar) {
            // Reset animations
            gridAnims.forEach(anim => anim.setValue(0));
            gridScaleAnims.forEach(anim => anim.setValue(0.5));
            fadeAnim.setValue(1);
            slideAnim.setValue(0);

            // Staggered entrance
            const animations = emotions.map((_, i) => {
                return Animated.parallel([
                    Animated.timing(gridAnims[i], {
                        toValue: 1,
                        duration: 400,
                        delay: i * 30, // 30ms stagger
                        useNativeDriver: true,
                    }),
                    Animated.spring(gridScaleAnims[i], {
                        toValue: 1,
                        friction: 6,
                        tension: 40,
                        useNativeDriver: true,
                    })
                ]);
            });
            Animated.stagger(30, animations).start();
        }
    }, [visible, showCalendar]);

    const handleSelectEmotion = async (emotionId: number) => {
        setSelectedEmotion(emotionId);

        // Map specific emotion IDs to 1-5 scale for backend
        const getEmotionScore = (id: number): number => {
            switch (id) {
                case 1: return 4; // HAPPY -> Good
                case 2: return 3; // CALM -> Okay
                case 3: return 2; // WORRIED -> Bad
                case 4: return 5; // EXCITED -> Great
                case 5: return 1; // FRUSTRATED -> Very Bad
                case 6: return 1; // ANGRY -> Very Bad
                case 7: return 1; // SAD -> Very Bad
                case 8: return 3; // SHY -> Okay
                case 9: return 2; // SCARED -> Bad
                case 10: return 2; // NERVOUS -> Bad
                case 11: return 2; // TIRED -> Bad
                case 12: return 4; // SILLY -> Good
                case 13: return 2; // DISAPPOINTED -> Bad
                case 14: return 5; // LOVED -> Great
                case 15: return 4; // PROUD -> Good
                case 16: return 3; // CONFUSED -> Okay
                default: return 3;
            }
        };

        const score = getEmotionScore(emotionId);
        const emotionLabel = emotions.find(e => e.id === emotionId)?.label || '';

        // Animate out
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(async () => {
            setShowCalendar(true);
            fadeAnim.setValue(0);
            slideAnim.setValue(50); // Start slightly lower

            // Animate in success view
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]).start();
        });

        try {
            setSubmitting(true);
            const dateStr = date ? date.toISOString().split('T')[0] : undefined;
            // Submit score (1-5) and specific emotion label as tag
            await emotionService.submitEmotionCheck(score, dateStr, [emotionLabel]);
            onSuccess();
        } catch (error) {
            console.error('Failed to submit emotion:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedEmotionData = emotions.find(e => e.id === selectedEmotion);
    const currentDate = date || new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Modal isOpen={visible} onClose={onClose} size="full" animationPreset="slide">
            <Modal.Content width="100%" height="100%" flex={1} rounded="0" m={0} p={0} maxHeight="100%" bg="#FAF9F6">
                <ScrollView contentContainerStyle={styles.container}>
                    {/* Title */}
                    <NBText style={styles.title}>MY FEELINGS</NBText>

                    {/* View 1: Mood Selection */}
                    {!showCalendar && (
                        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
                            <NBText style={styles.description}>How are you feeling today? Tap an emotion to log your mood.</NBText>

                            {/* Grid of Emotions */}
                            <Box style={styles.grid}>
                                {emotions.map((emotion, index) => {
                                    const EmotionComponent = emotion.Component;
                                    return (
                                        <Animated.View
                                            key={emotion.id}
                                            style={{
                                                opacity: gridAnims[index],
                                                transform: [{ scale: gridScaleAnims[index] }]
                                            }}
                                        >
                                            <ScalePressable
                                                onPress={() => handleSelectEmotion(emotion.id)}
                                                disabled={submitting}
                                                style={[styles.emotionItem]}
                                            >
                                                <Center style={styles.emojiContainer}>
                                                    <EmotionComponent />
                                                </Center>
                                                <NBText style={styles.emotionLabel}>{emotion.label}</NBText>
                                            </ScalePressable>
                                        </Animated.View>
                                    );
                                })}
                            </Box>

                            {/* Decline to Answer Button */}
                            <ScalePressable onPress={onClose} style={styles.declineButton}>
                                <NBText style={styles.declineButtonText}>Decline to answer</NBText>
                            </ScalePressable>
                        </Animated.View>
                    )}

                    {/* View 2: Calendar with Logged Mood */}
                    {showCalendar && selectedEmotionData && (
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                                width: '100%',
                                alignItems: 'center'
                            }}
                        >
                            <NBText style={styles.calendarSubtitle}>Mood logged successfully!</NBText>

                            {/* Selected Mood Display */}
                            <Box style={styles.moodDisplayContainer}>
                                <Center style={styles.largeMoodEmoji}>
                                    <selectedEmotionData.Component />
                                </Center>
                                <NBText style={styles.largeMoodLabel}>{selectedEmotionData.label}</NBText>
                            </Box>

                            {/* Calendar Card */}
                            <Box style={styles.calendarCard}>
                                <NBText style={styles.calendarCardTitle}>📅 Logged on</NBText>
                                <NBText style={styles.calendarDate}>{formattedDate}</NBText>
                            </Box>

                            {/* Close Button */}
                            <ScalePressable onPress={onClose} style={styles.closeButton}>
                                <NBText style={styles.closeButtonText}>Close</NBText>
                            </ScalePressable>
                        </Animated.View>
                    )}
                </ScrollView>
            </Modal.Content>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '300',
        letterSpacing: 4,
        color: '#333',
        marginBottom: 10,
        fontFamily: 'serif',
    },
    description: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        marginBottom: 25,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
    },
    emotionItem: {
        width: ITEM_SIZE,
        alignItems: 'center',
        marginBottom: 20,
        padding: 5,
    },
    selectedItem: {
        transform: [{ scale: 1.1 }],
        opacity: 0.8,
    },
    emojiContainer: {
        width: ITEM_SIZE - 20,
        height: ITEM_SIZE - 20,
        marginBottom: 8,
    },
    emotionLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: '#555',
        textAlign: 'center',
        letterSpacing: 1,
    },
    declineButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 40,
    },
    declineButtonText: {
        fontSize: 14,
        color: '#999',
    },
    selectionShade: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(100, 200, 150, 0.3)',
        borderRadius: 20,
    },
    selectedEmoji: {
        transform: [{ scale: 1.15 }],
    },
    selectedLabel: {
        fontWeight: '700',
        color: '#333',
    },
    calendarContainer: {
        width: '100%',
        marginTop: 30,
        alignItems: 'center',
    },
    calendarTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    calendarCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    calendarDate: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
        textAlign: 'center',
    },
    calendarMoodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarEmoji: {
        width: 50,
        height: 50,
        marginRight: 12,
    },
    calendarMoodLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        marginTop: 25,
        paddingVertical: 14,
        paddingHorizontal: 50,
        backgroundColor: '#E8E8E8',
        borderRadius: 25,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#555',
    },
    calendarSubtitle: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: '500',
        marginBottom: 30,
        textAlign: 'center',
    },
    moodDisplayContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    largeMoodEmoji: {
        width: 120,
        height: 120,
        marginBottom: 15,
    },
    largeMoodLabel: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333',
        letterSpacing: 2,
    },
    calendarCardTitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 5,
        textAlign: 'center',
    },
});
