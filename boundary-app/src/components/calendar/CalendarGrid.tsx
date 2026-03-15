import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScalePressable } from '../common/ScalePressable';
import { isSameMonth, isSameDay } from '../../utils/calendarUtils';

interface CalendarGridProps {
  currentMonthDate: Date;
  selectedDate: Date;
  events: any[];
  onDateSelect: (date: Date) => void;
  monthDays: Date[];
}

const H_PADDING = 20;

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonthDate,
  selectedDate,
  events,
  onDateSelect,
  monthDays,
}) => {
  const hasEvents = (date: Date) => {
    return events.some(e => isSameDay(new Date(e.startDate), date));
  };

  return (
    <View style={styles.calendarGrid}>
      {Array.from({ length: Math.ceil(monthDays.length / 7) }).map((_, weekIdx) => {
        const days = monthDays.slice(weekIdx * 7, weekIdx * 7 + 7);
        return (
          <View key={weekIdx} style={styles.weekRow}>
            {days.map((day, dayIdx) => {
              const inMonth = isSameMonth(day, currentMonthDate);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate) && !isToday;
              const dayHasEvents = hasEvents(day);

              return (
                <ScalePressable
                  key={dayIdx}
                  style={styles.dayCell}
                  onPress={() => onDateSelect(day)}
                  scaleTo={0.9}
                >
                  <View style={[
                    styles.dayNumberContainer,
                    isToday && styles.todayCircle,
                    isSelected && styles.selectedCircle,
                  ]}>
                    <Text style={[
                      styles.dayNumber,
                      !inMonth && styles.dayNumberInactive,
                      isToday && styles.dayNumberToday,
                    ]}>
                      {day.getDate()}
                    </Text>
                  </View>
                  {dayHasEvents && !isToday && (
                    <View style={styles.eventDot} />
                  )}
                </ScalePressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarGrid: {
    paddingHorizontal: H_PADDING,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
  },
  dayNumberInactive: {
    color: '#D1D5DB',
  },
  dayNumberToday: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  todayCircle: {
    backgroundColor: '#F9A8D4', // Pink for today
  },
  selectedCircle: {
    borderWidth: 2,
    borderColor: '#14B8A6', // Teal for selected
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
});

export default CalendarGrid;
