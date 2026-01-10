import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useData } from "../../context/DataContext";

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

/* ================= SCREEN ================= */

export default function InsightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useData();
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  const insight = useMemo<InsightPayload | null>(() => {
    if (!id || typeof id !== "string") return null;

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentTx = transactions.filter(
      (t) => new Date(t.createdAt) >= sevenDaysAgo
    );

    const totalSpent = recentTx.reduce((sum, t) => sum + t.amount, 0);

    switch (id) {
      case "weekly-trend":
        return {
          id,
          sentiment: "neutral",
          summary: `You made ${recentTx.length} transactions in the last 7 days with a total spend of ₱${totalSpent.toLocaleString()}.`,
          actionPoints:
            "• Review daily expenses\n• Identify high-spend days\n• Reduce impulse spending",
          recommendations:
            "Set daily spending limits and monitor expenses in real time.",
        };

      case "under-budget":
        return {
          id,
          sentiment: "positive",
          summary: `Great job! You spent only ₱${totalSpent.toLocaleString()} this week, staying under your usual spending range.`,
          actionPoints:
            "• Maintain your current budget\n• Save the excess\n• Plan ahead for next week",
          recommendations:
            "Transfer extra funds into savings or upcoming bills.",
        };

      case "subscription-alert":
        return {
          id,
          sentiment: "negative",
          summary:
            "Subscription-related expenses were detected in your transactions.",
          actionPoints:
            "• Review subscriptions\n• Cancel unused services\n• Downgrade plans",
          recommendations:
            "Set a monthly subscription cap and review charges regularly.",
        };

      default:
        return null;
    }
  }, [id, transactions]);

  const tabContent = useMemo(() => {
    if (!insight) return "";
    if (activeTab === "summary") return insight.summary;
    if (activeTab === "actionPoints") return insight.actionPoints;
    return insight.recommendations;
  }, [activeTab, insight]);

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
            <View style={styles.emojiCard}>
              <Text style={styles.emoji}>🧠</Text>
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

  emojiCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 6,
  },
  emoji: { fontSize: 40 },

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
