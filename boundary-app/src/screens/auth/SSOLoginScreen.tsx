import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Box,
  Text,
  VStack,
  Heading,
  Button,
  Link,
  Icon,
  Divider,
  HStack,
  useToast,
} from 'native-base';
import CoolIcon from '../../components/common/CoolIcon';
import { useNavigation } from '@react-navigation/native';
import { FONT_STYLES } from '../../utils/fontUtils';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const SSOLoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setSelectedProvider(provider);
    setLoading(true);

    try {
      // This would integrate with actual social auth providers
      // For now, we'll show a placeholder
      Alert.alert(
        'Coming Soon',
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be available soon!`
      );
    } catch (error: any) {
      console.error(`${provider} login error:`, error);
      Alert.alert(
        'Login Failed',
        `Failed to login with ${provider}. Please try again.`
      );
    } finally {
      setLoading(false);
      setSelectedProvider(null);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login' as never);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Box flex={1} bg="white" px={6} py={8}>
        <VStack space={8} flex={1}>
          {/* Header */}
          <VStack space={4} alignItems="center">
            <View>
              <CoolIcon name="account-multiple" size={64} color="#FA7272" />
            </View>
            <VStack space={2} alignItems="center">
              <Heading size="xl" color="gray.800" textAlign="center">
                Sign In with Social
              </Heading>
              <Text color="gray.600" fontSize="md" textAlign="center">
                Choose your preferred way to sign in
              </Text>
            </VStack>
          </VStack>

          {/* Social Login Buttons */}
          <VStack space={4} flex={1}>
            {/* Google */}
            <Button
              size="lg"
              variant="outline"
              leftIcon={<CoolIcon name="apps" size={18} color="#EF4444" />}
              onPress={() => handleSocialLogin('google')}
              isLoading={selectedProvider === 'google'}
              _pressed={{ bg: 'gray.100' }}
            >
              Continue with Google
            </Button>

            {/* Facebook */}
            <Button
              size="lg"
              variant="outline"
              leftIcon={<CoolIcon name="apps" size={18} color="#2563EB" />}
              onPress={() => handleSocialLogin('facebook')}
              isLoading={selectedProvider === 'facebook'}
              _pressed={{ bg: 'gray.100' }}
            >
              Continue with Facebook
            </Button>

            {/* Apple (iOS only) */}
            {Platform.OS === 'ios' && (
              <Button
                size="lg"
                variant="outline"
                leftIcon={<CoolIcon name="apps" size={18} color="#111827" />}
                onPress={() => handleSocialLogin('apple')}
                isLoading={selectedProvider === 'apple'}
                _pressed={{ bg: 'gray.100' }}
              >
                Continue with Apple
              </Button>
            )}

            {/* Divider */}
            <VStack space={4} mt={8}>
              <HStack alignItems="center" space={3}>
                <Divider flex={1} />
                <Text color="gray.500" fontSize="sm">
                  OR
                </Text>
                <Divider flex={1} />
              </HStack>

              {/* Alternative Options */}
              <VStack space={3}>
                <Button
                  variant="ghost"
                  size="lg"
                  onPress={handleBackToLogin}
                >
                  Sign in with Email
                </Button>

                <HStack justifyContent="center" space={1}>
                  <Text color="gray.600">Don't have an account?</Text>
                  <Link
                    onPress={() => navigation.navigate('Signup' as never)}
                    _text={{ color: 'primary.500', fontWeight: 'semibold' }}
                  >
                    Sign Up
                  </Link>
                </HStack>
              </VStack>
            </VStack>
          </VStack>

          {/* Footer */}
          <VStack space={4} alignItems="center">
            <Text color="gray.500" fontSize="xs" textAlign="center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </VStack>
        </VStack>
      </Box>
    </KeyboardAvoidingView>
  );
};

export default SSOLoginScreen; 
