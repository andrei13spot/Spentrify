// app/(tabs)/more.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import { API_BASE_URL } from '../../utils/api';
import { THEME } from '../../constants/theme';
import { fonts } from '../../constants/fonts';

/* ================= SETTINGS ITEM ================= */

interface SettingsItemProps {
  label: string;
  sublabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  href?: Href;
  switchValue?: boolean;
  onSwitchChange?: () => void;
  disabled?: boolean;
}

const SettingsItem = ({
  label,
  sublabel,
  icon,
  iconColor = THEME.primary,
  iconBg = THEME.primaryLight,
  href,
  switchValue,
  onSwitchChange,
  disabled = false,
}: SettingsItemProps) => {
  const content = (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View>
          <Text style={styles.rowLabel}>{label}</Text>
          {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
        </View>
      </View>

      {onSwitchChange ? (
        disabled ? (
          <ActivityIndicator size="small" color={THEME.primary} />
        ) : (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#E2E8F0', true: THEME.primary }}
            thumbColor="#FFFFFF"
            disabled={disabled}
          />
        )
      ) : (
        <Ionicons name="chevron-forward" size={18} color={THEME.muted} />
      )}
    </View>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <TouchableOpacity activeOpacity={0.7} style={styles.rowWrapper}>
          {content}
        </TouchableOpacity>
      </Link>
    );
  }

  return <View style={styles.rowWrapper}>{content}</View>;
};

/* ================= SCREEN ================= */

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { clearAllData: clearTransactions } = useData();
  const { clearAll: clearNotifications } = useNotifications();

  const [preferences, setPreferences] = useState({
    cloudSync: false,
    biometrics: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Derived user display details
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const userHandle = user?.email ? user.email.split('@')[0] : 'Spentrify User';

  /* ================= FETCH USER PREFERENCES ================= */

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/auth/me?user_id=${user.id}`);
        const data = await response.json();

        if (data.success && data.data) {
          setPreferences((prev) => ({
            ...prev,
            cloudSync: data.data.is_cloud_sync_enabled || false,
          }));
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchUserPreferences();
    }
  }, [user?.id]);

  /* ================= UPDATE PREFERENCES ================= */

  const togglePreference = async (key: 'cloudSync' | 'biometrics') => {
    if (key === 'biometrics') {
      setPreferences((prev) => ({
        ...prev,
        biometrics: !prev.biometrics,
      }));
      return;
    }

    if (!user?.id) return;

    const nextState = !preferences.cloudSync;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/preferences?user_id=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_cloud_sync_enabled: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setPreferences((prev) => ({ ...prev, cloudSync: nextState }));
      }
    } catch (error) {
      console.error('Error saving preference:', error);
      Alert.alert('Error', 'Could not save preference setting.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Spentrify?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          clearNotifications();
          clearTransactions();
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Account & Settings</Text>
          <Text style={styles.subtitle}>Preferences & data security</Text>
        </View>

        {/* PROFILE HERO CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
          <View style={styles.profileDetails}>
            <View style={styles.profileTopRow}>
              <Text style={styles.userName} numberOfLines={1}>{userHandle}</Text>
              <View style={styles.badgePill}>
                <Ionicons name="checkmark-circle" size={13} color={THEME.primary} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || 'No email registered'}
            </Text>
          </View>
        </View>

        {/* ACCOUNT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT & SECURITY</Text>
          <View style={styles.card}>
            <SettingsItem
              label="Edit Profile"
              sublabel="Name, email, and personal info"
              icon="person-outline"
              iconColor={THEME.primary}
              iconBg={THEME.primaryLight}
              href="/editprofile"
            />
            <View style={styles.divider} />
            <SettingsItem
              label="Security & Authentication"
              sublabel="Password change, session logs"
              icon="shield-checkmark-outline"
              iconColor={THEME.success}
              iconBg={THEME.successLight}
              href="/security"
            />
          </View>
        </View>

        {/* EXPORTS & FINANCIAL TOOLS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TAX & EXPORTS</Text>
          <View style={styles.card}>
            <SettingsItem
              label="ITR & Reimbursement Reports"
              sublabel="Tax deductions & expense claims"
              icon="document-text-outline"
              iconColor="#8B5CF6"
              iconBg="#F5F3FF"
              href="/exports"
            />
          </View>
        </View>

        {/* APP PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.card}>
            <SettingsItem
              label="Cloud Sync"
              sublabel="Real-time multi-device backup"
              icon="cloud-outline"
              iconColor={THEME.primary}
              iconBg={THEME.primaryLight}
              switchValue={preferences.cloudSync}
              onSwitchChange={() => togglePreference('cloudSync')}
              disabled={saving || loading}
            />
            <View style={styles.divider} />
            <SettingsItem
              label="Biometric Lock"
              sublabel="Require fingerprint or Face ID"
              icon="finger-print-outline"
              iconColor={THEME.warning}
              iconBg={THEME.warningLight}
              switchValue={preferences.biometrics}
              onSwitchChange={() => togglePreference('biometrics')}
            />
          </View>
        </View>

        {/* LOGOUT */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={THEME.danger} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Spentrify v1.2.0 • Build 2026.11</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110, // Clearance for floating tab bar
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginTop: 2,
  },

  /* Profile Hero Card */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 16,
    fontFamily: fonts.heading,
    color: THEME.text,
    flex: 1,
    marginRight: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: THEME.primary,
    marginLeft: 3,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginTop: 2,
  },

  /* Sections & Cards */
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: THEME.muted,
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.borderLight,
    ...THEME.shadows.sm,
  },
  rowWrapper: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: THEME.text,
  },
  rowSublabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: THEME.sub,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.borderLight,
    marginLeft: 66,
  },

  /* Logout Button */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.dangerLight,
    borderRadius: THEME.radius.lg,
    paddingVertical: 14,
  },
  logoutText: {
    color: THEME.danger,
    fontSize: 15,
    fontFamily: fonts.heading,
  },
  versionText: {
    textAlign: 'center',
    color: THEME.muted,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 8,
  },
});
