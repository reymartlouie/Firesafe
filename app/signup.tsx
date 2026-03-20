import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomModalAlert from './CustomModalAlert';
import authService from '../services/authService';
import pushNotificationService from '../services/pushNotificationService';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';

const light = {
  bg: '#F5F5F5',
  card: '#FFFFFF',
  border: '#E0E0E0',
  textPrimary: '#272727',
  textSecondary: '#757575',
  placeholder: '#999999',
  chipBg: 'rgba(255,255,255,0.6)',
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

export default function SignUpScreen() {
  const { isDark } = useTheme();
  const c = isDark ? dark : light;

  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const handleSignup = async () => {
    if (!username || !contactNumber || !password || !confirmPassword) {
      setModalMessage('Please fill in all fields.');
      setModalVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setModalMessage('Passwords do not match.');
      setModalVisible(true);
      return;
    }

    if (password.length < 8) {
      setModalMessage('Password must be at least 8 characters long.');
      setModalVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        setModalMessage('Username is already taken.');
        setModalVisible(true);
        setIsLoading(false);
        return;
      }

      await authService.signup(username, contactNumber, password);

      try {
        const expoPushToken = await pushNotificationService.registerForPushNotifications();
        if (expoPushToken) {
          await pushNotificationService.savePushToken(expoPushToken);
        }
      } catch (pushError: any) {
        console.warn('Push token registration failed (non-critical):', pushError?.message || pushError);
      }

      setModalMessage('Account successfully registered!');
      setModalVisible(true);

      setTimeout(() => {
        setModalVisible(false);
        router.replace('/signin');
      }, 2000);

    } catch (error: any) {
      let errorMessage = error.message || 'Signup failed. Please try again.';

      if (
        errorMessage.includes('duplicate key value') &&
        errorMessage.includes('profiles_contact_number_key')
      ) {
        errorMessage = 'Contact number is already registered.';
      }

      setModalMessage(errorMessage);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CustomModalAlert
        visible={modalVisible}
        title="Notice"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: c.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: c.textPrimary }]}>Sign Up and Stay Protected</Text>
              <Text style={[styles.subtitle, { color: c.textSecondary }]}>
                Get real-time fire alerts and help keep your community safe.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: c.chipBg }]}
            >
              <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: c.textPrimary }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
              placeholder="Enter your username"
              placeholderTextColor={c.placeholder}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Text style={[styles.label, { color: c.textPrimary }]}>Contact Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
              placeholder="Enter your contact number"
              placeholderTextColor={c.placeholder}
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            <Text style={[styles.label, { color: c.textPrimary }]}>Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
              placeholder="Enter your password"
              placeholderTextColor={c.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            <Text style={[styles.label, { color: c.textPrimary }]}>Confirm Password</Text>
            <TextInput
              style={[styles.input, styles.lastInput, { backgroundColor: c.card, borderColor: c.border, color: c.textPrimary }]}
              placeholder="Confirm your password"
              placeholderTextColor={c.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 80 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 50,
  },
  headerContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
  },
  backButton: {
    padding: 8,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  formContainer: { width: '100%' },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  lastInput: {
    marginBottom: 30,
  },
  signUpButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  signUpButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
