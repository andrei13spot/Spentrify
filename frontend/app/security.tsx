import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { deleteAccount } from './auth-store';

export default function SecurityScreen() {

  const handleDelete = () => {
    Alert.alert("Delete Account", "This action cannot be undone. All your data will be lost.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteAccount }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* DASHBOARD STATUS */}
      <View style={styles.statusCard}>
        <Ionicons name="shield-checkmark" size={48} color="#16a34a" />
        <Text style={styles.statusTitle}>Account is Secure</Text>
        <Text style={styles.statusSubtitle}>No security issues found.</Text>
      </View>

      {/* SECTION 1: CREDENTIALS */}
      <Text style={styles.sectionHeader}>LOGIN & RECOVERY</Text>
      <View style={styles.section}>
  
        <Link href={"/sub-security" as any} asChild>
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="key-outline" size={20} color="#0284c7" />
              </View>
              <Text style={styles.rowLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* SECTION 2: DANGER ZONE */}
      <Text style={styles.sectionHeader}>DATA MANAGEMENT</Text>
      <View style={styles.section}>
        
        {/* Delete Account */}
        <TouchableOpacity style={styles.row} onPress={handleDelete}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            </View>
            <Text style={[styles.rowLabel, { color: '#dc2626' }]}>Delete Account</Text>
          </View>
        </TouchableOpacity>

      </View>

      <Text style={styles.infoText}>
        Deleting your account is permanent. Your goals and profile data cannot be recovered.
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 10,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginLeft: 10,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  infoText: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 40,
    paddingHorizontal: 10,
    lineHeight: 18,
  }
});