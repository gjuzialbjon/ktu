import type { CancelReason, EventItem } from './types';

export type { CancelReason };

/**
 * Host standing: how much feed space a host's next events get, worked out from what actually
 * happened at their past ones. Pure: no React, no storage, no clock reads (callers pass `now`).
 *
 * Two kinds of host would fill the feed with events nobody wants: those whose events keep ending
 * empty, and those who cancel at the last minute after people planned around them. Both sink.
 * Ranking never hides an event: bad standing moves events to the end of their section and out
 * of the curated places (highlights, today's top, collections). Only moderation removes events.
 */

// ---------- outcomes ----------

/** What happened at one past event. Recorded when it ends or is cancelled. */
export interface EventOutcome {
  eventId: string;
  hostId: string;
  startsAt: string; // ISO
  /** seats offered; missing = open-ended */
  capacity?: number;
  /** distinct people going at the start, host and gamed joins excluded (see countJoiners) */
  joined: number;
  /** people who had been to an earlier event by this host */
  returning?: number;
  /** set when the host cancelled, or deleted the event while people were going */
  cancelledAt?: string; // ISO
  cancelReason?: CancelReason;
  /** people going or waiting at the moment of cancelling */
  affected?: number;
  /** the forecast at cancel time was bad (rain ≥ 60% or wind ≥ 40 km/h) on an outdoor event */
  forecastBad?: boolean;
  /** time moved > 2 h or place changed close to the start: graded like a cancel, one step softer */
  lateEditAt?: string; // ISO
  /** ask-to-join: requests asked / still unanswered at the start */
  requests?: number;
  requestsIgnored?: number;
  /** curator-confirmed reports */
  reportsNotAsDescribed?: number;
  /** a confirmed "the host didn't show up" */
  hostNoShow?: boolean;
  /** feed views it got; an empty event that got little reach is not the host's fault */
  views?: number;
}

/** Below this many views, an empty event is not counted against a new host. */
export const MIN_FAIR_VIEWS = 200;
/** Each graded event weighs half as much after this many days. */
export const HALF_LIFE_DAYS = 60;
/** Two neutral phantom events: one result cannot make a host great or terrible. */
export const PRIOR_WEIGHT = 2;
/** One excused cancel (illness, venue) per this many days; the next one counts. */
export const EXCUSE_WINDOW_DAYS = 60;

const H = 3600_000;
const DAY = 24 * H;

/** How bad a cancel is, by how long before the start it came. */
function cancelGrade(leadMs: number, affected: number): number {
  const someone = affected > 0;
  if (leadMs > 72 * H) return 0;
  if (leadMs > 24 * H) return someone ? -1 : 0;
  if (leadMs > 2 * H) return someone ? -2 : -1;
  return someone ? -3 : -2;
}

/** Turnout against the event's own size, so a full 6-seat dinner counts as much as a busy bar. */
function turnoutGrade(o: EventOutcome): number {
  if (o.joined <= 0) return o.views != null && o.views < MIN_FAIR_VIEWS ? 0 : -1;
  if (o.capacity && o.capacity > 0) {
    const fill = o.joined / o.capacity;
    if (fill >= 0.6) return 2;
    if (fill >= 0.3) return 1;
    return 0;
  }
  if (o.joined >= 8) return 2;
  if (o.joined >= 3) return 1;
  return 0;
}

/**
 * One event's grade, -3 to +3. `excused` says whether this cancel may use the host's excuse
 * (decided by hostStanding, which knows the host's earlier excuses).
 */
export function gradeOutcome(o: EventOutcome, excused = false): number {
  const start = new Date(o.startsAt).getTime();
  if (o.hostNoShow) return -3;
  if (o.cancelledAt) {
    if (excused) return 0;
    return cancelGrade(start - new Date(o.cancelledAt).getTime(), o.affected ?? 0);
  }
  let g = turnoutGrade(o);
  if ((o.returning ?? 0) >= 2) g += 1;
  g -= o.reportsNotAsDescribed ?? 0;
  if (o.requests && (o.requestsIgnored ?? 0) / o.requests >= 0.5) g -= 1;
  if (o.lateEditAt) g += Math.min(0, cancelGrade(start - new Date(o.lateEditAt).getTime(), o.joined) + 1);
  return Math.max(-3, Math.min(3, g));
}

