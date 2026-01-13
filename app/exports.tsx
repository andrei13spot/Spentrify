import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

/* ================= THEME ================= */

const THEME = {
  primary: "#3B82F6",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  border: "#E5E7EB",
  success: "#10B981",
};

/**
 * Get API base URL
 */
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

/* ================= SCREEN ================= */

export default function ExportsScreen() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);

  // Date range (default to current year)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  const endOfYear = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(startOfYear);
  const [endDate, setEndDate] = useState(endOfYear);

  /* ================= EXPORT FUNCTIONS ================= */

  const downloadITRExport = async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please log in to export reports.");
      return;
    }

    try {
      setDownloading('itr');
      const url = `${API_BASE_URL}/api/exports/itr?user_id=${user.id}&start_date=${startDate}&end_date=${endDate}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to generate ITR export');
      }

      const csvContent = await response.text();
      
      // Save to file system (using expo-file-system)
      const fileName = `Spentrify_ITR_Export_${Date.now()}.csv`;
      // @ts-ignore - documentDirectory exists at runtime
      const documentDir = FileSystem.documentDirectory || '';
      const fileUri = documentDir + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share ITR Export',
        });
      } else {
        Alert.alert(
          "Export Ready",
          `ITR export saved as ${fileName}. You can find it in your device storage.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error downloading ITR export:', error);
      Alert.alert("Error", "Failed to download ITR export. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  const downloadReimbursementExport = async () => {
    if (!user?.id) {
      Alert.alert("Error", "Please log in to export reports.");
      return;
    }

    try {
      setDownloading('reimbursement');
      const url = `${API_BASE_URL}/api/exports/reimbursement?user_id=${user.id}&start_date=${startDate}&end_date=${endDate}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to generate reimbursement export');
      }

      const csvContent = await response.text();
      
      // Save to file system
      const fileName = `Spentrify_Reimbursement_Export_${Date.now()}.csv`;
      // @ts-ignore - documentDirectory exists at runtime
      const documentDir = FileSystem.documentDirectory || '';
      const fileUri = documentDir + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // Share the file
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Share Reimbursement Export',
        });
      } else {
        Alert.alert(
          "Export Ready",
          `Reimbursement export saved as ${fileName}. You can find it in your device storage.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error downloading reimbursement export:', error);
      Alert.alert("Error", "Failed to download reimbursement export. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={THEME.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Exports</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* UC-6: ITR SUPPORT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={24} color={THEME.primary} />
            <Text style={styles.sectionTitle}>ITR Support (UC-6)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Export expenses grouped by deductible categories for Philippine Income Tax Return (ITR) filing.
            Perfect for sharing with accountants.
          </Text>

          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateLabel}>Date Range:</Text>
            <Text style={styles.dateValue}>
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </Text>
          </View>

          <Pressable
            style={[styles.exportButton, styles.itrButton]}
            onPress={downloadITRExport}
            disabled={downloading !== null}
          >
            {downloading === 'itr' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Export ITR Report (CSV)</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* UC-7: REIMBURSEMENT MODE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={24} color={THEME.success} />
            <Text style={styles.sectionTitle}>Reimbursement Mode (UC-7)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Export all reimbursable expenses with receipt information for HR/employer submission.
          </Text>

          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateLabel}>Date Range:</Text>
            <Text style={styles.dateValue}>
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </Text>
          </View>

          <Pressable
            style={[styles.exportButton, styles.reimbursementButton]}
            onPress={downloadReimbursementExport}
            disabled={downloading !== null}
          >
            {downloading === 'reimbursement' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Export Reimbursement Report (CSV)</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* INFO */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={THEME.sub} />
          <Text style={styles.infoText}>
            Exports are generated in CSV format and can be opened in Excel, Google Sheets, or any spreadsheet application.
            You can share them via email, messaging apps, or cloud storage.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: THEME.sub,
    lineHeight: 20,
    marginBottom: 16,
  },
  dateRangeContainer: {
    backgroundColor: THEME.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 12,
    color: THEME.sub,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.text,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  itrButton: {
    backgroundColor: THEME.primary,
  },
  reimbursementButton: {
    backgroundColor: THEME.success,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: THEME.sub,
    lineHeight: 18,
  },
});
