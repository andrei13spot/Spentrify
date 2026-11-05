// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs, router } from "expo-router";
import React, { useEffect } from "react";
import {
  GestureResponderEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { THEME } from "../../constants/theme";
import { fonts } from "../../constants/fonts";

/* FLOATING CENTER ADD BUTTON */
function BigAddButton({
  onPress,
}: {
  onPress?: (e: GestureResponderEvent) => void;
}) {
  const handlePress = (e: GestureResponderEvent) => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    onPress?.(e);
  };

  return (
    <View style={styles.addSlot}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.addButton}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  /* AUTH GUARD */
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const bottomPosition = Math.max(12, insets.bottom);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: THEME.primary,
          tabBarInactiveTintColor: "#94A3B8",
          tabBarStyle: {
            position: "absolute",
            bottom: bottomPosition,
            left: 16,
            right: 16,
            height: 64,
            borderRadius: 32,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: "rgba(226, 232, 240, 0.85)",
            paddingBottom: 8,
            paddingTop: 8,
            ...THEME.shadows.float,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontFamily: fonts.body,
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
                size={size - 2}
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
                name={focused ? "pie-chart" : "pie-chart-outline"}
                size={size - 2}
                color={color}
              />
            ),
          }}
        />

        {/* ADD ACTION */}
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
                name={focused ? "flag" : "flag-outline"}
                size={size - 2}
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
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "ellipsis-horizontal-circle" : "ellipsis-horizontal-circle-outline"}
                size={size - 2}
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
    backgroundColor: THEME.canvas,
  },

  addSlot: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  addButton: {
    position: "absolute",
    top: -20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    ...THEME.shadows.glow,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
});
