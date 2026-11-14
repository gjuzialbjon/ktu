import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { EventItem } from '../lib/types';
import { CATEGORY_EMOJI, makeStyles, radius, useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { useStore } from '../lib/store';
import { firstName, formatWhen, joinNames } from '../lib/format';
import { Emoji } from './ui';
import { track } from '../lib/analytics';

/** Tall photo tile for the "Tonight" rail — the Instagram-story shape people already scroll. */
export function StoryCard({ event, source }: { event: EventItem; source: string }) {
  const theme = useTheme();
  const s = useStyles();
  const { t, lang } = useI18n();
  const { people, profile } = useStore();
  const friends = people.filter((p) => event.goingUserIds.includes(p.id) && profile.follows.includes(p.id));
  const when = formatWhen(event.startsAt, lang, t.today, t.tomorrow);

  return (
    <Link
      href={`/event/${event.id}`}
      asChild
      onPress={() => track('event_viewed', { eventId: event.id, source, tags: event.tags })}
    >
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${event.title}, ${when}`}
        style={({ pressed }) => [s.card, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
      >
        <Image source={{ uri: event.coverImage }} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.88)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.bubble, { backgroundColor: theme.cat[event.category] }]}>
          <Emoji size={18}>{CATEGORY_EMOJI[event.category]}</Emoji>
        </View>
        {event.priceType === 'free' && (
          <View style={[s.badge, { backgroundColor: theme.c.free }]}>
            <Text style={[s.badgeText, { color: theme.c.onFree }]}>{t.free}</Text>
          </View>
        )}
        <View style={s.bottom}>
          <Text style={s.when}>{when}</Text>
          <Text style={[s.title, { fontFamily: theme.font }]} numberOfLines={3}>
            {event.title}
          </Text>
          {friends.length > 0 && (
            <View style={[s.friends, { backgroundColor: theme.c.social }]}>
              <Text style={[s.friendsText, { color: theme.c.onSocial }]} numberOfLines={1}>
                {t.friends_going_short(joinNames(friends.map((f) => firstName(f.name)), t.and_word), friends.length)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    card: {
      width: 200,
      height: 280,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: t.c.surfaceAlt,
      marginRight: 12,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    bubble: {
      position: 'absolute',
      top: 10,
      left: 10,
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: { position: 'absolute', top: 15, right: 10, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    bottom: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 5 },
    when: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    title: { color: '#FFFFFF', fontSize: 19, lineHeight: 23 },
    friends: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, maxWidth: '100%' },
    friendsText: { fontSize: 12, fontWeight: '700' },
  }),
);
