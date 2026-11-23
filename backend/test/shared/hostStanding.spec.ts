import {
  EventOutcome,
  HOST_CAP,
  HostTier,
  MIN_FAIR_VIEWS,
  arrangeRail,
  arrangeSection,
  countJoiners,
  dedupeHostEvents,
  eventTier,
  gradeOutcome,
  heldAsFlood,
  hostStanding,
  mustReview,
  outcomeOf,
  regularsOf,
  standingsFor,
  tierOf,
} from '@/data/hostStanding';
import { hostHistory } from '@/data/hostHistory';
import type { EventItem } from '@/data/types';

const H = 3600_000;
const DAY = 24 * H;
const NOW = new Date('2026-11-22T12:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString();
const daysAgo = (d: number) => iso(NOW.getTime() - d * DAY);

const ran = (joined: number, extra: Partial<EventOutcome> = {}): EventOutcome => ({
  eventId: 'x',
  hostId: 'h',
  startsAt: daysAgo(3),
  joined,
  ...extra,
});
const cancel = (hoursBefore: number, affected: number, extra: Partial<EventOutcome> = {}): EventOutcome => {
  const start = NOW.getTime() - 3 * DAY;
  return { eventId: 'x', hostId: 'h', startsAt: iso(start), joined: 0, cancelledAt: iso(start - hoursBefore * H), affected, ...extra };
};

describe('gradeOutcome: events that took place', () => {
  it('grades turnout against the event’s own capacity, so small events are not punished', () => {
    expect(gradeOutcome(ran(5, { capacity: 6 }))).toBe(2); // 83% of a 6-seat dinner
    expect(gradeOutcome(ran(3, { capacity: 6 }))).toBe(1); // 50%
    expect(gradeOutcome(ran(20, { capacity: 180 }))).toBe(0); // 11% of a concert hall: small, not bad
  });

  it('uses absolute counts when there is no capacity', () => {
    expect(gradeOutcome(ran(8))).toBe(2);
    expect(gradeOutcome(ran(3))).toBe(1);
    expect(gradeOutcome(ran(2))).toBe(0);
  });

  it('grades an empty event -1, unless the app never showed it to enough people', () => {
    expect(gradeOutcome(ran(0))).toBe(-1);
    expect(gradeOutcome(ran(0, { views: MIN_FAIR_VIEWS + 1 }))).toBe(-1);
    expect(gradeOutcome(ran(0, { views: MIN_FAIR_VIEWS - 1 }))).toBe(0);
  });

  it('rewards people coming back, capped at +3', () => {
    expect(gradeOutcome(ran(3, { returning: 2 }))).toBe(2);
    expect(gradeOutcome(ran(9, { returning: 5 }))).toBe(3);
  });

  it('takes a point per confirmed "not as described" report and for ignoring most requests', () => {
    expect(gradeOutcome(ran(8, { reportsNotAsDescribed: 1 }))).toBe(1);
    expect(gradeOutcome(ran(3, { requests: 10, requestsIgnored: 5 }))).toBe(0);
    expect(gradeOutcome(ran(3, { requests: 10, requestsIgnored: 4 }))).toBe(1);
  });

  it('treats a late big edit like a cancel at that moment, one step softer', () => {
    const start = NOW.getTime() - 3 * DAY;
    expect(gradeOutcome(ran(3, { lateEditAt: iso(start - 5 * H) }))).toBe(1 - 1); // like -2, softened to -1
    expect(gradeOutcome(ran(3, { lateEditAt: iso(start - 100 * H) }))).toBe(1); // well ahead: free
  });

  it('a host who did not show up is the worst outcome', () => {
    expect(gradeOutcome(ran(8, { hostNoShow: true }))).toBe(-3);
  });
});

describe('gradeOutcome: cancels by lead time', () => {
  it.each([
    [100, 0, 0],
    [100, 5, 0],
    [48, 0, 0],
    [48, 5, -1],
    [10, 0, -1],
    [10, 5, -2],
    [1, 0, -2],
    [1, 5, -3],
  ])('%sh before, %s people affected → %s', (hours, affected, grade) => {
    expect(gradeOutcome(cancel(hours, affected))).toBe(grade);
  });

  it('an excused cancel grades 0', () => {
    expect(gradeOutcome(cancel(1, 5), true)).toBe(0);
  });
});

describe('hostStanding', () => {
  it('starts a host with no history at a neutral score, as New', () => {
    const s = hostStanding('h', [], NOW);
    expect(s.score).toBe(0);
    expect(s.tier).toBe('new');
  });

  it('one great event cannot make a host Trusted (the prior)', () => {
    const s = hostStanding('h', [ran(9, { returning: 3 })], NOW);
    expect(s.score).toBeLessThan(1.2);
    expect(s.tier).toBe('new');
  });

  it('a host whose events keep ending empty becomes Limited', () => {
    const empties = [3, 10, 17, 24, 31, 38].map((d) => ran(0, { startsAt: daysAgo(d) }));
    const s = hostStanding('h', empties, NOW);
    expect(s.tier).toBe('limited');
    expect(s.emptyRecent).toBe(6);
  });

  it('posting a lot is fine when people come', () => {
    const many = Array.from({ length: 20 }, (_, i) => ran(9, { startsAt: daysAgo(i + 1) }));
    expect(hostStanding('h', many, NOW).tier).toBe('trusted');
  });

  it('three late cancels with people going make a host Low, whatever the rest', () => {
    const good = [5, 6, 7, 8, 9].map((d) => ran(10, { startsAt: daysAgo(d) }));
    const late = [10, 20, 30].map((d) => {
      const start = NOW.getTime() - d * DAY;
      return { ...ran(0), startsAt: iso(start), cancelledAt: iso(start - 2 * H), affected: 6 };
    });
    const s = hostStanding('h', [...good, ...late], NOW);
    expect(s.lateCancels).toBe(3);
    expect(s.tier).toBe('low');
  });

  it('excuses cancels for a bad forecast every time, illness only once per 60 days', () => {
    const at = (d: number, reason: EventOutcome['cancelReason'], forecastBad = false) => {
      const start = NOW.getTime() - d * DAY;
      return { ...ran(0), startsAt: iso(start), cancelledAt: iso(start - 3 * H), affected: 8, cancelReason: reason, forecastBad };
    };
    const weather = hostStanding('h', [at(5, 'weather', true), at(12, 'weather', true), at(19, 'weather', true)], NOW);
    expect(weather.lateCancels).toBe(0);
    const ill = hostStanding('h', [at(5, 'illness'), at(12, 'illness')], NOW);
    expect(ill.lateCancels).toBe(1); // the second "illness" counts
    // "weather" without a bad forecast is not an excuse
    expect(hostStanding('h', [at(5, 'weather', false)], NOW).lateCancels).toBe(1);
  });

  it('old history fades: the same bad month weighs less a year later', () => {
    const bad = [1, 2, 3, 4].map((d) => ran(0, { startsAt: daysAgo(d) }));
    const good = [1, 2, 3, 4].map((d) => ran(9, { startsAt: daysAgo(d) }));
    const recentBad = hostStanding('h', [...bad.map((o) => ({ ...o, startsAt: daysAgo(10) })), ...good.map((o) => ({ ...o, startsAt: daysAgo(300) }))], NOW);
    const oldBad = hostStanding('h', [...bad.map((o) => ({ ...o, startsAt: daysAgo(300) })), ...good.map((o) => ({ ...o, startsAt: daysAgo(10) }))], NOW);
    expect(oldBad.score).toBeGreaterThan(recentBad.score);
    expect(oldBad.tier).not.toBe('limited');
  });

  it('ignores other hosts and events still to come', () => {
    const s = hostStanding('h', [ran(0, { hostId: 'other' }), ran(0, { startsAt: iso(NOW.getTime() + DAY) })], NOW);
    expect(s.graded).toBe(0);
  });
});

describe('tierOf hysteresis', () => {
  const at = (score: number, prev?: HostTier) => tierOf({ score, graded: 10, lateCancels: 0 }, prev);
  it('needs a clear margin to change tier', () => {
    expect(at(1.0)).toBe('normal');
    expect(at(1.0, 'trusted')).toBe('trusted'); // stays down to 0.9
    expect(at(0.8, 'trusted')).toBe('normal');
    expect(at(1.3, 'normal')).toBe('normal'); // needs 1.5 to rise
    expect(at(-0.1, 'limited')).toBe('limited'); // needs 0.0 to get back to normal
    expect(at(0.05, 'limited')).toBe('normal');
    expect(at(-0.4, 'normal')).toBe('normal'); // falls only below -0.6
  });
});

const ev = (id: string, host: string, hour: number, extra: Partial<EventItem> = {}): EventItem => ({
  id,
  title: id,
  description: '',
  category: 'community',
  tags: [],
  venueName: `venue-${id}`,
  address: '',
  city: 'tirana',
  neighborhood: 'qendra',
  startsAt: iso(NOW.getTime() + hour * H),
  priceType: 'free',
  source: 'organizer',
  status: 'published',
  isSponsored: false,
  organizer: { id: host, name: host.toUpperCase(), verified: false },
  goingUserIds: [],
  ...extra,
});

describe('feed arrangement', () => {
  const tiers: Record<string, HostTier> = { good: 'normal', star: 'trusted', meh: 'limited', bad: 'low', fresh: 'new' };
  const tier = (e: EventItem) => tiers[e.organizer.id];

  it('keeps time order, with Limited then Low hosts at the end', () => {
    const items = [ev('a', 'bad', 1), ev('b', 'meh', 2), ev('c', 'good', 3), ev('d', 'star', 4)];
    expect(arrangeSection(items, tier).items.map((e) => e.id)).toEqual(['c', 'd', 'b', 'a']);
  });

  it('a friend going keeps the event in its place', () => {
    const items = [ev('a', 'bad', 1), ev('c', 'good', 3)];
    expect(arrangeSection(items, tier, (e) => e.id === 'a').items.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('caps each host per section and folds the rest', () => {
    const items = [1, 2, 3, 4, 5].map((h) => ev(`y${h}`, 'star', h)).concat([ev('z', 'good', 6)]);
    const { items: shown, folded } = arrangeSection(items, tier);
    expect(shown.filter((e) => e.organizer.id === 'star')).toHaveLength(HOST_CAP.trusted);
    expect(folded).toEqual([{ hostId: 'star', hostName: 'STAR', events: [items[3], items[4]] }]);
    expect(arrangeSection([ev('n1', 'fresh', 1), ev('n2', 'fresh', 2)], tier).items).toHaveLength(1);
  });

  it('drops near-copies: same host, same venue, within two hours', () => {
    const a = ev('a', 'good', 1, { venueName: 'Bar' });
    const b = ev('b', 'good', 2, { venueName: 'bar ' });
    const c = ev('c', 'good', 5, { venueName: 'Bar' });
    expect(dedupeHostEvents([a, b, c]).map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('rails: Low hosts leave, Limited go last', () => {
    const items = [ev('a', 'bad', 1), ev('b', 'meh', 2), ev('c', 'good', 3)];
    expect(arrangeRail(items, tier).map((e) => e.id)).toEqual(['c', 'b']);
  });

  it('platform events rank like Trusted; unknown venues start Normal, unknown organizers New', () => {
    expect(eventTier(ev('p', 'x', 1, { source: 'platform' }), {})).toBe('trusted');
    expect(eventTier(ev('v', 'x', 1, { source: 'curated' }), {})).toBe('normal');
    expect(eventTier(ev('o', 'x', 1), {})).toBe('new');
  });
});

describe('outcomeOf', () => {
  it('grades an event only once it has ended or was cancelled, and never private or platform ones', () => {
    const past = ev('p', 'h', -5, { goingUserIds: ['u1', 'u2'], capacity: 4 });
    expect(outcomeOf(past, NOW)).toMatchObject({ hostId: 'h', joined: 2, capacity: 4 });
    expect(outcomeOf(ev('f', 'h', 5), NOW)).toBeNull();
    expect(outcomeOf({ ...past, visibility: 'private' }, NOW)).toBeNull();
    expect(outcomeOf({ ...past, source: 'platform' }, NOW)).toBeNull();
    const c = outcomeOf(ev('c', 'h', 5, { status: 'cancelled', cancelledAt: iso(NOW.getTime()), goingUserIds: ['u1'] }), NOW);
    expect(c).toMatchObject({ affected: 1, cancelledAt: iso(NOW.getTime()) });
  });
});

describe('anti-gaming', () => {
  const j = (userId: string, extra: Partial<Parameters<typeof countJoiners>[0][number]> = {}) => ({
    userId,
    verifiedPhone: true,
    otherEvents: 2,
    accountAgeDays: 90,
    ...extra,
  });

  it('does not count sockpuppets, the host, duplicates or last-second joins before a cancel', () => {
    const joiners = [
      j('real'),
      j('real'),
      j('host'),
      j('nophone', { verifiedPhone: false }),
      j('fresh', { otherEvents: 0, accountAgeDays: 2 }),
      j('weekOld', { otherEvents: 0, accountAgeDays: 8 }),
      j('lastSecond', { minutesBeforeCancel: 4 }),
    ];
    expect(countJoiners(joiners, 'host')).toBe(2); // real, weekOld
  });

  it('counts at most three of the host’s regulars', () => {
    const regulars = new Set(['r1', 'r2', 'r3', 'r4', 'r5']);
    expect(countJoiners([...regulars].map((id) => j(id)).concat(j('other')), 'host', regulars)).toBe(4);
  });

  it('finds regulars: people at 80%+ of the host’s events', () => {
    expect(regularsOf([['a', 'b'], ['a', 'b'], ['a', 'c'], ['a', 'b'], ['a', 'b']])).toEqual(new Set(['a', 'b']));
    expect(regularsOf([['a'], ['a']])).toEqual(new Set()); // too few events to tell
  });

  it('sends new, Low and often-rejected hosts through review', () => {
    expect(mustReview(undefined, 0)).toBe(true);
    expect(mustReview({ tier: 'new', graded: 1 }, 0)).toBe(true);
    expect(mustReview({ tier: 'low', graded: 6 }, 0)).toBe(true);
    expect(mustReview({ tier: 'trusted', graded: 9 }, 3)).toBe(true);
    expect(mustReview({ tier: 'normal', graded: 5 }, 0)).toBe(false);
  });

  it('holds back a brand-new host’s flood after five events', () => {
    expect(heldAsFlood(undefined, 4)).toBe(false);
    expect(heldAsFlood(undefined, 5)).toBe(true);
    expect(heldAsFlood({ graded: 1 }, 9)).toBe(false);
  });
});

describe('demo history', () => {
  it('puts the demo hosts in every tier', () => {
    const s = standingsFor(hostHistory(NOW), NOW);
    expect(s.o1.tier).toBe('trusted');
    expect(s.o4.tier).toBe('trusted');
    expect(s.o26.tier).toBe('normal');
    expect(s.o28.tier).toBe('limited');
    expect(s.o7.tier).toBe('low');
    expect(s.o33).toBeUndefined(); // new
  });
});
