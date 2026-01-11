import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, HStack, VStack, Avatar, Badge, Icon, Input, IconButton } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { chatService } from '../../services/chat/ChatService';
import { analyticsService } from '../../services/analytics/AnalyticsService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import MainScreenLayout from '../../components/layout/MainScreenLayout';
import { FamilyDropdown } from '../../components/home/FamilyDropdown';
import SegmentedTabs from '../../components/common/SegmentedTabs';

interface Chat {
  id: string;
  name: string;
  type: 'individual' | 'group' | 'hourse';
  avatar?: string;
  lastMessage: {
    text: string;
    sender: string;
    timestamp: number;
    type: 'text' | 'image' | 'file' | 'location' | 'voice';
  };
  unreadCount: number;
  isOnline: boolean;
  members: string[];
  isPinned: boolean;
  isMuted: boolean;
  lastSeen?: number;
}

type ChatCategory = 'hourse' | 'workplace' | 'hometown' | 'commercial' | 'other';

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ChatCategory>('hourse');
  const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState('Smith hourse');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatList = await chatService.getChatList();
      setChats(chatList);
    } catch (error) {
      console.error('Failed to load chats:', error);
      Alert.alert('Error', 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: Chat) => {
    analyticsService.trackEvent('chat_opened', {
      chatId: chat.id,
      chatType: chat.type,
      unreadCount: chat.unreadCount,
    });

    navigation.navigate('ChatRoom', { chatId: chat.id, chatName: chat.name });
  };

  const handleNewChat = () => {
    analyticsService.trackEvent('new_chat_started');
    navigation.navigate('NewChat');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search functionality
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const getMessagePreview = (message: Chat['lastMessage']) => {
    switch (message.type) {
      case 'image':
        return 'Image';
      case 'file':
        return 'File';
      case 'location':
        return 'Location';
      case 'voice':
        return 'Voice message';
      default:
        return message.text;
    }
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)}
    >
      <HStack space={3} alignItems="center" flex={1}>
        <Box position="relative">
          <Avatar
            size="lg"
            source={{ uri: item.avatar }}
            bg="primary.500"
          >
            {item.name.charAt(0).toUpperCase()}
          </Avatar>
          {item.isOnline && (
            <Box
              position="absolute"
              bottom={0}
              right={0}
              w={4}
              h={4}
              bg="green.500"
              borderRadius="full"
              borderWidth={2}
              borderColor="white"
              shadow={1}
            />
          )}
        </Box>

        <VStack flex={1} space={1}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text style={styles.chatName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.chatTime}>
              {formatTime(item.lastMessage.timestamp)}
            </Text>
          </HStack>

          <HStack justifyContent="space-between" alignItems="center">
            <Text style={styles.lastMessage} numberOfLines={1}>
              {getMessagePreview(item.lastMessage)}
            </Text>
            {item.unreadCount > 0 && (
              <Badge colorScheme="red" rounded="full" variant="solid">
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Badge>
            )}
          </HStack>
        </VStack>

        <VStack space={1} alignItems="flex-end">
          {item.isPinned && (
            <Icon
              as={MaterialCommunityIcons}
              name="pin"
              size="xs"
              color="orange.500"
            />
          )}
          {item.isMuted && (
            <Icon
              as={MaterialCommunityIcons}
              name="volume-off"
              size="xs"
              color="gray.500"
            />
          )}
        </VStack>
      </HStack>
    </TouchableOpacity>
  );

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, all chats show in all categories - in real app, filter by category
    return matchesSearch;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <MainScreenLayout
      selectedFamily={selectedFamily}
      showFamilyDropdown={showFamilyDropdown}
      onToggleFamilyDropdown={() => setShowFamilyDropdown(!showFamilyDropdown)}
    >
      <View style={{ flex: 1 }}>
        <Box style={styles.header}>
          <Text style={styles.title}>Messages</Text>
          <IconButton
            icon={<Icon as={MaterialCommunityIcons} name="plus" />}
            onPress={handleNewChat}
            variant="ghost"
            colorScheme="primary"
          />
        </Box>

        <SegmentedTabs
          tabs={[
            { id: 'hourse', label: 'hourse', icon: 'home' },
            { id: 'workplace', label: 'Workplace', icon: 'briefcase' },
            { id: 'hometown', label: 'Hometown', icon: 'map-marker' },
            { id: 'commercial', label: 'Commercial', icon: 'store' },
            { id: 'other', label: 'Other', icon: 'dots-horizontal' },
          ]}
          activeId={activeCategory}
          onChange={(id) => setActiveCategory(id as ChatCategory)}
        />

        <Box style={styles.searchContainer}>
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChangeText={handleSearch}
            InputLeftElement={
              <Icon
                as={MaterialCommunityIcons}
                name="magnify"
                size="sm"
                color="gray.400"
                ml={2}
              />
            }
            InputRightElement={
              searchQuery ? (
                <IconButton
                  icon={<Icon as={MaterialCommunityIcons} name="close" />}
                  onPress={() => setSearchQuery('')}
                  variant="ghost"
                  size="sm"
                />
              ) : undefined
            }
            style={styles.searchInput}
          />
        </Box>

        {filteredChats.length === 0 ? (
          <EmptyState
            icon="chat-outline"
            title="No messages yet"
            subtitle="Start a conversation with your hourse members"
            actionText="New Chat"
            onAction={handleNewChat}
          />
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#4A90E2']}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <FamilyDropdown
        visible={showFamilyDropdown}
        onClose={() => setShowFamilyDropdown(false)}
        selectedFamily={selectedFamily}
        onFamilySelect={(name: string) => { setSelectedFamily(name); setShowFamilyDropdown(false); }}
        availableFamilies={[]}
      />
    </MainScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  chatTime: {
    fontSize: 12,
    color: '#666666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
});

export default ChatListScreen; 