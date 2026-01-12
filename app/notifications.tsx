import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router"; // Added useFocusEffect
import { useCallback, useState } from "react";
import {
  FlatList,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import axios from "axios"; // Import Axios

// Define Type for Notification
type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  is_read: number;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  
  // Local State para sa Data galing Backend
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH DATA FROM BACKEND
  const fetchNotifications = async () => {
    try {
      // setLoading(true); // Optional: Pwede tanggalin kung ayaw mo nagbi-blink
      const response = await axios.get("http://10.0.2.2:3000/api/notifications?user_id=1");
      
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. AUTO-REFRESH (Tuwing bubuksan ang page)
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  // 3. DELETE SINGLE NOTIFICATION
  const handleRemove = async (id: string) => {
    LayoutAnimation.easeInEaseOut();
    
    // Update UI immediately (Optimistic Update)
    setNotifications(prev => prev.filter(item => item.id !== id));

    try {
      await axios.delete(`http://10.0.2.2:3000/api/notifications/${id}?user_id=1`);
    } catch (error) {
      console.error("Delete error:", error);
      fetchNotifications(); // Revert if failed
    }
  };

  // 4. CLEAR ALL NOTIFICATIONS
  const handleClearAll = async () => {
    LayoutAnimation.spring();
    
    // Clear UI immediately
    setNotifications([]);

    try {
      await axios.delete("http://10.0.2.2:3000/api/notifications?user_id=1");
    } catch (error) {
      console.error("Clear all error:", error);
      fetchNotifications(); // Revert if failed
    }
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

        {/* LOADING STATE */}
        {loading ? (
           <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ActivityIndicator size="large" color="#3B82F6" />
           </View>
        ) : (
          <>
            {/* EMPTY STATE */}
            {notifications.length === 0 ? (
               <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -50}}>
                  <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
                  <Text style={{color: "#9CA3AF", marginTop: 10, fontFamily: "GoogleSans-Regular"}}>No notifications yet</Text>
               </View>
            ) : (
              // LIST
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{
                  paddingTop: 8,
                  paddingBottom: 120, 
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
            )}
          </>
        )}

        {/* 🔽 CLEAR ALL */}
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
    fontFamily: "GoogleSans-Bold", // Make sure you have this font loaded, or use fontWeight: 'bold'
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