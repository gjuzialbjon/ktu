import { CAN_PICK_CITY, CITIES, CITY_ORDER, DEFAULT_CITY, LIVE_CITIES, areaName, cityName, isCityId, isLiveCity } from '@ktu/shared';

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

describe('live cities', () => {
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
