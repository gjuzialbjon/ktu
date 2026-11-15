import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import UserIcon from 'lucide-react-native/icons/user';
import { useStore } from '@/data/store';
import { useI18n } from '@/lib/i18n';
import { initials } from '@/lib/format';
import { makeStyles, space, useTheme } from '@/lib/theme';
import { WeatherChip } from '@/features/weather/WeatherChip';

/**
 * Same corners on every main screen: today's weather top left, you top right.
 * `children` sits between them (e.g. the city pill on home).
 */
export function TopBar({ children }: { children?: React.ReactNode }) {
  const { t } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const router = useRouter();
  const { profile } = useStore();
  const name = profile.name.trim();
  return (
    <View style={s.bar}>
      <WeatherChip city={profile.city} />
      <View style={s.middle}>{children}</View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.a11y_profile}
        onPress={() => router.push('/profile')}
        hitSlop={4}
        style={({ pressed }) => [s.me, pressed && { opacity: 0.8 }]}
      >
        {name ? (
          <Text style={s.meText}>{initials(name)}</Text>
        ) : (
          <UserIcon color={theme.c.onSocial} size={20} strokeWidth={2.2} />
        )}
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingTop: space.sm, minHeight: 52 },
    middle: { flex: 1, alignItems: 'center' },
    me: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.c.social,
    },
    meText: { color: t.c.onSocial, fontSize: 15, fontWeight: '800' },
  }),
);
