// app/(tabs)/goals/goals-index.tsx
import React, { useEffect, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGoalsStore, type Goal } from '../../goals-store';
import { useAuth } from '../../../context/AuthContext';
import { THEME } from '../../../constants/theme';
import { fonts } from '../../../constants/fonts';

const formatCurrency = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) || 0 : val;
  return '₱ ' + num.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

export default function GoalsIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const { goals, loading, fetchGoals } = useGoalsStore();

  useEffect(() => {
    if (user?.id) {
      fetchGoals(user.id);
    }
  }, [user?.id, fetchGoals]);

  const onRefresh = () => {
    if (user?.id) {
      fetchGoals(user.id);
    }
  };

  // Compute total progress across all active goals
  const summary = useMemo(() => {
    let totalTarget = 0;
    let totalSaved = 0;
    let achievedCount = 0;

    goals.forEach((g) => {
      const target = parseFloat(g.amount.replace(/,/g, '')) || 0;
      const current = parseFloat(g.currentSavings?.replace(/,/g, '') || '0') || 0;
      totalTarget += target;
      totalSaved += current;
      if (target > 0 && current >= target) {
        achievedCount += 1;
      }
    });

    const percent = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    return { totalTarget, totalSaved, percent, totalGoals: goals.length, achievedCount };
  }, [goals]);

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const target = parseFloat(item.amount.replace(/,/g, '')) || 0;
    const current = parseFloat(item.currentSavings?.replace(/,/g, '') || '0') || 0;
    const percent = target > 0 ? (current / target) * 100 : 0;
    const progressWidth = Math.min(Math.max(percent, 0), 100);
    const isAchieved = percent >= 100;
    const remaining = Math.max(0, target - current);

    const statusBadge = isAchieved
      ? { label: 'Achieved', color: THEME.success, bg: THEME.successLight, icon: 'checkmark-circle' as const }
      : percent >= 50
      ? { label: 'On Track', color: THEME.primary, bg: THEME.primaryLight, icon: 'trending-up' as const }
      : { label: 'In Progress', color: THEME.warning, bg: THEME.warningLight, icon: 'time-outline' as const };

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/goals/edit-goal',
            params: { id: item.id },
          })
        }
      >
        {/* Top Row: Icon + Name + Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.goalIconContainer, { backgroundColor: statusBadge.bg }]}>
              <Ionicons
                name={isAchieved ? 'trophy' : 'flag'}
                size={20}
                color={statusBadge.color}
              />
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.date ? (
                <Text style={styles.goalDate}>
                  Target: {item.date}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
            <Ionicons name={statusBadge.icon} size={12} color={statusBadge.color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        {/* Progress Bar with Dual-Tone Fill */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressWidth}%`,
                  backgroundColor: statusBadge.color,
                },
              ]}
            />
          </View>
          <Text style={[styles.percentLabel, { color: statusBadge.color }]}>
            {Math.round(percent)}%
          </Text>
        </View>

        {/* Bottom Amounts */}
        <View style={styles.amountsRow}>
          <View>
            <Text style={styles.amountSavedLabel}>Current Saved</Text>
            <Text style={styles.amountSavedValue}>{formatCurrency(current)}</Text>
          </View>
          <View style={styles.amountRightCol}>
            <Text style={styles.amountTargetLabel}>Target</Text>
            <Text style={styles.amountTargetValue}>{formatCurrency(target)}</Text>
          </View>
        </View>

        {/* Footer info pill */}
        {!isAchieved && remaining > 0 && (
          <View style={styles.cardFooter}>
            <Ionicons name="sparkles-outline" size={12} color={THEME.sub} style={{ marginRight: 4 }} />
            <Text style={styles.footerText}>
              {formatCurrency(remaining)} remaining to achieve this goal
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>Track targets & build wealth</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/goals/add-goal')}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Goal</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
        ListHeaderComponent={
          goals.length > 0 ? (
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>TOTAL GOALS PROGRESS</Text>
                  <Text style={styles.heroAmount}>{formatCurrency(summary.totalSaved)}</Text>
                </View>
                <View style={styles.heroPercentChip}>
                  <Text style={styles.heroPercentText}>{summary.percent}%</Text>
                </View>
              </View>

              {/* Master Progress Bar */}
              <View style={styles.heroProgressTrack}>
                <View
                  style={[
                    styles.heroProgressFill,
                    { width: `${summary.percent}%` },
                  ]}
                />
              </View>

              {/* Stat Chips */}
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{formatCurrency(summary.totalTarget)}</Text>
                  <Text style={styles.heroStatLabel}>Total Target</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{summary.totalGoals}</Text>
                  <Text style={styles.heroStatLabel}>Active Goals</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={[styles.heroStatValue, { color: THEME.success }]}>
                    {summary.achievedCount}
                  </Text>
                  <Text style={styles.heroStatLabel}>Achieved</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="trophy-outline" size={44} color={THEME.primary} />
              </View>
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptyDescription}>
                Set clear targets for your emergency fund, dream vacation, or next big milestone.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/goals/add-goal')}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionText}>Create Your First Goal</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={renderGoalCard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: THEME.canvas,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.radius.pill,
    ...THEME.shadows.sm,
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110, // Clearance for floating tab bar
  },

  /* Master Progress Hero Card */
  heroCard: {
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroLabel: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: THEME.muted,
    letterSpacing: 0.6,
  },
  heroAmount: {
    fontSize: 26,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginTop: 4,
  },
  heroPercentChip: {
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
  },
  heroPercentText: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.primary,
  },
  heroProgressTrack: {
    height: 10,
    backgroundColor: '#EEF2F6',
    borderRadius: THEME.radius.pill,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: THEME.radius.pill,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.borderLight,
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  heroStatLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: THEME.borderLight,
  },

  /* Goal Card */
  card: {
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  goalDate: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.heading,
  },

  /* Progress Track */
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEF2F6',
    borderRadius: THEME.radius.pill,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: THEME.radius.pill,
  },
  percentLabel: {
    fontSize: 12,
    fontFamily: fonts.heading,
    minWidth: 32,
    textAlign: 'right',
  },

  /* Amounts */
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  amountSavedLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: THEME.sub,
  },
  amountSavedValue: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginTop: 2,
  },
  amountRightCol: {
    alignItems: 'flex-end',
  },
  amountTargetLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: THEME.sub,
  },
  amountTargetValue: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: THEME.sub,
    marginTop: 2,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.borderLight,
  },
  footerText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: THEME.sub,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: fonts.heading,
    color: THEME.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: THEME.sub,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: THEME.radius.pill,
    ...THEME.shadows.sm,
  },
  emptyActionText: {
    fontSize: 14,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
  },
});
