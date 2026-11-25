import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Stack, useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { makeStyles } from '@/lib/theme';
import { Button, Display } from '@/components/ui';

/** Any unknown URL (old share links, typos on web) lands here instead of Expo's default page. */
export default function NotFound() {
  const { t } = useI18n();
  const s = useStyles();
  const router = useRouter();
  return (
    <View style={s.wrap}>
      <Stack.Screen options={{ title: '' }} />
      <Display size={26}>{t.page_missing_title}</Display>
      <Text style={s.body}>{t.page_missing_body}</Text>
      <Button label={t.go_home} onPress={() => router.replace('/')} />
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: 14, padding: 24, backgroundColor: t.c.bg },
    body: { color: t.c.textDim, fontSize: 16 },
  }),
);
