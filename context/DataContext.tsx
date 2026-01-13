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

  addTransaction: (transaction: Transaction) => Promise<void>;
  refreshData: () => Promise<void>;

  /** ✅ EDIT & DELETE */
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

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
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

const API_BASE_URL = getApiBaseUrl();

/* ================= PROVIDER ================= */

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [reportsByItemId, setReportsByItemId] = useState<
    Record<string, GeneratedReport[]>
  >({});
  const [loading, setLoading] = useState(false);

  const previousUserId = useRef<string | null>(null);

  /* ================= RESET ================= */

  const clearAllData = useCallback(() => {
    setTransactions([]);
    setAllTransactions([]);
    setReportsByItemId({});
  }, []);

  /* ================= FETCH DATA ================= */

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      clearAllData();
      return;
    }

    try {
      setLoading(true);

      const [budgetsRes, txRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/budgets?user_id=${user.id}`),
        fetch(`${API_BASE_URL}/api/transactions?user_id=${user.id}`),
        fetch(`${API_BASE_URL}/api/categories`),
      ]);

      const budgetsJson = await budgetsRes.json();
      const txJson = await txRes.json();
      const categoriesJson = await categoriesRes.json();

      if (!budgetsJson.success || !txJson.success) return;

      const budgets = budgetsJson.data || [];
      const userTransactions = txJson.data || [];
      const categories = categoriesJson.success
        ? categoriesJson.data || []
        : [];

      const categoryMap = new Map(
        categories.map((c: any) => [c.category_id, c.category_name])
      );

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
          const d = new Date(tx.transaction_date || tx.created_at);
          if (d >= sevenDaysAgo) {
            const key = d.toISOString().split("T")[0];
            dailySpending.set(key, (dailySpending.get(key) || 0) + tx.amount);
          }
        });

        const trend: number[] = [];
        let cumulative = 0;

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const key = d.toISOString().split("T")[0];
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
          date: budget.start_date || now.toISOString().split("T")[0],
          createdAt: budget.created_at || now.toISOString(),
          spent,
          trend,
        };
      });

      setTransactions(transformed);
      setAllTransactions(userTransactions);
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

  /* ================= ACTIONS ================= */

  const addTransaction = useCallback(
    async (_transaction: Transaction) => {
      await fetchData(); // UI refresh only
    },
    [fetchData]
  );

  /** ✅ EDIT */
  const updateTransaction = useCallback(
    (id: string, updates: Partial<Transaction>) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    },
    []
  );

  /** ✅ DELETE */
  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setReportsByItemId((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  /** ✅ REPORT */
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
    // intentionally empty – identity watcher handles reset
  }, []);

  /* ================= VALUE ================= */

  const value = useMemo(
    () => ({
      transactions,
      allTransactions,
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
