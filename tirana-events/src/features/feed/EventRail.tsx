import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { EventItem } from '@/data/types';
import { makeStyles, space } from '@/lib/theme';
import { Display, Emoji } from '@/components/ui';
import { StoryCard } from '@/components/StoryCard';

/** A titled, horizontally scrolling row of tall event cards (for-you, per category, similar). */
export function EventRail({
  title,
  emoji,
  note,
  events,
  source,
}: {
  title: string;
  emoji?: string;
  /** one quiet line under the title, e.g. why these were picked */
  note?: string;
  events: EventItem[];
  source: string;
}) {
  const s = useStyles();
  if (events.length === 0) return null;
  return (
    <View style={s.wrap}>
      <View style={s.head}>
        {emoji ? <Emoji size={20}>{emoji}</Emoji> : null}
        <Display size={20} style={{ flexShrink: 1 }}>
          {title}
        </Display>
        <Text style={s.count}>{events.length}</Text>
      </View>
      {note ? <Text style={s.note}>{note}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rail} contentContainerStyle={s.railContent}>
        {events.map((e) => (
          <StoryCard key={e.id} event={e} source={source} />
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    wrap: { gap: space.xs, marginBottom: space.md },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    count: { color: t.c.textDim, fontSize: 14, marginLeft: 'auto' },
    note: { color: t.c.textDim, fontSize: 13 },
    rail: { flexGrow: 0, marginHorizontal: -space.lg },
    railContent: { paddingHorizontal: space.lg },
  }),
);
