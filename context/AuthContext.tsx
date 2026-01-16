import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback, // 👈 ADDED THIS
} from "react";
import { Platform } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ================= TYPES ================= */

export type AuthUser = {
  id: string;        
  email?: string;   
  provider: "email" | "google" | "facebook" | "apple";
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  signupWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  setAuthUser: (user: AuthUser) => Promise<void>; 
  logout: () => Promise<void>;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= CONFIG ================= */

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

function extractErrorMessage(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error.message === "string") return data.error.message;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

/* ================= PROVIDER ================= */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. LOAD USER FROM STORAGE ON APP START
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.id && parsedUser.id !== "default_user") {
             setUser(parsedUser);
          }
        }
      } catch (e) {
        console.error("Failed to load user", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // 2. HELPER: UPDATE STATE & STORAGE (Wrapped in useCallback)
  const updateUserId = useCallback(async (newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } else {
      await AsyncStorage.removeItem('user');
    }
  }, []);

  /* ================= LOGIN METHODS ================= */

  // Wrapped in useCallback to fix linter warning
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!email || !password) throw new Error("Missing credentials");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(extractErrorMessage(data, "Login failed"));
      if (!data.success || !data.data) throw new Error("Invalid response");

      const newUser = {
        id: String(data.data.user_id),
        email: data.data.email,
        provider: "email" as const,
      };
      
      await updateUserId(newUser);

    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Login failed.");
    }
  }, [updateUserId]); // Dependency: updateUserId

  const loginWithGoogle = useCallback(async () => {
    throw new Error("Google sign-in is not configured yet.");
  }, []);

  const loginWithFacebook = useCallback(async () => {
    throw new Error("Facebook sign-in is not configured yet.");
  }, []);

  const loginWithApple = useCallback(async () => {
    throw new Error("Apple sign-in is not configured yet.");
  }, []);

  // Wrapped in useCallback
  const signupWithEmail = useCallback(async (email: string, password: string, fullName?: string) => {
    if (!email || !password) throw new Error("Required fields missing");
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password,
          full_name: fullName?.trim() || null
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(extractErrorMessage(data, "Signup failed"));
      if (!data.success || !data.data) throw new Error("Invalid response");

      const newUser = {
        id: String(data.data.user_id),
        email: data.data.email,
        provider: "email" as const,
      };

      await updateUserId(newUser);

    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Signup failed.");
    }
  }, [updateUserId]);

  /* ================= MANUAL SETTER ================= */
  
  // Wrapped in useCallback
  const setAuthUser = useCallback(async (userData: AuthUser) => {
      await updateUserId(userData);
  }, [updateUserId]);

  /* ================= LOGOUT ================= */

  // Wrapped in useCallback
  const logout = useCallback(async () => {
    await updateUserId(null); 
  }, [updateUserId]);

  /* ================= MEMOIZED VALUE ================= */

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    loginWithApple,
    setAuthUser, 
    logout,
  }), [
    // 👇 NGAYON PWEDE MO NA SILA ISAMA DITO KASI NAKA-useCallback NA
    user, 
    isLoading, 
    signupWithEmail, 
    loginWithEmail, 
    loginWithGoogle,
    loginWithFacebook,
    loginWithApple,
    setAuthUser, 
    logout
  ]);

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