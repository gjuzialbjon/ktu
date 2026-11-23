import React from 'react';
import { Rail } from '@/components/Rail';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import MapPin from 'lucide-react-native/icons/map-pin';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Check from 'lucide-react-native/icons/check';
import { type Category, type SpokenLang, CITIES, CityId, areaName, cityName } from '@ktu/shared';
import type { WhenFilter } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_EMOJI, makeStyles, radius, space, useTheme } from '@/lib/theme';
import { Button, Chip, Display } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { extraFilterCount } from './buildFeed';
import type { FeedFiltersState } from './useFeedFilters';

const CATEGORIES: Category[] = ['community', 'music', 'nightlife', 'culture', 'sports', 'food', 'outdoors', 'business'];
const WHEN_OPTIONS: WhenFilter[] = ['all', 'today', 'tomorrow', 'weekend'];

/**
 * The sticky filter bar, two short rows:
 *  1. three buttons (when, where, filters) that each open a bottom sheet, so nothing
 *     unfolds inside the feed and pushes it around. Their labels never change ("Kur", "Ku",
 *     "Filtra"): they turn dark when in use, so they always fit and never resize;
 *  2. one swipeable row: first what you picked, spelled out, each with ✕ to clear
 *     ("Fundjave ✕", "Jashte qendres ✕"), then the categories, one tap each.
 */
export function FilterBar({
  state,
  city,
  maxWidth,
  langs,
  resultCount,
  backdrop,
  edgeOpacity,
}: {
  state: FeedFiltersState;
  city: CityId;
  maxWidth: number;
  /** foreign languages that some upcoming event uses; only these get a chip */
  langs: SpokenLang[];
  /** how many events the current filters show, for the sheet's confirm button */
  resultCount: number;
  /**
   * Painted behind the bar at all times, clipped to it: the page's own sky, kept lined up
   * with the sky around it as you scroll, so the bar never switches backgrounds.
   */
  backdrop?: React.ReactNode;
  /** 0 at rest → 1 docked: fades in the bottom edge, driven by the scroll itself */
  edgeOpacity?: Animated.AnimatedInterpolation<number>;
}) {
  const { t, lang } = useI18n();
  const s = useStyles();
  const { filters, panel } = state;
  const extra = extraFilterCount(filters);
  const whenLabel = (w: WhenFilter) =>
    w === 'all' ? t.when_all_long : w === 'tomorrow' ? t.when_tomorrow : w === 'weekend' ? t.when_weekend : t.when_today;
  const allAreas = t.hood_all(cityName(city, lang));
  const hoodLabel = filters.hood ? areaName(city, filters.hood, lang) : cityName(city, lang);

  return (
    <View style={s.barWrap}>
      {backdrop ? (
        <View pointerEvents="none" style={s.backdropClip}>
          {backdrop}
        </View>
      ) : null}
      {edgeOpacity ? <Animated.View pointerEvents="none" style={[s.edge, { opacity: edgeOpacity }]} /> : null}
      <View style={[s.column, { maxWidth }]}>
        <View style={s.buttons}>
          <BarButton
            Icon={CalendarDays}
            label={t.when_btn}
            a11yLabel={t.a11y_when(whenLabel(filters.when))}
            active={filters.when !== 'all'}
            onPress={() => state.togglePanel('when')}
          />
          <BarButton
            Icon={MapPin}
            label={t.where_btn}
            a11yLabel={t.a11y_where(filters.hood ? hoodLabel : allAreas)}
            active={!!filters.hood}
            onPress={() => state.togglePanel('where')}
          />
          <BarButton
            Icon={SlidersHorizontal}
            label={t.more_filters}
            badge={extra}
            active={extra > 0}
            onPress={() => state.togglePanel('more')}
          />
        </View>

        <Rail
          compact
          style={s.catScroll}
          contentContainerStyle={s.catRow}
        >
          {/* what you picked, in full words, each one tap to clear */}
          {filters.when !== 'all' && (
            <Chip
              emoji="📅"
              label={`${whenLabel(filters.when)}  ✕`}
              active
              accessibilityLabel={t.a11y_clear_filter(whenLabel(filters.when))}
              onPress={() => state.setWhen('all')}
            />
          )}
          {filters.hood && (
            <Chip
              emoji="📍"
              label={`${hoodLabel}  ✕`}
              active
              accessibilityLabel={t.a11y_clear_filter(hoodLabel)}
              onPress={() => state.setHood(null)}
            />
          )}
          {filters.freeOnly && (
            <Chip
              label={`${t.free}  ✕`}
              active
              accessibilityLabel={t.a11y_clear_filter(t.free)}
              onPress={() => state.setFreeOnly(false)}
            />
          )}
          {filters.lang && (
            <Chip
              emoji="🗣️"
              label={`${t.lang_name[filters.lang]}  ✕`}
              active
              accessibilityLabel={t.a11y_clear_filter(t.lang_name[filters.lang])}
              onPress={() => state.setLang(null)}
            />
          )}
          {filters.tag && (
            <Chip
              label={`#${filters.tag}  ✕`}
              active
              accessibilityLabel={t.a11y_clear_tag(filters.tag)}
              onPress={state.clearTag}
            />
          )}
          <Chip label={t.when_all} active={!filters.cat} onPress={() => state.setCat(null)} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              emoji={CATEGORY_EMOJI[c]}
              label={t[`cat_${c}` as const]}
              active={filters.cat === c}
              onPress={() => state.setCat(filters.cat === c ? null : c)}
            />
          ))}
        </Rail>
      </View>

      {/* when */}
      <Sheet visible={panel === 'when'} onClose={state.closePanel}>
        <Display size={22}>{t.when_title}</Display>
        <View accessibilityRole="radiogroup">
          {WHEN_OPTIONS.map((w) => (
            <OptionRow
              key={w}
              label={whenLabel(w)}
              selected={filters.when === w}
              onPress={() => {
                state.setWhen(w);
                state.closePanel();
              }}
            />
          ))}
        </View>
      </Sheet>

      {/* where */}
      <Sheet visible={panel === 'where'} onClose={state.closePanel}>
        <Display size={22}>{t.where_title}</Display>
        <ScrollView accessibilityRole="radiogroup">
          {[null, ...CITIES[city].areas.map((a) => a.id)].map((id) => (
            <OptionRow
              key={id ?? 'all'}
              label={id ? areaName(city, id, lang) : allAreas}
              selected={filters.hood === id}
              onPress={() => {
                state.setHood(id);
                state.closePanel();
              }}
            />
          ))}
        </ScrollView>
      </Sheet>

      {/* everything else: changes apply as you tap, the button shows what you will get */}
      <Sheet visible={panel === 'more'} onClose={state.closePanel}>
        <Display size={22}>{t.more_filters}</Display>
        <OptionRow
          label={t.free_only}
          selected={filters.freeOnly}
          onPress={() => state.setFreeOnly((v) => !v)}
          checkbox
        />
        {langs.length > 0 && (
          <View style={{ gap: space.sm }}>
            <Text style={s.sheetLabel}>{t.lang_section}</Text>
            <View style={s.wrapRow}>
              {langs.map((l) => (
                <Chip
                  key={l}
                  emoji="🗣️"
                  label={t.lang_name[l]}
                  active={filters.lang === l}
                  onPress={() => state.setLang(filters.lang === l ? null : l)}
                />
              ))}
            </View>
          </View>
        )}
        <View style={s.sheetFooter}>
          {extra > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                state.setFreeOnly(false);
                state.setLang(null);
              }}
              hitSlop={8}
              style={({ pressed }) => [s.clear, pressed && { opacity: 0.6 }]}
            >
              <Text style={s.clearText}>{t.clear_these}</Text>
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <Button label={t.show_n(resultCount)} onPress={state.closePanel} />
          </View>
        </View>
      </Sheet>
    </View>
  );
}

