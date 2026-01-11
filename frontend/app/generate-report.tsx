import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

/* ================= HELPERS ================= */

function peso(n: number) {
  return `₱${n.toLocaleString()}`;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function GenerateReportScreen() {
  const { user } = useAuth();
  const { transactions } = useData();
  const { id } = useLocalSearchParams<{ id: string }>();

  /* ================= SESSION GUARD ================= */

  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      lastUserIdRef.current = null;
      router.replace("/(tabs)/home");
      return;
    }

    if (lastUserIdRef.current && lastUserIdRef.current !== user.id) {
      router.replace("/(tabs)/home");
      return;
    }

    lastUserIdRef.current = user.id;
  }, [user]);

  /* ================= DATA RESOLUTION ================= */

  const item = useMemo(() => {
    if (!id) return null;
    return transactions.find((t) => t.id === id) ?? null;
  }, [transactions, id]);

  /* ================= 🔒 HARD SAFETY ================= */

  const budget = item?.amount ?? 0;
  const expenses = item?.expenses ?? [];

  const spent =
    typeof item?.spent === "number"
      ? item.spent
      : expenses.length > 0
      ? expenses.reduce((sum, e) => sum + e.amount, 0)
      : 0;

  const remaining = Math.max(0, budget - spent);

  const progress =
    budget > 0 && spent > 0 ? clamp01(spent / budget) : 0;

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Generate Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <Text style={styles.itemTitle}>{item?.name ?? "—"}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>Budget</Text>
            <Text style={styles.value}>{peso(budget)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>Spent</Text>
            <Text style={styles.value}>{peso(spent)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.label}>Remaining</Text>
            <Text style={styles.value}>{peso(remaining)}</Text>
          </View>

          <Text style={styles.progressText}>
            {Math.round(progress * 100)}% used
          </Text>
        </View>

        {/* REPORT PROMPT */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Report Generator</Text>
          <Text style={styles.cardSub}>
            Describe what kind of financial report you want to generate.
          </Text>

          <TextInput
            multiline
            placeholder="Example: Generate a reimbursement summary including budget usage and remaining balance."
            style={styles.input}
          />

          <Pressable style={styles.generateBtn}>
            <Text style={styles.generateText}>Generate report</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.backHome}
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Text style={styles.backHomeText}>Return to Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    padding: 20,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E6EAF2",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    color: "#6B7280",
    fontSize: 13,
  },
  value: {
    fontWeight: "700",
  },
  progressText: {
    marginTop: 10,
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  generateBtn: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  generateText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  backHome: {
    alignItems: "center",
  },
  backHomeText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 14,
  },
});
