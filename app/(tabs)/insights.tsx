import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenFadeIn from "../../components/ScreenFadeIn";
import { useData } from "../../context/DataContext";

/* ================= TYPES ================= */

type InsightItem = {
  id: string; // Can be "weekly-trend", "under-budget", "subscription-alert", or "overspending-{budgetId}"
  title: string;
  description: string;
  type: "card" | "alert-success" | "alert-warning";
};

/* ================= SCREEN ================= */

export default function InsightsScreen() {
  const { allTransactions, transactions: budgets } = useData();

  /* ================= DERIVED INSIGHTS FROM BACKEND DATA ================= */

  const insights = useMemo<InsightItem[]>(() => {
    const result: InsightItem[] = [];

    // Use actual transactions from backend (allTransactions)
    // If no transactions, return empty
    if (!allTransactions || allTransactions.length === 0) {
      return result;
    }

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Filter transactions from last 7 days
    const recentTx = allTransactions.filter((tx: any) => {
      const txDate = new Date(tx.transaction_date || tx.created_at);
      return txDate >= sevenDaysAgo;
    });

    // Calculate total spending in last 7 days
    const totalRecentSpend = recentTx.reduce(
      (sum: number, tx: any) => sum + (tx.amount || 0),
      0
    );

    /* WEEKLY TREND */
    // Show if user has made at least 2 transactions in the last week
    if (recentTx.length >= 2) {
      result.push({
        id: "weekly-trend",
        title: "Weekly Spending Trend",
        description: `You made ${recentTx.length} transactions in the last 7 days, spending ₱${totalRecentSpend.toLocaleString()}.`,
        type: "card",
      });
    }

    /* UNDER BUDGET */
    // Check if spending is under a reasonable threshold (₱5,000 per week)
    // Or check against actual budgets if available
    let isUnderBudget = false;
    if (totalRecentSpend < 5000 && recentTx.length > 0) {
      isUnderBudget = true;
    } else if (budgets.length > 0) {
      // Check if spending is under any budget
      const overallBudget = budgets.find((b) => !b.category || b.name === "Overall Budget");
      if (overallBudget && overallBudget.amount > 0) {
        // Calculate weekly budget (assuming monthly budget)
        const weeklyBudget = overallBudget.amount / 4;
        if (totalRecentSpend < weeklyBudget) {
          isUnderBudget = true;
        }
      }
    }

    if (isUnderBudget && recentTx.length > 0) {
      result.push({
        id: "under-budget",
        title: "You're Under Budget 🎉",
        description: `You spent only ₱${totalRecentSpend.toLocaleString()} this week. Great job!`,
        type: "alert-success",
      });
    }

    /* SUBSCRIPTION ALERT */
    // Check if there are transactions with "Subscriptions" category
    // First, get category IDs for subscriptions
    const subscriptionTransactions = allTransactions.filter((tx: any) => {
      // Check if merchant name contains subscription keywords
      const merchantName = (tx.merchant_name || '').toLowerCase();
      const subscriptionKeywords = ['netflix', 'spotify', 'youtube', 'premium', 'subscription', 'monthly'];
      return subscriptionKeywords.some(keyword => merchantName.includes(keyword));
    });

    if (subscriptionTransactions.length > 0) {
      const subscriptionTotal = subscriptionTransactions.reduce(
        (sum: number, tx: any) => sum + (tx.amount || 0),
        0
      );
      result.push({
        id: "subscription-alert",
        title: "Subscription Detected",
        description: `You have ${subscriptionTransactions.length} subscription-related expense${subscriptionTransactions.length > 1 ? 's' : ''} totaling ₱${subscriptionTotal.toLocaleString()}.`,
        type: "alert-warning",
      });
    }

    /* OVERSPENDING ALERT */
    // Check if any budget is exceeded
    budgets.forEach((budget) => {
      if (budget.spent && budget.amount && budget.spent > budget.amount) {
        const overAmount = budget.spent - budget.amount;
        result.push({
          id: `overspending-${budget.id}`,
          title: `Over Budget: ${budget.name}`,
          description: `You've exceeded your ${budget.name} budget by ₱${overAmount.toLocaleString()}.`,
          type: "alert-warning",
        });
      }
    });

    return result;
  }, [allTransactions, budgets]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Analyze your spending habits</Text>
        </View>

        <ScreenFadeIn>
          {insights.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No insights yet. Add more transactions to unlock insights.
              </Text>
            </View>
          ) : (
            insights.map((insight) => {
              // Weekly trend card
              if (insight.id === "weekly-trend") {
                return (
                  <TouchableOpacity
                    key={insight.id}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: "/insight/[id]",
                        params: { id: "weekly-trend" },
                      })
                    }
                    style={styles.card}
                  >
                    <Text style={styles.cardTitle}>{insight.title}</Text>
                    <Text style={styles.cardSubtitle}>
                      {insight.description}
                    </Text>
                    <View style={styles.chartContainer}>
                      <View style={styles.fakeLine} />
                    </View>
                  </TouchableOpacity>
                );
              }

              // Alert cards (under budget, subscription, overspending)
              const isSuccess = insight.type === "alert-success";
              const isWarning = insight.type === "alert-warning";

              return (
                <TouchableOpacity
                  key={insight.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/insight/[id]",
                      params: { id: insight.id },
                    })
                  }
                  style={styles.alertCard}
                >
                  <View
                    style={[
                      styles.iconWrapper,
                      isSuccess ? styles.successBg : styles.warningBg,
                    ]}
                  >
                    <Ionicons
                      name={isSuccess ? "arrow-down" : "alert-circle"}
                      size={18}
                      color={isSuccess ? "#16A34A" : "#F97316"}
                    />
                  </View>

                  <View style={styles.alertText}>
                    <Text style={styles.alertTitle}>{insight.title}</Text>
                    <Text style={styles.alertDescription}>
                      {insight.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScreenFadeIn>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },

  chartContainer: {
    marginTop: 14,
    height: 90,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  fakeLine: {
    height: 2,
    backgroundColor: "#3B82F6",
    borderRadius: 2,
  },

  alertCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  successBg: {
    backgroundColor: "#DCFCE7",
  },
  warningBg: {
    backgroundColor: "#FFEDD5",
  },
  alertText: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  alertDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});
