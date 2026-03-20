import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Network from 'expo-network';
import authService from '../services/authService';
import pushNotificationService from '../services/pushNotificationService';
import CustomModalAlert from './CustomModalAlert';
import { useTheme } from '../contexts/ThemeContext';

const light = {
  bg: '#F5F5F5',
  card: '#FFFFFF',
  border: '#E0E0E0',
  textPrimary: '#2C2C2C',
  textSecondary: '#757575',
  placeholder: '#999999',
  chipBg: '#EFEFEF',
};

const dark = {
  bg: '#191919',
  card: '#202020',
  border: '#2A2A2A',
  textPrimary: '#E6E6E5',
  textSecondary: '#9B9A97',
  placeholder: '#6B6B6B',
  chipBg: '#262626',
};

export default function SignInScreen() {
  const { isDark, toggleTheme } = useTheme();
  const c = isDark ? dark : light;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const showModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleSignIn = async () => {
    if (!username || !password) {
      showModal('Error', 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        showModal('Connection Error', 'You are offline. Please check your internet connection.');
        setIsLoading(false);
        return;
      }

      await authService.login(username, password);

      try {
        const expoPushToken = await pushNotificationService.registerForPushNotifications();
        if (expoPushToken) {
          await pushNotificationService.savePushToken(expoPushToken);
        }
      } catch (pushError: any) {
        console.warn('Push token registration failed (non-critical):', pushError?.message || pushError);
      }

      showModal('Success', `Welcome back, ${username}!`);
      setTimeout(() => {
        setModalVisible(false);
        router.replace('/(tabs)/dashboard');
      }, 1500);
    } catch (error: any) {
      showModal('Login Failed', error.message || 'Invalid login credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CustomModalAlert
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: c.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Dark mode toggle — top right */}
        <TouchableOpacity
          style={[styles.themeToggle, { backgroundColor: c.chipBg }]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={18}
            color={c.textSecondary}
          />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={[styles.flameLogo, { backgroundColor: isDark ? '#2F2F2F' : '#FFE0E0' }]}>
              <Text style={styles.flameEmoji}>🔥</Text>
            </View>
            <Text style={[styles.appName, { color: c.textPrimary }]}>FireSafe</Text>
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={[styles.welcomeTitle, { color: c.textPrimary }]}>Welcome Back!</Text>
            <Text style={[styles.welcomeSubtitle, { color: c.textSecondary }]}>
              Access your FireSafe account.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
              placeholder="Username"
              placeholderTextColor={c.placeholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
              placeholder="Password"
              placeholderTextColor={c.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={() => showModal('Coming Soon', 'Password reset feature coming soon.')}
            >
              <Text style={[styles.forgotText, { color: c.textSecondary }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signUpContainer}>
              <Text style={[styles.signUpText, { color: c.textSecondary }]}>Don't have an account? </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.signUpLink}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  flameLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  flameEmoji: { fontSize: 48 },
  appName: { fontSize: 42, fontWeight: '700' },
  welcomeContainer: { alignItems: 'center', marginBottom: 40 },
  welcomeTitle: { fontSize: 28, fontWeight: '600', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 15 },
  formContainer: { width: '100%' },
  input: {
    borderRadius: 30,
    padding: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  forgotContainer: { alignSelf: 'flex-start', marginBottom: 24 },
  forgotText: { fontSize: 14 },
  signInButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  signInButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: { fontSize: 14 },
  signUpLink: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
});
