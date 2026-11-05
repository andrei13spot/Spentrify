import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { formatLocalDateKey, parseLocalDate } from "../../utils/date";
import { API_BASE_URL } from "../../utils/api";

const THEME = {
  primary: "#3B82F6",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  border: "#E6EAF2",
};

function peso(n: number) {
  return `₱${n.toLocaleString()}`;
}

// Category colors for donut chart
const CATEGORY_COLORS = [
  "#3B82F6", // Blue
  "#22C55E", // Green
  "#A855F7", // Purple
  "#F59E0B", // Orange
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#8B5CF6", // Violet
  "#EC4899", // Pink
];

const CATEGORY_COLOR_MAP: Record<string, string> = {
  food: "#EF4444",
  groceries: "#22C55E",
  transportation: "#F59E0B",
  electricity: "#06B6D4",
  water: "#3B82F6",
  internet: "#8B5CF6",
  rent: "#A855F7",
  entertainment: "#EC4899",
  shopping: "#F97316",
  health: "#16A34A",
  education: "#2563EB",
  subscriptions: "#0EA5E9",
  others: "#6B7280",
};

function getCategoryColor(category?: string) {
  if (!category) {
    return "#6B7280";
  }
  const key = category.trim().toLowerCase();
  return CATEGORY_COLOR_MAP[key] || "#6B7280";
}

function getCategoryTint(category?: string) {
  const color = getCategoryColor(category);
  return `${color}1A`;
}

/* ================= AI INSIGHT CARD ================= */

function AIInsightCard({
  insight,
}: {
  insight: { message: string; type: string; title?: string } | null;
}) {
  if (!insight) return null;

  const isWarning =
    insight.type === "Overspending" ||
    insight.type === "Category Alert" ||
    insight.type === "Over Budget" ||
    insight.type === "Budget Warning";
  
  return (
    <View style={[styles.insightCard, isWarning && styles.insightCardWarning]}>
      <View style={styles.insightHeader}>
        <Ionicons 
          name={isWarning ? "alert-circle" : "bulb"} 
          size={18} 
          color={isWarning ? "#F59E0B" : "#3B82F6"} 
        />
        <Text style={styles.insightTitle}>
          {insight.title || (isWarning ? "Spending Alert" : "AI Insight")}
        </Text>
      </View>
      <Text style={styles.insightMessage}>{insight.message}</Text>
    </View>
  );
}

/* ================= MONTHLY SUMMARY ================= */