/** A cancel that hurt people: under 24 h before the start, someone going, not excused. */
const isLateCancel = (o: EventOutcome, excused: boolean) =>
  !!o.cancelledAt &&
  !excused &&
  (o.affected ?? 0) > 0 &&
  new Date(o.startsAt).getTime() - new Date(o.cancelledAt).getTime() <= 24 * H;

// ---------- standing ----------

export type HostTier = 'trusted' | 'normal' | 'new' | 'limited' | 'low';

export interface HostStanding {
  hostId: string;
  tier: HostTier;
  /** decayed average grade with the neutral prior, about -3 to +3 */
  score: number;
  /** finished or cancelled events that count */
  graded: number;
  /** late cancels with people affected in the last 60 days */
  lateCancels: number;
  /** recent events (60 days) that took place with nobody going */
  emptyRecent: number;
  /** recent events (60 days) that took place or were cancelled */
  recent: number;
}

export const TRUSTED_MIN = 1.2;
export const TRUSTED_MIN_EVENTS = 5;
export const NORMAL_MIN = -0.3;
export const LIMITED_MIN = -1.2;
export const NEW_UNTIL = 3;
export const LOW_LATE_CANCELS = 3;
/** a host must cross a line by this much to change tier, so nobody flickers week to week */
export const HYSTERESIS = 0.3;

/**
 * The tier for a score. With `prev`, the lines move by HYSTERESIS in favour of staying put:
 * a Trusted host stays Trusted down to 0.9, a Limited host needs 0.0 to become Normal again.
 */
export function tierOf(
  s: Pick<HostStanding, 'score' | 'graded' | 'lateCancels'>,
  prev?: HostTier,
): HostTier {
  const rank: Record<HostTier, number> = { low: 0, limited: 1, new: 2, normal: 2, trusted: 3 };
  // a line between tier A (below) and B (above): a host already above needs to drop
  // HYSTERESIS under it to fall, a host already below needs HYSTERESIS over it to rise
  const line = (base: number, upper: HostTier) =>
    prev == null ? base : rank[prev] >= rank[upper] ? base - HYSTERESIS : base + HYSTERESIS;

  if (s.lateCancels >= LOW_LATE_CANCELS || s.score < line(LIMITED_MIN, 'limited')) return 'low';
  if (s.score < line(NORMAL_MIN, 'normal')) return 'limited';
  if (s.graded < NEW_UNTIL) return 'new';
  if (s.score >= line(TRUSTED_MIN, 'trusted') && s.graded >= TRUSTED_MIN_EVENTS && s.lateCancels === 0) return 'trusted';
  return 'normal';
}

/** A host's standing from their outcomes. Old events fade with a 60-day half-life. */
export function hostStanding(hostId: string, outcomes: EventOutcome[], now: Date, prev?: HostTier): HostStanding {
  const mine = outcomes
    .filter((o) => o.hostId === hostId && new Date(o.startsAt).getTime() <= now.getTime())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  let sum = 0;
  let weights = 0;
  let lateCancels = 0;
  let emptyRecent = 0;
  let recent = 0;
  let lastExcuse = -Infinity;
  for (const o of mine) {
    const at = new Date(o.cancelledAt ?? o.startsAt).getTime();
    // weather on a bad forecast is always excused; illness/venue once per window
    let excused = false;
    if (o.cancelledAt && o.cancelReason === 'weather' && o.forecastBad) excused = true;
    else if (o.cancelledAt && (o.cancelReason === 'illness' || o.cancelReason === 'venue') && at - lastExcuse > EXCUSE_WINDOW_DAYS * DAY) {
      excused = true;
      lastExcuse = at;
    }
    const ageDays = (now.getTime() - new Date(o.startsAt).getTime()) / DAY;
    const w = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
    sum += gradeOutcome(o, excused) * w;
    weights += w;
    if (ageDays <= 60) {
      recent += 1;
      if (isLateCancel(o, excused) || o.hostNoShow) lateCancels += 1;
      if (!o.cancelledAt && o.joined === 0) emptyRecent += 1;
    }
  }
  const score = sum / (weights + PRIOR_WEIGHT);
  const base = { hostId, score, graded: mine.length, lateCancels, emptyRecent, recent };
  return { ...base, tier: tierOf(base, prev) };
}

