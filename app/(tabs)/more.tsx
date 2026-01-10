import { Ionicons } from "@expo/vector-icons";
import { Link, router, type Href } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

/* ================= CONSTANTS ================= */

const COLORS = {
  primary: "#007AFF",
  danger: "#ff3b30",
  background: "#f2f2f7",
  card: "#ffffff",
  text: "#111827",
  subText: "#8e8e93",
  border: "#e5e7eb",
};

/* ================= SETTINGS ITEM ================= */

interface SettingsItemProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: Href;
  switchValue?: boolean;
  onSwitchChange?: () => void;
}

const SettingsItem = ({
  label,
  icon,
  href,
  switchValue,
  onSwitchChange,
}: SettingsItemProps) => {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#333" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>

      {onSwitchChange ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#d1d5db", true: COLORS.primary }}
          thumbColor="#ffffff"
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={COLORS.border} />
      )}
    </View>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <TouchableOpacity activeOpacity={0.7} style={styles.rowWrapper}>
          {content}
        </TouchableOpacity>
      </Link>
    );
  }

  return <View style={styles.rowWrapper}>{content}</View>;
};

/* ================= SCREEN ================= */

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState({
    cloudSync: false,
    biometrics: false,
  });

  const { logout } = useAuth(); // ✅ AUTH SESSION ONLY
  const { clearAll: clearNotifications } = useNotifications(); // ✅ NOTIFICATIONS

  const togglePreference = (key: "cloudSync" | "biometrics") => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          clearNotifications(); // 🔔 clear notifications only
          logout();             // 🔐 clear auth session
          router.replace("/");  // ⬅️ back to login
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <SettingsItem
              label="Edit Profile"
              icon="person-outline"
              href="/editprofile"
            />
            <View style={styles.divider} />
            <SettingsItem
              label="Security"
              icon="shield-checkmark-outline"
              href="/security"
            />
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <SettingsItem
              label="Cloud Sync"
              icon="cloud-outline"
              switchValue={preferences.cloudSync}
              onSwitchChange={() => togglePreference("cloudSync")}
            />
            <View style={styles.divider} />
            <SettingsItem
              label="Biometric Lock"
              icon="finger-print-outline"
              switchValue={preferences.biometrics}
              onSwitchChange={() => togglePreference("biometrics")}
            />
          </View>
        </View>

        {/* LOGOUT */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>v1.0.2 (Build 405)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.subText,
    marginBottom: 8,
    marginLeft: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: "hidden",
  },
  rowWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f2f2f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginLeft: 60,
  },
  logoutBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    color: COLORS.subText,
    fontSize: 12,
    marginTop: 10,
  },
});
