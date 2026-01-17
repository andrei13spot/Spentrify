import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";

/* ================= TYPES ================= */

export type CSVExportData = {
  title: string;
  type: 'itr' | 'reimbursement';
  csvContent: string;
  fileName: string;
  summary?: {
    totalTransactions?: number;
    totalAmount?: number;
    dateRange?: string;
    categoryBreakdown?: { category: string; amount: number }[];
  };
};

type CSVExportPreviewModalProps = {
  visible: boolean;
  exportData: CSVExportData | null;
  onClose: () => void;
};

/* ================= COMPONENT ================= */

export default function CSVExportPreviewModal({
  visible,
  exportData,
  onClose,
}: CSVExportPreviewModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!exportData) return null;

  /* ================= PREVIEW CSV CONTENT ================= */

  // Show first 10 lines of CSV for preview
  const getPreviewLines = (): string[] => {
    const lines = exportData.csvContent.split('\n');
    return lines.slice(0, 10);
  };

  const previewLines = getPreviewLines();
  const totalLines = exportData.csvContent.split('\n').filter(line => line.trim()).length;
  
  // Check if CSV is empty or has no data
  const hasData = exportData.csvContent.trim().length > 0 && totalLines > 0;

  /* ================= DOWNLOAD CSV (SAF IMPLEMENTATION) ================= */

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { fileName, csvContent } = exportData;
      // Ensure filename has .csv extension
      const cleanFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;

      // ANDROID: Storage Access Framework
      if (Platform.OS === "android") {
        const { StorageAccessFramework } = FileSystem;
        
        // Request Permission to pick a folder
        const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          // Create the file in the selected folder
          const uri = await StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            cleanFileName,
            "text/csv" // Mime type
          );

          // Write data to the file
          await FileSystem.writeAsStringAsync(uri, csvContent, {
            encoding: FileSystem.EncodingType.UTF8
          });

          Alert.alert(
            "Success",
            "File saved successfully!",
            [{ text: "OK", onPress: onClose }]
          );
        } else {
          // User cancelled the picker
          // Don't show error, just ignore or show a toast
        }
      } 
      // iOS / FALLBACK
      else {
        const fileUri = FileSystem.documentDirectory + cleanFileName;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
            encoding: FileSystem.EncodingType.UTF8
        });
        
        // On iOS, "Download" usually means "Share/Save to Files"
        // So we trigger the share sheet which allows "Save to Files"
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        } else {
            Alert.alert("Saved", `File saved to app documents: ${cleanFileName}`);
        }
      }

    } catch (error) {
      console.error("Download Error:", error);
      // Fallback offer
      Alert.alert(
        "Save Failed",
        "Could not save directly. Would you like to try Sharing/Sending the file instead?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Yes, Share it", onPress: handleShare }
        ]
      );
    } finally {
      setDownloading(false);
    }
  };

  /* ================= SHARE CSV ================= */

  const handleShare = async () => {
    setSharing(true);
    try {
      const cleanFileName = exportData.fileName.endsWith('.csv') ? exportData.fileName : `${exportData.fileName}.csv`;
      const fileUri = FileSystem.documentDirectory + cleanFileName;

      // Write file locally first
      await FileSystem.writeAsStringAsync(fileUri, exportData.csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Check availability
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing is not available on this device.");
        return;
      }

      // Share
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: `Export ${exportData.title}`,
        UTI: 'public.comma-separated-values-text' // Helps iOS recognize it as CSV
      });

    } catch (error) {
      console.error("Share Error:", error);
      Alert.alert("Error", "Failed to share the file.");
    } finally {
      setSharing(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Export Preview</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#111827" />
            </Pressable>
          </View>

          {/* PREVIEW CONTENT */}
          <ScrollView
            style={styles.previewContainer}
            contentContainerStyle={styles.previewContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.reportContent}>
              <Text style={styles.reportTitle}>{exportData.title}</Text>
              <Text style={styles.reportMeta}>
                File: {exportData.fileName}
              </Text>
              <Text style={styles.reportMeta}>
                Total Lines: {totalLines}
              </Text>

              {/* SUMMARY */}
              {exportData.summary && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Summary</Text>
                  {exportData.summary.dateRange && (
                    <Text style={styles.summaryText}>
                      Date Range: {exportData.summary.dateRange}
                    </Text>
                  )}
                  {exportData.summary.totalTransactions !== undefined && (
                    <Text style={styles.summaryText}>
                      Total Transactions: {exportData.summary.totalTransactions}
                    </Text>
                  )}
                  {exportData.summary.totalAmount !== undefined && (
                    <Text style={styles.summaryText}>
                      Total Amount: ₱{exportData.summary.totalAmount.toLocaleString()}
                    </Text>
                  )}
                  {exportData.summary.categoryBreakdown && exportData.summary.categoryBreakdown.length > 0 && (
                    <View style={styles.categoryBreakdown}>
                      <Text style={styles.categoryTitle}>Category Breakdown:</Text>
                      {exportData.summary.categoryBreakdown.map((item, index) => (
                        <View key={index} style={styles.categoryRow}>
                          <Text style={styles.categoryName}>{item.category}</Text>
                          <Text style={styles.categoryAmount}>
                            ₱{item.amount.toLocaleString()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* CSV PREVIEW */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>CSV Preview (First 10 lines)</Text>
                {hasData ? (
                  <View style={styles.csvPreview}>
                    {previewLines.filter(line => line.trim()).map((line, index) => (
                      <Text key={index} style={styles.csvLine}>
                        {line}
                      </Text>
                    ))}
                    {totalLines > 10 && (
                      <Text style={styles.csvMore}>
                        ... and {totalLines - 10} more lines
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyText}>No transactions found</Text>
                    <Text style={styles.emptySubtext}>
                      There are no transactions in the selected date range to export.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  This file can be opened in Excel, Google Sheets, or any spreadsheet application.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* ACTION BUTTONS */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.downloadButton]}
              onPress={handleDownload}
              disabled={downloading || sharing}
            >
              {downloading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Download</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
              disabled={downloading || sharing}
            >
              {sharing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  previewContainer: {
    flex: 1,
  },
  previewContent: {
    padding: 20,
  },
  reportContent: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  section: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  csvPreview: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  csvLine: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#374151",
    marginBottom: 2,
  },
  csvMore: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#9CA3AF",
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: "#3B82F6",
  },
  shareButton: {
    backgroundColor: "#10B981",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});