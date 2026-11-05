// app/pop-up.tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router'; 
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert
} from 'react-native';
import apiClient from '../utils/api';
import { useAuth } from '../context/AuthContext'; 
import { toLocalDateKey } from '../utils/date';

/* ================= CANONICAL 13 CATEGORY MAPPING ================= */
const CATEGORY_MAPPING: Record<number, string> = {
  1: 'Food',
  2: 'Groceries',
  3: 'Transportation',
  4: 'Electricity',
  5: 'Water',
  6: 'Internet',
  7: 'Rent',
  8: 'Entertainment',
  9: 'Shopping',
  10: 'Health',
  11: 'Education',
  12: 'Subscriptions',
  13: 'Others',
};

type CategoryItem = {
  id: string;
  dbId: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iconColor: string;
};

const CANONICAL_CATEGORIES: CategoryItem[] = [
  { id: 'Food', dbId: 1, icon: 'fast-food-outline', color: '#fee2e2', iconColor: '#ef4444' },
  { id: 'Groceries', dbId: 2, icon: 'cart-outline', color: '#dcfce7', iconColor: '#22c55e' },
  { id: 'Transportation', dbId: 3, icon: 'car-outline', color: '#ffedd5', iconColor: '#f97316' },
  { id: 'Electricity', dbId: 4, icon: 'flash-outline', color: '#cffafe', iconColor: '#06b6d4' },
  { id: 'Water', dbId: 5, icon: 'water-outline', color: '#dbeafe', iconColor: '#3b82f6' },
  { id: 'Internet', dbId: 6, icon: 'wifi-outline', color: '#ede9fe', iconColor: '#8b5cf6' },
  { id: 'Rent', dbId: 7, icon: 'home-outline', color: '#f3e8ff', iconColor: '#a855f7' },
  { id: 'Entertainment', dbId: 8, icon: 'film-outline', color: '#fce7f3', iconColor: '#ec4899' },
  { id: 'Shopping', dbId: 9, icon: 'bag-handle-outline', color: '#ffedd5', iconColor: '#f97316' },
  { id: 'Health', dbId: 10, icon: 'heart-outline', color: '#dcfce7', iconColor: '#16a34a' },
  { id: 'Education', dbId: 11, icon: 'school-outline', color: '#dbeafe', iconColor: '#2563eb' },
  { id: 'Subscriptions', dbId: 12, icon: 'repeat-outline', color: '#e0f2fe', iconColor: '#0ea5e9' },
  { id: 'Others', dbId: 13, icon: 'ellipsis-horizontal', color: '#f3f4f6', iconColor: '#6b7280' },
];

export default function PopUpScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth(); 
  
  const [selected, setSelected] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [loading, setLoading] = useState(false); 
  const [finalAmount, setFinalAmount] = useState('0');

  useEffect(() => {
    if (params.amount) {
      setFinalAmount(params.amount.toString());
    }

    if (params.category_id) {
      const catId = Number(params.category_id);
      const uiKey = CATEGORY_MAPPING[catId];
      if (uiKey) {
        setSelected(uiKey);
      }
    }
  }, [params]);

  const handleConfirm = async () => {
    if (!selected) {
      Alert.alert("Select Category", "Please choose a category before confirming.");
      return;
    }
    
    if (!user || !user.id) {
      Alert.alert("Error", "User not identified. Please login again.");
      return;
    }

    setLoading(true);

    try {
      const selectedCategoryObj = CANONICAL_CATEGORIES.find(c => c.id === selected);
      const categoryIdToSave = selectedCategoryObj?.dbId || 13;

      const payload = {
        user_id: Number(user.id), 
        amount: parseFloat(finalAmount) || 0,
        merchant_name: params.merchant || 'Detected Merchant',
        description: customDescription.trim() || (params.merchant ? String(params.merchant) : 'SMS Detected Transaction'),
        transaction_date: toLocalDateKey(params.date as string | undefined),
        category_id: categoryIdToSave, 
        is_manual: 0,
        source_type: 'SMS Detection'
      };

      const response = await apiClient.post('/api/transactions', payload);

      if (response.data.success) {
        Alert.alert("Success", "Transaction confirmed and saved!");
        router.back();
      }
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={() => router.back()}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View style={styles.modalContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Categorize Transaction</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Amount & Merchant */}
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            ₱{parseFloat(finalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.merchant}>
            {params.merchant || 'SMS Detected'} • Today
          </Text>
        </View>

        {/* Categories Grid (Scrollable to comfortably hold all 13) */}
        <ScrollView 
          style={styles.gridScroll}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {CANONICAL_CATEGORIES.map((cat) => {
            const isSelected = selected === cat.id;
            return (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.item} 
                onPress={() => setSelected(cat.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconCircle, 
                  { 
                    backgroundColor: cat.color,
                    borderColor: '#3B82F6',
                    borderWidth: isSelected ? 2.5 : 0
                  }
                ]}>
                  <Ionicons 
                    name={cat.icon} 
                    size={22} 
                    color={cat.iconColor} 
                  />
                </View>
                <Text 
                  style={[
                    styles.label, 
                    isSelected && styles.labelSelected
                  ]}
                  numberOfLines={1}
                >
                  {cat.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Note / Custom Description Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add note or custom description..."
            placeholderTextColor="#9CA3AF"
            value={customDescription}
            onChangeText={setCustomDescription}
          />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[styles.confirmButton, { opacity: (selected && !loading) ? 1 : 0.6 }]} 
          onPress={handleConfirm}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmText}>Confirm & Save</Text>
          )}
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF', 
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  merchant: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  gridScroll: {
    width: '100%',
    maxHeight: 260,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  item: {
    width: '23%', 
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: '#F3F4F6', 
    color: '#111827',
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
