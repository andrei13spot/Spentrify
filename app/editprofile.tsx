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
import { authStore, updateUser } from './auth-store';

export default function EditProfileScreen() {

  const [name, setName] = useState(authStore.name);
  const [email, setEmail] = useState(authStore.email);
  const [phone, setPhone] = useState(authStore.phone);

  const userId = authStore.userId;
  const dateJoined = authStore.joined;
  const accountStatus = authStore.status;

  const handleSave = () => {
  
    updateUser({ name, email, phone });

    Alert.alert("Profile Updated", "Your changes have been saved successfully.", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
        <View style={styles.card}>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
            />
          </View>
          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address"
            />
          </View>
          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad"
            />
          </View>

        </View>

        <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
        <View style={styles.card}>
          <View style={styles.readOnlyRow}>
            <View>
              <Text style={styles.label}>User ID</Text>
              <Text style={styles.readOnlyValue}>{userId}</Text>
            </View>
            <Ionicons name="lock-closed-outline" size={16} color="#ccc" />
          </View>
          <View style={styles.divider} />

          <View style={styles.readOnlyRow}>
            <View>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.readOnlyValue}>{dateJoined}</Text>
            </View>
            <Ionicons name="calendar-outline" size={16} color="#ccc" />
          </View>
          <View style={styles.divider} />

          <View style={styles.readOnlyRow}>
            <View>
              <Text style={styles.label}>Account Status</Text>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{marginRight: 4}} />
                <Text style={styles.statusText}>{accountStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.helperText}>
          User ID and Account Status cannot be changed. Contact support for assistance.
        </Text>

        <View style={{height: 40}} />
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
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 24, marginLeft: 10, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, overflow: 'hidden' },
  inputContainer: { paddingVertical: 12 },
  label: { fontSize: 12, fontWeight: '500', color: '#8e8e93', marginBottom: 4 },
  input: { fontSize: 16, color: '#000', fontWeight: '400' },
  divider: { height: 1, backgroundColor: '#f2f2f7', marginLeft: 0 },
  readOnlyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  readOnlyValue: { fontSize: 16, color: '#8e8e93', fontWeight: '500' }, 
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  statusText: { color: '#16a34a', fontSize: 13, fontWeight: '700' },
  helperText: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20, paddingHorizontal: 10, lineHeight: 18 },
});