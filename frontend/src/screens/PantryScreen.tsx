import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Button,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from '../components/Toast';
import * as ImagePicker from 'expo-image-picker';
import api from '../utils/api';

type PantryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Pantry'>;

type PantryItem = { id: number; name: string };

type DetectedItem = {
  name: string;
  confidence: number;
  yolo_class: string;
};

const categories = [
  { id: '1', name: 'All' },
  { id: '2', name: 'Expiring Soon' },
  { id: '3', name: 'Low Stock' },
  { id: '4', name: 'Canned' },
  { id: '5', name: 'Dry Goods' },
  { id: '6', name: 'Spices' },
];

const addPantryItem = async (name: string) => {
  try {
    await api.post('/pantry/', { name });
  } catch (err) {
    // Handle error
  }
};

export const PantryScreen = () => {
  const navigation = useNavigation<PantryScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const fetchPantryItems = async (searchQuery = '') => {
    try {
      const res = await api.get('/pantry/', { params: { search: searchQuery } });
      setPantryItems(res.data);
    } catch (err) {
      // Handle error
    }
  };

  useEffect(() => {
    fetchPantryItems();
  }, []);

  useEffect(() => {
    fetchPantryItems(searchQuery);
  }, [searchQuery]);

  const getStockLevelColor = (level: string) => {
    switch (level) {
      case 'Low':
        return '#EF4444';
      case 'Good':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const handleAdd = async () => {
    if (!itemName.trim()) return;
    setLoading(true);
    await addPantryItem(itemName.trim());
    setItemName('');
    await fetchPantryItems();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await api.delete(`/pantry/${id}`);
      setPantryItems((prev) => prev.filter((it) => it.id !== id));
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Media library permission is required to select photos');
      return false;
    }
    return true;
  };

  const showImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setShowCameraModal(true);
      detectFoodItems(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setShowCameraModal(true);
      detectFoodItems(result.assets[0].uri);
    }
  };

  const detectFoodItems = async (imageUri: string) => {
    setIsDetecting(true);
    setDetectedItems([]);
    
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'food-image.jpg',
      } as any);

      const response = await api.post('/detect/food-items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setDetectedItems(response.data.detected_items);
        setToast({
          visible: true,
          message: response.data.message,
          type: 'success',
        });
      } else {
        setToast({
          visible: true,
          message: 'No food items detected',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Detection error:', error);
      setToast({
        visible: true,
        message: 'Failed to detect food items',
        type: 'error',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const toggleItemSelection = (itemName: string) => {
    setSelectedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const addSelectedItemsToPantry = async () => {
    if (selectedItems.length === 0) {
      setToast({
        visible: true,
        message: 'Please select items to add',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    let addedCount = 0;

    try {
      for (const itemName of selectedItems) {
        await addPantryItem(itemName);
        addedCount++;
      }

      setToast({
        visible: true,
        message: `Added ${addedCount} item${addedCount > 1 ? 's' : ''} to pantry`,
        type: 'success',
      });

      // Reset and refresh
      setSelectedItems([]);
      setShowCameraModal(false);
      setDetectedItems([]);
      setSelectedImage(null);
      await fetchPantryItems();
    } catch (error) {
      setToast({
        visible: true,
        message: 'Failed to add some items',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const closeCameraModal = () => {
    setShowCameraModal(false);
    setDetectedItems([]);
    setSelectedImage(null);
    setSelectedItems([]);
  };

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
              <Text className="text-2xl font-bold text-gray-900">My Pantry</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="px-4 mb-4">
            <View className="relative">
              <TextInput
                className="w-full px-4 py-3 pl-10 bg-gray-100 rounded-xl"
                placeholder="Search pantry items..."
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

          {/* Category Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 mb-4"
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.name)}
                className={`mr-4 py-2 px-4 rounded-full ${
                  selectedCategory === category.name
                    ? 'bg-indigo-600'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedCategory === category.name
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pantry Items */}
          <View className="px-4 py-4">
            {pantryItems.map((item) => (
              <View
                key={item.id}
                className="bg-gray-50 rounded-xl p-4 mb-4"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="cube-outline" size={20} color="#4F46E5" />
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
                      onPress={() => handleDelete(item.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Add Item Form */}
          <View className="px-4 py-4">
            <TextInput value={itemName} onChangeText={setItemName} placeholder="Name" />
            <Button title={loading ? 'Adding...' : 'Add Item'} onPress={handleAdd} disabled={loading} />
          </View>
        </ScrollView>

        {/* Camera AI Button */}
        <TouchableOpacity
          onPress={showImagePicker}
          className="absolute bottom-6 right-6 w-16 h-16 bg-indigo-600 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Ionicons name="camera" size={28} color="white" />
          <View className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full items-center justify-center">
            <Ionicons name="sparkles" size={12} color="white" />
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />

      {/* Camera AI Detection Modal */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
              <TouchableOpacity onPress={closeCameraModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-gray-900">AI Food Detection</Text>
              <TouchableOpacity 
                onPress={addSelectedItemsToPantry}
                disabled={selectedItems.length === 0 || loading}
                className={`px-4 py-2 rounded-lg ${
                  selectedItems.length > 0 && !loading ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <Text className={`font-medium ${
                  selectedItems.length > 0 && !loading ? 'text-white' : 'text-gray-500'
                }`}>
                  {loading ? 'Adding...' : `Add (${selectedItems.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              {/* Selected Image */}
              {selectedImage && (
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-900 mb-3">Captured Image</Text>
                  <Image 
                    source={{ uri: selectedImage }} 
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Detection Status */}
              {isDetecting && (
                <View className="mb-6 items-center">
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text className="text-gray-600 mt-2">Detecting food items...</Text>
                </View>
              )}

              {/* Detected Items */}
              {detectedItems.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-900 mb-3">
                    Detected Items ({detectedItems.length})
                  </Text>
                  <Text className="text-sm text-gray-600 mb-4">
                    Select items to add to your pantry:
                  </Text>
                  
                  {detectedItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleItemSelection(item.name)}
                      className={`flex-row items-center justify-between p-4 mb-3 rounded-lg border-2 ${
                        selectedItems.includes(item.name) 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <View className="flex-row items-center flex-1">
                        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                          selectedItems.includes(item.name)
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedItems.includes(item.name) && (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-medium text-gray-900">
                            {item.name}
                          </Text>
                          <Text className="text-sm text-gray-600">
                            Confidence: {item.confidence}%
                          </Text>
                        </View>
                      </View>
                      <Ionicons 
                        name="cube-outline" 
                        size={24} 
                        color={selectedItems.includes(item.name) ? "#4F46E5" : "#6B7280"} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* No Items Detected */}
              {!isDetecting && detectedItems.length === 0 && selectedImage && (
                <View className="items-center py-8">
                  <Ionicons name="sad-outline" size={48} color="#9CA3AF" />
                  <Text className="text-lg text-gray-600 mt-2">No food items detected</Text>
                  <Text className="text-sm text-gray-500 text-center mt-1">
                    Try taking another photo with better lighting or different angle
                  </Text>
                  <TouchableOpacity
                    onPress={showImagePicker}
                    className="mt-4 px-6 py-3 bg-indigo-600 rounded-lg"
                  >
                    <Text className="text-white font-medium">Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}; 