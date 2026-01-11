import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
// Increased margin (32*2) for more indentation
const SLIDER_WIDTH = width - 64;

const CAROUSEL_ITEMS = [
    {
        id: '1',
        type: 'fortune',
        title: 'Daily Forecast',
        content: 'You will be very lucky today! Connections bring joy.',
        accent: '#BF360C',
        iconBg: '#FFD54F'
    },
    {
        id: '2',
        type: 'news',
        title: 'Tech News',
        content: 'AI revolutionizes daily productivity apps and workflows.',
        image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=300&q=80',
        accent: '#0D47A1',
        iconBg: '#2196F3'
    },
    {
        id: '3',
        type: 'news',
        title: 'Health Tip',
        content: 'Start your day with a glass of water for better energy.',
        image: 'https://images.unsplash.com/photo-1544367563-12123d8965cd?auto=format&fit=crop&w=300&q=80',
        accent: '#1B5E20',
        iconBg: '#4CAF50'
    }
];

export const DailyCarousel: React.FC = () => {
    const navigation = useNavigation<any>();
    const [activeIndex, setActiveIndex] = useState(0);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        if (slideSize === 0) return;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);

        if (roundIndex !== activeIndex) {
            setActiveIndex(roundIndex);
        }
    };

    const handlePress = (item: any) => {
        if (item.type === 'news') {
            navigation.navigate('NewsDetail', { id: item.id });
        } else {
            console.log('Forecast clicked');
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handlePress(item)}
                style={styles.cardContainer}
            >
                {/* Visual Card with DEEPER Shadow (like Activity Card) */}
                <View style={[styles.cardInner, { shadowColor: '#000000' }]}>
                    <View style={styles.cardContent}>
                        {/* Text Section (Flex 1) */}
                        <View style={{ flex: 1, paddingRight: item.image ? 12 : 0 }}>
                            <Text style={[styles.cardTitle, { color: item.accent }]}>{item.title}</Text>
                            <Text style={styles.cardText} numberOfLines={2}>
                                {item.content}
                            </Text>
                            {item.type === 'news' && (
                                <Text style={styles.readMore}>Read more</Text>
                            )}
                        </View>

                        {/* Image Section (Right) */}
                        {item.image && (
                            <Image source={{ uri: item.image }} style={styles.newsImage} />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header like Activity Section */}
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>Daily Insights</Text>
            </View>

            <FlatList
                data={CAROUSEL_ITEMS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScroll}
                contentContainerStyle={styles.listContent}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {CAROUSEL_ITEMS.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            { backgroundColor: i === activeIndex ? '#1F2937' : '#D1D5DB' }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 16,
        paddingHorizontal: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    listContent: {
        paddingHorizontal: 32,
        paddingBottom: 24,
    },
    cardContainer: {
        width: SLIDER_WIDTH,
        backgroundColor: 'transparent',
        marginRight: 0,
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    cardInner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        // Reduced Light Grey Shadow
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
        borderWidth: 0,
        shadowColor: '#000000',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    newsImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#EEE',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardText: {
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    readMore: {
        fontSize: 13,
        color: '#4A90E2',
        marginTop: 6,
        fontWeight: '600',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: -10,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    }
});
