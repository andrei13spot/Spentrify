import { useFonts } from "expo-font";
import * as KeepAwake from "expo-keep-awake";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuthProvider } from "../context/AuthContext";
import { DataProvider } from "../context/DataContext";
import { NotificationProvider } from "../context/NotificationContext";

// Added this for SMS Listening
import TransactionListener from "../components/TransactionListener";

export default function RootLayout() {

  useEffect(() => {
    KeepAwake.deactivateKeepAwake();
  }, []);

  const [fontsLoaded] = useFonts({
    GoogleSansBold: require("../assets/images/fonts/Google_Sans-Bold.ttf"),
    GoogleSansRegular: require("../assets/images/fonts/Google_Sans-Regular.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <DataProvider>

          <TransactionListener />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            
            {/* Special handling para sa Pop-up UI */}
            <Stack.Screen 
              name="pop-up" 
              options={{
                presentation: "transparentModal", // Ito ang magic para maging overlay
                animation: "fade",
                headerShown: false,
              }} 
            />
          </Stack>

        </DataProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}