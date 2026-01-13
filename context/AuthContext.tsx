import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

/* ================= TYPES ================= */

export type AuthUser = {
  id: string;        // stable user identifier (user_id from backend)
  email?: string;   // email login
  provider: "email" | "google" | "facebook" | "apple";
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;

  // Signup
  signupWithEmail: (email: string, password: string) => Promise<void>;

  // Login flows (backend-ready)
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithApple: () => Promise<void>;

  // Logout
  logout: () => void;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

/**
 * BACKEND API URL CONFIGURATION
 * 
 * For Android Emulator: Use 10.0.2.2 (special IP that maps to host machine's localhost)
 * For iOS Simulator: Use localhost (works directly)
 * For Physical Device: Use your computer's IP address (e.g., 192.168.1.100)
 * 
 * You can override this by setting EXPO_PUBLIC_API_URL in .env file
 */
function getApiBaseUrl(): string {
  // Check if custom URL is set in environment
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Android emulator needs special IP address
  if (Platform.OS === 'android') {
    return "http://10.0.2.2:3000";
  }

  // iOS simulator and web can use localhost
  return "http://localhost:3000";
}

const API_BASE_URL = getApiBaseUrl();

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);

  /* ================= LOGIN METHODS ================= */

  /**
   * EMAIL LOGIN
   * Connects to backend API for authentication
   */
  const loginWithEmail = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Missing credentials");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (!data.success || !data.data) {
        throw new Error("Invalid response from server");
      }

      // Set user state with backend response
      setUser({
        id: String(data.data.user_id),
        email: data.data.email,
        provider: "email",
      });
    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Login failed. Please try again.");
    }
  };

  /**
   * GOOGLE LOGIN
   * TODO: Implement OAuth flow with backend
   * For now, this is a placeholder
   */
  const loginWithGoogle = async () => {
    // TODO: Implement Google OAuth
    // 1. Use expo-auth-session or @react-native-google-signin/google-signin
    // 2. Get OAuth token from Google
    // 3. Send token to backend /api/auth/google
    // 4. Backend validates and returns user info
    
    // Placeholder for now
    setUser({
      id: "google:mock-user", // placeholder until backend OAuth
      provider: "google",
    });
    
    throw new Error("Google login not yet implemented. Please use email login.");
  };

  /**
   * FACEBOOK LOGIN
   * TODO: Implement OAuth flow with backend
   * For now, this is a placeholder
   */
  const loginWithFacebook = async () => {
    // TODO: Implement Facebook OAuth
    // 1. Use expo-auth-session or react-native-fbsdk-next
    // 2. Get OAuth token from Facebook
    // 3. Send token to backend /api/auth/facebook
    // 4. Backend validates and returns user info
    
    // Placeholder for now
    setUser({
      id: "facebook:mock-user", // placeholder until backend OAuth
      provider: "facebook",
    });
    
    throw new Error("Facebook login not yet implemented. Please use email login.");
  };

  /**
   * APPLE LOGIN
   * TODO: Implement OAuth flow with backend
   * For now, this is a placeholder
   */
  const loginWithApple = async () => {
    // TODO: Implement Apple Sign-In
    // 1. Use expo-apple-authentication
    // 2. Get identity token from Apple
    // 3. Send token to backend /api/auth/apple
    // 4. Backend validates and returns user info
    
    // Placeholder for now
    setUser({
      id: "apple:mock-user", // placeholder until backend OAuth
      provider: "apple",
    });
    
    throw new Error("Apple login not yet implemented. Please use email login.");
  };

  /**
   * EMAIL SIGNUP
   * Connects to backend API for user registration
   */
  const signupWithEmail = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      if (!data.success || !data.data) {
        throw new Error("Invalid response from server");
      }

      // Set user state with backend response
      setUser({
        id: String(data.data.user_id),
        email: data.data.email,
        provider: "email",
      });
    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Signup failed. Please try again.");
    }
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
      signupWithEmail,
      loginWithEmail,
      loginWithGoogle,
      loginWithFacebook,
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
