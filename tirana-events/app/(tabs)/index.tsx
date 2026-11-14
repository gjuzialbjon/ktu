import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { useStore } from '../../lib/store';
import { Category, EventItem, NEIGHBORHOODS, Neighborhood } from '../../lib/types';
import { CATEGORY_EMOJI, makeStyles, radius, useTheme } from '../../lib/theme';
import { TimeBucket, WhenFilter, bucketOf, isThisWeek, matchesWhen } from '../../lib/format';
import { EventCard } from '../../components/EventCard';
import { StoryCard } from '../../components/StoryCard';
import { FriendsStrip } from '../../components/FriendsStrip';
import { CityBand } from '../../components/CityBand';
import { Chip, Display, Emoji } from '../../components/ui';
import { track } from '../../lib/analytics';
import { useNow } from '../../lib/useNow';

const CATEGORIES: Category[] = ['community', 'music', 'nightlife', 'culture', 'sports', 'food', 'outdoors', 'business'];
const WHEN_OPTIONS: WhenFilter[] = ['all', 'today', 'tomorrow', 'weekend'];
const SECTIONS: Exclude<TimeBucket, 'past'>[] = ['today', 'tomorrow', 'weekend', 'later'];
const GAP = 16;

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
  const [showMore, setShowMore] = useState(false);
  const nowMs = useNow();
  const now = useMemo(() => new Date(nowMs), [nowMs]);

  const { width } = useWindowDimensions();
  const cols = width >= 1280 ? 3 : width >= 768 ? 2 : 1;
  const maxW = cols > 1 ? 1240 : 640;
  const contentWidth = Math.min(width, maxW) - 32;
  // Fixed card width: a lone card keeps its column size instead of stretching.
  const itemWidth = cols > 1 ? (contentWidth - GAP * (cols - 1)) / cols : contentWidth;

  const extraFilters = (cat ? 1 : 0) + (freeOnly ? 1 : 0);
  const filtering = when !== 'all' || !!hood || extraFilters > 0 || !!tag;

  const list = useMemo(
    () =>
      events
        .filter(
          (e) =>
            matchesWhen(e.startsAt, when, now) &&
            (!hood || e.neighborhood === hood) &&
            (!cat || e.category === cat) &&
            (!freeOnly || e.priceType === 'free') &&
            (!tag || e.tags.includes(tag)),
        )
        // chronological; sponsored items keep their place in time and carry a label
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [events, when, hood, cat, freeOnly, tag, now],
  );

  // Every event lands in exactly one time section: nothing repeats down the page.
  const sections = useMemo(() => {
    const map = new Map<TimeBucket, EventItem[]>();
    for (const e of list) {
      const b = bucketOf(e.startsAt, now);
      if (b === 'past') continue;
      map.set(b, [...(map.get(b) ?? []), e]);
    }
    return SECTIONS.map((key) => ({ key, items: map.get(key) ?? [] })).filter((x) => x.items.length > 0);
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

  const surprise = () => {
    const pool = list.filter((e) => new Date(e.startsAt).getTime() > Date.now());
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
    if (tag) router.setParams({ tag: '' });
  };

  const sectionTitle = (key: Exclude<TimeBucket, 'past'>) =>
    key === 'today' ? t.sec_today : key === 'tomorrow' ? t.sec_tomorrow : key === 'weekend' ? t.sec_weekend : t.sec_later;

  const whenLabel = (w: WhenFilter) =>
    w === 'all' ? t.when_all : w === 'today' ? t.when_today : w === 'tomorrow' ? t.when_tomorrow : t.when_weekend;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[s.content, { maxWidth: maxW }]}>
        {/* Top bar: language, theme, create */}
        <View style={s.topBar}>
          <Text style={s.greet}>
            {greetWord}
            {name ? `, ${name}` : ''}
          </Text>
          <View style={s.iconRow}>
            <IconButton label={t.a11y_lang} onPress={() => setLang(lang === 'sq' ? 'en' : 'sq')}>
              <Text style={s.iconText}>{t.lang_toggle}</Text>
            </IconButton>
            <IconButton label={t.a11y_theme} onPress={theme.cycleTheme}>
              <Emoji size={18}>🎨</Emoji>
            </IconButton>
            <IconButton label={t.a11y_create} onPress={() => router.push('/create')} filled>
              <Text style={[s.iconText, { color: theme.c.onPrimary, fontSize: 22 }]}>+</Text>
            </IconButton>
          </View>
        </View>

        {/* Hero: the question, and the city */}
        <Display size={cols > 1 ? 52 : 38} style={{ marginTop: 6 }}>
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
        <View style={s.band}>
          <CityBand height={cols > 1 ? 110 : 88} />
        </View>

        <FriendsStrip />

        {/* Kur? */}
        <Text style={s.q}>{t.when}?</Text>
        <View style={s.segment} accessibilityRole="tablist">
          {WHEN_OPTIONS.map((w) => {
            const active = when === w;
            return (
              <Pressable
                key={w}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setWhen(w)}
                style={[s.segItem, active && { backgroundColor: theme.c.text }]}
              >
                <Text style={[s.segText, { color: active ? theme.c.bg : theme.c.text }]} numberOfLines={1}>
                  {whenLabel(w)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Ku? */}
        <Text style={s.q}>{t.where}?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          <Chip label={t.hood_all} active={!hood} onPress={() => setHood(null)} />
          {NEIGHBORHOODS.map((h) => (
            <Chip key={h} label={t[`hood_${h}` as const]} active={hood === h} onPress={() => setHood(hood === h ? null : h)} />
          ))}
        </ScrollView>

        {/* More filters: free + category, collapsed by default */}
        <View style={s.moreRow}>
          <Chip
            label={extraFilters > 0 ? t.more_filters_n(extraFilters) : t.more_filters}
            active={showMore || extraFilters > 0}
            onPress={() => setShowMore((v) => !v)}
          />
          {tag && (
            <Chip label={`#${tag}  ✕`} active accessibilityLabel={t.a11y_clear_tag(tag)} onPress={() => router.setParams({ tag: '' })} />
          )}
        </View>
        {showMore && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
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
          </ScrollView>
        )}

        {/* Results, grouped by time */}
        {filtering && <Text style={s.count}>{t.results(list.length)}</Text>}

        {sections.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>{t.no_results}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={resetFilters}
              style={({ pressed }) => [s.emptyBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.emptyBtnText}>{t.reset_filters}</Text>
            </Pressable>
          </View>
        ) : (
          sections.map(({ key, items }) => (
            <View key={key} style={s.section}>
              <Display size={cols > 1 ? 30 : 26}>{sectionTitle(key)}</Display>
              {key === 'today' ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.rail}>
                  {items.map((e) => (
                    <StoryCard key={e.id} event={e} source="tonight" />
                  ))}
                </ScrollView>
              ) : (
                <View style={[s.grid, { gap: cols > 1 ? GAP : 0 }]}>
                  {items.map((e) => (
                    <View key={e.id} style={{ width: itemWidth }}>
                      <EventCard event={e} popular={popularIds.has(e.id)} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function IconButton({
  children,
  label,
  onPress,
  filled,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const t = useTheme();
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        s.iconBtn,
        filled ? { backgroundColor: t.c.primary, borderColor: t.c.primary } : null,
        pressed && { opacity: 0.8 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.c.bg },
    content: { padding: 16, paddingBottom: 56, width: '100%', alignSelf: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    greet: { color: t.c.textDim, fontSize: 15, fontWeight: '600', flexShrink: 1 },
    iconRow: { flexDirection: 'row', gap: 8 },
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
    iconText: { color: t.c.text, fontSize: 13, fontWeight: '800' },
    heroMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 12 },
    sub: { color: t.c.textDim, fontSize: 15 },
    surprise: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
    surpriseText: { color: t.c.text, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
    band: { marginTop: 8, marginBottom: 22, marginHorizontal: -16 },
    q: { color: t.c.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
    segment: {
      flexDirection: 'row',
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: 999,
      padding: 4,
      marginBottom: 18,
    },
    segItem: { flex: 1, minHeight: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    segText: { fontSize: 14, fontWeight: '700' },
    chipScroll: { flexGrow: 0, marginBottom: 12 },
    moreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    count: { color: t.c.textDim, fontSize: 14, fontWeight: '600', marginTop: 4, marginBottom: 4 },
    section: { marginTop: 18, gap: 14 },
    rail: { flexGrow: 0, marginHorizontal: -16, paddingLeft: 16 },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    empty: {
      marginTop: 18,
      backgroundColor: t.c.surface,
      borderColor: t.c.border,
      borderWidth: t.outline,
      borderRadius: radius.md,
      padding: 18,
      gap: 12,
      alignItems: 'flex-start',
    },
    emptyText: { color: t.c.text, fontSize: 16 },
    emptyBtn: {
      backgroundColor: t.c.primary,
      borderRadius: 999,
      paddingHorizontal: 18,
      minHeight: 44,
      justifyContent: 'center',
    },
    emptyBtnText: { color: t.c.onPrimary, fontWeight: '700', fontSize: 15 },
  }),
);
