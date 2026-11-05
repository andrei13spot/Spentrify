import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Account info (read-only)
  const [dateJoined, setDateJoined] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Fetch user data from backend
  useEffect(() => {
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to view your profile.");
      router.back();
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/auth/me?user_id=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user data');
        }

        if (data.success && data.data) {
          const userData = data.data;
          setName(userData.full_name || '');
          setEmail(userData.email || '');
          setPhone(userData.phone || '');
          setIsEmailVerified(Boolean(userData.is_email_verified) || Boolean(userData.phone));
          
          // Format date joined
          if (userData.created_at) {
            const date = new Date(userData.created_at);
            setDateJoined(date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to load profile data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to update your profile.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/profile?user_id=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: name.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      Alert.alert("Profile Updated", "Your changes have been saved successfully.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Format account status
  const accountStatus = isEmailVerified ? 'Verified' : 'Unverified';
  const statusColor = isEmailVerified ? '#16a34a' : '#f59e0b';
  const statusBgColor = isEmailVerified ? '#dcfce7' : '#fef3c7';
  const statusIcon = isEmailVerified ? 'checkmark-circle' : 'time-outline';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

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
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
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
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              editable={!saving}
            />
          </View>
          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
              style={[styles.input, styles.readOnlyInput]} 
              value={email} 
              editable={false}
            />
            <Text style={styles.readOnlyHint}>Email cannot be changed</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput 
              style={styles.input} 
              value={phone} 
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              editable={!saving}
            />
          </View>

        </View>

        <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
        <View style={styles.card}>
          <View style={styles.readOnlyRow}>
            <View>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.readOnlyValue}>{dateJoined || 'N/A'}</Text>
            </View>
            <Ionicons name="calendar-outline" size={16} color="#ccc" />
          </View>
          <View style={styles.divider} />

          <View style={styles.readOnlyRow}>
            <View>
              <Text style={styles.label}>Account Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                <Ionicons name={statusIcon} size={14} color={statusColor} style={{marginRight: 4}} />
                <Text style={[styles.statusText, { color: statusColor }]}>{accountStatus}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.helperText}>
          Account Status cannot be changed. Contact support for assistance.
        </Text>

        <View style={{height: 40}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7', paddingTop: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f7' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
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
  readOnlyInput: { color: '#8e8e93' },
  readOnlyHint: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f2f2f7', marginLeft: 0 },
  readOnlyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  readOnlyValue: { fontSize: 16, color: '#8e8e93', fontWeight: '500' }, 
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },
  helperText: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 20, paddingHorizontal: 10, lineHeight: 18 },
});