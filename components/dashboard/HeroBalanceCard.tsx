// components/dashboard/HeroBalanceCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

interface HeroBalanceCardProps {
  totalSpending: number;
  transactionCount: number;
  dailyAverage: number;
  monthName: string;
}

export function HeroBalanceCard({
  totalSpending,
  transactionCount,
  dailyAverage,
  monthName,
}: HeroBalanceCardProps) {
  const formattedTotal = `₱ ${totalSpending.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedDaily = `₱ ${dailyAverage.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  return (
    <View style={styles.card}>
      {/* Decorative Brand Glow */}
      <View style={styles.glow} />

      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="calendar-outline" size={13} color="#93C5FD" />
          <Text style={styles.badgeText}>{monthName}</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Spending Tracker</Text>
        </View>
      </View>

      {/* Hero Metric */}
      <View style={styles.metricSection}>
        <Text style={styles.metricLabel}>Total Spent This Month</Text>
        <Text style={styles.metricValue}>{formattedTotal}</Text>
      </View>

      {/* Bottom Insights Row */}
      <View style={styles.bottomRow}>
        <View style={styles.subMetric}>
          <Text style={styles.subMetricLabel}>Daily Average</Text>
          <Text style={styles.subMetricValue}>{formattedDaily} / day</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.subMetric}>
          <Text style={styles.subMetricLabel}>Recorded Activity</Text>
          <Text style={styles.subMetricValue}>{transactionCount} expenses</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: THEME.radius.xl,
    padding: 22,
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1E293B',
    ...THEME.shadows.float,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 58, 138, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.pill,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  badgeText: {
    color: '#93C5FD',
    fontSize: 12,
    fontFamily: fonts.body,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.accent,
  },
  statusText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: fonts.body,
  },
  metricSection: {
    marginBottom: 20,
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: fonts.body,
    marginBottom: 6,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: fonts.heading,
    letterSpacing: -0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: THEME.radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  subMetric: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  subMetricLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: fonts.body,
    marginBottom: 2,
  },
  subMetricValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontFamily: fonts.heading,
  },
});

