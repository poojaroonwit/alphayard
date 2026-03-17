import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, Progress } from 'native-base';
import { analyticsService } from '../../services/analytics/AnalyticsService';

interface HealthData {
  steps: number;
  stepsGoal: number;
  heartRate: number;
  sleepHours: number;
  sleepGoal: number;
  waterIntake: number;
  waterGoal: number;
  calories: number;
  caloriesGoal: number;
  lastUpdated: number;
}

interface HealthAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  message: string;
  timestamp: number;
}

interface HealthWidgetProps {
  onPress?: () => void;
  showAlerts?: boolean;
}

const HealthWidget: React.FC<HealthWidgetProps> = ({
  onPress,
  showAlerts = true,
}) => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      
      // Simulate loading health data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockHealthData: HealthData = {
        steps: 6840,
        stepsGoal: 10000,
        heartRate: 72,
        sleepHours: 7.5,
        sleepGoal: 8,
        waterIntake: 6,
        waterGoal: 8,
        calories: 1850,
        caloriesGoal: 2000,
        lastUpdated: Date.now(),
      };

      const mockAlerts: HealthAlert[] = [
        {
          id: '1',
          type: 'warning',
          message: 'You need 3,160 more steps to reach your daily goal',
          timestamp: Date.now(),
        },
        {
          id: '2',
          type: 'info',
          message: 'Drink 2 more glasses of water today',
          timestamp: Date.now(),
        },
      ];

      setHealthData(mockHealthData);
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load health data:', error);
      Alert.alert('Error', 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHealthData();
    setRefreshing(false);
  };

  const handleWidgetPress = () => {
    analyticsService.trackEvent('health_widget_pressed', {
      steps: healthData?.steps,
      heartRate: healthData?.heartRate,
      sleepHours: healthData?.sleepHours,
    });
    
    if (onPress) {
      onPress();
    }
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#4CAF50';
    if (percentage >= 80) return '#8BC34A';
    if (percentage >= 60) return '#FFC107';
    if (percentage >= 40) return '#FF9800';
    return '#F44336';
  };

  const getHeartRateStatus = (heartRate: number) => {
    if (heartRate < 60) return { status: 'Low', color: '#2196F3' };
    if (heartRate < 100) return { status: 'Normal', color: '#4CAF50' };
    if (heartRate < 120) return { status: 'Elevated', color: '#FF9800' };
    return { status: 'High', color: '#F44336' };
  };

  const getSleepStatus = (sleepHours: number) => {
    if (sleepHours >= 7 && sleepHours <= 9) return { status: 'Good', color: '#4CAF50' };
    if (sleepHours >= 6 && sleepHours < 7) return { status: 'Fair', color: '#FF9800' };
    return { status: 'Poor', color: '#F44336' };
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Health & Wellness</Text>
          <Icon name="heart-pulse" size={24} color="#4A90E2" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading health data...</Text>
        </View>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Health & Wellness</Text>
          <Icon name="heart-pulse" size={24} color="#4A90E2" />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="heart-outline" size={48} color="#9E9E9E" />
          <Text style={styles.emptyText}>No health data available</Text>
          <Text style={styles.emptySubtext}>Connect your health devices</Text>
        </View>
      </Card>
    );
  }

  const stepsProgress = getProgressPercentage(healthData.steps, healthData.stepsGoal);
  const waterProgress = getProgressPercentage(healthData.waterIntake, healthData.waterGoal);
  const sleepProgress = getProgressPercentage(healthData.sleepHours, healthData.sleepGoal);
  const caloriesProgress = getProgressPercentage(healthData.calories, healthData.caloriesGoal);

  const heartRateStatus = getHeartRateStatus(healthData.heartRate);
  const sleepStatus = getSleepStatus(healthData.sleepHours);

  return (
    <Card style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={handleWidgetPress}>
        <Text style={styles.title}>Health & Wellness</Text>
        <Icon name="heart-pulse" size={24} color="#4A90E2" />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Steps */}
        <View style={styles.metricContainer}>
          <View style={styles.metricHeader}>
            <Icon name="walk" size={20} color="#4CAF50" />
            <Text style={styles.metricTitle}>Steps</Text>
            <Text style={styles.metricValue}>
              {healthData.steps.toLocaleString()}
            </Text>
          </View>
          <Progress
            value={stepsProgress}
            colorScheme="green"
            size="sm"
            style={styles.progress}
          />
          <Text style={styles.metricGoal}>
            Goal: {healthData.stepsGoal.toLocaleString()}
          </Text>
        </View>

        {/* Heart Rate */}
        <View style={styles.metricContainer}>
          <View style={styles.metricHeader}>
            <Icon name="heart" size={20} color="#F44336" />
            <Text style={styles.metricTitle}>Heart Rate</Text>
            <Text style={styles.metricValue}>
              {healthData.heartRate} BPM
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: heartRateStatus.color },
              ]}
            >
              <Text style={styles.statusText}>{heartRateStatus.status}</Text>
            </View>
          </View>
        </View>

        {/* Sleep */}
        <View style={styles.metricContainer}>
          <View style={styles.metricHeader}>
            <Icon name="sleep" size={20} color="#9C27B0" />
            <Text style={styles.metricTitle}>Sleep</Text>
            <Text style={styles.metricValue}>
              {healthData.sleepHours}h
            </Text>
          </View>
          <Progress
            value={sleepProgress}
            colorScheme="purple"
            size="sm"
            style={styles.progress}
          />
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: sleepStatus.color },
              ]}
            >
              <Text style={styles.statusText}>{sleepStatus.status}</Text>
            </View>
          </View>
        </View>

        {/* Water Intake */}
        <View style={styles.metricContainer}>
          <View style={styles.metricHeader}>
            <Icon name="cup-water" size={20} color="#2196F3" />
            <Text style={styles.metricTitle}>Water</Text>
            <Text style={styles.metricValue}>
              {healthData.waterIntake} glasses
            </Text>
          </View>
          <Progress
            value={waterProgress}
            colorScheme="blue"
            size="sm"
            style={styles.progress}
          />
          <Text style={styles.metricGoal}>
            Goal: {healthData.waterGoal} glasses
          </Text>
        </View>

        {/* Calories */}
        <View style={styles.metricContainer}>
          <View style={styles.metricHeader}>
            <Icon name="fire" size={20} color="#FF9800" />
            <Text style={styles.metricTitle}>Calories</Text>
            <Text style={styles.metricValue}>
              {healthData.calories.toLocaleString()}
            </Text>
          </View>
          <Progress
            value={caloriesProgress}
            colorScheme="orange"
            size="sm"
            style={styles.progress}
          />
          <Text style={styles.metricGoal}>
            Goal: {healthData.caloriesGoal.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Health Alerts */}
      {showAlerts && alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>Health Tips</Text>
          {alerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertContainer,
                {
                  backgroundColor:
                    alert.type === 'warning'
                      ? '#FFF3E0'
                      : alert.type === 'info'
                      ? '#E3F2FD'
                      : '#E8F5E8',
                },
              ]}
            >
              <Icon
                name={
                  alert.type === 'warning'
                    ? 'alert-circle'
                    : alert.type === 'info'
                    ? 'information'
                    : 'check-circle'
                }
                size={16}
                color={
                  alert.type === 'warning'
                    ? '#FF9800'
                    : alert.type === 'info'
                    ? '#2196F3'
                    : '#4CAF50'
                }
              />
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>
          Last updated: {formatTime(healthData.lastUpdated)}
        </Text>
        <TouchableOpacity style={styles.viewAllButton} onPress={onPress}>
          <Text style={styles.viewAllText}>View Details</Text>
          <Icon name="chevron-right" size={16} color="#4A90E2" />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#999999',
  },
  content: {
    gap: 16,
  },
  metricContainer: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  progress: {
    height: 6,
  },
  metricGoal: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  alertsContainer: {
    marginTop: 16,
    gap: 8,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666666',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
});

export default HealthWidget; 
