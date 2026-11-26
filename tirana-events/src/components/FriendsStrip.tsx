import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useRouter } from 'expo-router';
import { useStore } from '@/data/store';
import { useI18n } from '@/lib/i18n';
import { makeStyles, radius } from '@/lib/theme';
import { firstName } from '@/lib/format';
import { useEventFacts } from '@/features/event/useEventFacts';
import { Avatar, Display } from '@/components/ui';
import { track } from '@/lib/analytics';
import { EventItem, PublicUser } from '@ktu/shared';
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
  const { cityEvents: events, people, friendsShown } = useStore();
  const now = useNow();

  const items = useMemo(() => {
    const upcoming = events
      .filter((e) => new Date(e.startsAt).getTime() > now - 3600_000)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const out: { person: PublicUser; event: EventItem }[] = [];
    // only friends who share their plans with you
    for (const id of friendsShown) {
      const person = people.find((p) => p.id === id);
      const next = upcoming.find((e) => e.goingUserIds.includes(id));
      if (person && next) out.push({ person, event: next });
    }
    return out.sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  }, [events, people, friendsShown, now]);

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
      <Avatar user={person} highlight size={48} />
      <Text style={s.name}>
        {firstName(person.name)}
      </Text>
      <Text style={s.event}>
        {event.title}
      </Text>
      <Text style={s.when}>
        {when}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    // no bottom margin of its own: the home column spaces sections, like every other rail
    wrap: { gap: 12 },
    // stretch: cards in the row share the tallest one's height
    row: { gap: 12, paddingRight: 8, alignItems: 'stretch' },
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
    name: { color: t.c.text, fontSize: 15, fontWeight: '700', marginTop: 4 },
    event: { color: t.c.textDim, fontSize: 13, lineHeight: 17 },
    // pinned to the bottom, so the times line up across cards whose titles wrap differently
    when: { color: t.c.text, fontSize: 12, fontWeight: '700', marginTop: 'auto' },
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
