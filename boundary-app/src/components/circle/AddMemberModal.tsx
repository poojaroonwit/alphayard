import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import IconIon from 'react-native-vector-icons/Ionicons';
import { circleApi } from '../../services/api';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMember?: (memberData: { name: string; email: string; role: string }) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  visible,
  onClose,
  onAddMember,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member',
    message: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.email?.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      const response = await circleApi.inviteMember(
        formData.email.trim(),
        formData.message.trim() || undefined
      );
      
      Alert.alert('Success', response.message || 'Invitation sent successfully', [
        {
          text: 'OK',
          onPress: () => {
            setFormData({ name: '', email: '', role: 'member', message: '' });
            onClose();
            // Call callback if provided
            if (onAddMember) {
              onAddMember({ name: formData.name, email: formData.email, role: formData.role });
            }
          }
        }
      ]);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.response?.data?.error || 'Failed to send invitation'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', email: '', role: 'member', message: '' });
    onClose();
  };

  const roles = [
    { key: 'admin', label: 'Admin', description: 'Full access to circle settings and management' },
    { key: 'member', label: 'Member', description: 'Can view and participate in circle activities' },
    { key: 'child', label: 'Child', description: 'Limited access, supervised by parents' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Circle Member</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#0078d4" />
            ) : (
              <Text style={styles.saveText}>Send Invite</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Member Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter full name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Member Email */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email Address *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
            />
          </View>

          {/* Optional Message */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Message (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.message}
              onChangeText={(text) => setFormData(prev => ({ ...prev, message: text }))}
              placeholder="Add a personal message to the invitation"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          {/* Member Role */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleOptions}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.key}
                  style={[
                    styles.roleOption,
                    formData.role === role.key && styles.roleOptionActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, role: role.key }))}
                >
                  <View style={styles.roleOptionContent}>
                    <Text style={[
                      styles.roleOptionLabel,
                      formData.role === role.key && styles.roleOptionLabelActive,
                    ]}>
                      {role.label}
                    </Text>
                    <Text style={[
                      styles.roleOptionDescription,
                      formData.role === role.key && styles.roleOptionDescriptionActive,
                    ]}>
                      {role.description}
                    </Text>
                  </View>
                  {formData.role === role.key && (
                    <IconIon name="checkmark-circle" size={20} color="#0078d4" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Invitation Method */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Invitation Method</Text>
            <View style={styles.invitationOptions}>
              <TouchableOpacity style={styles.invitationOption}>
                <IconIon name="mail" size={20} color="#0078d4" />
                <Text style={styles.invitationOptionText}>Send email invitation</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.invitationOption}>
                <IconIon name="link" size={20} color="#0078d4" />
                <Text style={styles.invitationOptionText}>Generate invite link</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Note */}
          <View style={styles.noteSection}>
            <IconIon name="information-circle" size={16} color="#666" />
            <Text style={styles.noteText}>
              The member will receive an invitation to join your circle. They can accept or decline the invitation.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default AddMemberModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#666666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    color: '#0078d4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  roleOptions: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  roleOptionActive: {
    borderColor: '#0078d4',
    backgroundColor: '#f0f8ff',
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  roleOptionLabelActive: {
    color: '#0078d4',
  },
  roleOptionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  roleOptionDescriptionActive: {
    color: '#0078d4',
  },
  invitationOptions: {
    gap: 12,
  },
  invitationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    gap: 12,
  },
  invitationOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
}); 
