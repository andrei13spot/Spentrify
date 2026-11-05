// app/(tabs)/insights.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Polyline } from "react-native-svg";

import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";
import { API_BASE_URL } from "../../utils/api";
import { parseLocalDate } from "../../utils/date";
import { THEME, getCategoryColor } from "../../constants/theme";
import { fonts } from "../../constants/fonts";

type FilterTab = "All" | "Alerts" | "Trends" | "Habits";

interface BackendInsight {
  id: string | number;
  insight_id?: number;
  title?: string;
  message: string;
  insight_type?: string;
  created_at?: string;
}

export default function InsightsScreen() {
  const { allTransactions } = useData();
  const { user } = useAuth();

  const [backendInsights, setBackendInsights] = useState<BackendInsight[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const fetchInsights = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Trigger hybrid AI generation (rules + Gemini)
      fetch(`${API_BASE_URL}/api/insights/generate?user_id=${user.id}&mode=hybrid`, {
        method: "POST",
      }).catch(() => {});

      // Fetch AI Insights list
      const insightsRes = await fetch(`${API_BASE_URL}/api/insights?user_id=${user.id}&limit=10`);
      const insightsData = await insightsRes.json();
      if (insightsData.success && Array.isArray(insightsData.data)) {
        setBackendInsights(insightsData.data);
      }

      // Fetch Weekly Trend
      const trendRes = await fetch(`${API_BASE_URL}/api/analytics/weekly-trend?user_id=${user.id}`);
      const trendData = await trendRes.json();
      if (trendData.success) {
        setWeeklyTrend(trendData.data || null);
      }
    } catch (err) {
      console.warn("Failed to fetch insights:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [user?.id, allTransactions.length]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  // Sparkline points for Weekly Trend
  const sparklineData = useMemo(() => {
    if (!weeklyTrend?.currentWeek || weeklyTrend.currentWeek.length === 0) {
      return null;
    }
    const days: any[] = weeklyTrend.currentWeek;
    const maxVal = Math.max(...days.map((d) => d.amount || 0), 1);
    const width = 240;
    const height = 54;

    const points = days
      .map((d, i) => {
        const x = (i / Math.max(1, days.length - 1)) * width;
        const y = height - ((d.amount || 0) / maxVal) * (height - 10) - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    return { points, days, maxVal, width, height };
  }, [weeklyTrend]);

  // Filter insights by tab
  const filteredInsights = useMemo(() => {
    if (activeTab === "All") return backendInsights;
    if (activeTab === "Alerts") {
      return backendInsights.filter(
        (i) => (i.insight_type || "").includes("Alert") || (i.insight_type || "").includes("Overspending")
      );
    }
    if (activeTab === "Trends") {
      return backendInsights.filter(
        (i) => (i.insight_type || "").includes("Trend") || (i.insight_type || "").includes("Week")
      );
    }
    return backendInsights.filter(
      (i) => !(i.insight_type || "").includes("Alert") && !(i.insight_type || "").includes("Trend")
    );
  }, [backendInsights, activeTab]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Screen Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>Financial Insights</Text>
          <Text style={styles.headerSub}>Auto-Audit & Spending Habits</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.refreshBtn}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={18} color={THEME.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
      >
        {/* Weekly Trend Hero Card */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={14} color="#93C5FD" />
              <Text style={styles.trendBadgeText}>7-Day Velocity</Text>
            </View>
            {weeklyTrend?.percentageChange !== undefined && (
              <View
                style={[
                  styles.changePill,
                  {
                    backgroundColor:
                      weeklyTrend.percentageChange > 0
                        ? "rgba(239, 68, 68, 0.2)"
                        : "rgba(16, 185, 129, 0.2)",
                  },
                ]}
              >
                <Ionicons
                  name={weeklyTrend.percentageChange > 0 ? "arrow-up" : "arrow-down"}
                  size={12}
                  color={weeklyTrend.percentageChange > 0 ? "#FCA5A5" : "#6EE7B7"}
                />
                <Text
                  style={[
                    styles.changeText,
                    {
                      color:
                        weeklyTrend.percentageChange > 0 ? "#FCA5A5" : "#6EE7B7",
                    },
                  ]}
                >
                  {Math.abs(Math.round(weeklyTrend.percentageChange))}% vs last week
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.trendTotalLabel}>This Week's Spending</Text>
          <Text style={styles.trendTotalValue}>
            ₱{(weeklyTrend?.currentWeekTotal || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>

          {/* Sparkline Curve */}
          {sparklineData && (
            <View style={styles.sparklineWrap}>
              <Svg width={sparklineData.width} height={sparklineData.height}>
                <Polyline
                  points={sparklineData.points}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(["All", "Alerts", "Trends", "Habits"] as FilterTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.7}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loading Indicator */}
        {loading && !refreshing && (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator size="small" color={THEME.primary} />
          </View>
        )}

        {/* Insights Feed */}
        {filteredInsights.length > 0 ? (
          <View style={styles.insightsList}>
            {filteredInsights.map((item, idx) => {
              const isAlert =
                (item.insight_type || "").includes("Alert") ||
                (item.insight_type || "").includes("Overspending");
              const isTrend =
                (item.insight_type || "").includes("Trend") ||
                (item.insight_type || "").includes("Week");

              const iconName = isAlert
                ? "alert-circle"
                : isTrend
                ? "analytics"
                : "bulb";

              const iconColor = isAlert
                ? THEME.warning
                : isTrend
                ? THEME.accent
                : THEME.primary;

              const bgTint = isAlert
                ? THEME.warningLight
                : isTrend
                ? "#ECFEFF"
                : THEME.primaryLight;

              return (
                <TouchableOpacity
                  key={item.id?.toString() || idx.toString()}
                  activeOpacity={0.8}
                  style={styles.insightCard}
                  onPress={() => {
                    const idParam = item.insight_id || item.id || idx;
                    router.push({
                      pathname: "/insight/[id]",
                      params: { id: String(idParam) },
                    });
                  }}
                >
                  <View style={[styles.cardIconWrap, { backgroundColor: bgTint }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                  </View>

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>
                        {item.title || item.insight_type || "Auto-Audit Alert"}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                    </View>
                    <Text style={styles.cardMessage}>{item.message}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          !loading && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="sparkles-outline" size={30} color={THEME.muted} />
              </View>
              <Text style={styles.emptyTitle}>All Clear</Text>
              <Text style={styles.emptySubText}>
                No spending alerts for this filter. Log more transactions to reveal deeper spending patterns.
              </Text>
            </View>
          )
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  trendCard: {
    backgroundColor: "#0F172A",
    borderRadius: THEME.radius.xl,
    padding: 22,
    marginHorizontal: 18,
    marginTop: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    ...THEME.shadows.float,
  },
  trendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(30, 58, 138, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
  },
  trendBadgeText: {
    color: "#93C5FD",
    fontSize: 12,
    fontFamily: fonts.body,
  },
  changePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
  },
  changeText: {
    fontSize: 11,
    fontFamily: fonts.heading,
  },
  trendTotalLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: fonts.body,
    marginBottom: 4,
  },
  trendTotalValue: {
    fontSize: 28,
    color: "#FFFFFF",
    fontFamily: fonts.heading,
    letterSpacing: -0.5,
  },
  sparklineWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: THEME.radius.pill,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.borderLight,
  },
  filterChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontFamily: fonts.heading,
  },
  insightsList: {
    paddingHorizontal: 18,
    gap: 12,
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    gap: 14,
    ...THEME.shadows.sm,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  cardMessage: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.sub,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.sub,
    textAlign: "center",
    lineHeight: 18,
  },
});
