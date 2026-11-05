// app/(tabs)/goals/add-goal.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../context/AuthContext';
import { useGoalsStore } from '../../goals-store';
import { THEME } from '../../../constants/theme';
import { fonts } from '../../../constants/fonts';

// Quick increment amounts
const QUICK_AMOUNTS = [1000, 5000, 10000, 50000];

// Quick target duration chips
const DURATION_PRESETS = [
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '1 Year', months: 12 },
  { label: '2 Years', months: 24 },
];

const computePresetDate = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

export default function AddGoalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addGoal } = useGoalsStore();

  const [amount, setAmount] = useState('');
  const [goalName, setGoalName] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [date, setDate] = useState(() => computePresetDate(6));
  const [selectedPreset, setSelectedPreset] = useState<number | null>(6);
  const [submitting, setSubmitting] = useState(false);

  const handleAmountChange = (text: string) => {
    const clean = text.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(clean);
  };

  const handleQuickAdd = (increment: number) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const currentVal = parseFloat(amount.replace(/,/g, '')) || 0;
    setAmount((currentVal + increment).toString());
  };

  const handleSelectPreset = (months: number) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setSelectedPreset(months);
    setDate(computePresetDate(months));
  };

  const handleConfirm = async () => {
    const targetVal = parseFloat(amount.replace(/,/g, ''));
    if (!targetVal || targetVal <= 0) {
      Alert.alert('Target Required', 'Please enter a valid target amount.');
      return;
    }
    if (!goalName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your goal.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Session Expired', 'Please log in again.');
      return;
    }

    try {
      setSubmitting(true);
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      await addGoal(user.id, {
        name: goalName.trim(),
        amount: targetVal.toString(),
        currentSavings: currentSavings ? parseFloat(currentSavings.replace(/,/g, '')).toString() : '0',
        date,
      });
      router.back();
    } catch (error) {
      console.error('Failed to add goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setSubmitting(false);
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
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Goal</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Target Amount Hero Card */}
          <View style={styles.heroAmountCard}>
            <Text style={styles.heroAmountLabel}>TARGET AMOUNT</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>₱</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={THEME.muted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {/* Quick Increment Chips */}
            <View style={styles.quickChipsRow}>
              {QUICK_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  activeOpacity={0.7}
                  style={styles.chip}
                  onPress={() => handleQuickAdd(amt)}
                >
                  <Text style={styles.chipText}>+₱{amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal Name Field */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>GOAL NAME</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="flag-outline"
                size={20}
                color={THEME.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="e.g. Emergency Fund, New Laptop"
                placeholderTextColor={THEME.muted}
              />
            </View>
          </View>

          {/* Starting Amount (Optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>STARTING FUNDS (OPTIONAL)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPesoPrefix}>₱</Text>
              <TextInput
                style={styles.textInput}
                value={currentSavings}
                onChangeText={(t) => setCurrentSavings(t.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                placeholderTextColor={THEME.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Target Date Section */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>TARGET DEADLINE</Text>
            <View style={styles.durationGrid}>
              {DURATION_PRESETS.map((p) => {
                const isSelected = selectedPreset === p.months;
                return (
                  <TouchableOpacity
                    key={p.months}
                    activeOpacity={0.7}
                    style={[
                      styles.presetCard,
                      isSelected && styles.presetCardSelected,
                    ]}
                    onPress={() => handleSelectPreset(p.months)}
                  >
                    <Text
                      style={[
                        styles.presetCardText,
                        isSelected && styles.presetCardTextSelected,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Date Input Display */}
            <View style={styles.dateDisplayContainer}>
              <Ionicons name="calendar-outline" size={18} color={THEME.primary} style={{ marginRight: 8 }} />
              <Text style={styles.dateDisplayText}>Target Date: {date}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Confirm Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitButtonText}>Create Goal</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  backButton: {
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

  /* Hero Amount Card */
  heroAmountCard: {
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  heroAmountLabel: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: THEME.muted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 34,
    fontFamily: fonts.heading,
    color: THEME.primary,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 40,
    fontFamily: fonts.heading,
    color: THEME.text,
    minWidth: 100,
    textAlign: 'center',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.pill,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.heading,
    color: THEME.primary,
  },

  /* Form Fields */
  formGroup: {
    marginBottom: 20,
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
  inputIcon: {
    marginRight: 10,
  },
  inputPesoPrefix: {
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

  /* Target Duration Grid */
  durationGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  presetCard: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    ...THEME.shadows.sm,
  },
  presetCardSelected: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLight,
  },
  presetCardText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.text,
  },
  presetCardTextSelected: {
    fontFamily: fonts.heading,
    color: THEME.primary,
  },
  dateDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  dateDisplayText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.sub,
  },

  /* Footer */
  footer: {
    padding: 20,
    backgroundColor: THEME.canvas,
    borderTopWidth: 1,
    borderTopColor: THEME.borderLight,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.primary,
    borderRadius: THEME.radius.lg,
    paddingVertical: 16,
    ...THEME.shadows.glow,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
  },
});