function BarButton({
  Icon,
  label,
  a11yLabel,
  active,
  badge = 0,
  onPress,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  a11yLabel?: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  const s = useStyles();
  const fg = active ? theme.c.bg : theme.c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? (badge > 0 ? `${label} (${badge})` : label)}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        active && { backgroundColor: theme.c.text, borderColor: theme.c.text },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={{ flexShrink: 0 }}>
        <Icon size={17} color={fg} strokeWidth={2.2} />
      </View>
      <Text style={[s.btnText, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
      {badge > 0 && (
        <View style={[s.badge, { backgroundColor: theme.c.primary, borderColor: theme.c.surface }]}>
          <Text style={[s.badgeText, { color: theme.c.onPrimary }]}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** A full-width choice in a sheet: big enough to hit, a check when it is on. */
function OptionRow({
  label,
  selected,
  onPress,
  checkbox,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  checkbox?: boolean;
}) {
  const theme = useTheme();
  const s = useStyles();
  return (
    <Pressable
      accessibilityRole={checkbox ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [s.option, pressed && { backgroundColor: theme.c.surfaceAlt }]}
    >
      <Text style={[s.optionText, selected && { fontWeight: '800' }]}>{label}</Text>
      <View
        style={[
          s.tick,
          checkbox ? { borderRadius: 7 } : null,
          selected ? { backgroundColor: theme.c.text, borderColor: theme.c.text } : null,
        ]}
      >
        {selected && <Check size={15} color={theme.c.bg} strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((t) =>
  StyleSheet.create({
    column: { width: '100%', alignSelf: 'center', paddingHorizontal: space.lg },
    barWrap: {
      // no colour of its own: the backdrop paints the page's sky behind it (see props), so at
      // rest it is part of the page and docked it still hides the rows scrolling under it
      backgroundColor: 'transparent',
      paddingTop: space.sm,
      paddingBottom: 2,
    },
    backdropClip: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
    // drawn over the bar's bottom pixels, so it takes no room and fading it moves nothing
    edge: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.c.border,
    },
    buttons: { flexDirection: 'row', gap: space.sm },
    // three equal buttons with fixed labels: always fit, never resize
    btn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      minHeight: 42,
      paddingHorizontal: space.md,
      borderRadius: 14,
      borderWidth: t.outline,
      borderColor: t.c.border,
      backgroundColor: t.c.surface,
    },
    btnText: { fontSize: 15, fontWeight: '700' },
    // over the top-right corner, so a count appearing does not widen the button
    badge: {
      position: 'absolute',
      top: -7,
      right: -5,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
    // vertical padding gives the chips' hit slop room inside the scroller
    catScroll: { marginHorizontal: -space.lg },
    // chips bring their own 8px right margin: no extra gap, so they read as one row
    catRow: { alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: space.sm },
    sheetLabel: { color: t.c.textDim, fontSize: 14, fontWeight: '700' },
    wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 52,
      // text lines up with the sheet title; the pressed highlight still has a little room
      marginHorizontal: -space.sm,
      paddingHorizontal: space.sm,
      borderRadius: radius.md,
    },
    optionText: { color: t.c.text, fontSize: 17, fontWeight: '600' },
    tick: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: t.c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetFooter: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.sm },
    clear: { minHeight: 44, justifyContent: 'center' },
    clearText: { color: t.c.text, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
  }),
);
