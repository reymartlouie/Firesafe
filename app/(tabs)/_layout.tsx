import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AdminProvider, useAdmin } from '../../contexts/AdminContext';
import authService from '../../services/authService';

function TabLayoutInner() {
  const { setIsAdmin } = useAdmin();
  const { width } = useWindowDimensions();
  const sidePad = Math.min(Math.round(width * 0.053), 40);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await authService.getUser();
        setIsAdmin(user.is_admin === true);
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [setIsAdmin]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1F2937',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          marginHorizontal: sidePad,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 12,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, styles.tabBarBlur]} />
        ),
        tabBarItemStyle: {
          paddingHorizontal: 24,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nodes"
        options={{
          title: 'Node',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="node/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <AdminProvider>
      <TabLayoutInner />
    </AdminProvider>
  );
}

const styles = StyleSheet.create({
  tabBarBlur: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
});
