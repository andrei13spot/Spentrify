import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";

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

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

const API_BASE_URL = getApiBaseUrl();

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

/* ================= AI INSIGHT CARD ================= */

function AIInsightCard({ insight }: { insight: { message: string; type: string } | null }) {
  if (!insight) return null;

  const isWarning = insight.type === 'Overspending' || insight.type === 'Category Alert';
  
  return (
    <View style={[styles.insightCard, isWarning && styles.insightCardWarning]}>
      <View style={styles.insightHeader}>
        <Ionicons 
          name={isWarning ? "alert-circle" : "bulb"} 
          size={18} 
          color={isWarning ? "#F59E0B" : "#3B82F6"} 
        />
        <Text style={styles.insightTitle}>
          {isWarning ? "Spending Alert" : "AI Insight"}
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
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
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

/* ================= CARD ================= */

function RealtimeTransactionCard({
  item,
}: {
  item: {
    id: string;
    name: string;
    budget: number;
    spent: number;
    trend: number[];
  };
}) {
  const progress = clamp01(item.spent / item.budget);

  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  const trendW = 200;
  const trendH = 50;

  const points = useMemo(() => {
    const values = item.trend.length ? item.trend : [0];
    const maxV = Math.max(...values, 1);
    const minV = Math.min(...values, 0);
    const range = Math.max(1, maxV - minV);

    return values
      .map((v, i) => {
        const x = (i / Math.max(1, values.length - 1)) * trendW;
        const y = trendH - ((v - minV) / range) * trendH;
        return `${x},${y}`;
      })
      .join(" ");
  }, [item.trend]);

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/report",
          params: { id: item.id },
        })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={18} color={THEME.sub} />
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.ringWrap}>
          <Svg width={size} height={size}>
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke="#E8EEF8"
              strokeWidth={stroke}
              fill="none"
            />
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={THEME.primary}
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              rotation={-90}
              originX={cx}
              originY={cy}
              fill="none"
            />
          </Svg>

          <View style={styles.ringCenter}>
            <Text style={styles.ringLabel}>Spent</Text>
            <Text style={styles.ringValue}>{peso(item.spent)}</Text>
            <Text style={styles.ringSub}>of {peso(item.budget)}</Text>
          </View>
        </View>

        <View style={styles.trendWrap}>
          <Text style={styles.trendTitle}>Realtime Spend</Text>

          <Svg width={trendW} height={trendH}>
            <Polyline
              points={points}
              fill="none"
              stroke={THEME.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Remaining</Text>
              <Text style={styles.kpiValue}>
                {peso(Math.max(0, item.budget - item.spent))}
              </Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Progress</Text>
              <Text style={styles.kpiValue}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.tapHint}>Tap to view report</Text>
    </Pressable>
  );
}

/* ================= SCREEN ================= */

export default function HomeScreen() {
  const { transactions, allTransactions, loading, refreshData } = useData();
  const { user } = useAuth();
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<{ message: string; type: string } | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  /**
   * BACKEND-READY DERIVATION
   * - Supports backend-sent `spent` and `trend`
   * - Falls back to computing from `expenses`
   */
 const chartData = useMemo(() => {
  return transactions.map((t) => {
    const expenses = t.expenses ?? [];

    const spent =
      typeof t.spent === "number"
        ? t.spent
        : expenses.length > 0
        ? expenses.reduce((sum, e) => sum + e.amount, 0)
        : 0;

    const trend =
      Array.isArray(t.trend) && t.trend.length > 0
        ? t.trend
        : expenses.reduce<number[]>((acc, e) => {
            const prev = acc.length ? acc[acc.length - 1] : 0;
            acc.push(prev + e.amount);
            return acc;
          }, []);

    return {
      id: t.id,
      name: t.name,
      budget: t.amount,
      spent,
      trend,
    };
  });
}, [transactions]);


  /**
   * Monthly total — calculated from all transactions this month
   * Sums all spending transactions for the current month
   */
  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Sum all transactions from the current month
    return allTransactions.reduce((sum, tx) => {
      const txDate = new Date(tx.transaction_date || tx.created_at);
      if (txDate >= firstDayOfMonth) {
        return sum + (tx.amount || 0);
      }
      return sum;
    }, 0);
  }, [allTransactions]);

  // Fetch category breakdown and AI insights
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingAnalytics(true);
        
        // Fetch category breakdown
        const categoryRes = await fetch(
          `${API_BASE_URL}/api/analytics/by-category?user_id=${user.id}`
        );
        const categoryData = await categoryRes.json();
        if (categoryData.success) {
          setCategoryBreakdown(categoryData.data || []);
        }
        
        // Fetch top AI insight
        const insightsRes = await fetch(
          `${API_BASE_URL}/api/insights?user_id=${user.id}&limit=1`
        );
        const insightsData = await insightsRes.json();
        if (insightsData.success && insightsData.data.length > 0) {
          setAiInsight({
            message: insightsData.data[0].message,
            type: insightsData.data[0].type
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    
    fetchAnalytics();
  }, [user?.id, allTransactions.length]);

  // Get user's first name from email or use default
  const userName = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[0].split('.')[0];
    }
    return 'User';
  }, [user]);

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

      {loading && chartData.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>
            Loading your spending data...
          </Text>
        </View>
      ) : (
        <FlatList
          data={chartData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refreshData}
              tintColor={THEME.primary}
            />
          }
          ListHeaderComponent={
            <>
              <MonthlySummaryCard 
                total={monthlyTotal} 
                categoryBreakdown={categoryBreakdown}
              />
              {aiInsight && (
                <>
                  <View style={styles.divider} />
                  <AIInsightCard insight={aiInsight} />
                </>
              )}
              {chartData.length > 0 && <View style={styles.divider} />}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No budgets yet. Create a budget to start tracking your spending!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <RealtimeTransactionCard item={item} />
          )}
        />
      )}
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

  card: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.text,
  },

  bodyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  ringWrap: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  ringLabel: { fontSize: 12, color: THEME.sub },
  ringValue: { fontSize: 18, fontWeight: "800", color: THEME.text },
  ringSub: { fontSize: 12, color: THEME.sub },

  trendWrap: { flex: 1, paddingLeft: 14 },
  trendTitle: {
    fontSize: 12,
    color: THEME.sub,
    fontWeight: "600",
    marginBottom: 6,
  },

  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "#F3F7FF",
    borderRadius: 12,
    padding: 10,
  },
  kpiLabel: { fontSize: 11, color: THEME.sub },
  kpiValue: { fontSize: 14, fontWeight: "700", color: THEME.text },

  tapHint: {
    textAlign: "center",
    fontSize: 12,
    color: THEME.sub,
    marginTop: 10,
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
});