import type { EventItem, Rsvp } from './types.ts';
import { isIn } from './access.ts';

/**
 * Ratings: people who went say how it was, so the team can keep weak events out of the feed.
 * Pure: no React, no storage, no clock reads (callers pass `now`).
 *
 * - Only people who were in (going or reserved) can rate, only once the event has ended, and
 *   only for a week. One rating per person per event; they can change it inside the week.
 * - Stars move the host's standing (hostStanding's grade), but only once enough people rated.
 * - Problems ("it didn't happen", "felt unsafe") go to the team, who confirm them before they
 *   count. Nothing is hidden automatically: ranking sinks, only moderation removes.
 * - The public sees a host's average only once enough people rated; notes stay with the
 *   team and the host.
 */

export type Stars = 1 | 2 | 3 | 4 | 5;

/** Problems someone can flag with a rating; each sends the event to the team to check. */
export type RatingIssue = 'didnt_happen' | 'not_as_described' | 'host_absent' | 'felt_unsafe';
export const RATING_ISSUES: readonly RatingIssue[] = ['didnt_happen', 'not_as_described', 'host_absent', 'felt_unsafe'];

export interface Rating {
  eventId: string;
  stars: Stars;
  issues: RatingIssue[];
  /** for the team and the host only, never public */
  note?: string;
  createdAt: string; // ISO
}

/** How long after the end people can rate. */
export const RATE_WINDOW_DAYS = 7;
/** Ratings move a host's standing only from this many per event. */
export const MIN_RATINGS_COUNTED = 3;
/** A host's average is shown publicly only from this many ratings in total. */
export const MIN_RATINGS_SHOWN = 5;
export const NOTE_MAX = 500;

const H = 3600_000;
const DAY = 24 * H;

/** When the event ended: its end time, or two hours after the start. */
export function eventEndMs(e: Pick<EventItem, 'startsAt' | 'endsAt'>): number {
  return e.endsAt ? new Date(e.endsAt).getTime() : new Date(e.startsAt).getTime() + 2 * H;
}

/** You were in, it took place, it has ended, it is not yours, and the week has not passed. */
export function canRate(e: EventItem, r: Rsvp | undefined, now: Date, viewerId = 'me'): boolean {
  if (!isIn(r) || e.status !== 'published' || e.organizer.id === viewerId) return false;
  const end = eventEndMs(e);
  return now.getTime() >= end && now.getTime() - end <= RATE_WINDOW_DAYS * DAY;
}

/** A clean rating, or null when the stars are not 1–5. Issues deduplicated, note trimmed. */
export function makeRating(eventId: string, stars: number, issues: readonly string[], note: string, nowIso: string): Rating | null {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return null;
  const clean = RATING_ISSUES.filter((i) => issues.includes(i));
  const text = note.trim().slice(0, NOTE_MAX);
  return { eventId, stars: stars as Stars, issues: clean, note: text || undefined, createdAt: nowIso };
}

export interface RatingSummary {
  count: number;
  /** 0 when nobody rated */
  average: number;
  issues: Partial<Record<RatingIssue, number>>;
}

export function summarizeRatings(ratings: readonly Pick<Rating, 'stars' | 'issues'>[]): RatingSummary {
  const issues: Partial<Record<RatingIssue, number>> = {};
  let sum = 0;
  for (const r of ratings) {
    sum += r.stars;
    for (const i of r.issues) issues[i] = (issues[i] ?? 0) + 1;
  }
  return { count: ratings.length, average: ratings.length ? sum / ratings.length : 0, issues };
}

/** What an event's ratings add to its grade (-2 to +1); nothing until enough people rated. */
export function ratingGrade(count: number, average: number): number {
  if (count < MIN_RATINGS_COUNTED) return 0;
  if (average >= 4.5) return 1;
  if (average >= 3.5) return 0;
  if (average >= 2.5) return -1;
  return -2;
}

/**
 * Should the team look at this event? Anyone feeling unsafe: always. Any other problem: once two
 * people or a third of the raters name it. The team confirms before anything counts.
 */
export function needsReview(s: RatingSummary): boolean {
  if ((s.issues.felt_unsafe ?? 0) > 0) return true;
  return RATING_ISSUES.some((i) => {
    const n = s.issues[i] ?? 0;
    return n >= 2 || (s.count >= MIN_RATINGS_COUNTED && n / s.count >= 1 / 3);
  });
}
