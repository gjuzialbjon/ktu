import React from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventItem } from '@ktu/shared';
import { useStore } from '@/data/store';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_EMOJI, makeStyles, radius, space, useTheme } from '@/lib/theme';
import { firstName, joinNames } from '@/lib/format';
import { Emoji, Sticker } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useEventFacts } from '@/features/event/useEventFacts';

const time = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * Today, stacked earliest to latest, on a thin time line. Each row reports where it
 * sits so the feed's sky can follow the evening as you scroll down.
 */
export function TodayTimeline({
  events,
  onRowLayout,
}: {
  events: EventItem[];
  onRowLayout?: (id: string, centerY: number) => void;
}) {
  const s = useStyles();
  return (
    <View style={s.list}>
      <View style={s.line} />
      {events.map((e) => (
        <TimelineRow
          key={e.id}
          event={e}
          onLayout={(ev: LayoutChangeEvent) => {
            const { y, height } = ev.nativeEvent.layout;
            onRowLayout?.(e.id, y + height / 2);
          }}
        />
      ))}
    </View>
  );
}

function TimelineRow({ event, onLayout }: { event: EventItem; onLayout: (e: LayoutChangeEvent) => void }) {
  const theme = useTheme();
  const s = useStyles();
  const router = useRouter();
  const { t } = useI18n();
  const { goersOf, profile } = useStore();
  const facts = useEventFacts(event);
  const friends = goersOf(event).filter((p) => profile.follows.includes(p.id));

  return (
    <View style={s.row} onLayout={onLayout}>
      <View style={s.timeCol}>
        {facts.hidden ? (
          <Emoji size={16}>🔒</Emoji>
        ) : (
          <Text style={[s.time, { fontFamily: theme.font }]}>{time(event.startsAt)}</Text>
        )}
        <View style={[s.dot, { backgroundColor: theme.cat[event.category] }]} />
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${event.title}, ${facts.when}, ${facts.where}`}
        onPress={() => {
          track('event_viewed', { eventId: event.id, source: 'today_timeline', tags: event.tags });
          router.push(`/event/${event.id}`);
        }}
        style={({ pressed }) => [s.card, pressed && { transform: [{ scale: 0.985 }] }]}
      >
        <View style={[s.bubble, { backgroundColor: theme.cat[event.category] }]}>
          <Emoji size={16}>{CATEGORY_EMOJI[event.category]}</Emoji>
        </View>
        <View style={s.body}>
          <Text style={s.title} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={s.where} numberOfLines={1}>
            {facts.where}
          </Text>
          {friends.length > 0 && (
            <Text style={[s.friends, { color: theme.c.social }]} numberOfLines={1}>
              {t.friends_going_short(joinNames(friends.map((f) => firstName(f.name)), t.and_word), friends.length)}
            </Text>
          )}
        </View>
        {facts.askToJoin && (
          <Sticker tone={1} tilt={4} size={15} style={s.sticker}>
            {facts.isPrivate ? t.badge_private : t.badge_ask}
          </Sticker>
        )}
      </Pressable>
    </View>
  );
}

const TIME_W = 58;

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    list: { gap: space.sm },
    // the time line runs behind the dots
    line: {
      position: 'absolute',
      left: TIME_W - 5,
      top: 18,
      bottom: 18,
      width: 2,
      borderRadius: 1,
      backgroundColor: t.c.border,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    timeCol: { width: TIME_W, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 0 },
    time: { color: t.c.text, fontSize: 15, fontVariant: ['tabular-nums'] },
    dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: t.c.surface, marginRight: -1 },
    card: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      marginLeft: space.md,
      paddingVertical: 10,
      paddingHorizontal: space.md,
      minHeight: 62,
      borderRadius: radius.md,
      backgroundColor: t.c.surface,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    bubble: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    body: { flex: 1, gap: 2 },
    title: { color: t.c.text, fontSize: 15, fontWeight: '700', lineHeight: 19 },
    where: { color: t.c.textDim, fontSize: 13 },
    friends: { fontSize: 13, fontWeight: '700' },
    sticker: { position: 'absolute', top: -10, right: 8 },
  }),
);
