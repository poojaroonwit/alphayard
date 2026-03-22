import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  RefreshControl,
} from 'react-native';
import { PageSkeleton } from '../../components/common/SkeletonLoader';
import {
  Box,
  Text,
  VStack,
  HStack,
  Heading,
  Divider,
  Button,
  Icon,
  Center,
  useToast,
  Badge,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { legalApi, LegalDocument } from '../../services/api/legal';

// Simple markdown renderer for React Native
const renderMarkdownToComponents = (content: string): React.ReactNode[] => {
  if (!content) return [];
  
  const lines = content.split('\n');
  const components: React.ReactNode[] = [];
  let currentIndex = 0;
  
  lines.forEach((line, index) => {
    const key = `line-${index}`;
    
    // Headers
    if (line.startsWith('### ')) {
      components.push(
        <Heading key={key} size="sm" color="gray.800" mt={3} mb={1}>
          {line.substring(4)}
        </Heading>
      );
    } else if (line.startsWith('## ')) {
      components.push(
        <Heading key={key} size="md" color="gray.800" mt={4} mb={2}>
          {line.substring(3)}
        </Heading>
      );
    } else if (line.startsWith('# ')) {
      components.push(
        <Heading key={key} size="lg" color="gray.800" mt={5} mb={3}>
          {line.substring(2)}
        </Heading>
      );
    }
    // List items
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      components.push(
        <HStack key={key} space={2} alignItems="flex-start" ml={2}>
          <Text color="gray.700">•</Text>
          <Text color="gray.700" fontSize="sm" lineHeight="md" flex={1}>
            {line.substring(2)}
          </Text>
        </HStack>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)$/);
      if (match) {
        components.push(
          <HStack key={key} space={2} alignItems="flex-start" ml={2}>
            <Text color="gray.700" fontWeight="medium">{match[1]}.</Text>
            <Text color="gray.700" fontSize="sm" lineHeight="md" flex={1}>
              {match[2]}
            </Text>
          </HStack>
        );
      }
    }
    // Empty line (paragraph break)
    else if (line.trim() === '') {
      components.push(<Box key={key} h={2} />);
    }
    // Regular paragraph
    else {
      // Handle bold and italic
      let text = line;
      // Note: For simplicity, we just render as plain text
      // A full markdown parser would be more complex
      components.push(
        <Text key={key} color="gray.700" fontSize="sm" lineHeight="md">
          {text}
        </Text>
      );
    }
  });
  
  return components;
};

const TermsScreen: React.FC = () => {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  
  const { user } = useAuth();
  const toast = useToast();

  const loadDocument = async () => {
    try {
      setError(null);
      const doc = await legalApi.getTermsOfService();
      setDocument(doc);
      
      // Check if user has already accepted
      if (user) {
        try {
          const { accepted } = await legalApi.checkAcceptance('terms');
          setHasAccepted(accepted);
        } catch {
          // Ignore acceptance check errors
        }
      }
    } catch (err) {
      console.error('Error loading terms:', err);
      setError('Failed to load Terms & Conditions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDocument();
  };

  const handleAccept = async () => {
    if (!document || !user) return;
    
    setAccepting(true);
    try {
      await legalApi.acceptDocument(document.id);
      setHasAccepted(true);
      toast.show({
        description: 'Terms accepted successfully',
        placement: 'top',
      });
    } catch (err) {
      console.error('Error accepting terms:', err);
      toast.show({
        description: 'Failed to accept terms. Please try again.',
        placement: 'top',
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <Center flex={1} bg="white" px={6}>
        <Icon as={MaterialIcons} name="error-outline" size={12} color="red.500" />
        <Text mt={4} color="gray.600" textAlign="center">{error}</Text>
        <Button mt={4} onPress={loadDocument} colorScheme="blue">
          Try Again
        </Button>
      </Center>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Box flex={1} bg="white" px={6} py={8}>
        <VStack space={6}>
          {/* Header */}
          <VStack space={2}>
            <HStack alignItems="center" space={2}>
              <Heading size="xl" color="gray.800">
                {document?.title || 'Terms & Conditions'}
              </Heading>
              {document?.status === 'published' && (
                <Badge colorScheme="green" variant="subtle">Published</Badge>
              )}
            </HStack>
            
            {document?.summary && (
              <Text color="gray.600" fontSize="md">
                {document.summary}
              </Text>
            )}
          </VStack>

          {/* Metadata */}
          <HStack space={4} flexWrap="wrap">
            {document?.version && (
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="tag" size={4} color="gray.500" />
                <Text color="gray.500" fontSize="sm">Version {document.version}</Text>
              </HStack>
            )}
            {document?.lastUpdated && (
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="schedule" size={4} color="gray.500" />
                <Text color="gray.500" fontSize="sm">
                  Updated {new Date(document.lastUpdated).toLocaleDateString()}
                </Text>
              </HStack>
            )}
          </HStack>

          <Divider />

          {/* Content */}
          <VStack space={2}>
            {document?.content ? (
              renderMarkdownToComponents(document.content)
            ) : (
              <Text color="gray.600">No content available.</Text>
            )}
          </VStack>

          {/* Accept Button (if required and user is logged in) */}
          {document?.isRequiredAcceptance && user && !hasAccepted && (
            <Box mt={6}>
              <Divider mb={4} />
              <VStack space={3}>
                <Text color="gray.700" fontSize="sm" textAlign="center">
                  By continuing to use Boundary, you agree to these Terms & Conditions.
                </Text>
                <Button
                  onPress={handleAccept}
                  isLoading={accepting}
                  isLoadingText="Accepting..."
                  colorScheme="blue"
                  size="lg"
                >
                  I Accept the Terms
                </Button>
              </VStack>
            </Box>
          )}

          {/* Already Accepted */}
          {hasAccepted && (
            <Box mt={4} p={4} bg="green.50" rounded="lg">
              <HStack alignItems="center" space={2}>
                <Icon as={MaterialIcons} name="check-circle" size={5} color="green.600" />
                <Text color="green.700" fontSize="sm" fontWeight="medium">
                  You have accepted these terms
                </Text>
              </HStack>
            </Box>
          )}

          {/* Effective Date */}
          {document?.effectiveDate && (
            <Text color="gray.500" fontSize="xs" textAlign="center" mt={4}>
              Effective Date: {new Date(document.effectiveDate).toLocaleDateString()}
            </Text>
          )}
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default TermsScreen;
