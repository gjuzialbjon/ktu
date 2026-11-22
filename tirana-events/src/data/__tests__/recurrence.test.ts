import { editionTitle, nextDate, nextEditions, nextRollAt, startSeries } from '../recurrence';
import type { EventItem } from '../types';

const base = (over: Partial<EventItem> = {}): EventItem => ({
  id: 'y1',
  title: 'Yoga #3',
  description: '',
  category: 'outdoors',
  tags: ['yoga'],
  venueName: 'Liqeni',
  address: 'Liqeni',
  city: 'tirana',
  neighborhood: 'liqeni',
  startsAt: new Date(2026, 10, 20, 18, 0).toISOString(),
  endsAt: new Date(2026, 10, 20, 19, 30).toISOString(),
  priceType: 'free',
  source: 'organizer',
  status: 'published',
  isSponsored: false,
  organizer: { id: 'o', name: 'O', verified: false },
  goingUserIds: ['u1', 'u2'],
  series: { id: 'yoga', repeat: 'weekly', edition: 3, baseTitle: 'Yoga' },
  ...over,
});

describe('nextDate', () => {
  it('adds a week, two weeks, or a month at the same local time', () => {
    const iso = new Date(2026, 0, 10, 18, 30).toISOString();
    expect(nextDate(iso, 'weekly')).toEqual(new Date(2026, 0, 17, 18, 30));
    expect(nextDate(iso, 'biweekly')).toEqual(new Date(2026, 0, 24, 18, 30));
    expect(nextDate(iso, 'monthly')).toEqual(new Date(2026, 1, 10, 18, 30));
  });
  it('keeps month-end dates inside the next month', () => {
    expect(nextDate(new Date(2026, 0, 31, 20).toISOString(), 'monthly')).toEqual(new Date(2026, 1, 28, 20));
  });
});

describe('startSeries', () => {
  it('numbers the first edition', () => {
    expect(startSeries('s', 'Run club', 'weekly')).toEqual({
      title: 'Run club #1',
      series: { id: 's', repeat: 'weekly', edition: 1, baseTitle: 'Run club' },
    });
  });
});

describe('nextEditions', () => {
  it('adds nothing while the latest edition is still ahead', () => {
    expect(nextEditions([base()], new Date(2026, 10, 20, 17, 59))).toEqual([]);
  });

  it('creates the next edition as soon as the latest one starts', () => {
    const [next] = nextEditions([base()], new Date(2026, 10, 20, 18, 0));
    expect(next.id).toBe('yoga-n4');
    expect(next.title).toBe(editionTitle('Yoga', 4));
    expect(next.series?.edition).toBe(4);
    expect(new Date(next.startsAt)).toEqual(new Date(2026, 10, 27, 18, 0));
    expect(new Date(next.endsAt!)).toEqual(new Date(2026, 10, 27, 19, 30));
    // a new evening: nobody going yet
    expect(next.goingUserIds).toEqual([]);
  });

  it('only looks at the latest edition of a series', () => {
    const old = base({ id: 'y0', series: { id: 'yoga', repeat: 'weekly', edition: 2, baseTitle: 'Yoga' }, startsAt: new Date(2026, 10, 13, 18).toISOString() });
    const latest = base({ startsAt: new Date(2026, 10, 27, 18).toISOString(), series: { id: 'yoga', repeat: 'weekly', edition: 4, baseTitle: 'Yoga' } });
    expect(nextEditions([old, latest], new Date(2026, 10, 21))).toEqual([]);
  });

  it('catches up after a long gap, counting the editions that happened meanwhile', () => {
    const [next] = nextEditions([base()], new Date(2026, 11, 5, 12, 0));
    // 20 Nov (#3) → 27 Nov (#4) → 4 Dec (#5) → 11 Dec (#6), the first one still ahead
    expect(next.series?.edition).toBe(6);
    expect(new Date(next.startsAt)).toEqual(new Date(2026, 11, 11, 18, 0));
  });

  it('ignores one-off events', () => {
    expect(nextEditions([base({ series: undefined })], new Date(2027, 0, 1))).toEqual([]);
  });
});

describe('nextRollAt', () => {
  it('is the earliest upcoming latest edition', () => {
    const a = base();
    const b = base({ id: 'b', startsAt: new Date(2026, 10, 19, 9).toISOString(), series: { id: 'b', repeat: 'monthly', edition: 1, baseTitle: 'B' } });
    expect(nextRollAt([a, b], new Date(2026, 10, 18))).toBe(new Date(2026, 10, 19, 9).getTime());
    expect(nextRollAt([a, b], new Date(2026, 10, 21))).toBeNull();
  });
});
