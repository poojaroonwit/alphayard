import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  IconButton,
  Badge,
  Pressable,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Input,
  FormControl,
  FormControlLabel,
  Select,
  CheckIcon,
  Divider,
  Spinner,
  FlatList,
  Avatar,
  Progress,
  Switch,
  ScrollView,
  SearchIcon,
} from 'native-base';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import localizationService, { Language, TranslationKey } from '../../services/localizationService';
import { useTranslation } from 'react-i18next';

interface TranslationKeysViewerProps {
  onLanguageChange?: (languageCode: string) => void;
}

interface TranslationWithKey extends TranslationKey {
  value?: string;
  language?: string;
}

const TranslationKeysViewer: React.FC<TranslationKeysViewerProps> = ({
  onLanguageChange,
}) => {
  const { t } = useTranslation();
  const [translationKeys, setTranslationKeys] = useState<TranslationWithKey[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isLanguageDrawerOpen, onOpen: onLanguageDrawerOpen, onClose: onLanguageDrawerClose } = useDisclosure();

  const bgColor = useColorModeValue(colors.white[500], colors.gray[800]);
  const cardBgColor = useColorModeValue(colors.gray[50], colors.gray[700]);
  const textColor = useColorModeValue(colors.gray[800], colors.white[500]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedLanguage !== currentLanguage) {
      loadTranslationKeys();
    }
  }, [selectedLanguage]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load languages
      const languagesData = await localizationService.getLanguages();
      setLanguages(languagesData);
      
      // Set current language
      const current = localizationService.getCurrentLanguage();
      setCurrentLanguage(current);
      setSelectedLanguage(current);
      
      // Load translation keys
      await loadTranslationKeys();
      
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadTranslationKeys = async () => {
    try {
      setIsLoading(true);
      
      // Get all translation keys from the API
      const response = await fetch(`${localizationService['baseUrl']}/keys`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const keys = data.keys || [];
      
      // Get translations for the selected language
      const translations = await localizationService.getTranslationsForLanguage(selectedLanguage);
      
      // Combine keys with their translations
      const keysWithTranslations = keys.map((key: TranslationKey) => ({
        ...key,
        value: translations[key.key] || '',
        language: selectedLanguage
      }));
      
      setTranslationKeys(keysWithTranslations);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(keys.map((key: TranslationKey) => key.category))];
      setCategories(['all', ...uniqueCategories]);
      
    } catch (error) {
      console.error('Error loading translation keys:', error);
      // Fallback to current translations
      const currentTranslations = localizationService.getCurrentTranslations();
      const fallbackKeys = Object.keys(currentTranslations).map(key => ({
        id: key,
        key,
        category: 'general',
        description: '',
        context: 'mobile_app',
        is_active: true,
        value: currentTranslations[key],
        language: selectedLanguage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setTranslationKeys(fallbackKeys);
      setCategories(['all', 'general']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      setIsLoading(true);
      setSelectedLanguage(languageCode);
      await localizationService.setLanguage(languageCode);
      setCurrentLanguage(languageCode);
      onLanguageChange?.(languageCode);
      onLanguageDrawerClose();
      Alert.alert(t('common.success'), t('settings.languageChanged'));
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredKeys = translationKeys.filter(key => {
    const matchesSearch = key.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || key.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getLanguageInfo = (languageCode: string): Language | undefined => {
    return languages.find(lang => lang.code === languageCode);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'auth': '#FF6B6B',
      'error': '#FF8E53',
      'navigation': '#4ECDC4',
      'success': '#45B7D1',
      'ui': '#96CEB4',
      'general': '#FECA57'
    };
    return colors[category as keyof typeof colors] || '#6B7280';
  };

  const renderTranslationKey = ({ item: key }: { item: TranslationWithKey }) => {
    return (
      <Pressable onPress={() => onOpen()}>
        <Box
          bg={cardBgColor}
          p={4}
          borderRadius={12}
          mb={3}
          borderLeftWidth={4}
          borderLeftColor={getCategoryColor(key.category)}
        >
          <VStack space={2}>
            <HStack space={2} alignItems="center" justifyContent="space-between">
              <Text style={textStyles.h4} color={textColor} fontWeight="600" flex={1}>
                {key.key}
              </Text>
              <Badge
                bg={getCategoryColor(key.category)}
                _text={{ color: 'white', fontSize: 'xs' }}
                borderRadius="full"
              >
                {key.category}
              </Badge>
            </HStack>
            
            {key.description && (
              <Text style={textStyles.caption} color={colors.gray[600]}>
                {key.description}
              </Text>
            )}
            
            <Box bg={bgColor} p={3} borderRadius={8} borderWidth={1} borderColor={colors.gray[200]}>
              <Text style={textStyles.body} color={textColor}>
                {key.value || t('common.noTranslation')}
              </Text>
            </Box>
            
            <HStack space={2} alignItems="center" justifyContent="space-between">
              <HStack space={2} alignItems="center">
                <Icon as={IconMC} name="translate" size={4} color={colors.gray[500]} />
                <Text style={textStyles.caption} color={colors.gray[500]}>
                  {getLanguageInfo(selectedLanguage)?.name || selectedLanguage}
                </Text>
              </HStack>
              
              <HStack space={1}>
                <IconButton
                  icon={<Icon as={IconMC} name="eye" size={4} />}
                  onPress={() => onOpen()}
                  variant="ghost"
                  size="sm"
                  colorScheme="primary"
                />
                <IconButton
                  icon={<Icon as={IconMC} name="translate" size={4} />}
                  onPress={onLanguageDrawerOpen}
                  variant="ghost"
                  size="sm"
                  colorScheme="secondary"
                />
              </HStack>
            </HStack>
          </VStack>
        </Box>
      </Pressable>
    );
  };

  return (
    <Box>
      {/* Header */}
      <HStack space={3} alignItems="center" mb={4}>
        <Icon
          as={IconMC}
          name="key-variant"
          size={6}
          color={colors.primary[500]}
        />
        <VStack flex={1}>
          <Text style={textStyles.h3} color={textColor} fontWeight="600">
            {t('settings.translationKeys')}
          </Text>
          <Text style={textStyles.caption} color={colors.gray[600]}>
            {t('settings.viewAllTranslationKeys')}
          </Text>
        </VStack>
        <Badge colorScheme="primary" variant="solid">
          {filteredKeys.length}
        </Badge>
      </HStack>

      {/* Current Language Info */}
      <Box bg={cardBgColor} p={4} borderRadius={12} mb={4}>
        <HStack space={3} alignItems="center" justifyContent="space-between">
          <HStack space={3} alignItems="center">
            <Text fontSize={24}>
              {getLanguageInfo(selectedLanguage)?.flag_emoji}
            </Text>
            <VStack>
              <Text style={textStyles.h4} color={textColor} fontWeight="600">
                {getLanguageInfo(selectedLanguage)?.name || selectedLanguage}
              </Text>
              <Text style={textStyles.caption} color={colors.gray[600]}>
                {getLanguageInfo(selectedLanguage)?.native_name}
              </Text>
            </VStack>
          </HStack>
          <Button
            onPress={onLanguageDrawerOpen}
            variant="outline"
            size="sm"
            leftIcon={<Icon as={IconMC} name="translate" size={4} />}
          >
            {t('common.change')}
          </Button>
        </HStack>
      </Box>

      {/* Search and Filter */}
      <VStack space={3} mb={4}>
        <FormControl>
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChangeText={setSearchTerm}
            leftElement={<Icon as={IconMC} name="magnify" size={5} color={colors.gray[500]} ml={3} />}
            bg={bgColor}
            borderColor={colors.gray[200]}
            _focus={{ borderColor: colors.primary[500] }}
          />
        </FormControl>
        
        <HStack space={2} alignItems="center">
          <Text style={textStyles.body} color={textColor} fontWeight="600">
            {t('common.category')}:
          </Text>
          <Select
            selectedValue={selectedCategory}
            onValueChange={setSelectedCategory}
            minWidth="150"
            bg={bgColor}
            borderColor={colors.gray[200]}
            _selectedItem={{
              bg: colors.primary[500],
              endIcon: <CheckIcon size={4} />
            }}
          >
            {categories.map(category => (
              <Select.Item
                key={category}
                label={category === 'all' ? t('common.all') : category}
                value={category}
              />
            ))}
          </Select>
        </HStack>
      </VStack>

      {/* Translation Keys List */}
      {isLoading ? (
        <Box alignItems="center" py={8}>
          <Spinner size="lg" color={colors.primary[500]} />
          <Text style={textStyles.body} color={colors.gray[600]} mt={2}>
            {t('common.loading')}
          </Text>
        </Box>
      ) : (
        <FlatList
          data={filteredKeys}
          renderItem={renderTranslationKey}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Box alignItems="center" py={8}>
              <Icon
                as={IconMC}
                name="key-off"
                size={12}
                color={colors.gray[400]}
                mb={3}
              />
              <Text style={textStyles.h4} color={colors.gray[600]} textAlign="center">
                {t('errors.notFound')}
              </Text>
              <Text style={textStyles.caption} color={colors.gray[500]} textAlign="center">
                {t('errors.tryAgain')}
              </Text>
            </Box>
          }
        />
      )}

      {/* Language Selection Drawer */}
      <Modal isOpen={isLanguageDrawerOpen} onClose={onLanguageDrawerClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack space={3} alignItems="center">
              <Icon as={IconMC} name="translate" size={6} color={colors.primary[500]} />
              <VStack>
                <Text style={textStyles.h3} color={textColor}>
                  {t('settings.selectLanguage')}
                </Text>
                <Text style={textStyles.caption} color={colors.gray[600]}>
                  {t('settings.chooseLanguageForTranslations')}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <VStack space={3}>
              {languages.map((language) => (
                <Pressable
                  key={language.code}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Box
                    bg={language.code === selectedLanguage ? colors.primary[50] : cardBgColor}
                    p={4}
                    borderRadius={12}
                    borderWidth={2}
                    borderColor={language.code === selectedLanguage ? colors.primary[500] : colors.gray[200]}
                  >
                    <HStack space={3} alignItems="center">
                      <Text fontSize={24}>{language.flag_emoji}</Text>
                      <VStack flex={1}>
                        <HStack space={2} alignItems="center">
                          <Text style={textStyles.h4} color={textColor} fontWeight="600">
                            {language.name}
                          </Text>
                          {language.code === currentLanguage && (
                            <Badge colorScheme="primary" variant="solid" size="sm">
                              {t('common.current')}
                            </Badge>
                          )}
                        </HStack>
                        <Text style={textStyles.caption} color={colors.gray[600]}>
                          {language.native_name}
                        </Text>
                      </VStack>
                      {language.code === selectedLanguage && (
                        <Icon as={IconMC} name="check" size={5} color={colors.primary[500]} />
                      )}
                    </HStack>
                  </Box>
                </Pressable>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onLanguageDrawerClose}>
              {t('common.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Translation Key Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack>
              <Text style={textStyles.h3} color={textColor}>
                {t('settings.translationDetails')}
              </Text>
              <Text style={textStyles.caption} color={colors.gray[600]}>
                {t('settings.viewTranslationDetails')}
              </Text>
            </VStack>
          </ModalHeader>
          <ModalBody>
            <VStack space={4}>
              <Box>
                <Text style={textStyles.h4} color={textColor} fontWeight="600" mb={2}>
                  {t('common.key')}
                </Text>
                <Text style={textStyles.body} color={textColor} fontFamily="mono">
                  translation.key.example
                </Text>
              </Box>
              
              <Box>
                <Text style={textStyles.h4} color={textColor} fontWeight="600" mb={2}>
                  {t('common.value')}
                </Text>
                <Box bg={cardBgColor} p={3} borderRadius={8}>
                  <Text style={textStyles.body} color={textColor}>
                    This is the translated text value
                  </Text>
                </Box>
              </Box>
              
              <Box>
                <Text style={textStyles.h4} color={textColor} fontWeight="600" mb={2}>
                  {t('common.category')}
                </Text>
                <Badge bg={getCategoryColor('ui')} _text={{ color: 'white' }}>
                  ui
                </Badge>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onClose}>
              {t('common.close')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TranslationKeysViewer;

