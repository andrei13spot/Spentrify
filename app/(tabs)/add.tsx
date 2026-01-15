import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert // Added Alert for safety
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from 'axios'; 

import TransactionConfirmedModal from "../../components/TransactionConfirmedModal";
import TransactionErrorModal from "../../components/TransactionErrorModal";
import { useData } from "../../context/DataContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext"; // 👈 1. IMPORT USEAUTH

/* ================= DATA ================= */

const CATEGORIES = [
  "Food",
  "Groceries",
  "Transportation",
  "Electricity",
  "Water",
  "Internet",
  "Rent",
  "Entertainment",
  "Shopping",
  "Health",
  "Education",
  "Subscriptions",
  "Others",
];

const CATEGORY_MAP: Record<string, number> = {
  "Food": 1,
  "Groceries": 2, 
  "Transportation": 3,
  "Electricity": 4,
  "Water": 5,
  "Internet": 6,
  "Rent": 7,
  "Entertainment": 8,
  "Shopping": 9,
  "Health": 10,
  "Education": 11,
  "Subscriptions": 12,
  "Others": 13,
};

/* ================= SCREEN ================= */

export default function AddTransaction() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isGoal = mode === "goal";

  /* ================= GLOBAL DATA ================= */
  const { addTransaction } = useData();
  const { user } = useAuth(); // 👈 2. GET CURRENT USER

  /* ================= MODAL STATE ================= */
  const [showModal, setShowModal] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState("");
  const [confirmedTime, setConfirmedTime] = useState("");

  /* ================= ERROR MODAL ================= */
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ================= NOTIFICATIONS ================= */
  const { addNotification } = useNotifications();

  /* ================= FORM STATE ================= */
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("Select Category");
  const [isReimbursable, setIsReimbursable] = useState(false);
  
  const today = new Date();
  const defaultDateStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
  const [date, setDate] = useState(defaultDateStr);

  /* ================= UI STATE ================= */
  const [showCategory, setShowCategory] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false); 

  /* ================= TEMP DATE INPUTS ================= */
  const [tempMonth, setTempMonth] = useState("01");
  const [tempDay, setTempDay] = useState("01");
  const [tempYear, setTempYear] = useState("2026");

  /* ================= RESET ================= */

  const resetForm = () => {
    setAmount("");
    setDetails("");
    setCategory("Select Category");
    setDate("01/01/2026");
    setTempMonth("01");
    setTempDay("01");
    setTempYear("2026");
  };

  /* ================= CONFIRM  ================= */

  const handleConfirmTransaction = async () => {
    // 🛑 SAFETY CHECK: USER MUST BE LOGGED IN
    if (!user || !user.id) {
        Alert.alert("Error", "You must be logged in to save a transaction.");
        return;
    }

    // 1. Validation
    if (!amount || Number(amount) <= 0) {
      setErrorMessage("Please enter a valid amount.");
      setShowError(true);
      return;
    }

    if (!details.trim()) {
      setErrorMessage("Please add a description.");
      setShowError(true);
      return;
    }

    if (!isGoal && category === "Select Category") {
      setErrorMessage("Please select a category.");
      setShowError(true);
      return;
    }

    // 2. Prepare Data for UI Updates
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setLoading(true);

    try {
        // 3. BACKEND INTEGRATION
        if (!isGoal) {
            const dbCategoryId = CATEGORY_MAP[category] || 13;

            const dateParts = date.split('/'); 
            const isoDate = new Date(
                parseInt(dateParts[2]), 
                parseInt(dateParts[0]) - 1, 
                parseInt(dateParts[1])
            ).toISOString();

            // 👇 3. USE DYNAMIC USER ID HERE
            const payload = {
                user_id: Number(user.id), // 👈 FIX: User 2 na ang gagamitin!
                amount: parseFloat(amount),
                merchant_name: details, 
                description: details,
                category_id: dbCategoryId,
                transaction_date: isoDate,
                source_type: 'Manual',
                is_manual: 1
            };

            console.log("🚀 Saving to Backend for User:", user.id);

            // SEND TO BACKEND
            // Note: Use your API URL config or localhost logic here
            await axios.post('http://10.0.2.2:3000/api/transactions', payload);
            console.log("✅ Saved to Database!");
        }

        // 4. Update Context & Notifications
        const newTransaction = {
            id: Date.now().toString(),
            name: details,
            category: isGoal ? "goal" : category,
            amount: Number(amount),
            date,
            createdAt: now.toISOString(),
            spent: 0,
            expenses: [],
            isReimbursable: isReimbursable,
        };

        // NOTE: If addTransaction in context ALSO calls API, 
        // you might want to comment this out to avoid double saving. 
        // But for now, let's keep it to update the UI instantly.
        addTransaction(newTransaction);

        addNotification({
            title: isGoal ? "Goal Added" : "Transaction Confirmed",
            message: `₱${amount} • ${isGoal ? "Goal" : category}\n${details}`,
            date: formattedDate,
        });

        setConfirmedDate(formattedDate);
        setConfirmedTime(formattedTime);
        setShowModal(true);

    } catch (error) {
        console.error("Backend Error:", error);
        setErrorMessage("Failed to save to database. Check connection.");
        setShowError(true);
    } finally {
        setLoading(false);
    }
  };

  /* ================= DATE CONFIRM ================= */

  const confirmDate = () => {
    setDate(`${tempMonth}/${tempDay}/${tempYear}`);
    setShowDatePicker(false);
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isGoal ? "Add Goal" : "Add Transaction"}
          </Text>

          <View style={{ width: 26 }} />
        </View>

        {/* AMOUNT */}
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountBox}>
          <Text style={styles.currency}>₱</Text>
          <TextInput
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={styles.amountInput}
          />
        </View>

        {/* DETAILS */}
        <Text style={styles.label}>Details</Text>
        <TextInput
          placeholder={isGoal ? "Goal name" : "Enter description"}
          value={details}
          onChangeText={setDetails}
          style={styles.input}
        />

        {/* CATEGORY & DATE */}
        <View style={styles.row}>
          {!isGoal && (
            <TouchableOpacity
              style={styles.inputHalf}
              onPress={() => setShowCategory(true)}
            >
              <Text style={styles.inputText}>{category}</Text>
              <Ionicons name="chevron-down" size={18} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.inputHalf, isGoal && { width: "100%" }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>{date}</Text>
            <Ionicons name="calendar-outline" size={18} />
          </TouchableOpacity>
        </View>

        {/* REIMBURSABLE TOGGLE */}
        {!isGoal && (
          <View style={styles.reimbursableRow}>
            <View style={styles.reimbursableLabelContainer}>
              <Ionicons name="receipt-outline" size={20} color="#3B82F6" />
              <Text style={styles.reimbursableLabel}>
                Mark as Reimbursable
              </Text>
            </View>
            <Switch
              value={isReimbursable}
              onValueChange={setIsReimbursable}
              trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
            />
          </View>
        )}

        {/* CONFIRM */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmTransaction}
          disabled={loading}
        >
          <Text style={styles.confirmText}>
            {isGoal ? "Confirm Goal" : "Confirm Transaction"}
          </Text>
        </TouchableOpacity>

        {/* CATEGORY MODAL */}
        <Modal transparent animationType="fade" visible={showCategory}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <FlatList
                data={CATEGORIES}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setCategory(item);
                      setShowCategory(false);
                    }}
                  >
                    <Text style={styles.modalText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* DATE PICKER */}
        <Modal transparent animationType="slide" visible={showDatePicker}>
          <View style={styles.modalOverlay}>
            <View style={styles.dateBox}>
              <Text style={styles.modalTitle}>Select Date</Text>

              <View style={styles.dateRow}>
                <TextInput
                  style={styles.dateInput}
                  value={tempMonth}
                  onChangeText={setTempMonth}
                  keyboardType="numeric"
                  placeholder="MM"
                  maxLength={2}
                />
                <TextInput
                  style={styles.dateInput}
                  value={tempDay}
                  onChangeText={setTempDay}
                  keyboardType="numeric"
                  placeholder="DD"
                  maxLength={2}
                />
                <TextInput
                  style={styles.dateInput}
                  value={tempYear}
                  onChangeText={setTempYear}
                  keyboardType="numeric"
                  placeholder="YYYY"
                  maxLength={4}
                />
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDate}
              >
                <Text style={styles.confirmText}>Confirm Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ERROR MODAL */}
        <TransactionErrorModal
          visible={showError}
          message={errorMessage}
          onRetry={() => setShowError(false)}
        />

        {/* SUCCESS MODAL */}
        <TransactionConfirmedModal
          visible={showModal}
          date={confirmedDate}
          time={confirmedTime}
          onClose={() => {
            setShowModal(false);
            resetForm();
            router.replace("/(tabs)/home");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 6 },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  currency: { fontSize: 14, marginRight: 8, color: "#6B7280" },
  amountInput: { fontSize: 20, flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  inputHalf: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputText: { color: "#374151" },
  confirmButton: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    maxHeight: 400, 
  },
  modalItem: { padding: 14 },
  modalText: { fontSize: 16 },
  dateBox: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    width: "30%",
    textAlign: "center",
  },
  reimbursableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
  },
  reimbursableLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reimbursableLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
});