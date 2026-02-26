import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import authService from '../../services/authService';
import pushNotificationService from '../../services/pushNotificationService';
import CustomModalAlert from '../../app/CustomModalAlert';
import { useAvatar } from '../../contexts/AvatarContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function AccountScreen() {
  const { isDark, toggleTheme } = useTheme();
  const { setAvatarUrl } = useAvatar();
  const c = isDark ? dark : light;

  const [user, setUser] = useState<any>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
      if (userData.avatar_url) {
        setAvatarUri(userData.avatar_url);
        setAvatarUrl(userData.avatar_url);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setModalMessage('Session expired. Please log in again.');
      setModalVisible(true);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setModalMessage('Photo library access is required to change your profile picture.');
      setModalVisible(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setUploading(true);
    try {
      const url = await authService.updateAvatar(user.id, uri);
      setAvatarUri(url);
      setAvatarUrl(url);
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      setModalMessage(error?.message ?? 'Failed to upload profile picture. Please try again.');
      setModalVisible(true);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    // Best-effort token removal — always proceed to logout regardless of outcome
    try {
      const storedToken = await pushNotificationService.getStoredPushToken();
      if (storedToken) {
        const removed = await pushNotificationService.removePushToken(storedToken);
        if (!removed) {
          console.warn('Push token removal from DB failed — proceeding with logout anyway');
        }
      }
    } catch (error) {
      console.error('Unexpected error during push token cleanup:', error);
    }

    try {
      await authService.logout();
      setAvatarUrl(null);
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
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.textPrimary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <CustomModalAlert
        visible={modalVisible}
        title="Notice"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.bg }]}>
        <View>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Account</Text>
          <Text style={[styles.headerSubtitle, { color: c.textSecondary }]}>Your profile & settings</Text>
        </View>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: c.chip }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={c.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card — avatar + username */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: c.chip }]}>
              <Ionicons name="person" size={40} color={c.textSecondary} />
            </View>
          )}
          <Text style={[styles.username, { color: c.textPrimary }]}>{user?.username || 'User'}</Text>
          <TouchableOpacity
            style={[styles.changePhotoButton, { backgroundColor: c.chip }]}
            onPress={handlePickAvatar}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size={14} color={c.textSecondary} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={14} color={c.textSecondary} />
                <Text style={[styles.changePhotoText, { color: c.textSecondary }]}>Change Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Contact Card */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: c.chip }]}>
              <Ionicons name="call-outline" size={18} color={c.textSecondary} />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Contact Number</Text>
              <Text style={[styles.infoValue, { color: c.textPrimary }]}>{user?.contact_number || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Settings Card */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsLabelGroup}>
              <View style={[styles.iconBox, { backgroundColor: c.chip }]}>
                <Ionicons name="moon-outline" size={18} color={c.textSecondary} />
              </View>
              <Text style={[styles.settingsLabel, { color: c.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: '#374151' }}
              thumbColor={isDark ? '#F9FAFB' : '#FFFFFF'}
            />
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

const light = {
  bg: '#FFFFFF',
  card: '#F3F4F6',
  border: '#E5E7EB',
  chip: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
};

const dark = {
  bg: '#191919',
  card: '#202020',
  border: '#2A2A2A',
  chip: '#262626',
  textPrimary: '#E6E6E5',
  textSecondary: '#9B9A97',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
  backButton: {
    padding: 10,
    borderRadius: 999,
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

  // Shared card
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },

  // Profile card
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 30,
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Contact card
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    alignSelf: 'stretch',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Settings card
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  settingsLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
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
