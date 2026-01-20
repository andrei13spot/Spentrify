import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useData } from "../context/DataContext";

/* ================= THEME ================= */

const THEME = {
  primary: "#3B82F6",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  border: "#E5E7EB",
  danger: "#DC2626",
};

/* ================= HELPERS ================= */

const peso = (n: number) => `₱${n.toLocaleString()}`;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ================= DONUT ================= */

function ProgressDonut({
  spent,
  budget,
}: {
  spent: number;
  budget: number;
}) {
  const progress = budget > 0 ? clamp01(spent / budget) : 0;

  const size = 220;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#E5EDFF"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={THEME.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          originX={cx}
          originY={cy}
        />
      </Svg>

      <View style={styles.centerText}>
        <Text style={styles.bigAmount}>{peso(spent)}</Text>
        <Text style={styles.subText}>of {peso(budget)}</Text>
        <Text style={styles.mutedText}>
          {Math.round(progress * 100)}% used
        </Text>
      </View>
    </View>
  );
}

/* ================= SCREEN ================= */

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, updateTransaction, deleteTransaction } = useData();

  const transaction = useMemo(
    () => transactions.find((t) => t.id === id),
    [transactions, id]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (transaction) {
      setName(transaction.name);
      setAmount(transaction.amount.toString());
      setDate(transaction.date);
    }
  }, [transaction]);

  if (!transaction) {
    return (
      <View style={styles.safe}>
        <Text style={{ textAlign: "center", marginTop: 40 }}>
          Transaction not found.
        </Text>
      </View>
    );
  }

  const numericAmount = Number(amount) || 0;
  const spent = transaction.spent || 0;
  const remaining = Math.max(0, numericAmount - spent);

  /* ================= ACTIONS ================= */

  const handleSave = () => {
    updateTransaction(transaction.id, {
      name,
      amount: numericAmount,
      date,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirm Delete Transaction?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTransaction(transaction.id);
            router.replace("/(tabs)/home");
          },
        },
      ]
    );
  };

  /* ================= UI ================= */

  return (
    <View style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={THEME.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Generate Report</Text>

        <Pressable onPress={isEditing ? handleSave : () => setIsEditing(true)}>
          <Ionicons
            name={isEditing ? "checkmark" : "create-outline"}
            size={22}
            color={THEME.text}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* NAME */}
          {isEditing ? (
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.editTitle}
            />
          ) : (
            <Text style={styles.title}>{name}</Text>
          )}

          {/* DATE */}
          {isEditing ? (
            <TextInput
              value={date}
              onChangeText={setDate}
              style={styles.editDate}
              placeholder="MM/DD/YYYY"
            />
          ) : (
            <Text style={styles.date}>Added on {date}</Text>
          )}

          <ProgressDonut spent={spent} budget={numericAmount} />

          {/* SUMMARY */}
          <View style={styles.summary}>
            <Row label="Budget" value={peso(numericAmount)} />
            <Row label="Spent" value={peso(spent)} />
            <Row label="Remaining" value={peso(remaining)} />
          </View>

          <View style={styles.divider} />

          {/* DELETE */}
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Transaction</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================= ROW ================= */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.text,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    padding: 18,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: THEME.text,
  },

  editTitle: {
    fontSize: 16,
    fontWeight: "700",
    borderBottomWidth: 1,
    borderColor: THEME.border,
    textAlign: "center",
    marginBottom: 6,
  },

  date: {
    fontSize: 12,
    color: THEME.sub,
    textAlign: "center",
    marginBottom: 12,
  },

  editDate: {
    fontSize: 12,
    color: THEME.text,
    textAlign: "center",
    borderBottomWidth: 1,
    borderColor: THEME.border,
    marginBottom: 12,
  },

  centerText: {
    position: "absolute",
    alignItems: "center",
  },

  bigAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: THEME.text,
  },

  subText: { fontSize: 12, color: THEME.sub },
  mutedText: { fontSize: 11, color: THEME.sub },

  summary: { marginTop: 14 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  rowLabel: { fontSize: 13, color: THEME.sub },
  rowValue: { fontSize: 13, fontWeight: "700", color: THEME.text },

  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 16,
  },

  deleteBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },

  deleteText: {
    color: THEME.danger,
    fontWeight: "700",
    fontSize: 15,
  },
});