function MonthlySummaryCard({ 
  total, 
  categoryBreakdown 
}: { 
  total: number;
  categoryBreakdown: Array<{ category_name: string; total: number; percentage: number; icon?: string }>;
}) {
  const size = 180;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Create segments from real category data
  const segments = useMemo(() => {
    if (!categoryBreakdown || categoryBreakdown.length === 0) {
      // Fallback to empty state
      return [];
    }
    
    return categoryBreakdown.slice(0, 5).map((cat, i) => ({
      color: getCategoryColor(cat.category_name) || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      value: cat.percentage / 100,
      name: cat.category_name,
      amount: cat.total
    }));
  }, [categoryBreakdown]);

  let startAngle = -90;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>TOTAL THIS MONTH</Text>
      <Text style={styles.summaryValue}>{peso(total)}</Text>

      {segments.length > 0 ? (
        <>
          <Svg width={size} height={size}>
            {segments.map((seg, i) => {
              const length = 2 * Math.PI * r * seg.value;
              const dashArray = `${length} ${2 * Math.PI * r}`;
              const rotation = startAngle;
              startAngle += seg.value * 360;

              return (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={dashArray}
                  strokeLinecap="round"
                  rotation={rotation}
                  originX={cx}
                  originY={cy}
                  fill="none"
                />
              );
            })}
          </Svg>
          {/* Category legend */}
          <View style={styles.legend}>
            {segments.map((seg, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                <Text style={styles.legendText}>
                  {seg.name}: {peso(seg.amount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No spending data yet</Text>
        </View>
      )}
    </View>
  );
}

/* ================= SCREEN ================= */

export default function HomeScreen() {
  const {
    allTransactions,
    transactions: budgets,
    categories,
    loading,
    refreshData,
  } = useData();
  const { user } = useAuth();
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [backendInsights, setBackendInsights] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const categoryOptions = useMemo(() => {
    const names = new Set<string>();

    (categories || []).forEach((cat: any) => {
      if (cat?.category_name) {
        names.add(cat.category_name);
      }
    });

    allTransactions.forEach((tx: any) => {
      if (tx?.category) {
        names.add(tx.category);
      }
    });

    const sorted = Array.from(names).sort((a, b) => {
      const aKey = a.trim().toLowerCase();
      const bKey = b.trim().toLowerCase();
      if (aKey === "others" && bKey !== "others") return 1;
      if (bKey === "others" && aKey !== "others") return -1;
      return a.localeCompare(b);
    });

    return ["All", ...sorted];
  }, [categories, allTransactions]);

  const filteredTransactions = useMemo(() => {
    if (selectedCategory === "All") {
      return allTransactions;
    }
    return allTransactions.filter((tx: any) => tx?.category === selectedCategory);
  }, [allTransactions, selectedCategory]);
  /**
   * Monthly total — calculated from all transactions this month
   * Sums all spending transactions for the current month
   */
  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Sum all transactions from the current month
    return allTransactions.reduce((sum, tx) => {
      const txDate = parseLocalDate(tx.transaction_date || tx.created_at);
      if (txDate >= firstDayOfMonth) {
        return sum + (tx.amount || 0);
      }
      return sum;
    }, 0);
  }, [allTransactions]);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingAnalytics(true);

      await fetch(`${API_BASE_URL}/api/insights/generate?user_id=${user.id}`, {
        method: "POST",
      });

      // Fetch category breakdown
      const categoryRes = await fetch(
        `${API_BASE_URL}/api/analytics/by-category?user_id=${user.id}`
      );
      const categoryData = await categoryRes.json();
      if (categoryData.success) {
        setCategoryBreakdown(categoryData.data || []);
      }

      // Fetch AI insights (for variety)
      const insightsRes = await fetch(
        `${API_BASE_URL}/api/insights?user_id=${user.id}&limit=5`
      );
      const insightsData = await insightsRes.json();
      if (insightsData.success) {
        setBackendInsights(insightsData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [user?.id]);

  // Fetch category breakdown and AI insights
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, allTransactions]);

  const handleRefresh = async () => {
    await refreshData();
    await fetchAnalytics();
  };

  // Get user's first name from email or use default
  const userName = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[0].split('.')[0];
    }
    return 'User';
  }, [user]);

  const dashboardInsights = useMemo(() => {
    const insights: Array<{ message: string; type: string; title?: string }> = [];

    // Goal/Budget insight
    const overallBudget = budgets.find(
      (b) => !b.category || b.name === "Overall Budget"
    );
    if (overallBudget && overallBudget.amount > 0) {
      const spent = overallBudget.spent || 0;
      const percent = Math.round((spent / overallBudget.amount) * 100);
      if (percent >= 100) {
        insights.push({
          type: "Over Budget",
          title: "Over Budget",
          message: `You have exceeded your overall budget by ₱${Math.max(
            0,
            Math.round(spent - overallBudget.amount)
          ).toLocaleString()}.`,
        });
      } else if (percent >= 80) {
        insights.push({
          type: "Budget Warning",
          title: "Budget Alert",
          message: `You have used ${percent}% of your overall budget. You're close to the limit.`,
        });
      } else {
        insights.push({
          type: "Goal",
          title: "On Track",
          message: `You're on track with your overall budget. ${percent}% used so far.`,
        });
      }
    }

    // Biggest purchase this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTx = allTransactions.filter((tx: any) => {
      const txDate = parseLocalDate(tx.transaction_date || tx.created_at);
      return txDate >= firstDayOfMonth;
    });
    if (monthlyTx.length > 0) {
      const biggest = monthlyTx.reduce((max, tx) =>
        (tx.amount || 0) > (max.amount || 0) ? tx : max
      );
      insights.push({
        type: "Largest Purchase",
        title: "Highest Purchase",
        message: `Your highest purchase this month is ₱${Math.round(
          biggest.amount || 0
        ).toLocaleString()} at ${biggest.merchant_name || "a merchant"}.`,
      });
    }

    // Top category this month
    if (categoryBreakdown.length > 0) {
      const topCategory = categoryBreakdown[0];
      insights.push({
        type: "Category Alert",
        title: "Top Category",
        message: `Most of your spending this month is in ${topCategory.category_name} (₱${Math.round(
          topCategory.total || 0
        ).toLocaleString()}).`,
      });
    }

    // Weekly trend comparison (last 7 vs previous 7)
    if (allTransactions.length > 0) {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(today.getDate() - 14);

      const last7 = allTransactions.filter((tx: any) => {
        const txDate = parseLocalDate(tx.transaction_date || tx.created_at);
        return txDate >= sevenDaysAgo;
      });
      const prev7 = allTransactions.filter((tx: any) => {
        const txDate = parseLocalDate(tx.transaction_date || tx.created_at);
        return txDate >= fourteenDaysAgo && txDate < sevenDaysAgo;
      });

      const last7Total = last7.reduce(
        (sum: number, tx: any) => sum + (tx.amount || 0),
        0
      );
      const prev7Total = prev7.reduce(
        (sum: number, tx: any) => sum + (tx.amount || 0),
        0
      );
      if (prev7Total > 0) {
        const diffPercent = Math.round(
          ((last7Total - prev7Total) / prev7Total) * 100
        );
        insights.push({
          type: diffPercent > 0 ? "Category Alert" : "Goal",
          title: "Weekly Trend",
          message:
            diffPercent > 0
              ? `You spent ${diffPercent}% more in the last 7 days vs the week before.`
              : `You spent ${Math.abs(
                  diffPercent
                )}% less in the last 7 days vs the week before.`,
        });
      }
    }

    // Backend AI insights (add variety)
    backendInsights.forEach((insight: any) => {
      insights.push({
        type: insight.type || "AI",
        title: insight.type ? `${insight.type} Insight` : "AI Insight",
        message: insight.message,
      });
    });

    if (insights.length === 0) {
      insights.push({
        type: "AI",
        title: "AI Insight",
        message: "Add more transactions to unlock personalized insights.",
      });
    }

    return insights;
  }, [allTransactions, budgets, categoryBreakdown, backendInsights]);

  const selectedInsight = useMemo(() => {
    if (dashboardInsights.length === 0) return null;
    const seed =
      new Date().getDate() +
      allTransactions.length +
      (backendInsights[0]?.id || 0);
    const index = Math.abs(seed) % dashboardInsights.length;
    return dashboardInsights[index];
  }, [dashboardInsights, allTransactions.length, backendInsights]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Spending</Text>
          <Text style={styles.welcomeText}>Welcome back, {userName}</Text>
        </View>

        <Pressable
          onPress={() => router.push("/notifications")}
          style={styles.headerIcon}
        >
          <Ionicons name="notifications-outline" size={22} color={THEME.text} />
        </Pressable>
      </View>

      {loading && filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            Loading your spending data...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading || loadingAnalytics}
              onRefresh={handleRefresh}
              tintColor={THEME.primary}
            />
          }
          ListHeaderComponent={
            <>
              <MonthlySummaryCard 
                total={monthlyTotal} 
                categoryBreakdown={categoryBreakdown}
              />
              {selectedInsight && (
                <>
                  <View style={styles.divider} />
                  <AIInsightCard insight={selectedInsight} />
                </>
              )}
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <Pressable
                  style={styles.filterButtonIcon}
                  onPress={() => setShowFilterModal(true)}
                >
                  <Ionicons name="options-outline" size={18} color={THEME.text} />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {categoryOptions.map((category) => {
                  const isActive = category === selectedCategory;
                  return (
                    <Pressable
                      key={category}
                      style={[
                        styles.filterButton,
                        isActive && styles.filterButtonActive,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.filterButtonText,
                          isActive && styles.filterButtonTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No transactions yet. Add a transaction to start tracking your spending!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.transactionCard,
                { backgroundColor: getCategoryTint(item.category) },
              ]}
              onPress={() => setSelectedTransaction(item)}
            >
              <View style={styles.transactionRow}>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>
                    {item.merchant_name || item.description || "Transaction"}
                  </Text>
                  <Text style={styles.transactionMeta}>
                    {item.category || "Uncategorized"} •{" "}
                    {formatLocalDateKey(
                      parseLocalDate(item.transaction_date || item.created_at)
                    )}
                  </Text>
                </View>
                <View style={styles.transactionActions}>
                  <Text style={styles.transactionAmount}>
                    {peso(item.amount || 0)}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
      <Modal
        transparent
        animationType="fade"
        visible={Boolean(selectedTransaction)}
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit this transaction?</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTransaction?.merchant_name ||
                selectedTransaction?.description ||
                "Transaction"}
            </Text>
            <Text style={styles.modalMeta}>
              {selectedTransaction?.category || "Uncategorized"} •{" "}
              {selectedTransaction
                ? formatLocalDateKey(
                    parseLocalDate(
                      selectedTransaction.transaction_date ||
                        selectedTransaction.created_at
                    )
                  )
                : ""}
            </Text>
            <Text style={styles.modalAmount}>
              {peso(selectedTransaction?.amount || 0)}
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setSelectedTransaction(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimary]}
                onPress={() => {
                  const id = selectedTransaction?.id;
                  setSelectedTransaction(null);
                  if (id) {
                    router.push({
                      pathname: "/edit-transaction",
                      params: { id: String(id) },
                    });
                  }
                }}
              >
                <Text style={styles.modalPrimaryText}>Edit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        animationType="fade"
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by category</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Ionicons name="close" size={18} color={THEME.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {categoryOptions.map((category) => (
                <Pressable
                  key={category}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedCategory(category);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{category}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.text,
  },
  welcomeText: {
    fontSize: 13,
    color: THEME.sub,
    marginTop: 2,
  },
  headerIcon: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    padding: 16,
    paddingBottom: 120,
  },

  summaryCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME.sub,
    fontWeight: "600",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: "800",
    color: THEME.text,
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginBottom: 16,
  },


  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: THEME.sub,
    fontSize: 14,
  },
  
  insightCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  insightCardWarning: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.text,
    marginLeft: 8,
  },
  insightMessage: {
    fontSize: 13,
    color: THEME.sub,
    lineHeight: 18,
  },
  
  legend: {
    marginTop: 12,
    width: "100%",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 11,
    color: THEME.sub,
  },
  
  emptyChart: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    fontSize: 12,
    color: THEME.sub,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.text,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.card,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.card,
  },
  filterButtonActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterButtonText: {
    fontSize: 13,
    color: THEME.sub,
    fontWeight: "700",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  transactionCard: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionActions: {
    alignItems: "flex-end",
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.text,
  },
  transactionMeta: {
    fontSize: 12,
    color: THEME.sub,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalList: {
    maxHeight: 280,
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 10,
  },
  modalItemText: {
    fontSize: 14,
    color: THEME.text,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.text,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.card,
  },
  modalSubtitle: {
    fontSize: 14,
    color: THEME.text,
    marginBottom: 4,
  },
  modalMeta: {
    fontSize: 12,
    color: THEME.sub,
    marginBottom: 12,
  },
  modalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.text,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  modalCancel: {
    backgroundColor: "#F3F4F6",
  },
  modalCancelText: {
    color: THEME.text,
    fontWeight: "600",
  },
  modalPrimary: {
    backgroundColor: THEME.primary,
  },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});