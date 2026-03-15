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

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isUser ? styles.userMessageRow : styles.aiMessageRow]}>
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <CoolIcon name="robot-outline" size={15} color="#FA7272" />
        </View>
      )}
      <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, item.isUser ? styles.userText : styles.aiText]}>
          {item.text}
        </Text>
      </View>
    </View>
  );


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
              <View style={styles.aiAvatar}>
                <CoolIcon name="robot-outline" size={15} color="#FA7272" />
              </View>
              <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#FA7272" />
              </View>
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
  },
  list: {
    flex: 1,
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
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#FA7272',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  typingBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1F2937',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
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
