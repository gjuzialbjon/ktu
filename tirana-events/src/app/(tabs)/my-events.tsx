import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { makeStyles, radius } from '@/lib/theme';
import { EventCard } from '@/components/EventCard';
import { Display } from '@/components/ui';
import { TopBar } from '@/components/TopBar';
import { canRate, isIn } from '@ktu/shared';
import { RateEvent } from '@/features/rating/RateEvent';
import { useNow } from '@/hooks/useNow';

export default function MyEvents() {
  const { t } = useI18n();
  const s = useStyles();
  const { events, rsvps, saved, myDrafts, standings } = useStore();
  // your standing as a host: only you see it, and only once you have created something
  const hostTier = standings.me?.tier ?? 'new';
  const { width } = useWindowDimensions();
  const cols = width >= 1280 ? 3 : width >= 768 ? 2 : 1;
  const maxW = cols > 1 ? 1240 : 640;
  const itemWidth = cols > 1 ? (Math.min(width, maxW) - 32 - 16 * (cols - 1)) / cols : Math.min(width, maxW) - 32;
  const nowMs = useNow();
  const now = new Date(nowMs).toISOString();

  const byTime = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const mine = byTime.filter((e) => isIn(rsvps[e.id]));
  const upcoming = mine.filter((e) => e.startsAt >= now);
  const past = mine.filter((e) => e.startsAt < now).reverse();
  const waiting = byTime.filter((e) => rsvps[e.id]?.status === 'requested');
  // events you went to that ended in the last week: newest first
  const toRate = mine.filter((e) => canRate(e, rsvps[e.id], new Date(nowMs))).reverse();
  const savedUpcoming = byTime.filter((e) => saved[e.id] && !rsvps[e.id] && e.startsAt >= now);

  const grid = (items: typeof mine) => (
    <View style={[s.grid, { gap: cols > 1 ? 16 : 0 }]}>
      {items.map((e) => (
        <View key={e.id} style={{ width: itemWidth }}>
          <EventCard event={e} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[s.content, { maxWidth: maxW }]}>
        <TopBar />
        <Display size={30} style={{ marginTop: 8, marginBottom: 16 }}>
          {t.my_events}
        </Display>
        {toRate.length > 0 && (
          <View style={s.rateList}>
            <Display size={22}>{t.rate_section(toRate.length)}</Display>
            {toRate.map((e) => (
              <RateEvent key={e.id} event={e} showTitle />
            ))}
          </View>
        )}
        {upcoming.length === 0 ? <Text style={s.empty}>{t.no_events}</Text> : grid(upcoming)}
        {myDrafts.length > 0 && (
          <View style={s.hostCard}>
            <Text style={s.hostTitle}>{t.host_title}</Text>
            <Text style={s.hostBody}>{t.host_status[hostTier]}</Text>
            <Text style={s.hostMeta}>{t.host_pending(myDrafts.length)}</Text>
          </View>
        )}
        {waiting.length > 0 && (
          <>
            <Display size={22} style={{ marginTop: 12, marginBottom: 12 }}>
              {t.waiting_title}
            </Display>
            {grid(waiting)}
          </>
        )}
        {savedUpcoming.length > 0 && (
          <>
            <Display size={22} style={{ marginTop: 12, marginBottom: 12 }}>
              {t.saved_title}
            </Display>
            {grid(savedUpcoming)}
          </>
        )}
        {past.length > 0 && (
          <>
            <Display size={22} style={{ marginTop: 12, marginBottom: 12 }}>
              {t.past}
            </Display>
            {grid(past)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.c.bg },
    content: { padding: 16, paddingBottom: 48, width: '100%', alignSelf: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    rateList: { gap: 12, marginBottom: 20, maxWidth: 640 },
    empty: { color: t.c.textDim, fontSize: 16, marginTop: 8, marginBottom: 16 },
    hostCard: {
      backgroundColor: t.c.surface,
      borderRadius: radius.md,
      borderWidth: t.outline,
      borderColor: t.c.border,
      padding: 16,
      gap: 6,
      marginBottom: 20,
    },
    hostTitle: { color: t.c.text, fontSize: 16, fontWeight: '700' },
    hostBody: { color: t.c.text, fontSize: 15, lineHeight: 21 },
    hostMeta: { color: t.c.textDim, fontSize: 14 },
  }),
);
