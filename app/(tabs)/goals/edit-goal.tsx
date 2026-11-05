// app/(tabs)/goals/edit-goal.tsx
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useGoalsStore } from '../../goals-store';
import { useAuth } from '../../../context/AuthContext';
import { THEME } from '../../../constants/theme';
import { fonts } from '../../../constants/fonts';

const QUICK_FUND_AMOUNTS = [500, 1000, 2000, 5000];

const formatMoney = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) || 0 : val;
  return '₱ ' + num.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function EditGoalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const { goals, updateGoal, deleteGoal } = useGoalsStore();

  const goalToEdit = goals.find((g) => g.id === id);

  // Form States
  const [amount, setAmount] = useState('');
  const [goalName, setGoalName] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [date, setDate] = useState('');

  // Fund Adjustment Modal
  const [isFundModalVisible, setFundModalVisible] = useState(false);
  const [fundType, setFundType] = useState<'add' | 'withdraw'>('add');
  const [fundAmount, setFundAmount] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setAmount(goalToEdit.amount || '');
      setGoalName(goalToEdit.name || '');
      setCurrentSavings(goalToEdit.currentSavings || '0');
      setDate(goalToEdit.date || '');
    }
  }, [goalToEdit]);

  // Calculations
  const targetVal = parseFloat(amount.replace(/,/g, '')) || 0;
  const currentVal = parseFloat(currentSavings.replace(/,/g, '')) || 0;
  const percent = targetVal > 0 ? (currentVal / targetVal) * 100 : 0;
  const progressWidth = Math.min(Math.max(percent, 0), 100);
  const isAchieved = percent >= 100;
  const remaining = Math.max(0, targetVal - currentVal);

  const statusBadge = isAchieved
    ? { label: 'Achieved', color: THEME.success, bg: THEME.successLight, icon: 'checkmark-circle' as const }
    : percent >= 50
    ? { label: 'On Track', color: THEME.primary, bg: THEME.primaryLight, icon: 'trending-up' as const }
    : { label: 'In Progress', color: THEME.warning, bg: THEME.warningLight, icon: 'time-outline' as const };

  /* SAVE GOAL */
  const handleSave = async () => {
    if (!amount || !goalName.trim() || !user?.id) {
      Alert.alert('Required Fields', 'Please enter both a goal name and target amount.');
      return;
    }

    try {
      setSaving(true);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      await updateGoal(user.id, {
        id: id as string,
        name: goalName.trim(),
        amount: parseFloat(amount.replace(/,/g, '')).toString(),
        currentSavings: parseFloat(currentSavings.replace(/,/g, '')).toString(),
        date,
      });
      router.back();
    } catch (error) {
      console.error('Failed to update goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* DELETE GOAL */
  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to permanently delete "${goalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            try {
              setDeleting(true);
              await deleteGoal(user.id, id as string);
              router.back();
            } catch (error) {
              console.error('Delete goal error:', error);
              Alert.alert('Error', 'Failed to delete goal.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  /* APPLY FUND ADJUSTMENT (Deposit or Withdraw) */
  const handleApplyFunds = async () => {
    const delta = parseFloat(fundAmount.replace(/,/g, ''));
    if (!delta || delta <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    let newCurrent = currentVal;
    if (fundType === 'add') {
      newCurrent = currentVal + delta;
    } else {
      if (delta > currentVal) {
        Alert.alert('Insufficient Funds', 'Cannot withdraw more than current funds.');
        return;
      }
      newCurrent = currentVal - delta;
    }

    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setCurrentSavings(newCurrent.toString());
      if (user?.id) {
        await updateGoal(user.id, {
          id: id as string,
          name: goalName,
          amount,
          currentSavings: newCurrent.toString(),
          date,
        });
      }
      setFundModalVisible(false);
      setFundAmount('');
    } catch (error) {
      console.error('Fund update error:', error);
      Alert.alert('Error', 'Failed to adjust funds.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Goal</Text>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: THEME.dangerLight }]}
            activeOpacity={0.7}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={THEME.danger} />
            ) : (
              <Ionicons name="trash-outline" size={20} color={THEME.danger} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={[styles.statusIconWrap, { backgroundColor: statusBadge.bg }]}>
                <Ionicons
                  name={isAchieved ? 'trophy' : 'flag'}
                  size={24}
                  color={statusBadge.color}
                />
              </View>
              <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
                <Ionicons name={statusBadge.icon} size={12} color={statusBadge.color} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: statusBadge.color }]}>
                  {statusBadge.label}
                </Text>
              </View>
            </View>

            <Text style={styles.heroCurrentLabel}>CURRENT FUNDS</Text>
            <Text style={styles.heroCurrentAmount}>{formatMoney(currentVal)}</Text>
            <Text style={styles.heroTargetSub}>of target {formatMoney(targetVal)}</Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressWidth}%`,
                      backgroundColor: statusBadge.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.percentLabel, { color: statusBadge.color }]}>
                {Math.round(percent)}%
              </Text>
            </View>

            {/* Remaining Pill */}
            {!isAchieved && remaining > 0 && (
              <Text style={styles.remainingText}>
                {formatMoney(remaining)} remaining to reach this goal
              </Text>
            )}

            {/* Action Buttons: Add Funds / Withdraw Funds */}
            <View style={styles.fundButtonsRow}>
              <TouchableOpacity
                style={[styles.fundBtn, { backgroundColor: THEME.primary }]}
                activeOpacity={0.8}
                onPress={() => {
                  setFundType('add');
                  setFundAmount('');
                  setFundModalVisible(true);
                }}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.fundBtnText}>Add Funds</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fundBtn, { backgroundColor: '#F1F5F9' }]}
                activeOpacity={0.8}
                onPress={() => {
                  setFundType('withdraw');
                  setFundAmount('');
                  setFundModalVisible(true);
                }}
              >
                <Ionicons name="remove-circle-outline" size={18} color={THEME.text} style={{ marginRight: 6 }} />
                <Text style={[styles.fundBtnText, { color: THEME.text }]}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Goal Details Form */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>GOAL DETAILS</Text>
          </View>

          {/* Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>GOAL NAME</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="pencil-outline" size={18} color={THEME.primary} style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="Goal name"
                placeholderTextColor={THEME.muted}
              />
            </View>
          </View>

          {/* Target Amount Field */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>TARGET AMOUNT</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>₱</Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                placeholderTextColor={THEME.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Target Date Field */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>TARGET DEADLINE (MM/DD/YYYY)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={18} color={THEME.primary} style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={THEME.muted}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer: Save Changes Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Fund Adjustment Modal */}
        <Modal
          animationType="fade"
          transparent
          visible={isFundModalVisible}
          onRequestClose={() => setFundModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {fundType === 'add' ? 'Add Funds to Goal' : 'Withdraw Funds'}
                </Text>
                <TouchableOpacity
                  onPress={() => setFundModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color={THEME.sub} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                {fundType === 'add'
                  ? 'Deposit savings towards this goal'
                  : 'Withdraw saved amount from this goal'}
              </Text>

              {/* Amount Input */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalCurrency}>₱</Text>
                <TextInput
                  style={styles.modalAmountInput}
                  value={fundAmount}
                  onChangeText={(t) => setFundAmount(t.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={THEME.muted}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              {/* Quick Chips */}
              <View style={styles.modalChipsRow}>
                {QUICK_FUND_AMOUNTS.map((amt) => (
                  <TouchableOpacity
                    key={amt}
                    style={styles.modalChip}
                    onPress={() => {
                      const cur = parseFloat(fundAmount.replace(/,/g, '')) || 0;
                      setFundAmount((cur + amt).toString());
                    }}
                  >
                    <Text style={styles.modalChipText}>+₱{amt.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Confirm Action */}
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: fundType === 'add' ? THEME.primary : THEME.text },
                ]}
                activeOpacity={0.85}
                onPress={handleApplyFunds}
              >
                <Text style={styles.modalConfirmText}>
                  {fundType === 'add' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight,
    backgroundColor: THEME.canvas,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },

  /* Hero Progress Card */
  heroCard: {
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.heading,
  },
  heroCurrentLabel: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: THEME.muted,
    letterSpacing: 0.6,
  },
  heroCurrentAmount: {
    fontSize: 32,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginTop: 4,
  },
  heroTargetSub: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginTop: 2,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#EEF2F6',
    borderRadius: THEME.radius.pill,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: THEME.radius.pill,
  },
  percentLabel: {
    fontSize: 14,
    fontFamily: fonts.heading,
    minWidth: 38,
    textAlign: 'right',
  },
  remainingText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginBottom: 16,
  },
  fundButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  fundBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
  },
  fundBtnText: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
  },

  /* Section Title */
  sectionHeader: {
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: THEME.muted,
    letterSpacing: 0.6,
  },

  /* Form Fields */
  formGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: THEME.muted,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    height: 52,
    ...THEME.shadows.sm,
  },
  fieldIcon: {
    marginRight: 10,
  },
  inputPrefix: {
    fontSize: 16,
    fontFamily: fonts.heading,
    color: THEME.sub,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.body,
    color: THEME.text,
  },

  /* Footer */
  footer: {
    padding: 20,
    backgroundColor: THEME.canvas,
    borderTopWidth: 1,
    borderTopColor: THEME.borderLight,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
    borderRadius: THEME.radius.lg,
    paddingVertical: 16,
    ...THEME.shadows.glow,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.xl,
    padding: 20,
    ...THEME.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginBottom: 16,
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.canvas,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalCurrency: {
    fontSize: 26,
    fontFamily: fonts.heading,
    color: THEME.primary,
    marginRight: 8,
  },
  modalAmountInput: {
    fontSize: 28,
    fontFamily: fonts.heading,
    color: THEME.text,
    minWidth: 120,
    textAlign: 'center',
  },
  modalChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  modalChip: {
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radius.pill,
  },
  modalChipText: {
    fontSize: 12,
    fontFamily: fonts.heading,
    color: THEME.primary,
  },
  modalConfirmBtn: {
    borderRadius: THEME.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
  },
});
