import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONT_STYLES } from '../utils/fontUtils';
import { emotionService, EmotionRecord, CircleEmotionAverage } from '../services/emotionService';

interface EmotionHeatMapProps {
  type: 'personal' | 'Circle';
  data: EmotionRecord[] | CircleEmotionAverage[];
}

const EmotionHeatMap: React.FC<EmotionHeatMapProps> = ({
  type,
  data,
}) => {
  const { width: screenWidth } = useWindowDimensions();

  // Calculate dynamic dimensions based on screen width
  // Available width = screen width - container margins (32) - gradient padding (32)
  const availableWidth = screenWidth - 64;

  // We want to show weeks with larger dots that fit the screen
  // Calculate: (dotSize + gap) * numWeeks - gap = availableWidth
  const gap = 3;
  const dotSize = useMemo(() => {
    // Calculate ideal size to fit ~12 weeks (3 months) for larger dots
    const calculated = Math.floor((availableWidth + gap) / 12 - gap);
    // Minimum 12px, maximum 24px for maximum visibility
    return Math.max(12, Math.min(24, calculated));
  }, [availableWidth]);

  // Calculate number of weeks that fit based on dotSize
  const numWeeks = useMemo(() => {
    const weeksCanFit = Math.floor((availableWidth + gap) / (dotSize + gap));
    return Math.min(12, Math.max(1, weeksCanFit)); // Show up to 12 weeks (3 months)
  }, [availableWidth, dotSize]);

  // Generate days organized by day of week (for GitHub-style layout)
  const generateWeeksGrid = () => {
    const today = new Date();
    const totalDays = numWeeks * 7;

    // Create a 7 x numWeeks grid (rows = days of week, columns = weeks)
    const grid: (string | null)[][] = Array(7).fill(null).map(() => []);

    for (let w = 0; w < numWeeks; w++) {
      for (let d = 0; d < 7; d++) {
        const daysAgo = (numWeeks - 1 - w) * 7 + (6 - d);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);

        // Format as local date string
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        grid[d].push(`${year}-${month}-${day}`);
      }
    }

    return grid;
  };

  const getEmotionForDate = (date: string): number | null => {
    if (type === 'personal') {
      const record = (data as EmotionRecord[]).find(d => d.date === date);
      return record ? record.emotion : null;
    } else {
      const record = (data as CircleEmotionAverage[]).find(d => d.date === date);
      return record ? Math.round(record.average_emotion) : null;
    }
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const renderHeatMap = () => {
    const grid = generateWeeksGrid();
    const todayStr = (() => {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    })();

    // Generate month labels for the top row
    const monthLabels: { label: string; weekIndex: number }[] = [];
    if (grid[0]) {
      let lastMonth = -1;
      grid[0].forEach((dateStr, weekIndex) => {
        if (dateStr) {
          const month = parseInt(dateStr.split('-')[1]) - 1;
          if (month !== lastMonth) {
            monthLabels.push({ label: monthNames[month], weekIndex });
            lastMonth = month;
          }
        }
      });
    }

    return (
      <View>
        {/* Month labels row */}
        <View style={{ flexDirection: 'row', marginLeft: 16, marginBottom: 4 }}>
          {grid[0] && grid[0].map((_, weekIndex) => {
            const monthLabel = monthLabels.find(m => m.weekIndex === weekIndex);
            return (
              <View key={weekIndex} style={{ width: dotSize + gap, alignItems: 'flex-start' }}>
                {monthLabel && (
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{monthLabel.label}</Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row' }}>
          {/* Day labels column */}
          <View style={{ marginRight: 4, justifyContent: 'space-around' }}>
            {dayLabels.map((label, idx) => (
              <Text key={idx} style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', height: dotSize + gap, lineHeight: dotSize + gap }}>{label}</Text>
            ))}
          </View>

          {/* Heat map grid - 7 rows (days) x N columns (weeks) */}
          <View style={[styles.heatMap, { gap }]}>
            {grid.map((row, dayIndex) => (
              <View key={dayIndex} style={{ flexDirection: 'row', gap }}>
                {row.map((date: string | null, weekIndex) => {
                  if (!date) return null;
                  const emotion = getEmotionForDate(date);
                  const color = emotion ? emotionService.getEmotionColor(emotion) : '#E0E0E0';
                  const isToday = date === todayStr;

                  return (
                    <View
                      key={weekIndex}
                      style={[
                        {
                          width: dotSize,
                          height: dotSize,
                          borderRadius: Math.max(1, dotSize / 4),
                          backgroundColor: color,
                        },
                        isToday && {
                          borderWidth: 2,
                          borderColor: '#FFFFFF',
                        }
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const getStats = () => {
    if (type === 'personal') {
      const records = data as EmotionRecord[];
      const totalDays = records.length;
      const averageEmotion = totalDays > 0
        ? records.reduce((sum, record) => sum + record.emotion, 0) / totalDays
        : 0;

      return {
        totalDays,
        averageEmotion: Math.round(averageEmotion * 10) / 10,
        label: 'Your Average'
      };
    } else {
      const records = data as CircleEmotionAverage[];
      const totalDays = records.length;
      const averageEmotion = totalDays > 0
        ? records.reduce((sum, record) => sum + record.average_emotion, 0) / totalDays
        : 0;

      return {
        totalDays,
        averageEmotion: Math.round(averageEmotion * 10) / 10,
        label: 'Circle Average'
      };
    }
  };

  const stats = getStats();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.1)']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon
              name={type === 'personal' ? 'account-heart' : 'account-group'}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.title}>
              {type === 'personal' ? 'Your Wellbeing' : 'Circle Wellbeing'}
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.statsLabel}>{stats.label}</Text>
            <Text style={styles.statsValue}>
              {stats.averageEmotion > 0 ? stats.averageEmotion.toFixed(1) : '--'}
            </Text>
            <Text style={styles.statsDays}>{stats.totalDays} days tracked</Text>
          </View>
        </View>

        <View style={styles.heatMapContainer}>
          <View style={styles.legend}>
            <Text style={styles.legendLabel}>Less</Text>
            <View style={styles.legendColors}>
              <View style={[styles.legendColor, { backgroundColor: '#FF4444' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#FF8800' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#FFBB00' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#88CC00' }]} />
              <View style={[styles.legendColor, { backgroundColor: '#00AA00' }]} />
            </View>
            <Text style={styles.legendLabel}>More</Text>
          </View>

          {renderHeatMap()}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {type === 'personal'
              ? `Showing last ${numWeeks} weeks · Track daily for patterns`
              : 'See how your Circle is feeling together'
            }
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONT_STYLES.englishBody,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  statsDays: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: FONT_STYLES.englishBody,
  },
  heatMapContainer: {
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONT_STYLES.englishBody,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatMap: {
    flexDirection: 'column',
  },
  week: {
    flexDirection: 'column',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: FONT_STYLES.englishBody,
    textAlign: 'center',
  },
});

export default EmotionHeatMap;


