import React, { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/data/store';
import { CATEGORY_EMOJI, makeStyles, radius, space, useTheme } from '@/lib/theme';
import { EventCard } from '@/components/EventCard';
import { FriendsStrip } from '@/components/FriendsStrip';
import { CityBand } from '@/components/CityBand';
import { Chevron, Display, Emoji, Hand, Sticker } from '@/components/ui';
import { TopBar } from '@/components/TopBar';
import { track } from '@/lib/analytics';
import { useNow } from '@/hooks/useNow';
import { FeedSection, NO_FILTERS, buildFeed, isFiltering, pickHighlights, railsByCategory } from '@/features/feed/buildFeed';
import { TodayTimeline } from '@/features/feed/TodayTimeline';
import { CountPill, EventRail } from '@/features/feed/EventRail';
import { SkyBackdrop } from '@/features/feed/SkyBackdrop';
import { latenessOf, skyStops } from '@/features/feed/sky';
import { forYou, isIn } from '@/data/access';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useFeedFilters } from '@/features/feed/useFeedFilters';
import { FilterBar } from '@/features/feed/FilterBar';
import { CityPicker } from '@/features/city/CityPicker';
import { CAN_PICK_CITY, cityName } from '@/data/cities';
import MapPin from 'lucide-react-native/icons/map-pin';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import { DiceOrigin, DiceRoll } from '@/features/feed/DiceRoll';
import type { Category, EventItem, SpokenLang } from '@/data/types';
import { LANG_ROW_TITLE, langsAvailable, railsByLanguage } from '@/data/languages';
import { liveCollections } from '@/data/collections';
import { CollectionCard } from '@/features/collections/CollectionCard';

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
 * Reading order: weather · city · you → greeting + question (skyline behind) → don't miss
 * → today (earliest to latest, the sky warming as you go) → for you → by vibe → crew →
 * filter bar (sticky) → the rest of the week. Filters apply to what sits below them.
 */
