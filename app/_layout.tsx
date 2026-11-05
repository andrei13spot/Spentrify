import { useFonts } from "expo-font";
import * as KeepAwake from "expo-keep-awake";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View, PermissionsAndroid } from "react-native";

// Keep the splash screen visible while fonts and initial resources load
SplashScreen.preventAutoHideAsync().catch(() => {});

import { AuthProvider } from "../context/AuthContext";
import { DataProvider } from "../context/DataContext";
import { NotificationProvider } from "../context/NotificationContext";



// Added this for SMS Listening
import TransactionListener from "../components/TransactionListener";

export default function RootLayout() {
  const requestSmsPermission = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          {
            title: "Spentrify SMS Permission",
            message: "Spentrify needs access to your SMS to detect financial transactions automatically.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("SMS Permission Granted");
        } else {
          console.log("SMS Permission Denied");
          // Alert.alert("Permission Required", "SMS detection features will not work without permission.");
        }
      } catch (err) {
        console.warn(err);
      }
    };
  
  useEffect(() => {
    requestSmsPermission();
    KeepAwake.deactivateKeepAwake();
  }, []);

  const [fontsLoaded] = useFonts({
    GoogleSansBold: require("../assets/images/fonts/Google_Sans-Bold.ttf"),
    GoogleSansRegular: require("../assets/images/fonts/Google_Sans-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
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
                presentation: "transparentModal", 
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