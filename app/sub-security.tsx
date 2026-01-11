import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { updatePassword } from './auth-store';

export default function SubSecurityScreen() {

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const handleUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    
    const success = updatePassword(currentPassword, newPassword);
    if (success) {
      Alert.alert("Success", "Password updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <TouchableOpacity onPress={handleUpdate}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.helperText}>
          Create a strong password to keep your savings secure.
        </Text>

        <View style={styles.card}>
          
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput 
              style={styles.input} 
              // This controls the dots 
              secureTextEntry={!showPassword} 
              value={currentPassword} 
              onChangeText={setCurrentPassword} 
              placeholder="Enter current password"
              placeholderTextColor="#ccc"
            />
          </View>
          <View style={styles.divider} />

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput 
              style={styles.input} 
              secureTextEntry={!showPassword}
              value={newPassword} 
              onChangeText={setNewPassword} 
              placeholder="Enter new password"
              placeholderTextColor="#ccc"
            />
          </View>
          <View style={styles.divider} />

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput 
              style={styles.input} 
              secureTextEntry={!showPassword}
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              placeholder="Re-enter new password"
              placeholderTextColor="#ccc"
            />
          </View>

        </View>

        {/* The Toggle Button */}
        <TouchableOpacity 
          style={styles.toggleRow} 
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color="#666" 
          />
          <Text style={styles.toggleText}>
            {showPassword ? "Hide Passwords" : "Show Passwords"}
          </Text>
        </TouchableOpacity>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  backButton: { padding: 5, borderRadius: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  saveText: { fontSize: 17, fontWeight: '600', color: '#007AFF' },
  scrollContent: { paddingHorizontal: 20 },
  helperText: { fontSize: 13, color: '#666', marginBottom: 20, marginTop: 10, lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, overflow: 'hidden' },
  inputContainer: { paddingVertical: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#8e8e93', marginBottom: 8, textTransform: 'uppercase' },
  input: { fontSize: 16, color: '#000', padding: 0 },
  divider: { height: 1, backgroundColor: '#f2f2f7' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  toggleText: { marginLeft: 8, color: '#666', fontSize: 14, fontWeight: '500' },
});