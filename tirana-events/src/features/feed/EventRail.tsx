import React from 'react';
import { Rail } from '@/components/Rail';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Text';
import type { EventItem } from '@ktu/shared';
import { makeStyles, space } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { Display } from '@/components/ui';
import { StoryCard, StorySize } from '@/components/StoryCard';

const CARD_GAP = 12; // StoryCard's own right margin
/** How much of the next wide card shows, so it is obvious the row swipes. */
const PEEK = 44;

/** A titled, horizontally scrolling row of event cards (highlights, for-you, per category, similar). */
export function EventRail({
  title,
  dot,
  note,
  events,
  source,
  size = 'sm',
  maxWidth = 640,
  onSeeAll,
}: {
  title: string;
  /** a category's colour before the title */
  dot?: string;
  /** one quiet line under the title, e.g. why these were picked */
  note?: string;
  events: EventItem[];
  source: string;
  size?: StorySize;
  /** the content column's max width; the wide card is sized from it */
  maxWidth?: number;
  /** shows "All n →" when the row holds more than fits on screen */
  onSeeAll?: () => void;
}) {
  const s = useStyles();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  if (events.length === 0) return null;
  // wide: one card fills the column minus a peek of the next; snaps card by card
  const wideW = Math.min(Math.min(width, maxWidth) - space.lg * 2 - PEEK, 520);
  const cardW = size === 'wide' ? (events.length === 1 ? wideW + PEEK : wideW) : undefined;
  return (
    <View style={s.wrap}>
      <View style={s.head}>
        {dot ? <View style={[s.dot, { backgroundColor: dot }]} /> : null}
        <Display size={19} style={{ flexShrink: 1 }}>
          {title}
        </Display>
        {onSeeAll && events.length > 2 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.a11y_see_all(title, events.length)}
            onPress={onSeeAll}
            hitSlop={8}
            style={({ pressed }) => [s.seeAll, pressed && { opacity: 0.6 }]}
          >
            <Text style={s.seeAllText}>{t.see_all(events.length)} →</Text>
          </Pressable>
        ) : null}
      </View>
      {note ? <Text style={s.note}>{note}</Text> : null}
      <Rail
        style={s.rail}
        contentContainerStyle={s.railContent}
        snapToInterval={cardW ? cardW + CARD_GAP : undefined}
        decelerationRate={cardW ? 'fast' : 'normal'}
      >
        {events.map((e) => (
          <StoryCard key={e.id} event={e} source={source} size={size} width={cardW} />
        ))}
      </Rail>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: 2 },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    dot: { width: 12, height: 12, borderRadius: 6 },
    seeAll: { marginLeft: 'auto', minHeight: 44, justifyContent: 'center', paddingLeft: space.sm },
    seeAllText: { color: t.c.social, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
    pill: {
      minWidth: 24,
      height: 22,
      paddingHorizontal: 7,
      borderRadius: 999,
      backgroundColor: t.c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillText: { color: t.c.textDim, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
    note: { color: t.c.textDim, fontSize: 13 },
    rail: { flexGrow: 0, marginHorizontal: -space.lg },
    railContent: { paddingHorizontal: space.lg },
  }),
);

/** A small, quiet count that sits next to a heading (not pushed to the far edge). */
export function CountPill({ n, label }: { n: number; label: string }) {
  const s = useStyles();
  return (
    <View style={s.pill} accessible accessibilityLabel={label}>
      <Text style={s.pillText}>{n}</Text>
    </View>
  );
}
