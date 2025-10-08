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
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [editName, setEditName] = useState('');

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
      setToast({ visible: true, message: 'Item deleted', type: 'success' });
      setLoading(false);
    } catch (err) {
      setToast({ visible: true, message: 'Failed to delete item', type: 'error' });
      setLoading(false);
    }
  };

  const handleEdit = (item: PantryItem) => {
    setEditingItem(item);
    setEditName(item.name);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) return;
    try {
      setLoading(true);
      await api.put(`/pantry/${editingItem.id}`, { name: editName.trim() });
      setPantryItems((prev) => 
        prev.map((it) => it.id === editingItem.id ? { ...it, name: editName.trim() } : it)
      );
      setToast({ visible: true, message: 'Item updated', type: 'success' });
      setEditingItem(null);
      setEditName('');
      setLoading(false);
    } catch (err) {
      setToast({ visible: true, message: 'Failed to update item', type: 'error' });
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
      'AI Food Detection',
      'Choose how you want to add an image',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
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
      detectFoodItems(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg', result.assets[0].fileName ?? 'photo');
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
      detectFoodItems(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg', result.assets[0].fileName ?? 'image');
    }
  };

  const detectFoodItems = async (imageUri: string, mimeType: string, fileName: string) => {
    setIsDetecting(true);
    setDetectedItems([]);
    
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);

      // Do not set Content-Type manually; let Axios set the proper multipart boundary
      const response = await api.post('/detect/food-items', formData);

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
              <Text style={styles.title}>My Pantry</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search pantry items..."
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

          {/* Category Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.name)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.name && styles.categoryButtonActive
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.name && styles.categoryTextActive
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pantry Items */}
          <View style={styles.itemsContainer}>
            {pantryItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <View style={styles.itemIcon}>
                      <Ionicons name="cube-outline" size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.itemTextContainer}>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(item)}
                    >
                      <Ionicons name="create-outline" size={20} color="#059669" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
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
          <View style={styles.addForm}>
            <TextInput 
              value={itemName} 
              onChangeText={setItemName} 
              placeholder="Enter item name" 
              style={styles.addInput}
            />
            <Button 
              title={loading ? 'Adding...' : 'Add Item'} 
              onPress={handleAdd} 
              disabled={loading} 
            />
          </View>
        </ScrollView>

        {/* Camera AI Button */}
        <TouchableOpacity
          onPress={showImagePicker}
          style={styles.cameraButton}
        >
          <Ionicons name="camera" size={28} color="white" />
          <View style={styles.aiIndicator}>
            <Ionicons name="sparkles" size={12} color="white" />
          </View>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Edit Item Modal */}
      <Modal
        visible={editingItem !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setEditingItem(null)}
      >
        <TouchableOpacity
          style={styles.editModalOverlay}
          activeOpacity={1}
          onPress={() => setEditingItem(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Item</Text>
                <TouchableOpacity onPress={() => setEditingItem(null)}>
                  <Ionicons name="close-circle" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.editModalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Item name"
                autoFocus
              />
              
              <TouchableOpacity
                style={styles.editModalSaveButton}
                onPress={handleSaveEdit}
                disabled={loading || !editName.trim()}
              >
                <Text style={styles.editModalSaveButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeCameraModal}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>AI Food Detection</Text>
              <TouchableOpacity 
                onPress={addSelectedItemsToPantry}
                disabled={selectedItems.length === 0 || loading}
                style={[
                  styles.addSelectedButton,
                  (selectedItems.length > 0 && !loading) && styles.addSelectedButtonActive
                ]}
              >
                <Text style={[
                  styles.addSelectedText,
                  (selectedItems.length > 0 && !loading) && styles.addSelectedTextActive
                ]}>
                  {loading ? 'Adding...' : `Add (${selectedItems.length})`}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Selected Image */}
              {selectedImage && (
                <View style={styles.imageSection}>
                  <Text style={styles.sectionTitle}>Captured Image</Text>
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.capturedImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Detection Status */}
              {isDetecting && (
                <View style={styles.loadingSection}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Detecting food items...</Text>
                </View>
              )}

              {/* Detected Items */}
              {detectedItems.length > 0 && (
                <View style={styles.detectedSection}>
                  <Text style={styles.sectionTitle}>
                    Detected Items ({detectedItems.length})
                  </Text>
                  <Text style={styles.instructionText}>
                    Select items to add to your pantry:
                  </Text>
                  
                  {detectedItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleItemSelection(item.name)}
                      style={[
                        styles.detectedItem,
                        selectedItems.includes(item.name) && styles.detectedItemSelected
                      ]}
                    >
                      <View style={styles.detectedItemContent}>
                        <View style={[
                          styles.checkbox,
                          selectedItems.includes(item.name) && styles.checkboxSelected
                        ]}>
                          {selectedItems.includes(item.name) && (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )}
                        </View>
                        <View style={styles.detectedItemInfo}>
                          <Text style={styles.detectedItemName}>
                            {item.name}
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
                <View style={styles.noItemsSection}>
                  <Ionicons name="sad-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.noItemsTitle}>No food items detected</Text>
                  <Text style={styles.noItemsSubtitle}>
                    Try taking another photo with better lighting or different angle
                  </Text>
                  <TouchableOpacity
                    onPress={showImagePicker}
                    style={styles.tryAgainButton}
                  >
                    <Text style={styles.tryAgainText}>Try Again</Text>
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
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryButton: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryButtonActive: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: 'white',
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
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addForm: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  addInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: '#4F46E5',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  aiIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addSelectedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },
  addSelectedButtonActive: {
    backgroundColor: '#4F46E5',
  },
  addSelectedText: {
    fontWeight: '500',
    color: '#6B7280',
  },
  addSelectedTextActive: {
    color: 'white',
  },
  modalScrollView: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  loadingSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 8,
  },
  detectedSection: {
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  detectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  detectedItemSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  detectedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  detectedItemInfo: {
    flex: 1,
  },
  detectedItemName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  noItemsSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noItemsTitle: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
  },
  noItemsSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    marginHorizontal: 32,
  },
  tryAgainButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  tryAgainText: {
    color: 'white',
    fontWeight: '500',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  editModalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  editModalSaveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editModalSaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});