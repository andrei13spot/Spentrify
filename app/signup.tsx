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
import SignupSuccessModal from "../components/SignupSuccessModal";
import TransactionErrorModal from "../components/TransactionErrorModal";
import { useAuth } from "../context/AuthContext";

export default function SignUpScreen() {
  /* ================= AUTH ================= */
  const { 
    signupWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    loginWithApple,
  } = useAuth();

  /* ================= FORM STATE ================= */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  /* ================= UI STATE ================= */
  const [loading, setLoading] = useState(false);

  /* ================= ERROR STATE ================= */
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ================= SUCCESS STATE ================= */
  const [showSuccess, setShowSuccess] = useState(false);

  /* ================= SOCIAL LOGIN HANDLERS ================= */
  
  const handleGoogleSignup = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await loginWithGoogle();
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google signup failed.";
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await loginWithFacebook();
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Facebook signup failed.";
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await loginWithApple();
      router.replace("/(tabs)/home");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Apple signup failed.";
      setErrorMessage(message);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EMAIL SIGNUP ================= */
  const handleSignup = async () => {
    if (loading) return;

    // Validation
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      setShowError(true);
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      setShowError(true);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      setShowError(true);
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter a password.");
      setShowError(true);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setShowError(true);
      return;
    }

    try {
      setLoading(true);

      /**
       * 🔌 BACKEND READY
       * POST /api/auth/signup
       * Creates user account in database
       * This saves the user to the database with encrypted email and hashed password
       */
      await signupWithEmail(email, password);

      // ✅ SIGNUP SUCCESSFUL → Show success modal
      // User account is now saved in database
      // User needs to login with their credentials
      setShowSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Signup failed. Please try again.";
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
            <Text style={styles.title}>Sign Up</Text>
            <Text style={styles.subtitle}>
              Join Spentrify and start tracking smarter
            </Text>

            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              editable={!loading}
            />

            <TextInput
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              editable={!loading}
            />

            <View style={styles.passwordRow}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.passwordInput}
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

            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.7 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace("/")}>
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={[styles.socialButton, loading && { opacity: 0.7 }]}
              onPress={handleGoogleSignup}
              disabled={loading}
            >
              <Image
                source={require("../assets/images/logos/GOOGLE.png")}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Sign up with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, loading && { opacity: 0.7 }]}
              onPress={handleFacebookSignup}
              disabled={loading}
            >
              <Image
                source={require("../assets/images/logos/FACEABOOK.png")}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Sign up with Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, loading && { opacity: 0.7 }]}
              onPress={handleAppleSignup}
              disabled={loading}
            >
              <Image
                source={require("../assets/images/logos/APPLE.png")}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Sign up with Apple</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              By signing up to create an account I accept Spentrify’s{" "}
              <Text style={styles.link}>Terms of Use</Text> and{" "}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ❌ ERROR MODAL */}
      <TransactionErrorModal
        visible={showError}
        message={errorMessage}
        onRetry={() => setShowError(false)}
      />

      {/* ✅ SUCCESS MODAL */}
      <SignupSuccessModal
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          // Redirect to login page after closing modal
          router.replace("/");
        }}
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

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 24,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 14,
  },

  showText: {
    color: "#3B82F6",
    fontWeight: "600",
  },

  primaryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 14,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  loginText: {
    textAlign: "center",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 18,
  },

  loginLink: {
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

  termsText: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
  },

  link: {
    color: "#3B82F6",
    fontWeight: "500",
  },
});
