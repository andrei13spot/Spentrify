import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  SafeAreaView, Modal, Alert, ScrollView 
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGoalsStore } from '../../goals-store';
import { useAuth } from '../../../context/AuthContext';


export default function EditGoalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const { goals, updateGoal, deleteGoal } = useGoalsStore();

  const goalToEdit = goals.find((g) => g.id === id);

  // Form States
  const [amount, setAmount] = useState(''); // Target Amount
  const [goalName, setGoalName] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [date, setDate] = useState('');
  
  // Transaction Modal States
  const [isTransModalVisible, setTransModalVisible] = useState(false);
  const [transType, setTransType] = useState<'add' | 'withdraw'>('add');
  const [transAmount, setTransAmount] = useState('');

  // Date Picker States
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (goalToEdit) {
      setAmount(goalToEdit.amount);
      setGoalName(goalToEdit.name);
      setCurrentSavings(goalToEdit.currentSavings || '0');
      setDate(goalToEdit.date);
      
      const parts = goalToEdit.date.split('/');
      if (parts.length === 3) {
        setMonth(parts[0]);
        setDay(parts[1]);
        setYear(parts[2]);
      }
    }
  }, [goalToEdit]);

  // --- CALCULATIONS ---
  const targetVal = parseFloat(amount.replace(/,/g, '')) || 0;
  const currentVal = parseFloat(currentSavings.replace(/,/g, '')) || 0;
  let percent = 0;
  if (targetVal > 0) percent = (currentVal / targetVal) * 100;
  const progressWidth = Math.min(Math.max(percent, 0), 100);

  const formatMoney = (val: string) => {
    return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleNumericInput = (text: string, setter: (val: string) => void) => {
    const numeric = text.replace(/[^0-9.]/g, '');
    setter(numeric);
  };

  // --- ACTIONS ---
  const handleSave = async () => {
    if (!amount || !goalName || !user?.id) return;
    await updateGoal(user.id, {
      id: id as string,
      name: goalName,
      amount,
      currentSavings: currentSavings || '0',
      date
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert("Delete Goal", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => { 
          if (!user?.id) return; 
          await deleteGoal(user.id, id as string); 
          router.back(); 
        } 
      }
    ]);
  };

  const executeTransaction = () => {
    const val = parseFloat(transAmount) || 0;
    let newTotal = parseFloat(currentSavings.replace(/,/g, '')) || 0;

    if (transType === 'add') {
      newTotal += val;
    } else {
      newTotal -= val;
      if (newTotal < 0) newTotal = 0;
    }

    setCurrentSavings(newTotal.toString());
    setTransModalVisible(false);
    setTransAmount('');
  };

  const openTransModal = (type: 'add' | 'withdraw') => {
    setTransType(type);
    setTransModalVisible(true);
  };

  const handleConfirmDate = () => {
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    setDate(`${m}/${d}/${year}`);
    setDatePickerVisible(false);
  };

  if (!goalToEdit) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true, title: 'Goal Details', headerTitleAlign: 'center',
          headerShadowVisible: false, headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="black" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={{ marginRight: 10 }}>
              <Text style={styles.saveHeaderBtn}>Save</Text>
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- HERO SECTION --- */}
        <View style={styles.heroSection}>
          <View style={styles.amountRow}>
            <Text style={styles.bigAmount}>PHP {formatMoney(currentSavings)}</Text>
            <Text style={styles.targetLabel}> / {formatMoney(amount)}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
          </View>
          
          <Text style={styles.motivationText}>
            You&apos;re {Math.round(percent)}% there! Keep going!
          </Text>
        </View>

        {/* --- ACTION BUTTONS --- */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.addBtn]} onPress={() => openTransModal('add')}>
            <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 5 }}/>
            <Text style={styles.addBtnText}>Add Savings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.withdrawBtn]} onPress={() => openTransModal('withdraw')}>
            <Ionicons name="remove" size={20} color="#555" style={{ marginRight: 5 }}/>
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* --- EDIT FORM SECTION --- */}
        <Text style={styles.sectionTitle}>Edit Details</Text>

        <Text style={styles.label}>Goal Name</Text>
        <TextInput 
          style={styles.input} 
          value={goalName} 
          onChangeText={setGoalName} 
        />

        <Text style={styles.label}>Target Amount</Text>
        <TextInput 
          style={styles.input} 
          value={amount} 
          onChangeText={(t) => handleNumericInput(t, setAmount)} 
          keyboardType="numeric"
        />

        <Text style={styles.label}>Deadline</Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => setDatePickerVisible(true)}>
          <Text style={styles.dateText}>{date}</Text>
          <Ionicons name="calendar-outline" size={20} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Goal</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* --- TRANSACTION MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={isTransModalVisible} onRequestClose={() => setTransModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {transType === 'add' ? 'Add Savings' : 'Withdraw Savings'}
            </Text>
            <View style={styles.transInputContainer}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                style={styles.transInput}
                value={transAmount}
                onChangeText={(t) => handleNumericInput(t, setTransAmount)}
                placeholder="0"
                keyboardType="numeric"
                autoFocus
              />
            </View>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setTransModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={executeTransaction} style={styles.modalConfirmBtn}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- DATE MODAL --- */}
      <Modal animationType="fade" transparent={true} visible={isDatePickerVisible} onRequestClose={() => setDatePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <View style={styles.dateRow}>
              <TextInput style={styles.dateBox} value={month} onChangeText={setMonth} placeholder="MM" keyboardType="numeric" maxLength={2} />
              <TextInput style={styles.dateBox} value={day} onChangeText={setDay} placeholder="DD" keyboardType="numeric" maxLength={2} />
              <TextInput style={styles.dateBox} value={year} onChangeText={setYear} placeholder="YYYY" keyboardType="numeric" maxLength={4} />
            </View>
            {/* Updated Button Style specifically for Date Modal */}
            <TouchableOpacity style={styles.dateModalConfirmBtn} onPress={handleConfirmDate}>
              <Text style={styles.modalConfirmText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 50 },
  saveHeaderBtn: { fontSize: 16, color: '#4287f5', fontWeight: 'bold' },
  heroSection: { alignItems: 'center', marginBottom: 25 },
  // percentTitle removed
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15 },
  bigAmount: { fontSize: 32, fontWeight: '800', color: '#000' },
  targetLabel: { fontSize: 18, color: '#aaa', marginBottom: 4, fontWeight: '500' },
  progressBg: { width: '100%', height: 12, backgroundColor: '#E8EFFC', borderRadius: 6, marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: '#4287f5', borderRadius: 6 },
  motivationText: { fontSize: 14, color: '#555', marginTop: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  actionBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10 },
  addBtn: { backgroundColor: '#2ecc71' }, 
  withdrawBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  withdrawBtnText: { color: '#555', fontWeight: 'bold', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#000' },
  label: { fontSize: 13, color: '#888', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, color: '#333' },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 14, marginBottom: 16 },
  dateText: { fontSize: 16, color: '#333' },
  deleteBtn: { marginTop: 20, alignItems: 'center', padding: 15 },
  deleteText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '85%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  
  // Transaction Modal Specific
  transInputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#4287f5', marginBottom: 25, paddingHorizontal: 10 },
  currencySymbol: { fontSize: 24, color: '#333', marginRight: 8, fontWeight: 'bold' },
  transInput: { fontSize: 28, flex: 1, color: '#333', paddingVertical: 10 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalCancelBtn: { flex: 1, alignItems: 'center', padding: 12 },
  modalConfirmBtn: { flex: 1, backgroundColor: '#4287f5', borderRadius: 10, alignItems: 'center', padding: 12 },
  modalCancelText: { color: '#888', fontWeight: 'bold', fontSize: 16 },
  modalConfirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Date Modal Specific
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  dateBox: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, width: '30%', textAlign: 'center', padding: 10, fontSize: 16 },
  // New style for full-width date confirm button
  dateModalConfirmBtn: { backgroundColor: '#4287f5', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 }
});