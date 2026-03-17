import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Icon,
  Pressable,
  useColorModeValue,
  Avatar,
  Badge,
  Divider,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  TextArea,
  Select,
  CheckIcon,
  Progress,
} from 'native-base';
import { useNavigation } from '@react-navigation/native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { textStyles } from '../../theme/typography';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  createdDate: string;
  completedDate?: string;
  tags: string[];
  attachments: string[];
  comments: Comment[];
  progress: number;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isOnline: boolean;
}

const TaskManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'assigned' | 'team' | 'completed'>('my-tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();

  const bgColor = useColorModeValue(colors.white[500], colors.gray[900]);
  const cardBgColor = useColorModeValue(colors.white[500], colors.gray[800]);
  const textColor = useColorModeValue(colors.gray[800], colors.white[500]);

  useEffect(() => {
    loadTasks();
    loadTeamMembers();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    // Mock data - replace with actual API call
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Review Q1 Budget Report',
        description: 'Analyze the quarterly budget report and prepare presentation for stakeholders',
        category: 'Finance',
        priority: 'high',
        status: 'in-progress',
        assignedTo: 'John Doe',
        assignedBy: 'Sarah Manager',
        dueDate: '2024-01-20',
        createdDate: '2024-01-15',
        tags: ['budget', 'report', 'finance'],
        attachments: ['budget_report.pdf'],
        comments: [
          {
            id: '1',
            userId: 'user1',
            userName: 'John Doe',
            content: 'Working on the analysis, will complete by tomorrow',
            timestamp: '2024-01-16 10:30',
          },
        ],
        progress: 65,
      },
      {
        id: '2',
        title: 'Update Website Content',
        description: 'Update the company website with new product information and pricing',
        category: 'Marketing',
        priority: 'medium',
        status: 'pending',
        assignedTo: 'Jane Smith',
        assignedBy: 'Marketing Lead',
        dueDate: '2024-01-25',
        createdDate: '2024-01-14',
        tags: ['website', 'content', 'marketing'],
        attachments: [],
        comments: [],
        progress: 0,
      },
      {
        id: '3',
        title: 'Fix Critical Bug in App',
        description: 'Users are experiencing crashes when uploading images. Need immediate fix.',
        category: 'Development',
        priority: 'urgent',
        status: 'in-progress',
        assignedTo: 'Mike Developer',
        assignedBy: 'Tech Lead',
        dueDate: '2024-01-18',
        createdDate: '2024-01-16',
        tags: ['bug', 'critical', 'app'],
        attachments: ['bug_report.txt'],
        comments: [
          {
            id: '2',
            userId: 'user3',
            userName: 'Mike Developer',
            content: 'Identified the issue, working on the fix',
            timestamp: '2024-01-16 14:20',
          },
        ],
        progress: 40,
      },
      {
        id: '4',
        title: 'Plan Team Building Event',
        description: 'Organize a team building event for the department next month',
        category: 'HR',
        priority: 'low',
        status: 'pending',
        assignedTo: 'Lisa HR',
        assignedBy: 'HR Manager',
        dueDate: '2024-02-15',
        createdDate: '2024-01-13',
        tags: ['team-building', 'event', 'hr'],
        attachments: [],
        comments: [],
        progress: 0,
      },
      {
        id: '5',
        title: 'Complete User Research',
        description: 'Conduct user interviews and analyze feedback for new feature',
        category: 'Research',
        priority: 'medium',
        status: 'completed',
        assignedTo: 'Alex Researcher',
        assignedBy: 'Product Manager',
        dueDate: '2024-01-12',
        createdDate: '2024-01-08',
        completedDate: '2024-01-12',
        tags: ['research', 'user-feedback', 'interviews'],
        attachments: ['research_report.pdf'],
        comments: [
          {
            id: '3',
            userId: 'user5',
            userName: 'Alex Researcher',
            content: 'Research completed, report uploaded',
            timestamp: '2024-01-12 16:45',
          },
        ],
        progress: 100,
      },
    ];
    setTasks(mockTasks);
    setIsLoading(false);
  };

  const loadTeamMembers = async () => {
    const mockTeamMembers: TeamMember[] = [
      {
        id: '1',
        name: 'John Doe',
        avatar: 'https://picsum.photos/200/200?random=1',
        role: 'Finance Analyst',
        isOnline: true,
      },
      {
        id: '2',
        name: 'Jane Smith',
        avatar: 'https://picsum.photos/200/200?random=2',
        role: 'Marketing Specialist',
        isOnline: false,
      },
      {
        id: '3',
        name: 'Mike Developer',
        avatar: 'https://picsum.photos/200/200?random=3',
        role: 'Senior Developer',
        isOnline: true,
      },
      {
        id: '4',
        name: 'Lisa HR',
        avatar: 'https://picsum.photos/200/200?random=4',
        role: 'HR Coordinator',
        isOnline: true,
      },
      {
        id: '5',
        name: 'Alex Researcher',
        avatar: 'https://picsum.photos/200/200?random=5',
        role: 'UX Researcher',
        isOnline: false,
      },
    ];
    setTeamMembers(mockTeamMembers);
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate('TaskDetail' as never, { task } as never);
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const newProgress = newStatus === 'completed' ? 100 : 0;
        return {
          ...task,
          status: newStatus,
          progress: newProgress,
          completedDate: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return task;
    }));
  };

  const handleCreateTask = () => {
    onCreateOpen();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.error[500];
      case 'high': return colors.warning[500];
      case 'medium': return colors.primary[500];
      case 'low': return colors.success[500];
      default: return colors.gray[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success[500];
      case 'in-progress': return colors.primary[500];
      case 'overdue': return colors.error[500];
      case 'pending': return colors.gray[500];
      default: return colors.gray[500];
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    if (activeTab === 'my-tasks') {
      filtered = filtered.filter(task => task.assignedTo === 'John Doe'); // Current user
    } else if (activeTab === 'assigned') {
      filtered = filtered.filter(task => task.assignedBy === 'John Doe'); // Tasks assigned by current user
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(task => task.status === 'completed');
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered.sort((a, b) => {
      // Sort by priority first, then by due date
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity onPress={() => handleTaskPress(item)}>
      <Box bg={cardBgColor} borderRadius={12} p={4} mb={3}>
        <VStack space={3}>
          <HStack space={3} alignItems="flex-start">
            <Pressable onPress={() => handleTaskToggle(item.id)}>
              <Box
                w={6}
                h={6}
                borderRadius="full"
                borderWidth={2}
                borderColor={item.status === 'completed' ? colors.success[500] : colors.gray[400]}
                bg={item.status === 'completed' ? colors.success[500] : 'transparent'}
                justifyContent="center"
                alignItems="center"
              >
                {item.status === 'completed' && (
                  <Icon as={IconMC} name="check" size={4} color={colors.white[500]} />
                )}
              </Box>
            </Pressable>
            
            <VStack flex={1} space={2}>
              <HStack space={2} alignItems="center" flexWrap="wrap">
                <Text 
                  style={textStyles.h4} 
                  color={textColor} 
                  fontWeight="500" 
                  flex={1}
                  textDecorationLine={item.status === 'completed' ? 'line-through' : 'none'}
                >
                  {item.title}
                </Text>
                <Badge 
                  colorScheme={item.priority === 'urgent' ? 'error' : item.priority === 'high' ? 'warning' : 'primary'} 
                  variant="subtle" 
                  size="sm"
                >
                  {item.priority}
                </Badge>
                <Badge 
                  colorScheme={item.status === 'completed' ? 'success' : item.status === 'in-progress' ? 'primary' : 'gray'} 
                  variant="subtle" 
                  size="sm"
                >
                  {item.status}
                </Badge>
              </HStack>
              
              <Text 
                style={textStyles.body} 
                color={colors.gray[600]} 
                numberOfLines={2}
                textDecorationLine={item.status === 'completed' ? 'line-through' : 'none'}
              >
                {item.description}
              </Text>
              
              <HStack space={2} alignItems="center" flexWrap="wrap">
                <Badge colorScheme="primary" variant="subtle" size="sm">
                  {item.category}
                </Badge>
                {item.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} colorScheme="gray" variant="subtle" size="sm">
                    #{tag}
                  </Badge>
                ))}
              </HStack>
              
              <VStack space={1}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text style={textStyles.caption} color={colors.gray[500]}>
                    Due: {item.dueDate}
                  </Text>
                  <Text style={textStyles.caption} color={colors.gray[500]}>
                    {item.progress}% complete
                  </Text>
                </HStack>
                <Progress
                  value={item.progress}
                  bg={colors.gray[200]}
                  _filledTrack={{ bg: getStatusColor(item.status) }}
                  h={2}
                  borderRadius="full"
                />
              </VStack>
              
              <HStack space={2} alignItems="center">
                <Avatar size="xs" source={{ uri: 'https://picsum.photos/200/200?random=1' }}>
                  JD
                </Avatar>
                <Text style={textStyles.caption} color={colors.gray[600]}>
                  Assigned to {item.assignedTo}
                </Text>
                {item.comments.length > 0 && (
                  <HStack space={1} alignItems="center">
                    <Icon as={IconMC} name="comment" size={3} color={colors.gray[500]} />
                    <Text style={textStyles.caption} color={colors.gray[500]}>
                      {item.comments.length}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Box>
    </TouchableOpacity>
  );

  const renderTeamMember = ({ item }: { item: TeamMember }) => (
    <TouchableOpacity>
      <Box bg={cardBgColor} borderRadius={12} p={3} mb={2}>
        <HStack space={3} alignItems="center">
          <Box position="relative">
            <Avatar size="md" source={{ uri: item.avatar }}>
              {item.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box
              position="absolute"
              bottom={0}
              right={0}
              w={3}
              h={3}
              borderRadius="full"
              bg={item.isOnline ? colors.success[500] : colors.gray[400]}
              borderWidth={2}
              borderColor={cardBgColor}
            />
          </Box>
          
          <VStack flex={1}>
            <Text style={textStyles.h4} color={textColor} fontWeight="500">
              {item.name}
            </Text>
            <Text style={textStyles.caption} color={colors.gray[600]}>
              {item.role}
            </Text>
          </VStack>
          
          <IconButton
            icon={<Icon as={IconMC} name="plus" size={5} />}
            variant="ghost"
            size="sm"
            onPress={() => {/* TODO: Assign task to member */}}
          />
        </HStack>
      </Box>
    </TouchableOpacity>
  );

  const categories = ['all', 'Finance', 'Marketing', 'Development', 'HR', 'Research'];
  const priorities = ['all', 'urgent', 'high', 'medium', 'low'];

  return (
    <Box flex={1} bg={bgColor} safeArea>
      {/* Header */}
      <HStack
        bg={cardBgColor}
        px={4}
        py={3}
        alignItems="center"
        space={3}
        shadow={2}
      >
        <IconButton
          icon={<Icon as={IconMC} name="arrow-left" size={6} />}
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
        
        <Text style={textStyles.h3} color={textColor} fontWeight="600" flex={1}>
          Tasks
        </Text>
        
        <IconButton
          icon={<Icon as={IconMC} name="plus" size={6} />}
          onPress={handleCreateTask}
          variant="ghost"
        />
        
        <IconButton
          icon={<Icon as={IconMC} name="dots-vertical" size={6} />}
          onPress={() => {/* TODO: Open task options */}}
          variant="ghost"
        />
      </HStack>

      {/* Search Bar */}
      <Box px={4} py={3}>
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          borderRadius={20}
          bg={colors.gray[100]}
          borderWidth={0}
          InputLeftElement={
            <Icon as={IconMC} name="magnify" size={5} color={colors.gray[600]} ml={3} />
          }
        />
      </Box>

      {/* Filters */}
      <Box px={4} mb={3}>
        <VStack space={2}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space={2}>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  bg={selectedCategory === category ? colors.primary[500] : colors.gray[200]}
                  px={4}
                  py={2}
                  borderRadius={20}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={textStyles.body}
                    color={selectedCategory === category ? colors.white[500] : colors.gray[600]}
                    fontWeight="500"
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </HStack>
          </ScrollView>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space={2}>
              {priorities.map((priority) => (
                <Pressable
                  key={priority}
                  bg={selectedPriority === priority ? colors.primary[500] : colors.gray[200]}
                  px={4}
                  py={2}
                  borderRadius={20}
                  onPress={() => setSelectedPriority(priority)}
                >
                  <Text
                    style={textStyles.body}
                    color={selectedPriority === priority ? colors.white[500] : colors.gray[600]}
                    fontWeight="500"
                  >
                    {priority}
                  </Text>
                </Pressable>
              ))}
            </HStack>
          </ScrollView>
        </VStack>
      </Box>

      {/* Tabs */}
      <HStack px={4} space={2} mb={3}>
        <Pressable
          flex={1}
          bg={activeTab === 'my-tasks' ? colors.primary[500] : colors.gray[200]}
          py={2}
          borderRadius={20}
          onPress={() => setActiveTab('my-tasks')}
        >
          <Text
            style={textStyles.body}
            color={activeTab === 'my-tasks' ? colors.white[500] : colors.gray[600]}
            textAlign="center"
            fontWeight="500"
          >
            My Tasks
          </Text>
        </Pressable>
        
        <Pressable
          flex={1}
          bg={activeTab === 'assigned' ? colors.primary[500] : colors.gray[200]}
          py={2}
          borderRadius={20}
          onPress={() => setActiveTab('assigned')}
        >
          <Text
            style={textStyles.body}
            color={activeTab === 'assigned' ? colors.white[500] : colors.gray[600]}
            textAlign="center"
            fontWeight="500"
          >
            Assigned
          </Text>
        </Pressable>
        
        <Pressable
          flex={1}
          bg={activeTab === 'team' ? colors.primary[500] : colors.gray[200]}
          py={2}
          borderRadius={20}
          onPress={() => setActiveTab('team')}
        >
          <Text
            style={textStyles.body}
            color={activeTab === 'team' ? colors.white[500] : colors.gray[600]}
            textAlign="center"
            fontWeight="500"
          >
            Team
          </Text>
        </Pressable>
        
        <Pressable
          flex={1}
          bg={activeTab === 'completed' ? colors.primary[500] : colors.gray[200]}
          py={2}
          borderRadius={20}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={textStyles.body}
            color={activeTab === 'completed' ? colors.white[500] : colors.gray[600]}
            textAlign="center"
            fontWeight="500"
          >
            Completed
          </Text>
        </Pressable>
      </HStack>

      {/* Content */}
      <Box flex={1} px={4}>
        {isLoading ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Spinner size="lg" color={colors.primary[500]} />
            <Text style={textStyles.body} color={colors.gray[600]} mt={2}>
              Loading tasks...
            </Text>
          </Box>
        ) : activeTab === 'team' ? (
          <FlatList
            data={teamMembers}
            renderItem={renderTeamMember}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={getFilteredTasks()}
            renderItem={renderTask}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Box>

      {/* Create Task Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Text style={textStyles.h3} color={textColor}>
              Create New Task
            </Text>
          </ModalHeader>
          <ModalBody>
            <VStack space={4}>
              <Input
                placeholder="Task title..."
                borderRadius={8}
                bg={colors.gray[100]}
                borderWidth={0}
              />
              
              <TextArea
                placeholder="Task description..."
                borderRadius={8}
                bg={colors.gray[100]}
                borderWidth={0}
                h={80}
                autoCompleteType={undefined}
              />
              
              <HStack space={2}>
                <Select
                  placeholder="Category"
                  flex={1}
                  borderRadius={8}
                  bg={colors.gray[100]}
                  borderWidth={0}
                  _selectedItem={{
                    bg: colors.primary[100],
                    endIcon: <CheckIcon size={5} />,
                  }}
                >
                  {categories.slice(1).map((category) => (
                    <Select.Item key={category} label={category} value={category} />
                  ))}
                </Select>
                
                <Select
                  placeholder="Priority"
                  flex={1}
                  borderRadius={8}
                  bg={colors.gray[100]}
                  borderWidth={0}
                  _selectedItem={{
                    bg: colors.primary[100],
                    endIcon: <CheckIcon size={5} />,
                  }}
                >
                  {priorities.slice(1).map((priority) => (
                    <Select.Item key={priority} label={priority} value={priority} />
                  ))}
                </Select>
              </HStack>
              
              <Select
                placeholder="Assign to..."
                borderRadius={8}
                bg={colors.gray[100]}
                borderWidth={0}
                _selectedItem={{
                  bg: colors.primary[100],
                  endIcon: <CheckIcon size={5} />,
                }}
              >
                {teamMembers.map((member) => (
                  <Select.Item key={member.id} label={member.name} value={member.name} />
                ))}
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onPress={onCreateClose} mr={3}>
              Cancel
            </Button>
            <Button onPress={onCreateClose}>
              Create Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TaskManagementScreen; 
