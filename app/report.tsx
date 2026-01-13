import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import ReportPreviewModal, { ReportData } from "../components/ReportPreviewModal";
import { useData } from "../context/DataContext";

/* ================= THEME ================= */

const THEME = {
  primary: "#3B82F6",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  border: "#E5E7EB",
};

/* ================= HELPERS ================= */

const peso = (n: number) => `₱${n.toLocaleString()}`;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ================= DONUT ================= */

function ProgressDonut({
  spent,
  budget,
}: {
  spent: number;
  budget: number;
}) {
  const progress = clamp01(spent / budget);

  const size = 220;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#E5EDFF"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={THEME.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation={-90}
          originX={cx}
          originY={cy}
        />
      </Svg>

      <View style={styles.centerText}>
        <Text style={styles.bigAmount}>{peso(spent)}</Text>
        <Text style={styles.subText}>of {peso(budget)}</Text>
        <Text style={styles.mutedText}>
          {Math.round(progress * 100)}% used
        </Text>
      </View>
    </View>
  );
}

/* ================= SCREEN ================= */

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useData();

  const transaction = useMemo(
    () => transactions.find((t) => t.id === id),
    [transactions, id]
  );

  const [reports, setReports] = useState<number[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);

  if (!transaction) {
    return (
      <View style={styles.safe}>
        <Text style={{ textAlign: "center", marginTop: 40 }}>
          Transaction not found.
        </Text>
      </View>
    );
  }

  const spent = transaction.spent || 0;
  const remaining = Math.max(0, transaction.amount - spent);
  const percentageUsed = transaction.amount > 0 ? (spent / transaction.amount) * 100 : 0;

  const handleGenerateReport = () => {
    // Create report data
    const reportData: ReportData = {
      title: `Financial Report: ${transaction.name}`,
      budgetName: transaction.name,
      budget: transaction.amount,
      spent: spent,
      remaining: remaining,
      percentageUsed: percentageUsed,
      createdAt: transaction.createdAt,
      description: `This report shows the financial summary for ${transaction.name}. You have spent ${percentageUsed.toFixed(1)}% of your budget, with ₱${remaining.toLocaleString()} remaining.`,
    };

    setCurrentReport(reportData);
    setPreviewVisible(true);
    // Also add to reports list for history
    setReports((prev) => [...prev, Date.now()]);
  };

  return (
    <View style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={THEME.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Generate Report</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* MAIN CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>{transaction.name}</Text>
          <Text style={styles.date}>
            Added on {new Date(transaction.createdAt).toLocaleDateString()}
          </Text>

          <ProgressDonut
            spent={spent}
            budget={transaction.amount}
          />

          {/* SUMMARY */}
          <View style={styles.summary}>
            <Row label="Budget" value={peso(transaction.amount)} />
            <Row label="Spent" value={peso(spent)} />
            <Row label="Remaining" value={peso(remaining)} />
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* GENERATE BUTTON */}
          <Pressable
            style={styles.generateBtn}
            onPress={handleGenerateReport}
          >
            <Text style={styles.generateText}>Generate report</Text>
          </Pressable>

          {/* GENERATED REPORTS */}
          {reports.map((id, index) => (
            <Pressable
              key={id}
              style={styles.reportBox}
              onPress={() => {
                // later: open detailed AI-generated report
              }}
            >
              <Text style={styles.reportTitle}>
                Generated Report #{index + 1}
              </Text>
              <Text style={styles.reportText}>
                AI-generated financial summary and insights will appear here.
              </Text>
            </Pressable>
          ))}

          <Text style={styles.hint}>
            Reports are generated per transaction / goal
          </Text>
        </View>
      </ScrollView>

      {/* REPORT PREVIEW MODAL */}
      <ReportPreviewModal
        visible={previewVisible}
        reportData={currentReport}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}

/* ================= ROW ================= */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.bg,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.text,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    padding: 18,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: THEME.text,
  },

  date: {
    fontSize: 12,
    color: THEME.sub,
    textAlign: "center",
    marginBottom: 12,
  },

  centerText: {
    position: "absolute",
    alignItems: "center",
  },

  bigAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: THEME.text,
  },

  subText: {
    fontSize: 12,
    color: THEME.sub,
    marginTop: 4,
  },

  mutedText: {
    fontSize: 11,
    color: THEME.sub,
    marginTop: 2,
  },

  summary: {
    marginTop: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  rowLabel: {
    fontSize: 13,
    color: THEME.sub,
  },

  rowValue: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.text,
  },

  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 16,
  },

  generateBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
  },

  generateText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  reportBox: {
    backgroundColor: "#F3F6FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  reportTitle: {
    fontWeight: "700",
    color: THEME.text,
    marginBottom: 4,
  },

  reportText: {
    fontSize: 13,
    color: THEME.sub,
    lineHeight: 18,
  },

  hint: {
    textAlign: "center",
    fontSize: 11,
    color: THEME.sub,
    marginTop: 10,
  },
});