import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { EventItem } from '../lib/types';
import { CATEGORY_META, colors, radius } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { formatWhen } from '../lib/format';
import { AvatarStack, Chip, TagRow } from './ui';
import { track } from '../lib/analytics';

export function EventCard({ event }: { event: EventItem }) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { people, profile, rsvps } = useStore();
  const going = people.filter((p) => event.goingUserIds.includes(p.id));
  const joined = !!rsvps[event.id];
  const meta = CATEGORY_META[event.category];
  const d = new Date(event.startsAt);
  const popular = going.length >= 4;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      onPress={() => {
        track('event_viewed', { eventId: event.id, source: 'feed', tags: event.tags });
        router.push(`/event/${event.id}`);
      }}
    >
      <View>
        <Image source={{ uri: event.coverImage }} style={styles.img} />
        <LinearGradient colors={['transparent', 'rgba(14,17,22,0.9)']} style={styles.fade} />

        {/* date block */}
        <View style={styles.dateBlock}>
          <Text style={styles.dateDay}>{d.getDate()}</Text>
          <Text style={styles.dateMonth}>
            {d.toLocaleDateString(lang === 'sq' ? 'sq-AL' : 'en-GB', { month: 'short' })}
          </Text>
        </View>

        <View style={styles.badges}>
          {event.isSponsored && <Chip label={t.sponsored} tone="sponsored" />}
          {popular && <Chip label={t.popular} tone="default" active />}
        </View>

        <View style={styles.overImg}>
          <Text style={[styles.catLine, { color: meta.color }]}>
            {meta.emoji} {t[`cat_${event.category}` as const].toUpperCase()}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
        </View>
      </View>

      <View style={[styles.stripe, { backgroundColor: meta.color }]} />

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={styles.when}>{formatWhen(event.startsAt, lang, t.today, t.tomorrow)}</Text>
          <Chip
            label={event.priceType === 'free' ? t.free : `${event.ticketPriceLek} Lekë`}
            tone={event.priceType === 'free' ? 'free' : 'default'}
          />
        </View>
        <Text style={styles.venue}>📍 {event.venueName}</Text>
        <TagRow
          tags={event.tags.slice(0, 4)}
          onTagPress={(tag) => {
            track('tag_filtered', { tag, source: 'card' });
            router.push({ pathname: '/', params: { tag } });
          }}
        />
        <View style={styles.footer}>
          <AvatarStack users={going} follows={profile.follows} />
          <Text style={[styles.going, joined && { color: colors.green, fontWeight: '700' }]}>
            {joined ? t.youre_going : t.going_count(going.length)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 18,
  },
  img: { width: '100%', height: 190, backgroundColor: colors.cardAlt },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
  dateBlock: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(14,17,22,0.85)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  dateDay: { color: colors.text, fontSize: 20, fontWeight: '900', lineHeight: 24 },
  dateMonth: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  badges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row' },
  overImg: { position: 'absolute', left: 14, right: 14, bottom: 10 },
  catLine: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 2 },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  stripe: { height: 3, width: '100%' },
  body: { padding: 14, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  when: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  venue: { color: colors.textDim, fontSize: 14 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  going: { color: colors.textDim, fontSize: 13 },
});
