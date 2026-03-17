import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import IconIon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface AttentionDetailScreenProps {
  route: {
    params: {
      attentionApp: any;
    };
  };
}

const AttentionDetailScreen: React.FC<AttentionDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { attentionApp } = route.params;
  const [isCleared, setIsCleared] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF5A5A';
      case 'medium': return '#FF8C8C';
      case 'low': return '#4CAF50';
      default: return '#FF5A5A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return '#FF5A5A';
      case 'pending': return '#FF8C8C';
      case 'completed': return '#4CAF50';
      default: return '#666666';
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Attention',
      'Are you sure you want to clear this attention item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setIsCleared(true);
            // TODO: Implement actual clear functionality
            setTimeout(() => {
              navigation.goBack();
            }, 1000);
          }
        }
      ]
    );
  };

  const handleAdd = () => {
    Alert.alert(
      'Add Item',
      'Add new item to this attention category?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: () => {
            // TODO: Implement add functionality
            Alert.alert('Success', 'Item added successfully!');
          }
        }
      ]
    );
  };

  const handleOperate = () => {
    Alert.alert(
      'Operate',
      'Perform operation on this attention item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Operate', 
          onPress: () => {
            // TODO: Implement operate functionality
            Alert.alert('Success', 'Operation completed successfully!');
          }
        }
      ]
    );
  };

  if (isCleared) {
    return (
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        locations={[0, 1.0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
        <SafeAreaView style={styles.container}>
          <View style={styles.clearedContainer}>
            <View style={styles.successIconContainer}>
              <IconMC name="check-circle" size={80} color="#FFFFFF" />
            </View>
            <Text style={styles.clearedText}>Attention Cleared!</Text>
            <Text style={styles.clearedSubText}>The item has been successfully cleared and removed from your attention list.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF5A5A" />
      
      {/* Header with gradient background */}
      <LinearGradient
        colors={[getPriorityColor(attentionApp.priority), '#FF9192']}
        locations={[0, 1.0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <IconIon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Attention Detail</Text>
            <TouchableOpacity style={styles.moreButton}>
              <IconIon name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Attention Card */}
        <View style={styles.mainCard}>
          <View style={styles.attentionHeader}>
            <View style={[styles.attentionIcon, { backgroundColor: getPriorityColor(attentionApp.priority) }]}>
              <IconMC name={attentionApp.icon} size={32} color="#FFFFFF" />
            </View>
            <View style={styles.attentionInfo}>
              <Text style={styles.attentionName}>{attentionApp.name}</Text>
              <View style={styles.priorityBadge}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(attentionApp.priority) }]} />
                <Text style={styles.attentionPriority}>{attentionApp.priority.toUpperCase()} PRIORITY</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(attentionApp.status || 'pending') }]}>
              <Text style={styles.statusText}>{attentionApp.status || 'PENDING'}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>
              {attentionApp.description || 'This attention item requires your immediate action. Please review the details and take appropriate action.'}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          {attentionApp.type === 'due-date' ? (
            <>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconIon name="calendar-outline" size={20} color="#666666" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>{attentionApp.dueDate}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconIon name="time-outline" size={20} color="#666666" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time Remaining</Text>
                  <Text style={[styles.detailValue, { color: attentionApp.daysLeft <= 3 ? '#FF5A5A' : '#FFA500' }]}>
                    {attentionApp.daysLeft} days left
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconIon name="cash-outline" size={20} color="#666666" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>{attentionApp.amount}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <IconIon name="list" size={20} color="#666666" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Progress</Text>
                  <Text style={styles.detailValue}>{attentionApp.pendingItems} of {attentionApp.totalItems} pending</Text>
                </View>
              </View>
              
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Completion</Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round((attentionApp.pendingItems / attentionApp.totalItems) * 100)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(attentionApp.pendingItems / attentionApp.totalItems) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* Timeline Section */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Attention Created</Text>
              <Text style={styles.timelineTime}>2 hours ago</Text>
            </View>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Priority Updated</Text>
              <Text style={styles.timelineTime}>1 hour ago</Text>
            </View>
          </View>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.timelineDotActive]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Currently Pending</Text>
              <Text style={styles.timelineTime}>Now</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClear}
          >
            <IconMC name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]}
            onPress={handleAdd}
          >
            <IconMC name="plus-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.operateButton]}
            onPress={handleOperate}
          >
            <IconMC name="cog" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Operate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  attentionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  attentionInfo: {
    flex: 1,
  },
  attentionName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 6,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  attentionPriority: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginRight: 16,
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: '#4CAF50',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 12,
    color: '#666666',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  clearButton: {
    backgroundColor: '#FF5A5A',
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  operateButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  gradientContainer: {
    flex: 1,
  },
  clearedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  clearedText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  clearedSubText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
});

export default AttentionDetailScreen; 
