import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useI18n } from '@/lib/i18n';
import { createLogger } from '@/lib/log';
import { makeStyles, radius } from '@/lib/theme';
import { Emoji } from '@/components/ui';
import { FieldLabel } from './Field';

const log = createLogger('create');

/** Optional cover photo. Stored as a data URL: blob/file URIs on web do not survive a restart. */
export function PhotoField({ photo, onChange }: { photo: string | null; onChange: (uri: string | null) => void }) {
  const { t } = useI18n();
  const s = useStyles();

  const pick = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.5,
        base64: true,
      });
      if (res.canceled || !res.assets[0]) return;
      const a = res.assets[0];
      onChange(a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri);
    } catch (e) {
      log.error('image picker failed', e);
    }
  };

  return (
    <>
      <FieldLabel label={t.ev_photo} />
      <Pressable
        style={s.box}
        onPress={pick}
        accessibilityRole="button"
        accessibilityLabel={photo ? t.ev_photo : t.ev_photo_hint}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={s.photo} />
        ) : (
          <View style={s.empty}>
            <Emoji size={22}>📷</Emoji>
            <Text style={s.hint}>{t.ev_photo_hint}</Text>
          </View>
        )}
      </Pressable>
      {photo && (
        <Pressable onPress={() => onChange(null)} accessibilityRole="button" hitSlop={10}>
          <Text style={s.remove}>{t.ev_photo_remove}</Text>
        </Pressable>
      )}
    </>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    box: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderStyle: 'dashed',
      borderRadius: radius.md,
      height: 160,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    photo: { width: '100%', height: '100%' },
    empty: { alignItems: 'center', gap: 6 },
    hint: { color: t.c.textDim, fontSize: 15 },
    remove: { color: t.c.text, fontSize: 14, fontWeight: '700', marginTop: 8, textDecorationLine: 'underline' },
  }),
);
