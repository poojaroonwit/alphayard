import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import IconMC from 'react-native-vector-icons/MaterialCommunityIcons';

interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
}

interface ShoppingListWidgetProps {
  items: ShoppingItem[];
  onItemPress?: (item: ShoppingItem) => void;
}

export const ShoppingListWidget: React.FC<ShoppingListWidgetProps> = ({
  items,
  onItemPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
      </View>
      
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <IconMC name="shopping" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No items in shopping list</Text>
        </View>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={[styles.itemName, item.completed && styles.completedItem]}>
                {item.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  itemsList: {
    gap: 8,
  },
  item: {
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  completedItem: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
}); 
