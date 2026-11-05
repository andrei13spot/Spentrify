// components/dashboard/SpendingDonutChart.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { THEME, getCategoryColor, getCategoryIcon } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

export interface CategoryBreakdownItem {
  category_name: string;
  total: number;
  percentage: number;
}

interface SpendingDonutChartProps {
  categoryBreakdown: CategoryBreakdownItem[];
  totalSpending: number;
}

export function SpendingDonutChart({
  categoryBreakdown,
  totalSpending,
}: SpendingDonutChartProps) {
  const size = 180;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const segments = useMemo(() => {
    if (!categoryBreakdown || categoryBreakdown.length === 0 || totalSpending <= 0) {
      return [];
    }

    return categoryBreakdown.slice(0, 5).map((cat) => ({
      name: cat.category_name,
      amount: cat.total,
      percentage: Math.round(cat.percentage),
      value: cat.total / totalSpending,
      color: getCategoryColor(cat.category_name),
      icon: getCategoryIcon(cat.category_name),
    }));
  }, [categoryBreakdown, totalSpending]);

  let startAngle = -90;

  return (
    <View style={styles.card}>
      {/* Title Header */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={styles.iconCircle}>
            <Ionicons name="pie-chart" size={16} color={THEME.primary} />
          </View>
          <Text style={styles.title}>Spending Distribution</Text>
        </View>
        <Text style={styles.subTitle}>Top Categories</Text>
      </View>

      {segments.length > 0 ? (
        <View style={styles.chartWrapper}>
          {/* Donut Container with Center Label */}
          <View style={styles.donutCenterWrapper}>
            <Svg width={size} height={size}>
              {/* Background Track Circle */}
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                stroke="#F1F5F9"
                strokeWidth={stroke}
                fill="none"
              />
              {/* Segment Circles */}
              {segments.map((seg, i) => {
                const strokeLength = circumference * seg.value;
                const dashArray = `${strokeLength} ${circumference}`;
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

            {/* Absolute Center Content */}
            <View style={styles.centerBadge}>
              <Text style={styles.centerTopText}>Top 5</Text>
              <Text style={styles.centerMainText}>
                {Math.round(segments.reduce((acc, s) => acc + s.percentage, 0))}%
              </Text>
              <Text style={styles.centerBottomText}>of spending</Text>
            </View>
          </View>

          {/* Interactive Legend Items */}
          <View style={styles.legendContainer}>
            {segments.map((seg, i) => (
              <View key={i} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View style={[styles.categoryDot, { backgroundColor: seg.color }]} />
                  <Ionicons name={seg.icon as any} size={14} color="#475569" style={styles.legendIcon} />
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {seg.name}
                  </Text>
                </View>

                <View style={styles.legendRight}>
                  <View style={[styles.percentBadge, { backgroundColor: `${seg.color}15` }]}>
                    <Text style={[styles.percentText, { color: seg.color }]}>
                      {seg.percentage}%
                    </Text>
                  </View>
                  <Text style={styles.amountText}>
                    ₱{seg.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        /* Empty State */
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="bar-chart-outline" size={28} color={THEME.muted} />
          </View>
          <Text style={styles.emptyTitle}>No Expenses This Period</Text>
          <Text style={styles.emptySubText}>
            Add transactions to view your spending breakdown.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.xl,
    padding: 20,
    marginHorizontal: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  donutCenterWrapper: {
    position: 'relative',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  centerBadge: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerTopText: {
    fontSize: 10,
    color: THEME.sub,
    fontFamily: fonts.body,
    textTransform: 'uppercase',
  },
  centerMainText: {
    fontSize: 22,
    color: THEME.text,
    fontFamily: fonts.heading,
    letterSpacing: -0.5,
  },
  centerBottomText: {
    fontSize: 10,
    color: THEME.muted,
    fontFamily: fonts.body,
  },
  legendContainer: {
    width: '100%',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendIcon: {
    marginRight: 2,
  },
  categoryName: {
    fontSize: 13,
    color: THEME.text,
    fontFamily: fonts.body,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
  },
  percentText: {
    fontSize: 11,
    fontFamily: fonts.heading,
  },
  amountText: {
    fontSize: 13,
    color: THEME.text,
    fontFamily: fonts.heading,
    minWidth: 64,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    textAlign: 'center',
  },
});

