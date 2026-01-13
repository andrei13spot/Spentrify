import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";

/* ================= TYPES ================= */

/**
 * Individual expense entry
 * Backend-ready (can come from API later)
 */
export type Expense = {
  id: string;
  amount: number;
  createdAt: string;
};

/**
 * Transaction type for dashboard display
 * Represents a budget with its spending data
 */
export type Transaction = {
  id: string;
  name: string; // budget name (from category or "Overall Budget")
  category: string; // category name
  amount: number; // budget amount (target_amount)
  date: string; // start date
  createdAt: string; // created timestamp

  /**
   * 🔽 Backend / future-ready fields
   * Optional so existing logic is NOT broken
   */
  expenses?: Expense[]; // individual transactions (for backward compatibility)
  spent?: number; // total spent (calculated from transactions)
  trend?: number[]; // spending trend over time
};

export type GeneratedReport = {
  id: string;
  itemId: string;
  title: string;
  description: string;
  createdAt: string;
};

type DataContextType = {
  transactions: Transaction[]; // Budgets with spending data
  allTransactions: any[]; // Raw transaction data from backend
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
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
}

/**
 * Get API base URL (same logic as AuthContext)
 */
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
  const [allTransactions, setAllTransactions] = useState<any[]>([]); // Raw transactions from backend
  const [reportsByItemId, setReportsByItemId] = useState<
    Record<string, GeneratedReport[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  /**
   * Tracks last authenticated user
   * Used to detect account switching
   */
  const previousUserId = useRef<string | null>(null);

  /* ================= FETCH DATA FROM BACKEND ================= */

  /**
   * Fetch budgets and transactions from backend
   * Combines them to show budgets with spending data
   */
  const fetchData = async () => {
    if (!user?.id) {
      setTransactions([]);
      return;
    }

    try {
      setLoading(true);

      // Fetch budgets and transactions in parallel
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

      // Get categories for budget names
      const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
      const categoriesData = await categoriesResponse.json();
      const categories = categoriesData.success ? (categoriesData.data || []) : [];

      // Create a map of category_id to category_name
      const categoryMap = new Map(
        categories.map((cat: any) => [cat.category_id, cat.category_name])
      );

      // Transform budgets into Transaction format for dashboard
      const transformedBudgets: Transaction[] = budgets.map((budget: any) => {
        // Calculate spending for this budget from transactions
        const budgetTransactions = userTransactions.filter((tx: any) => {
          // If budget has category_id, match transactions with same category
          // If budget has no category_id (overall budget), include all transactions
          if (budget.category_id) {
            return tx.category_id === budget.category_id;
          }
          return true; // Overall budget includes all transactions
        });

        // Calculate spent amount
        const spent = budgetTransactions.reduce(
          (sum: number, tx: any) => sum + (tx.amount || 0),
          0
        );

        // Calculate trend (daily spending over last 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const recentTransactions = budgetTransactions.filter((tx: any) => {
          const txDate = new Date(tx.transaction_date || tx.created_at);
          return txDate >= sevenDaysAgo;
        });

        // Group by day and calculate daily totals
        const dailySpending = new Map<string, number>();
        recentTransactions.forEach((tx: any) => {
          const txDate = new Date(tx.transaction_date || tx.created_at);
          const dayKey = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
          dailySpending.set(dayKey, (dailySpending.get(dayKey) || 0) + (tx.amount || 0));
        });

        // Create trend array (cumulative spending over 7 days)
        const trend: number[] = [];
        let cumulative = 0;
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const dayKey = date.toISOString().split('T')[0];
          cumulative += dailySpending.get(dayKey) || 0;
          trend.push(cumulative);
        }

        // Get budget name (category name or "Overall Budget")
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
      setAllTransactions(userTransactions); // Store raw transactions for monthly total calculation
      setLastFetchTime(Date.now());
    } catch (error) {
      console.error('Error fetching data:', error);
      // Don't crash the app, just log the error
    } finally {
      setLoading(false);
    }
  };

  /* ================= IDENTITY AWARE RESET & FETCH ================= */

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    // First login → just set reference and fetch data
    if (previousUserId.current === null) {
      previousUserId.current = currentUserId;
      if (currentUserId) {
        fetchData();
      }
      return;
    }

    // User switched or logged out → wipe data
    if (previousUserId.current !== currentUserId) {
      clearAllData();
      previousUserId.current = currentUserId;
      if (currentUserId) {
        fetchData();
      }
    }
  }, [user]);

  // Refresh data when user changes
  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  /* ================= ACTIONS ================= */

  /**
   * Add a transaction (spending entry)
   * Sends transaction to backend API and then refreshes data
   */
  const addTransaction = async (transaction: Transaction) => {
    if (!user?.id) {
      console.error('Cannot add transaction: user not logged in');
      return;
    }

    try {
      // Get categories to map category name to category_id
      const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
      const categoriesData = await categoriesResponse.json();
      const categories = categoriesData.success ? (categoriesData.data || []) : [];
      
      // Find category_id by category name
      const category = categories.find((cat: any) => 
        cat.category_name.toLowerCase() === transaction.category?.toLowerCase()
      );
      const categoryId = category ? category.category_id : null;

      // Convert date from MM/DD/YYYY to ISO format
      let transactionDate = new Date().toISOString();
      if (transaction.date) {
        const dateParts = transaction.date.split('/');
        if (dateParts.length === 3) {
          // MM/DD/YYYY format
          const month = parseInt(dateParts[0]) - 1; // JS months are 0-indexed
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          transactionDate = new Date(year, month, day).toISOString();
        }
      }

      // Send transaction to backend
      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          amount: transaction.amount,
          merchant_name: transaction.name, // Use name as merchant_name
          transaction_date: transactionDate,
          category_id: categoryId,
          is_manual: 1, // All transactions from the app are manual
          is_reimbursable: (transaction as any).isReimbursable ? 1 : 0, // UC-7: Reimbursement Mode
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Failed to create transaction:', data.error);
        return;
      }

      // Refresh data from backend to update spending calculations
      await fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      // Still refresh data in case transaction was created
      await fetchData();
    }
  };

  const generateReportForItem = (itemId: string) => {
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
  };

  /**
   * LOGOUT SAFE
   * Data reset handled by identity watcher above
   */
  const clearForLogout = () => {
    // intentionally empty
  };

  /**
   * FULL DATA WIPE
   */
  const clearAllData = () => {
    setTransactions([]);
    setAllTransactions([]);
    setReportsByItemId({});
  };

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
    [transactions, allTransactions, loading, reportsByItemId]
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
