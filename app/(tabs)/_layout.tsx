import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { AdminProvider, useAdmin } from '../../contexts/AdminContext';
import authService from '../../services/authService';

function TabLayoutInner() {
  const { setIsAdmin } = useAdmin();

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
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
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
