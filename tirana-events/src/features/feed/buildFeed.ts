import type { Category, EventItem, SpokenLang } from '@/data/types';
import { speaks } from '@/data/languages';
import type { AreaId } from '@/data/cities';
import { TimeBucket, WhenFilter, bucketOf, isThisWeek, matchesWhen } from '@/lib/format';

/**
 * Everything the home feed shows, derived from one city's events + filters + the clock.
 * Pure: the screen calls it inside useMemo, tests call it directly.
 */
export interface FeedFilters {
  when: WhenFilter;
  hood: AreaId | null;
  cat: Category | null;
  freeOnly: boolean;
  /** only events that work in this language (for visitors) */
  lang: SpokenLang | null;
  /** set by tapping a tag on a card; acts as a search, so it also covers today */
  tag: string | null;
}

export const NO_FILTERS: FeedFilters = { when: 'all', hood: null, cat: null, freeOnly: false, lang: null, tag: null };

export const isFiltering = (f: FeedFilters): boolean =>
  f.when !== 'all' || !!f.hood || !!f.cat || f.freeOnly || !!f.lang || !!f.tag;

/** Filters inside the "Filtra" sheet (free, language): shown as a count on that button. Categories have their own row. */
export const extraFilterCount = (f: FeedFilters): number => (f.freeOnly ? 1 : 0) + (f.lang ? 1 : 0);

export interface FeedSection {
  key: Exclude<TimeBucket, 'past'>;
  items: EventItem[];
}

export interface Feed {
  /** every event not yet over, soonest first, ignoring filters (the dice roll picks from these) */
  upcoming: EventItem[];
  /** the highlight row above the filters: everything still to come today, unfiltered */
  today: EventItem[];
  /** below the rows: from tomorrow on; with any filter on, everything matching including today */
  list: EventItem[];
  sections: FeedSection[];
  /** at most the two busiest events in view, and only if they are actually busy */
  popularIds: Set<string>;
  weekCount: number;
}

const SECTION_ORDER: FeedSection['key'][] = ['today', 'tomorrow', 'weekend', 'later'];
export const POPULAR_MIN_GOING = 4;
export const POPULAR_MAX = 2;

export function buildFeed(events: EventItem[], f: FeedFilters, now: Date): Feed {
  const upcoming = events
    .filter((e) => bucketOf(e.startsAt, now) !== 'past')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const today = upcoming.filter((e) => bucketOf(e.startsAt, now) === 'today');

  const list = upcoming.filter(
    (e) =>
      // browsing: today has its own timeline above; filtering: the rows step aside, so include today
      (isFiltering(f) || bucketOf(e.startsAt, now) !== 'today') &&
      matchesWhen(e.startsAt, f.when, now) &&
      (!f.hood || e.neighborhood === f.hood) &&
      (!f.cat || e.category === f.cat) &&
      (!f.freeOnly || e.priceType === 'free') &&
      (!f.lang || speaks(e, f.lang)) &&
      (!f.tag || e.tags.includes(f.tag)),
  );

  const byBucket = new Map<TimeBucket, EventItem[]>();
  for (const e of list) {
    const b = bucketOf(e.startsAt, now);
    byBucket.set(b, [...(byBucket.get(b) ?? []), e]);
  }
  const sections = SECTION_ORDER.map((key) => ({ key, items: byBucket.get(key) ?? [] })).filter(
    (s) => s.items.length > 0,
  );

  const popularIds = new Set(
    [...list]
      .sort((a, b) => b.goingUserIds.length - a.goingUserIds.length)
      .filter((e) => e.goingUserIds.length >= POPULAR_MIN_GOING)
      .slice(0, POPULAR_MAX)
      .map((e) => e.id),
  );

  const weekCount = events.filter((e) => isThisWeek(e.startsAt, now)).length;

  return { upcoming, today, list, sections, popularIds, weekCount };
}

/** One rail per category that has something coming up, fullest first; ties keep a fixed order. */
export function railsByCategory(events: EventItem[]): { cat: Category; items: EventItem[] }[] {
  const by = new Map<Category, EventItem[]>();
  for (const e of events) by.set(e.category, [...(by.get(e.category) ?? []), e]);
  return [...by.entries()]
    .map(([cat, items]) => ({ cat, items }))
    .sort((a, b) => b.items.length - a.items.length || a.cat.localeCompare(b.cat));
}

export const HIGHLIGHTS_MAX = 5;

/**
 * The few events worth leading the home screen with. Score: sponsored first (paid
 * placement, already capped per city), then people you follow going, then turnout and
 * likes, with a small nudge for the next two days. Stable: ties go to the sooner event.
 */
export function pickHighlights(upcoming: EventItem[], follows: string[], now: Date, max = HIGHLIGHTS_MAX): EventItem[] {
  const soon = now.getTime() + 48 * 3600_000;
  const score = (e: EventItem) =>
    (e.isSponsored ? 100 : 0) +
    e.goingUserIds.filter((id) => follows.includes(id)).length * 3 +
    e.goingUserIds.length +
    (e.likeCount ?? 0) / 10 +
    (new Date(e.startsAt).getTime() <= soon ? 2 : 0);
  return [...upcoming]
    .sort((a, b) => score(b) - score(a) || a.startsAt.localeCompare(b.startsAt))
    .slice(0, max);
}
