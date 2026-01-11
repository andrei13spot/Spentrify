import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

/* ================= TYPES ================= */

export type AuthUser = {
  id: string;        // stable user identifier
  email?: string;   // email login
  provider: "email" | "google" | "apple";
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;

  // Login flows (backend-ready)
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;

  // Logout
  logout: () => void;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);

  /* ================= LOGIN METHODS ================= */

  /**
   * EMAIL LOGIN
   * ✅ Same email = same user ID
   * Backend will later validate credentials
   */
  const loginWithEmail = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Missing credentials");
    }

    const normalizedEmail = email.trim().toLowerCase();

    setUser({
      id: `email:${normalizedEmail}`, // ✅ stable identity
      email: normalizedEmail,
      provider: "email",
    });
  };

  /**
   * GOOGLE LOGIN
   * Backend OAuth will later provide a stable user id
   */
  const loginWithGoogle = async () => {
    setUser({
      id: "google:mock-user", // placeholder until backend OAuth
      provider: "google",
    });
  };

  /**
   * APPLE LOGIN
   * Backend OAuth will later provide a stable user id
   */
  const loginWithApple = async () => {
    setUser({
      id: "apple:mock-user", // placeholder until backend OAuth
      provider: "apple",
    });
  };

  /* ================= LOGOUT ================= */

  /**
   * 🔐 LOGOUT
   * Clears session only
   * Data reset handled by DataContext
   */
  const logout = () => {
    setUser(null);
  };

  /* ================= MEMOIZED VALUE ================= */

  const value = useMemo(() => {
    const isAuthenticated = !!user;

    return {
      user,
      isAuthenticated,
      loginWithEmail,
      loginWithGoogle,
      loginWithApple,
      logout,
    };
  }, [user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
