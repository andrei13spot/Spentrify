import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGoalsStore } from '../../goals-store';
import { useAuth } from '../../../context/AuthContext';

export default function GoalsIndex() {
  const router = useRouter();
  const { user } = useAuth(); 
  const { goals, fetchGoals } = useGoalsStore();

  useEffect(() => {
    if (user?.id) {
      fetchGoals(user.id);
    }
  }, [user?.id, fetchGoals]);

  const formatMoney = (value: string) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderGoalCard = ({ item }: { item: any }) => {
    // 1. Calculate Progress
    const target = parseFloat(item.amount.replace(/,/g, '')) || 0;
    const current = parseFloat(item.currentSavings?.replace(/,/g, '') || '0') || 0;
    
    let percent = 0;
    if (target > 0) {
      percent = (current / target) * 100;
    }
    
    const progressWidth = Math.min(Math.max(percent, 0), 100);

    let statusColor = '#4287f5'; 
    let statusLabel = 'In Progress';

    if (percent >= 100) {
      statusColor = '#2ecc71'; 
      statusLabel = 'Goal Achieved';
    } else if (percent < 20) {
      statusColor = '#FF9800'
      statusLabel = 'In Progress';
    }

    return (
      <TouchableOpacity 
        onPress={() => router.push({ 
          pathname: '/(tabs)/goals/edit-goal', 
          params: { id: item.id } 
        })}
        activeOpacity={0.8} 
      >
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.goalName}>{item.name}</Text>
            <Text style={[styles.percentText, { color: statusColor }]}>
              {Math.round(percent)}%
            </Text>
          </View>

          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>

          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progressWidth}%`, backgroundColor: statusColor }
              ]} 
            />
          </View>

          <Text style={styles.amountText}>
            <Text style={styles.boldAmount}>PHP {formatMoney(item.currentSavings || '0')}</Text>
            <Text style={styles.greyText}> of PHP {formatMoney(item.amount)}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Savings Goals</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/(tabs)/goals/add-goal')}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={60} color="#4287f5" style={styles.leafIcon} />
            <Text style={styles.emptyText}>No goals yet. Start saving today!</Text>
          </View>
        }
        
        renderItem={renderGoalCard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB',
    paddingTop: 10, 
  },
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EAF2',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827' 
  },
  addButton: {
    width: 36, 
    height: 36,
    borderRadius: 18, 
    backgroundColor: '#3B82F6', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  listContent: { 
    padding: 16,
    flexGrow: 1, 
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120, 
  },
  leafIcon: {
    marginBottom: 16,
    transform: [{ rotate: '-15deg' }] 
  },
  emptyText: { 
    fontSize: 14, 
    color: '#6B7280',
    textAlign: 'center' 
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EAF2',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E6EAF2',
    borderRadius: 4,
    marginBottom: 12,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  amountText: {
    fontSize: 12,
    color: '#6B7280',
  },
  boldAmount: {
    fontWeight: '700',
    color: '#111827',
  },
  greyText: {
    color: '#6B7280',
  },
});