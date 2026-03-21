import React, { useState, useEffect, useMemo } from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as HeroIcons from 'react-native-heroicons/outline';
import * as SolidIcons from 'react-native-heroicons/solid';
import { homeStyles } from '../../styles/homeStyles';
import { locationSearchService, LocationDetails } from '../../services/locationSearchService';
import { circleApi } from '../../services/api/circle';
import { categoryService, Category } from '../../services/categoryService';

// --- Interfaces ---

interface ShoppingItem {
  id: string;
  item: string;
  quantity: string;
  category: string;
  completed: boolean;
  location?: string;
  targetDate?: string;
  assignedTo?: string;
}

interface ShoppingDrawerProps {
  visible: boolean;
  onClose: () => void;
  onAddItem: (item: ShoppingItem) => void;
}

// --- Icons Helper ---
// Map category keys to HeroIcons
const getCategoryIcon = (key: string, size: number, color: string) => {
  const IconComponent = {
    dairy: HeroIcons.BeakerIcon, // closest
    bakery: HeroIcons.CakeIcon,
    produce: HeroIcons.SunIcon, // generic for nature
    meat: HeroIcons.FireIcon, // cooking?
    frozen: HeroIcons.SnowflakeIcon, // doesnt exist in outline v2? Let's check. Assuming v2.
    // If specific icons don't exist, fallback to TagIcon or similar.
    // Using a safer mapping or generic icons.
    pantry: HeroIcons.ArchiveBoxIcon,
    beverages: HeroIcons.BeakerIcon,
    snacks: HeroIcons.CakeIcon,
    pharmacy: HeroIcons.PlusCircleIcon,
    electronics: HeroIcons.DevicePhoneMobileIcon,
    clothing: HeroIcons.TagIcon,
    books: HeroIcons.BookOpenIcon,
    toys: HeroIcons.PuzzlePieceIcon,
    home: HeroIcons.HomeIcon,
    garden: HeroIcons.SunIcon,
    sports: HeroIcons.TrophyIcon,
    beauty: HeroIcons.SparklesIcon,
    automotive: HeroIcons.TruckIcon,
    office: HeroIcons.BriefcaseIcon,
    jewelry: HeroIcons.SparklesIcon,
    pets: HeroIcons.HeartIcon,
    baby: HeroIcons.FaceSmileIcon,
    health: HeroIcons.HeartIcon,
    travel: HeroIcons.GlobeAltIcon,
    music: HeroIcons.MusicalNoteIcon,
    movies: HeroIcons.FilmIcon,
    games: HeroIcons.PuzzlePieceIcon,
    tools: HeroIcons.WrenchIcon,
  }[key] || HeroIcons.TagIcon;

  return <IconComponent size={size} color={color} />;
};

// --- Constants ---

