import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TransactionErrorModal from "../components/TransactionErrorModal";
import { useAuth } from "../context/AuthContext";

/* ================= SCREEN ================= */

export default function LoginScreen() {
  /* ================= AUTH ================= */
  const {
    loginWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    loginWithApple,
  } = useAuth();

  /* ================= FORM STATE ================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
      await loginWithEmail(email, password);
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      setErrorMessage(message);
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
      await loginWithGoogle();
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google login failed.";
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FACEBOOK LOGIN ================= */

  const handleFacebookLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await loginWithFacebook();
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Facebook login failed.";
      setErrorMessage(message);
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
      await loginWithApple();
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Apple login failed.";
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            
            {/* LOGO IMAGE */}
            <Image 
              source={require("../assets/images/logos/name logo.png")}
              style={styles.logo}
            />
            
            <Text style={styles.subtitle}>
              Sign in to continue tracking your spending
            </Text>

            {/* Inputs */}
            <View style={styles.form}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
              <View style={styles.passwordRow}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Text style={styles.showText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
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
            <TouchableOpacity
              disabled={loading}
              onPress={() => router.push("/signup")}
            >
              <Text style={styles.signupLink}>
                New to Spentrify?{" "}
                <Text style={styles.signupBold}>Sign up here.</Text>
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Login */}
            <TouchableOpacity
              style={[styles.socialButton, loading && { opacity: 0.7 }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Image
                source={require("../assets/images/logos/GOOGLE.png")}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, loading && { opacity: 0.7 }]}
              onPress={handleFacebookLogin}
              disabled={loading}
            >
              <Image
                source={require("../assets/images/logos/FACEABOOK.png")}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Continue with Facebook</Text>
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
              <Text style={styles.socialText}>Continue with Apple</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ERROR MODAL */}
      <TransactionErrorModal
        visible={showError}
        message={errorMessage}
        onRetry={() => setShowError(false)}
      />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  card: {
    width: "100%",
  },

  // --- FIXED LOGO SPACING ---
  logo: {
    width: "100%",      
    height: 100,        // Reduced height to remove empty space
    alignSelf: "center",
    resizeMode: "contain",
    marginBottom: 0,    // Removed margin to bring text closer
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 24,
    marginTop: 0,      // Ensure no top margin pushes it down
  },

  form: {
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },

  showText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 14,
  },

  loginButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  signupLink: {
    textAlign: "center",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 18,
  },

  signupBold: {
    color: "#3B82F6",
    fontWeight: "600",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: "#6B7280",
  },

  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: "contain",
  },

  socialText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
});