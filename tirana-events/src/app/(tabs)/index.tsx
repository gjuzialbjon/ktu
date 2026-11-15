import React, { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Plus from 'lucide-react-native/icons/plus';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { makeStyles, radius, space, useTheme } from '@/lib/theme';
import { EventCard } from '@/components/EventCard';
import { StoryCard } from '@/components/StoryCard';
import { FriendsStrip } from '@/components/FriendsStrip';
import { CityBand } from '@/components/CityBand';
import { Display, Emoji } from '@/components/ui';
import { track } from '@/lib/analytics';
import { useNow } from '@/hooks/useNow';
import { FeedSection, buildFeed, isFiltering } from '@/features/feed/buildFeed';
import { useFeedFilters } from '@/features/feed/useFeedFilters';
import { FilterBar } from '@/features/feed/FilterBar';
import { DiceOrigin, DiceRoll } from '@/features/feed/DiceRoll';
import type { EventItem } from '@/data/types';

const GAP = space.lg;
const TONIGHT_FROM_HOUR = 17;

/** Columns grow with the window; a lone card keeps its column width instead of stretching. */
function useFeedGrid() {
  const { width } = useWindowDimensions();
  const cols = width >= 1280 ? 3 : width >= 768 ? 2 : 1;
  const maxW = cols > 1 ? 1240 : 640;
  const contentWidth = Math.min(width, maxW) - space.lg * 2;
  const itemWidth = cols > 1 ? (contentWidth - GAP * (cols - 1)) / cols : contentWidth;
  return { cols, maxW, itemWidth, wide: cols > 1 };
}

/**
 * Reading order: greeting → question → city → friends → today → filter bar
 * (sticky) → the rest of the week. Filters apply to what sits below them; the
 * today row above is a highlight, so nothing appears twice.
 */
export default function Home() {
  const { t, lang, setLang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { events, profile } = useStore();
  const router = useRouter();
  const filterState = useFeedFilters();
  const { filters } = filterState;
  const { maxW, itemWidth, wide } = useFeedGrid();
  const column = { maxWidth: maxW };

  const nowMs = useNow();
  // pull-to-refresh: re-syncs the clock now; with a backend it is also where events get refetched
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(0);
  const now = useMemo(() => new Date(Math.max(nowMs, refreshedAt)), [nowMs, refreshedAt]);
  const onRefresh = () => {
    setRefreshing(true);
    setRefreshedAt(Date.now());
    setTimeout(() => setRefreshing(false), 450);
  };

  const feed = useMemo(() => buildFeed(events, filters, now), [events, filters, now]);
  const filtering = isFiltering(filters);

  const hour = now.getHours();
  const greetWord = hour < 12 ? t.greet_morning : hour < 18 ? t.greet_day : t.greet_evening;
  const name = profile.name.trim().split(' ')[0];
  const todayTitle = hour >= TONIGHT_FROM_HOUR ? t.sec_today : t.sec_today_day;

  // The dice roll: pick first, then animate from the button and open the pick.
  const diceRef = useRef<React.ComponentRef<typeof View>>(null);
  const [roll, setRoll] = useState<{ event: EventItem; origin: DiceOrigin; key: number } | null>(null);
  const surprise = () => {
    const pool = feed.upcoming.filter((e) => new Date(e.startsAt).getTime() > Date.now());
    if (pool.length === 0 || roll) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    track('surprise_me', { eventId: pick.id, tags: pick.tags });
    const start = (origin: DiceOrigin) => setRoll({ event: pick, origin, key: Date.now() });
    if (diceRef.current) {
      // the 🎲 glyph sits at the button's left edge, vertically centred
      diceRef.current.measureInWindow((x, y, _w, h) => start({ x: x + 8, y: y + h / 2 }));
    } else {
      start({ x: 0, y: 0 });
    }
  };
  const openRolled = (e: EventItem) => {
    router.push(`/event/${e.id}`);
    setRoll(null);
  };

  const sectionTitle = (key: FeedSection['key']) =>
    key === 'today' ? todayTitle : key === 'tomorrow' ? t.sec_tomorrow : key === 'weekend' ? t.sec_weekend : t.sec_later;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        stickyHeaderIndices={[1]}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.c.text}
            colors={[theme.c.primary]}
            progressBackgroundColor={theme.c.surface}
          />
        }
      >
        {/* 0 — lead: who and what is happening now */}
        <View>
          <View style={[s.column, column]}>
            <View style={s.topBar}>
              <Text style={s.greet}>
                {greetWord}
                {name ? `, ${name}` : ''}
              </Text>
              <View style={s.iconRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.a11y_lang}
                  onPress={() => setLang(lang === 'sq' ? 'en' : 'sq')}
                  style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={s.iconText}>{t.lang_toggle}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.a11y_create}
                  onPress={() => router.push('/create')}
                  style={({ pressed }) => [s.iconBtn, s.iconBtnFilled, pressed && { opacity: 0.8 }]}
                >
                  <Plus color={theme.c.onPrimary} size={22} strokeWidth={2.4} />
                </Pressable>
              </View>
            </View>

            <Display size={wide ? 52 : 38} style={s.hero}>
              {t.hero_q}
            </Display>
            <View style={s.heroMeta}>
              <Text style={s.sub}>{t.feed_subtitle(feed.weekCount)}</Text>
              <Pressable
                accessibilityRole="button"
                ref={diceRef}
                onPress={surprise}
                disabled={!!roll}
                hitSlop={8}
                style={({ pressed }) => [s.surprise, pressed && { opacity: 0.75 }]}
              >
                <Emoji size={15}>🎲</Emoji>
                <Text style={s.surpriseText}>{t.surprise}</Text>
              </Pressable>
            </View>
          </View>

          {/* full-bleed skyline: the city spans the window, not the column */}
          <View style={s.band}>
            <CityBand height={wide ? 120 : 88} />
          </View>

          {!filters.tag && (
            <View style={[s.column, column]}>
              <FriendsStrip />

              {feed.today.length > 0 && (
                <View style={s.today}>
                  <View style={s.sectionHead}>
                    <Display size={wide ? 30 : 26}>{todayTitle}</Display>
                    <Text style={s.sectionCount}>{t.results(feed.today.length)}</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={s.rail}
                    contentContainerStyle={s.railContent}
                  >
                    {feed.today.map((e) => (
                      <StoryCard key={e.id} event={e} source="today_rail" />
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 1 — sticky filter bar */}
        <FilterBar state={filterState} maxWidth={maxW} />

        {/* 2 — the rest of the week, grouped by time */}
        <View style={[s.column, column, s.results]}>
          {filtering && <Text style={s.count}>{t.results(feed.list.length)}</Text>}

          {feed.sections.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>{filtering ? t.no_results : t.empty_week}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={filtering ? filterState.reset : () => router.push('/create')}
                style={({ pressed }) => [s.emptyBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={s.emptyBtnText}>{filtering ? t.reset_filters : t.create_event}</Text>
              </Pressable>
            </View>
          ) : (
            feed.sections.map(({ key, items }) => (
              <View key={key} style={s.section}>
                <View style={s.sectionHead}>
                  <Display size={wide ? 30 : 26}>{sectionTitle(key)}</Display>
                  <Text style={s.sectionCount}>{t.results(items.length)}</Text>
                </View>
                <View style={[s.grid, { gap: wide ? GAP : 0 }]}>
                  {items.map((e) => (
                    <View key={e.id} style={{ width: itemWidth }}>
                      <EventCard event={e} popular={feed.popularIds.has(e.id)} />
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      {roll && <DiceRoll key={roll.key} event={roll.event} origin={roll.origin} onOpen={openRolled} />}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.c.bg },
    scroll: { paddingBottom: space.xxxl },
    column: { width: '100%', alignSelf: 'center', paddingHorizontal: space.lg },

    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm },
    greet: { color: t.c.textDim, fontSize: 15, fontWeight: '600', flexShrink: 1 },
    iconRow: { flexDirection: 'row', gap: space.sm },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.c.surface,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    iconBtnFilled: { backgroundColor: t.c.primary, borderColor: t.c.primary },
    iconText: { color: t.c.text, fontSize: 13, fontWeight: '800' },

    hero: { marginTop: space.lg },
    heroMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      marginTop: space.sm,
    },
    sub: { color: t.c.textDim, fontSize: 15 },
    surprise: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
    surpriseText: { color: t.c.text, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },

    band: { marginTop: space.sm, marginBottom: space.xl },

    today: { marginTop: space.xs, marginBottom: space.xl, gap: space.md },
    rail: { flexGrow: 0, marginHorizontal: -space.lg },
    railContent: { paddingHorizontal: space.lg },


    results: { paddingTop: space.md },
    count: { color: t.c.textDim, fontSize: 14, fontWeight: '600' },
    section: { marginTop: space.xl, gap: space.md },
    sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md },
    sectionCount: { color: t.c.textDim, fontSize: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },

    empty: {
      marginTop: space.xl,
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: space.lg,
      gap: space.md,
      alignItems: 'flex-start',
    },
    emptyText: { color: t.c.text, fontSize: 16 },
    emptyBtn: {
      backgroundColor: t.c.primary,
      borderRadius: 999,
      paddingHorizontal: space.lg,
      minHeight: 44,
      justifyContent: 'center',
    },
    emptyBtnText: { color: t.c.onPrimary, fontWeight: '700', fontSize: 15 },
  }),
);
