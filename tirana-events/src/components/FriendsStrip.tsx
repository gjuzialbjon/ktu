import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius } from '@/lib/theme';
import { firstName } from '@/lib/format';
import { useEventFacts } from '@/features/event/useEventFacts';
import { Avatar, Display } from '@/components/ui';
import { track } from '@/lib/analytics';
import { EventItem, PublicUser } from '@/data/types';
import { useNow } from '@/hooks/useNow';

/**
 * People-first: each followed friend with the next event they are going to.
 * Seeing friends is the main reason people go, so this leads the home screen.
 */
export function FriendsStrip() {
  const { t } = useI18n();
  const s = useStyles();
  const router = useRouter();
  // your city only: a friend's plan in another city is not something to join tonight
  const { cityEvents: events, people, profile } = useStore();
  const now = useNow();

  const items = useMemo(() => {
    const upcoming = events
      .filter((e) => new Date(e.startsAt).getTime() > now - 3600_000)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const out: { person: PublicUser; event: EventItem }[] = [];
    for (const id of profile.follows) {
      const person = people.find((p) => p.id === id);
      const next = upcoming.find((e) => e.goingUserIds.includes(id));
      if (person && next) out.push({ person, event: next });
    }
    return out.sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  }, [events, people, profile.follows, now]);

  return (
    <View style={s.wrap}>
      <Display size={20}>{t.friends_strip_title}</Display>
      {items.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>{t.friends_strip_empty}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [s.emptyBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={s.emptyBtnText}>{t.find_friends}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {items.map(({ person, event }) => (
            <CrewItem key={person.id} person={person} event={event} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function CrewItem({ person, event }: { person: PublicUser; event: EventItem }) {
  const s = useStyles();
  const router = useRouter();
  const { when } = useEventFacts(event);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${person.name}: ${event.title}, ${when}`}
      onPress={() => {
        track('event_viewed', { eventId: event.id, source: 'friends_strip', tags: event.tags });
        router.push(`/event/${event.id}`);
      }}
      style={({ pressed }) => [s.item, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <Avatar user={person} highlight size={58} />
      <Text style={s.name} numberOfLines={1}>
        {firstName(person.name)}
      </Text>
      <Text style={s.event} numberOfLines={2}>
        {event.title}
      </Text>
      <Text style={s.when} numberOfLines={1}>
        {when}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: 12, marginBottom: 24 },
    row: { gap: 10, paddingRight: 8 },
    item: {
      width: 128,
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 12,
      gap: 4,
      alignItems: 'flex-start',
    },
    name: { color: t.c.text, fontSize: 15, fontWeight: '700', marginTop: 6 },
    event: { color: t.c.textDim, fontSize: 13, lineHeight: 17, minHeight: 34 },
    when: { color: t.c.text, fontSize: 12, fontWeight: '700' },
    empty: {
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 16,
      gap: 12,
      alignItems: 'flex-start',
    },
    emptyText: { color: t.c.textDim, fontSize: 15 },
    emptyBtn: {
      backgroundColor: t.c.social,
      borderRadius: 999,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: 'center',
    },
    emptyBtnText: { color: t.c.onSocial, fontWeight: '700', fontSize: 15 },
  }),
);
