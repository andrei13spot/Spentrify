// app/(tabs)/home.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HeroBalanceCard } from "../../components/dashboard/HeroBalanceCard";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { SpendingDonutChart } from "../../components/dashboard/SpendingDonutChart";
import {
  FeedTransaction,
  RecentActivityFeed,
} from "../../components/dashboard/RecentActivityFeed";

import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { useNotifications } from "../../context/NotificationContext";
import { API_BASE_URL } from "../../utils/api";
import { parseLocalDate } from "../../utils/date";
import { THEME, getCategoryColor, getCategoryIcon } from "../../constants/theme";
import { fonts } from "../../constants/fonts";

export default function HomeScreen() {
  const { allTransactions, refreshData, loading } = useData();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const unreadCount = notifications.length;

  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [topInsight, setTopInsight] = useState<{ title: string; message: string; type: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState<FeedTransaction | null>(null);

  // User Greeting
  const displayName = useMemo(() => {
    if (user?.email) return user.email.split("@")[0];
    return "Spender";
  }, [user]);

  // Current Month Name
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  }, []);

  // Monthly Total Spending
  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    return allTransactions.reduce((sum, tx) => {
      const txDate = parseLocalDate(tx.transaction_date || tx.created_at);
      if (txDate >= firstDay) {
        return sum + (Number(tx.amount) || 0);
      }
      return sum;
    }, 0);
  }, [allTransactions]);

  // Daily Average Spending
  const dailyAverage = useMemo(() => {
    const dayOfMonth = Math.max(1, new Date().getDate());
    return monthlyTotal / dayOfMonth;
  }, [monthlyTotal]);

  // Fetch Category Breakdown & Insight
  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch category breakdown
      const catRes = await fetch(`${API_BASE_URL}/api/analytics/by-category?user_id=${user.id}`);
      const catJson = await catRes.json();
      if (catJson.success && Array.isArray(catJson.data)) {
        setCategoryBreakdown(catJson.data);
      }

      // Fetch top AI Insight
      const insRes = await fetch(`${API_BASE_URL}/api/insights?user_id=${user.id}&limit=1`);
      const insJson = await insRes.json();
      if (insJson.success && insJson.data && insJson.data.length > 0) {
        const item = insJson.data[0];
        setTopInsight({
          title: item.title || item.insight_type || "Financial Insight",
          message: item.message,
          type: item.insight_type || "General",
        });
      }
    } catch (err) {
      console.warn("Analytics fetch failed:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, allTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await fetchAnalytics();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View style={styles.userSection}>
          <Text style={styles.greetingSub}>Welcome back,</Text>
          <Text style={styles.greetingName}>{displayName}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.notifButton}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={22} color={THEME.text} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loading}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
      >
        {/* Hero Card */}
        <HeroBalanceCard
          totalSpending={monthlyTotal}
          dailyAverage={dailyAverage}
          transactionCount={allTransactions.length}
          monthName={currentMonthName}
        />

        {/* Quick Actions Row */}
        <QuickActions
          onPressAdd={() => router.push("/(tabs)/add")}
          onPressGoals={() => router.push("/(tabs)/goals/goals-index")}
          onPressExports={() => router.push("/exports")}
          onPressNotifications={() => router.push("/notifications")}
          unreadCount={unreadCount}
        />

        {/* AI Insight Highlight (if present) */}
        {topInsight && (
          <View style={styles.insightBanner}>
            <View style={styles.insightIconCircle}>
              <Ionicons
                name={topInsight.type.includes("Alert") ? "alert-circle" : "bulb"}
                size={18}
                color={topInsight.type.includes("Alert") ? THEME.warning : THEME.primary}
              />
            </View>
            <View style={styles.insightTextCol}>
              <Text style={styles.insightTitle}>{topInsight.title}</Text>
              <Text style={styles.insightMessage} numberOfLines={2}>
                {topInsight.message}
              </Text>
            </View>
          </View>
        )}

        {/* Category Spending Donut */}
        <SpendingDonutChart
          categoryBreakdown={categoryBreakdown}
          totalSpending={monthlyTotal}
        />

        {/* Recent Transactions Activity Feed */}
        <RecentActivityFeed
          transactions={allTransactions}
          onPressTransaction={(tx) => setSelectedTx(tx)}
          onPressSeeAll={() => router.push("/(tabs)/insights")}
          limit={6}
        />
      </ScrollView>

      {/* Transaction Inspection Modal */}
      <Modal
        visible={Boolean(selectedTx)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalCatBadge, { backgroundColor: selectedTx ? getCategoryColor(selectedTx.category) + '1A' : '#EFF6FF' }]}>
                <Ionicons
                  name={getCategoryIcon(selectedTx?.category) as any}
                  size={24}
                  color={getCategoryColor(selectedTx?.category)}
                />
              </View>
              <Text style={styles.modalMerchant}>
                {selectedTx?.merchant_name || selectedTx?.description || "Expense"}
              </Text>
              <Text style={styles.modalAmount}>
                ₱{(selectedTx?.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>

            {/* Transaction Details */}
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Category</Text>
                <Text style={styles.detailVal}>{selectedTx?.category || "Others"}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Date</Text>
                <Text style={styles.detailVal}>{selectedTx?.transaction_date || "N/A"}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Source</Text>
                <Text style={styles.detailVal}>{selectedTx?.source_type || "Digital"}</Text>
              </View>
              {Boolean(selectedTx?.is_reimbursable) && (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Status</Text>
                    <Text style={[styles.detailVal, { color: '#0284C7' }]}>Reimbursable Expense</Text>
                  </View>
                </>
              )}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setSelectedTx(null)}
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </Pressable>
              <Pressable
                style={styles.editBtn}
                onPress={() => {
                  const id = selectedTx?.id;
                  setSelectedTx(null);
                  if (id) {
                    router.push({
                      pathname: "/edit-transaction",
                      params: { id: String(id) },
                    });
                  }
                }}
              >
                <Ionicons name="pencil" size={16} color="#FFFFFF" />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: THEME.canvas,
  },
  userSection: {
    justifyContent: "center",
  },
  greetingSub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 18,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.card,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: THEME.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: fonts.heading,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  insightBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    marginHorizontal: 18,
    marginBottom: 20,
    padding: 14,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    gap: 12,
  },
  insightIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  insightTextCol: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalSheet: {
    width: "100%",
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.xl,
    padding: 24,
    alignItems: "center",
    ...THEME.shadows.float,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalCatBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalMerchant: {
    fontSize: 17,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginBottom: 4,
    textAlign: "center",
  },
  modalAmount: {
    fontSize: 26,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  detailsBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: THEME.radius.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },
  detailKey: {
    fontSize: 13,
    color: THEME.sub,
    fontFamily: fonts.body,
  },
  detailVal: {
    fontSize: 13,
    color: THEME.text,
    fontFamily: fonts.heading,
  },
  modalActionRow: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: THEME.radius.lg,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.sub,
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: THEME.radius.lg,
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  editBtnText: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: "#FFFFFF",
  },
});
