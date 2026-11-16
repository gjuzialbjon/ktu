import { CITIES, CITY_ORDER, DEFAULT_CITY, areaName, cityName, isCityId } from '@/data/cities';
import { SEED_EVENTS } from '@/data/seed';
import { countThisWeekByCity } from '@/features/city/countByCity';
import { NOW, at, makeEvent } from '@/test-utils/fixtures';

describe('city data', () => {
  it('lists every city exactly once in the picker order, default first', () => {
    expect([...CITY_ORDER].sort()).toEqual(Object.keys(CITIES).sort());
    expect(CITY_ORDER[0]).toBe(DEFAULT_CITY);
  });

  it.each(CITY_ORDER)('%s has unique area ids, names in both languages and sane bounds', (id) => {
    const c = CITIES[id];
    const ids = c.areas.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of c.areas) expect(a.sq.trim() && a.en.trim()).toBeTruthy();
    expect(c.bounds.latMin).toBeLessThan(c.bounds.latMax);
    expect(c.bounds.lngMin).toBeLessThan(c.bounds.lngMax);
  });

  it('names areas per language and falls back to the id for unknown areas', () => {
    expect(areaName('tirana', 'liqeni', 'en')).toBe('Lake and park');
    expect(areaName('shkoder', 'liqeni', 'en')).toBe('The lake');
    expect(areaName('tirana', 'gone', 'sq')).toBe('gone');
    expect(cityName('durres', 'sq')).toBe('Durrësi');
    expect(isCityId('vlore')).toBe(true);
    expect(isCityId('paris')).toBe(false);
  });
});

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

describe('live cities', () => {
  const { CAN_PICK_CITY, CITIES, DEFAULT_CITY, LIVE_CITIES, isLiveCity } = jest.requireActual('../cities') as typeof import('../cities');
  it('only lists defined cities, and always includes the default', () => {
    for (const c of LIVE_CITIES) expect(CITIES[c]).toBeDefined();
    expect(isLiveCity(DEFAULT_CITY)).toBe(true);
  });
  it('shows a city choice only when more than one city is live', () => {
    expect(CAN_PICK_CITY).toBe(LIVE_CITIES.length > 1);
  });
  it('rejects unknown and switched-off cities', () => {
    expect(isLiveCity('atlantis')).toBe(false);
    for (const c of Object.keys(CITIES)) expect(isLiveCity(c)).toBe(LIVE_CITIES.includes(c as never));
  });
});
