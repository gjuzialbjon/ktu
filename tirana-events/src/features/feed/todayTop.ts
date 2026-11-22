import type { EventItem } from '@/data/types';

/**
 * Which of today's events the home timeline shows when there are more than fit.
 * Pure: no clock, no React.
 *
 * Yours come first (you joined or asked to). Then the day's favourites: likes, plus a boost
 * for a series that keeps coming back (people returning week after week is the best review an
 * evening can get; capped so a long-running series cannot bury a new hit). The picks are then
 * shown in time order, so the timeline still reads morning → night.
 */
export const SERIES_BOOST_PER_EDITION = 3;
export const SERIES_BOOST_MAX_EDITIONS = 10;

export function todayScore(e: EventItem, likedByYou = false): number {
  const runs = e.series ? Math.min(e.series.edition - 1, SERIES_BOOST_MAX_EDITIONS) : 0;
  return (e.likeCount ?? 0) + (likedByYou ? 1 : 0) + runs * SERIES_BOOST_PER_EDITION;
}

export function pickToday(
  today: EventItem[],
  max: number,
  mine: ReadonlySet<string> = new Set(),
  liked: ReadonlySet<string> = new Set(),
): EventItem[] {
  if (today.length <= max) return today;
  const ranked = [...today].sort(
    (a, b) =>
      Number(mine.has(b.id)) - Number(mine.has(a.id)) ||
      todayScore(b, liked.has(b.id)) - todayScore(a, liked.has(a.id)) ||
      a.startsAt.localeCompare(b.startsAt),
  );
  return ranked.slice(0, max).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
