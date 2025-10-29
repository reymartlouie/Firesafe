import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
import CustomModalAlert from '../app/CustomModalAlert'; //import sang modal alert
import authService from '../services/authService';
import { supabase } from '../lib/supabaseClient'; //import sang client

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  //gina show sang modal
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
      // gina check kung user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        setModalMessage('Account is already registered.');
        setModalVisible(true);
        setIsLoading(false);
        return;
      }

      // Signup kung wala pa na register
      const user = await authService.signup(username, contactNumber, password);

      setModalMessage('Account successfully registered!.');
      setModalVisible(true);

      // redirect to signin after signup para better ux (ANGAS)
      setTimeout(() => {
        setModalVisible(false);
        router.replace('/');
      }, 2000);
      
    } catch (error: any) {
  let errorMessage = error.message || 'Signup failed. Please try again.';

  // Check for duplicate contact number error from Supabase
  if (
    errorMessage.includes('duplicate key value') &&
    errorMessage.includes('profiles_contact_number_key')
  ) {
    errorMessage = 'Contact Number Already Registered.';
  }

  setModalMessage(errorMessage);
  setModalVisible(true);
} finally {
  setIsLoading(false);
}
  };

  return (
    <>
      <StatusBar style="dark" />

      {}
      <CustomModalAlert
        visible={modalVisible}
        title="Notice"
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
          {}
          <View style={styles.header}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Sign Up and Stay Protected</Text>
              <Text style={styles.subtitle}>
                Get real-time fire alerts and help keep your community safe.
              </Text>
            </View>

            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#2C2C2C" />
            </TouchableOpacity>
          </View>

          {}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your contact number"
              placeholderTextColor="#999"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, styles.lastInput]}
              placeholder="Confirm your password"
              placeholderTextColor="#999"
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
    color: '#272727',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#757575',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  formContainer: { width: '100%' },
  label: {
    fontSize: 16,
    color: '#272727',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    color: '#272727',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
