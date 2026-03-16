import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  streaming?: boolean;   // true while AI is still typing
  toolActivity?: string; // e.g. "Checking financial data…"
  feedback?: 1 | -1;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PersonalTabProps {
  circleStatusMembers?: any[];
  circleLocations?: any[];
  selectedCircle?: any;
  isCircleLoading?: boolean;
  onOpenApps?: () => void;
  onGoToFinance?: () => void;
}

// ─── Welcome message ──────────────────────────────────────────────────────────

const WELCOME: Message = {
  id: 'welcome',
  text: "Hi! I'm your personal AI assistant. I can help with your finances, schedule, health goals, notes, and more. What would you like to know?",
  isUser: false,
  timestamp: new Date(),
};

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "What's my net worth?",
  "Summarize my expenses",
  "Show my circles",
];

// ─── Component ────────────────────────────────────────────────────────────────

export const PersonalTab: React.FC<PersonalTabProps> = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const streamingIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => { cancelRef.current?.() };
  }, []);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isSending) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const streamingId = `ai_${Date.now()}`;
    streamingIdRef.current = streamingId;

    const aiMsg: Message = {
      id: streamingId,
      text: '',
      isUser: false,
      timestamp: new Date(),
      streaming: true,
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInputText('');
    setIsSending(true);
    scrollToEnd();

    const { cancel } = aiService.streamChat(text.trim(), {
      onToken: (token) => {
        setMessages(prev => prev.map(m =>
          m.id === streamingId ? { ...m, text: m.text + token, toolActivity: undefined } : m
        ));
        scrollToEnd();
      },
      onToolStart: (name) => {
        const label = toolLabel(name);
        setMessages(prev => prev.map(m =>
          m.id === streamingId ? { ...m, toolActivity: label } : m
        ));
      },
      onToolEnd: () => {
        setMessages(prev => prev.map(m =>
          m.id === streamingId ? { ...m, toolActivity: undefined } : m
        ));
      },
      onDone: () => {
        setMessages(prev => prev.map(m =>
          m.id === streamingId ? { ...m, streaming: false, toolActivity: undefined } : m
        ));
        setIsSending(false);
        scrollToEnd();
      },
      onError: (err) => {
        setMessages(prev => prev.map(m =>
          m.id === streamingId
            ? { ...m, text: `Sorry, something went wrong: ${err}`, streaming: false, toolActivity: undefined }
            : m
        ));
        setIsSending(false);
      },
    });

    cancelRef.current = cancel;
  }, [isSending, scrollToEnd]);

  const handleFeedback = useCallback(async (msgIndex: number, rating: 1 | -1) => {
    setMessages(prev => prev.map((m, i) =>
      i === msgIndex ? { ...m, feedback: rating } : m
    ));
    try {
      await aiService.sendFeedback({ messageIndex: msgIndex, rating });
    } catch {}
  }, []);

  const handleClearHistory = useCallback(async () => {
    cancelRef.current?.();
    setIsSending(false);
    await aiService.clearHistory();
    setMessages([WELCOME]);
  }, []);

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    if (item.isUser) {
      return (
        <View style={styles.userMessageRow}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{item.text}</Text>
            <Text style={styles.userTime}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.aiMessageBlock}>
        {/* Header row */}
        <View style={styles.aiAvatarRow}>
          <View style={styles.aiAvatar}>
            <CoolIcon name="robot-outline" size={14} color="#FA7272" />
          </View>
          <Text style={styles.aiName}>AI Assistant</Text>
          <Text style={styles.aiTime}>{formatTime(item.timestamp)}</Text>
        </View>

        {/* Tool activity indicator */}
        {item.toolActivity ? (
          <View style={styles.toolRow}>
            <ActivityIndicator size="small" color="#FA7272" style={{ marginRight: 6 }} />
            <Text style={styles.toolText}>{item.toolActivity}</Text>
          </View>
        ) : null}

        {/* Message text / streaming cursor */}
        {item.text.length > 0 && (
          <Text style={styles.aiPlainText}>
            {item.text}
            {item.streaming ? <Text style={styles.cursor}>▍</Text> : null}
          </Text>
        )}

        {/* Feedback buttons (only on finished non-welcome messages) */}
        {!item.streaming && item.id !== 'welcome' && item.text.length > 0 && (
          <View style={styles.feedbackRow}>
            <TouchableOpacity
              onPress={() => handleFeedback(index, 1)}
              style={[styles.feedbackBtn, item.feedback === 1 && styles.feedbackActive]}
              activeOpacity={0.7}
            >
              <CoolIcon name="thumb-up-outline" size={13} color={item.feedback === 1 ? '#22C55E' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleFeedback(index, -1)}
              style={[styles.feedbackBtn, item.feedback === -1 && styles.feedbackActive]}
              activeOpacity={0.7}
            >
              <CoolIcon name="thumb-down-outline" size={13} color={item.feedback === -1 ? '#EF4444' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }, [handleFeedback]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          messages.length === 1 ? (
            <View style={styles.suggestionsRow}>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(s)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        ListFooterComponent={
          isSending && !messages.find(m => m.streaming && m.text === '') ? null :
          isSending && messages[messages.length - 1]?.streaming && messages[messages.length - 1]?.text === '' ? (
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'position' : undefined}
        keyboardVerticalOffset={0}
        style={styles.inputBarWrapper}
      >
        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearHistory}
              activeOpacity={0.7}
            >
              <CoolIcon name="restart" size={18} color="#9CA3AF" />
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
              editable={!isSending}
            />
            {isSending ? (
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: '#E5E7EB' }]}
                onPress={() => { cancelRef.current?.(); setIsSending(false); }}
                activeOpacity={0.8}
              >
                <CoolIcon name="stop" size={16} color="#6B7280" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
                activeOpacity={0.8}
              >
                <CoolIcon name="send" size={18} color={inputText.trim() ? '#FFFFFF' : '#D1D5DB'} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toolLabel(name: string): string {
  const map: Record<string, string> = {
    get_net_worth:            'Checking your net worth…',
    get_financial_categories: 'Loading financial data…',
    create_financial_record:  'Saving record…',
    get_circles:              'Fetching your circles…',
    get_notifications:        'Loading notifications…',
    get_user_profile:         'Loading your profile…',
  };
  return map[name] ?? `Running ${name}…`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', backgroundColor: '#F8FAFC' },
  list: { flex: 1, backgroundColor: '#F8FAFC' },
  messagesList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 154 },

  // Suggestion chips
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  suggestionChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  suggestionText: { fontSize: 12, color: '#FA7272', fontWeight: '500' },

  // AI message
  aiMessageBlock: { marginBottom: 16, alignSelf: 'flex-start', maxWidth: '88%' },
  aiAvatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  aiAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
  },
  aiName: { fontSize: 12, fontWeight: '600', color: '#475569' },
  aiTime: { fontSize: 11, color: '#94A3B8' },
  aiPlainText: { fontSize: 14, lineHeight: 21, color: '#1F2937', paddingLeft: 2 },
  cursor: { color: '#FA7272' },

  // Tool activity
  toolRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingLeft: 2 },
  toolText: { fontSize: 12, color: '#64748B', fontStyle: 'italic' },

  // Feedback
  feedbackRow: { flexDirection: 'row', gap: 4, marginTop: 6, paddingLeft: 2 },
  feedbackBtn: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  feedbackActive: { backgroundColor: '#F0FDF4' },

  // User message
  userMessageRow: { alignSelf: 'flex-end', marginBottom: 16, maxWidth: '80%' },
  userBubble: {
    backgroundColor: '#FA7272', borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  userText: { fontSize: 14, lineHeight: 20, color: '#FFFFFF' },
  userTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'right' },

  // Typing
  typingRow: { marginBottom: 16, alignSelf: 'flex-start' },

  // Input bar
  inputBarWrapper: { position: 'absolute', bottom: 12, left: 0, right: 0 },
  inputBar: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'transparent' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 24,
    paddingHorizontal: 4, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  clearBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  input: { flex: 1, height: 40, paddingHorizontal: 8, fontSize: 14, color: '#1F2937' },
  sendBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FA7272', alignItems: 'center', justifyContent: 'center', marginRight: 2,
  },
  sendBtnDisabled: { backgroundColor: 'transparent' },
});
