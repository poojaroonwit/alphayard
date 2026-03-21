import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CoolIcon from '../common/CoolIcon';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: string;
  notes?: string;
  icon: string;
}

const PET_TYPES = [
  { label: 'Dog', icon: 'dog' },
  { label: 'Cat', icon: 'cat' },
  { label: 'Bird', icon: 'bird' },
  { label: 'Fish', icon: 'fish' },
  { label: 'Rabbit', icon: 'rabbit' },
  { label: 'Hamster', icon: 'rodent' },
  { label: 'Turtle', icon: 'turtle' },
  { label: 'Other', icon: 'paw' },
];

interface CirclePetsTabProps {
  circleId?: string;
}

export const CirclePetsTab: React.FC<CirclePetsTabProps> = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState(PET_TYPES[0]);
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setSelectedType(PET_TYPES[0]);
    setBreed('');
    setAge('');
    setNotes('');
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    const pet: Pet = {
      id: Date.now().toString(),
      name: name.trim(),
      type: selectedType.label,
      icon: selectedType.icon,
      breed: breed.trim() || undefined,
      age: age.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    setPets(prev => [pet, ...prev]);
    resetForm();
    setShowAddDrawer(false);
  };

  const handleRemove = (id: string) => {
    setPets(prev => prev.filter(p => p.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Circle Pets</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddDrawer(true)}>
          <CoolIcon name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Pet</Text>
        </TouchableOpacity>
      </View>

      {/* Pet List */}
      {pets.length === 0 ? (
        <View style={styles.emptyState}>
          <CoolIcon name="paw" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No pets yet</Text>
          <Text style={styles.emptySubtitle}>Add your circle's furry friends here</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {pets.map(pet => (
            <View key={pet.id} style={styles.petCard}>
              <View style={styles.petEmoji}>
                <CoolIcon name={pet.icon as any} size={24} color="#FA7272" />
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petMeta}>
                  {pet.type}{pet.breed ? ` · ${pet.breed}` : ''}{pet.age ? ` · ${pet.age}` : ''}
                </Text>
                {pet.notes ? <Text style={styles.petNotes}>{pet.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleRemove(pet.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <CoolIcon name="close" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Pet Drawer */}
      <Modal visible={showAddDrawer} transparent animationType="slide">
        <Pressable style={styles.backdrop} onPress={() => { setShowAddDrawer(false); resetForm(); }} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.drawerWrapper}
          pointerEvents="box-none"
        >
          <View style={styles.drawer}>
            <View style={styles.drawerHandle} />
            <Text style={styles.drawerTitle}>Add a Pet</Text>

            {/* Type Picker */}
            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {PET_TYPES.map(pt => (
                <TouchableOpacity
                  key={pt.label}
                  style={[styles.typeChip, selectedType.label === pt.label && styles.typeChipActive]}
                  onPress={() => setSelectedType(pt)}
                >
                  <CoolIcon name={pt.icon as any} size={16} color={selectedType.label === pt.label ? '#FA7272' : '#6B7280'} />
                  <Text style={[styles.typeChipLabel, selectedType.label === pt.label && styles.typeChipLabelActive]}>
                    {pt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name */}
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Buddy"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            {/* Breed & Age row */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Breed</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Labrador"
                  placeholderTextColor="#94A3B8"
                  value={breed}
                  onChangeText={setBreed}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2 years"
                  placeholderTextColor="#94A3B8"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Allergies, vet info, personality..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {/* Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowAddDrawer(false); resetForm(); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, !name.trim() && styles.confirmBtnDisabled]}
                onPress={handleAdd}
                disabled={!name.trim()}
              >
                <Text style={styles.confirmBtnText}>Add Pet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FA7272',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  petEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  petMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  petNotes: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  // Drawer
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawerWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FA7272',
  },
  typeChipLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeChipLabelActive: {
    color: '#FA7272',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 14,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FA7272',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
