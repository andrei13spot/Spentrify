import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Platform } from "react-native";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { formatLocalDateKey, parseLocalDate } from "../utils/date";

/* ================= CONFIG ================= */

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

const API_BASE_URL = getApiBaseUrl();

/* ================= TYPES ================= */

export type Expense = {
  id: string;
  amount: number;
  createdAt: string;
};

// NOTE: Based on your code, "Transaction" type here actually looks like a "Budget/Goal".
// "allTransactions" holds the actual expense records.
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
  transactions: Transaction[]; // This seems to be your Budgets/Goals list
  allTransactions: any[];      // This is your Actual Expenses list
  categories: Array<{ category_id: number; category_name: string }>;
  loading: boolean;

  // Updated signatures to match Backend Logic
  addTransaction: (data: any) => Promise<void>;
  updateTransaction: (id: string, updates: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
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

/* ================= PROVIDER ================= */

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Array<{ category_id: number; category_name: string }>>([]);
  const [reportsByItemId, setReportsByItemId] = useState<Record<string, GeneratedReport[]>>({});
  const [loading, setLoading] = useState(false);

  const previousUserId = useRef<string | null>(null);

  /* ================= RESET ================= */

  const clearAllData = useCallback(() => {
    setTransactions([]);
    setAllTransactions([]);
    setReportsByItemId({});
  }, []);

  /* ================= FETCH DATA (READ) ================= */

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      clearAllData();
      return;
    }

    try {
      setLoading(true);

      // Using Axios for cleaner syntax
      const [budgetsRes, txRes, categoriesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/budgets?user_id=${user.id}`),
        axios.get(`${API_BASE_URL}/api/transactions?user_id=${user.id}`),
        axios.get(`${API_BASE_URL}/api/categories`),
      ]);

      const budgets = budgetsRes.data.data || [];
      const categories = categoriesRes.data.data || [];

      // Create a Map for categories
      const categoryMap = new Map(
        categories.map((c: any) => [c.category_id, c.category_name])
      );

      const userTransactions = (txRes.data.data || []).map((tx: any) => ({
        ...tx,
        category:
          tx.category ||
          (tx.category_id ? categoryMap.get(tx.category_id) : null) ||
          "Others",
      })); // The actual expenses

      // --- LOGIC TO MAP BUDGETS & CALCULATE TRENDS ---
      const transformed: Transaction[] = budgets.map((budget: any) => {
        const relatedTx = userTransactions.filter((tx: any) =>
          budget.category_id
            ? tx.category_id === budget.category_id
            : true
        );

        const spent = relatedTx.reduce(
          (sum: number, tx: any) => sum + (tx.amount || 0),
          0
        );

        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const dailySpending = new Map<string, number>();

        relatedTx.forEach((tx: any) => {
          // Fallback logic for date
          const dateStr = tx.transaction_date || tx.created_at;
          const d = parseLocalDate(dateStr);
          
          if (d >= sevenDaysAgo) {
            const key = formatLocalDateKey(d);
            dailySpending.set(key, (dailySpending.get(key) || 0) + tx.amount);
          }
        });

        const trend: number[] = [];
        let cumulative = 0;

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = formatLocalDateKey(d);
          cumulative += dailySpending.get(key) || 0;
          trend.push(cumulative);
        }

        const name = budget.category_id
          ? categoryMap.get(budget.category_id) || "Unknown Category"
          : "Overall Budget";

        return {
          id: String(budget.budget_id),
          name,
          category: name,
          amount: budget.target_amount,
          date: budget.start_date || formatLocalDateKey(now),
          createdAt: budget.created_at || now.toISOString(),
          spent,
          trend,
        };
      });

      setTransactions(transformed); // Used for Budget Cards
      setAllTransactions(userTransactions); // Used for Recent Transactions List
      setCategories(categories);

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, clearAllData]);

  /* ================= IDENTITY WATCHER ================= */

  useEffect(() => {
    const currentId = user?.id ?? null;

    if (previousUserId.current === null) {
      previousUserId.current = currentId;
      if (currentId) fetchData();
      return;
    }

    if (previousUserId.current !== currentId) {
      clearAllData();
      previousUserId.current = currentId;
      if (currentId) fetchData();
    }
  }, [user, fetchData, clearAllData]);

  /* ================= ACTIONS (CRUD) ================= */

  /** ADD TRANSACTION (Create) */
  const addTransaction = useCallback(async (transactionData: any) => {
      if (!user || !user.id) {
        console.error("Add Transaction Failed: No User Logged In");
        return; 
      }

      console.log("Current auth user:", user.id);

      try {
        // Kahit may "default_user" na laman ang transactionData, papalitan natin ito.
        const finalData = {
          ...transactionData,
          user_id: Number(user.id) // ORCE USE AUTH USER ID
        };

        console.log("Sending to backend:", finalData);

        await axios.post(`${API_BASE_URL}/api/transactions`, finalData);
        
        await fetchData(); 
      } catch (error) {
        console.error("Failed to add transaction:", error);
        throw error;
      }
    },
    [user, fetchData] 
  );

  /** EDIT TRANSACTION (Update) */
  const updateTransaction = useCallback(async (id: string, updates: any) => {
      if (!user?.id) return;

      try {
        await axios.put(`${API_BASE_URL}/api/transactions/${id}`, {
          ...updates,
          user_id: user.id // 
        });

        await fetchData(); // Refresh UI after update
      } catch (error) {
        console.error("Failed to update transaction:", error);
      }
    },
    [user?.id, fetchData]
  );

  /** ✅ DELETE TRANSACTION (Delete) */
  const deleteTransaction = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      // Axios Delete with Body Data
      await axios.delete(`${API_BASE_URL}/api/transactions/${id}`, {
        data: { user_id: user.id }
      });

      await fetchData(); // Refresh UI after delete
      
      // Also clean up local reports
      setReportsByItemId((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  }, [user?.id, fetchData]);

  /** REPORT (Local Mock) */
  const generateReportForItem = useCallback((itemId: string) => {
    const report: GeneratedReport = {
      id: uid("report"),
      itemId,
      title: "Generated Report",
      description:
        "This is a placeholder AI-generated report. Backend logic will generate detailed insights here.",
      createdAt: new Date().toLocaleString(),
    };

    setReportsByItemId((prev) => {
      const existing = prev[itemId] ?? [];
      return { ...prev, [itemId]: [report, ...existing] };
    });
  }, []);

  const clearForLogout = useCallback(() => {
    // handled by identity watcher
  }, []);

  /* ================= VALUE ================= */

  const value = useMemo(
    () => ({
      transactions,
      allTransactions,
      categories,
      loading,
      addTransaction,
      refreshData: fetchData,
      updateTransaction,
      deleteTransaction,
      reportsByItemId,
      generateReportForItem,
      clearForLogout,
      clearAllData,
    }),
    [
      transactions,
      allTransactions,
      categories,
      loading,
      addTransaction,
      fetchData,
      updateTransaction,
      deleteTransaction,
      reportsByItemId,
      generateReportForItem,
      clearForLogout,
      clearAllData,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/* ================= HOOK ================= */

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}