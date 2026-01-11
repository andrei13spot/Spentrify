import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  FlatList,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationsScreen() {
  const { notifications, removeNotification, clearAll } = useNotifications();
  const insets = useSafeAreaInsets();

  const handleRemove = (id: string) => {
    LayoutAnimation.easeInEaseOut();
    removeNotification(id);
  };

  const handleClearAll = () => {
    LayoutAnimation.spring();
    clearAll();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notifications</Text>

          <TouchableOpacity onPress={() => router.push("/(tabs)/more")}>
            <Ionicons name="settings-outline" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 120, // 👈 room for bottom action
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleRemove(item.id)}
              style={styles.card}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>

              <Ionicons
                name="close-circle"
                size={22}
                color="#3B82F6"
                style={{ marginLeft: 10 }}
              />
            </TouchableOpacity>
          )}
        />

        {/* 🔽 CLEAR ALL — SAFE FROM NAV BAR */}
        {notifications.length > 0 && (
          <View
            style={[
              styles.clearAllBottom,
              { paddingBottom: insets.bottom + 12 },
            ]}
          >
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllText}>
                Clear all notifications
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ======================= STYLES ======================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: "GoogleSans-Bold",
    color: "#111827",
  },

  clearAllBottom: {
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },

  clearAllText: {
    color: "#3B82F6",
    fontSize: 13,
    fontFamily: "GoogleSans-Regular",
  },

  card: {
    backgroundColor: "#E6F0FF",
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 14,
    fontFamily: "GoogleSans-Bold",
    color: "#111827",
  },

  cardMessage: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "GoogleSans-Regular",
    color: "#374151",
  },

  cardDate: {
    fontSize: 11,
    marginTop: 6,
    fontFamily: "GoogleSans-Regular",
    color: "#6B7280",
  },
});
