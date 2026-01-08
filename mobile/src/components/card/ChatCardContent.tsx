import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CoolIcon from '../common/CoolIcon';
import SegmentedTabs from '../common/SegmentedTabs';
import { homeStyles } from '../../styles/homeStyles';

interface ChatMember {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isGroup: boolean;
  mood?: 'happy' | 'neutral' | 'sad' | 'stressed';
}

interface ChatCardContentProps {
  familyMembers?: any[];
}

type ChatCategory = 'family' | 'workplace' | 'hometown' | 'commercial' | 'other';

const getMoodIconParams = (mood?: string) => {
  switch (mood) {
    case 'happy': return { name: 'happy', color: '#10B981', icon: 'emoticon-happy' };
    case 'neutral': return { name: 'remove', color: '#6B7280', icon: 'emoticon-neutral' };
    case 'sad': return { name: 'sad', color: '#EF4444', icon: 'emoticon-sad' };
    case 'stressed': return { name: 'warning', color: '#F59E0B', icon: 'emoticon-dead' };
    default: return { name: 'help', color: '#6B7280', icon: 'emoticon-neutral' };
  }
};

const MoodAvatar: React.FC<{ member: ChatMember; index: number }> = ({ member, index }) => {
  const [showMood, setShowMood] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Only animate if there is a mood
  useEffect(() => {
    if (!member.mood) return;
    const interval = setInterval(() => {
      setShowMood((prev) => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, [member.mood]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showMood && member.mood ? 1 : 0,
      duration: 800,
      useNativeDriver: true, // Native driver for opacity
    }).start();
  }, [showMood, member.mood]);

  const moodParams = getMoodIconParams(member.mood);
  const avatarBgColor = `hsl(${(index * 137.5) % 360}, 70%, 60%)`;

  return (
    <View style={homeStyles.familyStatusAvatarContainer}>
      <View style={[homeStyles.familyStatusAvatar, { backgroundColor: member.isGroup ? '#FFB6C1' : avatarBgColor, overflow: 'hidden' }]}>
        {/* Avatar Layer */}
        <Animated.View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          justifyContent: 'center', alignItems: 'center'
        }}>
          {member.isGroup ? (
            <CoolIcon name="house-03" size={24} color="#FFFFFF" />
          ) : (
            member.avatar?.startsWith('http') ? (
              <Image source={{ uri: member.avatar }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={homeStyles.familyStatusAvatarText}>
                {member.name.charAt(0)}
              </Text>
            )
          )}
        </Animated.View>

        {/* Mood Layer */}
        {!member.isGroup && (
          <Animated.View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: fadeAnim,
            backgroundColor: 'white',
            justifyContent: 'center', alignItems: 'center'
          }}>
            <CoolIcon name={moodParams.name as any} size={24} color={moodParams.color} />
          </Animated.View>
        )}
      </View>

      {/* Online/Status Indicator */}
      {!member.isGroup && (
        <View style={[
          homeStyles.familyStatusIndicator,
          { backgroundColor: member.isOnline ? '#10B981' : '#6B7280' }
        ]} />
      )}
    </View>
  );
};

export const ChatCardContent: React.FC<ChatCardContentProps> = ({ familyMembers = [] }) => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('family');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const generateChatList = (): ChatMember[] => {
    const chatList: ChatMember[] = [];

    if (familyMembers.length > 1) {
      chatList.push({
        id: 'family-group',
        name: 'Family Group',
        avatar: '',
        lastMessage: 'No recent messages',
        lastMessageTime: '',
        unreadCount: 0,
        isOnline: familyMembers.some(member => member.status === 'online'),
        isGroup: true,
      });
    }

    familyMembers.forEach((member) => {
      chatList.push({
        id: member.id || `member-${member.name}`,
        name: member.name || 'Family Member',
        avatar: member.avatar || '',
        lastMessage: member.status === 'online' ? 'Active now' : 'Seen recently',
        lastMessageTime: '2m',
        unreadCount: 0,
        isOnline: member.status === 'online',
        isGroup: false,
        mood: member.mood, // Pass mood
      });
    });

    return chatList;
  };

  const chatList = generateChatList();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleChatPress = (chat: ChatMember) => {
    setSelectedChat(chat.id);
    Alert.alert('Chat', `Opening chat with ${chat.name}`);
  };

  return (
    <View style={styles.container}>
      <SegmentedTabs
        tabs={[
          { id: 'family', label: 'Family', icon: 'home' },
          { id: 'workplace', label: 'Work', icon: 'briefcase' },
          { id: 'hometown', label: 'BFFs', icon: 'heart' },
        ]}
        activeId={activeCategory}
        onChange={(id) => setActiveCategory(id as ChatCategory)}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <CoolIcon name="search" size={20} color="#6B7280" />
          <Text style={styles.searchPlaceholder}>Search chats...</Text>
        </View>
      </View>

      <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
        {chatList.length === 0 ? (
          <View style={styles.emptyState}>
            <CoolIcon name="chat" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No chats available</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {chatList.map((chat, index) => (
              <TouchableOpacity
                key={chat.id}
                style={[
                  homeStyles.familyStatusCard, // Use Home Screen Card Style
                  { marginBottom: 12 }, // Add margin
                  selectedChat === chat.id && homeStyles.familyStatusCardExpanded
                ]}
                onPress={() => handleChatPress(chat)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['transparent', 'transparent', 'transparent']} // consistent with home
                  style={homeStyles.familyStatusCardGradient}
                >
                  <View style={homeStyles.familyStatusCardHeader}>
                    {/* Replaced Avatar with MoodAvatar */}
                    <MoodAvatar member={chat} index={index} />

                    <View style={styles.chatInfo}>
                      <View style={styles.chatHeader}>
                        <Text style={homeStyles.familyStatusName}>{chat.name}</Text>
                        <Text style={styles.lastMessageTime}>{chat.lastMessageTime}</Text>
                      </View>

                      <View style={styles.chatFooter}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                          {chat.lastMessage}
                        </Text>
                        {chat.unreadCount > 0 && (
                          <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#9CA3AF',
  },
  chatList: {
    flex: 1,
    overflow: 'visible',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 0, // Adjusted as MoodAvatar has margin
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});


export default ChatCardContent;
