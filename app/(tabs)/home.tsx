import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useData } from "../../context/DataContext";

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

/* ================= MONTHLY SUMMARY ================= */

function MonthlySummaryCard({ total }: { total: number }) {
  const size = 180;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const segments = [
    { color: "#3B82F6", value: 0.35 },
    { color: "#22C55E", value: 0.3 },
    { color: "#A855F7", value: 0.2 },
    { color: "#F59E0B", value: 0.15 },
  ];

  let startAngle = -90;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>TOTAL THIS MONTH</Text>
      <Text style={styles.summaryValue}>{peso(total)}</Text>

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
  const { transactions } = useData();

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
   * Monthly total — backend-ready
   * Can later be replaced by API-sent aggregate
   */
  const monthlyTotal = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (typeof t.spent === "number") return sum + t.spent;

      const expenses = t.expenses ?? [];
      return (
        sum +
        expenses.reduce(
          (s: number, e: { amount: number }) => s + e.amount,
          0
        )
      );
    }, 0);
  }, [transactions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Spending</Text>

        <Pressable
          onPress={() => router.push("/notifications")}
          style={styles.headerIcon}
        >
          <Ionicons name="notifications-outline" size={22} color={THEME.text} />
        </Pressable>
      </View>

      {chartData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No transactions yet. Tap + to add one.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chartData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <MonthlySummaryCard total={monthlyTotal} />
              <View style={styles.divider} />
            </>
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
});
