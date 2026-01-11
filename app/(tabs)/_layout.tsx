import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React, { useEffect } from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";

/* BIG CENTER ADD BUTTON */
function BigAddButton({
  onPress,
}: {
  onPress?: (e: GestureResponderEvent) => void;
}) {
  return (
    <View style={styles.addSlot}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.addButton}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  /* 🔐 AUTH GUARD */
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated]);

  // ⛔ Prevent flash of tabs before redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#3B82F6",
          tabBarInactiveTintColor: "#9AA4B2",
          tabBarStyle: {
            height: 74 + insets.bottom,
            paddingBottom: 10 + insets.bottom,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: "#E6EAF2",
            backgroundColor: "#FFFFFF",
          },
          tabBarLabelStyle: {
            fontSize: 11,
            marginTop: 2,
          },
        }}
      >
        {/* HOME */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* INSIGHTS */}
        <Tabs.Screen
          name="insights"
          options={{
            title: "Insights",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "time" : "time-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* ADD */}
        <Tabs.Screen
          name="add"
          options={{
            title: "",
            tabBarButton: () => (
              <BigAddButton onPress={() => router.push("/(tabs)/add")} />
            ),
          }}
        />

        {/* GOALS */}
        <Tabs.Screen
          name="goals"
          options={{
            title: "Goals",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "radio-button-on" : "radio-button-off"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        {/* MORE */}
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="ellipsis-horizontal"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  addSlot: {
    width: 74,
    alignItems: "center",
    position: "relative",
  },

  addButton: {
    position: "absolute",
    top: -18,
    left: "55%",
    transform: [{ translateX: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#3B82F6",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
