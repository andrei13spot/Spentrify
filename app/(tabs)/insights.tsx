import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline, Circle } from "react-native-svg";
import ScreenFadeIn from "../../components/ScreenFadeIn";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { parseLocalDate } from "../../utils/date";

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

/* ================= TYPES ================= */

type InsightItem = {
  id: string;
  title: string;
  description: string;
  type: "card" | "alert-success" | "alert-warning";
  data?: any; // For chart data, etc.
};

/* ================= SCREEN ================= */

export default function InsightsScreen() {
  // Note: budgets = goals (they're the same thing in this app)
  // In DataContext: 'transactions' = budgets/goals, 'allTransactions' = actual spending transactions
  const { allTransactions, transactions: budgets } = useData();
  const { user } = useAuth();
  const [backendInsights, setBackendInsights] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any>(null);
  const [historicalAverages, setHistoricalAverages] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [insightMode, setInsightMode] = useState<"gemini" | "rules">("gemini");

  // Fetch insights and analytics from backend
  const fetchInsights = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Generate insights for selected mode
      await fetch(`${API_BASE_URL}/api/insights/generate?user_id=${user.id}&mode=${insightMode}`, {
        method: 'POST'
      });

      // Fetch AI insights
      const insightsRes = await fetch(
        `${API_BASE_URL}/api/insights?user_id=${user.id}&limit=10`
      );
      const insightsData = await insightsRes.json();
      if (insightsData.success) {
        setBackendInsights(insightsData.data || []);
      }
      
      // Fetch weekly trend
      const trendRes = await fetch(
        `${API_BASE_URL}/api/analytics/weekly-trend?user_id=${user.id}`
      );
      const trendData = await trendRes.json();
      if (trendData.success) {
        setWeeklyTrend(trendData.data || null);
      }
      
      // Fetch historical averages for baseline comparison
      const averagesRes = await fetch(
        `${API_BASE_URL}/api/analytics/historical-averages?user_id=${user.id}`
      );
      const averagesData = await averagesRes.json();
      if (averagesData.success) {
        setHistoricalAverages(averagesData.data || null);
      }
      
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [user?.id, allTransactions.length, insightMode]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  /* ================= DERIVED INSIGHTS FROM BACKEND DATA ================= */

  const insights = useMemo<InsightItem[]>(() => {
    const result: InsightItem[] = [];

    // Use actual transactions from backend (allTransactions)
    // If no transactions, return a helpful card
    if (!allTransactions || allTransactions.length === 0) {
      result.push({
        id: "no-data",
        title: "No insights yet",
        description: "Add transactions to generate personalized insights.",
        type: "card",
      });
      return result;
    }

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Filter transactions from last 7 days
    const recentTx = allTransactions.filter((tx: any) => {
      const txDate = parseLocalDate(tx.transaction_date || tx.created_at);
      return txDate >= sevenDaysAgo;
    });

    // Calculate total spending in last 7 days
    const totalRecentSpend = recentTx.reduce(
      (sum: number, tx: any) => sum + (tx.amount || 0),
      0
    );

    /* WEEKLY TREND */
    // Use backend weekly trend data if available
    if (weeklyTrend && weeklyTrend.currentWeek && weeklyTrend.currentWeek.length > 0) {
      const percentageChange = weeklyTrend.percentageChange || 0;
      const hasPreviousWeek = weeklyTrend.previousWeekTotal > 0;
      
      let description = '';
      if (hasPreviousWeek) {
        if (percentageChange > 0) {
          description = `You spent **${Math.round(percentageChange)}% more** than last week.`;
        } else if (percentageChange < 0) {
          description = `You spent **${Math.abs(Math.round(percentageChange))}% less** than last week.`;
        } else {
          description = `Your spending is the same as last week.`;
        }
      } else {
        description = `You spent ₱${weeklyTrend.currentWeekTotal.toLocaleString()} this week.`;
      }
      
      result.push({
        id: "weekly-trend",
        title: "Weekly Spending Trend",
        description: description,
        type: "card",
        data: weeklyTrend.currentWeek,
      });
    } else if (recentTx.length >= 2) {
      result.push({
        id: "weekly-trend",
        title: "Weekly Spending Trend",
        description: `You made ${recentTx.length} transactions in the last 7 days, spending ₱${totalRecentSpend.toLocaleString()}.`,
        type: "card",
      });
    }

    /* RECENT SUMMARY */
    if (recentTx.length > 0) {
      const largestRecent = recentTx.reduce((max: any, tx: any) =>
        (tx.amount || 0) > (max.amount || 0) ? tx : max
      );
      result.push({
        id: "recent-summary",
        title: "Recent Activity",
        description: `Last 7 days: ${recentTx.length} transactions totaling ₱${totalRecentSpend.toLocaleString()}. Largest: ₱${Math.round(
          largestRecent.amount || 0
        ).toLocaleString()} at ${largestRecent.merchant_name || "a merchant"}.`,
        type: "card",
      });
    }

    /* TOP CATEGORY */
    if (allTransactions.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const last30Tx = allTransactions.filter((tx: any) => {
        const txDate = parseLocalDate(tx.transaction_date || tx.created_at);
        return txDate >= thirtyDaysAgo;
      });
      const categoryTotals = new Map<string, number>();
      last30Tx.forEach((tx: any) => {
        const name = tx.category || "Others";
        categoryTotals.set(name, (categoryTotals.get(name) || 0) + (tx.amount || 0));
      });
      let topCategory: { name: string; total: number } | null = null;
      for (const [name, total] of categoryTotals.entries()) {
        if (!topCategory || total > topCategory.total) {
          topCategory = { name, total };
        }
      }
      if (topCategory) {
        result.push({
          id: "top-category",
          title: "Top Category (30 days)",
          description: `Your top category is ${topCategory.name} with ₱${Math.round(
            topCategory.total
          ).toLocaleString()} in the last 30 days.`,
          type: "card",
        });
      }
    }

    if (insightMode === "gemini") {
      backendInsights.forEach((insight) => {
        const title =
          insight.type && insight.type !== "AI Summary"
            ? insight.type
            : "Gemini Summary";
        result.push({
          id: `backend-${insight.id}`,
          title,
          description: insight.message,
          type: "card",
        });
      });
      if (result.length > 0) {
        return result;
      }
      // Fallback to rule-based insights if Gemini returns nothing
    }

    /* UNDER BUDGET / SPENDING PACE */
    // Check if spending is under budget OR below historical average
    let isUnderBudget = false;
    let budgetAmount = 0;
    let comparisonText = '';
    
    if (budgets.length > 0) {
      // Check if spending is under any budget
      const overallBudget = budgets.find((b) => !b.category || b.name === "Overall Budget");
      if (overallBudget && overallBudget.amount > 0) {
        // Calculate weekly budget (assuming monthly budget)
        const weeklyBudget = overallBudget.amount / 4;
        budgetAmount = weeklyBudget;
        if (totalRecentSpend < weeklyBudget) {
          isUnderBudget = true;
          const underAmount = Math.round(weeklyBudget - totalRecentSpend);
          comparisonText = `Great job! You're PHP ${underAmount.toLocaleString()} under your monthly budget.`;
        }
      }
    } else if (historicalAverages && historicalAverages.hasEnoughData) {
      // No budget set - compare to historical average
      const weeklyAverage = historicalAverages.weeklyAverage || 0;
      if (weeklyAverage > 0) {
        const diff = weeklyAverage - totalRecentSpend;
        const diffPercent = ((diff / weeklyAverage) * 100);
        
        if (diff > 0 && diffPercent > 10) {
          // Spending is significantly below historical average
          isUnderBudget = true;
          comparisonText = `Great job! You're spending PHP ${Math.round(diff).toLocaleString()} less than your weekly average (${Math.round(diffPercent)}% below).`;
        } else if (diff < 0 && Math.abs(diffPercent) > 10) {
          // Spending is above historical average - show as alert
          result.push({
            id: "spending-pace",
            title: "Spending Alert",
            description: `You're spending PHP ${Math.round(Math.abs(diff)).toLocaleString()} more than your weekly average (${Math.round(Math.abs(diffPercent))}% above).`,
            type: "alert-warning",
          });
        }
      }
    } else if (totalRecentSpend < 5000 && recentTx.length > 0 && !historicalAverages?.hasEnoughData) {
      // Fallback: if no budget and not enough historical data, use reasonable threshold
      isUnderBudget = true;
      comparisonText = `You spent ₱${totalRecentSpend.toLocaleString()} this week. Add more transactions to get personalized insights!`;
    }

    if (isUnderBudget && recentTx.length > 0 && comparisonText) {
      result.push({
        id: "under-budget",
        title: "Under Budget",
        description: comparisonText,
        type: "alert-success",
      });
    }

    /* SUBSCRIPTION ALERT */
    // Check for subscription-related transactions
    const subscriptionTransactions = allTransactions.filter((tx: any) => {
      // Check if merchant name contains subscription keywords
      const merchantName = (tx.merchant_name || '').toLowerCase();
      const subscriptionKeywords = ['netflix', 'spotify', 'youtube', 'premium', 'subscription', 'monthly'];
      return subscriptionKeywords.some(keyword => merchantName.includes(keyword));
    });

    if (subscriptionTransactions.length > 0) {
      // Group by merchant to detect price changes
      const merchantMap = new Map();
      subscriptionTransactions.forEach((tx: any) => {
        const merchant = tx.merchant_name || 'Unknown';
        if (!merchantMap.has(merchant)) {
          merchantMap.set(merchant, []);
        }
        merchantMap.get(merchant).push(tx);
      });

      // Check for price changes (compare most recent with previous)
      merchantMap.forEach((txs, merchant) => {
        if (txs.length >= 2) {
          // Sort by date
          txs.sort((a: any, b: any) => {
            const dateA = parseLocalDate(a.transaction_date || a.created_at);
            const dateB = parseLocalDate(b.transaction_date || b.created_at);
            return dateB.getTime() - dateA.getTime();
          });
          
          const latest = txs[0];
          const previous = txs[1];
          const priceDiff = latest.amount - previous.amount;
          
          if (Math.abs(priceDiff) > 10) { // Significant change (>₱10)
            result.push({
              id: `subscription-alert-${merchant}`,
              title: "Subscription Alert",
              description: `${merchant} price ${priceDiff > 0 ? 'increased' : 'decreased'} by PHP ${Math.abs(priceDiff).toLocaleString()} this month.`,
              type: "alert-warning",
            });
          }
        }
      });
      
      // If no price changes detected, show general subscription alert
      if (result.filter(r => r.id.startsWith('subscription-alert-')).length === 0) {
        const subscriptionTotal = subscriptionTransactions.reduce(
          (sum: number, tx: any) => sum + (tx.amount || 0),
          0
        );
        result.push({
          id: "subscription-alert",
          title: "Subscription Alert",
          description: `You have ${subscriptionTransactions.length} subscription-related expense${subscriptionTransactions.length > 1 ? 's' : ''} totaling ₱${subscriptionTotal.toLocaleString()}.`,
          type: "alert-warning",
        });
      }
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

    // Add backend AI insights
    backendInsights.forEach((insight) => {
      const isSuccess = insight.type === 'Projection' || insight.type === 'Habit';
      result.push({
        id: `backend-${insight.id}`,
        title: insight.type === 'Overspending' ? 'Over Budget' : 
               insight.type === 'Subscription' ? 'Subscription Alert' :
               insight.type === 'Category Alert' ? 'Spending Alert' :
               insight.type === 'Projection' ? 'Under Budget' :
               insight.type === 'Habit' ? 'Spending Pattern' : insight.type,
        description: insight.message,
        type: isSuccess ? "alert-success" : "alert-warning",
      });
    });
    
    return result;
  }, [allTransactions, budgets, backendInsights, weeklyTrend, historicalAverages]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>Analyze your spending habits</Text>
        </View>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              insightMode === "gemini" && styles.modeButtonActive,
            ]}
            onPress={() => setInsightMode("gemini")}
          >
            <Text
              style={[
                styles.modeButtonText,
                insightMode === "gemini" && styles.modeButtonTextActive,
              ]}
            >
              Gemini
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              insightMode === "rules" && styles.modeButtonActive,
            ]}
            onPress={() => setInsightMode("rules")}
          >
            <Text
              style={[
                styles.modeButtonText,
                insightMode === "rules" && styles.modeButtonTextActive,
              ]}
            >
              Rule-based
            </Text>
          </TouchableOpacity>
        </View>

        {loading && insights.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={[styles.emptyText, { marginTop: 16 }]}>
              Loading insights...
            </Text>
          </View>
        ) : (
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
                const trendData = insight.data || [];
                const points = trendData.length > 0 
                  ? trendData.map((day: any, i: number) => {
                      const max = Math.max(...trendData.map((d: any) => d.amount), 1);
                      const x = (i / Math.max(1, trendData.length - 1)) * 200;
                      const y = 50 - ((day.amount / max) * 50);
                      return `${x},${y}`;
                    }).join(' ')
                  : '';
                
                // Parse description to highlight percentage
                const descriptionParts = insight.description.split('**');
                const hasHighlight = descriptionParts.length > 1;
                
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
                    {hasHighlight ? (
                      <Text style={styles.cardSubtitle}>
                        {descriptionParts[0]}
                        <Text style={styles.highlightText}>{descriptionParts[1]}</Text>
                        {descriptionParts[2]}
                      </Text>
                    ) : (
                      <Text style={styles.cardSubtitle}>
                        {insight.description}
                      </Text>
                    )}
                    <View style={styles.chartContainer}>
                      {points ? (
                        <Svg width={200} height={50}>
                          <Polyline
                            points={points}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Add dots for each data point */}
                          {trendData.map((day: any, i: number) => {
                            const max = Math.max(...trendData.map((d: any) => d.amount), 1);
                            const x = (i / Math.max(1, trendData.length - 1)) * 200;
                            const y = 50 - ((day.amount / max) * 50);
                            return (
                              <Circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={3}
                                fill="#3B82F6"
                              />
                            );
                          })}
                        </Svg>
                      ) : (
                        <View style={styles.fakeLine} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }

              // Alert cards (under budget, subscription, overspending)
              const isSuccess = insight.type === "alert-success";

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
        )}
      </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  modeToggle: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  modeButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },
  modeButtonTextActive: {
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  highlightText: {
    color: "#3B82F6",
    fontWeight: "600",
  },

  chartContainer: {
    marginTop: 8,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  successBg: {
    backgroundColor: "#DCFCE7",
  },
  warningBg: {
    backgroundColor: "#FFEDD5",
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
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