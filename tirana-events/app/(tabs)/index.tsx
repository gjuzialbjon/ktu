import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { Category, EventItem, NEIGHBORHOODS, Neighborhood } from '../../lib/types';
import { CATEGORY_EMOJI, makeStyles, radius, space, useTheme } from '../../lib/theme';
import { TimeBucket, WhenFilter, bucketOf, isThisWeek, matchesWhen } from '../../lib/format';
import { EventCard } from '../../components/EventCard';
import { StoryCard } from '../../components/StoryCard';
import { FriendsStrip } from '../../components/FriendsStrip';
import { CityBand } from '../../components/CityBand';
import { Chevron, Chip, Display, Emoji } from '../../components/ui';
import { track } from '../../lib/analytics';
import { useNow } from '../../lib/useNow';

const CATEGORIES: Category[] = ['community', 'music', 'nightlife', 'culture', 'sports', 'food', 'outdoors', 'business'];
/** Today has its own row above the filters, so the bar only browses what comes after. */
const WHEN_OPTIONS: WhenFilter[] = ['all', 'tomorrow', 'weekend'];
const GAP = space.lg;
const TONIGHT_FROM_HOUR = 17;

type Panel = 'where' | 'more' | null;

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
  const params = useLocalSearchParams<{ tag?: string }>();
  const tag = typeof params.tag === 'string' && params.tag.length > 0 ? params.tag : null;

  const [when, setWhen] = useState<WhenFilter>('all');
  const [hood, setHood] = useState<Neighborhood | null>(null);
  const [cat, setCat] = useState<Category | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const nowMs = useNow();
  const now = useMemo(() => new Date(nowMs), [nowMs]);

  const { width } = useWindowDimensions();
  const cols = width >= 1280 ? 3 : width >= 768 ? 2 : 1;
  const maxW = cols > 1 ? 1240 : 640;
  const contentWidth = Math.min(width, maxW) - space.lg * 2;
  // Fixed card width: a lone card keeps its column size instead of stretching.
  const itemWidth = cols > 1 ? (contentWidth - GAP * (cols - 1)) / cols : contentWidth;
  const column = { maxWidth: maxW };

  const extraFilters = (cat ? 1 : 0) + (freeOnly ? 1 : 0);
  const filtering = when !== 'all' || !!hood || extraFilters > 0 || !!tag;

  const upcoming = useMemo(
    () => [...events].filter((e) => bucketOf(e.startsAt, now) !== 'past').sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [events, now],
  );

  // The highlight row: everything still to come today, unfiltered.
  const todayItems = useMemo(() => upcoming.filter((e) => bucketOf(e.startsAt, now) === 'today'), [upcoming, now]);

  // Below the bar: from tomorrow on. A tag (tapped on a card) is a search, so it includes today.
  const list = useMemo(
    () =>
      upcoming.filter(
        (e) =>
          (tag || bucketOf(e.startsAt, now) !== 'today') &&
          matchesWhen(e.startsAt, when, now) &&
          (!hood || e.neighborhood === hood) &&
          (!cat || e.category === cat) &&
          (!freeOnly || e.priceType === 'free') &&
          (!tag || e.tags.includes(tag)),
      ),
    [upcoming, when, hood, cat, freeOnly, tag, now],
  );

  const sections = useMemo(() => {
    const order: TimeBucket[] = ['today', 'tomorrow', 'weekend', 'later'];
    const map = new Map<TimeBucket, EventItem[]>();
    for (const e of list) {
      const b = bucketOf(e.startsAt, now);
      map.set(b, [...(map.get(b) ?? []), e]);
    }
    return order.map((key) => ({ key, items: map.get(key) ?? [] })).filter((x) => x.items.length > 0);
  }, [list, now]);

  // "Popular" is relative: at most the two busiest events in view, and only if busy.
  const popularIds = useMemo(() => {
    const ranked = [...list].sort((a, b) => b.goingUserIds.length - a.goingUserIds.length);
    return new Set(ranked.filter((e) => e.goingUserIds.length >= 4).slice(0, 2).map((e) => e.id));
  }, [list]);

  const weekCount = useMemo(() => events.filter((e) => isThisWeek(e.startsAt, now)).length, [events, now]);

  const hour = now.getHours();
  const greetWord = hour < 12 ? t.greet_morning : hour < 18 ? t.greet_day : t.greet_evening;
  const name = profile.name.trim().split(' ')[0];
  const todayTitle = hour >= TONIGHT_FROM_HOUR ? t.sec_today : t.sec_today_day;

  const surprise = () => {
    const pool = upcoming.filter((e) => new Date(e.startsAt).getTime() > Date.now());
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    track('surprise_me', { eventId: pick.id, tags: pick.tags });
    router.push(`/event/${pick.id}`);
  };

  const resetFilters = () => {
    setWhen('all');
    setHood(null);
    setCat(null);
    setFreeOnly(false);
    setPanel(null);
    if (tag) router.setParams({ tag: '' });
  };

  const sectionTitle = (key: TimeBucket) =>
    key === 'today' ? todayTitle : key === 'tomorrow' ? t.sec_tomorrow : key === 'weekend' ? t.sec_weekend : t.sec_later;
  const whenLabel = (w: WhenFilter) =>
    w === 'all' ? t.when_all : w === 'tomorrow' ? t.when_tomorrow : w === 'weekend' ? t.when_weekend : t.when_today;
  const hoodLabel = hood ? t[`hood_${hood}` as const] : t.hood_all;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView stickyHeaderIndices={[1]} contentContainerStyle={s.scroll}>
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
                  <Text style={[s.iconText, s.plus]}>+</Text>
                </Pressable>
              </View>
            </View>

            <Display size={cols > 1 ? 52 : 38} style={s.hero}>
              {t.hero_q}
            </Display>
            <View style={s.heroMeta}>
              <Text style={s.sub}>{t.feed_subtitle(weekCount)}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={surprise}
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
            <CityBand height={cols > 1 ? 120 : 88} />
          </View>

          {!tag && (
            <View style={[s.column, column]}>
              <FriendsStrip />

              {todayItems.length > 0 && (
                <View style={s.today}>
                  <View style={s.sectionHead}>
                    <Display size={cols > 1 ? 30 : 26}>{todayTitle}</Display>
                    <Text style={s.sectionCount}>{t.results(todayItems.length)}</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={s.rail}
                    contentContainerStyle={s.railContent}
                  >
                    {todayItems.map((e) => (
                      <StoryCard key={e.id} event={e} source="today_rail" />
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 1 — sticky filter bar: one row, panels open inline beneath it */}
        <View style={s.barWrap}>
          <View style={[s.column, column]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.barRow}>
              <View style={s.segment} accessibilityRole="radiogroup">
                {WHEN_OPTIONS.map((w) => {
                  const active = when === w;
                  return (
                    <Pressable
                      key={w}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      onPress={() => setWhen(w)}
                      style={[s.segItem, active && { backgroundColor: theme.c.text }]}
                    >
                      <Text style={[s.segText, { color: active ? theme.c.bg : theme.c.text }]}>{whenLabel(w)}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <DisclosureButton
                label={hoodLabel}
                a11yLabel={t.a11y_where(hoodLabel)}
                open={panel === 'where'}
                active={!!hood}
                onPress={() => setPanel(panel === 'where' ? null : 'where')}
              />
              <DisclosureButton
                label={extraFilters > 0 ? t.more_filters_n(extraFilters) : t.more_filters}
                open={panel === 'more'}
                active={extraFilters > 0}
                onPress={() => setPanel(panel === 'more' ? null : 'more')}
              />
              {tag && (
                <Chip
                  label={`#${tag}  ✕`}
                  active
                  accessibilityLabel={t.a11y_clear_tag(tag)}
                  onPress={() => router.setParams({ tag: '' })}
                />
              )}
            </ScrollView>

            {panel === 'where' && (
              <View style={s.panel}>
                <Chip label={t.hood_all} active={!hood} onPress={() => { setHood(null); setPanel(null); }} />
                {NEIGHBORHOODS.map((h) => (
                  <Chip
                    key={h}
                    label={t[`hood_${h}` as const]}
                    active={hood === h}
                    onPress={() => {
                      setHood(hood === h ? null : h);
                      setPanel(null);
                    }}
                  />
                ))}
              </View>
            )}
            {panel === 'more' && (
              <View style={s.panel}>
                <Chip label={t.free} active={freeOnly} onPress={() => setFreeOnly((v) => !v)} />
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c}
                    emoji={CATEGORY_EMOJI[c]}
                    label={t[`cat_${c}` as const]}
                    active={cat === c}
                    onPress={() => setCat(cat === c ? null : c)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* 2 — the rest of the week, grouped by time */}
        <View style={[s.column, column, s.results]}>
          {filtering && <Text style={s.count}>{t.results(list.length)}</Text>}

          {sections.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>{filtering ? t.no_results : t.empty_week}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={filtering ? resetFilters : () => router.push('/create')}
                style={({ pressed }) => [s.emptyBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={s.emptyBtnText}>{filtering ? t.reset_filters : t.create_event}</Text>
              </Pressable>
            </View>
          ) : (
            sections.map(({ key, items }) => (
              <View key={key} style={s.section}>
                <View style={s.sectionHead}>
                  <Display size={cols > 1 ? 30 : 26}>{sectionTitle(key)}</Display>
                  <Text style={s.sectionCount}>{t.results(items.length)}</Text>
                </View>
                <View style={[s.grid, { gap: cols > 1 ? GAP : 0 }]}>
                  {items.map((e) => (
                    <View key={e.id} style={{ width: itemWidth }}>
                      <EventCard event={e} popular={popularIds.has(e.id)} />
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DisclosureButton({
  label,
  a11yLabel,
  open,
  active,
  onPress,
}: {
  label: string;
  a11yLabel?: string;
  open: boolean;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const s = useStyles();
  const fg = active ? t.c.bg : t.c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={({ pressed }) => [
        s.disclosure,
        active ? { backgroundColor: t.c.text, borderColor: t.c.text } : null,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[s.disclosureText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
      <Chevron open={open} color={fg} />
    </Pressable>
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
    plus: { color: t.c.onPrimary, fontSize: 22, lineHeight: 24 },

    hero: { marginTop: space.lg },
    heroMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, marginTop: space.sm },
    sub: { color: t.c.textDim, fontSize: 15 },
    surprise: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
    surpriseText: { color: t.c.text, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },

    band: { marginTop: space.sm, marginBottom: space.xl },

    today: { marginTop: space.xs, marginBottom: space.xl, gap: space.md },
    rail: { flexGrow: 0, marginHorizontal: -space.lg },
    railContent: { paddingHorizontal: space.lg },

    barWrap: {
      backgroundColor: t.c.bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.c.border,
      paddingVertical: space.sm,
    },
    barRow: { alignItems: 'center', gap: space.sm, paddingRight: space.lg },
    segment: {
      flexDirection: 'row',
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: 999,
      padding: 3,
    },
    segItem: { minHeight: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
    segText: { fontSize: 14, fontWeight: '700' },
    disclosure: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 44,
      paddingHorizontal: space.md,
      borderRadius: 999,
      borderWidth: t.outline,
      borderColor: t.c.border,
      backgroundColor: t.c.surface,
    },
    disclosureText: { fontSize: 14, fontWeight: '600', maxWidth: 170 },
    panel: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.sm, paddingTop: space.sm },

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
