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
  Image,
} from 'react-native';
import IconIon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../theme/colors';

interface CircleData {
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  privacy: 'public' | 'private' | 'invite-only';
  locationSharing: boolean;
  eventNotifications: boolean;
  safetyAlerts: boolean;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    customName?: string;
  };
}

interface EditCircleModalProps {
  visible: boolean;
  circle: CircleData | null;
  onClose: () => void;
  onUpdate: (data: Partial<CircleData>) => void;
}

const EditCircleModal: React.FC<EditCircleModalProps> = ({
  visible,
  circle,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<Partial<CircleData>>({
    name: circle?.name || '',
    description: circle?.description || '',
    privacy: circle?.privacy || 'private',
  });

  const handleSave = () => {
    if (!formData.name?.trim()) {
      Alert.alert('Error', 'Circle name is required');
      return;
    }

    onUpdate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: circle?.name || '',
      description: circle?.description || '',
      privacy: circle?.privacy || 'private',
    });
    onClose();
  };

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
          <Text style={styles.headerTitle}>Edit Circle</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Circle Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: circle?.avatar }} 
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.avatarEditButton}>
                <IconIon name="camera" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Circle Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Circle Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter circle name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Circle Description */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe your circle"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Privacy Settings */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Privacy</Text>
            <View style={styles.privacyOptions}>
              {[
                { key: 'private', label: 'Private', description: 'Only circle members can see' },
                { key: 'invite-only', label: 'Invite Only', description: 'Invited members can join' },
                { key: 'public', label: 'Public', description: 'Anyone can find and join' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.privacyOption,
                    formData.privacy === option.key && styles.privacyOptionActive,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, privacy: option.key as any }))}
                >
                  <View style={styles.privacyOptionContent}>
                    <Text style={[
                      styles.privacyOptionLabel,
                      formData.privacy === option.key && styles.privacyOptionLabelActive,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.privacyOptionDescription,
                      formData.privacy === option.key && styles.privacyOptionDescriptionActive,
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                  {formData.privacy === option.key && (
                    <IconIon name="checkmark-circle" size={20} color="#0078d4" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cover Image */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Cover Image</Text>
            <TouchableOpacity style={styles.coverImageButton}>
              <IconIon name="image" size={24} color="#666" />
              <Text style={styles.coverImageText}>Choose cover image</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default EditCircleModal;

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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0078d4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
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
    height: 80,
    textAlignVertical: 'top',
  },
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  privacyOptionActive: {
    borderColor: '#0078d4',
    backgroundColor: '#f0f8ff',
  },
  privacyOptionContent: {
    flex: 1,
  },
  privacyOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  privacyOptionLabelActive: {
    color: '#0078d4',
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  privacyOptionDescriptionActive: {
    color: '#0078d4',
  },
  coverImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    gap: 12,
  },
  coverImageText: {
    fontSize: 16,
    color: '#666666',
  },
}); 