const CATEGORIES = [
  { key: 'dairy', name: 'Dairy', color: ['#E3F2FD', '#BBDEFB'] },
  { key: 'bakery', name: 'Bakery', color: ['#FFF3E0', '#FFE0B2'] },
  { key: 'produce', name: 'Produce', color: ['#E8F5E8', '#C8E6C9'] },
  { key: 'meat', name: 'Meat', color: ['#FFEBEE', '#FFCDD2'] },
  { key: 'frozen', name: 'Frozen', color: ['#E1F5FE', '#B3E5FC'] },
  { key: 'pantry', name: 'Pantry', color: ['#F3E5F5', '#E1BEE7'] },
  { key: 'beverages', name: 'Beverages', color: ['#E0F2F1', '#B2DFDB'] },
  { key: 'snacks', name: 'Snacks', color: ['#FFF8E1', '#FFECB3'] },
  { key: 'pharmacy', name: 'Pharmacy', color: ['#FCE4EC', '#F8BBD9'] },
  { key: 'electronics', name: 'Electronics', color: ['#E8EAF6', '#C5CAE9'] },
  { key: 'clothing', name: 'Clothing', color: ['#F1F8E9', '#DCEDC8'] },
  { key: 'books', name: 'Books', color: ['#FFFDE7', '#FFF9C4'] },
  { key: 'toys', name: 'Toys', color: ['#FFE0B2', '#FFCC80'] },
  { key: 'home', name: 'Home', color: ['#E0F2F1', '#B2DFDB'] },
  { key: 'garden', name: 'Garden', color: ['#E8F5E8', '#C8E6C9'] },
  { key: 'sports', name: 'Sports', color: ['#E3F2FD', '#BBDEFB'] },
  { key: 'beauty', name: 'Beauty', color: ['#FCE4EC', '#F8BBD9'] },
  { key: 'automotive', name: 'Automotive', color: ['#F3E5F5', '#E1BEE7'] },
  { key: 'office', name: 'Office', color: ['#E8EAF6', '#C5CAE9'] },
  { key: 'jewelry', name: 'Jewelry', color: ['#FFF8E1', '#FFECB3'] },
  { key: 'pets', name: 'Pets', color: ['#F1F8E9', '#DCEDC8'] },
  { key: 'baby', name: 'Baby', color: ['#FFE0B2', '#FFCC80'] },
  { key: 'health', name: 'Health', color: ['#FFEBEE', '#FFCDD2'] },
  { key: 'travel', name: 'Travel', color: ['#E1F5FE', '#B3E5FC'] },
  { key: 'music', name: 'Music', color: ['#F3E5F5', '#E1BEE7'] },
  { key: 'movies', name: 'Movies', color: ['#E8EAF6', '#C5CAE9'] },
  { key: 'games', name: 'Games', color: ['#FFF3E0', '#FFE0B2'] },
  { key: 'tools', name: 'Tools', color: ['#F5F5F5', '#E0E0E0'] },
];

const TARGET_DATES = [
  'Today',
  'Tomorrow',
  'This Weekend',
  'Next Week',
  'Next Month',
  'Custom Date'
];

// --- Sub-Components ---

