import React, { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Rail } from '@/components/Rail';

import { Animated, Platform, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import { FeedRanking, FeedSection, HIGHLIGHTS_MAX, NO_FILTERS, buildFeed, isFiltering, pickHighlights, railsByCategory } from '@/features/feed/buildFeed';
import { TIER_WEIGHT, arrangeRail, forYou, isIn, CAN_PICK_CITY, cityName, type Category, type EventItem, type SpokenLang, LANG_ROW_TITLE, langsAvailable, railsByLanguage } from '@ktu/shared';
import { TodayTimeline } from '@/features/feed/TodayTimeline';
import { pickToday } from '@/features/feed/todayTop';
import { CountPill, EventRail } from '@/features/feed/EventRail';
import { HighlightsCarousel } from '@/features/feed/HighlightsCarousel';
import { SkyBackdrop } from '@/features/feed/SkyBackdrop';
import { latenessOf, skyStops } from '@/features/feed/sky';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useFeedFilters } from '@/features/feed/useFeedFilters';
import { FilterBar } from '@/features/feed/FilterBar';
import { CityPicker } from '@/features/city/CityPicker';
import MapPin from 'lucide-react-native/icons/map-pin';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import { DiceOrigin, DiceRoll } from '@/features/feed/DiceRoll';
import { liveCollections } from '@/data/collections';
import { CollectionCard } from '@/features/collections/CollectionCard';

