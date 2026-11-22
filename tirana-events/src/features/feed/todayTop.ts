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

/**
 * `weight` comes from the host's standing (data/hostStanding TIER_WEIGHT): Trusted hosts get a
 * nudge, Limited and Low hosts (weight 0) only make the top when there is room for everyone.
 */
export function pickToday(
  today: EventItem[],
  max: number,
  mine: ReadonlySet<string> = new Set(),
  liked: ReadonlySet<string> = new Set(),
  weight: (e: EventItem) => number = () => 1,
): EventItem[] {
  if (today.length <= max) return today;
  const score = (e: EventItem) => weight(e) * todayScore(e, liked.has(e.id));
  const ranked = [...today].sort(
    (a, b) =>
      Number(mine.has(b.id)) - Number(mine.has(a.id)) ||
      Number(weight(b) > 0) - Number(weight(a) > 0) ||
      score(b) - score(a) ||
      a.startsAt.localeCompare(b.startsAt),
  );
  return ranked.slice(0, max).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
