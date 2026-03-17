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
import { Card, Badge } from 'native-base';
import { analyticsService } from '../../services/analytics/AnalyticsService';

interface WeatherData {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
    visibility: number;
    uvIndex: number;
    condition: string;
    icon: string;
    description: string;
  };
  forecast: {
    date: number;
    high: number;
    low: number;
    condition: string;
    icon: string;
    precipitation: number;
    humidity: number;
  }[];
  location: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  alerts: {
    id: string;
    type: 'warning' | 'watch' | 'advisory';
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    expires: number;
  }[];
  lastUpdated: number;
}

interface WeatherWidgetProps {
  onPress?: () => void;
  showForecast?: boolean;
  showAlerts?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  onPress,
  showForecast = true,
  showAlerts = true,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      
      // Simulate loading weather data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockWeatherData: WeatherData = {
        current: {
          temperature: 24,
          feelsLike: 26,
          humidity: 65,
          windSpeed: 12,
          windDirection: 'NE',
          pressure: 1013,
          visibility: 10,
          uvIndex: 6,
          condition: 'Partly Cloudy',
          icon: 'partly-cloudy-day',
          description: 'Partly cloudy with light winds',
        },
        forecast: [
          {
            date: Date.now() + 86400000,
            high: 26,
            low: 18,
            condition: 'Sunny',
            icon: 'clear-day',
            precipitation: 0,
            humidity: 60,
          },
          {
            date: Date.now() + 172800000,
            high: 28,
            low: 20,
            condition: 'Partly Cloudy',
            icon: 'partly-cloudy-day',
            precipitation: 10,
            humidity: 70,
          },
          {
            date: Date.now() + 259200000,
            high: 25,
            low: 17,
            condition: 'Rain',
            icon: 'rain',
            precipitation: 80,
            humidity: 85,
          },
          {
            date: Date.now() + 345600000,
            high: 27,
            low: 19,
            condition: 'Sunny',
            icon: 'clear-day',
            precipitation: 0,
            humidity: 55,
          },
          {
            date: Date.now() + 432000000,
            high: 29,
            low: 21,
            condition: 'Partly Cloudy',
            icon: 'partly-cloudy-day',
            precipitation: 20,
            humidity: 65,
          },
        ],
        location: {
          name: 'Bangkok',
          country: 'Thailand',
          latitude: 13.7563,
          longitude: 100.5018,
          timezone: 'Asia/Bangkok',
        },
        alerts: [
          {
            id: '1',
            type: 'warning',
            title: 'Heat Advisory',
            description: 'High temperatures expected. Stay hydrated and avoid prolonged sun exposure.',
            severity: 'moderate',
            expires: Date.now() + 86400000,
          },
        ],
        lastUpdated: Date.now(),
      };

      setWeatherData(mockWeatherData);
    } catch (error) {
      console.error('Failed to load weather data:', error);
      Alert.alert('Error', 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const handleWidgetPress = () => {
    analyticsService.trackEvent('weather_widget_pressed', {
      location: weatherData?.location.name,
      temperature: weatherData?.current.temperature,
      condition: weatherData?.current.condition,
    });
    
    if (onPress) {
      onPress();
    }
  };

  const getWeatherIcon = (icon: string) => {
    const iconMap: { [key: string]: string } = {
      'clear-day': 'weather-sunny',
      'clear-night': 'weather-night',
      'partly-cloudy-day': 'weather-partly-cloudy',
      'partly-cloudy-night': 'weather-night-partly-cloudy',
      'cloudy': 'weather-cloudy',
      'rain': 'weather-rainy',
      'sleet': 'weather-snowy-rainy',
      'snow': 'weather-snowy',
      'wind': 'weather-windy',
      'fog': 'weather-fog',
      'hail': 'weather-hail',
      'thunderstorm': 'weather-lightning',
      'tornado': 'weather-tornado',
    };
    return iconMap[icon] || 'weather-cloudy';
  };

  const getUVIndexColor = (uvIndex: number) => {
    if (uvIndex <= 2) return '#4CAF50';
    if (uvIndex <= 5) return '#FFC107';
    if (uvIndex <= 7) return '#FF9800';
    if (uvIndex <= 10) return '#F44336';
    return '#9C27B0';
  };

  const getUVIndexDescription = (uvIndex: number) => {
    if (uvIndex <= 2) return 'Low';
    if (uvIndex <= 5) return 'Moderate';
    if (uvIndex <= 7) return 'High';
    if (uvIndex <= 10) return 'Very High';
    return 'Extreme';
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return '#2196F3';
      case 'moderate':
        return '#FF9800';
      case 'severe':
        return '#F44336';
      case 'extreme':
        return '#9C27B0';
      default:
        return '#9E9E9E';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weather</Text>
          <Icon name="weather-partly-cloudy" size={24} color="#4A90E2" />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </Card>
    );
  }

  if (!weatherData) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Weather</Text>
          <Icon name="weather-partly-cloudy" size={24} color="#4A90E2" />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="weather-cloudy" size={48} color="#9E9E9E" />
          <Text style={styles.emptyText}>Weather data unavailable</Text>
          <Text style={styles.emptySubtext}>Check your location settings</Text>
        </View>
      </Card>
    );
  }

  const uvIndexColor = getUVIndexColor(weatherData.current.uvIndex);
  const uvIndexDescription = getUVIndexDescription(weatherData.current.uvIndex);

  return (
    <Card style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={handleWidgetPress}>
        <View style={styles.locationContainer}>
          <Text style={styles.title}>Weather</Text>
          <Text style={styles.location}>
            {weatherData.location.name}, {weatherData.location.country}
          </Text>
        </View>
        <Icon name="weather-partly-cloudy" size={24} color="#4A90E2" />
      </TouchableOpacity>

      {/* Current Weather */}
      <View style={styles.currentWeather}>
        <View style={styles.temperatureContainer}>
          <Icon
            name={getWeatherIcon(weatherData.current.icon)}
            size={48}
            color="#4A90E2"
          />
          <View style={styles.temperatureInfo}>
            <Text style={styles.temperature}>
              {weatherData.current.temperature}°C
            </Text>
            <Text style={styles.feelsLike}>
              Feels like {weatherData.current.feelsLike}°C
            </Text>
            <Text style={styles.condition}>
              {weatherData.current.description}
            </Text>
          </View>
        </View>

        <View style={styles.weatherDetails}>
          <View style={styles.detailItem}>
            <Icon name="water-percent" size={16} color="#2196F3" />
            <Text style={styles.detailText}>
              {weatherData.current.humidity}%
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="weather-windy" size={16} color="#4CAF50" />
            <Text style={styles.detailText}>
              {weatherData.current.windSpeed} km/h {weatherData.current.windDirection}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="gauge" size={16} color="#FF9800" />
            <Text style={styles.detailText}>
              {weatherData.current.pressure} hPa
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="eye" size={16} color="#9C27B0" />
            <Text style={styles.detailText}>
              {weatherData.current.visibility} km
            </Text>
          </View>
        </View>

        <View style={styles.uvContainer}>
          <View style={styles.uvInfo}>
            <Icon name="weather-sunny" size={16} color={uvIndexColor} />
            <Text style={styles.uvLabel}>UV Index</Text>
          </View>
          <View style={styles.uvValue}>
            <Text style={[styles.uvIndex, { color: uvIndexColor }]}>
              {weatherData.current.uvIndex}
            </Text>
            <Text style={[styles.uvDescription, { color: uvIndexColor }]}>
              {uvIndexDescription}
            </Text>
          </View>
        </View>
      </View>

      {/* Weather Alerts */}
      {showAlerts && weatherData.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.alertsTitle}>Weather Alerts</Text>
          {weatherData.alerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertContainer,
                {
                  borderLeftColor: getAlertColor(alert.severity),
                },
              ]}
            >
              <View style={styles.alertHeader}>
                <Icon
                  name="alert-circle"
                  size={16}
                  color={getAlertColor(alert.severity)}
                />
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Badge
                  colorScheme={
                    alert.severity === 'minor' ? 'blue' :
                    alert.severity === 'moderate' ? 'orange' :
                    alert.severity === 'severe' ? 'red' : 'purple'
                  }
                  rounded="full"
                  variant="solid"
                >
                  {alert.severity}
                </Badge>
              </View>
              <Text style={styles.alertDescription}>
                {alert.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 5-Day Forecast */}
      {showForecast && (
        <View style={styles.forecastContainer}>
          <Text style={styles.forecastTitle}>5-Day Forecast</Text>
          <View style={styles.forecastList}>
            {weatherData.forecast.map((day, index) => (
              <View key={index} style={styles.forecastItem}>
                <Text style={styles.forecastDay}>
                  {formatDate(day.date)}
                </Text>
                <Icon
                  name={getWeatherIcon(day.icon)}
                  size={24}
                  color="#4A90E2"
                />
                <View style={styles.forecastTemps}>
                  <Text style={styles.forecastHigh}>{day.high}°</Text>
                  <Text style={styles.forecastLow}>{day.low}°</Text>
                </View>
                {day.precipitation > 0 && (
                  <Text style={styles.precipitation}>
                    {day.precipitation}%
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>
          Last updated: {formatTime(weatherData.lastUpdated)}
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  location: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
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
  currentWeather: {
    marginBottom: 16,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  temperatureInfo: {
    marginLeft: 16,
    flex: 1,
  },
  temperature: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
  },
  feelsLike: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  condition: {
    fontSize: 16,
    color: '#333333',
    marginTop: 4,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
  },
  uvContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  uvInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uvLabel: {
    fontSize: 14,
    color: '#333333',
  },
  uvValue: {
    alignItems: 'flex-end',
  },
  uvIndex: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  uvDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  alertsContainer: {
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  alertContainer: {
    borderLeftWidth: 4,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  alertDescription: {
    fontSize: 12,
    color: '#666666',
  },
  forecastContainer: {
    marginBottom: 16,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  forecastList: {
    gap: 8,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  forecastDay: {
    fontSize: 14,
    color: '#333333',
    width: 80,
  },
  forecastTemps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 16,
  },
  forecastHigh: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  forecastLow: {
    fontSize: 14,
    color: '#666666',
  },
  precipitation: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 'auto',
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

export default WeatherWidget; 
