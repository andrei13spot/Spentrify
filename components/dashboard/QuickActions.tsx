// components/dashboard/QuickActions.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

interface QuickActionsProps {
  onPressAdd: () => void;
  onPressGoals: () => void;
  onPressExports: () => void;
  onPressNotifications: () => void;
  unreadCount?: number;
}

export function QuickActions({
  onPressAdd,
  onPressGoals,
  onPressExports,
  onPressNotifications,
  unreadCount = 0,
}: QuickActionsProps) {
  const actions = [
    {
      id: 'add',
      label: 'Add Expense',
      icon: 'add-circle',
      color: THEME.primary,
      bgColor: THEME.primaryLight,
      onPress: onPressAdd,
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: 'flag',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      onPress: onPressGoals,
    },
    {
      id: 'exports',
      label: 'Export ITR',
      icon: 'document-text',
      color: '#10B981',
      bgColor: '#ECFDF5',
      onPress: onPressExports,
    },
    {
      id: 'notifications',
      label: 'Activity',
      icon: 'notifications',
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      badge: unreadCount > 0 ? unreadCount : undefined,
      onPress: onPressNotifications,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            activeOpacity={0.7}
            style={styles.actionBtn}
            onPress={act.onPress}
          >
            <View style={[styles.iconCircle, { backgroundColor: act.bgColor }]}>
              <Ionicons name={act.icon as any} size={22} color={act.color} />
              {Boolean(act.badge) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{act.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {act.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 18,
    marginBottom: 20,
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    width: '23%',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: THEME.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.heading,
  },
  label: {
    fontSize: 11,
    color: THEME.text,
    fontFamily: fonts.body,
    textAlign: 'center',
  },
});

