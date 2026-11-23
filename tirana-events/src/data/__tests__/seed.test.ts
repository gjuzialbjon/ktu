import { CITIES, CITY_ORDER, canSeeGoing, speaks, standingsFor } from '@ktu/shared';
import { NOW, at, makeEvent } from '@ktu/shared/testing';
import { SEED_EVENTS, SEED_PEOPLE } from '@/data/seed';
import { hostHistory } from '@/data/hostHistory';
import { countThisWeekByCity } from '@/features/city/countByCity';

/**
 * The app's own demo data, checked against the shared rules. The rules themselves are
 * tested in ../shared; these cases only make sense with the seed and demo history.
 */
describe('seed events', () => {
  it.each(SEED_EVENTS.map((e) => [e.id, e] as const))('%s sits in a real area of its city, inside the map', (_id, e) => {
    const c = CITIES[e.city];
    expect(c).toBeDefined();
    expect(c.areas.map((a) => a.id)).toContain(e.neighborhood);
    if (e.lat != null && e.lng != null) {
      expect(e.lat).toBeGreaterThanOrEqual(c.bounds.latMin);
      expect(e.lat).toBeLessThanOrEqual(c.bounds.latMax);
      expect(e.lng).toBeGreaterThanOrEqual(c.bounds.lngMin);
      expect(e.lng).toBeLessThanOrEqual(c.bounds.lngMax);
    }
  });

  it('gives every city at least one event to show', () => {
    const covered = new Set(SEED_EVENTS.map((e) => e.city));
    expect(CITY_ORDER.filter((c) => !covered.has(c))).toEqual([]);
  });

  it('has the English-friendly events in the seed as data, not as a hashtag', () => {
    expect(SEED_EVENTS.some((e) => e.tags.includes('english-friendly'))).toBe(false);
    expect(SEED_EVENTS.filter((e) => speaks(e, 'en')).length).toBeGreaterThanOrEqual(3);
  });
});

describe('countThisWeekByCity', () => {
  it('counts this week per city, with a zero for every other city', () => {
    const counts = countThisWeekByCity(
      [makeEvent(), makeEvent({ city: 'vlore' }), makeEvent({ city: 'vlore', startsAt: at(20, 12) })],
      NOW,
    );
    expect(counts.tirana).toBe(1);
    expect(counts.vlore).toBe(1);
    expect(counts.berat).toBe(0);
    expect(Object.keys(counts)).toHaveLength(CITY_ORDER.length);
  });
});

describe('demo host history', () => {
  it('puts the demo hosts in every tier', () => {
    const s = standingsFor(hostHistory(NOW), NOW);
    expect(s.o1?.tier).toBe('trusted');
    expect(s.o4?.tier).toBe('trusted');
    expect(s.o26?.tier).toBe('normal');
    expect(s.o28?.tier).toBe('limited');
    expect(s.o7?.tier).toBe('low');
    expect(s.o33).toBeUndefined(); // new
  });
});

describe('who you see going (each person chose)', () => {
  const shown = SEED_PEOPLE.filter((p) => canSeeGoing(p.showGoing, { followedByGoer: !!p.followsYou })).map((p) => p.id);
  it('names people who share with everyone, or with you because they follow you', () => {
    expect(shown).toEqual(expect.arrayContaining(['u1', 'u2', 'u3', 'u7']));
  });
  it('never names someone who did not choose, or who shares only with people they follow', () => {
    expect(shown).not.toContain('u4');
    expect(shown).not.toContain('u6');
  });
});