/** Standings for every host that has outcomes. */
export function standingsFor(outcomes: EventOutcome[], now: Date): Record<string, HostStanding> {
  const ids = [...new Set(outcomes.map((o) => o.hostId))];
  return Object.fromEntries(ids.map((id) => [id, hostStanding(id, outcomes, now)]));
}

/**
 * The outcome of an event in the app's own data, once it has ended or was cancelled.
 * null while it is still to come. Private and platform-run events are not graded.
 */
export function outcomeOf(e: EventItem, now: Date): EventOutcome | null {
  if (e.source === 'platform' || e.visibility === 'private') return null;
  const end = e.endsAt ? new Date(e.endsAt).getTime() : new Date(e.startsAt).getTime() + 2 * H;
  if (e.status !== 'cancelled' && end > now.getTime()) return null;
  if (e.status === 'draft') return null;
  return {
    eventId: e.id,
    hostId: e.organizer.id,
    startsAt: e.startsAt,
    capacity: e.capacity,
    joined: e.goingUserIds.length,
    cancelledAt: e.status === 'cancelled' ? (e.cancelledAt ?? e.startsAt) : undefined,
    cancelReason: e.cancelReason,
    affected: e.status === 'cancelled' ? e.goingUserIds.length : undefined,
  };
}

// ---------- the feed ----------

/**
 * The tier an event's host has in the feed. The platform's own events answer to the team, so
 * they rank like Trusted. Hosts with no record: venues the team imported (curated) start as
 * Normal; a new organizer starts as New.
 */
export function eventTier(e: EventItem, standings: Record<string, HostStanding>): HostTier {
  if (e.source === 'platform') return 'trusted';
  const s = standings[e.organizer.id];
  if (s) return s.tier;
  return e.source === 'curated' ? 'normal' : 'new';
}

/** Multiplier for ranked places (highlights, today's top). 0 = never there. */
export const TIER_WEIGHT: Record<HostTier, number> = { trusted: 1.25, normal: 1, new: 1, limited: 0, low: 0 };

/** Highlights and collections need a host with a record: Normal or Trusted. */
export const inCurated = (tier: HostTier): boolean => tier === 'trusted' || tier === 'normal';

/** Category, language and "for you" rails: Limited goes last, Low leaves them. */
export const inRails = (tier: HostTier): boolean => tier !== 'low';

/** At most this many events per host in one time section or rail; the rest fold away. */
export const HOST_CAP: Record<HostTier, number> = { trusted: 3, normal: 2, new: 1, limited: 1, low: 1 };

/** 0 = the main group in time order, then Limited, then Low. */
const SINK: Record<HostTier, number> = { trusted: 0, normal: 0, new: 0, limited: 1, low: 2 };

export interface Folded {
  hostId: string;
  hostName: string;
  events: EventItem[];
}

/**
 * The same host at the same venue within two hours is one event posted twice: keep the first.
 * Stops a host from filling a section with near-copies.
 */
export function dedupeHostEvents(events: EventItem[]): EventItem[] {
  const kept: EventItem[] = [];
  for (const e of events) {
    const t = new Date(e.startsAt).getTime();
    const dup = kept.some(
      (k) =>
        k.organizer.id === e.organizer.id &&
        k.venueName.trim().toLowerCase() === e.venueName.trim().toLowerCase() &&
        Math.abs(new Date(k.startsAt).getTime() - t) < 2 * H,
    );
    if (!dup) kept.push(e);
  }
  return kept;
}

/**
 * One time section, arranged: near-copies removed, each host capped (the rest folded into
 * "+N more from X"), then in time order with Limited and Low hosts at the end.
 * `vouched` events (someone you follow is going, or it is yours) keep their place and skip the cap.
 * Input must already be in time order; each group stays in time order.
 */
