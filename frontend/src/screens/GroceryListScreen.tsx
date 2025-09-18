import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
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
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1">
          {/* Header */}
          <View className="px-4 py-4">
            <View className="flex-row items-center mb-4">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3"
              >
                <Ionicons name="chevron-back" size={24} color="#4F46E5" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-900">Grocery List</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center"
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
          <View className="px-4 mb-4">
            <View className="relative">
              <TextInput
                className="w-full px-4 py-3 pl-10 bg-gray-100 rounded-xl"
                placeholder="Search items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <Ionicons
                name="search"
                size={20}
                color="#6B7280"
                style={{ position: 'absolute', left: 12, top: 12 }}
              />
            </View>
          </View>

          {/* Add Item */}
          <View className="px-4 mb-2">
            <View className="flex-row items-center space-x-2">
              <View className="flex-1 relative">
                <TextInput
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl"
                  placeholder="Add pantry item..."
                  value={newItemName}
                  onChangeText={setNewItemName}
                />
              </View>
              <TouchableOpacity
                className="ml-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: '#4F46E5' }}
                onPress={addItem}
                disabled={loading}
              >
                <Text className="text-white font-semibold">Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pantry Items */}
          <View className="px-4 py-4">
            {filteredItems.map((item) => (
              <View
                key={item.id}
                className="bg-gray-50 rounded-xl p-4 mb-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="cart-outline" size={20} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="w-8 h-8 bg-white rounded-full items-center justify-center"
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
          <View className="px-4 py-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity
                className="flex-1 bg-indigo-100 p-4 rounded-xl"
                onPress={() => {
                  setToast({
                    visible: true,
                    message: 'Order placed successfully',
                    type: 'success',
                  });
                }}
              >
                <Ionicons name="cart" size={24} color="#4F46E5" />
                <Text className="text-indigo-600 font-medium mt-2">
                  Order Delivery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-100 p-4 rounded-xl"
                onPress={() => {
                  setToast({
                    visible: true,
                    message: 'List saved',
                    type: 'success',
                  });
                }}
              >
                <Ionicons name="save" size={24} color="#10B981" />
                <Text className="text-green-600 font-medium mt-2">
                  Save List
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Optional: could keep a floating add button in future */}
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