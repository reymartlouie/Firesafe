import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabaseClient';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const pushNotificationService = {
  // Register device for push notifications
  registerForPushNotifications: async (): Promise<string | null> => {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Get existing notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Ask for permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If permission denied, return null
      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'eeed762d-729e-41da-a627-986c168e8487',
      });

      const expoPushToken = tokenData.data;

      // Configure Android notification channel (required for Android)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('fire-alerts', {
          name: 'Fire Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
          sound: 'default',
        });
      }

      return expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  },

  // Save push token to Supabase
  savePushToken: async (expoPushToken: string): Promise<boolean> => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Call the database function
      const { error: saveError } = await supabase.rpc('save_push_token', {
        p_user_id: user.id,
        p_expo_push_token: expoPushToken,
      });

      if (saveError) {
        throw saveError;
      }

      console.log('✅ Push token saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving push token:', error);
      return false;
    }
  },

  // Delete push token when user logs out
  removePushToken: async (expoPushToken: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('expo_push_token', expoPushToken);

      if (error) throw error;

      console.log('Push token removed successfully');
      return true;
    } catch (error) {
      console.error('Error removing push token:', error);
      return false;
    }
  },

  // Setup notification listeners
  setupNotificationListeners: (): (() => void) => {
    // Listener for when notification is received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listener for when user taps on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        // You can navigate to specific screen based on notification data
        // const data = response.notification.request.content.data;
        // For example: router.push(`/fire-event/${data.event_id}`);
      }
    );

    // Return cleanup function
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  },
};

export default pushNotificationService;