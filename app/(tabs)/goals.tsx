import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useData } from "../../context/DataContext";

/* ================= THEME ================= */

const PRIMARY_BLUE = "#3B82F6";

export default function GoalsScreen() {
  const { transactions } = useData();

  /**
   * 🎯 Goals are transactions with category === "goal"
   * Correct math:
   * - spent (backend)
   * - else sum(expenses)
   * - else 0
   */
  const goals = useMemo(() => {
    return transactions
      .filter((t) => t.category === "goal")
      .map((t) => {
        const expenses = t.expenses ?? [];

        const saved =
          typeof t.spent === "number"
            ? t.spent
            : expenses.length > 0
            ? expenses.reduce((sum, e) => sum + e.amount, 0)
            : 0;

        const percentage =
          t.amount > 0
            ? Math.min(100, Math.round((saved / t.amount) * 100))
            : 0;

        const status =
          percentage >= 100
            ? "Completed"
            : percentage >= 50
            ? "On Track"
            : "In Progress";

        return {
          id: t.id,
          title: t.name,
          target: t.amount,
          saved,
          percentage,
          status,
        };
      });
  }, [transactions]);

  useFocusEffect(
    useCallback(() => {
      // reactive via DataContext
    }, [])
  );

  const renderGoalItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.cardHeader}>
        <View style={styles.cardText}>
          <Text style={styles.goalTitle}>{item.title}</Text>
          <Text style={styles.goalStatus}>{item.status}</Text>
        </View>
        <Text style={styles.percentText}>{item.percentage}%</Text>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${item.percentage}%` },
          ]}
        />
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.savedAmount}>
          PHP {item.saved.toLocaleString()}
        </Text>
        <Text style={styles.targetAmount}>
          of PHP {item.target.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        {/* LEFT SPACER (balances add button) */}
        <View style={styles.headerSpacer} />

        <Text style={styles.headerTitle}>Savings Goals</Text>

        {/* ➕ ADD GOAL */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/add",
              params: {
                mode: "goal",
                redirectTo: "/(tabs)/goals",
              },
            })
          }
        >
          <Ionicons name="add-circle" size={32} color={PRIMARY_BLUE} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoalItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          goals.length === 0 && styles.listEmptyContainer,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="leaf-outline"
              size={48}
              color={PRIMARY_BLUE}
            />
            <Text style={styles.emptyText}>
              No goals yet. Start saving today!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerSpacer: {
    width: 32, // same width as add icon
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  /* LIST */
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  listEmptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardText: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  goalStatus: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
    color: PRIMARY_BLUE,
  },
  percentText: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY_BLUE,
  },

  /* PROGRESS */
  progressBarBg: {
    height: 8,
    backgroundColor: "#E6EAF2",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: PRIMARY_BLUE,
  },

  /* AMOUNTS */
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  savedAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginRight: 4,
  },
  targetAmount: {
    fontSize: 12,
    color: "#6B7280",
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});
