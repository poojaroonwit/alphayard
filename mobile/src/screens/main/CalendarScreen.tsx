import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Switch,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { ScalePressable } from '../../components/common/ScalePressable';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarMonthSkeleton, EventListSkeleton } from '../../components/common/SkeletonLoader';
import { calendarService } from '../../services/calendar/CalendarService';
import { brandColors } from '../../theme/colors';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigationAnimation } from '../../contexts/NavigationAnimationContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import MainScreenLayout from '../../components/layout/MainScreenLayout';
import { CalendarGrid } from '../../components/calendar/CalendarGrid';
import { EventList } from '../../components/calendar/EventList';
import {
  SimpleEvent,
  addMonths,
  getMonthDays,
} from '../../utils/calendarUtils';

const H_PADDING = 20;

type CalendarScreenNavigationProp = StackNavigationProp<AppStackParamList>;

interface CalendarScreenProps { embedded?: boolean }
const CalendarScreen: React.FC<CalendarScreenProps> = ({ embedded }) => {
  console.log('[UI] CalendarScreen (main) using MainScreenLayout');
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  const navigation = useNavigation<CalendarScreenNavigationProp>();

  const [events, setEvents] = useState<SimpleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;

  const { cardMarginTopAnim, animateToHome } = useNavigationAnimation();

  // Family selection (match Gallery/Home header outside the card)
  const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
  const [selectedFamily, _setSelectedFamily] = useState('Smith Family');

  // Calendar state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Drawer states
  const [showCreateEventDrawer, setShowCreateEventDrawer] = useState(false);
  const [showEventDetailDrawer, setShowEventDetailDrawer] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SimpleEvent | null>(null);

  // Form state for create/edit
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    location: '',
    color: brandColors.primary,
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const monthDays = useMemo(() => getMonthDays(currentMonthDate), [currentMonthDate]);

  useEffect(() => {
    Animated.timing(cardOpacityAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Hard-stop guard: ensure loading clears after 8s regardless of request state
  useEffect(() => {
    const hardStop = setTimeout(() => {
      setLoading(false);
    }, 8000);
    return () => clearTimeout(hardStop);
  }, []);

  // Safety: ensure loading never hangs more than 6 seconds (network issues)
  useEffect(() => {
    if (!loading) return;
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 6000);
    return () => clearTimeout(safetyTimer);
  }, [loading]);

  useFocusEffect(
    React.useCallback(() => {
      animateToHome();
    }, [animateToHome])
  );

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const apiEvents = await calendarService.getEvents();
      // Map API events to local SimpleEvent format
      const mappedEvents: SimpleEvent[] = apiEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay,
        location: event.location || '',
        color: event.color,
      }));
      setEvents(mappedEvents);
    } catch (apiError) {
      console.error('Failed to load events', apiError);
    } finally {
      setLoading(false);
    }
  };



  const handleDateClick = (date: Date) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDate(date);
    // Just set the selected date - the EventList below will show events for this date
    // The add button in the header can still be used to create new events
  };

  const handleEventClick = (event: SimpleEvent) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay || false,
      location: event.location || '',
      color: event.color || brandColors.primary,
    });
    setShowEventDetailDrawer(true);
  };



  const saveEvent = async () => {
    try {
      if (selectedEvent) {
        // Edit existing
        await calendarService.updateEvent({
          id: selectedEvent.id,
          title: eventForm.title,
          description: eventForm.description,
          startDate: eventForm.startDate,
          endDate: eventForm.endDate,
          allDay: eventForm.allDay,
          location: eventForm.location,
          color: eventForm.color,
        });
        setShowEventDetailDrawer(false);
      } else {
        // Create new
        await calendarService.createEvent({
          title: eventForm.title,
          description: eventForm.description,
          startDate: eventForm.startDate,
          endDate: eventForm.endDate,
          allDay: eventForm.allDay,
          location: eventForm.location,
          color: eventForm.color,
          type: 'personal',
        });
        setShowCreateEventDrawer(false);
      }
      setSelectedEvent(null);
      await loadEvents();
    } catch (e) {
      console.error('Failed to save event', e);
    }
  };

  const deleteEvent = async () => {
    try {
      if (selectedEvent) {
        await calendarService.deleteEvent(selectedEvent.id);
        setShowEventDetailDrawer(false);
        setSelectedEvent(null);
        await loadEvents();
      }
    } catch (e) {
      console.error('Failed to delete event', e);
    }
  };



  const inner = (
    <>
      {loading ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <CalendarMonthSkeleton />
          <View style={{ paddingHorizontal: H_PADDING }}>
            <EventListSkeleton />
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Calendar Header */}
          <View style={styles.calendarHeader}>
            <View style={styles.monthNavigation}>
              <Text style={styles.monthTitle}>
                {currentMonthDate.toLocaleDateString('en-US', { month: 'long' })}
              </Text>
              <ScalePressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setCurrentMonthDate(addMonths(currentMonthDate, -1));
                }}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>{'<'}</Text>
              </ScalePressable>
              <ScalePressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setCurrentMonthDate(addMonths(currentMonthDate, 1));
                }}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>{'>'}</Text>
              </ScalePressable>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconButton}>
                <IconMC name="cog-outline" size={22} color="#6B7280" />
              </TouchableOpacity>
              <ScalePressable
                style={styles.addButton}
                onPress={() => {
                  setEventForm({
                    title: '',
                    description: '',
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    allDay: false,
                    location: '',
                    color: brandColors.primary,
                  });
                  setSelectedEvent(null);
                  setShowCreateEventDrawer(true);
                }}
              >
                <IconMC name="plus" size={20} color="#6B7280" />
              </ScalePressable>
            </View>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayHeader}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <View key={i} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <CalendarGrid
            currentMonthDate={currentMonthDate}
            selectedDate={selectedDate}
            events={events}
            onDateSelect={handleDateClick}
            monthDays={monthDays}
          />

          {/* Event List Section */}
          <EventList
            events={events}
            selectedDate={selectedDate}
            loading={loading}
            onEventPress={handleEventClick}
          />
        </ScrollView>
      )}

      {/* Create/Edit Event Drawer */}
      <Modal visible={showCreateEventDrawer || showEventDetailDrawer} transparent animationType="slide" onRequestClose={() => {
        setShowCreateEventDrawer(false);
        setShowEventDetailDrawer(false);
        setSelectedEvent(null);
      }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                {selectedEvent ? 'Edit Event' : 'Create Event'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowCreateEventDrawer(false);
                setShowEventDetailDrawer(false);
                setSelectedEvent(null);
              }} style={{ padding: 8 }}>
                <IconMC name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Title */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Title</Text>
              <TextInput
                value={eventForm.title}
                onChangeText={text => setEventForm(prev => ({ ...prev, title: text }))}
                placeholder="Event Title"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827', marginBottom: 16 }}
              />

              {/* Description */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Description</Text>
              <TextInput
                value={eventForm.description}
                onChangeText={text => setEventForm(prev => ({ ...prev, description: text }))}
                placeholder="Details about the event"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827', marginBottom: 16, textAlignVertical: 'top', minHeight: 80 }}
              />

              {/* Dates */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Start</Text>
                  {Platform.OS === 'web' ? (
                    <TextInput
                      value={eventForm.startDate.split('T')[0] + ' ' + (eventForm.startDate.split('T')[1] || '').substring(0, 5)}
                      onChangeText={(text) => {
                        setEventForm(prev => ({ ...prev, startDate: text }));
                      }}
                      placeholder="YYYY-MM-DD HH:mm"
                      style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12 }}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowStartDatePicker(true)}
                      style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12 }}
                    >
                      <Text style={{ color: '#111827' }}>
                        {new Date(eventForm.startDate || Date.now()).toLocaleDateString()} {new Date(eventForm.startDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>End</Text>
                  {Platform.OS === 'web' ? (
                    <TextInput
                      value={eventForm.endDate.split('T')[0] + ' ' + (eventForm.endDate.split('T')[1] || '').substring(0, 5)}
                      onChangeText={(text) => setEventForm(prev => ({ ...prev, endDate: text }))}
                      placeholder="YYYY-MM-DD HH:mm"
                      style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12 }}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowEndDatePicker(true)}
                      style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12 }}
                    >
                      <Text style={{ color: '#111827' }}>
                        {new Date(eventForm.endDate || Date.now()).toLocaleDateString()} {new Date(eventForm.endDate || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Date Pickers (Native only) */}
              {Platform.OS !== 'web' && showStartDatePicker && (
                <DateTimePicker
                  value={new Date(eventForm.startDate || Date.now())}
                  mode="datetime"
                  display="default"
                  onChange={(_event, date) => {
                    setShowStartDatePicker(false);
                    if (date) setEventForm(prev => ({ ...prev, startDate: date.toISOString() }));
                  }}
                />
              )}
              {Platform.OS !== 'web' && showEndDatePicker && (
                <DateTimePicker
                  value={new Date(eventForm.endDate || Date.now())}
                  mode="datetime"
                  display="default"
                  onChange={(_event, date) => {
                    setShowEndDatePicker(false);
                    if (date) setEventForm(prev => ({ ...prev, endDate: date.toISOString() }));
                  }}
                />
              )}

              {/* All Day */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>All Day Event</Text>
                <Switch
                  value={eventForm.allDay}
                  onValueChange={val => setEventForm(prev => ({ ...prev, allDay: val }))}
                  trackColor={{ false: '#D1D5DB', true: '#FFB6C1' }}
                  thumbColor={eventForm.allDay ? '#DB2777' : '#f4f3f4'}
                />
              </View>

              {/* Location */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Location</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginBottom: 16 }}>
                <View style={{ paddingLeft: 12 }}>
                  <IconMC name="map-marker" size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  value={eventForm.location}
                  onChangeText={text => setEventForm(prev => ({ ...prev, location: text }))}
                  placeholder="Add location"
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, padding: 12, fontSize: 16, color: '#111827' }}
                />
              </View>

              {/* Color */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Color</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                {['#FFB6C1', '#93C5FD', '#A7F3D0', '#FDE047', '#C4B5FD'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setEventForm(prev => ({ ...prev, color: c }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: c,
                      borderWidth: eventForm.color === c ? 2 : 0,
                      borderColor: '#374151',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {eventForm.color === c && <IconMC name="check" size={16} color="#374151" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {selectedEvent && (
                  <TouchableOpacity
                    onPress={deleteEvent}
                    style={{ flex: 1, backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' }}
                  >
                    <Text style={{ fontWeight: '700', color: '#DC2626' }}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={saveEvent}
                  style={{ flex: 2, backgroundColor: '#FFB6C1', padding: 16, borderRadius: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', color: '#1F2937' }}>{selectedEvent ? 'Save Changes' : 'Create Event'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );

  if (embedded) return inner;

  return (
    <MainScreenLayout
      cardMarginTopAnim={cardMarginTopAnim}
      cardOpacityAnim={cardOpacityAnim}
    >
      {inner}
    </MainScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Calendar Header
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: H_PADDING,
    paddingTop: 24,
    paddingBottom: 16,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Weekday Header
  weekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: H_PADDING,
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },


});

export default CalendarScreen;
