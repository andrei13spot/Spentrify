import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGoalsStore } from '../../goals-store';

export default function GoalsIndex() {
  const router = useRouter();
  const { goals } = useGoalsStore();

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
    backgroundColor: '#fff',
    paddingTop: 10, 
  },
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerTitle: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#000' 
  },
  addButton: {
    width: 44, 
    height: 44,
    borderRadius: 22, 
    backgroundColor: '#4287f5', 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4287f5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  listContent: { 
    padding: 20,
    flexGrow: 1, 
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 150, 
  },
  leafIcon: {
    marginBottom: 16,
    transform: [{ rotate: '-15deg' }] 
  },
  emptyText: { 
    fontSize: 16, 
    color: '#888',
    textAlign: 'center' 
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  percentText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E8EFFC',
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
    fontSize: 14,
    color: '#888',
  },
  boldAmount: {
    fontWeight: 'bold',
    color: '#000',
  },
  greyText: {
    color: '#888',
  },
});