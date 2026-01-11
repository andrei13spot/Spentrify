import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

export type Transaction = {
  id: string;
  name: string; // transaction / goal name
  category: string;
  amount: number; // allocated budget
  date: string; // user-selected date (MM/DD/YYYY)
  createdAt: string; // system timestamp

  /**
   * 🔽 Backend / future-ready fields
   * Optional so existing logic is NOT broken
   */
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

  addTransaction: (transaction: Transaction) => void;

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

/* ================= PROVIDER ================= */

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  /* ================= STATE ================= */

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reportsByItemId, setReportsByItemId] = useState<
    Record<string, GeneratedReport[]>
  >({});

  /**
   * Tracks last authenticated user
   * Used to detect account switching
   */
  const previousUserId = useRef<string | null>(null);

  /* ================= IDENTITY AWARE RESET ================= */

  useEffect(() => {
    const currentUserId = user?.id ?? null;

    // First login → just set reference
    if (previousUserId.current === null) {
      previousUserId.current = currentUserId;
      return;
    }

    // User switched or logged out → wipe data
    if (previousUserId.current !== currentUserId) {
      clearAllData();
      previousUserId.current = currentUserId;
    }
  }, [user]);

  /* ================= ACTIONS ================= */

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
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
    setReportsByItemId({});
  };

  /* ================= MEMOIZED VALUE ================= */

  const value = useMemo(
    () => ({
      transactions,
      addTransaction,
      reportsByItemId,
      generateReportForItem,
      clearForLogout,
      clearAllData,
    }),
    [transactions, reportsByItemId]
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
