import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView, Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

export default function PopUpScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');

  const categories = [
    { id: 'Food', icon: 'fast-food-outline', color: '#fee2e2', iconColor: '#ef4444' }, 
    { id: 'Bills', icon: 'receipt-outline', color: '#dbeafe', iconColor: '#3b82f6' }, 
    { id: 'Shopping', icon: 'bag-handle-outline', color: '#f3e8ff', iconColor: '#a855f7' }, 
    { id: 'Health', icon: 'heart-outline', color: '#dcfce7', iconColor: '#22c55e' }, 
    { id: 'Transport', icon: 'car-outline', color: '#ffedd5', iconColor: '#f97316' }, 
    { id: 'Other', icon: 'ellipsis-horizontal', color: '#f3f4f6', iconColor: '#6b7280' }, 
  ];

  const handleConfirm = () => {
    if (!selected) return;
    
    // In a real app, if selected is 'Other', you'd use 'customCategory' value
    const finalCategory = selected === 'Other' ? customCategory : selected;
    console.log("Saving Category:", finalCategory);
    
    router.back();
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
          <Text style={styles.amount}>PHP 0.00</Text>
          <Text style={styles.merchant}>Unknown Merchant • Today</Text>
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

        {/* CUSTOM INPUT (Only shows if "Other" is selected) */}
        {selected === 'Other' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.otherInput}
              placeholder="Type category name..."
              placeholderTextColor="#666"
              value={customCategory}
              onChangeText={setCustomCategory}
              autoFocus={true} // Opens keyboard immediately
            />
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[styles.confirmButton, { opacity: selected ? 1 : 0.5 }]} 
          onPress={handleConfirm}
          disabled={!selected}
        >
          <Text style={styles.confirmText}>Confirm</Text>
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