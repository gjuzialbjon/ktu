import type { EventItem, GoingVisibility, Profile, Rsvp } from './types.ts';

/**
 * Who sees what. Pure rules, no React: the store filters the feed with them and the
 * event page decides what to reveal with them.
 *
 * The idea: an event you have to ask to join keeps its exact place and time to
 * itself until the host says yes. Otherwise the page gives everything away and the
 * "ask" means nothing (you could just turn up at the run).
 */

export const visibilityOf = (e: EventItem) => e.visibility ?? 'public';
export const joinModeOf = (e: EventItem) => e.joinMode ?? 'open';

/** You are in: going, or holding a reservation. A pending request is not in yet. */
export const isIn = (r: Rsvp | undefined): boolean => !!r && (r.status === 'going' || r.status === 'reserved');

/** Exact venue, address and start time: open events always, the others once you are in. */
export function canSeeDetails(e: EventItem, r: Rsvp | undefined): boolean {
  return joinModeOf(e) === 'open' || isIn(r);
}

/** Tags the event and the person share, most specific first (the event's own order). */
export function sharedInterests(e: EventItem, interests: string[]): string[] {
  return e.tags.filter((t) => interests.includes(t));
}

/** The first of the user's hidden topics this event carries, if any. */
export function hiddenTopicOf(e: EventItem, hidden: readonly string[] | undefined): string | undefined {
  return hidden && hidden.length > 0 ? e.tags.find((t) => hidden.includes(t)) : undefined;
}

/**
 * Does the event belong in this person's feed?
 * Anything you already asked to join or joined: yes, always.
 * A topic you hid ("never show me chess"): no.
 * Public: yes. Private + ask: when interests overlap or someone you follow is going (pass only
 * the people whose going you may see, or the feed gives a hidden plan away).
 * Invite-only: only once you are on it.
 */
export function visibleInFeed(
  e: EventItem,
  profile: Pick<Profile, 'interests' | 'follows'> & { hidden?: string[] },
  r: Rsvp | undefined,
): boolean {
  if (r) return true;
  if (hiddenTopicOf(e, profile.hidden)) return false;
  if (visibilityOf(e) === 'public') return true;
  if (joinModeOf(e) === 'invite') return false;
  return sharedInterests(e, profile.interests).length > 0 || e.goingUserIds.some((id) => profile.follows.includes(id));
}

/** Nobody sees where you go until you choose otherwise. */
export const DEFAULT_SHOW_GOING: GoingVisibility = 'nobody';
export const GOING_VISIBILITIES: readonly GoingVisibility[] = ['nobody', 'following', 'everyone'];

/**
 * May this viewer see that a person is going (their name and face)? Counts are never hidden.
 * The event's host always sees who is coming to their own event; a person always sees their own
 * plans (callers skip the check for themselves).
 */
export function canSeeGoing(
  show: GoingVisibility | undefined,
  viewer: { followedByGoer: boolean; hostsEvent?: boolean },
): boolean {
  if (viewer.hostsEvent) return true;
  const v = show ?? DEFAULT_SHOW_GOING;
  return v === 'everyone' || (v === 'following' && viewer.followedByGoer);
}

/** An ask-to-join request that needs no answer: the host chose to let people with a shared interest in. */
export function autoAccepts(e: EventItem, interests: string[]): boolean {
  return joinModeOf(e) === 'ask' && e.acceptMode === 'interests' && sharedInterests(e, interests).length > 0;
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

/** The rough time we can show before the details are revealed. */
export function dayPartOf(iso: string): DayPart {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

/**
 * Events that share hashtags with this one: most shared tags first, then soonest.
 * Same city only (a similar event three hours away is not similar enough), upcoming only.
 */
export function similarEvents(e: EventItem, all: EventItem[], nowMs: number, max = 6): EventItem[] {
  return all
    .filter((o) => o.id !== e.id && o.city === e.city && o.status === 'published' && new Date(o.startsAt).getTime() > nowMs)
    .map((o) => ({ o, n: o.tags.filter((t) => e.tags.includes(t)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.o.startsAt.localeCompare(b.o.startsAt))
    .slice(0, max)
    .map((x) => x.o);
}

/**
 * "For you": events that match your interests or the tags of what you joined before.
 * Score = shared tags; ties go to the sooner event. Nothing matched → empty, never a guess.
 */
export function forYou(events: EventItem[], interests: string[], joinedTags: string[], max = 8): EventItem[] {
  const likes = new Set([...interests, ...joinedTags]);
  if (likes.size === 0) return [];
  return events
    .map((e) => ({ e, n: e.tags.filter((t) => likes.has(t)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.e.startsAt.localeCompare(b.e.startsAt))
    .slice(0, max)
    .map((x) => x.e);
}

/** Demo stand-in for the host's answer: requests are accepted after this long. */
export const DEMO_APPROVE_AFTER_MS = 6000;
