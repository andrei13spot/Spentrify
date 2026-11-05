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
import { API_BASE_URL } from "../utils/api";

/* ================= TYPES ================= */

export type Expense = {
  id: string;
  amount: number;
  createdAt: string;
};

export type Transaction = {
  id: string;
  amount: number;
  merchant_name?: string;
  description?: string;
  category?: string;
  category_id?: number;
  transaction_date?: string;
  created_at?: string;
  source_type?: string;
  is_manual?: number;
  is_reimbursable?: number;
};

export type GeneratedReport = {
  id: string;
  itemId: string;
  title: string;
  description: string;
  createdAt: string;
};

type DataContextType = {
  transactions: any[];
  allTransactions: any[];
  categories: Array<{ category_id: number; category_name: string }>;
  loading: boolean;

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

      // Fetch transactions and categories in parallel
      const [txRes, categoriesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/transactions?user_id=${user.id}`),
        axios.get(`${API_BASE_URL}/api/categories`),
      ]);

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
      }));

      setTransactions(userTransactions);
      setAllTransactions(userTransactions);
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