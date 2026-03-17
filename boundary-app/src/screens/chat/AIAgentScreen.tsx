import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HStack, VStack, Input, Icon, IconButton, Avatar, Box } from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useUserData } from '../../contexts/UserDataContext';
import { aiAgentService, AIAgentRequest, AIAgentResponse } from '../../services/ai/AIAgentService';
import { analyticsService } from '../../services/analytics/AnalyticsService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { imagePickerService } from '../../services/imagePicker/ImagePickerService';
import { documentPickerService } from '../../services/imagePicker/DocumentPickerService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actions?: any[];
  suggestions?: string[];
  confidence?: number;
}

interface AIAgentScreenProps {
  route?: {
    params?: {
      initialMessage?: string;
    };
  };
}

const AIAgentScreen: React.FC<AIAgentScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { families } = useUserData();
  const Circle = families && families.length > 0 ? families[0] : null;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ 
    uri: string; 
    base64: string; 
    type: string; 
    name: string;
    kind: 'image' | 'document' 
  } | null>(null);
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (route?.params?.initialMessage) {
      handleSendMessage(route.params.initialMessage);
    }
  }, [route?.params?.initialMessage]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Load capabilities
      const caps = await aiAgentService.getCapabilities();
      setCapabilities(caps);
      
      // Load conversation history
      if (user && Circle) {
        const history = await aiAgentService.getConversationHistory(user.id, Circle.id);
        if (history && history.messages.length > 0) {
          setMessages(history.messages.map(msg => ({
            id: `${msg.timestamp}_${msg.role}`,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            actions: msg.actions,
            suggestions: []
          })));
        } else {
          // Show welcome message
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm your AI assistant for Boundary. I can help you manage your Circle, send messages, track expenses, and much more. What would you like to do today?`,
            timestamp: Date.now(),
            suggestions: []
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to initialize AI assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachImage = async () => {
    try {
      const result = await imagePickerService.launchImageLibraryAsync({
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        let base64 = asset.uri.startsWith('data:') ? asset.uri.split(',')[1] : '';
        
        setSelectedAttachment({
          uri: asset.uri,
          base64,
          type: asset.type || 'image/jpeg',
          name: asset.uri.split('/').pop() || 'image.jpg',
          kind: 'image',
        });
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAttachDocument = async () => {
    try {
      const result = await documentPickerService.getDocumentAsync();
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedAttachment({
          uri: asset.uri,
          base64: asset.base64 || '',
          type: asset.mimeType || 'application/octet-stream',
          name: asset.name,
          kind: 'document',
        });
      }
    } catch (error) {
      console.error('Pick document error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleAttachPress = () => {
    Alert.alert(
      'Attach File',
      'Choose the type of file to attach',
      [
        { text: 'Image', onPress: handleAttachImage },
        { text: 'Document', onPress: handleAttachDocument },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !user || !Circle) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    const attachments = selectedAttachment ? [{
      type: selectedAttachment.kind,
      media_type: selectedAttachment.type,
      data: selectedAttachment.base64,
      name: selectedAttachment.name
    }] : [];
    setSelectedAttachment(null);
    setSending(true);

    try {
      const request: AIAgentRequest = {
        message,
        attachments,
        context: {
          userId: user.id,
          circleId: Circle.id,
          userRole: (Circle as any)?.role || 'member',
          permissions: ((Circle as any)?.permissions as any) || [],
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version.toString()
          }
        }
      };

      const response: AIAgentResponse = await aiAgentService.processRequest(request);

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
        actions: response.actions,
        suggestions: response.suggestions,
        confidence: response.confidence
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Track analytics
      analyticsService.trackEvent('ai_agent_message_sent', {
        messageLength: message.length,
        responseConfidence: response.confidence,
        actionsCount: response.actions.length
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: Date.now(),
        suggestions: ['Try rephrasing your request', 'Check your connection', 'Contact support']
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleActionPress = (action: any) => {
    // Handle action details
    Alert.alert(
      'Action Details',
      `Service: ${action.service}\nMethod: ${action.method}\nDescription: ${action.description}`,
      [{ text: 'OK' }]
    );
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear the chat history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            if (user && Circle) {
              await aiAgentService.clearConversationHistory(user.id, Circle.id);
              setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: 'Chat history cleared. How can I help you today?',
                timestamp: Date.now(),
                suggestions: []
              }]);
            }
          }
        }
      ]
    );
  };

  const handleCapabilitiesPress = () => {
    (navigation as any).navigate('AICapabilities', { capabilities });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <HStack space={3} alignItems="flex-start">
        {item.role === 'assistant' && (
          <Box position="relative">
            <Avatar
              size="md"
              bg="primary.500"
              borderWidth={2}
              borderColor="white"
              shadow={2}
              source={{ uri: 'https://placehold.co/40' }}
            >
              AI
            </Avatar>
            {/* AI indicator */}
            <Box
              position="absolute"
              bottom={0}
              right={0}
              w={3}
              h={3}
              borderRadius="full"
              bg="green.500"
              borderWidth={2}
              borderColor="white"
            />
          </Box>
        )}
        
        <VStack flex={1} space={2}>
          <View style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={[
              styles.messageText,
              item.role === 'user' ? styles.userText : styles.assistantText
            ]}>
              {item.content}
            </Text>
          </View>

          {/* Actions */}
          {item.actions && item.actions.length > 0 && (
            <VStack space={1}>
              {item.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.actionItem}
                  onPress={() => handleActionPress(action)}
                >
                  <HStack space={2} alignItems="center">
                    <Icon
                      as={MaterialCommunityIcons}
                      name={getActionIcon(action.type)}
                      size="sm"
                      color="primary.500"
                    />
                    <Text style={styles.actionText}>{action.description}</Text>
                  </HStack>
                </TouchableOpacity>
              ))}
            </VStack>
          )}


          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </VStack>

        {item.role === 'user' && (
          <Box position="relative">
            <Avatar
              size="md"
              bg="gray.500"
              borderWidth={2}
              borderColor="white"
              shadow={2}
              source={{ uri: user?.avatar }}
            >
              {user?.firstName?.charAt(0)?.toUpperCase()}
            </Avatar>
            {/* User online indicator */}
            <Box
              position="absolute"
              bottom={0}
              right={0}
              w={3}
              h={3}
              borderRadius="full"
              bg="green.500"
              borderWidth={2}
              borderColor="white"
            />
          </Box>
        )}
      </HStack>
    </View>
  );

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'plus-circle';
      case 'update':
        return 'pencil';
      case 'delete':
        return 'delete';
      case 'read':
        return 'eye';
      case 'notify':
        return 'bell';
      case 'navigate':
        return 'navigation';
      default:
        return 'information';
    }
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>
      <HStack space={2} flexWrap="wrap">
        {capabilities.slice(0, 6).map((capability, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickActionChip}
            onPress={() => handleSuggestionPress(capability.examples[0])}
          >
            <Icon
              as={MaterialCommunityIcons}
              name={getCapabilityIcon(capability.service)}
              size="sm"
              color="primary.500"
            />
            <Text style={styles.quickActionText}>{capability.service}</Text>
          </TouchableOpacity>
        ))}
              </HStack>
      </View>
    );

  const getCapabilityIcon = (service: string) => {
    const iconMap: { [key: string]: string } = {
      Circle: 'account-group',
      user: 'account',
      chat: 'chat',
      location: 'map-marker',
      safety: 'shield-check',
      notification: 'bell',
      storage: 'folder',
      health: 'heart-pulse',
      expenses: 'cash',
      shopping: 'cart',
      notes: 'note-text',
      games: 'gamepad-variant',
      weather: 'weather-partly-cloudy',
      news: 'newspaper',
      entertainment: 'movie'
    };
    return iconMap[service] || 'help-circle';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <HStack space={3} alignItems="center" flex={1}>
          <Icon
            as={MaterialCommunityIcons}
            name="arrow-left"
            size="lg"
            color="primary.500"
            onPress={() => navigation.goBack()}
          />
          <VStack flex={1}>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>Your Circle management helper</Text>
          </VStack>
        </HStack>
        <HStack space={2} alignItems="center">
          <IconButton
            icon={<Icon as={MaterialCommunityIcons} name="help-circle" />}
            onPress={handleCapabilitiesPress}
            variant="ghost"
            colorScheme="primary"
            size="sm"
          />
          <TouchableOpacity
            onPress={handleClearChat}
            style={styles.headerResetBtn}
            activeOpacity={0.7}
          >
            <Icon as={MaterialCommunityIcons} name="delete" size="xs" color="#EF4444" />
            <Text style={styles.headerResetText}>Reset</Text>
          </TouchableOpacity>
        </HStack>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListHeaderComponent={renderQuickActions}
        />

        <View style={styles.inputContainer}>
          {selectedAttachment && (
            <View style={styles.previewArea}>
              <View style={styles.imagePreviewWrapper}>
                {selectedAttachment.kind === 'image' ? (
                  <Image source={{ uri: selectedAttachment.uri }} style={styles.imagePreview} />
                ) : (
                  <View style={[styles.imagePreview, styles.docPreview]}>
                    <Icon as={MaterialCommunityIcons} name="file-document-outline" size="xl" color="primary.500" />
                    <Text style={styles.docPreviewText} numberOfLines={1}>
                      {selectedAttachment.name}
                    </Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.removeImageBtn}
                  onPress={() => setSelectedAttachment(null)}
                >
                  <Icon as={MaterialCommunityIcons} name="close-circle" size="xs" color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <HStack space={2} alignItems="center">
            <TouchableOpacity 
              onPress={handleAttachPress}
              style={styles.attachBtn}
            >
              <Icon as={MaterialCommunityIcons} name="paperclip" size="md" color={selectedAttachment ? "primary.500" : "gray.400"} />
            </TouchableOpacity>
            <Input
              flex={1}
              placeholder="Ask me anything..."
              value={inputMessage}
              onChangeText={setInputMessage}
              onSubmitEditing={() => handleSendMessage(inputMessage)}
              returnKeyType="send"
              style={styles.input}
              multiline
              maxLength={500}
              variant="unstyled"
            />
            <IconButton
              icon={
                sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon as={MaterialCommunityIcons} name="send" color="white" />
                )
              }
              onPress={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || sending}
              variant="solid"
              colorScheme="primary"
              size="md"
              borderRadius="full"
            />
          </HStack>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  headerResetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  quickActions: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#4A90E2',
  },
  assistantBubble: {
    backgroundColor: '#F8F9FA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#333333',
  },
  actionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  actionText: {
    fontSize: 14,
    color: '#333333',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginTop: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  suggestionText: {
    fontSize: 12,
    color: '#4A90E2',
  },
  timestamp: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'column',
  },
  attachBtn: {
    padding: 4,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  previewArea: {
    marginBottom: 8,
  },
  imagePreviewWrapper: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    zIndex: 1,
  },
  docPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: '#F0F9FF',
  },
  docPreviewText: {
    fontSize: 8,
    color: '#0284C7',
    marginTop: 2,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AIAgentScreen; 
