import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { collectionEvents, findCollection, liveCollections } from '@/data/collections';
import { makeStyles, radius, space, useTheme } from '@/lib/theme';
import { useNow } from '@/hooks/useNow';
import { Display, Emoji, Sticker } from '@/components/ui';
import { EventPhoto } from '@/components/EventPhoto';
import { EventCard } from '@/components/EventCard';

/**
 * One curated list: a cover with its title and point of view, then its events, soonest first.
 * Reads the same events as the feed (city, visibility, hidden topics already applied).
 */
export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { cityEvents } = useStore();
  const nowMs = useNow();
  const collection = findCollection(id);
  // same list and same cover as its card on home (covers are picked across all collections)
  // a shared link to a list that is short today still opens, with its first event as cover
  const entry = useMemo(() => {
    if (!collection) return undefined;
    const now = new Date(nowMs);
    const live = liveCollections(cityEvents, now).find((x) => x.collection.id === collection.id);
    if (live) return live;
    const items = collectionEvents(collection, cityEvents, now);
    return { items, cover: items[0] };
  }, [collection, cityEvents, nowMs]);
  const items = entry?.items ?? [];
  const cover = entry?.cover;

  if (!collection) {
    return (
      <View style={[s.safe, s.missing]}>
        <Stack.Screen options={{ title: t.collections_title }} />
        <Text style={s.blurb}>{t.collection_missing}</Text>
      </View>
    );
  }
  const title = collection.title[lang];

  return (
    <View style={s.safe}>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.cover}>
          {cover ? <EventPhoto event={cover} style={StyleSheet.absoluteFill} emojiSize={64} emojiPlacement="watermark" /> : null}
          <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFill} />
          <View style={[s.emoji, { backgroundColor: theme.c.surface }]}>
            <Emoji size={22}>{collection.emoji}</Emoji>
          </View>
          <View style={s.coverText}>
            <Display size={28} style={{ color: '#FFFFFF' }}>
              {title}
            </Display>
            <Text style={s.coverBlurb}>{collection.blurb[lang]}</Text>
          </View>
        </View>

        <View style={s.metaRow}>
          <Sticker tone={2} tilt={-3} size={18}>
            {t.collection_by}
          </Sticker>
          <Text style={s.count}>{t.collection_count(items.length)}</Text>
        </View>

        <View style={s.list}>
          {items.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.c.bg },
    missing: { alignItems: 'center', justifyContent: 'center', padding: space.xl },
    content: { padding: space.lg, paddingBottom: space.xxxl, maxWidth: 672, width: '100%', alignSelf: 'center' },
    cover: {
      height: 220,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: t.outline,
      borderColor: t.c.border,
      backgroundColor: t.c.surfaceAlt,
    },
    emoji: { position: 'absolute', top: 14, left: 14, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    coverText: { position: 'absolute', left: 16, right: 16, bottom: 16, gap: 6 },
    coverBlurb: { color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 21 },
    blurb: { color: t.c.textDim, fontSize: 15 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg },
    count: { color: t.c.textDim, fontSize: 14, fontWeight: '700' },
    list: { gap: space.lg, marginTop: space.lg },
  }),
);
