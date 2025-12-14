import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { FONT_STYLES } from '../../../utils/fontUtils';
import { useAuth } from '../../../contexts/AuthContext';

interface Step6SurveyScreenProps {
  navigation: any;
  route: any;
}

const Step6SurveyScreen: React.FC<Step6SurveyScreenProps> = ({ navigation, route }) => {
  const { signup } = useAuth();
  const [interests, setInterests] = useState<string[]>([]);
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [expectations, setExpectations] = useState<string[]>([]);
  const [howDidYouHear, setHowDidYouHear] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const interestOptions = [
    { id: 'family_activities', label: 'hourse Activities', icon: 'account-group' },
    { id: 'health_wellness', label: 'Health & Wellness', icon: 'heart-pulse' },
    { id: 'safety_security', label: 'Safety & Security', icon: 'shield-check' },
    { id: 'financial_planning', label: 'Financial Planning', icon: 'chart-line' },
    { id: 'education', label: 'Education', icon: 'school' },
    { id: 'travel', label: 'Travel', icon: 'airplane' },
    { id: 'technology', label: 'Technology', icon: 'laptop' },
    { id: 'cooking', label: 'Cooking', icon: 'chef-hat' },
    { id: 'sports', label: 'Sports', icon: 'soccer' },
    { id: 'entertainment', label: 'Entertainment', icon: 'movie' },
  ];

  const personalityOptions = [
    { id: 'outgoing', label: 'Outgoing & Social', icon: 'account-group' },
    { id: 'analytical', label: 'Analytical & Detail-oriented', icon: 'chart-line' },
    { id: 'creative', label: 'Creative & Artistic', icon: 'palette' },
    { id: 'organized', label: 'Organized & Structured', icon: 'calendar-check' },
    { id: 'adventurous', label: 'Adventurous & Spontaneous', icon: 'compass' },
    { id: 'caring', label: 'Caring & Empathetic', icon: 'heart' },
    { id: 'practical', label: 'Practical & Down-to-earth', icon: 'tools' },
    { id: 'ambitious', label: 'Ambitious & Goal-oriented', icon: 'target' },
  ];

  const expectationOptions = [
    { id: 'family_connection', label: 'Better hourse Connection', icon: 'heart-pulse' },
    { id: 'safety_peace', label: 'Safety & Peace of Mind', icon: 'shield-check' },
    { id: 'organization', label: 'Better Organization', icon: 'calendar-check' },
    { id: 'communication', label: 'Improved Communication', icon: 'message-text' },
    { id: 'coordination', label: 'hourse Coordination', icon: 'account-group' },
    { id: 'emergency_support', label: 'Emergency Support', icon: 'phone-alert' },
    { id: 'memory_sharing', label: 'Memory & Photo Sharing', icon: 'camera' },
    { id: 'schedule_management', label: 'Schedule Management', icon: 'clock' },
  ];

  const howDidYouHearOptions = [
    { id: 'social_media', label: 'Social Media', icon: 'share-variant' },
    { id: 'friend_family', label: 'Friend or hourse', icon: 'account-heart' },
    { id: 'app_store', label: 'App Store Search', icon: 'store' },
    { id: 'google_search', label: 'Google Search', icon: 'google' },
    { id: 'advertisement', label: 'Advertisement', icon: 'bullhorn' },
    { id: 'blog_article', label: 'Blog or Article', icon: 'newspaper' },
    { id: 'podcast', label: 'Podcast', icon: 'podcast' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal' },
  ];


  const toggleInterest = (interestId: string) => {
    setInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    );
  };

  const togglePersonalityTrait = (traitId: string) => {
    setPersonalityTraits(prev =>
      prev.includes(traitId)
        ? prev.filter(t => t !== traitId)
        : [...prev, traitId]
    );
  };

  const toggleExpectation = (expectationId: string) => {
    setExpectations(prev =>
      prev.includes(expectationId)
        ? prev.filter(e => e !== expectationId)
        : [...prev, expectationId]
    );
  };

  const selectHowDidYouHear = (sourceId: string) => {
    setHowDidYouHear(sourceId);
  };


  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      // Prepare signup data
      const signupData = {
        email: route.params.email,
        password: route.params.password,
        firstName: route.params.firstName || '',
        lastName: route.params.lastName || '',
        phone: route.params.phoneNumber || '',
        dateOfBirth: route.params.dateOfBirth || '',
        userType: route.params.userType || 'hourse',
        familyOption: route.params.familyOption,
        familyCode: route.params.familyCode || '',
        familyName: route.params.familyName || '',
        familyType: route.params.familyType || '',
        inviteEmails: route.params.inviteEmails || [],
        interests,
        personalityTraits,
        expectations,
        howDidYouHear,
      };

      await signup(signupData);

      // Navigate to welcome screen
      navigation.navigate('Welcome');
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = String(error?.message || 'Failed to create account. Please try again.');
      setApiError(errorMessage);

      // If account already exists, suggest logging in
      if (errorMessage.toLowerCase().includes('already exists') ||
        errorMessage.toLowerCase().includes('account with this email')) {
        // Keep error message but don't show alert
      } else {
        // For other errors, still show alert as fallback
        Alert.alert(
          'Signup Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      setIsSubmitting(true);

      // Prepare signup data with default values
      const signupData = {
        email: route.params.email,
        password: route.params.password,
        firstName: route.params.firstName || '',
        lastName: route.params.lastName || '',
        phone: route.params.phoneNumber || '',
        dateOfBirth: route.params.dateOfBirth || '',
        userType: route.params.userType || 'hourse',
        familyOption: route.params.familyOption,
        familyCode: route.params.familyCode || '',
        familyName: route.params.familyName || '',
        familyType: route.params.familyType || '',
        inviteEmails: route.params.inviteEmails || [],
        interests: [],
        personalityTraits: [],
        expectations: [],
        howDidYouHear: '',
      };

      // Check if signup function exists
      if (!signup) {
        throw new Error('Authentication service not available. Please refresh the page and try again.');
      }

      await signup(signupData);

      // Navigate to welcome screen
      navigation.navigate('Welcome');
    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = String(error?.message || 'Failed to create account. Please try again.');
      setApiError(errorMessage);

      // If account already exists, suggest logging in
      if (errorMessage.toLowerCase().includes('already exists') ||
        errorMessage.toLowerCase().includes('account with this email')) {
        // Keep error message but don't show alert
      } else {
        // For other errors, still show alert as fallback
        Alert.alert(
          'Signup Failed',
          errorMessage,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FA7272', '#FFBBB4']}
        style={styles.gradient}
      >
        <View style={styles.mainContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            <View style={styles.scrollContent}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Icon name="arrow-left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepText}>Step 6 of 6</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '100%' }]} />
                  </View>
                </View>
              </View>

              {/* Title */}
              <View style={styles.titleContainer}>
                <View style={styles.titleIconContainer}>
                  <Icon name="chart-line" size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>Almost Done!</Text>
                <Text style={styles.subtitle}>Help us personalize your experience with a quick survey</Text>
              </View>


              {/* API Error Banner */}
              {apiError && (
                <View style={styles.apiErrorBanner}>
                  <Icon name="alert-circle" size={20} color="#FFFFFF" style={styles.apiErrorIcon} />
                  <View style={styles.apiErrorContent}>
                    <Text style={styles.apiErrorText}>{typeof apiError === 'string' ? apiError : String(apiError)}</Text>
                    {(typeof apiError === 'string' &&
                      (apiError.toLowerCase().includes('already exists') ||
                        apiError.toLowerCase().includes('account with this email'))) && (
                        <TouchableOpacity
                          style={styles.loginLinkButton}
                          onPress={() => navigation.navigate('Login')}
                        >
                          <Text style={styles.loginLinkText}>Go to Login →</Text>
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
              )}

              {/* Survey Form */}
              <View style={styles.form}>
                {/* Interests Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>What are you interested in?</Text>
                  <Text style={styles.sectionDescription}>Select topics that interest you (optional)</Text>

                  <View style={styles.interestsGrid}>
                    {interestOptions.map((interest) => (
                      <TouchableOpacity
                        key={interest.id}
                        style={[
                          styles.interestChip,
                          interests.includes(interest.id) && styles.interestChipSelected
                        ]}
                        onPress={() => toggleInterest(interest.id)}
                      >
                        <Icon
                          name={interest.icon}
                          size={16}
                          color={interests.includes(interest.id) ? '#bf4342' : 'rgba(255, 255, 255, 0.8)'}
                        />
                        <Text style={[
                          styles.interestChipText,
                          interests.includes(interest.id) && styles.interestChipTextSelected
                        ]}>
                          {interest.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Personality Traits Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>What describes you best?</Text>
                  <Text style={styles.sectionDescription}>Select personality traits that resonate with you (optional)</Text>

                  <View style={styles.personalityGrid}>
                    {personalityOptions.map((trait) => (
                      <TouchableOpacity
                        key={trait.id}
                        style={[
                          styles.personalityChip,
                          personalityTraits.includes(trait.id) && styles.personalityChipSelected
                        ]}
                        onPress={() => togglePersonalityTrait(trait.id)}
                      >
                        <Icon
                          name={trait.icon}
                          size={20}
                          color={personalityTraits.includes(trait.id) ? '#bf4342' : '#FFFFFF'}
                        />
                        <Text style={[
                          styles.personalityChipText,
                          personalityTraits.includes(trait.id) && styles.personalityChipTextSelected
                        ]}>
                          {trait.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Expectations Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>What do you expect from this app?</Text>
                  <Text style={styles.sectionDescription}>Select what you hope to achieve (optional)</Text>

                  <View style={styles.expectationGrid}>
                    {expectationOptions.map((expectation) => (
                      <TouchableOpacity
                        key={expectation.id}
                        style={[
                          styles.expectationChip,
                          expectations.includes(expectation.id) && styles.expectationChipSelected
                        ]}
                        onPress={() => toggleExpectation(expectation.id)}
                      >
                        <Icon
                          name={expectation.icon}
                          size={20}
                          color={expectations.includes(expectation.id) ? '#bf4342' : '#FFFFFF'}
                        />
                        <Text style={[
                          styles.expectationChipText,
                          expectations.includes(expectation.id) && styles.expectationChipTextSelected
                        ]}>
                          {expectation.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* How Did You Hear Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>How did you hear about us?</Text>
                  <Text style={styles.sectionDescription}>Help us understand how you discovered our app (optional)</Text>

                  <View style={styles.howDidYouHearContainer}>
                    {howDidYouHearOptions.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.howDidYouHearOption,
                          howDidYouHear === option.id && styles.howDidYouHearOptionSelected
                        ]}
                        onPress={() => selectHowDidYouHear(option.id)}
                      >
                        <Icon
                          name={option.icon}
                          size={20}
                          color={howDidYouHear === option.id ? '#bf4342' : '#FFFFFF'}
                        />
                        <Text style={[
                          styles.howDidYouHearText,
                          howDidYouHear === option.id && styles.howDidYouHearTextSelected
                        ]}>
                          {option.label}
                        </Text>
                        <View style={[
                          styles.radioButton,
                          howDidYouHear === option.id && styles.radioButtonSelected
                        ]}>
                          {howDidYouHear === option.id && (
                            <Icon name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Action Buttons - Inside scroll for web compatibility */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.completeButton, isSubmitting && styles.completeButtonDisabled]}
                  onPress={handleComplete}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <Text style={styles.completeButtonText}>Creating Account...</Text>
                  ) : (
                    <>
                      <Text style={styles.completeButtonText}>Submit & Continue</Text>
                      <Icon name="arrow-right" size={20} color="#bf4342" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                  testID="skip-survey-button"
                  accessibilityRole="button"
                  accessibilityLabel="Skip survey"
                >
                  <Text style={styles.skipButtonText}>Skip for Now</Text>
                </TouchableOpacity>
              </View>

              {/* Close scrollContent View */}
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflow: 'hidden' as any } : {}),
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflow: 'auto' as any, height: '100%' } : {}),
  },
  scrollContentContainer: {
    flexGrow: 1,
    ...(Platform.OS === 'web' ? { minHeight: '100%' } : {}),
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  actionButtons: {
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: 'transparent',
    zIndex: 10,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  stepIndicator: {
    flex: 1,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  titleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: FONT_STYLES.englishHeading,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: FONT_STYLES.englishBody,
    textAlign: 'left',
  },
  quickSkipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  quickSkipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
    textAlign: 'center',
  },
  form: {
    // Removed flex: 1 to allow proper scrolling
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    fontFamily: FONT_STYLES.englishBody,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  interestChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#bf4342',
  },
  interestChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONT_STYLES.englishMedium,
  },
  interestChipTextSelected: {
    color: '#bf4342',
  },
  notificationsContainer: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  notificationDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    fontFamily: FONT_STYLES.englishBody,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#bf4342',
    borderColor: '#bf4342',
  },

  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 56,
    width: '100%',
    cursor: 'pointer',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  completeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 56,
    width: '100%',
    cursor: 'pointer',
  },
  completeButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  completeButtonText: {
    color: '#bf4342',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  // Personality Traits Styles
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personalityChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '45%',
  },
  personalityChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#bf4342',
  },
  personalityChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONT_STYLES.englishMedium,
    flex: 1,
  },
  personalityChipTextSelected: {
    color: '#bf4342',
  },
  // Expectation Styles
  expectationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expectationChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '45%',
  },
  expectationChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#bf4342',
  },
  expectationChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONT_STYLES.englishMedium,
    flex: 1,
  },
  expectationChipTextSelected: {
    color: '#bf4342',
  },
  // How Did You Hear Styles
  howDidYouHearContainer: {
    gap: 12,
  },
  howDidYouHearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  howDidYouHearOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#FFFFFF',
  },
  howDidYouHearText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONT_STYLES.englishMedium,
    flex: 1,
  },
  howDidYouHearTextSelected: {
    color: '#FFFFFF',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#bf4342',
    borderColor: '#bf4342',
  },
  // API Error Banner Styles
  apiErrorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  apiErrorIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  apiErrorContent: {
    flex: 1,
  },
  apiErrorText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: FONT_STYLES.englishMedium,
    marginBottom: 8,
  },
  loginLinkButton: {
    marginTop: 4,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
    textDecorationLine: 'underline',
  },
});

export default Step6SurveyScreen;
