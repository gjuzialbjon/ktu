import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * A confirming tap when someone commits to an event. Apps only: on the web
 * expo-haptics falls back to the Vibration API, which feels intrusive in a browser.
 * Android uses performAndroidHapticsAsync, which needs no VIBRATE permission.
 */
export function hapticSuccess(): void {
  if (Platform.OS === 'ios') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } else if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
  }
}

/** A light physical "tap", e.g. the dice hitting the table. Apps only, like hapticSuccess. */
export function hapticTap(): void {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } else if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click).catch(() => {});
  }
}
