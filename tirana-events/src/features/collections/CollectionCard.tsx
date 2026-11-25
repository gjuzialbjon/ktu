import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { EventItem } from '@ktu/shared';
import type { Collection } from '@/data/collections';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { CardTitle, Emoji, Sticker } from '@/components/ui';
import { EventPhoto } from '@/components/EventPhoto';
import { track } from '@/lib/analytics';

export const COLLECTION_CARD = { w: 236, h: 156 };

/** A collection's cover: photo, title over a fade, the count as a handwritten sticker. Fixed size. */
export function CollectionCard({ collection, items, cover }: { collection: Collection; items: EventItem[]; cover: EventItem }) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const router = useRouter();
  const title = collection.title[lang];
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t.a11y_collection(title, items.length)}
      onPress={() => {
        track('collection_opened', { id: collection.id, source: 'home' });
        router.push(`/collection/${collection.id}`);
      }}
      style={({ pressed }) => [s.card, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={s.clip}>
        <EventPhoto event={cover} style={StyleSheet.absoluteFill} emojiSize={48} emojiPlacement="watermark" />
        <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
        <View style={[s.emoji, { backgroundColor: theme.c.surface }]}>
          <Emoji size={18}>{collection.emoji}</Emoji>
        </View>
        <Sticker tone={0} tilt={4} size={18} style={s.count}>
          {t.collection_count(items.length)}
        </Sticker>
        <CardTitle size={19} color="#FFFFFF" numberOfLines={2} style={s.title}>
          {title}
        </CardTitle>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    card: {
      width: COLLECTION_CARD.w,
      height: COLLECTION_CARD.h,
      marginRight: 12,
      borderRadius: radius.lg,
      borderWidth: t.outline,
      borderColor: t.c.border,
      backgroundColor: t.c.surfaceAlt,
    },
    clip: { flex: 1, borderRadius: radius.lg - t.outline, overflow: 'hidden' },
    emoji: { position: 'absolute', top: 10, left: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    count: { position: 'absolute', top: 12, right: 10 },
    title: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  }),
);
