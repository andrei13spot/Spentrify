import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router"; 
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
import axios from "axios"; 
import { useAuth } from "../context/AuthContext";

// 👇 1. UPDATE TYPE DEFINITION TO MATCH DATABASE
type NotificationItem = {
  notification_id: number; // Changed from 'id' to 'notification_id'
  title: string;
  message: string;
  created_at: string;      // Changed from 'date' to 'created_at'
  is_read: number;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); 
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user || !user.id) {
        setLoading(false); 
        return;
    }

    try {
      const response = await axios.get(`http://10.0.2.2:3000/api/notifications?user_id=${user.id}`);
      
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false); 
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]) 
  );

  // 3. DELETE SINGLE NOTIFICATION (Updated ID usage)
  const handleRemove = async (id: number) => {
    if (!user?.id) return;

    LayoutAnimation.easeInEaseOut();
    // 👇 Update filter to use notification_id
    setNotifications(prev => prev.filter(item => item.notification_id !== id));

    try {
      await axios.delete(`http://10.0.2.2:3000/api/notifications/${id}?user_id=${user.id}`);
    } catch (error) {
      console.error("Delete error:", error);
      fetchNotifications(); 
    }
  };

  // 4. CLEAR ALL NOTIFICATIONS
  const handleClearAll = async () => {
    if (!user?.id) return;

    LayoutAnimation.spring();
    setNotifications([]);

    try {
      await axios.delete(`http://10.0.2.2:3000/api/notifications?user_id=${user.id}`);
    } catch (error) {
      console.error("Clear all error:", error);
      fetchNotifications(); 
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                // 👇 FIX: Use notification_id here!
                keyExtractor={(item) => item.notification_id.toString()}
                contentContainerStyle={{
                  paddingTop: 8,
                  paddingBottom: 120, 
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    // 👇 FIX: Pass notification_id
                    onPress={() => handleRemove(item.notification_id)}
                    style={styles.card}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardMessage}>{item.message}</Text>
                      {/* 👇 FIX: Use created_at */}
                      <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
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