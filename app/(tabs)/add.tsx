import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TransactionConfirmedModal from "../../components/TransactionConfirmedModal";
import TransactionErrorModal from "../../components/TransactionErrorModal";
import { useData } from "../../context/DataContext"; // ✅ GLOBAL DATA
import { useNotifications } from "../../context/NotificationContext";

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

/* ================= SCREEN ================= */

export default function AddTransaction() {
  /* ================= GLOBAL DATA ================= */
  const { addTransaction } = useData(); // ✅ SINGLE SOURCE OF TRUTH

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
  const [date, setDate] = useState("01/01/2025");

  /* ================= UI STATE ================= */
  const [showCategory, setShowCategory] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  /* ================= TEMP DATE INPUTS ================= */
  const [tempMonth, setTempMonth] = useState("01");
  const [tempDay, setTempDay] = useState("01");
  const [tempYear, setTempYear] = useState("2025");

  /* ================= RESET FORM ================= */

  const resetForm = () => {
    setAmount("");
    setDetails("");
    setCategory("Select Category");
    setDate("01/01/2025");

    setTempMonth("01");
    setTempDay("01");
    setTempYear("2025");
  };

  /* ================= CONFIRM TRANSACTION ================= */

  const handleConfirmTransaction = () => {
    if (!amount || Number(amount) <= 0) {
      setErrorMessage("Please enter a valid amount.");
      setShowError(true);
      return;
    }

    if (!details.trim()) {
      setErrorMessage("Please add a description for this transaction.");
      setShowError(true);
      return;
    }

    if (category === "Select Category") {
      setErrorMessage("Please select a category.");
      setShowError(true);
      return;
    }

    if (!date) {
      setErrorMessage("Please choose a date.");
      setShowError(true);
      return;
    }

    /* ================= CREATE TRANSACTION ================= */

    const now = new Date();

    const formattedDate = now.toLocaleDateString();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newTransaction = {
      id: Date.now().toString(), // placeholder unique id
      name: details, // transaction / goal name
      category,
      amount: Number(amount),
      date,
      createdAt: now.toISOString(),
    };

    /* ================= SAVE TO GLOBAL STATE ================= */

    addTransaction(newTransaction); // ✅ FEEDS HOME + REPORT

    /* ================= NOTIFICATION ================= */

    addNotification({
      title: "Transaction Confirmed",
      message: `₱${amount} • ${category}\n${details}`,
      date: formattedDate,
    });

    setConfirmedDate(formattedDate);
    setConfirmedTime(formattedTime);
    setShowModal(true);
  };

  /* ================= DATE CONFIRM ================= */

  const confirmDate = () => {
    setDate(`${tempMonth}/${tempDay}/${tempYear}`);
    setShowDatePicker(false);
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Transaction</Text>

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
          placeholder="Enter description"
          value={details}
          onChangeText={setDetails}
          style={styles.input}
        />

        {/* CATEGORY & DATE */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.inputHalf}
            onPress={() => setShowCategory(true)}
          >
            <Text style={styles.inputText}>{category}</Text>
            <Ionicons name="chevron-down" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.inputHalf}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.inputText}>{date}</Text>
            <Ionicons name="calendar-outline" size={18} />
          </TouchableOpacity>
        </View>

        {/* CONFIRM */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmTransaction}
        >
          <Text style={styles.confirmText}>Confirm Transaction</Text>
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
                />
                <TextInput
                  style={styles.dateInput}
                  value={tempDay}
                  onChangeText={setTempDay}
                  keyboardType="numeric"
                  placeholder="DD"
                />
                <TextInput
                  style={styles.dateInput}
                  value={tempYear}
                  onChangeText={setTempYear}
                  keyboardType="numeric"
                  placeholder="YYYY"
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
            resetForm(); // ✅ CLEAR EVERYTHING
            router.replace("/(tabs)/home");
          }}
        />
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#3B82F6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  currency: {
    fontSize: 14,
    marginRight: 8,
    color: "#6B7280",
  },
  amountInput: {
    fontSize: 20,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
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
  inputText: {
    color: "#374151",
  },
  confirmButton: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
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
  },
  modalItem: {
    padding: 14,
  },
  modalText: {
    fontSize: 16,
  },
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
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    width: "30%",
    textAlign: "center",
  },
});
