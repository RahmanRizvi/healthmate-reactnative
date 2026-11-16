import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';
import { AppError } from '../core/errors/AppError';

if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Ignore in test environments where native notification module is mocked
  }
}

/**
 * Requests local notification permissions and schedules a daily wellness reminder
 * at the specified hour and minute.
 */
export async function enableDailyReminderNotification(
  hour = 20,
  minute = 0
): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        throw new AppError(
          'Browser notification permission was denied. Please allow notifications in your browser settings.',
          'NOTIFICATION_PERMISSION_DENIED'
        );
      }
      return true;
    }
    return true;
  }

  try {
    const existingPerm = await Notifications.getPermissionsAsync();
    let finalStatus = existingPerm.status;

    if (finalStatus !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== 'granted') {
      throw new AppError(
        'Notification permission was not granted. Please enable notifications in your device settings.',
        'NOTIFICATION_PERMISSION_DENIED'
      );
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-wellness-reminder', {
        name: 'Daily Wellness Reminder',
        importance: AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HealthMate Daily Check-In',
        body: 'Remember to log your daily steps, water intake, and active calories.',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Unable to schedule local reminder notifications on this device.',
      'NOTIFICATION_PERMISSION_DENIED',
      error
    );
  }
}

/**
 * Cancels all scheduled HealthMate reminder notifications.
 */
export async function disableDailyReminderNotification(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Ignore cancellation errors if none scheduled
  }
}
