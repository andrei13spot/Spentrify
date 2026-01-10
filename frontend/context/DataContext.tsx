import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

/* ================= TYPES ================= */

export type Transaction = {
  id: string;
  name: string; // transaction / goal name
  category: string;
  amount: number; // allocated budget
  date: string; // user-selected date (MM/DD/YYYY)
  createdAt: string; // system timestamp
};

export type GeneratedReport = {
  id: string;
  itemId: string; // transaction / goal id
  title: string;
  description: string; // AI / backend-generated content later
  createdAt: string;
};

type DataContextType = {
  /* Core data */
  transactions: Transaction[];

  /* Transactions */
  addTransaction: (transaction: Transaction) => void;

  /* Reports */
  reportsByItemId: Record<string, GeneratedReport[]>;
  generateReportForItem: (itemId: string) => void;

  /* Session / Reset actions */
  clearForLogout: () => void;   // ❌ does NOT wipe data
  clearAllData: () => void;     // ✅ full reset (dev / delete account)
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
  /* ================= STATE ================= */

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  /**
   * Key   → transaction / goal id
   * Value → generated reports for that item
   */
  const [reportsByItemId, setReportsByItemId] = useState<
    Record<string, GeneratedReport[]>
  >({});

  /* ================= ACTIONS ================= */

  const addTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev]);
  };

  /**
   * Placeholder report generator
   * Backend / AI will replace this
   */
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
   * 🔐 LOGOUT SAFE
   * Does NOT clear transactions or reports
   * Used when user logs out
   */
  const clearForLogout = () => {
    // intentionally empty
    // session reset handled by AuthContext
  };

  /**
   * 🚨 FULL DATA WIPE
   * Used for:
   * - Dev reset
   * - Account deletion
   * - Debugging
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
