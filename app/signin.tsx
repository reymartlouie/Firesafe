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
import { StatusBar } from 'expo-status-bar';
import * as Network from 'expo-network';
import authService from '../services/authService';
import pushNotificationService from '../services/pushNotificationService';
import CustomModalAlert from './CustomModalAlert';

export default function SignInScreen() {
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
      // Check if there's internet connection
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        showModal('Connection Error', 'You are offline. Please check your internet connection.');
        setIsLoading(false);
        return;
      }

      // Login user
      await authService.login(username, password);
      
      // Register for push notifications after successful login
      const expoPushToken = await pushNotificationService.registerForPushNotifications();
      
      if (expoPushToken) {
        // Save the push token to database
        await pushNotificationService.savePushToken(expoPushToken);
        console.log('Push notifications registered:', expoPushToken);
      } else {
        console.log('Push notifications not available or permission denied');
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
      <StatusBar style="dark" />

      {/* Custom Modal Alert */}
      <CustomModalAlert
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.flameLogo}>
              <Text style={styles.flameEmoji}>🔥</Text>
            </View>
            <Text style={styles.appName}>FireSafe</Text>
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Access your FireSafe account.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
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
              <Text style={styles.forgotText}>Forgot Password?</Text>
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
              <Text style={styles.signUpText}>Don't have an account? </Text>
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  flameLogo: {
    width: 80,
    height: 80,
    backgroundColor: '#FFE0E0',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  flameEmoji: { fontSize: 48 },
  appName: { fontSize: 42, fontWeight: '700', color: '#2C2C2C' },
  welcomeContainer: { alignItems: 'center', marginBottom: 40 },
  welcomeTitle: { fontSize: 28, fontWeight: '600', color: '#2C2C2C', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 15, color: '#757575' },
  formContainer: { width: '100%' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#2C2C2C',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  forgotContainer: { alignSelf: 'flex-start', marginBottom: 24 },
  forgotText: { fontSize: 14, color: '#B0B0B0' },
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
  signUpText: { fontSize: 14, color: '#757575' },
  signUpLink: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
});