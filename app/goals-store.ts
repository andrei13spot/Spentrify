import { create } from 'zustand';
import apiClient from '../utils/api';

// TYPES
export type Goal = {
  id: string;
  name: string;
  amount: string;
  currentSavings: string;
  date: string;
  status?: string;
};

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  
  // Actions need userId now kasi hindi tayo nasa loob ng AuthProvider
  fetchGoals: (userId: string) => Promise<void>;
  addGoal: (userId: string, goal: any) => Promise<void>;
  updateGoal: (userId: string, goal: Goal) => Promise<void>;
  deleteGoal: (userId: string, id: string) => Promise<void>;
}

// STORE
export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  loading: false,

  // 1. FETCH
  fetchGoals: async (userId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const res = await apiClient.get(`/api/goals?user_id=${userId}`);
      if (res.data.success) {
        set({ goals: res.data.data });
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      set({ loading: false });
    }
  },

  // 2. ADD
  addGoal: async (userId, goalData) => {
    try {
      await apiClient.post(`/api/goals`, {
        user_id: userId,
        name: goalData.name,
        amount: goalData.amount,
        currentSavings: goalData.currentSavings,
        date: goalData.date
      });
      // Refresh list
      await get().fetchGoals(userId);
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to save goal.');
    }
  },

  // 3. UPDATE
  updateGoal: async (userId, goalData) => {
    try {
      await apiClient.put(`/api/goals/${goalData.id}`, {
        user_id: userId,
        name: goalData.name,
        amount: goalData.amount,
        currentSavings: goalData.currentSavings,
        date: goalData.date
      });
      await get().fetchGoals(userId);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update goal.');
    }
  },

  // 4. DELETE
  deleteGoal: async (userId, id) => {
    try {
      await apiClient.delete(`/api/goals/${id}`, {
        data: { user_id: userId }
      });
      await get().fetchGoals(userId);
    } catch (error) {
      console.error('Delete error:', error);
    }
  },
}));