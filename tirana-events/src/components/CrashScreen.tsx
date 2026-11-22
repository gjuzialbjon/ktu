import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { DEFAULT_THEME, THEMES } from '@/lib/theme';
import { createLogger } from '@/lib/log';

const log = createLogger('crash');
// Rendered outside the providers (they may be what crashed): fixed default theme, both languages.
const c = THEMES[DEFAULT_THEME].c;
const font = THEMES[DEFAULT_THEME].font;

/** Root error boundary: says what happened, offers a retry, and shows the stack in development. */
export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    log.error('unhandled render error', error);
  }, [error]);

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Diçka u prish.</Text>
      <Text style={s.body}>Provo përsëri. / Something broke. Try again.</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}>
        <Text style={s.btnText}>Provo përsëri / Try again</Text>
      </Pressable>
      {__DEV__ && (
        <ScrollView style={s.debug}>
          <Text selectable style={s.debugText}>
            {error.message}
            {'\n\n'}
            {error.stack}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: c.bg, padding: 24, paddingTop: 96, gap: 14 },
  title: { fontFamily: font, fontSize: 30, color: c.text },
  body: { fontSize: 16, color: c.textDim },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: c.primary,
    borderRadius: 16,
    minHeight: 50,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  btnText: { color: c.onPrimary, fontWeight: '700', fontSize: 16 },
  debug: { marginTop: 12, maxHeight: 320, backgroundColor: c.surface, borderRadius: 10, padding: 12 },
  debugText: { fontSize: 12, color: c.text, fontFamily: 'Courier' },
});
