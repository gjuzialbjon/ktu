import type { EventItem } from '@/data/types';

/** Wednesday 18 Nov 2026, 12:00 local time: a fixed "now" so date rules are deterministic. */
export const NOW = new Date(2026, 10, 18, 12, 0);

/** Local-time ISO string `days` after NOW's date, at hour:minute. */
export function at(days: number, hour: number, minute = 0): string {
  return new Date(2026, 10, 18 + days, hour, minute).toISOString();
}

let seq = 0;
/** A valid published event; override only what a test cares about. */
export function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  seq += 1;
  return {
    id: `t${seq}`,
    title: `Test event ${seq}`,
    description: '',
    category: 'community',
    tags: ['test'],
    venueName: 'Venue',
    address: 'Venue',
    city: 'tirana',
    neighborhood: 'qendra',
    startsAt: at(1, 19),
    priceType: 'free',
    source: 'curated',
    status: 'published',
    isSponsored: false,
    organizer: { id: 'o1', name: 'Org', verified: true },
    goingUserIds: [],
    ...overrides,
  };
}
