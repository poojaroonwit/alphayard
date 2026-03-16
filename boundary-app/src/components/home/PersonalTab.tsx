import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CoolIcon from '../common/CoolIcon';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Hi! I'm your personal AI assistant. I can help you with your schedule, finances, health goals, notes, and more. What would you like to know?",
    isUser: false,
    timestamp: new Date(),
  },
];


interface PersonalTabProps {
  circleStatusMembers?: any[];
  circleLocations?: any[];
  selectedCircle?: any;
  isCircleLoading?: boolean;
  onOpenApps?: () => void;
  onGoToFinance?: () => void;
}

export const PersonalTab: React.FC<PersonalTabProps> = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm working on connecting to your personal data. This AI assistant feature is coming soon — stay tuned!",
        isUser: false,
        timestamp: new Date(),
      };
      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }, 1200);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (!item.isUser) {
      return (
        <View style={styles.aiMessageBlock}>
          <View style={styles.aiAvatarRow}>
            <View style={styles.aiAvatar}>
              <CoolIcon name="robot-outline" size={14} color="#FA7272" />
            </View>
            <Text style={styles.aiName}>AI Assistant</Text>
            <Text style={styles.aiTime}>{formatTime(item.timestamp)}</Text>
          </View>
          <Text style={styles.aiPlainText}>{item.text}</Text>
        </View>
      );
    }
    return (
      <View style={styles.userMessageRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.text}</Text>
          <Text style={styles.userTime}>{formatTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      {/* Messages list — padded at bottom so last message clears the input bar */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={null}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingRow}>
              <View style={styles.aiAvatarRow}>
                <View style={styles.aiAvatar}>
                  <CoolIcon name="robot-outline" size={14} color="#FA7272" />
                </View>
                <Text style={styles.aiName}>AI Assistant</Text>
              </View>
              <ActivityIndicator size="small" color="#FA7272" style={{ marginLeft: 2, marginTop: 4 }} />
            </View>
          ) : null
        }
      />

      {/* Input bar — absolute so it's always visible regardless of parent layout */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
        keyboardVerticalOffset={0}
        style={styles.inputBarWrapper}
      >
        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachmentBtn} activeOpacity={0.7}>
              <CoolIcon name="paperclip" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask anything..."
              placeholderTextColor="#9CA3AF"
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={() => sendMessage(inputText)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              activeOpacity={0.8}
            >
              <CoolIcon name="send" size={18} color={inputText.trim() ? '#FFFFFF' : '#D1D5DB'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  list: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 154, // clear both floating input and task bars
  },
  inputBarWrapper: {
    position: 'absolute',
    bottom: 12, // lift it off the bottom
    left: 0,
    right: 0,
  },
  // AI message — stacked layout
  aiMessageBlock: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  aiAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  aiTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  aiPlainText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1F2937',
    paddingLeft: 2,
  },
  // User message
  userMessageRow: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#FA7272',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  userTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    textAlign: 'right',
  },
  // Typing indicator
  typingRow: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  attachmentBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FA7272',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  sendBtnDisabled: {
    backgroundColor: 'transparent',
  },
});