export default function Home() {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { cityEvents: events, profile, rsvps, events: allEvents, hiddenEvents } = useStore();
  const { height: viewportH, width: viewportW } = useWindowDimensions();
  const [cityOpen, setCityOpen] = useState(false);
  const router = useRouter();
  const filterState = useFeedFilters(profile.city);
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
  // what your "never show me" topics took out this week, so nothing vanishes without a word
  const hiddenCount = useMemo(() => buildFeed(hiddenEvents, NO_FILTERS, now).upcoming.length, [hiddenEvents, now]);

  const hour = now.getHours();
  const greetWord = hour < 12 ? t.greet_morning : hour < 18 ? t.greet_day : t.greet_evening;
  const name = profile.name.trim().split(' ')[0];
  const todayTitle = hour >= TONIGHT_FROM_HOUR ? t.sec_today : t.sec_today_day;

  // for you: your picked interests plus the tags of what you joined before
  const suggested = useMemo(() => {
    const joinedTags = allEvents.filter((e) => isIn(rsvps[e.id])).flatMap((e) => e.tags);
    const todayIds = new Set(feed.today.map((e) => e.id));
    return forYou(
      feed.upcoming.filter((e) => !todayIds.has(e.id) && !isIn(rsvps[e.id])),
      profile.interests,
      joinedTags,
    );
  }, [allEvents, rsvps, feed.upcoming, feed.today, profile.interests]);
  const highlights = useMemo(() => pickHighlights(feed.upcoming, profile.follows, now), [feed.upcoming, profile.follows, now]);
  const rails = useMemo(() => {
    const todayIds = new Set(feed.today.map((e) => e.id));
    return railsByCategory(feed.upcoming.filter((e) => !todayIds.has(e.id)));
  }, [feed.upcoming, feed.today]);
  // rows for visitors: events that work in English / Italian / Spanish. Uses everything
  // upcoming (today included): someone here for three days wants tonight too.
  const langRails = useMemo(() => railsByLanguage(feed.upcoming), [feed.upcoming]);
  // curated lists ("Sapo erdhe ne Tirane", "Fundjave pa para"…), only those with enough events
  const collections = useMemo(() => liveCollections(feed.upcoming, now), [feed.upcoming, now]);
  const langChips = useMemo(() => langsAvailable(feed.upcoming), [feed.upcoming]);
  // with the app in English, the English row leads; otherwise language rows follow the categories
  const langFirst = lang === 'en' ? langRails.filter((r) => r.lang === 'en') : [];
  const langLater = langRails.filter((r) => !langFirst.includes(r));

  // --- the sky: scroll position → how late it feels (see features/feed/sky.ts)
  const [scrollY] = useState(() => new Animated.Value(0));
  const [todayTop, setTodayTop] = useState<{ section: number; list: number } | null>(null);
  // where the body (everything under the filter bar) starts in the scroll content
  const [bodyY, setBodyY] = useState(0);
  const [rowCenters, setRowCenters] = useState<Record<string, number>>({});
  const onRowLayout = useCallback((id: string, y: number) => setRowCenters((m) => (m[id] === y ? m : { ...m, [id]: y })), []);
  const nowLateness = latenessOf(now);
  const lateness = useMemo(() => {
    const base = todayTop ? bodyY + todayTop.section + todayTop.list : null;
    const rows =
      base == null
        ? []
        : feed.today
            .filter((e) => rowCenters[e.id] != null)
            .map((e) => ({ center: base + rowCenters[e.id], lateness: latenessOf(new Date(e.startsAt)) }));
    const stops = skyStops(nowLateness, rows, viewportH);
    return scrollY.interpolate({
      inputRange: stops.map((p) => p.at),
      outputRange: stops.map((p) => p.lateness),
      extrapolate: 'clamp',
    });
  }, [todayTop, bodyY, rowCenters, feed.today, nowLateness, viewportH, scrollY]);
  // "back to top" shows once you are about a screen down; state flips only when crossing that line
  const scrollRef = useRef<React.ComponentRef<typeof Animated.ScrollView>>(null);
  const [showTop, setShowTop] = useState(false);
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: Platform.OS !== 'web',
        listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
          const past = e.nativeEvent.contentOffset.y > viewportH * 0.9;
          setShowTop((v) => (v === past ? v : past));
        },
      }),
    [scrollY, viewportH],
  );
  // "see all" on a category row: filter the week list below to it and jump there
  const [leadH, setLeadH] = useState(0);
  const jumpToList = () => scrollRef.current?.scrollTo({ y: leadH, animated: !reduceMotion });
  // when filters change while you are far down, bring the results' start up under the bar
  const onFiltersChanged = useEffectEvent(() => {
    if (showTop) scrollRef.current?.scrollTo({ y: leadH, animated: false });
  });
  useEffect(() => onFiltersChanged(), [filters]);
  const seeCategory = (cat: Category) => {
    track('rail_see_all', { cat });
    filterState.setCat(cat);
    jumpToList();
  };
  const seeLanguage = (l: SpokenLang) => {
    track('rail_see_all', { lang: l });
    filterState.setLang(l);
    jumpToList();
  };
  const langRail = ({ lang: l, items }: { lang: Exclude<SpokenLang, 'sq'>; items: EventItem[] }) => (
    <EventRail
      key={l}
      title={LANG_ROW_TITLE[l]}
      emoji="🗣️"
      events={items}
      source={`rail_lang_${l}`}
      onSeeAll={() => seeLanguage(l)}
    />
  );
  const toTop = () => {
    track('scroll_to_top');
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
  };

  // the question always fits on one line: size it from the column width (~0.56em per glyph in
  // the heading face), between a readable floor and the design size
  const heroSize = Math.max(15, Math.min(wide ? 40 : 22, Math.floor((Math.min(viewportW, maxW) - space.lg * 2) / (t.hero_q.length * 0.56))));

  // one orchestrated moment: the greeting sticker is pressed on when home first appears
  const reduceMotion = useReducedMotion();
  const [stick] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) {
      stick.setValue(1);
      return;
    }
    Animated.spring(stick, { toValue: 1, friction: 6, tension: 90, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [stick, reduceMotion]);

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
      <SkyBackdrop lateness={lateness} />
      <Animated.ScrollView
        ref={scrollRef}
        stickyHeaderIndices={[1]}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
        <View onLayout={(e) => setLeadH(e.nativeEvent.layout.height)}>
          {/* the skyline sits behind the greeting instead of taking its own row */}
          <View style={s.heroArea}>
          <View pointerEvents="none" style={s.bandBehind}>
            <CityBand height={wide ? 110 : 64} />
          </View>
          <View style={[s.column, column]}>
            <TopBar>
              {/* city switcher only when more than one city is live (data/cities.ts LIVE_CITIES) */}
              {CAN_PICK_CITY && (
                <>
                  {/* the city everything below is about; tap to switch */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.a11y_city(cityName(profile.city, lang))}
                    onPress={() => setCityOpen(true)}
                    hitSlop={6}
                    style={({ pressed }) => [s.cityPill, pressed && { opacity: 0.8 }]}
                  >
                    <MapPin color={theme.c.text} size={16} strokeWidth={2.2} />
                    <Text style={s.cityText} numberOfLines={1}>
                      {cityName(profile.city, lang)}
                    </Text>
                    <Chevron open={false} color={theme.c.text} />
                  </Pressable>
                </>
              )}
              {/* the empty middle of the top bar holds the greeting */}
              {!CAN_PICK_CITY && (
                <Animated.View
                  style={{
                    opacity: stick,
                    transform: [
                      { scale: stick.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
                      { rotate: stick.interpolate({ inputRange: [0, 1], outputRange: ['-9deg', '0deg'] }) },
                    ],
                  }}
                >
                  <Sticker tone={0} tilt={-3} size={19}>
                    {greetWord}
                    {name ? `, ${name}` : ''} 👋
                  </Sticker>
                </Animated.View>
              )}
            </TopBar>

            <Display size={heroSize} numberOfLines={1} style={s.hero}>
              {t.hero_q}
            </Display>
            <View style={s.metaRow}>
              <Text style={s.sub} numberOfLines={1}>
                {/* narrow phones: just the count, so the line never gets cut off */}
                {viewportW < 360 ? t.city_week(feed.weekCount) : t.feed_subtitle(feed.weekCount)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.surprise}
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

          </View>
        </View>

        {/* 1 — sticky filter bar, right under the greeting so it is one thumb away */}
        <FilterBar state={filterState} city={profile.city} maxWidth={maxW} langs={langChips} resultCount={feed.list.length} />

        {/* 2 — browsing: the rows; with any filter on, they step aside for the matching list */}
        <View onLayout={(e) => setBodyY(e.nativeEvent.layout.y)}>
          {/* a few events worth opening, before anything else */}
          {!filtering && highlights.length > 0 && (
            <View style={[s.column, column, s.highlights]}>
              <EventRail title={t.highlights_title} events={highlights} source="highlights" size="wide" maxWidth={maxW} />
            </View>
          )}

          {!filtering && feed.today.length > 0 && (
            <View
              style={[s.column, column, s.today]}
              onLayout={(e) => {
                const section = e.nativeEvent.layout.y;
                setTodayTop((p) => (p?.section === section ? p : { section, list: p?.list ?? 0 }));
              }}
            >
              <View style={s.todayHead}>
                <Display size={wide ? 26 : 19}>{todayTitle}</Display>
                <Hand size={18} color={theme.c.textDim}>
                  {t.today_note} ↓
                </Hand>
              </View>
              <View
                onLayout={(e) => {
                  const list = e.nativeEvent.layout.y;
                  setTodayTop((p) => (p?.list === list ? p : { section: p?.section ?? 0, list }));
                }}
              >
                <TodayTimeline events={feed.today} onRowLayout={onRowLayout} />
              </View>
            </View>
          )}

          {!filtering && (
            <View style={[s.column, column, s.rails]}>
              {langFirst.map(langRail)}
              <EventRail title={t.for_you_title} note={t.for_you_hint} events={suggested} source="for_you" />
              {collections.length > 0 && (
                <View style={{ gap: 2 }}>
                  <Display size={19}>{t.collections_title}</Display>
                  <Text style={s.railNote}>{t.collections_note}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={s.collectionRail}
                    contentContainerStyle={s.collectionRailContent}
                  >
                    {collections.map(({ collection, items, cover }) => (
                      <CollectionCard key={collection.id} collection={collection} items={items} cover={cover} />
                    ))}
                  </ScrollView>
                </View>
              )}
              {rails.length > 0 && (
                <View style={s.vibeHead}>
                  <Display size={wide ? 26 : 22}>{t.by_vibe}</Display>
                  <Hand size={18} color={theme.c.textDim}>
                    {t.vibe_note} →
                  </Hand>
                </View>
              )}
              {rails.map(({ cat, items }) => (
                <EventRail
                  key={cat}
                  title={t[`cat_${cat}` as const]}
                  emoji={CATEGORY_EMOJI[cat]}
                  events={items}
                  source={`rail_${cat}`}
                  onSeeAll={() => seeCategory(cat)}
                />
              ))}
              {langLater.map(langRail)}
              <FriendsStrip />
            </View>
          )}

          {/* the rest of the week, grouped by time (everything matching, today included, when filtering) */}
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
                    <Display size={wide ? 30 : 26} style={{ flexShrink: 1 }}>
                      {sectionTitle(key)}
                    </Display>
                    <CountPill n={items.length} label={t.results(items.length)} />
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
            {hiddenCount > 0 && (
              <View style={s.hiddenNote}>
                <Text style={s.hiddenText}>🙈 {t.hidden_count(hiddenCount)} </Text>
                <Pressable accessibilityRole="link" onPress={() => router.push('/profile')} hitSlop={8}>
                  <Text style={s.hiddenLink}>{t.hidden_edit}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
      {CAN_PICK_CITY && <CityPicker visible={cityOpen} onClose={() => setCityOpen(false)} />}
      {showTop && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.back_to_top}
          onPress={toTop}
          hitSlop={6}
          style={({ pressed }) => [s.toTop, pressed && { transform: [{ scale: 0.92 }] }]}
        >
          <ArrowUp color={theme.c.text} size={22} strokeWidth={2.4} />
        </Pressable>
      )}
      {roll && <DiceRoll key={roll.key} event={roll.event} origin={roll.origin} onOpen={openRolled} />}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    // the sky sits behind the scroll view, so the screen itself stays see-through
    safe: { flex: 1, backgroundColor: t.c.bg },
    // bottom-right, above the tab bar, clear of the thumb's scroll path
    toTop: {
      position: 'absolute',
      right: space.lg,
      bottom: space.lg,
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.c.surface,
      borderWidth: t.outline,
      borderColor: t.c.border,
      boxShadow: '0 4px 12px rgba(40,30,60,0.18)',
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
    scroll: { paddingBottom: space.xxxl },
    column: { width: '100%', alignSelf: 'center', paddingHorizontal: space.lg },


    cityPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 44,
      maxWidth: '100%',
      paddingHorizontal: space.md,
      borderRadius: 999,
      backgroundColor: t.c.surface,
      borderWidth: t.outline,
      borderColor: t.c.border,
    },
    cityText: { color: t.c.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
    hero: { marginTop: space.sm },
    sub: { color: t.c.textDim, fontSize: 14, flexShrink: 1 },
    surprise: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
    surpriseText: { color: t.c.text, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },

    heroArea: { paddingBottom: space.md, marginBottom: space.sm },
    // full-bleed, faded, anchored to the bottom of the hero: scenery, not content
    bandBehind: { position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.35 },
    highlights: { marginTop: space.md, marginBottom: space.xs },

    today: { marginBottom: space.xl, gap: space.sm },
    rails: { gap: space.md, marginBottom: space.md },
    vibeHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md, marginTop: space.md },


    results: { paddingTop: space.md },
    count: { color: t.c.textDim, fontSize: 14, fontWeight: '600' },
    section: { marginTop: space.xl, gap: space.md },
    todayHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md, flexWrap: 'wrap' },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
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
    railNote: { color: t.c.textDim, fontSize: 13 },
    collectionRail: { flexGrow: 0, marginHorizontal: -space.lg },
    collectionRailContent: { paddingHorizontal: space.lg, paddingTop: 6, paddingBottom: 10 },
    hiddenNote: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginTop: space.xl, minHeight: 44 },
    hiddenText: { color: t.c.textDim, fontSize: 14 },
    hiddenLink: { color: t.c.text, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  }),
);
