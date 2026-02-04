import React, { useState } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
  Modal,
  FormControl,
  Input,
  Select,
  CheckIcon,
  useToast,
} from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';
import { calendarService } from '../../services/calendar/CalendarService';
import { todosApi } from '../../services/api/todos';
import { notesApi } from '../../services/api/notes';
import { expenseService } from '../../services/expenses/ExpenseService';
import { socialService } from '../../services/social/SocialService';

interface AddItemData {
  type: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
  location?: string;
  priority?: string;
}

const UniversalAddScreen: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const { selectedCircle, families } = useUserData();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddItemData>({
    type: '',
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    priority: '',
  });

  const addOptions = [
    {
      id: 'event',
      title: 'Circle Event',
      description: 'Add a new Circle event or activity',
      icon: 'calendar-plus',
      color: '#4A90E2',
    },
    {
      id: 'task',
      title: 'Circle Task',
      description: 'Create a new task or chore',
      icon: 'checkbox-marked-circle-plus',
      color: '#7ED321',
    },
    {
      id: 'reminder',
      title: 'Reminder',
      description: 'Set a reminder for the Circle',
      icon: 'bell-plus',
      color: '#F5A623',
    },
    {
      id: 'note',
      title: 'Circle Note',
      description: 'Share a note with the Circle',
      icon: 'note-plus',
      color: '#9B59B6',
    },
    {
      id: 'expense',
      title: 'Circle Expense',
      description: 'Track a Circle expense',
      icon: 'cash-plus',
      color: '#E74C3C',
    },
    {
      id: 'photo',
      title: 'Circle Photo',
      description: 'Share a Circle photo',
      icon: 'camera-plus',
      color: '#1ABC9C',
    },
  ];

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const handleAddItem = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
    setShowModal(true);
  };

  const handleInputChange = (field: keyof AddItemData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    // Logic to find target circle ID
    const targetCircle = families.find(f => f.name === selectedCircle) || families[0];
    const targetCircleId = targetCircle?.id;

    if (!targetCircleId) {
       Alert.alert('Error', 'No circle available');
       return;
    }

    setLoading(true);
    try {
      console.log('Adding item:', formData);
      
      switch (formData.type) {
        case 'event':
           // Combine date and time
           const startDate = new Date(formData.date + 'T' + (formData.time || '09:00'));
           const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
           
           await calendarService.createEvent({
             title: formData.title,
             description: formData.description,
             startDate: startDate.toISOString(),
             endDate: endDate.toISOString(),
             allDay: false,
             location: formData.location,
             type: 'Circle',
             attendees: [], 
           });
           break;
        
        case 'task':
           await todosApi.create({
             title: formData.title,
             description: formData.description,
             category: 'circle',
             priority: (formData.priority as any) || 'medium',
             dueDate: formData.date ? new Date(formData.date).toISOString() : undefined,
           });
           break;

        case 'reminder':
            // Treating reminders as tasks for now, or could use calendar 
            await todosApi.create({
             title: 'Reminder: ' + formData.title,
             description: formData.description,
             category: 'urgent',
             priority: 'high',
             dueDate: formData.date ? new Date(formData.date).toISOString() : undefined,
           });
           break;

        case 'note':
           await notesApi.create({
             title: formData.title,
             content: formData.description,
             category: 'circle',
             isPinned: false,
             color: '#ffffff'
           });
           break;

        case 'expense':
            if (!user) throw new Error("User not found");
             
            if (!user) throw new Error("User not found");
             
            await expenseService.createExpense({
                circleId: targetCircleId,
                userId: user.id || '',
                title: formData.title,
                description: formData.description,
                amount: parseFloat(formData.location || '0'), // Using location field for amount for now as per UI limitation
                currency: 'USD',
                category: 'other',
                date: new Date(),
                paymentMethod: 'cash',
                isRecurring: false,
                tags: [],
                sharedWith: [],
                splitType: 'equal',
                status: 'pending'
            });
            break;
        
        case 'photo':
             // Assuming posting to social feed
             // Assuming posting to social feed
             await socialService.createPost({
                 content: formData.title + '\n' + formData.description,
                 circleId: targetCircleId,
                 type: 'text', // No actual image upload UI yet
                 visibility: 'circle',
                 tags: []
             });
             break;

        default:
          console.warn('Unknown type:', formData.type);
      }

      toast.show({
        description: `${formData.type} added successfully!`,
        status: 'success',
      });

      // Reset form and close modal
      setFormData({
        type: '',
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        priority: '',
      });
      setShowModal(false);
    } catch (error) {
      console.error('Add item error:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      type: '',
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      priority: '',
    });
    setShowModal(false);
  };

  const renderAddOption = (option: any) => (
    <Button
      key={option.id}
      variant="outline"
      size="lg"
      mb={4}
      onPress={() => handleAddItem(option.id)}
      borderColor="gray.700"
      leftIcon={
        <Icon
          as={MaterialCommunityIcons}
          name={option.icon as any}
          size="sm"
          color={option.color}
        />
      }
      _pressed={{ bg: 'gray.800' }}
    >
      <VStack alignItems="flex-start" flex={1}>
        <Text fontWeight="semibold" color="white">
          {option.title}
        </Text>
        <Text fontSize="sm" color="gray.400">
          {option.description}
        </Text>
      </VStack>
    </Button>
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Box flex={1} bg="black" px={6} py={8}>
          <VStack space={6}>
            {/* Header */}
            <VStack space={2}>
              <Heading size="xl" color="white">
                Add New Item
              </Heading>
              <Text color="gray.400" fontSize="md">
                Choose what you'd like to add to your circle
              </Text>
            </VStack>

            {/* Add Options */}
            <VStack space={4}>
              {addOptions.map(renderAddOption)}
            </VStack>
          </VStack>
        </Box>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal isOpen={showModal} onClose={handleCancel} size="lg">
        <Modal.Content maxWidth="400px" bg="gray.900" _text={{ color: 'white' }}>
          <Modal.CloseButton _icon={{ color: 'white' }} />
          <Modal.Header bg="gray.900" _text={{ color: 'white' }} borderBottomColor="gray.700">
            Add New {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
          </Modal.Header>
          <Modal.Body bg="gray.900">
            <VStack space={4}>
              <FormControl>
                <FormControl.Label _text={{ color: 'gray.300' }}>Title</FormControl.Label>
                <Input
                  size="lg"
                  placeholder="Enter title"
                  color="white"
                  placeholderTextColor="gray.500"
                  borderColor="gray.700"
                  value={formData.title}
                  onChangeText={(value: string) => handleInputChange('title', value)}
                />
              </FormControl>

              <FormControl>
                <FormControl.Label _text={{ color: 'gray.300' }}>Description</FormControl.Label>
                <Input
                  size="lg"
                  placeholder="Enter description"
                  color="white"
                  placeholderTextColor="gray.500"
                  borderColor="gray.700"
                  value={formData.description}
                  onChangeText={(value: string) => handleInputChange('description', value)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </FormControl>

              <HStack space={3}>
                <FormControl flex={1}>
                  <FormControl.Label _text={{ color: 'gray.300' }}>Date</FormControl.Label>
                  <Input
                    size="lg"
                    placeholder="YYYY-MM-DD"
                    color="white"
                    placeholderTextColor="gray.500"
                    borderColor="gray.700"
                    value={formData.date}
                    onChangeText={(value: string) => handleInputChange('date', value)}
                  />
                </FormControl>

                <FormControl flex={1}>
                  <FormControl.Label _text={{ color: 'gray.300' }}>Time</FormControl.Label>
                  <Input
                    size="lg"
                    placeholder="HH:MM"
                    color="white"
                    placeholderTextColor="gray.500"
                    borderColor="gray.700"
                    value={formData.time}
                    onChangeText={(value: string) => handleInputChange('time', value)}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormControl.Label _text={{ color: 'gray.300' }}>Location</FormControl.Label>
                <Input
                  size="lg"
                  placeholder="Enter location"
                  color="white"
                  placeholderTextColor="gray.500"
                  borderColor="gray.700"
                  value={formData.location}
                  onChangeText={(value: string) => handleInputChange('location', value)}
                />
              </FormControl>

              <FormControl>
                <FormControl.Label _text={{ color: 'gray.300' }}>Priority</FormControl.Label>
                <Select
                  size="lg"
                  placeholder="Select priority"
                  color="white"
                  placeholderTextColor="gray.500"
                  borderColor="gray.700"
                  selectedValue={formData.priority}
                  onValueChange={(value: string) => handleInputChange('priority', value)}
                  _selectedItem={{
                    bg: 'primary.600',
                    endIcon: <CheckIcon size="5" color="white" />,
                  }}
                  _item={{
                    _text: { color: 'black' } // NativeBase Select items are usually white bg
                  }}
                >
                  {priorityOptions.map((option) => (
                    <Select.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer bg="gray.900" borderTopColor="gray.700">
            <Button.Group space={2}>
              <Button variant="ghost" onPress={handleCancel} _text={{ color: 'gray.300' }}>
                Cancel
              </Button>
              <Button onPress={handleSubmit} isLoading={loading}>
                Add
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default UniversalAddScreen; 
