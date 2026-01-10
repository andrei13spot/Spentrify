import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import TransactionErrorModal from "../components/TransactionErrorModal";
import { fonts } from "../constants/fonts";
import { useAuth } from "../context/AuthContext";

/* ================= SCREEN ================= */

export default function LoginScreen() {
  /* ================= AUTH ================= */
  const {
    loginWithEmail,
    loginWithGoogle,
    loginWithApple,
  } = useAuth();

  /* ================= FORM STATE ================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ================= UI STATE ================= */
  const [loading, setLoading] = useState(false);

  /* ================= ERROR STATE ================= */
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ================= EMAIL LOGIN ================= */

  const handleLogin = async () => {
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password to login.");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);

      /**
       * 🔌 BACKEND READY
       * POST /auth/login
       */
      await loginWithEmail(email, password);

      // ✅ EMAIL LOGIN IS CONFIRMED → SAFE TO REDIRECT
      router.replace("/(tabs)/home");
    } catch {
      setErrorMessage("Login failed. Please try again.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */

  const handleGoogleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      /**
       * 🔌 GOOGLE OAUTH FLOW
       * 1. Redirect to Google
       * 2. Backend validates token
       * 3. Backend calls auth.login(user)
       * 4. AuthContext handles routing later
       */
      await loginWithGoogle();

      // ❌ DO NOT REDIRECT HERE
      // Backend/AuthContext will handle navigation
    } catch {
      setErrorMessage("Google login failed.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  /* ================= APPLE LOGIN ================= */

  const handleAppleLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);

      /**
       * 🔌 APPLE SIGN-IN FLOW
       * Backend/AuthContext controls routing
       */
      await loginWithApple();

      // ❌ DO NOT REDIRECT HERE
    } catch {
      setErrorMessage("Apple login failed.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Spentrify</Text>
      <Text style={styles.subtitle}>Transform how you spend</Text>

      {/* Inputs */}
      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.loginButton, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Signup Link */}
      <TouchableOpacity disabled={loading} onPress={() => router.push("/signup")}>
        <Text style={styles.signupLink}>
          New to Spentrify?{" "}
          <Text style={styles.signupBold}>Sign up here.</Text>
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <Text style={styles.orText}>OR CONTINUE WITH</Text>

      {/* Social Login */}
      <View style={styles.socialContainer}>
        <TouchableOpacity
          style={[styles.socialButton, loading && { opacity: 0.7 }]}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Image
            source={require("../assets/images/logos/GOOGLE.png")}
            style={styles.socialIcon}
          />
          <Text style={styles.socialText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialButton, loading && { opacity: 0.7 }]}
          onPress={handleAppleLogin}
          disabled={loading}
        >
          <Image
            source={require("../assets/images/logos/APPLE.png")}
            style={styles.socialIcon}
          />
          <Text style={styles.socialText}>Apple</Text>
        </TouchableOpacity>
      </View>

      {/* ERROR MODAL */}
      <TransactionErrorModal
        visible={showError}
        message={errorMessage}
        onRetry={() => setShowError(false)}
      />
    </View>
  );
}

/* ================= STYLES — UNTOUCHED ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    justifyContent: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#3B82F6",
    fontFamily: fonts.heading,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontFamily: fonts.body,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 36,
    color: "#6B7280",
    fontSize: 15,
  },

  form: {
    gap: 14,
    marginBottom: 24,
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  loginButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  signupLink: {
    marginTop: 18,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
  },

  signupBold: {
    color: "#3B82F6",
    textDecorationLine: "underline",
    fontWeight: "600",
  },

  orText: {
    textAlign: "center",
    marginVertical: 24,
    fontSize: 12,
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },

  socialContainer: {
    flexDirection: "row",
    gap: 14,
  },

  socialButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  socialIcon: {
    width: 18,
    height: 18,
  },

  socialText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
});
