// app/(tabs)/add.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TransactionConfirmedModal from "../../components/TransactionConfirmedModal";
import TransactionErrorModal from "../../components/TransactionErrorModal";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useNotifications } from "../../context/NotificationContext";
import { formatLocalDateKey } from "../../utils/date";
import { THEME, getCategoryColor, getCategoryIcon } from "../../constants/theme";
import { fonts } from "../../constants/fonts";

const CANONICAL_CATEGORIES = [
  { id: 1, name: "Food" },
  { id: 2, name: "Groceries" },
  { id: 3, name: "Transportation" },
  { id: 4, name: "Electricity" },
  { id: 5, name: "Water" },
  { id: 6, name: "Internet" },
  { id: 7, name: "Rent" },
  { id: 8, name: "Entertainment" },
  { id: 9, name: "Shopping" },
  { id: 10, name: "Health" },
  { id: 11, name: "Education" },
  { id: 12, name: "Subscriptions" },
  { id: 13, name: "Others" },
];

export default function AddTransactionScreen() {
  const { addTransaction } = useData();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // Form State
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(1);
  const [isReimbursable, setIsReimbursable] = useState(false);

  const today = new Date();
  const defaultDateStr = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}/${today.getFullYear()}`;
  const [date, setDate] = useState(defaultDateStr);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState("");
  const [confirmedTime, setConfirmedTime] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick Amount Add
  const handleQuickAdd = (value: number) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const current = parseFloat(amount.replace(/,/g, "")) || 0;
    setAmount((current + value).toString());
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    setAmount(cleaned);
  };

  const handleConfirmTransaction = async () => {
    if (!user || !user.id) {
      Alert.alert("Error", "You must be logged in to record an expense.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage("Please enter a valid expense amount.");
      setShowError(true);
      return;
    }

    if (!details.trim()) {
      setErrorMessage("Please add a note or merchant description.");
      setShowError(true);
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const formattedDate = now.toLocaleDateString();
      const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const dateParts = date.split("/");
      const localDate = formatLocalDateKey(
        new Date(
          parseInt(dateParts[2], 10),
          parseInt(dateParts[0], 10) - 1,
          parseInt(dateParts[1], 10)
        )
      );

      const categoryObj = CANONICAL_CATEGORIES.find((c) => c.id === selectedCategoryId) || CANONICAL_CATEGORIES[0];

      const payload = {
        amount: numAmount,
        merchant_name: details.trim(),
        description: details.trim(),
        category_id: categoryObj.id,
        transaction_date: localDate,
        source_type: "Manual",
        is_manual: 1,
        is_reimbursable: isReimbursable ? 1 : 0,
      };

      await addTransaction(payload);

      addNotification({
        title: "Transaction Confirmed",
        message: `₱${numAmount.toLocaleString()} • ${categoryObj.name}\n${details.trim()}`,
        date: formattedDate,
      });

      setConfirmedDate(formattedDate);
      setConfirmedTime(formattedTime);
      setShowModal(true);
    } catch (err: any) {
      console.error("Save transaction error:", err);
      setErrorMessage("Failed to save transaction. Please check your connection.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryObj = CANONICAL_CATEGORIES.find((c) => c.id === selectedCategoryId) || CANONICAL_CATEGORIES[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backBtn}
            onPress={() => router.replace("/(tabs)/home")}
          >
            <Ionicons name="close" size={22} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Expense</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Amount Input Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>ENTER AMOUNT</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.pesoSign}>₱</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {/* Quick Denomination Chips */}
            <View style={styles.quickChipsRow}>
              {[100, 500, 1000].map((val) => (
                <TouchableOpacity
                  key={val}
                  activeOpacity={0.7}
                  style={styles.chip}
                  onPress={() => handleQuickAdd(val)}
                >
                  <Text style={styles.chipText}>+₱{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Picker Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category</Text>
            <Text style={styles.sectionSub}>{selectedCategoryObj.name}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CANONICAL_CATEGORIES.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              const catColor = getCategoryColor(cat.name);
              const catIcon = getCategoryIcon(cat.name);

              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.75}
                  style={[
                    styles.catPill,
                    isSelected && {
                      borderColor: catColor,
                      backgroundColor: `${catColor}14`,
                    },
                  ]}
                  onPress={() => {
                    if (Platform.OS === "ios" || Platform.OS === "android") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }
                    setSelectedCategoryId(cat.id);
                  }}
                >
                  <View
                    style={[
                      styles.catIconWrap,
                      { backgroundColor: isSelected ? catColor : "#F1F5F9" },
                    ]}
                  >
                    <Ionicons
                      name={catIcon as any}
                      size={18}
                      color={isSelected ? "#FFFFFF" : "#64748B"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.catName,
                      isSelected && { color: catColor, fontFamily: fonts.heading },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Details & Merchant Input */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Merchant / Description</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="storefront-outline" size={18} color="#94A3B8" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                value={details}
                onChangeText={setDetails}
                placeholder="e.g., Starbucks, Shell, Jollibee"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Date Row */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Date of Expense</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={18} color="#94A3B8" style={styles.fieldIcon} />
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Reimbursable Expense Toggle Card */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleIconWrap}>
              <Ionicons name="briefcase-outline" size={20} color="#0284C7" />
            </View>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Reimbursable Expense</Text>
              <Text style={styles.toggleSub}>Flag for employee or company reimbursement claims</Text>
            </View>
            <Switch
              value={isReimbursable}
              onValueChange={setIsReimbursable}
              trackColor={{ false: "#CBD5E1", true: THEME.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Save Button CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            onPress={handleConfirmTransaction}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.submitText}>
              {loading ? "Recording Expense..." : "Save Expense"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Success Modal */}
        <TransactionConfirmedModal
          visible={showModal}
          date={confirmedDate}
          time={confirmedTime}
          onClose={() => {
            setShowModal(false);
            setAmount("");
            setDetails("");
            router.replace("/(tabs)/home");
          }}
        />

        {/* Error Modal */}
        <TransactionErrorModal
          visible={showError}
          message={errorMessage}
          onRetry={() => setShowError(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.card,
    justifyContent: "center",
    alignItems: "center",
    ...THEME.shadows.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.xl,
    padding: 24,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.card,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: THEME.sub,
    letterSpacing: 1,
    marginBottom: 10,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pesoSign: {
    fontSize: 34,
    fontFamily: fonts.heading,
    color: THEME.muted,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 42,
    fontFamily: fonts.heading,
    color: THEME.text,
    minWidth: 160,
    textAlign: "center",
  },
  quickChipsRow: {
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.2)",
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.heading,
    color: THEME.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.primary,
  },
  categoryScroll: {
    paddingRight: 10,
    gap: 10,
    marginBottom: 24,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.pill,
    borderWidth: 1.5,
    borderColor: THEME.borderLight,
    gap: 8,
  },
  catIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  catName: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.text,
  },
  formSection: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.body,
    color: THEME.text,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    padding: 16,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: THEME.sub,
    lineHeight: 15,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.primary,
    height: 54,
    borderRadius: THEME.radius.lg,
    gap: 8,
    ...THEME.shadows.glow,
  },
  submitText: {
    fontSize: 16,
    fontFamily: fonts.heading,
    color: "#FFFFFF",
  },
});
