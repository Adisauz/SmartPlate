import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Toast } from '../components/Toast';
import api from '../utils/api';
import * as Clipboard from 'expo-clipboard';

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
      const res = await api.get<PantryItem[]>('/grocery/');
      setItems(res.data);
    } catch (e: any) {
      setToast({ visible: true, message: 'Failed to load grocery list', type: 'error' });
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
      const res = await api.post<PantryItem>('/grocery/', { name });
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
      await api.delete(`/grocery/${id}`);
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

  // Quick Order Platform Data
  const quickCommercePlatforms = [
    { 
      name: 'Zepto', 
      url: 'https://www.zeptonow.com',
      deepLink: 'zepto://',
      color: '#7C3AED',
      icon: 'flash' as const,
    },
    { 
      name: 'Blinkit', 
      url: 'https://blinkit.com',
      deepLink: 'blinkit://',
      color: '#FFCC00',
      icon: 'thunderstorm' as const,
    },
    { 
      name: 'Swiggy', 
      url: 'https://www.swiggy.com/instamart',
      deepLink: 'swiggy://',
      color: '#FC8019',
      icon: 'bicycle' as const,
    },
    { 
      name: 'BigBasket', 
      url: 'https://www.bigbasket.com',
      deepLink: 'bigbasket://',
      color: '#84C225',
      icon: 'basket' as const,
    },
  ];

  const copyListToClipboard = async () => {
    if (items.length === 0) {
      setToast({ visible: true, message: 'Your grocery list is empty!', type: 'error' });
      return;
    }
    
    const itemsList = items.map((item, idx) => `${idx + 1}. ${item.name}`).join('\n');
    const fullText = `🛒 My Grocery List:\n\n${itemsList}\n\n📱 Created with Meal Planner`;
    
    await Clipboard.setStringAsync(fullText);
    setToast({ visible: true, message: '✅ List copied to clipboard!', type: 'success' });
  };

  const openPlatform = async (platform: typeof quickCommercePlatforms[0]) => {
    if (items.length === 0) {
      setToast({ visible: true, message: 'Add items to your list first!', type: 'error' });
      return;
    }

    // Try deep link first, fallback to web URL
    const canOpenDeepLink = await Linking.canOpenURL(platform.deepLink);
    
    if (canOpenDeepLink) {
      await Linking.openURL(platform.deepLink);
    } else {
      await Linking.openURL(platform.url);
    }
    
    setToast({ 
      visible: true, 
      message: `Opening ${platform.name}... (List copied!)`, 
      type: 'success' 
    });
    
    // Also copy list to clipboard for easy pasting
    await copyListToClipboard();
  };

  const shareViaWhatsApp = async () => {
    if (items.length === 0) {
      setToast({ visible: true, message: 'Your grocery list is empty!', type: 'error' });
      return;
    }
    
    const itemsList = items.map((item, idx) => `${idx + 1}. ${item.name}`).join('\n');
    const message = `🛒 My Grocery List:\n\n${itemsList}\n\n📱 Created with Meal Planner`;
    
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
    } else {
      Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share your list.');
    }
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
                  placeholder="Add grocery item..."
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

          {/* Grocery Items */}
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

          {/* Quick Order Section */}
          {items.length > 0 && (
            <View style={styles.quickOrderContainer}>
              <View style={styles.quickOrderHeader}>
                <Ionicons name="rocket" size={24} color="#4F46E5" />
                <Text style={styles.quickOrderTitle}>Quick Order</Text>
              </View>
              <Text style={styles.quickOrderSubtitle}>
                Order from your favorite delivery app
              </Text>

              {/* Platform Cards */}
              <View style={styles.platformsGrid}>
                {quickCommercePlatforms.map((platform) => (
                  <TouchableOpacity
                    key={platform.name}
                    style={[
                      styles.platformCard,
                      { borderLeftColor: platform.color, borderLeftWidth: 4 }
                    ]}
                    onPress={() => openPlatform(platform)}
                  >
                    <View style={[styles.platformIconContainer, { backgroundColor: platform.color + '20' }]}>
                      <Ionicons name={platform.icon} size={24} color={platform.color} />
                    </View>
                    <View style={styles.platformInfo}>
                      <Text style={styles.platformName}>{platform.name}</Text>
                      <Text style={styles.platformAction}>Tap to order →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Action Buttons */}
              <View style={styles.quickActionButtons}>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyListToClipboard}
                >
                  <Ionicons name="copy-outline" size={20} color="#4F46E5" />
                  <Text style={styles.copyButtonText}>Copy List</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={shareViaWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  <Text style={styles.whatsappButtonText}>Share</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>
                  Your list will be copied automatically when you select a platform
                </Text>
              </View>
            </View>
          )}
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
  // Quick Order Styles
  quickOrderContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickOrderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  quickOrderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  platformsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  platformIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  platformAction: {
    fontSize: 13,
    color: '#6B7280',
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  copyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  copyButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  whatsappButtonText: {
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
}); 