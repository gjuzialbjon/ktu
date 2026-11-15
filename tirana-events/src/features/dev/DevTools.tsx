import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useStore } from '@/data/store';
import { SCHEMA_VERSION } from '@/data/storage';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { Button } from '@/components/ui';

/**
 * Debug panel, rendered only when __DEV__ (see profile screen). Shows what build and
 * data you are looking at, and resets device data to a fresh-install state.
 */
export function DevTools() {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { resetLocalData, rsvps, events } = useStore();
  const [done, setDone] = useState(false);

  const facts: [string, string][] = [
    ['app', `${Constants.expoConfig?.name ?? '?'} ${Constants.expoConfig?.version ?? ''}`],
    ['storage schema', `v${SCHEMA_VERSION}`],
    ['theme / lang', `${theme.id} / ${lang}`],
    ['events / rsvps', `${events.length} / ${Object.keys(rsvps).length}`],
  ];

  return (
    <View style={s.box}>
      <Text style={s.title}>{t.dev_title}</Text>
      {facts.map(([k, v]) => (
        <Text key={k} style={s.fact} selectable>
          {k}: <Text style={s.value}>{v}</Text>
        </Text>
      ))}
      <Button
        label={done ? t.dev_reset_done : t.dev_reset}
        tone="ghost"
        onPress={async () => {
          await resetLocalData();
          setDone(true);
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    box: {
      marginTop: 32,
      padding: 14,
      gap: 6,
      borderRadius: radius.md,
      borderWidth: t.outline,
      borderStyle: 'dashed',
      borderColor: t.c.border,
    },
    title: { color: t.c.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
    fact: { color: t.c.textDim, fontSize: 13 },
    value: { color: t.c.text, fontWeight: '600' },
  }),
);
