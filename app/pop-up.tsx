import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router'; 
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 
import { toLocalDateKey } from '../utils/date';

/* ================= CATEGORY MAPPING ================= */
const CATEGORY_MAPPING: Record<number, string> = {
  1: 'Food',
  2: 'Groceries', 
  3: 'Transport',
  4: 'Bills', 
  5: 'Bills', 
  9: 'Shopping',
  10: 'Health',
  13: 'Other',
};

export default function PopUpScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth(); 
  
  const [selected, setSelected] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false); 
  const [finalAmount, setFinalAmount] = useState('0');

  // UI Configuration for Categories
  const categories = [
    { id: 'Food', dbId: 1, icon: 'fast-food-outline', color: '#fee2e2', iconColor: '#ef4444' }, 
    { id: 'Bills', dbId: 4, icon: 'receipt-outline', color: '#dbeafe', iconColor: '#3b82f6' }, 
    { id: 'Shopping', dbId: 9, icon: 'bag-handle-outline', color: '#f3e8ff', iconColor: '#a855f7' }, 
    { id: 'Health', dbId: 10, icon: 'heart-outline', color: '#dcfce7', iconColor: '#22c55e' }, 
    { id: 'Transport', dbId: 3, icon: 'car-outline', color: '#ffedd5', iconColor: '#f97316' }, 
    { id: 'Other', dbId: 13, icon: 'ellipsis-horizontal', color: '#f3f4f6', iconColor: '#6b7280' }, 
  ];

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
    if (!selected) return;
    
    if (!user || !user.id) {
        Alert.alert("Error", "User not identified. Please login again.");
        return;
    }

    setLoading(true);

    try {
      const selectedCategoryObj = categories.find(c => c.id === selected);
      let categoryIdToSave = selectedCategoryObj?.dbId || 13;

      const payload = {
        user_id: Number(user.id), 
        amount: parseFloat(finalAmount),
        merchant_name: params.merchant || 'Unknown Merchant',
        description: (selected === 'Other' && customCategory) ? customCategory : (params.merchant || 'Manual Transaction'),
        transaction_date: toLocalDateKey(params.date as string | undefined),
        category_id: categoryIdToSave || null, 
        is_manual: 0
      };

      console.log("Saving Pop-up Transaction:", payload);

      const response = await axios.post('http://10.0.2.2:3000/api/transactions', payload);

      if (response.data.success) {
        Alert.alert("Success", "Transaction Saved!");
        router.back();
      }
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', 'Failed to save transaction.');
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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            PHP {parseFloat(finalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.merchant}>
            {params.merchant || 'Unknown Merchant'} • Today
          </Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {categories.map((cat) => {
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
                    backgroundColor: isSelected ? 'transparent' : cat.color,
                    borderColor: '#fff',
                    borderWidth: isSelected ? 2 : 0
                  }
                ]}>
                  <Ionicons 
                    name={cat.icon as any} 
                    size={24} 
                    color={isSelected ? '#fff' : cat.iconColor} 
                  />
                </View>
                <Text style={[styles.label, { color: isSelected ? '#fff' : '#9ca3af' }]}>
                  {cat.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CUSTOM INPUT */}
        {selected === 'Other' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.otherInput}
              placeholder="Type category name..."
              placeholderTextColor="#666"
              value={customCategory}
              onChangeText={setCustomCategory}
              autoFocus={true} 
            />
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[styles.confirmButton, { opacity: (selected && !loading) ? 1 : 0.5 }]} 
          onPress={handleConfirm}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>Confirm</Text>
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
    padding: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)', 
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1c1c1e', 
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 5,
  },
  merchant: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  item: {
    width: '30%', 
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  otherInput: {
    backgroundColor: '#2c2c2e', 
    color: '#fff',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});