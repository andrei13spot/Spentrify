import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useData } from "../context/DataContext";
import { formatLocalDateKey, parseLocalDate } from "../utils/date";

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
  Food: 1,
  Groceries: 2,
  Transportation: 3,
  Electricity: 4,
  Water: 5,
  Internet: 6,
  Rent: 7,
  Entertainment: 8,
  Shopping: 9,
  Health: 10,
  Education: 11,
  Subscriptions: 12,
  Others: 13,
};

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allTransactions, updateTransaction, deleteTransaction } = useData();
  const [showCategory, setShowCategory] = useState(false);

  const transaction = useMemo(
    () => allTransactions.find((tx: any) => String(tx.id) === String(id)),
    [allTransactions, id]
  );

  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Others");
  const [date, setDate] = useState(formatLocalDateKey(new Date()));

  useEffect(() => {
    if (!transaction) return;
    setAmount(String(transaction.amount ?? ""));
    setMerchant(transaction.merchant_name || "");
    setDescription(transaction.description || "");
    setCategory(transaction.category || "Others");
    setDate(
      formatLocalDateKey(
        parseLocalDate(transaction.transaction_date || transaction.created_at)
      )
    );
  }, [transaction]);

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    const categoryId = CATEGORY_MAP[category] || 13;

    await updateTransaction(String(id), {
      amount: Number(amount),
      merchant_name: merchant || description || "Transaction",
      description: description || merchant || "Transaction",
      category_id: categoryId,
      transaction_date: date,
    });

    Alert.alert("Updated", "Transaction updated successfully.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Transaction", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(String(id));
          router.replace("/(tabs)/home");
        },
      },
    ]);
  };

  if (!transaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.emptyText}>Transaction not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Transaction</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
        />

        <Text style={styles.label}>Merchant</Text>
        <TextInput
          style={styles.input}
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Merchant name"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
        />

        <Text style={styles.label}>Category</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowCategory(true)}
        >
          <Text style={styles.selectorText}>{category}</Text>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </TouchableOpacity>

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Transaction</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent animationType="fade" visible={showCategory}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              {CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.modalItem}
                  onPress={() => {
                    setCategory(item);
                    setShowCategory(false);
                  }}
                >
                  <Text style={styles.modalText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  saveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
  },
  selector: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    fontSize: 14,
    color: "#111827",
  },
  deleteButton: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 12,
  },
  deleteText: {
    color: "#DC2626",
    fontWeight: "700",
  },
  emptyText: {
    marginTop: 40,
    textAlign: "center",
    color: "#6B7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    maxHeight: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
  },
  modalItem: {
    paddingVertical: 12,
  },
  modalText: {
    fontSize: 16,
    color: "#111827",
  },
});
