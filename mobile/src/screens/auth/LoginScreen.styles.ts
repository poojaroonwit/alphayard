import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Red/Coral color palette (matching signup page)
const colors = {
  // Background colors - Red/Coral gradient tones
  background: '#FA7272',
  backgroundGradientStart: '#FA7272', // Primary red
  backgroundGradientEnd: '#FFBBB4', // Coral
  backgroundOverlay: 'rgba(255, 255, 255, 0.1)',
  
  // Primary brand color
  primary: '#FA7272',
  primaryDark: '#bf4342',
  primaryLight: '#FFBBB4',
  primaryLighter: 'rgba(255, 255, 255, 0.2)',
  
  // Text colors - for white card background
  textPrimary: '#1D1D1F', // Dark text for white card
  textSecondary: '#666666', // Secondary text
  textTertiary: '#999999', // Tertiary text
  textWhite: '#FFFFFF', // White text for buttons
  
  // Input colors - white card style
  inputBackground: '#FFFFFF',
  inputBorder: '#E5E5E5',
  inputBorderFocused: '#FA7272',
  inputPlaceholder: '#999999',
  inputText: '#1D1D1F',
  
  // Error colors
  error: '#FF4757',
  errorBackground: 'rgba(255, 71, 87, 0.1)',
  errorBorder: '#FF4757',
  
  // Success colors
  success: '#10B981',
  
  // Button colors - red/coral primary
  buttonPrimary: '#FA7272',
  buttonPrimaryHover: '#E86565',
  buttonDisabled: 'rgba(250, 114, 114, 0.5)',
  buttonText: '#FFFFFF',
  
  // Social button colors - white circles
  socialButtonBg: '#FFFFFF',
  socialButtonBorder: '#E5E5E5',
  
  // Divider
  divider: '#E5E5E5',
  
  // Link colors
  link: '#FA7272',
  
  // Checkbox colors
  checkboxBorder: '#FA7272',
  checkboxChecked: '#FA7272',
  
  // Shadow
  shadow: 'rgba(0, 0, 0, 0.15)',
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundOverlay,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 0,
    justifyContent: 'flex-end',
  },
  logoHeader: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
    }),
  },
  formContainer: {
    width: '100%',
    marginTop: 0,
  },
  formCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  formCardInner: {
    padding: 24,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(250, 114, 114, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.inputBorderFocused,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.errorBorder,
    borderWidth: 1.5,
    backgroundColor: colors.errorBackground,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.inputText,
    padding: 0,
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '400',
    marginTop: 6,
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.checkboxBorder,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: colors.checkboxChecked,
    borderColor: colors.checkboxChecked,
  },
  rememberMeText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  apiErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorBackground,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.errorBorder,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(255, 71, 87, 0.2)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  apiErrorIcon: {
    marginRight: 12,
  },
  apiErrorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 15,
    color: colors.link,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: colors.buttonPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.buttonText,
  },
  socialSection: {
    marginTop: 8,
  },
  socialSectionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.socialButtonBg,
    borderWidth: 1,
    borderColor: colors.socialButtonBorder,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  googleButton: {
    backgroundColor: colors.socialButtonBg,
  },
  facebookButton: {
    backgroundColor: colors.socialButtonBg,
  },
  appleButton: {
    backgroundColor: colors.socialButtonBg,
  },
  twitterButton: {
    backgroundColor: colors.socialButtonBg,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingBottom: 32,
  },
  signupText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  signupLink: {
    fontSize: 15,
    color: colors.link,
    fontWeight: '600',
  },
});
