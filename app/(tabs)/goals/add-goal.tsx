import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../../context/AuthContext';
import { useGoalsStore } from '../../goals-store';


export default function AddGoalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addGoal } = useGoalsStore();

  const [amount, setAmount] = useState('');
  const [goalName, setGoalName] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  
  const [date, setDate] = useState('01/01/2025');
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  // Date Picker States
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [day, setDay] = useState('30');
  const [month, setMonth] = useState('12');
  const [year, setYear] = useState('2025');

  // Helper to allow only numbers, dots, and commas
  const handleNumericInput = (text: string, setter: (value: string) => void) => {
    const numericValue = text.replace(/[^0-9.,]/g, '');
    setter(numericValue);
  };

  const handleConfirm = async () => {
    if (!amount || !goalName || !user?.id) return;
    

    await addGoal(user.id, { 
      name: goalName, 
      amount, 
      currentSavings: currentSavings || '0', 
      date 
    });
    
    router.back();
  };

  const handleConfirmDate = () => {
    const formattedDay = day.padStart(2, '0');
    const formattedMonth = month.padStart(2, '0');
    setDate(`${formattedMonth}/${formattedDay}/${year}`);
    setDatePickerVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true, title: 'Add Goal', headerTitleAlign: 'center',
          headerShadowVisible: false, headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="black" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        
        {/* AMOUNT SECTION */}
        <Text style={styles.label}>Amount</Text>
        <View style={[
          styles.inputContainer,
          isAmountFocused ? styles.amountContainerActive : styles.amountContainerInactive
        ]}>
          <Text style={styles.currency}>₱</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={(text) => handleNumericInput(text, setAmount)}
            placeholder="0.00"
            keyboardType="decimal-pad" // Ensures numbers + decimal options show up
            placeholderTextColor="#aaa"
            onFocus={() => setIsAmountFocused(true)}
            onBlur={() => setIsAmountFocused(false)}
            autoFocus={true}
          />
        </View>

        {/* DETAILS SECTION */}
        <Text style={styles.label}>Details</Text>
        
        {/* Goal Name Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={goalName}
            onChangeText={setGoalName}
            placeholder="Goal name"
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Current Savings Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.currencySmall}>₱</Text>
          <TextInput
            style={styles.textInput}
            value={currentSavings}
            onChangeText={(text) => handleNumericInput(text, setCurrentSavings)}
            placeholder="Current Savings (Optional)"
            placeholderTextColor="#aaa"
            keyboardType="decimal-pad" // Ensures numbers + decimal options show up
          />
        </View>

        {/* DATE SECTION */}
        <TouchableOpacity style={styles.inputContainer} onPress={() => setDatePickerVisible(true)}>
          <Text style={styles.dateText}>{date}</Text>
          <Ionicons name="calendar-outline" size={24} color="#333" />
        </TouchableOpacity>

        {/* BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleConfirm}>
          <Text style={styles.buttonText}>Confirm Goal</Text>
        </TouchableOpacity>

      </View>

      {/* DATE MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDatePickerVisible}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <View style={styles.dateInputsContainer}>
              <TextInput
                style={styles.dateInput} value={month} onChangeText={setMonth}
                placeholder="MM" keyboardType="numeric" maxLength={2}
              />
              <TextInput
                style={styles.dateInput} value={day} onChangeText={setDay}
                placeholder="DD" keyboardType="numeric" maxLength={2} autoFocus
              />
              <TextInput
                style={styles.dateInput} value={year} onChangeText={setYear}
                placeholder="YYYY" keyboardType="numeric" maxLength={4}
              />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleConfirmDate}>
              <Text style={styles.buttonText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  
  label: { 
    fontSize: 14, 
    color: '#888', 
    marginBottom: 8, 
    marginTop: 4
  },

  inputContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#E0E0E0', 
    borderRadius: 12, 
    paddingHorizontal: 15,
    height: 55, 
    backgroundColor: '#fff',
    marginBottom: 16 
  },

  amountContainerActive: { borderColor: '#4287f5', borderWidth: 2 },
  amountContainerInactive: { borderColor: '#E0E0E0', borderWidth: 1 },
  
  currency: { fontSize: 20, color: '#888', marginRight: 10, fontWeight: '600' },
  currencySmall: { fontSize: 16, color: '#888', marginRight: 4, fontWeight: '400' }, 
  
  amountInput: { flex: 1, fontSize: 22, color: '#333' },
  textInput: { flex: 1, fontSize: 16, color: '#333' },
  dateText: { flex: 1, fontSize: 16, color: '#333' },
  
  button: {
    backgroundColor: '#4287f5', 
    borderRadius: 12, 
    paddingVertical: 16,
    alignItems: 'center', 
    marginTop: 20, 
    elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '85%', alignItems: 'center', elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#000' },
  dateInputsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  dateInput: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, textAlign: 'center', fontSize: 18, paddingVertical: 12, width: '30%', color: '#333',
  },
  modalButton: { backgroundColor: '#4287f5', borderRadius: 12, paddingVertical: 15, width: '100%', alignItems: 'center' },
});