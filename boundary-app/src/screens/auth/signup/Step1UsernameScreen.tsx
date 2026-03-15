import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { FONT_STYLES } from '../../../utils/fontUtils';
import { useAuth } from '../../../contexts/AuthContext';

interface Step1UsernameScreenProps {
  navigation: any;
  route: any;
}

// Map SSO provider names to MaterialCommunityIcons names
const getSSOProviderIcon = (providerName: string | undefined): string => {
  if (!providerName) return 'login';
  const iconMap: Record<string, string> = {
    google: 'google',
    facebook: 'facebook',
    apple: 'apple',
    github: 'github',
    microsoft: 'microsoft',
    twitter: 'twitter',
    x: 'twitter', // X uses Twitter icon
    linkedin: 'linkedin',
    discord: 'discord',
    slack: 'slack',
    line: 'message-text', // LINE uses message icon
  };
  return iconMap[providerName.toLowerCase()] || 'login';
};

// Get button background color for provider
const getSSOProviderColor = (providerName: string | undefined, customColor?: string): string => {
  if (customColor) return customColor;
  if (!providerName) return 'rgba(255, 255, 255, 0.15)';
  const colorMap: Record<string, string> = {
    google: 'rgba(219, 68, 55, 0.8)',
    facebook: 'rgba(66, 103, 178, 0.8)',
    apple: 'rgba(0, 0, 0, 0.8)',
    github: 'rgba(36, 41, 46, 0.8)',
    microsoft: 'rgba(0, 164, 239, 0.8)',
    twitter: 'rgba(29, 161, 242, 0.8)',
    x: 'rgba(0, 0, 0, 0.8)', // X/Twitter new branding is black
    linkedin: 'rgba(0, 119, 181, 0.8)',
    discord: 'rgba(88, 101, 242, 0.8)',
    slack: 'rgba(74, 21, 75, 0.8)',
    line: 'rgba(0, 195, 0, 0.8)',
  };
  return colorMap[providerName.toLowerCase()] || 'rgba(255, 255, 255, 0.15)';
};

const Step1UsernameScreen: React.FC<Step1UsernameScreenProps> = ({ navigation, route }) => {
  const { loginWithSSO, ssoProviders, loadSSOProviders } = useAuth();
  const email = route?.params?.email || '';

  // Load SSO providers on mount if not already loaded
  React.useEffect(() => {
    console.log('[Step1UsernameScreen] Component mounted');
    console.log('[Step1UsernameScreen] Route params:', route?.params);
    if (ssoProviders.length === 0) {
      loadSSOProviders();
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSignup = () => {
    // Navigate directly to Step 2 with the email from login/register page
    if (email && email.trim() && validateEmail(email)) {
      navigation.navigate('Step2Password', { email: email.trim() });
    } else {
      Alert.alert('Error', 'Email is required. Please go back and enter your email.');
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'facebook' | 'apple' | 'microsoft' | 'twitter' | 'x' | 'line' | string) => {
    try {
      await loginWithSSO(provider);
      // Navigation will be handled by AuthContext
    } catch (error: any) {
      console.error(`${provider} signup error:`, error);
      Alert.alert(
        'Signup Failed',
        error.message || `Failed to signup with ${provider}. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FA7272', '#FFBBB4']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Icon name="arrow-left" size={24} color="#ffffff" />
              </TouchableOpacity>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>Step 1 of 6</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '16.67%' }]} />
                </View>
              </View>
            </View>

            {/* White Card Container */}
            <View style={styles.cardContainer}>
              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>Choose how you'd like to sign up</Text>
                {email && email.trim() && (
                  <Text style={styles.emailHint}>Using: {email}</Text>
                )}
              </View>

              {/* Signup Options */}
              <ScrollView 
                style={styles.form}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.signupOptionsWrapper}>
                {/* Social Signup Options */}
                <View style={styles.socialOptionsContainer}>
                  <Text style={styles.sectionTitle}>Quick Signup</Text>
                  <View style={styles.socialButtons}>
                    {/* Dynamic SSO providers from backend */}
                    {ssoProviders.length > 0 ? (
                      ssoProviders.map((provider: any) => (
                        <TouchableOpacity
                          key={provider.id}
                          style={[
                            styles.socialButton,
                            { backgroundColor: getSSOProviderColor(provider.providerName || provider.name, provider.buttonColor) }
                          ]}
                          onPress={() => handleSocialSignup((provider.providerName || provider.name) as any)}
                        >
                          <Icon name={getSSOProviderIcon(provider.providerName || provider.name)} size={20} color="#FFFFFF" />
                          <Text style={styles.socialButtonText}>Continue with {provider.displayName}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      // Fallback to default providers if none configured
                      <>
                        <TouchableOpacity
                          style={[styles.socialButton, styles.googleButton]}
                          onPress={() => handleSocialSignup('google')}
                        >
                          <Icon name="google" size={20} color="#FFFFFF" />
                          <Text style={styles.socialButtonText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.socialButton, styles.facebookButton]}
                          onPress={() => handleSocialSignup('facebook')}
                        >
                          <Icon name="facebook" size={20} color="#FFFFFF" />
                          <Text style={styles.socialButtonText}>Continue with Facebook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.socialButton, styles.lineButton]}
                          onPress={() => handleSocialSignup('line')}
                        >
                          <Icon name="chat" size={20} color="#FFFFFF" />
                          <Text style={styles.socialButtonText}>Continue with LINE</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Email Signup Option */}
                <TouchableOpacity style={styles.emailSignupButton} onPress={handleEmailSignup}>
                  <Icon name="email" size={20} color="#FF5A5A" />
                  <Text style={styles.emailSignupButtonText}>Sign up with Email</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  stepIndicator: {
    flex: 1,
  },
  stepText: {
    color: '#f5f3f4',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: FONT_STYLES.englishMedium,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(211, 211, 211, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#bf4342',
    borderRadius: 2,
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: FONT_STYLES.englishHeading,
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONT_STYLES.englishBody,
    color: '#666666',
  },
  emailHint: {
    fontSize: 14,
    fontFamily: FONT_STYLES.englishBody,
    color: '#999999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 20,
  },
  signupOptionsWrapper: {
    width: '100%',
  },
  socialOptionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 50,
    gap: 12,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButton: {
    backgroundColor: 'rgba(219, 68, 55, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  facebookButton: {
    backgroundColor: 'rgba(66, 103, 178, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  lineButton: {
    backgroundColor: 'rgba(0, 195, 0, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: FONT_STYLES.englishMedium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#999999',
    fontSize: 14,
    marginHorizontal: 16,
    fontFamily: FONT_STYLES.englishBody,
  },
  emailSignupButton: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emailSignupButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONT_STYLES.englishSemiBold,
  },
});

export default Step1UsernameScreen;
