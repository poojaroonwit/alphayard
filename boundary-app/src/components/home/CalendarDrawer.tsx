import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView, Pressable } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles } from '../../styles/homeStyles';

interface CalendarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const CalendarDrawer: React.FC<CalendarDrawerProps> = ({
  visible,
  onClose,
}) => {
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  const handleCreateAppointment = () => {
    console.log('Creating appointment:', {
      title: appointmentTitle,
      date: appointmentDate,
      time: appointmentTime,
      location: appointmentLocation,
      notes: appointmentNotes,
    });
    // Reset form
    setAppointmentTitle('');
    setAppointmentDate('');
    setAppointmentTime('');
    setAppointmentLocation('');
    setAppointmentNotes('');
    onClose();
  };

  const handleShareToOutlook = () => {
    console.log('Sharing to Outlook');
    // Implementation for Outlook sharing
  };

  const handleShareToGoogle = () => {
    console.log('Sharing to Google Calendar');
    // Implementation for Google Calendar sharing
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onPress={onClose} />
      <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <View style={homeStyles.calendarDrawerContainer}>
          <View style={homeStyles.calendarDrawerHeader}>
            <Text style={homeStyles.calendarDrawerTitle}>Add Appointment</Text>
            <TouchableOpacity onPress={onClose}>
              <IconMC name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={homeStyles.calendarDrawerContent}>
            <View style={homeStyles.calendarInputGroup}>
              <Text style={homeStyles.calendarInputLabel}>Title</Text>
              <TextInput
                style={homeStyles.calendarInput}
                value={appointmentTitle}
                onChangeText={setAppointmentTitle}
                placeholder="Enter appointment title"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={homeStyles.calendarInputGroup}>
              <Text style={homeStyles.calendarInputLabel}>Date</Text>
              <TextInput
                style={homeStyles.calendarInput}
                value={appointmentDate}
                onChangeText={setAppointmentDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={homeStyles.calendarInputGroup}>
              <Text style={homeStyles.calendarInputLabel}>Time</Text>
              <TextInput
                style={homeStyles.calendarInput}
                value={appointmentTime}
                onChangeText={setAppointmentTime}
                placeholder="HH:MM AM/PM"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={homeStyles.calendarInputGroup}>
              <Text style={homeStyles.calendarInputLabel}>Location</Text>
              <TextInput
                style={homeStyles.calendarInput}
                value={appointmentLocation}
                onChangeText={setAppointmentLocation}
                placeholder="Enter location"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={homeStyles.calendarInputGroup}>
              <Text style={homeStyles.calendarInputLabel}>Notes</Text>
              <TextInput
                style={[homeStyles.calendarInput, homeStyles.calendarTextArea]}
                value={appointmentNotes}
                onChangeText={setAppointmentNotes}
                placeholder="Add notes (optional)"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={homeStyles.calendarDrawerFooter}>
            <View style={homeStyles.calendarShareButtons}>
              <TouchableOpacity 
                style={homeStyles.calendarShareButton}
                onPress={handleShareToOutlook}
              >
                <IconMC name="microsoft-outlook" size={20} color="#0078D4" />
                <Text style={homeStyles.calendarShareButtonText}>Outlook</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={homeStyles.calendarShareButton}
                onPress={handleShareToGoogle}
              >
                <IconMC name="google" size={20} color="#4285F4" />
                <Text style={homeStyles.calendarShareButtonText}>Google</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={homeStyles.calendarCreateButton}
              onPress={handleCreateAppointment}
            >
              <Text style={homeStyles.calendarCreateButtonText}>Create Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
