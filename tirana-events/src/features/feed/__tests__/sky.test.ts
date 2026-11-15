import { latenessOf, skyStops } from '../sky';

describe('latenessOf', () => {
  it('runs from morning (0) to late night (1)', () => {
    expect(latenessOf(new Date(2026, 10, 18, 7))).toBe(0);
    expect(latenessOf(new Date(2026, 10, 18, 15))).toBeCloseTo(0.5);
    expect(latenessOf(new Date(2026, 10, 18, 23))).toBe(1);
    expect(latenessOf(new Date(2026, 10, 18, 1))).toBe(1);
  });
});

describe('skyStops', () => {
  it('starts at now, follows rows, then eases back; offsets strictly increase', () => {
    const stops = skyStops(0.2, [
      { center: 1400, lateness: 0.9 },
      { center: 1000, lateness: 0.5 },
      { center: 1000, lateness: 0.6 }, // same spot: dropped
    ], 800);
    expect(stops[0]).toEqual({ at: 0, lateness: 0.2 });
    expect(stops.slice(1, 3)).toEqual([
      { at: 600, lateness: 0.5 },
      { at: 1000, lateness: 0.9 },
    ]);
    expect(stops[stops.length - 1].lateness).toBe(0.2);
    for (let i = 1; i < stops.length; i++) expect(stops[i].at).toBeGreaterThan(stops[i - 1].at);
  });
  it('never makes the sky earlier than now', () => {
    expect(skyStops(0.7, [{ center: 900, lateness: 0.3 }], 800)[1].lateness).toBe(0.7);
  });
});