export function arrangeSection(
  items: EventItem[],
  tier: (e: EventItem) => HostTier,
  vouched: (e: EventItem) => boolean = () => false,
): { items: EventItem[]; folded: Folded[] } {
  const shown: EventItem[] = [];
  const folded = new Map<string, Folded>();
  const perHost = new Map<string, number>();
  for (const e of dedupeHostEvents(items)) {
    if (vouched(e)) {
      shown.push(e);
      continue;
    }
    const host = e.organizer.id;
    const n = perHost.get(host) ?? 0;
    if (n < HOST_CAP[tier(e)]) {
      perHost.set(host, n + 1);
      shown.push(e);
    } else {
      const f = folded.get(host) ?? { hostId: host, hostName: e.organizer.name, events: [] };
      f.events.push(e);
      folded.set(host, f);
    }
  }
  const sink = (e: EventItem) => (vouched(e) ? 0 : SINK[tier(e)]);
  // Array.prototype.sort is stable, so each group keeps its time order
  return { items: [...shown].sort((a, b) => sink(a) - sink(b)), folded: [...folded.values()] };
}

/** Rails: Low hosts out, Limited hosts last, each host capped. */
export function arrangeRail(
  items: EventItem[],
  tier: (e: EventItem) => HostTier,
  vouched: (e: EventItem) => boolean = () => false,
): EventItem[] {
  return arrangeSection(
    items.filter((e) => vouched(e) || inRails(tier(e))),
    tier,
    vouched,
  ).items;
}

// ---------- anti-gaming and review ----------

export interface Joiner {
  userId: string;
  verifiedPhone: boolean;
  /** events this person went to, apart from this one */
  otherEvents: number;
  accountAgeDays: number;
  /** minutes between joining and the host cancelling (cancelled events only) */
  minutesBeforeCancel?: number;
}

/** How many of these people count toward a host's turnout. */
export const REGULARS_COUNTED = 3;

/**
 * Turnout that cannot be faked cheaply:
 * - only verified-phone accounts that have been to another event or are a week old;
 * - nobody who joined in the last 10 minutes before a cancel;
 * - at most 3 of the host's regulars (people at ≥ 80% of their events) - welcome, but not proof.
 */
export function countJoiners(joiners: Joiner[], hostId: string, regulars: ReadonlySet<string> = new Set()): number {
  let regularsCounted = 0;
  let n = 0;
  for (const j of new Map(joiners.map((x) => [x.userId, x])).values()) {
    if (j.userId === hostId) continue;
    if (!j.verifiedPhone || (j.otherEvents < 1 && j.accountAgeDays < 7)) continue;
    if (j.minutesBeforeCancel != null && j.minutesBeforeCancel < 10) continue;
    if (regulars.has(j.userId)) {
      if (regularsCounted >= REGULARS_COUNTED) continue;
      regularsCounted += 1;
    }
    n += 1;
  }
  return n;
}

/** People who joined at least 80% of the host's last events (at least 3 events). */
export function regularsOf(attendance: string[][]): Set<string> {
  if (attendance.length < 3) return new Set();
  const count = new Map<string, number>();
  for (const people of attendance) for (const id of new Set(people)) count.set(id, (count.get(id) ?? 0) + 1);
  return new Set([...count].filter(([, c]) => c / attendance.length >= 0.8).map(([id]) => id));
}

export const NEW_HOST_WEEK_MAX = 5;
export const REJECTIONS_MAX = 3;

/**
 * Whether a host's next event must wait for a curator before it reaches the feed: still on
 * trial, Low standing, or 3+ rejected drafts in the last 30 days (whatever the tier).
 */
export function mustReview(standing: Pick<HostStanding, 'tier' | 'graded'> | undefined, rejectedLast30Days: number): boolean {
  if (rejectedLast30Days >= REJECTIONS_MAX) return true;
  if (!standing || standing.graded < NEW_UNTIL) return true;
  return standing.tier === 'low';
}

/**
 * A brand-new host (nothing graded yet) posting a flood: their 6th event onwards in the first
 * week stays out of the feed until their first event has run. `index` counts from 0.
 */
export const heldAsFlood = (standing: Pick<HostStanding, 'graded'> | undefined, index: number): boolean =>
  (standing?.graded ?? 0) === 0 && index >= NEW_HOST_WEEK_MAX;
