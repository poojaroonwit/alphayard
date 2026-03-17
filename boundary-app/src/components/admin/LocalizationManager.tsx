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
  TextArea,
  Progress,
  Switch,
  Tabs,
  TabBar,
  Tab,
  TabPanels,
  TabPanel,
} from 'native-base';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import localizationService, { Language } from '../../services/localizationService';

interface TranslationKey {
  key: string;
  value: string;
  category: string;
  isTranslated: boolean;
}

interface LocalizationManagerProps {
  onLanguageAdded?: (language: Language) => void;
  onLanguageRemoved?: (languageCode: string) => void;
}

const LocalizationManager: React.FC<LocalizationManagerProps> = ({
  onLanguageAdded,
  onLanguageRemoved,
}) => {
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<Record<string, number>>({});
  const [missingTranslations, setMissingTranslations] = useState<Record<string, string[]>>({});
  
  // Form states
  const [newLanguageForm, setNewLanguageForm] = useState({
    code: '',
    name: '',
    nativeName: '',
    flag: '',
    direction: 'ltr' as 'ltr' | 'rtl',
  });
  
  const [translationForm, setTranslationForm] = useState({
    key: '',
    value: '',
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isAddLanguageOpen, onOpen: onAddLanguageOpen, onClose: onAddLanguageClose } = useDisclosure();
  const { isOpen: isEditTranslationOpen, onOpen: onEditTranslationOpen, onClose: onEditTranslationClose } = useDisclosure();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();

  const bgColor = useColorModeValue(colors.white[500], colors.gray[800]);
  const cardBgColor = useColorModeValue(colors.gray[50], colors.gray[700]);
  const textColor = useColorModeValue(colors.gray[800], colors.white[500]);

  useEffect(() => {
    loadLocalizationData();
  }, []);

  const loadLocalizationData = async () => {
    try {
      setIsLoading(true);
      
      const languages = localizationService.getSupportedLanguages();
      const keys = localizationService.getAllTranslationKeys();
      const progress: Record<string, number> = {};
      const missing: Record<string, string[]> = {};
      
      // Calculate progress and missing translations for each language
      languages.forEach(language => {
        const missingKeys = localizationService.validateTranslations()[language.code] || [];
        const totalKeys = keys.length;
        const translatedKeys = totalKeys - missingKeys.length;
        progress[language.code] = Math.round((translatedKeys / totalKeys) * 100);
        missing[language.code] = missingKeys;
      });
      
      setSupportedLanguages(languages);
      setTranslationProgress(progress);
      setMissingTranslations(missing);
      
      // Set default selected language
      if (languages.length > 0) {
        setSelectedLanguage(languages[0].code);
      }
      
      // Load translation keys
      const translationKeysData: TranslationKey[] = keys.map(key => {
        const category = key.split('.')[0];
        const isTranslated = !missing[selectedLanguage]?.includes(key);
        return {
          key,
          value: localizationService.t(key),
          category,
          isTranslated,
        };
      });
      
      setTranslationKeys(translationKeysData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load localization data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLanguage = async () => {
    try {
      if (!newLanguageForm.code || !newLanguageForm.name || !newLanguageForm.nativeName) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const newLanguage: Language = {
        code: newLanguageForm.code.toLowerCase(),
        name: newLanguageForm.name,
        nativeName: newLanguageForm.nativeName,
        flag: newLanguageForm.flag,
        direction: newLanguageForm.direction,
      };

      // Add empty translations for the new language
      const emptyTranslations: Record<string, any> = {};
      translationKeys.forEach(key => {
        emptyTranslations[key.key] = '';
      });

      localizationService.addLanguage(newLanguage, emptyTranslations);
      
      setSupportedLanguages(prev => [...prev, newLanguage]);
      setNewLanguageForm({ code: '', name: '', nativeName: '', flag: '', direction: 'ltr' });
      onAddLanguageClose();
      onLanguageAdded?.(newLanguage);
      
      Alert.alert('Success', 'Language added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add language');
    }
  };

  const handleRemoveLanguage = async (languageCode: string) => {
    try {
      Alert.alert(
        'Remove Language',
        'Are you sure you want to remove this language? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              localizationService.removeLanguage(languageCode);
              setSupportedLanguages(prev => prev.filter(lang => lang.code !== languageCode));
              onLanguageRemoved?.(languageCode);
              Alert.alert('Success', 'Language removed successfully');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to remove language');
    }
  };

  const handleUpdateTranslation = async (key: string, value: string) => {
    try {
      if (!selectedLanguage) return;

      const currentTranslations = localizationService.exportTranslations(selectedLanguage);
      currentTranslations[key] = value;
      localizationService.importTranslations(selectedLanguage, currentTranslations);
      
      // Update local state
      setTranslationKeys(prev => prev.map(tk => 
        tk.key === key ? { ...tk, value, isTranslated: true } : tk
      ));
      
      // Update progress
      const missingKeys = localizationService.validateTranslations()[selectedLanguage] || [];
      const totalKeys = translationKeys.length;
      const translatedKeys = totalKeys - missingKeys.length;
      const progress = Math.round((translatedKeys / totalKeys) * 100);
      
      setTranslationProgress(prev => ({ ...prev, [selectedLanguage]: progress }));
      setMissingTranslations(prev => ({ ...prev, [selectedLanguage]: missingKeys }));
      
      onEditTranslationClose();
      Alert.alert('Success', 'Translation updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update translation');
    }
  };

  const handleExportTranslations = async (languageCode: string) => {
    try {
      const translations = localizationService.exportTranslations(languageCode);
      const jsonString = JSON.stringify(translations, null, 2);
      
      // In a real app, you would save this to a file or send to server
      console.log(`Translations for ${languageCode}:`, jsonString);
      
      Alert.alert('Success', 'Translations exported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to export translations');
    }
  };

  const handleImportTranslations = async (languageCode: string, translations: Record<string, any>) => {
    try {
      localizationService.importTranslations(languageCode, translations);
      await loadLocalizationData();
      Alert.alert('Success', 'Translations imported successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to import translations');
    }
  };

  const getFilteredTranslationKeys = () => {
    let filtered = translationKeys;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(key => key.category === selectedCategory);
    }
    
    if (selectedLanguage) {
      const missing = missingTranslations[selectedLanguage] || [];
      filtered = filtered.filter(key => missing.includes(key.key));
    }
    
    return filtered;
  };

  const getCategories = () => {
    const categories = new Set(translationKeys.map(key => key.category));
    return Array.from(categories);
  };

  const renderLanguageItem = ({ item: language }: { item: Language }) => {
    const progress = translationProgress[language.code] || 0;
    const missingCount = missingTranslations[language.code]?.length || 0;
    
    return (
      <Box
        bg={cardBgColor}
        p={4}
        borderRadius={12}
        mb={3}
        borderWidth={1}
        borderColor={colors.gray[200]}
      >
        <HStack space={3} alignItems="center">
          <Text fontSize={24}>{language.flag}</Text>
          
          <VStack flex={1}>
            <HStack space={2} alignItems="center">
              <Text style={textStyles.h4} color={textColor} fontWeight="600">
                {language.name}
              </Text>
              <Badge colorScheme="gray" variant="subtle" size="sm">
                {language.code}
              </Badge>
            </HStack>
            
            <Text style={textStyles.caption} color={colors.gray[600]}>
              {language.nativeName}
            </Text>
            
            <HStack space={2} mt={2} alignItems="center">
              <Progress
                value={progress}
                colorScheme={progress >= 90 ? 'green' : progress >= 70 ? 'yellow' : 'red'}
                size="xs"
                flex={1}
              />
              <Text style={textStyles.caption} color={colors.gray[600]}>
                {progress}%
              </Text>
            </HStack>
            
            <Text style={textStyles.caption} color={colors.gray[500]}>
              {missingCount} missing translations
            </Text>
          </VStack>
          
          <VStack space={2}>
            <IconButton
              icon={<Icon as={IconMC} name="download" size={4} />}
              onPress={() => handleExportTranslations(language.code)}
              variant="ghost"
              size="sm"
              colorScheme="primary"
            />
            
            <IconButton
              icon={<Icon as={IconMC} name="pencil" size={4} />}
              onPress={() => {
                setSelectedLanguage(language.code);
                onOpen();
              }}
              variant="ghost"
              size="sm"
              colorScheme="primary"
            />
            
            {language.code !== 'en' && (
              <IconButton
                icon={<Icon as={IconMC} name="delete" size={4} />}
                onPress={() => handleRemoveLanguage(language.code)}
                variant="ghost"
                size="sm"
                colorScheme="red"
              />
            )}
          </VStack>
        </HStack>
      </Box>
    );
  };

  const renderTranslationItem = ({ item: translation }: { item: TranslationKey }) => (
    <Pressable onPress={() => {
      setTranslationForm({ key: translation.key, value: translation.value });
      onEditTranslationOpen();
    }}>
      <Box
        bg={cardBgColor}
        p={3}
        borderRadius={8}
        mb={2}
        borderWidth={1}
        borderColor={translation.isTranslated ? colors.green[200] : colors.red[200]}
      >
        <HStack space={2} alignItems="center">
          <VStack flex={1}>
            <Text style={textStyles.caption} color={colors.gray[500]}>
              {translation.key}
            </Text>
            <Text style={textStyles.body} color={textColor} numberOfLines={2}>
              {translation.value || 'No translation'}
            </Text>
          </VStack>
          
          <Badge
            colorScheme={translation.isTranslated ? 'success' : 'error'}
            variant="subtle"
            size="sm"
          >
            {translation.isTranslated ? 'Translated' : 'Missing'}
          </Badge>
        </HStack>
      </Box>
    </Pressable>
  );

  return (
    <Box>
      {/* Header */}
      <HStack space={3} alignItems="center" mb={4}>
        <Icon
          as={IconMC}
          name="translate"
          size={6}
          color={colors.primary[500]}
        />
        <VStack flex={1}>
          <Text style={textStyles.h3} color={textColor} fontWeight="600">
            Localization Manager
          </Text>
          <Text style={textStyles.caption} color={colors.gray[600]}>
            Manage app translations and languages
          </Text>
        </VStack>
        <IconButton
          icon={<Icon as={IconMC} name="plus" size={5} />}
          onPress={onAddLanguageOpen}
          variant="ghost"
          size="sm"
          colorScheme="primary"
        />
      </HStack>

      <Tabs>
        <TabBar>
          <Tab>Languages</Tab>
          <Tab>Translations</Tab>
          <Tab>Progress</Tab>
        </TabBar>
        
        <TabPanels>
          {/* Languages Tab */}
          <TabPanel>
            {isLoading ? (
              <Box alignItems="center" py={8}>
                <Spinner size="lg" color={colors.primary[500]} />
                <Text style={textStyles.body} color={colors.gray[600]} mt={2}>
                  Loading languages...
                </Text>
              </Box>
            ) : (
              <FlatList
                data={supportedLanguages}
                renderItem={renderLanguageItem}
                keyExtractor={(item) => item.code}
                showsVerticalScrollIndicator={false}
              />
            )}
          </TabPanel>

          {/* Translations Tab */}
          <TabPanel>
            <VStack space={4}>
              {/* Filters */}
              <HStack space={3} alignItems="center">
                <FormControl flex={1}>
                  <FormControl.Label>
                    <Text style={textStyles.caption} color={textColor}>Language</Text>
                  </FormControl.Label>
                  <Select
                    selectedValue={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                    size="sm"
                  >
                    {supportedLanguages.map(language => (
                      <Select.Item
                        key={language.code}
                        label={`${language.name} (${language.code})`}
                        value={language.code}
                      />
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormControl.Label>
                    <Text style={textStyles.caption} color={textColor}>Category</Text>
                  </FormControl.Label>
                  <Select
                    selectedValue={selectedCategory}
                    onValueChange={setSelectedCategory}
                    size="sm"
                  >
                    <Select.Item label="All Categories" value="all" />
                    {getCategories().map(category => (
                      <Select.Item key={category} label={category} value={category} />
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              {/* Translation Keys */}
              <FlatList
                data={getFilteredTranslationKeys()}
                renderItem={renderTranslationItem}
                keyExtractor={(item) => item.key}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Box alignItems="center" py={8}>
                    <Icon
                      as={IconMC}
                      name="translate-off"
                      size={12}
                      color={colors.gray[400]}
                      mb={3}
                    />
                    <Text style={textStyles.h4} color={colors.gray[600]} textAlign="center">
                      No translations found
                    </Text>
                    <Text style={textStyles.caption} color={colors.gray[500]} textAlign="center">
                      Select a language and category to view translations
                    </Text>
                  </Box>
                }
              />
            </VStack>
          </TabPanel>

          {/* Progress Tab */}
          <TabPanel>
            <VStack space={4}>
              {supportedLanguages.map(language => {
                const progress = translationProgress[language.code] || 0;
                const missingCount = missingTranslations[language.code]?.length || 0;
                const totalCount = translationKeys.length;
                
                return (
                  <Box key={language.code} bg={cardBgColor} p={4} borderRadius={12}>
                    <HStack space={3} alignItems="center" mb={3}>
                      <Text fontSize={24}>{language.flag}</Text>
                      <VStack flex={1}>
                        <Text style={textStyles.h4} color={textColor} fontWeight="600">
                          {language.name}
                        </Text>
                        <Text style={textStyles.caption} color={colors.gray[600]}>
                          {language.nativeName}
                        </Text>
                      </VStack>
                      <Badge
                        colorScheme={progress >= 90 ? 'green' : progress >= 70 ? 'yellow' : 'red'}
                        variant="solid"
                      >
                        {progress}%
                      </Badge>
                    </HStack>
                    
                    <Progress
                      value={progress}
                      colorScheme={progress >= 90 ? 'green' : progress >= 70 ? 'yellow' : 'red'}
                      size="lg"
                      mb={2}
                    />
                    
                    <HStack space={4} justifyContent="space-between">
                      <Text style={textStyles.caption} color={colors.gray[600]}>
                        {totalCount - missingCount} of {totalCount} translated
                      </Text>
                      <Text style={textStyles.caption} color={colors.red[500]}>
                        {missingCount} missing
                      </Text>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Add Language Modal */}
      <Modal isOpen={isAddLanguageOpen} onClose={onAddLanguageClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text style={textStyles.h3} color={textColor}>
              Add New Language
            </Text>
          </ModalHeader>
          <ModalBody>
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>
                  <Text style={textStyles.h4} color={textColor}>Language Code</Text>
                </FormControl.Label>
                <Input
                  value={newLanguageForm.code}
                  onChangeText={(text) => setNewLanguageForm(prev => ({ ...prev, code: text }))}
                  placeholder="e.g., fr, de, es"
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>
                  <Text style={textStyles.h4} color={textColor}>Language Name (English)</Text>
                </FormControl.Label>
                <Input
                  value={newLanguageForm.name}
                  onChangeText={(text) => setNewLanguageForm(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., French, German, Spanish"
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>
                  <Text style={textStyles.h4} color={textColor}>Native Name</Text>
                </FormControl.Label>
                <Input
                  value={newLanguageForm.nativeName}
                  onChangeText={(text) => setNewLanguageForm(prev => ({ ...prev, nativeName: text }))}
                  placeholder="e.g., Français, Deutsch, Español"
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>
                  <Text style={textStyles.h4} color={textColor}>Flag Emoji</Text>
                </FormControl.Label>
                <Input
                  value={newLanguageForm.flag}
                  onChangeText={(text) => setNewLanguageForm(prev => ({ ...prev, flag: text }))}
                  placeholder="e.g., 🇫🇷, 🇩🇪, 🇪🇸"
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>
                  <Text style={textStyles.h4} color={textColor}>Text Direction</Text>
                </FormControl.Label>
                <Select
                  selectedValue={newLanguageForm.direction}
                  onValueChange={(value) => setNewLanguageForm(prev => ({ ...prev, direction: value as 'ltr' | 'rtl' }))}
                  size="lg"
                >
                  <Select.Item label="Left to Right (LTR)" value="ltr" />
                  <Select.Item label="Right to Left (RTL)" value="rtl" />
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack space={3}>
              <Button variant="ghost" onPress={onAddLanguageClose}>
                Cancel
              </Button>
              <Button
                onPress={handleAddLanguage}
                bg={colors.primary[500]}
                _pressed={{ bg: colors.primary[600] }}
              >
                Add Language
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Translation Modal */}
      <Modal isOpen={isEditTranslationOpen} onClose={onEditTranslationClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text style={textStyles.h3} color={textColor}>
              Edit Translation
            </Text>
          </ModalHeader>
          <ModalBody>
            <VStack space={4}>
              <Box>
                <Text style={textStyles.h4} color={textColor} fontWeight="600" mb={2}>
                  Translation Key
                </Text>
                <Text style={textStyles.body} color={colors.gray[600]}>
                  {translationForm.key}
                </Text>
              </Box>

              <FormControl>
                <FormControl.Label>
                  <Text style={textStyles.h4} color={textColor}>Translation</Text>
                </FormControl.Label>
                <TextArea
                  value={translationForm.value}
                  onChangeText={(text) => setTranslationForm(prev => ({ ...prev, value: text }))}
                  placeholder="Enter translation..."
                  size="lg"
                  autoCompleteType="off"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack space={3}>
              <Button variant="ghost" onPress={onEditTranslationClose}>
                Cancel
              </Button>
              <Button
                onPress={() => handleUpdateTranslation(translationForm.key, translationForm.value)}
                bg={colors.primary[500]}
                _pressed={{ bg: colors.primary[600] }}
              >
                Update Translation
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LocalizationManager; 
