import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { EventItem } from '@ktu/shared';
import type { Collection } from '@/data/collections';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius, useTheme } from '@/lib/theme';
import { Text } from '@/components/Text';
import { CardTitle } from '@/components/ui';
import { COLLECTION_ICON, Icon } from '@/components/icons';
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
        <EventPhoto event={cover} style={StyleSheet.absoluteFill} iconSize={48} iconPlacement="watermark" />
        <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
        <View style={[s.emoji, { backgroundColor: theme.c.surface }]}>
          <Icon as={COLLECTION_ICON[collection.icon]} size={18} color={theme.c.text} />
        </View>
        <View style={s.bottom}>
          <Text style={s.count}>{t.collection_count(items.length)}</Text>
          <CardTitle size={19} color="#FFFFFF">
            {title}
          </CardTitle>
        </View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    card: {
      width: COLLECTION_CARD.w,
      minHeight: COLLECTION_CARD.h, // grows for a long name instead of cutting it
      marginRight: 12,
      borderRadius: radius.lg,
      borderWidth: t.outline,
      borderColor: t.c.border,
      backgroundColor: t.c.surfaceAlt,
    },
    clip: { flexGrow: 1, justifyContent: 'flex-end', borderRadius: radius.lg - t.outline, overflow: 'hidden' },
    emoji: { position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    // in the flow, clear of the icon above, so the card grows around the text
    bottom: { marginTop: 56, paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
    count: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  }),
);
