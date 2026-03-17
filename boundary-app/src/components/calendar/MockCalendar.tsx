import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DateData {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

interface CalendarProps {
  onDayPress?: (day: DateData) => void;
  markedDates?: any;
  theme?: any;
  style?: any;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  onDayPress, 
  markedDates, 
  theme, 
  style 
}) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const renderDay = (day: number, isCurrentMonth: boolean = true) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = day === currentDate.getDate() && isCurrentMonth;
    
    return (
      <TouchableOpacity
        key={day}
        style={[
          styles.day,
          isToday && styles.today,
          !isCurrentMonth && styles.otherMonth
        ]}
        onPress={() => {
          if (onDayPress && isCurrentMonth) {
            onDayPress({
              dateString,
              day,
              month: currentMonth + 1,
              year: currentYear,
              timestamp: new Date(currentYear, currentMonth, day).getTime()
            });
          }
        }}
      >
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
          !isCurrentMonth && styles.otherMonthText
        ]}>
          {day}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCalendarGrid = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.day} />);
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(renderDay(day));
    }
    
    return days;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.monthText}>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
      </View>
      
      <View style={styles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>
      
      <View style={styles.calendarGrid}>
        {renderCalendarGrid()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  today: {
    backgroundColor: '#FF5A5A',
    borderRadius: 20,
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  otherMonth: {
    opacity: 0.3,
  },
  otherMonthText: {
    color: '#ccc',
  },
});

export default Calendar; 
