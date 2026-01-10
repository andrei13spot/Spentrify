import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
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

/* ================= SCREEN ================= */

export default function SecurityScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    Alert.alert("Success", "Your password has been updated!", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Change Password</Text>

          {/* spacer for symmetry */}
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.description}>
            Your new password must be different from previously used passwords.
          </Text>

          {/* CURRENT PASSWORD */}
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry={!showPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
          />

          {/* NEW PASSWORD */}
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
          />

          {/* CONFIRM PASSWORD */}
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
          />

          {/* SHOW PASSWORD */}
          <TouchableOpacity
            style={styles.showPasswordRow}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "checkbox" : "square-outline"}
              size={20}
              color="#3B82F6"
            />
            <Text style={styles.showPasswordText}>Show Passwords</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* FOOTER BUTTON */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={handleUpdate}
          >
            <Text style={styles.buttonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 20,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
    marginTop: 18,
  },

  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },

  showPasswordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
  },

  showPasswordText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
