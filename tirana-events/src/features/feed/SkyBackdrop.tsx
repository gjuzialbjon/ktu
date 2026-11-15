import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';

/**
 * Two gradients stacked behind the feed: the day sky, and the evening sky on top with
 * its opacity driven by `lateness` (0–1). Decorative; touches pass through.
 */
export function SkyBackdrop({ lateness }: { lateness: Animated.AnimatedInterpolation<number> | Animated.Value }) {
  const t = useTheme();
  return (
    <>
      <LinearGradient pointerEvents="none" colors={t.sky.day} style={StyleSheet.absoluteFill} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: lateness }]}>
        <LinearGradient colors={t.sky.evening} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </>
  );
}
