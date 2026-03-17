import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONT_STYLES } from '../utils/fontUtils';

const { width, height } = Dimensions.get('window');

interface TemperatureCheckModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (emotion: number) => void;
}

const TemperatureCheckModal: React.FC<TemperatureCheckModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emotions = [
    { id: 1, label: 'Very Bad', icon: 'emoticon-sad', color: '#FF4444' },
    { id: 2, label: 'Bad', icon: 'emoticon-frown', color: '#FF8800' },
    { id: 3, label: 'Okay', icon: 'emoticon-neutral', color: '#FFBB00' },
    { id: 4, label: 'Good', icon: 'emoticon-happy', color: '#88CC00' },
    { id: 5, label: 'Great', icon: 'emoticon-excited', color: '#00AA00' },
  ];

  const handleSubmit = async () => {
    if (selectedEmotion === null) {
      Alert.alert('Required Field', 'Please select how you are feeling today');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(selectedEmotion);
      onClose();
    } catch (error) {
      console.error('Emotion check error:', error);
      Alert.alert('Error', 'Failed to submit emotion check. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Daily Check',
      'Are you sure you want to skip the daily emotion check? This helps track your wellbeing.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onClose }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.iconContainer}>
                    <Icon name="heart-pulse" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.title}>How are you feeling today?</Text>
                  <Text style={styles.subtitle}>Help us track your daily wellbeing</Text>
                </View>

                {/* Emotion Selection */}
                <View style={styles.emotionContainer}>
                  <View style={styles.emotionGrid}>
                    {emotions.map((emotion) => (
                      <TouchableOpacity
                        key={emotion.id}
                        style={[
                          styles.emotionButton,
                          selectedEmotion === emotion.id && styles.emotionButtonSelected
                        ]}
                        onPress={() => setSelectedEmotion(emotion.id)}
                      >
                        <View style={[
                          styles.emotionIconContainer,
                          selectedEmotion === emotion.id && { backgroundColor: emotion.color }
                        ]}>
                          <Icon
                            name={emotion.icon}
                            size={40}
                            color={selectedEmotion === emotion.id ? '#FFFFFF' : emotion.color}
                          />
                        </View>
                        <Text style={[
                          styles.emotionLabel,
                          selectedEmotion === emotion.id && styles.emotionLabelSelected
                        ]}>
                          {emotion.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipButtonText}>Skip for Today</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.submitButtonText}>
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Text>
                    <Icon name="check" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#bf4342',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#bf4342',
    marginBottom: 8,
    fontFamily: FONT_STYLES.englishHeading,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: FONT_STYLES.englishBody,
    textAlign: 'center',
  },
  emotionContainer: {
    marginBottom: 32,
  },
  emotionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  emotionButton: {
    alignItems: 'center',
    flex: 1,
    minWidth: '18%',
  },
  emotionButtonSelected: {
    transform: [{ scale: 1.1 }],
  },
  emotionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emotionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    fontFamily: FONT_STYLES.englishMedium,
    textAlign: 'center',
  },
  emotionLabelSelected: {
    color: '#bf4342',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#bf4342',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#bf4342',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_STYLES.englishMedium,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#bf4342',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(191, 67, 66, 0.6)',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
});

export default TemperatureCheckModal;
