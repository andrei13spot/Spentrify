import { router } from 'expo-router';
import { Alert } from 'react-native';

export const authStore = {
  email: "user@example.com", 
  name: "John Doe",
  phone: "+63 912 345 6789",
  userId: "882190-USR",
  joined: "January 10, 2025",
  status: "Verified"
};

export const updateUser = (updates: Partial<typeof authStore>) => {
  Object.assign(authStore, updates);
  console.log("User updated:", authStore); 
};


export const logout = () => {
  console.log("User logged out");
  router.replace("/"); 
};

export const deleteAccount = () => {
  Alert.alert("Account Deleted", "Your account has been permanently removed.");
  router.replace("/"); 
};

export const updatePassword = (current: string, newPass: string) => {
  console.log(`Password updated`);
  return true; 
};