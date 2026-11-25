import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useStore } from '@/data/store';
import { makeStyles, space } from '@/lib/theme';
import { WEATHER_CHIP_W, WeatherChip } from '@/features/weather/WeatherChip';

/**
 * The top of every main screen: today's weather on the left, `children` (the greeting
 * sticker on home) centred. Profile is a tab of its own, so there is no avatar here.
 */
export function TopBar({ children }: { children?: React.ReactNode }) {
  const s = useStyles();
  const { profile } = useStore();
  return (
    <View style={s.bar}>
      <WeatherChip city={profile.city} />
      <View style={s.middle}>{children}</View>
      {/* as wide as the weather chip, so whatever sits in the middle is truly centred */}
      <View style={s.balance} />
    </View>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.sm, minHeight: 52 },
    middle: { flex: 1, alignItems: 'center' },
    balance: { width: WEATHER_CHIP_W },
  }),
);
