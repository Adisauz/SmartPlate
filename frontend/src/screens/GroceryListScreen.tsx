import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Toast } from '../components/Toast';
import api from '../utils/api';

type GroceryListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GroceryList'>;

type PantryItem = { id: number; name: string };

// Categories can be re-added later if needed

export const GroceryListScreen = () => {
  const navigation = useNavigation<GroceryListScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.get<PantryItem[]>('/pantry/');
      setItems(res.data);
    } catch (e: any) {
      setToast({ visible: true, message: 'Failed to load pantry', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    const name = newItemName.trim();
    if (!name) {
      setToast({ visible: true, message: 'Enter an item name', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const res = await api.post<PantryItem>('/pantry/', { name });
      setItems((prev) => [res.data, ...prev]);
      setNewItemName('');
      setToast({ visible: true, message: 'Item added', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: 'Failed to add item', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      setLoading(true);
      await api.delete(`/pantry/${id}`);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setToast({ visible: true, message: 'Item removed', type: 'success' });
    } catch (e: any) {
      setToast({ visible: true, message: 'Failed to remove item', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color="#4F46E5" />
              </TouchableOpacity>
              <Text style={styles.title}>Grocery List</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.cartButton}
                onPress={() => {
                  setToast({
                    visible: true,
                    message: 'Order placed successfully',
                    type: 'success',
                  });
                }}
              >
                <Ionicons name="cart" size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Ionicons
                name="search"
                size={20}
                color="#6B7280"
                style={styles.searchIcon}
              />
            </View>
          </View>

          {/* Add Item */}
          <View style={styles.addItemContainer}>
            <View style={styles.addItemRow}>
              <View style={styles.addItemInputContainer}>
                <TextInput
                  style={styles.addItemInput}
                  placeholder="Add pantry item..."
                  value={newItemName}
                  onChangeText={setNewItemName}
                />
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addItem}
                disabled={loading}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pantry Items */}
          <View style={styles.itemsContainer}>
            {filteredItems.map((item) => (
              <View
                key={item.id}
                style={styles.itemCard}
              >
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <View style={styles.itemIcon}>
                      <Ionicons name="cart-outline" size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>
                        {item.name}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteItem(item.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickActionCard, styles.quickActionOrder]}
                onPress={() => {
                  setToast({
                    visible: true,
                    message: 'Order placed successfully',
                    type: 'success',
                  });
                }}
              >
                <Ionicons name="cart" size={24} color="#4F46E5" />
                <Text style={styles.quickActionOrderText}>
                  Order Delivery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionCard, styles.quickActionSave]}
                onPress={() => {
                  setToast({
                    visible: true,
                    message: 'List saved',
                    type: 'success',
                  });
                }}
              >
                <Ionicons name="save" size={24} color="#10B981" />
                <Text style={styles.quickActionSaveText}>
                  Save List
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartButton: {
    width: 40,
    height: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingLeft: 40,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  addItemContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addItemInputContainer: {
    flex: 1,
    position: 'relative',
  },
  addItemInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  addButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  itemsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  quickActionOrder: {
    backgroundColor: '#EEF2FF',
  },
  quickActionSave: {
    backgroundColor: '#D1FAE5',
  },
  quickActionOrderText: {
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 8,
  },
  quickActionSaveText: {
    color: '#059669',
    fontWeight: '500',
    marginTop: 8,
  },
}); 