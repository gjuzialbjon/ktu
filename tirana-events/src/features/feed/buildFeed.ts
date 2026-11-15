import type { Category, EventItem, Neighborhood } from '@/data/types';
import { TimeBucket, WhenFilter, bucketOf, isThisWeek, matchesWhen } from '@/lib/format';

/**
 * Everything the home feed shows, derived from events + filters + the clock.
 * Pure: the screen calls it inside useMemo, tests call it directly.
 */
export interface FeedFilters {
  when: WhenFilter;
  hood: Neighborhood | null;
  cat: Category | null;
  freeOnly: boolean;
  /** set by tapping a tag on a card; acts as a search, so it also covers today */
  tag: string | null;
}

export const NO_FILTERS: FeedFilters = { when: 'all', hood: null, cat: null, freeOnly: false, tag: null };

export const isFiltering = (f: FeedFilters): boolean =>
  f.when !== 'all' || !!f.hood || !!f.cat || f.freeOnly || !!f.tag;

/** Filters hidden behind "more filters": shown as a count on that button. */
export const extraFilterCount = (f: FeedFilters): number => (f.cat ? 1 : 0) + (f.freeOnly ? 1 : 0);

export interface FeedSection {
  key: Exclude<TimeBucket, 'past'>;
  items: EventItem[];
}

export interface Feed {
  /** every event not yet over, soonest first, ignoring filters (the dice roll picks from these) */
  upcoming: EventItem[];
  /** the highlight row above the filters: everything still to come today, unfiltered */
  today: EventItem[];
  /** below the filter bar: from tomorrow on (or including today when searching a tag) */
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
      (f.tag || bucketOf(e.startsAt, now) !== 'today') &&
      matchesWhen(e.startsAt, f.when, now) &&
      (!f.hood || e.neighborhood === f.hood) &&
      (!f.cat || e.category === f.cat) &&
      (!f.freeOnly || e.priceType === 'free') &&
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