const DrawerHeader = ({ 
  selectedCategory, 
  onClose 
}: { 
  selectedCategory: string, 
  onClose: () => void 
}) => {
  const categoryData = CATEGORIES.find(cat => cat.key === selectedCategory);
  
  return (
    <LinearGradient
      colors={categoryData?.color || ['#FF9A9E', '#FECFEF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={homeStyles.shoppingDrawerHeader}
    >
      <View style={homeStyles.shoppingDrawerHeaderContent}>
        <View style={homeStyles.shoppingDrawerTitleRow}>
          <View style={[homeStyles.shoppingDrawerIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            {selectedCategory ? 
              getCategoryIcon(selectedCategory, 24, '#FFFFFF') :
              <HeroIcons.ShoppingBagIcon size={24} color="#FFFFFF" />
            }
          </View>
          <View style={homeStyles.shoppingDrawerTitleContainer}>
            <Text style={homeStyles.shoppingDrawerTitle}>New Item</Text>
            <Text style={homeStyles.shoppingDrawerSubtitle}>
              {categoryData?.name || 'Add to your list'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={homeStyles.shoppingDrawerCloseButton} 
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <HeroIcons.XMarkIcon size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const SectionHeader = ({ title, required }: { title: string, required?: boolean }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 16 }}>
    <Text style={homeStyles.shoppingDrawerFieldLabel}>{title}</Text>
    {required && <Text style={{ color: '#EF4444', marginLeft: 4 }}>*</Text>}
  </View>
);

const CategoryGrid = ({ 
  selectedCategory, 
  onSelect 
}: { 
  selectedCategory: string, 
  onSelect: (id: string, name: string) => void 
}) => {
  const [query, setQuery] = useState('');
  
  const filteredCategories = useMemo(() => {
    if (!query) return CATEGORIES;
    return CATEGORIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <View style={homeStyles.shoppingDrawerField}>
      <SectionHeader title="Category" required />
      <View style={homeStyles.shoppingDrawerSearchContainer}>
        <HeroIcons.MagnifyingGlassIcon size={20} color="#9CA3AF" style={{ marginLeft: 12 }} />
        <TextInput
          style={[homeStyles.shoppingDrawerSearchInput, { paddingLeft: 8 }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search categories..."
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View style={{ maxHeight: 200, marginTop: 12 }}>
        <FlatList
          data={filteredCategories}
          numColumns={2}
          nestedScrollEnabled
          scrollEnabled={true}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8 }}
          columnWrapperStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                homeStyles.shoppingDrawerCategoryGridItem,
                selectedCategory === item.key && homeStyles.shoppingDrawerCategoryGridItemSelected,
                { flex: 1 }
              ]}
              onPress={() => onSelect(item.key, item.name)}
            >
              <View style={[
                homeStyles.shoppingDrawerCategoryGridIcon,
                { backgroundColor: selectedCategory === item.key ? item.color[0] : '#F3F4F6' }
              ]}>
                {getCategoryIcon(item.key, 20, selectedCategory === item.key ? '#FFFFFF' : '#6B7280')}
              </View>
              <Text style={[
                homeStyles.shoppingDrawerCategoryGridText,
                selectedCategory === item.key && homeStyles.shoppingDrawerCategoryGridTextSelected
              ]}>
                {item.name}
              </Text>
              {selectedCategory === item.key && (
                <SolidIcons.CheckCircleIcon size={16} color={item.color[1]} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

const LocationSelector = ({ 
  selectedLocation, 
  onSelect 
}: { 
  selectedLocation: string, 
  onSelect: (loc: string) => void 
}) => {
  const [query, setQuery] = useState(selectedLocation);
  const [results, setResults] = useState<LocationDetails[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!query || query === selectedLocation) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await locationSearchService.searchLocations(query);
        setResults(res);
        setShowResults(true);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, selectedLocation]);

  return (
    <View style={homeStyles.shoppingDrawerField}>
      <SectionHeader title="Location" />
      <View style={homeStyles.shoppingDrawerSearchContainer}>
        <HeroIcons.MapPinIcon size={20} color="#9CA3AF" style={{ marginLeft: 12 }} />
        <TextInput
          style={[homeStyles.shoppingDrawerSearchInput, { paddingLeft: 8 }]}
          value={query}
          onChangeText={(text) => {
             setQuery(text);
             if (text !== selectedLocation) onSelect(text); // update basic text immediately
          }}
          placeholder="Store or place..."
          placeholderTextColor="#9CA3AF"
        />
        {isSearching && <ActivityIndicator size="small" color="#6B7280" style={{ marginRight: 12 }} />}
      </View>
      
      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
            {results.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                style={styles.resultItem}
                onPress={() => {
                  setQuery(loc.name);
                  onSelect(loc.name);
                  setShowResults(false);
                }}
              >
                <HeroIcons.BuildingStorefrontIcon size={16} color="#6B7280" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.resultTitle}>{loc.name}</Text>
                  <Text style={styles.resultAddress} numberOfLines={1}>{loc.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const MemberSelector = ({ 
  selectedAssignee, 
  onSelect 
}: { 
  selectedAssignee: string, 
  onSelect: (name: string) => void 
}) => {
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const { families } = await circleApi.getCircles();
        if (families && families.length > 0) {
          const { members: circleMembers } = await circleApi.getCircleMembers(families[0].id);
          setMembers(circleMembers.map(m => ({
            id: m.userId,
            name: m.user?.firstName || 'Member',
            isOnline: m.status === 'active'
          })));
        }
      } catch (error) {
        console.warn('Failed to load members', error);
      }
    };
    loadMembers();
  }, []);

  return (
    <View style={homeStyles.shoppingDrawerField}>
      <SectionHeader title="Assign To" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.memberItem,
              selectedAssignee === member.name && styles.memberItemSelected
            ]}
            onPress={() => onSelect(member.name === selectedAssignee ? '' : member.name)}
          >
            <View style={[
              styles.memberAvatar,
              { backgroundColor: member.isOnline ? '#10B981' : '#9CA3AF' }
            ]}>
              <Text style={styles.memberInitials}>{member.name.charAt(0)}</Text>
            </View>
            <Text style={[
              styles.memberName,
              selectedAssignee === member.name && styles.memberNameSelected
            ]}>
              {member.name}
            </Text>
            {selectedAssignee === member.name && (
               <View style={styles.selectedBadge}>
                 <HeroIcons.CheckIcon size={10} color="#FFF" />
               </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const DateSelector = ({
  selectedDate,
  onSelect
}: {
  selectedDate: string,
  onSelect: (date: string) => void
}) => {
  const [customDate, setCustomDate] = useState('');

  return (
    <View style={homeStyles.shoppingDrawerField}>
      <SectionHeader title="Target Date" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {TARGET_DATES.map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              homeStyles.shoppingDrawerDateItem,
              selectedDate === date && homeStyles.shoppingDrawerDateItemSelected
            ]}
            onPress={() => onSelect(date)}
          >
            <Text style={[
              homeStyles.shoppingDrawerDateText,
              selectedDate === date && homeStyles.shoppingDrawerDateTextSelected
            ]}>
              {date}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {selectedDate === 'Custom Date' && (
        <TextInput
          style={[homeStyles.shoppingDrawerInput, { marginTop: 8 }]}
          value={customDate}
          onChangeText={setCustomDate}
          onEndEditing={() => onSelect(customDate)} // commit custom date
          placeholder="e.g., Dec 25"
          placeholderTextColor="#9CA3AF"
        />
      )}
    </View>
  );
};

// --- Main Component ---

export const ShoppingDrawer: React.FC<ShoppingDrawerProps> = ({
  visible,
  onClose,
  onAddItem
}) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (visible) {
      setItemName('');
      setQuantity('1');
      setSelectedCategory('');
      setSelectedLocation('');
      setSelectedDate('');
      setSelectedAssignee('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!itemName.trim() || !selectedCategory) {
      Alert.alert('Missing Fields', 'Please enter an item name and select a category.');
      return;
    }

    onAddItem({
      id: Date.now().toString(),
      item: itemName.trim(),
      quantity,
      category: selectedCategory,
      completed: false,
      location: selectedLocation || undefined,
      targetDate: selectedDate || undefined,
      assignedTo: selectedAssignee || undefined
    });

    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        pointerEvents="box-none"
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <View style={homeStyles.shoppingDrawerContainer}>
            <DrawerHeader selectedCategory={selectedCategory} onClose={onClose} />
            
            <ScrollView 
              style={homeStyles.shoppingDrawerContent} 
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={homeStyles.shoppingDrawerField}>
                <SectionHeader title="Item Details" required />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={homeStyles.shoppingDrawerInput}
                      value={itemName}
                      onChangeText={setItemName}
                      placeholder="What do you need?"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={{ width: 80 }}>
                    <TextInput
                      style={[homeStyles.shoppingDrawerInput, { textAlign: 'center' }]}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="Qty"
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              <CategoryGrid 
                selectedCategory={selectedCategory} 
                onSelect={(id) => setSelectedCategory(id)} 
              />

              <LocationSelector 
                selectedLocation={selectedLocation} 
                onSelect={setSelectedLocation} 
              />

              <DateSelector 
                selectedDate={selectedDate} 
                onSelect={setSelectedDate} 
              />

              <MemberSelector 
                selectedAssignee={selectedAssignee} 
                onSelect={setSelectedAssignee} 
              />

              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleSubmit}
              >
                <LinearGradient
                  colors={selectedCategory ? 
                    (CATEGORIES.find(c => c.key === selectedCategory)?.color || ['#FF9A9E', '#FECFEF']) : 
                    ['#9CA3AF', '#6B7280']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButtonGradient}
                >
                  <HeroIcons.PlusCircleIcon size={24} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Item to List</Text>
                </LinearGradient>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- Local Styles ---

const styles = StyleSheet.create({
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -8,
    paddingTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  resultAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  memberItem: {
    alignItems: 'center',
    marginRight: 4,
    opacity: 0.7
  },
  memberItemSelected: {
    opacity: 1
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  memberInitials: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600'
  },
  memberName: {
    fontSize: 12,
    color: '#6B7280'
  },
  memberNameSelected: {
    color: '#111827',
    fontWeight: '600'
  },
  selectedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#10B981',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  addButton: {
    marginTop: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  addButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 8
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5
  }
});
