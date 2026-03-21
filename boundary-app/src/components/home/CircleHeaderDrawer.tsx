import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

interface CircleHeaderDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSwitchCircle: () => void;
  onViewProfile: () => void;
}

export const CircleHeaderDrawer: React.FC<CircleHeaderDrawerProps> = ({
  visible,
  onClose,
  onSwitchCircle,
  onViewProfile,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.handleBar} />
          
          <Text style={styles.title}>Circle Menu</Text>
          
          <TouchableOpacity onPress={onSwitchCircle} style={styles.item}>
            <View style={styles.itemContent}>
              <IconMC name="swap-horizontal" size={24} color="#3B82F6" />
              <Text style={styles.itemText}>Switch circle</Text>
            </View>
            <IconMC name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onViewProfile} style={styles.item}>
            <View style={styles.itemContent}>
              <IconMC name="information-outline" size={24} color="#8B5CF6" />
              <Text style={styles.itemText}>Circle profile</Text>
            </View>
            <IconMC name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    backgroundColor: 'white',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
