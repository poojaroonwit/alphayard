import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanGestureHandler,
  State,
  Easing,
} from 'react-native';
import IconIon from 'react-native-vector-icons/Ionicons';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { brandColors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  type: string;
}

interface DateData {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface GoogleCalendarProps {
  events?: Event[];
  onDayPress?: (day: DateData) => void;
  onEventPress?: (event: Event) => void;
  viewMode?: 'month' | 'week' | 'day';
}

export const GoogleCalendar: React.FC<GoogleCalendarProps> = ({
  events = [],
  onDayPress,
  onEventPress,
  viewMode = 'month',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<DateData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Advanced animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(1)).current;
  const eventAnim = useRef(new Animated.Value(0)).current;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days: DateData[] = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateString = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateString,
        day,
        month: prevMonth.getMonth() + 1,
        year: prevMonth.getFullYear(),
        timestamp: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day).getTime(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
      days.push({
        dateString,
        day,
        month: month + 1,
        year,
        timestamp: new Date(year, month, day).getTime(),
        isCurrentMonth: true,
        isToday,
        isSelected: false,
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = new Date(year, month + 1, day);
      const dateString = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateString,
        day,
        month: nextMonth.getMonth() + 1,
        year: nextMonth.getFullYear(),
        timestamp: nextMonth.getTime(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
      });
    }
    
    return days;
  };

  const getEventsForDate = (dateString: string) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  };

  const handleDayPress = (day: DateData) => {
    if (isAnimating) return;
    
    setSelectedDate(day);
    
    // Animate day selection
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    if (onDayPress) {
      onDayPress(day);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (isAnimating) return;
    setIsAnimating(true);

    const slideDirection = direction === 'next' ? 1 : -1;
    
    // Complex animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: slideDirection * 50,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start(() => {
      const newDate = new Date(currentDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      setCurrentDate(newDate);

      // Reset and animate back
      slideAnim.setValue(-slideDirection * 50);
      scaleAnim.setValue(0.9);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const goToToday = () => {
    if (isAnimating) return;
    
    setCurrentDate(new Date());
    setSelectedDate(null);
    
    // Pulse animation for today button
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    // Animate events on mount
    Animated.timing(eventAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, []);

  const renderCalendarHeader = () => (
    <Animated.View style={[styles.calendarHeader, { transform: [{ scale: headerAnim }] }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              onPress={() => navigateMonth('prev')} 
              style={styles.navButton}
              activeOpacity={0.7}
              disabled={isAnimating}
            >
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.navButtonGradient}
              >
                <IconIon name="chevron-back" size={20} color="#5f6368" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigateMonth('next')} 
              style={styles.navButton}
              activeOpacity={0.7}
              disabled={isAnimating}
            >
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.navButtonGradient}
              >
                <IconIon name="chevron-forward" size={20} color="#5f6368" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.monthYearText}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.todayButton}
              onPress={goToToday}
              activeOpacity={0.8}
              disabled={isAnimating}
            >
              <LinearGradient
                colors={['#1a73e8', '#1557b0']}
                style={styles.todayButtonGradient}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderWeekDays = () => (
    <View style={styles.weekDaysHeader}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
        style={styles.weekDaysGradient}
      >
        {weekDays.map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </LinearGradient>
    </View>
  );

  const renderDayCell = (day: DateData, index: number) => {
    const dayEvents = getEventsForDate(day.dateString);
    const isSelected = selectedDate?.dateString === day.dateString;

    return (
      <Animated.View
        key={day.dateString}
        style={[
          styles.dayCellContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateX: slideAnim },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dayCell,
            day.isToday && styles.todayCell,
            isSelected && styles.selectedCell,
          ]}
          onPress={() => handleDayPress(day)}
          activeOpacity={0.7}
          disabled={isAnimating}
        >
          <LinearGradient
            colors={
              day.isToday 
                ? ['#fef7e0', '#fef3c7']
                : isSelected
                ? ['#e8f0fe', '#d2e3fc']
                : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']
            }
            style={styles.dayCellGradient}
          >
            <View style={styles.dayContent}>
              <Text style={[
                styles.dayNumber,
                day.isToday && styles.todayText,
                !day.isCurrentMonth && styles.otherMonthText,
                isSelected && styles.selectedText,
              ]}>
                {day.day}
              </Text>
              
              {dayEvents.length > 0 && (
                <Animated.View 
                  style={[
                    styles.eventsContainer,
                    {
                      opacity: eventAnim,
                      transform: [{
                        translateY: eventAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      }],
                    },
                  ]}
                >
                  {dayEvents.slice(0, 2).map((event, eventIndex) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventContainer}
                      onPress={() => onEventPress?.(event)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[event.color, `${event.color}dd`]}
                        style={styles.eventGradient}
                      >
                        <Text style={styles.eventTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                  {dayEvents.length > 2 && (
                    <View style={styles.moreEventsIndicator}>
                      <LinearGradient
                        colors={['rgba(241,243,244,0.9)', 'rgba(241,243,244,0.7)']}
                        style={styles.moreEventsGradient}
                      >
                        <Text style={styles.moreEventsText}>+{dayEvents.length - 2}</Text>
                      </LinearGradient>
                    </View>
                  )}
                </Animated.View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCalendarGrid = () => {
    const days = getDaysInMonth(currentDate);
    
    return (
      <Animated.View 
        style={[
          styles.calendarGrid,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateX: slideAnim },
            ],
          },
        ]}
      >
        {days.map((day, index) => renderDayCell(day, index))}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
        style={styles.containerGradient}
      >
        {renderCalendarHeader()}
        {renderWeekDays()}
        {renderCalendarGrid()}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    margin: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  containerGradient: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  
  // Calendar Header
  calendarHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: brandColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  navButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayButton: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  todayButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Week Days Header
  weekDaysHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weekDaysGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellContainer: {
    width: width / 7 - 2,
    minHeight: 100,
  },
  dayCell: {
    flex: 1,
    margin: 1,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayCellGradient: {
    flex: 1,
    padding: 8,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  dayNumber: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  todayText: {
    color: '#1a73e8',
    fontWeight: '800',
  },
  selectedText: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  otherMonthText: {
    color: '#ccc',
    fontWeight: '400',
  },
  
  // Events
  eventsContainer: {
    gap: 4,
    marginTop: 4,
  },
  eventContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventGradient: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTitle: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  moreEventsIndicator: {
    borderRadius: 6,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  moreEventsGradient: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moreEventsText: {
    fontSize: 8,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default GoogleCalendar; 
