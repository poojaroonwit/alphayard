import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface AppointmentsWidgetProps {
  appointments: Appointment[];
  onAppointmentPress?: (appointment: Appointment) => void;
}

export const AppointmentsWidget: React.FC<AppointmentsWidgetProps> = ({
  appointments,
  onAppointmentPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Appointments</Text>
      </View>
      
      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <IconMC name="calendar-blank" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No appointments today</Text>
        </View>
      ) : (
        <View style={styles.appointmentsList}>
          {appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentItem}>
              <Text style={styles.appointmentTitle}>{appointment.title}</Text>
              <Text style={styles.appointmentTime}>{appointment.time}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  appointmentsList: {
    gap: 12,
  },
  appointmentItem: {
    paddingVertical: 8,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
}); 
