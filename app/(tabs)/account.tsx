import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import authService from '../../services/authService';
import pushNotificationService from '../../services/pushNotificationService';
import CustomModalAlert from '../../app/CustomModalAlert';

export default function AccountScreen() {
  const [user, setUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getUser();
      if (!userData) throw new Error('No user data found');
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      setModalMessage('Session expired. Please log in again.');
      setModalVisible(true);
    }
  };

  const handleLogout = async () => {
    try {
      const storedToken = await pushNotificationService.getStoredPushToken();
      if (storedToken) {
        await pushNotificationService.removePushToken(storedToken);
      }

      await authService.logout();
      setModalMessage('You have been logged out successfully.');
      setModalVisible(true);

      setTimeout(() => router.replace('/'), 1200);
    } catch (error) {
      console.error('Logout failed:', error);
      setModalMessage('Logout failed. Please try again.');
      setModalVisible(true);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomModalAlert
        visible={modalVisible}
        title="Notice"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Account</Text>
          <Text style={styles.headerSubtitle}>Your profile & settings</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSquircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user?.username || 'User'}</Text>
            <Text style={styles.contact}>{user?.contact_number || '—'}</Text>
          </View>
        </View>

        {/* Settings Card */}
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsLabelGroup}>
              <Text style={styles.settingsLabel}>Dark Mode</Text>
              <Text style={styles.settingsHint}>Coming soon</Text>
            </View>
            <View style={styles.darkModeSquircle}>
              <Ionicons name="moon" size={20} color="#6B7280" />
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header — same layout as node/[id].tsx
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '400',
  },
  backButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 140,
    gap: 16,
  },

  // Profile card
  profileCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarSquircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  contact: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '400',
  },

  // Settings card
  settingsCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsLabelGroup: {
    gap: 2,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  settingsHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  darkModeSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logout
  logoutButton: {
    backgroundColor: '#7F1D1D',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
