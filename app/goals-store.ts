import { create } from 'zustand';

interface Goal {
  id: string;
  name: string;
  amount: string;
  currentSavings: string;
  date: string;
}

interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  updateGoal: (updatedGoal: Goal) => void; 
  deleteGoal: (id: string) => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  addGoal: (newGoal) => set((state) => ({ goals: [...state.goals, newGoal] })),
  updateGoal: (updatedGoal) => set((state) => ({
    goals: state.goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
  })),

  deleteGoal: (id) => set((state) => ({
    goals: state.goals.filter((g) => g.id !== id)
  })),
}));