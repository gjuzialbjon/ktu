import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Category } from '@/data/types';
import { CITIES, CityId, areaName, cityName } from '@/data/cities';
import type { WhenFilter } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { CATEGORY_EMOJI, makeStyles, space, useTheme, withAlpha } from '@/lib/theme';
import { Chevron, Chip } from '@/components/ui';
import { extraFilterCount } from './buildFeed';
import type { FeedFiltersState } from './useFeedFilters';

const CATEGORIES: Category[] = ['community', 'music', 'nightlife', 'culture', 'sports', 'food', 'outdoors', 'business'];
/** Today has its own row above the filters, so the bar only browses what comes after. */
const WHEN_OPTIONS: WhenFilter[] = ['all', 'tomorrow', 'weekend'];

/**
 * The sticky filter bar: one horizontally scrolling row (when · where · more · tag),
 * with the where/more panels opening inline beneath it.
 */
export function FilterBar({ state, city, maxWidth }: { state: FeedFiltersState; city: CityId; maxWidth: number }) {
  const { t, lang } = useI18n();
  const theme = useTheme();
  const s = useStyles();
  const { filters, panel } = state;
  const extra = extraFilterCount(filters);
  const allLabel = t.hood_all(cityName(city, lang));
  const hoodLabel = filters.hood ? areaName(city, filters.hood, lang) : allLabel;
  const whenLabel = (w: WhenFilter) =>
    w === 'all' ? t.when_all : w === 'tomorrow' ? t.when_tomorrow : w === 'weekend' ? t.when_weekend : t.when_today;

  return (
    <View style={s.barWrap}>
      <View style={[s.column, { maxWidth }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.barRow}>
          <View style={s.segment} accessibilityRole="radiogroup">
            {WHEN_OPTIONS.map((w) => {
              const active = filters.when === w;
              return (
                <Pressable
                  key={w}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => state.setWhen(w)}
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
            active={!!filters.hood}
            onPress={() => state.togglePanel('where')}
          />
          <DisclosureButton
            label={extra > 0 ? t.more_filters_n(extra) : t.more_filters}
            open={panel === 'more'}
            active={extra > 0}
            onPress={() => state.togglePanel('more')}
          />
          {filters.tag && (
            <Chip
              label={`#${filters.tag}  ✕`}
              active
              accessibilityLabel={t.a11y_clear_tag(filters.tag)}
              onPress={state.clearTag}
            />
          )}
        </ScrollView>

        {panel === 'where' && (
          <View style={s.panel}>
            <Chip
              label={allLabel}
              active={!filters.hood}
              onPress={() => {
                state.setHood(null);
                state.closePanel();
              }}
            />
            {CITIES[city].areas.map(({ id }) => (
              <Chip
                key={id}
                label={areaName(city, id, lang)}
                active={filters.hood === id}
                onPress={() => {
                  state.setHood(filters.hood === id ? null : id);
                  state.closePanel();
                }}
              />
            ))}
          </View>
        )}
        {panel === 'more' && (
          <View style={s.panel}>
            <Chip label={t.free} active={filters.freeOnly} onPress={() => state.setFreeOnly((v) => !v)} />
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                emoji={CATEGORY_EMOJI[c]}
                label={t[`cat_${c}` as const]}
                active={filters.cat === c}
                onPress={() => state.setCat(filters.cat === c ? null : c)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
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
    column: { width: '100%', alignSelf: 'center', paddingHorizontal: space.lg },
    barWrap: {
      // mostly opaque, so the sky behind the feed still tints it a little
      backgroundColor: withAlpha(t.c.surface, 0.88),
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
    segItem: {
      minHeight: 38,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.md,
    },
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
  }),
);
