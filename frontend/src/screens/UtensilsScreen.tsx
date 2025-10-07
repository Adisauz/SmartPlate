import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Toast } from '../components/Toast';
import api from '../utils/api';

type UtensilsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Utensils'>;

type Utensil = {
  id: number;
  name: string;
  category: string;
};

const UTENSIL_CATEGORIES = [
  { id: 'All', name: 'All', icon: 'grid-outline', color: '#6B7280' },
  { id: 'Cookware', name: 'Cookware', icon: 'restaurant-outline', color: '#EF4444' },
  { id: 'Bakeware', name: 'Bakeware', icon: 'pizza-outline', color: '#F59E0B' },
  { id: 'Knives', name: 'Knives', icon: 'cut-outline', color: '#10B981' },
  { id: 'Utensils', name: 'Utensils', icon: 'construct-outline', color: '#3B82F6' },
  { id: 'Appliances', name: 'Appliances', icon: 'flash-outline', color: '#8B5CF6' },
  { id: 'Measuring', name: 'Measuring', icon: 'analytics-outline', color: '#06B6D4' },
  { id: 'Prep Tools', name: 'Prep Tools', icon: 'hand-left-outline', color: '#F97316' },
  { id: 'Storage', name: 'Storage', icon: 'cube-outline', color: '#14B8A6' },
  { id: 'Other', name: 'Other', icon: 'ellipsis-horizontal', color: '#9CA3AF' },
];

const COMMON_UTENSILS: Record<string, string[]> = {
  'Cookware': ['Frying Pan', 'Saucepan', 'Stock Pot', 'Cast Iron Skillet', 'Wok', 'Dutch Oven'],
  'Bakeware': ['Baking Sheet', 'Cake Pan', 'Muffin Tin', 'Loaf Pan', 'Pie Dish', 'Casserole Dish'],
  'Knives': ['Chef\'s Knife', 'Paring Knife', 'Bread Knife', 'Utility Knife', 'Carving Knife'],
  'Utensils': ['Wooden Spoon', 'Spatula', 'Whisk', 'Ladle', 'Tongs', 'Slotted Spoon', 'Peeler'],
  'Appliances': ['Blender', 'Food Processor', 'Stand Mixer', 'Hand Mixer', 'Toaster', 'Microwave'],
  'Measuring': ['Measuring Cups', 'Measuring Spoons', 'Kitchen Scale', 'Liquid Measuring Cup'],
  'Prep Tools': ['Cutting Board', 'Colander', 'Mixing Bowls', 'Grater', 'Can Opener', 'Garlic Press'],
  'Storage': ['Glass Containers', 'Plastic Containers', 'Mason Jars', 'Zip-Lock Bags'],
};

