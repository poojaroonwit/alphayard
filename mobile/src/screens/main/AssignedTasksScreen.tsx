import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';
import IconIon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import PopupModal from '../../components/common/PopupModal';

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'work' | 'personal' | 'hourse' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  isCompleted: boolean;
  assignedBy: string;
  assignedTo: string;
}

const AssignedTasksScreen: React.FC = () => {
  const navigation = useNavigation();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'work' | 'personal' | 'hourse' | 'urgent'>('work');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

  const [activeMainTab, setActiveMainTab] = useState<'assigned' | 'created'>('assigned');

  // Mock tasks data
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review quarterly budget',
      description: 'Analyze Q3 financial reports and prepare budget presentation',
      category: 'work',
      priority: 'high',
      dueDate: '2024-01-15T14:30:00',
      isCompleted: false,
      assignedBy: 'Sarah Johnson',
      assignedTo: 'You',
    },
    {
      id: '2',
      title: 'hourse dinner planning',
      description: 'Plan menu and grocery shopping for weekend hourse dinner',
      category: 'hourse',
      priority: 'medium',
      dueDate: '2024-01-20T18:00:00',
      isCompleted: false,
      assignedBy: 'Mom',
      assignedTo: 'You',
    },
    {
      id: '3',
      title: 'Fix kitchen sink',
      description: 'Call plumber and schedule repair for leaking kitchen sink',
      category: 'personal',
      priority: 'high',
      dueDate: '2024-01-12T09:00:00',
      isCompleted: true,
      assignedBy: 'Dad',
      assignedTo: 'You',
    },
    {
      id: '4',
      title: 'Prepare presentation slides',
      description: 'Create PowerPoint slides for client meeting next week',
      category: 'work',
      priority: 'medium',
      dueDate: '2024-01-18T16:00:00',
      isCompleted: false,
      assignedBy: 'Manager',
      assignedTo: 'You',
    },
    {
      id: '5',
      title: 'Emergency contact update',
      description: 'Update emergency contact information in HR system',
      category: 'urgent',
      priority: 'high',
      dueDate: '2024-01-10T12:00:00',
      isCompleted: false,
      assignedBy: 'HR Department',
      assignedTo: 'You',
    },
  ]);



  const handleTaskToggle = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, isCompleted: !task.isCompleted }
        : task
    ));
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        category: newTaskCategory,
        priority: newTaskPriority,
        dueDate: newTaskDueDate,
        isCompleted: false,
        assignedBy: 'You',
        assignedTo: 'You',
      };

      setTasks([newTask, ...tasks]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskCategory('work');
      setNewTaskPriority('medium');
      setNewTaskDueDate(new Date().toISOString().split('T')[0]);
      setShowAddTask(false);
    }
  };

  const handleCloseAddTask = () => {
    setShowAddTask(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskCategory('work');
    setNewTaskPriority('medium');
    setNewTaskDueDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF5A5A';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return '#666666';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return '#2196F3';
      case 'personal': return '#9C27B0';
      case 'hourse': return '#FF9800';
      case 'urgent': return '#F44336';
      default: return '#666666';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return 'briefcase';
      case 'personal': return 'account';
      case 'hourse': return 'home';
      case 'urgent': return 'alert';
      default: return 'checkbox-blank-circle';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const taskDate = new Date(dateString);
    const diff = now.getTime() - taskDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return taskDate.toLocaleDateString();
  };

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  const handleAssignTask = () => {
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
  };

  const handleAssignToFamilyMember = (memberName: string) => {
    if (selectedTask) {
      // Update the task assignment
      const updatedTasks = tasks.map(task =>
        task.id === selectedTask.id
          ? { ...task, assignedTo: memberName }
          : task
      );
      setTasks(updatedTasks);
      setShowAssignModal(false);
      setShowTaskDetail(false);
      setSelectedTask(null);
    }
  };

  const filteredTasks = tasks;

  const renderTask = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      style={styles.taskItem}
      onPress={() => handleTaskPress(task)}
    >
      <TouchableOpacity
        style={styles.taskCheckbox}
        onPress={(e) => {
          e.stopPropagation();
          handleTaskToggle(task.id);
        }}
      >
        <IconIon
          name={task.isCompleted ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={task.isCompleted ? "#4CAF50" : "#666666"}
        />
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={[
            styles.taskTitle,
            { textDecorationLine: task.isCompleted ? 'line-through' : 'none' }
          ]}>
            {task.title}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteTask(task.id);
            }}
          >
            <IconIon name="trash-outline" size={20} color="#FF5A5A" />
          </TouchableOpacity>
        </View>

        <Text style={[
          styles.taskDescription,
          { textDecorationLine: task.isCompleted ? 'line-through' : 'none' }
        ]}>
          {task.description}
        </Text>

        <View style={styles.taskMeta}>
          <View style={styles.taskInfo}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(task.category) }]}>
              <IconMC name={getCategoryIcon(task.category)} size={12} color="#FFFFFF" />
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>

            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
              <Text style={styles.priorityText}>{task.priority}</Text>
            </View>
          </View>

          <View style={styles.taskDetails}>
            <Text style={styles.dueDate}>Due {formatTimeAgo(task.dueDate)}</Text>
            <Text style={styles.assignedBy}>Assigned by: {task.assignedBy}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#FA7272', '#FFBBB4', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#FF9192" />

      {/* Header without background gradient */}
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <IconIon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assigned Tasks</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        {/* Main Content Area with Rounded Top Borders */}
        <View style={styles.mainContentCard}>
          {/* Main Tabs - Now inside the card */}
          <View style={styles.mainTabsContainer}>
            <TouchableOpacity
              style={[styles.mainTab, activeMainTab === 'assigned' && styles.mainTabActive]}
              onPress={() => setActiveMainTab('assigned')}
            >
              <IconMC
                name="clipboard-list"
                size={20}
                color={activeMainTab === 'assigned' ? '#FFFFFF' : '#666666'}
              />
              <Text style={[styles.mainTabText, activeMainTab === 'assigned' && styles.mainTabTextActive]}>
                Assigned to Me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mainTab, activeMainTab === 'created' && styles.mainTabActive]}
              onPress={() => setActiveMainTab('created')}
            >
              <IconMC
                name="account-edit"
                size={20}
                color={activeMainTab === 'created' ? '#FFFFFF' : '#666666'}
              />
              <Text style={[styles.mainTabText, activeMainTab === 'created' && styles.mainTabTextActive]}>
                Created by Me
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tasks List */}
          <ScrollView
            style={styles.tasksContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredTasks.length > 0 ? (
              filteredTasks.map(renderTask)
            ) : (
              <View style={styles.emptyState}>
                <IconIon name="checkmark-circle-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyStateTitle}>No tasks found</Text>
                <Text style={styles.emptyStateText}>
                  You have no tasks assigned to you.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => setShowAddTask(true)}
      >
        <IconIon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <PopupModal
        visible={showAddTask}
        onClose={handleCloseAddTask}
        title="Create New Task"
        subtitle="Add a new task to your list"
        footer={
          <>
            <TouchableOpacity style={styles.modalCancelButton} onPress={handleCloseAddTask}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                { opacity: newTaskTitle.trim() ? 1 : 0.5 }
              ]}
              onPress={handleAddTask}
              disabled={!newTaskTitle.trim()}
            >
              <Text style={styles.modalSaveButtonText}>Create Task</Text>
            </TouchableOpacity>
          </>
        }
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Task Title */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Task Title *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter task title"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
          </View>

          {/* Task Description */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Add a description (optional)"
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category Selection */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Category</Text>
            <View style={styles.modalCategoryGrid}>
              {(['work', 'personal', 'hourse', 'urgent'] as const).map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.modalCategoryOption,
                    newTaskCategory === category && styles.modalCategorySelected
                  ]}
                  onPress={() => setNewTaskCategory(category)}
                >
                  <IconMC
                    name={getCategoryIcon(category)}
                    size={20}
                    color={newTaskCategory === category ? "#FFFFFF" : "#666666"}
                  />
                  <Text style={[
                    styles.modalCategoryText,
                    newTaskCategory === category && styles.modalCategoryTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Selection */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Priority</Text>
            <View style={styles.modalPriorityGrid}>
              {(['low', 'medium', 'high'] as const).map(priority => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.modalPriorityOption,
                    newTaskPriority === priority && styles.modalPrioritySelected,
                    { borderColor: getPriorityColor(priority) }
                  ]}
                  onPress={() => setNewTaskPriority(priority)}
                >
                  <View style={[
                    styles.modalPriorityDot,
                    { backgroundColor: getPriorityColor(priority) }
                  ]} />
                  <Text style={[
                    styles.modalPriorityText,
                    newTaskPriority === priority && styles.modalPriorityTextSelected
                  ]}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Due Date</Text>
            <TouchableOpacity style={styles.modalDateButton}>
              <IconMC name="calendar" size={20} color="#666666" />
              <Text style={styles.modalDateText}>{newTaskDueDate}</Text>
              <IconIon name="chevron-down" size={16} color="#666666" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </PopupModal>

      {/* Task Detail Modal */}
      <PopupModal
        visible={showTaskDetail}
        onClose={handleCloseTaskDetail}
        title="Task Details"
      >
        {selectedTask && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.taskDetailContainer}>
              {/* Task Header */}
              <View style={styles.taskDetailHeader}>
                <View style={styles.taskDetailCheckbox}>
                  <IconIon
                    name={selectedTask.isCompleted ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={selectedTask.isCompleted ? "#4CAF50" : "#666666"}
                  />
                </View>
                <View style={styles.taskDetailTitleContainer}>
                  <Text style={[
                    styles.taskDetailTitle,
                    { textDecorationLine: selectedTask.isCompleted ? 'line-through' : 'none' }
                  ]}>
                    {selectedTask.title}
                  </Text>
                  <View style={styles.taskDetailBadges}>
                    <View style={[styles.taskDetailCategoryBadge, { backgroundColor: getCategoryColor(selectedTask.category) }]}>
                      <IconMC name={getCategoryIcon(selectedTask.category)} size={12} color="#FFFFFF" />
                      <Text style={styles.taskDetailCategoryText}>{selectedTask.category}</Text>
                    </View>
                    <View style={[styles.taskDetailPriorityBadge, { backgroundColor: getPriorityColor(selectedTask.priority) }]}>
                      <Text style={styles.taskDetailPriorityText}>{selectedTask.priority}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Task Description */}
              <View style={styles.taskDetailSection}>
                <Text style={styles.taskDetailSectionTitle}>Description</Text>
                <Text style={[
                  styles.taskDetailDescription,
                  { textDecorationLine: selectedTask.isCompleted ? 'line-through' : 'none' }
                ]}>
                  {selectedTask.description}
                </Text>
              </View>

              {/* Task Details */}
              <View style={styles.taskDetailSection}>
                <Text style={styles.taskDetailSectionTitle}>Details</Text>
                <View style={styles.taskDetailInfo}>
                  <View style={styles.taskDetailInfoRow}>
                    <IconMC name="calendar" size={16} color="#666666" />
                    <Text style={styles.taskDetailInfoText}>Due: {formatTimeAgo(selectedTask.dueDate)}</Text>
                  </View>
                  <View style={styles.taskDetailInfoRow}>
                    <IconMC name="account" size={16} color="#666666" />
                    <Text style={styles.taskDetailInfoText}>Assigned by: {selectedTask.assignedBy}</Text>
                  </View>
                  <View style={styles.taskDetailInfoRow}>
                    <IconMC name="account-check" size={16} color="#666666" />
                    <Text style={styles.taskDetailInfoText}>Assigned to: {selectedTask.assignedTo}</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.taskDetailActions}>
                <TouchableOpacity
                  style={styles.taskDetailActionButton}
                  onPress={() => handleTaskToggle(selectedTask.id)}
                >
                  <IconIon
                    name={selectedTask.isCompleted ? "refresh" : "checkmark"}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.taskDetailActionText}>
                    {selectedTask.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.taskDetailActionButton, styles.taskDetailAssignButton]}
                  onPress={handleAssignTask}
                >
                  <IconMC name="account-plus" size={20} color="#FFFFFF" />
                  <Text style={styles.taskDetailActionText}>Reassign Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </PopupModal>

      {/* Assign Task Modal */}
      <PopupModal
        visible={showAssignModal}
        onClose={handleCloseAssignModal}
        title="Assign Task"
      >
        <View style={styles.assignModalContainer}>
          <Text style={styles.assignModalSubtitle}>Select a hourse member to assign this task to:</Text>

          <View style={styles.familyMembersList}>
            {['Mom', 'Dad', 'Sister', 'Brother', 'Grandma', 'Grandpa'].map((member) => (
              <TouchableOpacity
                key={member}
                style={styles.familyMemberOption}
                onPress={() => handleAssignToFamilyMember(member)}
              >
                <View style={styles.familyMemberAvatar}>
                  <IconMC name="account" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.familyMemberName}>{member}</Text>
                <IconIon name="chevron-forward" size={16} color="#666666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </PopupModal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20, // More spacing from the top of the card
    gap: 8,
    backgroundColor: 'transparent',
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  mainTabActive: {
    backgroundColor: '#FA7272',
    borderBottomWidth: 3,
    borderBottomColor: '#FFFFFF',
    shadowColor: '#FF8C8C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
  },
  mainTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  mainContentCard: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  tasksContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4, // Reduced since tabs are now inside the card above
  },

  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  taskInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  taskDetails: {
    alignItems: 'flex-end',
  },
  dueDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  assignedBy: {
    fontSize: 11,
    color: '#999999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 100, // Increased from 30 to 100 to position above bottom navigation
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000, // Ensure it's above other elements
  },
  // Modal Styles
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  modalCategorySelected: {
    backgroundColor: '#FF6B6B',
  },
  modalCategoryText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  modalCategoryTextSelected: {
    color: '#FFFFFF',
  },
  modalPriorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  modalPriorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  modalPrioritySelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  modalPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalPriorityText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  modalPriorityTextSelected: {
    color: '#FFFFFF',
  },
  modalDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  modalDateText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  modalCancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666666',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    marginLeft: 8,
  },
  modalSaveButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Task Detail Modal Styles
  taskDetailContainer: {
    padding: 20,
  },
  taskDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  taskDetailCheckbox: {
    marginRight: 16,
    marginTop: 4,
  },
  taskDetailTitleContainer: {
    flex: 1,
  },
  taskDetailTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  taskDetailBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  taskDetailCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  taskDetailCategoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  taskDetailPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskDetailPriorityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  taskDetailSection: {
    marginBottom: 24,
  },
  taskDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  taskDetailDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  taskDetailInfo: {
    gap: 12,
  },
  taskDetailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskDetailInfoText: {
    fontSize: 14,
    color: '#666666',
  },
  taskDetailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  taskDetailActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    gap: 8,
  },
  taskDetailAssignButton: {
    backgroundColor: '#FF5A5A',
  },
  taskDetailActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Assign Task Modal Styles
  assignModalContainer: {
    padding: 20,
  },
  assignModalSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  familyMembersList: {
    gap: 12,
  },
  familyMemberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  familyMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5A5A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  familyMemberName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
});

export default AssignedTasksScreen; 