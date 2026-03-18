import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, HStack, VStack, Icon, Avatar, Badge, Progress } from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useCircle } from '../../hooks/useCircle';
import aiAgentService from '../../services/ai/AIAgentService';
import { analyticsService } from '../../services/analytics/AnalyticsService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'Circle' | 'safety' | 'communication' | 'productivity' | 'entertainment';
  enabled: boolean;
  usage: number;
}

const AIAssistantScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { Circle } = useCircle();
  const [loading, setLoading] = useState(true);
  const [aiFeatures, setAiFeatures] = useState<AIFeature[]>([]);
  const [conversationCount, setConversationCount] = useState(0);
  const [lastInteraction, setLastInteraction] = useState<Date | null>(null);

  useEffect(() => {
    initializeAIAssistant();
  }, []);

  const initializeAIAssistant = async () => {
    try {
      if (user && Circle) {
        await aiAgentService.initialize(user.id, Circle.id);
        
        const features: AIFeature[] = [
          {
            id: 'circle_management',
            title: 'Circle Management',
            description: 'Add, remove, and manage Circle members',
            icon: 'account-group',
            color: '#4A90E2',
            category: 'Circle',
            enabled: true,
            usage: 85,
          },
          {
            id: 'safety_monitoring',
            title: 'Safety & Security',
            description: 'Emergency alerts, check-ins, and geofencing',
            icon: 'shield-check',
            color: '#E74C3C',
            category: 'safety',
            enabled: true,
            usage: 92,
          },
          {
            id: 'chat_assistant',
            title: 'Chat Assistant',
            description: 'Smart chat management and messaging',
            icon: 'chat-processing',
            color: '#27AE60',
            category: 'communication',
            enabled: true,
            usage: 78,
          },
          {
            id: 'location_tracking',
            title: 'Location Tracking',
            description: 'Find Circle members and share locations',
            icon: 'map-marker-radius',
            color: '#F39C12',
            category: 'safety',
            enabled: true,
            usage: 88,
          },
          {
            id: 'expense_manager',
            title: 'Expense Manager',
            description: 'Track Circle expenses and budgets',
            icon: 'cash-multiple',
            color: '#9B59B6',
            category: 'productivity',
            enabled: true,
            usage: 65,
          },
          {
            id: 'shopping_assistant',
            title: 'Shopping Assistant',
            description: 'Manage shopping lists and groceries',
            icon: 'cart',
            color: '#1ABC9C',
            category: 'productivity',
            enabled: true,
            usage: 72,
          },
          {
            id: 'health_monitor',
            title: 'Health Monitor',
            description: 'Track Circle health and wellness',
            icon: 'heart-pulse',
            color: '#E67E22',
            category: 'Circle',
            enabled: true,
            usage: 58,
          },
          {
            id: 'notes_organizer',
            title: 'Notes Organizer',
            description: 'Create and organize Circle notes',
            icon: 'note-text',
            color: '#34495E',
            category: 'productivity',
            enabled: true,
            usage: 45,
          },
          {
            id: 'gaming_companion',
            title: 'Gaming Companion',
            description: 'Circle gaming sessions and activities',
            icon: 'gamepad-variant',
            color: '#E91E63',
            category: 'entertainment',
            enabled: true,
            usage: 38,
          },
        ];

        setAiFeatures(features);
        
        const history = await aiAgentService.getConversationHistory();
        setConversationCount(history.length);
        
        if (history.length > 0) {
          setLastInteraction(new Date(history[history.length - 1].timestamp));
        }

        analyticsService.trackEvent('ai_assistant_opened', {
          userId: user.id,
          circleId: Circle.id,
          featureCount: features.length,
        });
      }
    } catch (error) {
      console.error('Failed to initialize AI assistant:', error);
      Alert.alert('Error', 'Failed to initialize AI assistant');
    } finally {
      setLoading(false);
    }
  };

  const handleFeaturePress = (feature: AIFeature) => {
    analyticsService.trackEvent('ai_feature_pressed', {
      featureId: feature.id,
      featureTitle: feature.title,
    });

    switch (feature.id) {
      case 'circle_management':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'Help me manage my Circle members' 
        } as never);
        break;
      case 'safety_monitoring':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'I need help with safety and security' 
        } as never);
        break;
      case 'chat_assistant':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'Help me with chat and messaging' 
        } as never);
        break;
      case 'location_tracking':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'I need to find my Circle members' 
        } as never);
        break;
      case 'expense_manager':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'Help me manage Circle expenses' 
        } as never);
        break;
      case 'shopping_assistant':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'I need help with shopping lists' 
        } as never);
        break;
      case 'health_monitor':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'Help me track Circle health' 
        } as never);
        break;
      case 'notes_organizer':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'Help me organize Circle notes' 
        } as never);
        break;
      case 'gaming_companion':
        navigation.navigate('AIChat' as never, { 
          initialMessage: 'I want to set up Circle gaming' 
        } as never);
        break;
      default:
        navigation.navigate('AIChat' as never);
    }
  };

  const handleStartChat = () => {
    analyticsService.trackEvent('ai_chat_started', {
      userId: user?.id,
      circleId: Circle?.id,
    });
    navigation.navigate('AIChat' as never);
  };

  const handleEmergencyAlert = async () => {
    try {
      await aiAgentService.processMessage('Send emergency alert');
      Alert.alert('Emergency Alert', 'Emergency alert has been sent to all Circle members!');
      
      analyticsService.trackEvent('ai_emergency_alert_sent', {
        userId: user?.id,
        circleId: Circle?.id,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send emergency alert');
    }
  };

  const handleSafetyCheckIn = async () => {
    try {
      await aiAgentService.processMessage('I want to check in');
      Alert.alert('Safety Check-in', 'Your safety check-in has been recorded!');
      
      analyticsService.trackEvent('ai_safety_checkin', {
        userId: user?.id,
        circleId: Circle?.id,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to record safety check-in');
    }
  };

  const formatLastInteraction = () => {
    if (!lastInteraction) return 'No recent interactions';
    
    const now = new Date();
    const diff = now.getTime() - lastInteraction.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Circle: '#4A90E2',
      safety: '#E74C3C',
      communication: '#27AE60',
      productivity: '#9B59B6',
      entertainment: '#E91E63',
    };
    return colors[category as keyof typeof colors] || '#666666';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
        <Box style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={styles.loadingText}>Initializing AI Assistant...</Text>
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Colored header background */}
      <Box style={styles.headerBackground}>
        <HStack space={3} alignItems="center" style={styles.header}>
          <Avatar size="lg" bg="rgba(255,255,255,0.3)" style={styles.aiAvatar}>
            <Icon as={MaterialCommunityIcons} name="robot" size="lg" color="white" />
          </Avatar>
          <VStack flex={1}>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>Your intelligent Circle companion</Text>
          </VStack>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => navigation.navigate('AIChat' as never, { initialMessage: 'What can you do?' } as never)}
          >
            <Icon as={MaterialCommunityIcons} name="help-circle" size="lg" color="white" />
          </TouchableOpacity>
        </HStack>
      </Box>

      {/* Card content with rounded top corners */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Box style={styles.cardContent}>
          <Box style={styles.statsContainer}>
            <HStack space={4} justifyContent="space-between">
              <VStack style={styles.statItem}>
                <Text style={styles.statNumber}>{conversationCount}</Text>
                <Text style={styles.statLabel}>Conversations</Text>
              </VStack>
              <VStack style={styles.statItem}>
                <Text style={styles.statNumber}>{aiFeatures.length}</Text>
                <Text style={styles.statLabel}>Features</Text>
              </VStack>
              <VStack style={styles.statItem}>
                <Text style={styles.statNumber}>{formatLastInteraction()}</Text>
                <Text style={styles.statLabel}>Last Used</Text>
              </VStack>
            </HStack>
          </Box>

          <Box style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <HStack space={3} style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#E74C3C' }]}
                onPress={handleEmergencyAlert}
              >
                <Icon as={MaterialCommunityIcons} name="alert-circle" size="md" color="white" />
                <Text style={styles.quickActionText}>Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#27AE60' }]}
                onPress={handleSafetyCheckIn}
              >
                <Icon as={MaterialCommunityIcons} name="check-circle" size="md" color="white" />
                <Text style={styles.quickActionText}>Check-in</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionButton, { backgroundColor: '#4A90E2' }]}
                onPress={handleStartChat}
              >
                <Icon as={MaterialCommunityIcons} name="chat" size="md" color="white" />
                <Text style={styles.quickActionText}>Chat</Text>
              </TouchableOpacity>
            </HStack>
          </Box>

          {['Circle', 'safety', 'communication', 'productivity', 'entertainment'].map(category => {
            const categoryFeatures = aiFeatures.filter(f => f.category === category);
            if (categoryFeatures.length === 0) return null;

            return (
              <Box key={category} style={styles.section}>
                <HStack space={2} alignItems="center" style={styles.categoryHeader}>
                  <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(category) }]} />
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </HStack>
                <VStack space={3}>
                  {categoryFeatures.map(feature => (
                    <TouchableOpacity
                      key={feature.id}
                      style={styles.featureCard}
                      onPress={() => handleFeaturePress(feature)}
                    >
                      <HStack space={3} alignItems="center">
                        <Box style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                          <Icon as={MaterialCommunityIcons} name={feature.icon as any} size="md" color="white" />
                        </Box>
                        <VStack flex={1}>
                          <HStack space={2} alignItems="center">
                            <Text style={styles.featureTitle}>{feature.title}</Text>
                            {feature.enabled && (
                              <Badge colorScheme="green" variant="subtle" size="sm">Active</Badge>
                            )}
                          </HStack>
                          <Text style={styles.featureDescription}>{feature.description}</Text>
                          <HStack space={2} alignItems="center" style={styles.usageContainer}>
                            <Progress value={feature.usage} size="xs" colorScheme="blue" style={styles.usageProgress} />
                            <Text style={styles.usageText}>{feature.usage}%</Text>
                          </HStack>
                        </VStack>
                        <Icon as={MaterialCommunityIcons} name="chevron-right" size="sm" color="#666666" />
                      </HStack>
                    </TouchableOpacity>
                  ))}
                </VStack>
              </Box>
            );
          })}

          <Box style={styles.section}>
            <TouchableOpacity style={styles.startChatButton} onPress={handleStartChat}>
              <HStack space={3} alignItems="center" justifyContent="center">
                <Icon as={MaterialCommunityIcons} name="chat-plus" size="lg" color="white" />
                <Text style={styles.startChatText}>Start AI Chat</Text>
              </HStack>
            </TouchableOpacity>
          </Box>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  headerBackground: {
    backgroundColor: '#4A90E2',
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  aiAvatar: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  helpButton: {
    padding: 8,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  quickActions: {
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
    fontWeight: '500',
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  usageContainer: {
    marginTop: 8,
  },
  usageProgress: {
    flex: 1,
  },
  usageText: {
    fontSize: 12,
    color: '#666666',
    minWidth: 30,
  },
  startChatButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  startChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AIAssistantScreen; 