export const UtensilsScreen = () => {
  const navigation = useNavigation<UtensilsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [utensils, setUtensils] = useState<Utensil[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [newUtensilName, setNewUtensilName] = useState('');
  const [newUtensilCategory, setNewUtensilCategory] = useState('Other');
  const [editingUtensil, setEditingUtensil] = useState<Utensil | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const fetchUtensils = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      
      const res = await api.get('/utensils/', { params });
      setUtensils(res.data);
    } catch (err) {
      setToast({ visible: true, message: 'Failed to load utensils', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtensils();
  }, [searchQuery, selectedCategory]);

  const handleAddUtensil = async () => {
    if (!newUtensilName.trim()) {
      setToast({ visible: true, message: 'Please enter a utensil name', type: 'error' });
      return;
    }

    try {
      await api.post('/utensils/', {
        name: newUtensilName.trim(),
        category: newUtensilCategory,
      });
      setNewUtensilName('');
      setNewUtensilCategory('Other');
      setShowAddModal(false);
      await fetchUtensils();
      setToast({ visible: true, message: 'Utensil added!', type: 'success' });
    } catch (err) {
      setToast({ visible: true, message: 'Failed to add utensil', type: 'error' });
    }
  };

  const handleQuickAdd = async (name: string, category: string) => {
    try {
      await api.post('/utensils/', { name, category });
      await fetchUtensils();
      setToast({ visible: true, message: `${name} added!`, type: 'success' });
    } catch (err) {
      setToast({ visible: true, message: 'Failed to add utensil', type: 'error' });
    }
  };

  const handleDeleteUtensil = async (id: number, name: string) => {
    Alert.alert(
      'Delete Utensil',
      `Remove ${name} from your kitchen inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/utensils/${id}`);
              await fetchUtensils();
              setToast({ visible: true, message: 'Utensil removed', type: 'success' });
            } catch (err) {
              setToast({ visible: true, message: 'Failed to delete utensil', type: 'error' });
            }
          },
        },
      ]
    );
  };

  const handleEditUtensil = (utensil: Utensil) => {
    setEditingUtensil(utensil);
    setEditName(utensil.name);
    setEditCategory(utensil.category);
  };

  const handleSaveEdit = async () => {
    if (!editingUtensil || !editName.trim()) return;

    try {
      await api.put(`/utensils/${editingUtensil.id}`, {
        name: editName.trim(),
        category: editCategory,
      });
      setEditingUtensil(null);
      await fetchUtensils();
      setToast({ visible: true, message: 'Utensil updated', type: 'success' });
    } catch (err) {
      setToast({ visible: true, message: 'Failed to update utensil', type: 'error' });
    }
  };

  const filteredUtensils = utensils.filter((utensil) =>
    utensil.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: string): any => {
    const cat = UTENSIL_CATEGORIES.find(c => c.id === category);
    return cat?.icon || 'ellipsis-horizontal';
  };

  const getCategoryColor = (category: string): string => {
    const cat = UTENSIL_CATEGORIES.find(c => c.id === category);
    return cat?.color || '#9CA3AF';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kitchen Utensils</Text>
        <TouchableOpacity onPress={() => setShowQuickAddModal(true)} style={styles.quickAddButton}>
          <Ionicons name="flash-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search utensils..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {UTENSIL_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
              { borderColor: category.color }
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={16}
              color={selectedCategory === category.id ? '#FFFFFF' : category.color}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Utensils List */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading kitchen utensils...</Text>
          </View>
        ) : filteredUtensils.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Utensils Yet</Text>
            <Text style={styles.emptyText}>
              Add kitchen tools to track what you have
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyButtonText}>Add Your First Utensil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {UTENSIL_CATEGORIES.filter(cat => cat.id !== 'All').map((category) => {
              const categoryUtensils = filteredUtensils.filter(u => u.category === category.id);
              if (categoryUtensils.length === 0) return null;

              return (
                <View key={category.id} style={styles.categorySection}>
                  <View style={styles.categorySectionHeader}>
                    <View style={[styles.categoryIconBadge, { backgroundColor: category.color + '20' }]}>
                      <Ionicons name={category.icon as any} size={20} color={category.color} />
                    </View>
                    <Text style={styles.categorySectionTitle}>{category.name}</Text>
                    <Text style={styles.categorySectionCount}>({categoryUtensils.length})</Text>
                  </View>
                  {categoryUtensils.map((utensil) => (
                    <View key={utensil.id} style={styles.utensilItem}>
                      <View style={[styles.utensilIcon, { backgroundColor: getCategoryColor(utensil.category) + '15' }]}>
                        <Ionicons
                          name={getCategoryIcon(utensil.category) as any}
                          size={20}
                          color={getCategoryColor(utensil.category)}
                        />
                      </View>
                      <Text style={styles.utensilName}>{utensil.name}</Text>
                      <View style={styles.utensilActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditUtensil(utensil)}
                        >
                          <Ionicons name="create-outline" size={18} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { marginLeft: 8 }]}
                          onPress={() => handleDeleteUtensil(utensil.id, utensil.name)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Utensil Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Kitchen Utensil</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Utensil name (e.g., Chef's Knife)"
              value={newUtensilName}
              onChangeText={setNewUtensilName}
              autoFocus
            />

            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPickerScroll}>
              {UTENSIL_CATEGORIES.filter(cat => cat.id !== 'All').map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPickerItem,
                    newUtensilCategory === category.id && styles.categoryPickerItemActive,
                    { borderColor: category.color }
                  ]}
                  onPress={() => setNewUtensilCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={newUtensilCategory === category.id ? '#FFFFFF' : category.color}
                  />
                  <Text
                    style={[
                      styles.categoryPickerText,
                      newUtensilCategory === category.id && { color: '#FFFFFF' }
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={handleAddUtensil}>
              <Text style={styles.modalButtonText}>Add Utensil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quick Add Modal */}
      <Modal
        visible={showQuickAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuickAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Add Common Utensils</Text>
              <TouchableOpacity onPress={() => setShowQuickAddModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {Object.entries(COMMON_UTENSILS).map(([category, items]) => (
                <View key={category} style={styles.quickAddSection}>
                  <Text style={styles.quickAddCategoryTitle}>{category}</Text>
                  <View style={styles.quickAddGrid}>
                    {items.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.quickAddItem}
                        onPress={() => handleQuickAdd(item, category)}
                      >
                        <Ionicons name="add-circle-outline" size={16} color="#10B981" />
                        <Text style={styles.quickAddItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editingUtensil !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingUtensil(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Utensil</Text>
              <TouchableOpacity onPress={() => setEditingUtensil(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Utensil name"
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />

            <Text style={styles.modalLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPickerScroll}>
              {UTENSIL_CATEGORIES.filter(cat => cat.id !== 'All').map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPickerItem,
                    editCategory === category.id && styles.categoryPickerItemActive,
                    { borderColor: category.color }
                  ]}
                  onPress={() => setEditCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={20}
                    color={editCategory === category.id ? '#FFFFFF' : category.color}
                  />
                  <Text
                    style={[
                      styles.categoryPickerText,
                      editCategory === category.id && { color: '#FFFFFF' }
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={handleSaveEdit}>
              <Text style={styles.modalButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  quickAddButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  categoriesContainer: {
    marginTop: 16,
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 2,
  },
  categoryChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categorySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  categorySectionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  utensilItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  utensilIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  utensilName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  utensilActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoryPickerScroll: {
    marginBottom: 20,
  },
  categoryPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 2,
  },
  categoryPickerItemActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryPickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  modalButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickAddSection: {
    marginBottom: 24,
  },
  quickAddCategoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  quickAddItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4,
  },
  quickAddItemText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
  },
});

