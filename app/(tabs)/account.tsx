import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      // Remove push token from database before signing out
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
      {/* Modal Alert */}
      <CustomModalAlert
        visible={modalVisible}
        title="Notice"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#000000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileEmoji}>👤</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.username}>{user?.username || 'User'}</Text>
        <Text style={styles.contact}>{user?.contact_number || 'contact_number'}</Text>
      </View>

      {/* Logout Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 120,
    paddingBottom: 40,
  },
  profileImageContainer: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 140,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  username: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  contact: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoutButton: {
    backgroundColor: '#7F1D1D',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    minWidth: 160,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
