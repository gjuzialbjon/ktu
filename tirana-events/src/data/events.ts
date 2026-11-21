import type { Comment, EventItem, Rsvp } from './types';
import type { CityId } from './cities';

/**
 * Pure domain rules for events: no React, no storage, no clock reads.
 * Callers pass `now` and ids in, which keeps every rule unit-testable.
 */

/** Paid placement is capped so the feed never turns into an ad wall. */
export const MAX_PINNED_SPONSORED = 2;

/** Published events only; up to two sponsored pinned on top, the rest by start time. */
export function orderFeedEvents(all: EventItem[]): EventItem[] {
  const published = all.filter((e) => e.status === 'published');
  const pinned = published.filter((e) => e.isSponsored).slice(0, MAX_PINNED_SPONSORED);
  const rest = published.filter((e) => !pinned.includes(e)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return [...pinned, ...rest];
}

/** One city's feed. Sponsored slots are per city: a Durrës ad never takes a Tirana slot. */
export function eventsForCity(all: EventItem[], city: CityId): EventItem[] {
  return orderFeedEvents(all.filter((e) => e.city === city));
}

export type DraftInput = Pick<
  EventItem,
  'title' | 'description' | 'venueName' | 'tags' | 'startsAt' | 'city' | 'neighborhood' | 'languages'
> & {
  ticketPriceLek?: number;
  /** data-URL or file URI from the image picker */
  coverImage?: string;
};

/** A user-submitted event. It waits as a draft until a curator publishes it. */
export function makeDraftEvent(input: DraftInput, id: string): EventItem {
  return {
    id,
    title: input.title,
    description: input.description,
    category: 'community',
    tags: input.tags,
    languages: input.languages,
    venueName: input.venueName,
    address: input.venueName,
    city: input.city,
    neighborhood: input.neighborhood,
    startsAt: input.startsAt,
    coverImage: input.coverImage,
    priceType: input.ticketPriceLek ? 'ticketed' : 'free',
    ticketPriceLek: input.ticketPriceLek,
    source: 'organizer',
    status: 'draft',
    isSponsored: false,
    organizer: { id: 'me', name: 'Ti', verified: false },
    goingUserIds: [],
  };
}

/** "TE-" plus four characters from [0-9A-Z]; shown at the door and encoded in the QR. */
export function reservationCode(random: () => number = Math.random): string {
  return 'TE-' + random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
}

/** Free events are a plain "going"; ticketed ones get a reservation code to pay at the door. */
export function makeRsvp(event: EventItem, nowIso: string, code: () => string = reservationCode): Rsvp {
  const ticketed = event.priceType === 'ticketed';
  return {
    eventId: event.id,
    status: ticketed ? 'reserved' : 'going',
    reservationCode: ticketed ? code() : undefined,
    createdAt: nowIso,
  };
}

export function makeComment(eventId: string, text: string, author: string, id: string, nowIso: string): Comment | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  return { id, eventId, author, text: trimmed, isOrganizer: false, createdAt: nowIso };
}

/** Spots left after everyone going, including you if you joined. null = no capacity limit. */
export function spotsLeft(event: EventItem, youJoined: boolean): number | null {
  if (event.capacity == null) return null;
  return Math.max(0, event.capacity - event.goingUserIds.length - (youJoined ? 1 : 0));
}
