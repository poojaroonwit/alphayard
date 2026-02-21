import React from 'react';
import {
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Heading,
  Button,
  Icon,
  Divider,
  Link,
} from 'native-base';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const appVersion = '1.0.0';
  const buildNumber = '1';

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@boundary.com');
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://boundary.com');
  };

  const handleRateApp = () => {
    // This would open the app store rating page
    Alert.alert('Rate App', 'This would open the app store rating page');
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} bg="white" px={6} py={8}>
        <VStack space={6}>
          {/* App Icon and Name */}
          <VStack space={4} alignItems="center">
            <Box
              w={80}
              h={80}
              borderRadius="xl"
              bg="primary.500"
              alignItems="center"
              justifyContent="center"
            >
              <Icon
                as={MaterialCommunityIcons}
                name="home-heart"
                size="4xl"
                color="white"
              />
            </Box>
            <VStack space={2} alignItems="center">
              <Heading size="xl" color="gray.800">
                Boundary
              </Heading>
              <Text color="gray.600" fontSize="md">
                Circle Safety & Communication
              </Text>
              <Text color="gray.500" fontSize="sm">
                Version {appVersion} ({buildNumber})
              </Text>
            </VStack>
          </VStack>

          <Divider />

          {/* App Description */}
          <VStack space={4}>
            <Heading size="md" color="gray.800">
              About Boundary
            </Heading>
            <Text color="gray.700" fontSize="sm" lineHeight="md">
              Boundary is a comprehensive Circle safety and communication app designed to keep your loved ones connected and protected. Our mission is to provide peace of mind through real-time location sharing, emergency alerts, and seamless Circle communication.
            </Text>
          </VStack>

          <Divider />

          {/* Features */}
          <VStack space={4}>
            <Heading size="md" color="gray.800">
              Key Features
            </Heading>
            <VStack space={3}>
              <HStack space={3} alignItems="center">
                <Icon
                  as={MaterialCommunityIcons}
                  name="map-marker-radius"
                  size="sm"
                  color="primary.500"
                />
                <Text color="gray.700" fontSize="sm" flex={1}>
                  Real-time location tracking
                </Text>
              </HStack>
              <HStack space={3} alignItems="center">
                <Icon
                  as={MaterialCommunityIcons}
                  name="alert-circle"
                  size="sm"
                  color="primary.500"
                />
                <Text color="gray.700" fontSize="sm" flex={1}>
                  Emergency alerts and safety checks
                </Text>
              </HStack>
              <HStack space={3} alignItems="center">
                <Icon
                  as={MaterialCommunityIcons}
                  name="message-text"
                  size="sm"
                  color="primary.500"
                />
                <Text color="gray.700" fontSize="sm" flex={1}>
                  Circle group chat and calls
                </Text>
              </HStack>
              <HStack space={3} alignItems="center">
                <Icon
                  as={MaterialCommunityIcons}
                  name="calendar"
                  size="sm"
                  color="primary.500"
                />
                <Text color="gray.700" fontSize="sm" flex={1}>
                  Circle calendar and events
                </Text>
              </HStack>
              <HStack space={3} alignItems="center">
                <Icon
                  as={MaterialCommunityIcons}
                  name="shield-check"
                  size="sm"
                  color="primary.500"
                />
                <Text color="gray.700" fontSize="sm" flex={1}>
                  Privacy and security controls
                </Text>
              </HStack>
            </VStack>
          </VStack>

          <Divider />

          {/* Contact Information */}
          <VStack space={4}>
            <Heading size="md" color="gray.800">
              Contact & Support
            </Heading>
            <VStack space={3}>
              <Button
                variant="outline"
                size="lg"
                leftIcon={
                  <Icon
                    as={MaterialCommunityIcons}
                    name="email"
                    size="sm"
                  />
                }
                onPress={handleContactSupport}
              >
                Contact Support
              </Button>
              <Button
                variant="outline"
                size="lg"
                leftIcon={
                  <Icon
                    as={MaterialCommunityIcons}
                    name="web"
                    size="sm"
                  />
                }
                onPress={handleVisitWebsite}
              >
                Visit Website
              </Button>
              <Button
                variant="outline"
                size="lg"
                leftIcon={
                  <Icon
                    as={MaterialCommunityIcons}
                    name="star"
                    size="sm"
                  />
                }
                onPress={handleRateApp}
              >
                Rate Our App
              </Button>
            </VStack>
          </VStack>

          <Divider />

          {/* Legal Links */}
          <VStack space={4}>
            <Heading size="md" color="gray.800">
              Legal
            </Heading>
            <VStack space={3}>
              <Link
                onPress={() => navigation.navigate('Terms' as never)}
                _text={{ color: 'primary.500', fontSize: 'sm' }}
              >
                Terms & Conditions
              </Link>
              <Link
                onPress={() => navigation.navigate('Privacy' as never)}
                _text={{ color: 'primary.500', fontSize: 'sm' }}
              >
                Privacy Policy
              </Link>
            </VStack>
          </VStack>

          <Divider />

          {/* Copyright */}
          <VStack space={2} alignItems="center">
            <Text color="gray.500" fontSize="xs" textAlign="center">
              © 2024 Boundary. All rights reserved.
            </Text>
            <Text color="gray.500" fontSize="xs" textAlign="center">
              Made with love for families worldwide
            </Text>
          </VStack>
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default AboutScreen; 
