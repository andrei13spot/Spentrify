import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, G } from "react-native-svg";
import { useData } from "../../context/DataContext";

const COLORS = {
  green: "#16A34A",
  blue: "#3B82F6",
  orange: "#F97316",
  bg: "#f2f2f7", 
  text: "#111827",
  subText: "#6B7280",
  borderColor: "#e5e7eb",
};

interface CircularProgressProps {
  percent: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}

const CircularProgress = ({ percent, color, size = 65, strokeWidth = 6 }: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <Text style={{ position: 'absolute', fontSize: 12, fontWeight: '700', color: '#333' }}>
        {percent}%
      </Text>
    </View>
  );
};

export default function GoalsScreen() {
  const { transactions } = useData();

  const goals = useMemo(() => {
    return transactions
      .filter((t) => t.category === "goal")
      .map((t) => {
        const expenses = t.expenses ?? [];
        const saved = typeof t.spent === "number" ? t.spent : expenses.reduce((sum, e) => sum + e.amount, 0);
        const percentage = t.amount > 0 ? Math.min(100, Math.round((saved / t.amount) * 100)) : 0;

        let statusColor = COLORS.blue;
        let statusText = "On Track";

        if (percentage >= 75) {
            statusColor = COLORS.green; 
            statusText = "Excellent";
        } else if (percentage < 30) {
            statusColor = COLORS.orange; 
            statusText = "Behind Schedule";
        }

        return {
          id: t.id,
          title: t.name,
          target: t.amount,
          saved,
          percentage,
          status: statusText,
          color: statusColor
        };
      });
  }, [transactions]);

  const renderGoalItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      <View style={styles.cardLeft}>
        <Text style={styles.goalTitle}>{item.title}</Text>
        <View style={styles.amountRow}>
            <Text style={styles.savedAmount}>PHP {item.saved.toLocaleString()}</Text>
            <Text style={styles.targetAmount}> / {item.target.toLocaleString()}</Text>
        </View>
        <Text style={[styles.goalStatus, { color: item.color }]}>
            {item.status}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <CircularProgress percent={item.percentage} color={item.color} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/add",
              params: { mode: "goal", redirectTo: "/(tabs)/goals" },
            })
          }
        >
          <Ionicons name="add-circle" size={32} color={COLORS.blue} />
        </TouchableOpacity>
      </View>

      {/* FIX 2: Apply grey background ONLY to the list part */}
      <View style={styles.bodyContainer}>
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          renderItem={renderGoalItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            goals.length === 0 && styles.listEmptyContainer,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={48} color={COLORS.blue} />
              <Text style={styles.emptyText}>No goals yet. Start saving today!</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff", 
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: COLORS.bg, 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between", 
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff", 
    borderBottomWidth: 1,    
    borderBottomColor: COLORS.borderColor, 
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    textAlign: "left", 
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  listEmptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
    marginRight: 10,
    alignItems: 'flex-start',
  },
  cardRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    textAlign: 'left',
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  savedAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  targetAmount: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  goalStatus: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
});