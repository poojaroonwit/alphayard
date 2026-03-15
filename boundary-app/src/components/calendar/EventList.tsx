import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScalePressable } from '../common/ScalePressable';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { SimpleEvent, formatDayHeader, formatEventTime, startOfDay } from '../../utils/calendarUtils';

interface EventListProps {
    events: SimpleEvent[];
    selectedDate: Date;
    loading: boolean;
    onEventPress: (event: SimpleEvent) => void;
}

const H_PADDING = 20;

export const EventList: React.FC<EventListProps> = ({
    events,
    selectedDate,
    loading,
    onEventPress,
}) => {
    // Event colors for the dots
    const eventColors = ['#E57373', '#F48FB1', '#CE93D8', '#14B8A6', '#81C784'];

    const getUpcomingEvents = () => {
        // Show events starting from selected date
        const start = startOfDay(selectedDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 14); // Next 2 weeks

        return events
            .filter(e => {
                const eventDate = new Date(e.startDate);
                return eventDate >= start && eventDate <= end;
            })
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    };

    const groupEventsByDate = (eventsList: SimpleEvent[]) => {
        const groups: { [key: string]: { date: Date; events: SimpleEvent[] } } = {};

        eventsList.forEach(event => {
            const eventDate = new Date(event.startDate);
            const dateKey = startOfDay(eventDate).toISOString();

            if (!groups[dateKey]) {
                groups[dateKey] = { date: eventDate, events: [] };
            }
            groups[dateKey].events.push(event);
        });

        return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());
    };

    const upcomingEvents = getUpcomingEvents();

    return (
        <View style={styles.eventListSection}>
            {groupEventsByDate(upcomingEvents).map((group, groupIdx) => (
                <View key={groupIdx} style={styles.eventDayGroup}>
                    <Text style={styles.eventDayHeader}>{formatDayHeader(group.date)}</Text>
                    {group.events.map((event, eventIdx) => (
                        <ScalePressable
                            key={event.id}
                            style={styles.eventItem}
                            onPress={() => onEventPress(event)}
                        >
                            <View style={styles.eventTimeColumn}>
                                <Text style={styles.eventTime}>{formatEventTime(event.startDate)}</Text>
                                {event.endDate && (
                                    <Text style={styles.eventEndTime}>{formatEventTime(event.endDate)}</Text>
                                )}
                            </View>
                            <View style={[styles.eventDotIndicator, { backgroundColor: event.color || eventColors[eventIdx % eventColors.length] }]} />
                            <View style={styles.eventDetails}>
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                {event.description ? (
                                    <Text style={styles.eventDescription} numberOfLines={1}>{event.description}</Text>
                                ) : null}
                            </View>
                        </ScalePressable>
                    ))}
                </View>
            ))}

            {upcomingEvents.length === 0 && !loading && (
                <View style={styles.noEventsContainer}>
                    <IconMC name="calendar-blank-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.noEventsText}>No upcoming events</Text>
                    <Text style={styles.noEventsSubtext}>Tap + to add a new event</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    eventListSection: {
        paddingHorizontal: H_PADDING,
        marginTop: 24,
    },
    eventDayGroup: {
        marginBottom: 24,
    },
    eventDayHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    eventItem: {
        flexDirection: 'row',
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    eventTimeColumn: {
        width: 60,
        marginRight: 12,
        alignItems: 'flex-end',
    },
    eventTime: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    eventEndTime: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    eventDotIndicator: {
        width: 4,
        borderRadius: 2,
        marginRight: 12,
        backgroundColor: '#E57373',
    },
    eventDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    eventDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    noEventsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    noEventsText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    noEventsSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
});

export default EventList;
