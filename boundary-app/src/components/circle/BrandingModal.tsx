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
  Dimensions,
} from 'react-native';
import IconIon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface BrandingData {
  primaryColor: string;
  secondaryColor: string;
  customName?: string;
}

interface BrandingModalProps {
  visible: boolean;
  branding: BrandingData;
  onClose: () => void;
  onUpdate: (brandingData: Partial<BrandingData>) => void;
}

const BrandingModal: React.FC<BrandingModalProps> = ({
  visible,
  branding,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<BrandingData>({
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    customName: branding.customName || '',
  });

  const predefinedColors = [
    { name: 'Red', primary: '#FF5A5A', secondary: '#FF8C8C' },
    { name: 'Blue', primary: '#0078d4', secondary: '#4CC2FF' },
    { name: 'Green', primary: '#4CAF50', secondary: '#81C784' },
    { name: 'Purple', primary: '#9C27B0', secondary: '#BA68C8' },
    { name: 'Orange', primary: '#FF9800', secondary: '#FFB74D' },
    { name: 'Pink', primary: '#E91E63', secondary: '#F48FB1' },
    { name: 'Teal', primary: '#009688', secondary: '#4DB6AC' },
    { name: 'Indigo', primary: '#3F51B5', secondary: '#7986CB' },
  ];

  const handleSave = () => {
    if (!formData.primaryColor || !formData.secondaryColor) {
      Alert.alert('Error', 'Please select both primary and secondary colors');
      return;
    }

    onUpdate(formData);
  };

  const handleCancel = () => {
    setFormData({
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      customName: branding.customName || '',
    });
    onClose();
  };

  const selectColorScheme = (primary: string, secondary: string) => {
    setFormData(prev => ({
      ...prev,
      primaryColor: primary,
      secondaryColor: secondary,
    }));
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
          <Text style={styles.headerTitle}>Circle Branding</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={[styles.previewCard, { backgroundColor: formData.primaryColor }]}>
              <Text style={styles.previewName}>{formData.customName || 'Circle Name'}</Text>
              <Text style={styles.previewSubtitle}>Your Circle</Text>
            </View>
          </View>

          {/* Custom Name */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Custom Circle Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.customName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, customName: text }))}
              placeholder="Enter custom circle name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Color Schemes */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Color Scheme</Text>
            <View style={styles.colorGrid}>
              {predefinedColors.map((colorScheme) => (
                <TouchableOpacity
                  key={colorScheme.name}
                  style={[
                    styles.colorScheme,
                    formData.primaryColor === colorScheme.primary && styles.colorSchemeActive,
                  ]}
                  onPress={() => selectColorScheme(colorScheme.primary, colorScheme.secondary)}
                >
                  <View style={styles.colorPreview}>
                    <View style={[styles.colorDot, { backgroundColor: colorScheme.primary }]} />
                    <View style={[styles.colorDot, { backgroundColor: colorScheme.secondary }]} />
                  </View>
                  <Text style={styles.colorSchemeName}>{colorScheme.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Colors */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Custom Colors</Text>
            <View style={styles.customColorSection}>
              <View style={styles.colorInputGroup}>
                <Text style={styles.colorInputLabel}>Primary Color</Text>
                <View style={styles.colorInputContainer}>
                  <View style={[styles.colorPreviewDot, { backgroundColor: formData.primaryColor }]} />
                  <TextInput
                    style={styles.colorInput}
                    value={formData.primaryColor}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, primaryColor: text }))}
                    placeholder="#FF5A5A"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={styles.colorInputGroup}>
                <Text style={styles.colorInputLabel}>Secondary Color</Text>
                <View style={styles.colorInputContainer}>
                  <View style={[styles.colorPreviewDot, { backgroundColor: formData.secondaryColor }]} />
                  <TextInput
                    style={styles.colorInput}
                    value={formData.secondaryColor}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, secondaryColor: text }))}
                    placeholder="#FF8C8C"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Branding Features */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Branding Features</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <IconIon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Custom circle name in app</Text>
              </View>
              <View style={styles.featureItem}>
                <IconIon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Personalized color scheme</Text>
              </View>
              <View style={styles.featureItem}>
                <IconIon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Custom circle avatar</Text>
              </View>
              <View style={styles.featureItem}>
                <IconIon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Branded notifications</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default BrandingModal;

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
  previewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  previewCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  previewName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 12,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorScheme: {
    width: (width - 64) / 3,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  colorSchemeActive: {
    borderColor: '#0078d4',
    backgroundColor: '#f0f8ff',
  },
  colorPreview: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorSchemeName: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  customColorSection: {
    gap: 16,
  },
  colorInputGroup: {
    gap: 8,
  },
  colorInputLabel: {
    fontSize: 14,
    color: '#666666',
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreviewDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  colorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
}); 
