import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { parseLocalDate } from "../../utils/date";
import { API_BASE_URL } from "../../utils/api";

type InsightSentiment = "positive" | "negative" | "neutral";

type InsightPayload = {
  id: string;
  sentiment: InsightSentiment;
  summary: string;
  actionPoints: string;
  recommendations: string;
};

const SPENTRIFY_BLUE = "#3B82F6";

type TabKey = "summary" | "actionPoints" | "recommendations";

function formatPeso(amount: number) {
  return `₱${Math.round(amount).toLocaleString()}`;
}

/* ================= SCREEN ================= */

export default function InsightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { allTransactions, transactions: budgets } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [backendInsight, setBackendInsight] = useState<any | null>(null);
  const [detailContent, setDetailContent] = useState<{
    summary?: string;
    actionPoints?: string[];
    recommendations?: string[];
  } | null>(null);

  const contextStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const last30Days = allTransactions.filter((tx: any) => {
      const d = parseLocalDate(tx.transaction_date || tx.created_at);
      return d >= thirtyDaysAgo;
    });
    const currentMonth = allTransactions.filter((tx: any) => {
      const d = parseLocalDate(tx.transaction_date || tx.created_at);
      return d >= firstDayOfMonth;
    });

    const totalLast30 = last30Days.reduce(
      (sum: number, tx: any) => sum + (tx.amount || 0),
      0
    );
    const totalCurrentMonth = currentMonth.reduce(
      (sum: number, tx: any) => sum + (tx.amount || 0),
      0
    );

    const largestTx = currentMonth.reduce((max: any, tx: any) => {
      if (!max || (tx.amount || 0) > (max.amount || 0)) return tx;
      return max;
    }, null);

    const categoryTotals = new Map<string, number>();
    currentMonth.forEach((tx: any) => {
      const name = tx.category || "Others";
      categoryTotals.set(name, (categoryTotals.get(name) || 0) + (tx.amount || 0));
    });
    let topCategory: { name: string; total: number } | null = null;
    for (const [name, total] of categoryTotals.entries()) {
      if (!topCategory || total > topCategory.total) {
        topCategory = { name, total };
      }
    }

    return {
      last30Days,
      currentMonth,
      totalLast30,
      totalCurrentMonth,
      largestTx,
      topCategory,
    };
  }, [allTransactions]);

  useEffect(() => {
    if (!id || typeof id !== "string" || !id.startsWith("backend-")) {
      setBackendInsight(null);
      return;
    }
    if (!user?.id) return;

    const insightId = Number(id.replace("backend-", ""));
    if (Number.isNaN(insightId)) return;

    const fetchInsight = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/insights?user_id=${user.id}&limit=50`
        );
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const match = data.data.find((insight: any) => insight.id === insightId);
          setBackendInsight(match || null);
        }
      } catch (error) {
        console.warn("Failed to load insight detail:", error);
      }
    };

    fetchInsight();
  }, [id, user?.id]);

  const insight = useMemo<InsightPayload | null>(() => {
    if (!id || typeof id !== "string") return null;

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const recentTx = allTransactions.filter((t: any) => {
      const d = parseLocalDate(t.transaction_date || t.created_at);
      return d >= sevenDaysAgo;
    });
    const prevTx = allTransactions.filter((t: any) => {
      const d = parseLocalDate(t.transaction_date || t.created_at);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const totalSpent = recentTx.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const prevTotal = prevTx.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
    const diffPercent = prevTotal > 0 ? Math.round(((totalSpent - prevTotal) / prevTotal) * 100) : 0;
    const largestRecent = recentTx.reduce((max: any, tx: any) => {
      if (!max || (tx.amount || 0) > (max.amount || 0)) return tx;
      return max;
    }, null);
    const recentCategoryTotals = new Map<string, number>();
    recentTx.forEach((tx: any) => {
      const name = tx.category || "Others";
      recentCategoryTotals.set(name, (recentCategoryTotals.get(name) || 0) + (tx.amount || 0));
    });
    let topRecentCategory: { name: string; total: number } | null = null;
    for (const [name, total] of recentCategoryTotals.entries()) {
      if (!topRecentCategory || total > topRecentCategory.total) {
        topRecentCategory = { name, total };
      }
    }

    switch (id) {
      case "weekly-trend":
        return {
          id,
          sentiment: "neutral",
          summary: `You made ${recentTx.length} transactions in the last 7 days with a total spend of ₱${totalSpent.toLocaleString()}.`,
          actionPoints:
            [
              `• Largest purchase: ${largestRecent ? formatPeso(largestRecent.amount || 0) : "N/A"}`,
              `• Top category: ${topRecentCategory ? `${topRecentCategory.name} (${formatPeso(topRecentCategory.total)})` : "N/A"}`,
              `• Transactions this week: ${recentTx.length}`,
            ].join("\n"),
          recommendations:
            diffPercent > 0
              ? `You spent ${diffPercent}% more than the previous week. Consider tightening daily limits.`
              : `You spent ${Math.abs(diffPercent)}% less than the previous week. Keep this pace.`,
        };

      case "under-budget":
        {
          const overallBudget = budgets.find(
            (b) => !b.category || b.name === "Overall Budget"
          );
          const weeklyBudget = overallBudget?.amount ? overallBudget.amount / 4 : 0;
          const remaining = Math.max(0, weeklyBudget - totalSpent);
          return {
            id,
            sentiment: "positive",
            summary: weeklyBudget
              ? `Great job! You spent ₱${totalSpent.toLocaleString()} this week, which is ₱${Math.round(
                  remaining
                ).toLocaleString()} under your weekly budget.`
              : `Great job! You spent only ₱${totalSpent.toLocaleString()} this week.`,
            actionPoints:
              [
                `• Weekly budget: ${weeklyBudget ? formatPeso(weeklyBudget) : "N/A"}`,
                `• Remaining budget: ${weeklyBudget ? formatPeso(remaining) : "N/A"}`,
                `• Transactions this week: ${recentTx.length}`,
              ].join("\n"),
            recommendations:
              "Transfer extra funds into savings or upcoming bills.",
          };
        }

      case "subscription-alert":
        {
          const subscriptionKeywords = [
            "netflix",
            "spotify",
            "youtube",
            "premium",
            "subscription",
            "monthly",
          ];
          const matches = allTransactions.filter((tx: any) => {
            const merchant = (tx.merchant_name || "").toLowerCase();
            return subscriptionKeywords.some((k) => merchant.includes(k));
          });
          return {
            id,
            sentiment: "negative",
            summary: `Subscription-related expenses were detected (${matches.length} transaction${
              matches.length === 1 ? "" : "s"
            }).`,
            actionPoints:
              [
                `• Subscription transactions: ${matches.length}`,
                `• Most recent: ${matches[0]?.merchant_name || "N/A"}`,
                "• Review recurring charges",
              ].join("\n"),
            recommendations:
              "Set a monthly subscription cap and review charges regularly.",
          };
        }

      default:
        if (id.startsWith("backend-") && backendInsight) {
          const type = backendInsight.type || "AI";
          const isSummary = type === "AI Summary";
          const largest = contextStats.largestTx;
          const topCategory = contextStats.topCategory;
          const actionItems = [];

          if (largest) {
            actionItems.push(
              `• Largest recent purchase: ${formatPeso(largest.amount || 0)} (${largest.merchant_name || "Unknown"})`
            );
          }
          if (topCategory) {
            actionItems.push(
              `• Top category this month: ${topCategory.name} (${formatPeso(topCategory.total)})`
            );
          }
          if (contextStats.last30Days.length > 0) {
            actionItems.push(
              `• Transactions analyzed: ${contextStats.last30Days.length} in the last 30 days`
            );
          }

          return {
            id,
            sentiment: type === "Overspending" ? "negative" : "neutral",
            summary: isSummary
              ? `Gemini summary based on your recent transactions:\n${backendInsight.message}`
              : backendInsight.message,
            actionPoints: actionItems.join("\n") || "• Add more transactions for detailed analysis",
            recommendations: isSummary
              ? "Use this summary as a quick overview, then open specific insights for details."
              : "This insight is generated from your recent transactions.",
          };
        }
        return null;
    }
  }, [id, allTransactions, budgets, backendInsight, contextStats]);

  useEffect(() => {
    if (!user?.id || !id || !insight) {
      setDetailContent(null);
      return;
    }

    const fetchDetail = async () => {
      try {
        const payload: any = {
          user_id: Number(user.id),
          insight_type: id,
          insight_message: insight.summary,
          context: {
            transactions_last_30_days: contextStats.last30Days.length,
            total_current_month_php: contextStats.totalCurrentMonth,
            top_category: contextStats.topCategory,
          },
        };

        if (id.startsWith("backend-") && backendInsight?.id) {
          payload.insight_id = backendInsight.id;
        }

        const response = await fetch(`${API_BASE_URL}/api/insights/detail`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.success && data.data) {
          setDetailContent(data.data);
        } else {
          setDetailContent(null);
        }
      } catch (error) {
        console.warn("Failed to load Gemini detail:", error);
        setDetailContent(null);
      }
    };

    fetchDetail();
  }, [user?.id, id, insight, backendInsight, contextStats]);

  const tabContent = useMemo(() => {
    if (!insight) return "";
    if (activeTab === "summary") {
      return detailContent?.summary || insight.summary;
    }
    if (activeTab === "actionPoints") {
      const points = detailContent?.actionPoints?.length
        ? detailContent.actionPoints
        : insight.actionPoints.split("\n");
      return points.join("\n");
    }
    const recs = detailContent?.recommendations?.length
      ? detailContent.recommendations
      : insight.recommendations.split("\n");
    return recs.join("\n");
  }, [activeTab, insight, detailContent]);

  const handleShare = async () => {
    if (!tabContent) return;
    try {
      await Share.share({ message: tabContent });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Insight</Text>

          <TouchableOpacity onPress={() => router.push("/(tabs)/more")}>
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* EMPTY STATE */}
        {!insight && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No insight data available yet.
            </Text>
          </View>
        )}

        {/* CONTENT */}
        {insight && (
          <>
            <View style={styles.contextCard}>
              <Text style={styles.contextTitle}>Insight Context</Text>
              <Text style={styles.contextText}>
                Based on {contextStats.last30Days.length} transaction
                {contextStats.last30Days.length === 1 ? "" : "s"} in the last 30 days.
              </Text>
              <Text style={styles.contextText}>
                This month total: {formatPeso(contextStats.totalCurrentMonth)}.
              </Text>
              {contextStats.topCategory && (
                <Text style={styles.contextText}>
                  Top category: {contextStats.topCategory.name} (
                  {formatPeso(contextStats.topCategory.total)}).
                </Text>
              )}
            </View>

            <View style={styles.tabs}>
              <Tab
                label="Summary"
                active={activeTab === "summary"}
                onPress={() => setActiveTab("summary")}
              />
              <Tab
                label="Action Points"
                active={activeTab === "actionPoints"}
                onPress={() => setActiveTab("actionPoints")}
              />
              <Tab
                label="Recommendations"
                active={activeTab === "recommendations"}
                onPress={() => setActiveTab("recommendations")}
              />
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{tabContent}</Text>
            </View>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareText}>Share Result</Text>
              <Ionicons name="share-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ================= TAB ================= */

function Tab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F7FB" },
  container: { flex: 1, paddingHorizontal: 18 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
  },

  contextCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E6EAF2",
  },
  contextTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  contextText: {
    fontSize: 12.5,
    color: "#6B7280",
    marginBottom: 4,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 14,
    padding: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: SPENTRIFY_BLUE },
  tabText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  tabTextActive: { color: "#fff" },

  contentCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    minHeight: 200,
  },
  contentText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: "#374151",
  },

  shareBtn: {
    marginTop: 14,
    backgroundColor: SPENTRIFY_BLUE,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  shareText: { color: "#fff", fontWeight: "700" },
});
