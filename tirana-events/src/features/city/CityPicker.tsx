import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { CITY_ORDER, cityName } from '@/data/cities';
import { countThisWeekByCity } from './countByCity';
import { useStore } from '@/data/store';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { useNow } from '@/hooks/useNow';
import { Display } from '@/components/ui';
import { Sheet } from '@/components/Sheet';

/**
 * Bottom sheet for switching city from the home screen. The choice is the profile's
 * default city, so it sticks across launches and matches the profile setting.
 */
export function CityPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { events, profile, setCity } = useStore();
  const nowMs = useNow();
  const counts = useMemo(() => countThisWeekByCity(events, new Date(nowMs)), [events, nowMs]);

  return (
    <Sheet visible={visible} onClose={onClose}>
        <Display size={24}>{t.city_pick_title}</Display>
        <ScrollView style={s.list} contentContainerStyle={{ gap: 6 }}>
          {CITY_ORDER.map((c) => {
            const active = c === profile.city;
            return (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => {
                  setCity(c, 'home');
                  onClose();
                }}
                android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
                style={({ pressed }) => [s.row, active && s.rowActive, pressed && { opacity: 0.8 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{cityName(c, lang)}</Text>
                  <Text style={s.count}>{t.city_week(counts[c])}</Text>
                </View>
                {active && <Check color={theme.c.text} size={22} strokeWidth={2.4} />}
              </Pressable>
            );
          })}
        </ScrollView>
    </Sheet>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    list: { flexGrow: 0 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 60,
      paddingHorizontal: 14,
      borderRadius: radius.md,
      backgroundColor: t.c.surface,
      borderWidth: t.outline,
      borderColor: t.c.border,
      overflow: 'hidden',
    },
    rowActive: { borderColor: t.c.text }, // colour only: a width change would shift the row
    name: { color: t.c.text, fontSize: 17, fontWeight: '700' },
    count: { color: t.c.textDim, fontSize: 13, marginTop: 2 },
  }),
);
