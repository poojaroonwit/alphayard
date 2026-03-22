import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  RefreshControl,
  TouchableOpacity,
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
  Badge,
  FlatList,
  Pressable,
  useToast,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { legalApi, DeveloperDoc } from '../../services/api/legal';

// Simple markdown renderer for React Native
const renderMarkdownToComponents = (content: string): React.ReactNode[] => {
  if (!content) return [];
  
  const lines = content.split('\n');
  const components: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  
  lines.forEach((line, index) => {
    const key = `line-${index}`;
    
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        components.push(
          <Box key={key} bg="gray.100" p={3} rounded="lg" my={2}>
            <Text fontFamily="mono" fontSize="xs" color="gray.700">
              {codeBlockContent.join('\n')}
            </Text>
          </Box>
        );
        codeBlockContent = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }
    
    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }
    
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
      // Handle inline code
      const parts = line.split(/`([^`]+)`/);
      if (parts.length > 1) {
        components.push(
          <Text key={key} color="gray.700" fontSize="sm" lineHeight="md">
            {parts.map((part, i) => (
              i % 2 === 1 ? (
                <Text key={`code-${i}`} fontFamily="mono" bg="gray.100" px={1} rounded="sm">
                  {part}
                </Text>
              ) : part
            ))}
          </Text>
        );
      } else {
        components.push(
          <Text key={key} color="gray.700" fontSize="sm" lineHeight="md">
            {line}
          </Text>
        );
      }
    }
  });
  
  return components;
};

const difficultyColors: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'green.100', text: 'green.700' },
  intermediate: { bg: 'yellow.100', text: 'yellow.700' },
  advanced: { bg: 'red.100', text: 'red.700' },
};

interface DocListItemProps {
  doc: DeveloperDoc;
  onPress: () => void;
}

const DocListItem: React.FC<DocListItemProps> = ({ doc, onPress }) => {
  const diffColors = difficultyColors[doc.difficultyLevel || 'beginner'];
  
  return (
    <Pressable onPress={onPress}>
      {({ isPressed }) => (
        <Box
          bg={isPressed ? 'gray.100' : 'white'}
          p={4}
          borderBottomWidth={1}
          borderBottomColor="gray.200"
        >
          <VStack space={2}>
            <HStack alignItems="center" space={2}>
              <Heading size="sm" color="gray.800" flex={1}>
                {doc.title}
              </Heading>
              {doc.isFeatured && (
                <Badge colorScheme="blue" variant="subtle" size="sm">
                  Featured
                </Badge>
              )}
            </HStack>
            
            {doc.excerpt && (
              <Text color="gray.600" fontSize="sm" numberOfLines={2}>
                {doc.excerpt}
              </Text>
            )}
            
            <HStack space={3} alignItems="center" flexWrap="wrap">
              {doc.difficultyLevel && (
                <Badge bg={diffColors.bg} _text={{ color: diffColors.text }} size="sm">
                  {doc.difficultyLevel}
                </Badge>
              )}
              {doc.estimatedReadTime && (
                <HStack alignItems="center" space={1}>
                  <Icon as={MaterialIcons} name="schedule" size={3} color="gray.500" />
                  <Text color="gray.500" fontSize="xs">{doc.estimatedReadTime} min</Text>
                </HStack>
              )}
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="visibility" size={3} color="gray.500" />
                <Text color="gray.500" fontSize="xs">{doc.viewCount} views</Text>
              </HStack>
            </HStack>
          </VStack>
        </Box>
      )}
    </Pressable>
  );
};

// Document List Screen
const DeveloperDocsListScreen: React.FC = () => {
  const [documents, setDocuments] = useState<DeveloperDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<any>();

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'getting_started', label: 'Getting Started' },
    { id: 'api', label: 'API Reference' },
    { id: 'guides', label: 'Guides' },
    { id: 'best_practices', label: 'Best Practices' },
  ];

  const loadDocuments = async () => {
    try {
      setError(null);
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const docs = await legalApi.getDeveloperDocs(category);
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading developer docs:', err);
      setError('Failed to load developer documentation.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const handleDocPress = (doc: DeveloperDoc) => {
    navigation.navigate('DeveloperDocDetail', { slug: doc.slug });
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <Center flex={1} bg="white" px={6}>
        <Icon as={MaterialIcons} name="error-outline" size={12} color="red.500" />
        <Text mt={4} color="gray.600" textAlign="center">{error}</Text>
        <Button mt={4} onPress={loadDocuments} colorScheme="blue">
          Try Again
        </Button>
      </Center>
    );
  }

  return (
    <Box flex={1} bg="white">
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      >
        <HStack space={2}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Box
                px={4}
                py={2}
                rounded="full"
                bg={selectedCategory === cat.id ? 'blue.500' : 'gray.100'}
              >
                <Text
                  color={selectedCategory === cat.id ? 'white' : 'gray.700'}
                  fontSize="sm"
                  fontWeight="medium"
                >
                  {cat.label}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
      
      <Divider />
      
      {/* Document List */}
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DocListItem doc={item} onPress={() => handleDocPress(item)} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <Center py={12}>
            <Icon as={MaterialIcons} name="description" size={12} color="gray.400" />
            <Text mt={4} color="gray.600">No documentation available</Text>
          </Center>
        }
      />
    </Box>
  );
};

// Document Detail Screen
const DeveloperDocDetailScreen: React.FC = () => {
  const [document, setDocument] = useState<DeveloperDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  const route = useRoute<any>();
  const toast = useToast();
  const { slug } = route.params;

  const loadDocument = async () => {
    try {
      setError(null);
      const doc = await legalApi.getDeveloperDocBySlug(slug);
      setDocument(doc);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to load document.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadDocument();
    }
  }, [slug]);

  const handleFeedback = async (helpful: boolean) => {
    if (!document || feedbackSubmitted) return;
    
    try {
      await legalApi.submitDocFeedback(document.id, helpful);
      setFeedbackSubmitted(true);
      toast.show({
        description: 'Thanks for your feedback!',
        placement: 'top',
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.show({
        description: 'Failed to submit feedback.',
        placement: 'top',
      });
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (error || !document) {
    return (
      <Center flex={1} bg="white" px={6}>
        <Icon as={MaterialIcons} name="error-outline" size={12} color="red.500" />
        <Text mt={4} color="gray.600" textAlign="center">{error || 'Document not found'}</Text>
        <Button mt={4} onPress={loadDocument} colorScheme="blue">
          Try Again
        </Button>
      </Center>
    );
  }

  const diffColors = difficultyColors[document.difficultyLevel || 'beginner'];

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} bg="white" px={6} py={8}>
        <VStack space={6}>
          {/* Header */}
          <VStack space={2}>
            <HStack alignItems="center" space={2} flexWrap="wrap">
              <Heading size="xl" color="gray.800" flex={1}>
                {document.title}
              </Heading>
              {document.isFeatured && (
                <Badge colorScheme="blue" variant="subtle">Featured</Badge>
              )}
            </HStack>
            
            {document.excerpt && (
              <Text color="gray.600" fontSize="md">
                {document.excerpt}
              </Text>
            )}
          </VStack>

          {/* Metadata */}
          <HStack space={4} flexWrap="wrap">
            {document.difficultyLevel && (
              <Badge bg={diffColors.bg} _text={{ color: diffColors.text }}>
                {document.difficultyLevel}
              </Badge>
            )}
            {document.estimatedReadTime && (
              <HStack alignItems="center" space={1}>
                <Icon as={MaterialIcons} name="schedule" size={4} color="gray.500" />
                <Text color="gray.500" fontSize="sm">{document.estimatedReadTime} min read</Text>
              </HStack>
            )}
            <HStack alignItems="center" space={1}>
              <Icon as={MaterialIcons} name="visibility" size={4} color="gray.500" />
              <Text color="gray.500" fontSize="sm">{document.viewCount} views</Text>
            </HStack>
          </HStack>

          <Divider />

          {/* Content */}
          <VStack space={2}>
            {document.content ? (
              renderMarkdownToComponents(document.content)
            ) : (
              <Text color="gray.600">No content available.</Text>
            )}
          </VStack>

          {/* Feedback */}
          <Box mt={6} p={4} bg="gray.50" rounded="lg">
            <VStack space={3} alignItems="center">
              <Text color="gray.700" fontWeight="medium">Was this helpful?</Text>
              
              {feedbackSubmitted ? (
                <HStack alignItems="center" space={2}>
                  <Icon as={MaterialIcons} name="check-circle" size={5} color="green.500" />
                  <Text color="green.600">Thanks for your feedback!</Text>
                </HStack>
              ) : (
                <HStack space={4}>
                  <Button
                    leftIcon={<Icon as={MaterialIcons} name="thumb-up" size={4} />}
                    onPress={() => handleFeedback(true)}
                    variant="outline"
                    colorScheme="green"
                    size="sm"
                  >
                    Yes ({document.helpfulCount})
                  </Button>
                  <Button
                    leftIcon={<Icon as={MaterialIcons} name="thumb-down" size={4} />}
                    onPress={() => handleFeedback(false)}
                    variant="outline"
                    colorScheme="red"
                    size="sm"
                  >
                    No ({document.notHelpfulCount})
                  </Button>
                </HStack>
              )}
            </VStack>
          </Box>

          {/* Version Info */}
          <Text color="gray.500" fontSize="xs" textAlign="center" mt={4}>
            Version {document.version} • Last updated {new Date(document.updatedAt).toLocaleDateString()}
          </Text>
        </VStack>
      </Box>
    </ScrollView>
  );
};

// Export both screens
export { DeveloperDocsListScreen, DeveloperDocDetailScreen };

// Default export for list screen
export default DeveloperDocsListScreen;
