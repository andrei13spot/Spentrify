import React, { createContext, useContext, useState } from "react";

/* ================= TYPES ================= */

export type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
};

type NotificationContextType = {
  notifications: Notification[];

  // CRUD
  addNotification: (n: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;

  // Clear actions
  clearAll: () => void;          // UI-triggered (Clear all notifications)
  clearForLogout: () => void;    // Logout-triggered (session end)
};

/* ================= CONTEXT ================= */

const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

/* ================= PROVIDER ================= */

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /* ================= ACTIONS ================= */

  const addNotification = (n: Omit<Notification, "id">) => {
    setNotifications((prev) => [
      { id: Date.now().toString(), ...n },
      ...prev,
    ]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  /**
   * Used when user manually clears notifications
   */
  const clearAll = () => {
    setNotifications([]);
  };

  /**
   * Used ONLY on logout
   * Keeps semantic separation for future persistence
   */
  const clearForLogout = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        clearForLogout,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return ctx;
}
