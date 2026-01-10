import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function GenerateReportScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Generate Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Report Generator</Text>
          <Text style={styles.cardSub}>
            Describe what kind of financial report you want to generate.
          </Text>

          <TextInput
            multiline
            placeholder="Example: Generate a reimbursement summary for this transaction including budget usage and remaining balance."
            style={styles.input}
          />

          <Pressable style={styles.generateBtn}>
            <Text style={styles.generateText}>Generate report</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.backHome}
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Text style={styles.backHomeText}>Return to Home</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  content: {
    padding: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 30,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },

  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    textAlignVertical: "top",
    marginBottom: 16,
  },

  generateBtn: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  generateText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  backHome: {
    alignItems: "center",
  },
  backHomeText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 14,
  },
});
