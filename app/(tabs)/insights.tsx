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
  id: "weekly-trend" | "under-budget" | "subscription-alert";
  title: string;
  description: string;
  type: "card" | "alert-success" | "alert-warning";
};

/* ================= SCREEN ================= */

export default function InsightsScreen() {
  const { transactions } = useData();

  /* ================= DERIVED INSIGHTS ================= */

  const insights = useMemo<InsightItem[]>(() => {
    if (!transactions.length) return [];

    const result: InsightItem[] = [];

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentTx = transactions.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo
    );

    const totalRecentSpend = recentTx.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    /* WEEKLY TREND */
    if (recentTx.length >= 2) {
      result.push({
        id: "weekly-trend",
        title: "Weekly Spending Trend",
        description: `You made ${recentTx.length} transactions in the last 7 days.`,
        type: "card",
      });
    }

    /* UNDER BUDGET */
    if (totalRecentSpend < 5000 && recentTx.length > 0) {
      result.push({
        id: "under-budget",
        title: "You're Under Budget 🎉",
        description: `You spent only ₱${totalRecentSpend.toLocaleString()} this week.`,
        type: "alert-success",
      });
    }

    /* SUBSCRIPTION ALERT */
    const hasSubscription = transactions.some(
      (t) => t.category === "Subscriptions"
    );

    if (hasSubscription) {
      result.push({
        id: "subscription-alert",
        title: "Subscription Detected",
        description: "You have active subscription-related expenses.",
        type: "alert-warning",
      });
    }

    return result;
  }, [transactions]);

  const weeklyTrend = insights.find(i => i.id === "weekly-trend");
  const underBudget = insights.find(i => i.id === "under-budget");
  const subscriptionAlert = insights.find(i => i.id === "subscription-alert");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Analyze your spending habits</Text>
        </View>

        <ScreenFadeIn>
          {/* WEEKLY TREND */}
          {weeklyTrend && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/insight/[id]",
                  params: { id: "weekly-trend" },
                })
              }
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{weeklyTrend.title}</Text>
              <Text style={styles.cardSubtitle}>
                {weeklyTrend.description}
              </Text>

              <View style={styles.chartContainer}>
                <View style={styles.fakeLine} />
              </View>
            </TouchableOpacity>
          )}

          {/* UNDER BUDGET */}
          {underBudget && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/insight/[id]",
                  params: { id: "under-budget" },
                })
              }
              style={styles.alertCard}
            >
              <View style={[styles.iconWrapper, styles.successBg]}>
                <Ionicons name="arrow-down" size={18} color="#16A34A" />
              </View>

              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>{underBudget.title}</Text>
                <Text style={styles.alertDescription}>
                  {underBudget.description}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* SUBSCRIPTION ALERT */}
          {subscriptionAlert && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: "/insight/[id]",
                  params: { id: "subscription-alert" },
                })
              }
              style={styles.alertCard}
            >
              <View style={[styles.iconWrapper, styles.warningBg]}>
                <Ionicons name="alert" size={18} color="#F97316" />
              </View>

              <View style={styles.alertText}>
                <Text style={styles.alertTitle}>
                  {subscriptionAlert.title}
                </Text>
                <Text style={styles.alertDescription}>
                  {subscriptionAlert.description}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {insights.length === 0 && (
            <Text style={{ color: "#6B7280", fontSize: 13 }}>
              No insights yet. Add more transactions to unlock insights.
            </Text>
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
});
