import React, {
    createContext,
    useContext,
    useMemo,
    useState,
} from "react";

/* ================= TYPES ================= */

export type AuthUser = {
  id: string;        // backend user id
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

/* ================= HELPERS ================= */

function generateUserId(prefix = "user") {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
}

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
   * Backend will later validate credentials
   */
  const loginWithEmail = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Missing credentials");
    }

    // ✅ Temporary mock user
    setUser({
      id: generateUserId("email"),
      email,
      provider: "email",
    });
  };

  /**
   * GOOGLE LOGIN
   * Backend OAuth redirect will replace this
   */
  const loginWithGoogle = async () => {
    setUser({
      id: generateUserId("google"),
      provider: "google",
    });
  };

  /**
   * APPLE LOGIN
   * Backend OAuth redirect will replace this
   */
  const loginWithApple = async () => {
    setUser({
      id: generateUserId("apple"),
      provider: "apple",
    });
  };

  /* ================= LOGOUT ================= */

  /**
   * IMPORTANT:
   * ❌ Does NOT clear transactions/goals
   * ✅ Only clears session
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
