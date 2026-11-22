import { pickToday, todayScore } from '../todayTop';
import type { EventItem } from '@/data/types';

const ev = (id: string, hour: number, likeCount = 0, edition?: number): EventItem =>
  ({
    id,
    title: id,
    startsAt: new Date(2026, 10, 21, hour).toISOString(),
    likeCount,
    series: edition ? { id, repeat: 'weekly', edition, baseTitle: id } : undefined,
  }) as EventItem;

describe('todayScore', () => {
  it('is likes plus a capped boost for each time a series ran before', () => {
    expect(todayScore(ev('a', 9, 10))).toBe(10);
    expect(todayScore(ev('a', 9, 10, 1))).toBe(10);
    expect(todayScore(ev('a', 9, 10, 5))).toBe(22);
    expect(todayScore(ev('a', 9, 10, 40))).toBe(40);
  });
});

describe('pickToday', () => {
  const day = [ev('early', 8, 2), ev('hit', 12, 60), ev('series', 18, 5, 9), ev('quiet', 20, 1), ev('late', 23, 30)];

  it('keeps everything when it fits', () => {
    expect(pickToday(day, 5)).toBe(day);
  });

  it('picks the favourites and shows them in time order', () => {
    // hit 60, late 30, series 5 + 8×3 = 29
    expect(pickToday(day, 3).map((e) => e.id)).toEqual(['hit', 'series', 'late']);
  });

  it('always keeps your own plans', () => {
    expect(pickToday(day, 2, new Set(['quiet'])).map((e) => e.id)).toEqual(['hit', 'quiet']);
  });
});
