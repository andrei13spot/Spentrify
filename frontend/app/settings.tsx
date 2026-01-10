import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: "#3B82F6" }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 22, fontWeight: "600", marginTop: 20 }}>
        Settings
      </Text>
    </View>
  );
}
