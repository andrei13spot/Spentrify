import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback, // <--- 1. IMPORT ADDED
} from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";

/* ================= TYPES ================= */

export type Expense = {
  id: string;
  amount: number;
  createdAt: string;
};

export type Transaction = {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  createdAt: string;
  expenses?: Expense[];
  spent?: number;
  trend?: number[];
};

export type GeneratedReport = {
  id: string;
  itemId: string;
  title: string;
  description: string;
  createdAt: string;
};

type DataContextType = {
  transactions: Transaction[];
  allTransactions: any[];
  loading: boolean;
  addTransaction: (transaction: Transaction) => void;
  refreshData: () => Promise<void>;
  reportsByItemId: Record<string, GeneratedReport[]>;
  generateReportForItem: (itemId: string) => void;
  clearForLogout: () => void;
  clearAllData: () => void;
};

/* ================= CONTEXT ================= */

const DataContext = createContext<DataContextType | undefined>(undefined);

/* ================= HELPERS ================= */

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

const API_BASE_URL = getApiBaseUrl();

/* ================= PROVIDER ================= */

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  /* ================= STATE ================= */

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [reportsByItemId, setReportsByItemId] = useState<Record<string, GeneratedReport[]>>({});
  const [loading, setLoading] = useState(false);
  
  // REMOVED: lastFetchTime (unused)

  const previousUserId = useRef<string | null>(null);

  /* ================= UTILS (Wrapped in useCallback) ================= */

  // Moved up because it is used in fetchData
  const clearAllData = useCallback(() => {
    setTransactions([]);
    setAllTransactions([]);
    setReportsByItemId({});
  }, []);

  /* ================= FETCH DATA (Wrapped in useCallback) ================= */

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }

    try {
      setLoading(true);

      const [budgetsResponse, transactionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/budgets?user_id=${user.id}`),
        fetch(`${API_BASE_URL}/api/transactions?user_id=${user.id}`),
      ]);

      const budgetsData = await budgetsResponse.json();
      const transactionsData = await transactionsResponse.json();

      if (!budgetsData.success || !transactionsData.success) {
        console.error('Failed to fetch data from backend');
        return;
      }

      const budgets = budgetsData.data || [];
      const userTransactions = transactionsData.data || [];

      const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
      const categoriesData = await categoriesResponse.json();
      const categories = categoriesData.success ? (categoriesData.data || []) : [];

      const categoryMap = new Map(
        categories.map((cat: any) => [cat.category_id, cat.category_name])
      );

      const transformedBudgets: Transaction[] = budgets.map((budget: any) => {
        const budgetTransactions = userTransactions.filter((tx: any) => {
          if (budget.category_id) {
            return tx.category_id === budget.category_id;
          }
          return true;
        });

        const spent = budgetTransactions.reduce(
          (sum: number, tx: any) => sum + (tx.amount || 0),
          0
        );

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const recentTransactions = budgetTransactions.filter((tx: any) => {
          const txDate = new Date(tx.transaction_date || tx.created_at);
          return txDate >= sevenDaysAgo;
        });

        const dailySpending = new Map<string, number>();
        recentTransactions.forEach((tx: any) => {
          const txDate = new Date(tx.transaction_date || tx.created_at);
          const dayKey = txDate.toISOString().split('T')[0];
          dailySpending.set(dayKey, (dailySpending.get(dayKey) || 0) + (tx.amount || 0));
        });

        const trend: number[] = [];
        let cumulative = 0;
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const dayKey = date.toISOString().split('T')[0];
          cumulative += dailySpending.get(dayKey) || 0;
          trend.push(cumulative);
        }

        const budgetName = budget.category_id
          ? categoryMap.get(budget.category_id) || 'Unknown Category'
          : 'Overall Budget';

        return {
          id: String(budget.budget_id),
          name: budgetName,
          category: budgetName,
          amount: budget.target_amount,
          date: budget.start_date || new Date().toISOString().split('T')[0],
          createdAt: budget.created_at || new Date().toISOString(),
          spent,
          trend: trend.length > 0 ? trend : [0],
        };
      });

      setTransactions(transformedBudgets);
      setAllTransactions(userTransactions);
      // REMOVED: setLastFetchTime (unused)
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Dependency: user.id

  /* ================= IDENTITY AWARE RESET & FETCH ================= */

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    if (previousUserId.current === null) {
      previousUserId.current = currentUserId;
      if (currentUserId) {
        fetchData();
      }
      return;
    }

    if (previousUserId.current !== currentUserId) {
      clearAllData();
      previousUserId.current = currentUserId;
      if (currentUserId) {
        fetchData();
      }
    }
  }, [user, fetchData, clearAllData]); // Fixed dependencies

  // NOTE: Redundant effect removed because the one above handles login/switching.
  
  /* ================= ACTIONS (Wrapped in useCallback) ================= */

  // FIXED: Removed duplicate API call. UI Update / Refresh only.
  const addTransaction = useCallback(async (transaction: Transaction) => {
    console.log("Context: Refreshing data after transaction...");
    await fetchData(); 

  }, [fetchData]);

  const generateReportForItem = useCallback((itemId: string) => {
    const now = new Date();

    const newReport: GeneratedReport = {
      id: uid("report"),
      itemId,
      title: "Generated Report",
      description:
        "This is a placeholder AI-generated report. Backend logic will generate detailed insights here.",
      createdAt: now.toLocaleString(),
    };

    setReportsByItemId((prev) => {
      const existing = prev[itemId] ?? [];
      return {
        ...prev,
        [itemId]: [newReport, ...existing],
      };
    });
  }, []);

  const clearForLogout = useCallback(() => {
    // intentionally empty
  }, []);

  /* ================= MEMOIZED VALUE ================= */

  const value = useMemo(
    () => ({
      transactions,
      allTransactions,
      loading,
      addTransaction,
      refreshData: fetchData,
      reportsByItemId,
      generateReportForItem,
      clearForLogout,
      clearAllData,
    }),
    [
      transactions,
      allTransactions,
      loading,
      addTransaction, // Now stable
      fetchData,      // Now stable
      reportsByItemId,
      generateReportForItem, // Now stable
      clearForLogout, // Now stable
      clearAllData,   // Now stable
    ]
  );

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}