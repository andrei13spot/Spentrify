// utils/api.ts
import { Platform } from "react-native";
import axios from "axios";

/**
 * Resolves the API Base URL dynamically.
 * Prioritizes EXPO_PUBLIC_API_URL if defined,
 * falls back to 10.0.2.2 on Android native emulator,
 * and localhost on iOS and Web.
 */
export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Configured Axios instance with standard timeouts and headers.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;