/** today's timeline shows the next few; a busy day (30+ events) would bury everything below */
const TODAY_MAX = 5;

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
  const { cityEvents: events, profile, rsvps, events: allEvents, hiddenEvents, likes, tierOf, friendsShown } = useStore();
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

  // host standing (data/hostStanding): reliable hosts rise, empty or flaky ones sink. Your own
  // events, ones you are in, and ones someone you follow is going to keep their place.
  const ranking = useMemo<FeedRanking>(
    () => ({
      tier: tierOf,
      vouched: (e) => e.organizer.id === 'me' || !!rsvps[e.id] || e.goingUserIds.some((id) => friendsShown.includes(id)),
    }),
    [tierOf, rsvps, friendsShown],
  );
  const feed = useMemo(() => buildFeed(events, filters, now, ranking), [events, filters, now, ranking]);
  const [unfolded, setUnfolded] = useState<ReadonlySet<string>>(() => new Set());
  const filtering = isFiltering(filters);
  const reduceMotion = useReducedMotion();
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
      feed.railPool.filter((e) => !todayIds.has(e.id) && !isIn(rsvps[e.id])),
      profile.interests,
      joinedTags,
    );
  }, [allEvents, rsvps, feed.railPool, feed.today, profile.interests]);
  // a busy day shows its favourites (yours first), still in time order
  const todayShown = useMemo(
    () =>
      pickToday(feed.today, TODAY_MAX, new Set(Object.keys(rsvps)), new Set(Object.keys(likes)), (e) =>
        ranking.vouched(e) ? 1 : TIER_WEIGHT[ranking.tier(e)],
      ),
    [feed.today, rsvps, likes, ranking],
  );
  const highlights = useMemo(
    () => pickHighlights(feed.curatedPool, friendsShown, now, HIGHLIGHTS_MAX, ranking),
    [feed.curatedPool, friendsShown, now, ranking],
  );
  const rails = useMemo(() => {
    const todayIds = new Set(feed.today.map((e) => e.id));
    return railsByCategory(feed.railPool.filter((e) => !todayIds.has(e.id))).map((r) => ({
      ...r,
      items: arrangeRail(r.items, ranking.tier, ranking.vouched),
    }));
  }, [feed.railPool, feed.today, ranking]);
  // rows for visitors: events that work in English / Italian / Spanish. Uses everything
  // upcoming (today included): someone here for three days wants tonight too.
  const langRails = useMemo(
    () => railsByLanguage(feed.railPool).map((r) => ({ ...r, items: arrangeRail(r.items, ranking.tier, ranking.vouched) })),
    [feed.railPool, ranking],
  );
  // curated lists ("Sapo erdhe ne Tirane", "Fundjave pa para"…), only those with enough events
  const collections = useMemo(() => liveCollections(feed.curatedPool, now), [feed.curatedPool, now]);
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
  // "see all" on a category row: filter the week list below to it and jump there
  const [leadH, setLeadH] = useState(0);
  // is the filter bar docked at the top (scrolled past everything above it)?
  const [docked, setDocked] = useState(false);
  // where the sky is drawn (the safe area box) relative to the scroll view, for the docked bar
  const [skyBox, setSkyBox] = useState({ top: 0, h: 0 });
  // the bar's sky follows the scroll (same value that moves the bar), so it always lines up
  // with the sky around it: invisible at rest, a solid cover once docked, no switch between
  const skyShift = useMemo(() => {
    // where the bar's top is in the scroll view: leadH - y until it docks at 0
    const barTop = scrollY.interpolate({
      inputRange: [0, Math.max(leadH, 1)],
      outputRange: [leadH, 0],
      extrapolateLeft: 'extend',
      extrapolateRight: 'clamp',
    });
    return Animated.multiply(Animated.add(barTop, skyBox.top), -1);
  }, [scrollY, leadH, skyBox.top]);
  // the bar's bottom edge fades in over the last few pixels before docking
  const edgeOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: leadH > 16 ? [leadH - 16, leadH] : [0, 1],
        outputRange: leadH > 16 ? [0, 1] : [0, 0],
        extrapolate: 'clamp',
      }),
    [scrollY, leadH],
  );
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: Platform.OS !== 'web',
        listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
          const y = e.nativeEvent.contentOffset.y;
          const past = y > viewportH * 0.9;
          setShowTop((v) => (v === past ? v : past));
          const isDocked = leadH > 0 && y >= leadH - 2;
          setDocked((v) => (v === isDocked ? v : isDocked));
        },
      }),
    [scrollY, viewportH, leadH],
  );
  const jumpToList = () => scrollRef.current?.scrollTo({ y: leadH, animated: !reduceMotion });
  // picking a filter docks the bar at the top so the results get the screen: a glide from
  // above (you see where you went), a jump from far below (the list just got shorter)
  const onFiltersChanged = useEffectEvent(() => {
    if (!filtering && !showTop) return;
    if (!docked) scrollRef.current?.scrollTo({ y: leadH, animated: !reduceMotion });
    else if (showTop) scrollRef.current?.scrollTo({ y: leadH, animated: false });
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
    const pool = feed.railPool.filter((e) => new Date(e.startsAt).getTime() > Date.now());
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
    <SafeAreaView
      style={s.safe}
      edges={['top']}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        setSkyBox((p) => (p.h === h ? p : { ...p, h }));
      }}
    >
      <SkyBackdrop lateness={lateness} />
      <Animated.ScrollView
        ref={scrollRef}
        onLayout={(e) => {
          const top = e.nativeEvent.layout.y;
          setSkyBox((p) => (p.top === top ? p : { ...p, top }));
        }}
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

          {/* events before controls: the carousel leads; it sits above the bar, so it stays put
              (and visible) while filters change what is below */}
          {highlights.length > 0 && (
            <View style={[s.column, column, s.highlights]}>
              <HighlightsCarousel title={t.highlights_title} events={highlights} maxWidth={maxW} />
            </View>
          )}
        </View>

        {/* 1 — sticky filter bar, under the carousel; docks at the top once you scroll past it */}
        <FilterBar state={filterState} city={profile.city} maxWidth={maxW} langs={langChips} resultCount={feed.list.length}
          backdrop={
            <Animated.View
              style={{ position: 'absolute', left: 0, right: 0, top: 0, height: skyBox.h, transform: [{ translateY: skyShift }] }}
            >
              {/* the sky's top colour carried on above it: on a fast flick the browser docks the
                  bar a frame before this shift catches up, and that frame then shows sky, not
                  the rows behind (the gap would open across the top of the buttons) */}
              <View style={[s.skyAbove, { backgroundColor: theme.sky.day[0] }]} />
              <Animated.View style={[s.skyAbove, { backgroundColor: theme.sky.evening[0], opacity: lateness }]} />
              <SkyBackdrop lateness={lateness} />
            </Animated.View>
          }
          edgeOpacity={edgeOpacity}
        />

        {/* 2 — browsing: the rows; with any filter on, they step aside for the matching list */}
        <View style={{ paddingTop: space.sm }} onLayout={(e) => setBodyY(e.nativeEvent.layout.y)}>

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
                  {feed.today.length > TODAY_MAX ? t.today_top_note : t.today_note} ↓
                </Hand>
              </View>
              <View
                onLayout={(e) => {
                  const list = e.nativeEvent.layout.y;
                  setTodayTop((p) => (p?.list === list ? p : { section: p?.section ?? 0, list }));
                }}
              >
                <TodayTimeline events={todayShown} onRowLayout={onRowLayout} />
              </View>
              {/* a busy day stays one glance long: the rest are one tap away, in the Sot list */}
              {feed.today.length > TODAY_MAX && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    track('today_see_all', { n: feed.today.length });
                    filterState.setWhen('today');
                    jumpToList();
                  }}
                  style={({ pressed }) => [s.todayAll, pressed && { opacity: 0.7 }]}
                >
                  <Text style={s.todayAllText}>{t.today_all(feed.today.length)} →</Text>
                </Pressable>
              )}
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
                  <Rail
                    style={s.collectionRail}
                    contentContainerStyle={s.collectionRailContent}
                  >
                    {collections.map(({ collection, items, cover }) => (
                      <CollectionCard key={collection.id} collection={collection} items={items} cover={cover} />
                    ))}
                  </Rail>
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
              feed.sections.map(({ key, items, folded }) => (
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
                    {/* a host's events past their cap: one line each, opened on tap */}
                    {folded.flatMap((f) =>
                      unfolded.has(`${key}:${f.hostId}`)
                        ? f.events.map((e) => (
                            <View key={e.id} style={{ width: itemWidth }}>
                              <EventCard event={e} />
                            </View>
                          ))
                        : [
                            <Pressable
                              key={`more-${f.hostId}`}
                              accessibilityRole="button"
                              onPress={() => {
                                track('host_unfold', { hostId: f.hostId, n: f.events.length });
                                setUnfolded((prev) => new Set(prev).add(`${key}:${f.hostId}`));
                              }}
                              style={({ pressed }) => [s.foldedRow, { width: itemWidth }, pressed && { opacity: 0.85 }]}
                            >
                              <Text style={s.foldedText}>{t.more_from(f.events.length, f.hostName)}</Text>
                            </Pressable>,
                          ],
                    )}
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
    skyAbove: { position: 'absolute', left: 0, right: 0, bottom: '100%', height: 600 },
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
    highlights: { marginTop: space.md, marginBottom: space.sm },

    today: { marginBottom: space.xl, gap: space.sm },
    rails: { gap: space.md, marginBottom: space.md },
    vibeHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md, marginTop: space.md },


    results: { paddingTop: space.md },
    count: { color: t.c.textDim, fontSize: 14, fontWeight: '600' },
    section: { marginTop: space.xl, gap: space.md },
    todayAll: {
      marginTop: space.sm,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      borderRadius: radius.lg,
      borderWidth: t.outline,
      borderColor: t.c.border,
      backgroundColor: t.c.surface,
    },
    todayAllText: { color: t.c.social, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
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
    foldedRow: {
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      marginBottom: 18,
      borderRadius: radius.lg,
      borderWidth: t.outline,
      borderColor: t.c.border,
      backgroundColor: t.c.surface,
    },
    foldedText: { color: t.c.social, fontSize: 15, fontWeight: '700' },
    collectionRailContent: { paddingHorizontal: space.lg, paddingTop: 6, paddingBottom: 10 },
    hiddenNote: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginTop: space.xl, minHeight: 44 },
    hiddenText: { color: t.c.textDim, fontSize: 14 },
    hiddenLink: { color: t.c.text, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  }),
);
